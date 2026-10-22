import type { LanguageModelV4StreamPart } from '@ai-sdk/provider'
import type { RuntimeDomainEvent } from '../domain/events'
import {
  ContentAssemblyViolation,
  ReasoningPartAssemblers,
  TextPartAssemblers,
  type ReasoningAssemblyViolationCode,
  type TextAssemblyViolationCode,
} from './assemblers'
import {
  normalizeProviderError,
  normalizeResponseMetadata,
  normalizeUsage,
  ResponseMetadataConflict,
  type NormalizedResponseMetadata,
  type RuntimeTokenUsage,
} from './normalization'

export type ModelStepIngressErrorCode =
  | TextAssemblyViolationCode
  | ReasoningAssemblyViolationCode
  | 'model_step_aborted'
  | 'model_step_finish_duplicate'
  | 'model_step_finish_missing'
  | 'model_step_finish_reason_unsupported'
  | 'model_step_part_after_finish'
  | 'model_step_part_id_allocation_failed'
  | 'model_step_provider_error'
  | 'model_step_response_metadata_conflict'
  | 'model_step_stream_read_failed'
  | 'model_step_stream_start_duplicate'
  | 'model_step_stream_start_missing'
  | 'model_step_stream_unavailable'
  | 'model_step_text_delta_invalid'
  | 'model_step_reasoning_delta_invalid'

export class ModelStepIngressError extends Error {
  readonly code: ModelStepIngressErrorCode

  constructor(code: ModelStepIngressErrorCode) {
    super(code)
    this.name = 'ModelStepIngressError'
    this.code = code
    this.stack = undefined
  }
}

class ModelStepProtocolViolation extends Error {
  readonly code: ModelStepIngressErrorCode

  constructor(code: ModelStepIngressErrorCode) {
    super(code)
    this.name = 'ModelStepProtocolViolation'
    this.code = code
    this.stack = undefined
  }
}

class ModelStepProviderFailure extends Error {
  readonly value: unknown

  constructor(value: unknown) {
    super('model_step_provider_error')
    this.name = 'ModelStepProviderFailure'
    this.value = value
    this.stack = undefined
  }
}

class ModelStepCallerAbort extends Error {
  constructor() {
    super('model_step_aborted')
    this.name = 'ModelStepCallerAbort'
    this.stack = undefined
  }
}

export interface ModelStepIngressInput {
  readonly runId: string
  readonly stepId: string
  readonly messageId: string
  readonly stream: ReadableStream<LanguageModelV4StreamPart>
  readonly abortSignal: AbortSignal
  readonly createPartId: () => string
  readonly emit: (event: RuntimeDomainEvent) => void
}

export interface ModelStepIngressResult {
  readonly terminal: Readonly<{
    readonly runStatus: 'active' | 'completed' | 'failed' | 'interrupted'
    readonly stepStatus: 'completed' | 'failed' | 'interrupted'
    readonly termination?: 'stop' | 'max_output_tokens' | 'content_filter' | 'tool_calls'
  }>
  readonly usage?: RuntimeTokenUsage
}

type ModelStepTerminalInput = Pick<ModelStepIngressInput, 'runId' | 'stepId' | 'abortSignal' | 'emit'>

function protocolViolation(code: ModelStepIngressErrorCode): never {
  throw new ModelStepProtocolViolation(code)
}

function callerAbort(): never {
  throw new ModelStepCallerAbort()
}

function createInterruptedEvent(input: ModelStepTerminalInput): RuntimeDomainEvent {
  return {
    type: 'run-terminated',
    runId: input.runId,
    stepId: input.stepId,
    runStatus: 'interrupted',
    stepStatus: 'interrupted',
  }
}

function createAbortedEvent(input: ModelStepTerminalInput): RuntimeDomainEvent {
  return {
    type: 'run-terminated',
    runId: input.runId,
    stepId: input.stepId,
    runStatus: 'aborted',
    stepStatus: 'aborted',
    error: normalizeProviderError(undefined, 'caller-abort'),
  }
}

function createFailedEvent(input: ModelStepTerminalInput, value: unknown): RuntimeDomainEvent {
  return {
    type: 'run-terminated',
    runId: input.runId,
    stepId: input.stepId,
    runStatus: 'failed',
    stepStatus: 'failed',
    error: normalizeProviderError(value, 'provider-error'),
  }
}

function createRunTerminalEvent(input: ModelStepTerminalInput, result: ModelStepIngressResult): RuntimeDomainEvent {
  const termination = result.terminal.termination
  return {
    type: 'run-terminated',
    runId: input.runId,
    stepId: input.stepId,
    runStatus: result.terminal.runStatus as 'completed' | 'failed' | 'interrupted',
    stepStatus: result.terminal.stepStatus,
    ...(termination === 'stop' || termination === 'max_output_tokens' || termination === 'content_filter'
      ? { termination }
      : {}),
    ...(result.usage === undefined ? {} : { usage: result.usage }),
  }
}

function createModelStepCompletedEvent(
  input: ModelStepTerminalInput,
  result: ModelStepIngressResult,
): RuntimeDomainEvent {
  return {
    type: 'model-step-completed',
    runId: input.runId,
    stepId: input.stepId,
    termination: 'tool_calls',
    ...(result.usage === undefined ? {} : { usage: result.usage }),
  }
}

function allocatePartId(input: ModelStepIngressInput): string {
  try {
    return input.createPartId()
  } catch {
    return protocolViolation('model_step_part_id_allocation_failed')
  }
}

/** Emits the canonical terminal when model invocation fails before a readable stream is available. */
export function terminateModelStepBeforeStream(input: ModelStepTerminalInput): never {
  if (input.abortSignal.aborted) {
    input.emit(createAbortedEvent(input))
    throw new ModelStepIngressError('model_step_aborted')
  }

  input.emit(createInterruptedEvent(input))
  throw new ModelStepIngressError('model_step_stream_unavailable')
}

/** Consumes one constructed V4 text/reasoning stream and emits only normalized Runtime facts. */
export async function consumeModelStepStream(input: ModelStepIngressInput): Promise<ModelStepIngressResult> {
  let reader: ReadableStreamDefaultReader<LanguageModelV4StreamPart>
  try {
    reader = input.stream.getReader()
  } catch {
    return terminateModelStepBeforeStream(input)
  }

  const runtimePartIds = new Set<string>()
  const textParts = new TextPartAssemblers(runtimePartIds)
  const reasoningParts = new ReasoningPartAssemblers(runtimePartIds)
  let metadata: NormalizedResponseMetadata = {}
  let streamStarted = false
  let pendingResult: ModelStepIngressResult | undefined
  let terminalEmitted = false
  const cancelForAbort = () => {
    void reader.cancel().catch(() => undefined)
  }
  input.abortSignal.addEventListener('abort', cancelForAbort, { once: true })

  try {
    while (true) {
      if (input.abortSignal.aborted) callerAbort()

      let readResult: ReadableStreamReadResult<LanguageModelV4StreamPart>
      try {
        readResult = await reader.read()
      } catch {
        if (input.abortSignal.aborted) callerAbort()
        protocolViolation('model_step_stream_read_failed')
      }

      if (input.abortSignal.aborted) callerAbort()

      if (readResult.done) {
        if (!streamStarted) protocolViolation('model_step_stream_start_missing')
        if (pendingResult === undefined) protocolViolation('model_step_finish_missing')

        terminalEmitted = true
        input.emit(
          pendingResult.terminal.runStatus === 'active'
            ? createModelStepCompletedEvent(input, pendingResult)
            : createRunTerminalEvent(input, pendingResult),
        )
        return pendingResult
      }

      const part = readResult.value
      if (pendingResult !== undefined) {
        protocolViolation(part.type === 'finish' ? 'model_step_finish_duplicate' : 'model_step_part_after_finish')
      }

      if (!streamStarted) {
        if (part.type !== 'stream-start') {
          if (part.type === 'error') throw new ModelStepProviderFailure(part.error)
          if (
            part.type === 'response-metadata' ||
            part.type === 'text-start' ||
            part.type === 'text-delta' ||
            part.type === 'text-end' ||
            part.type === 'reasoning-start' ||
            part.type === 'reasoning-delta' ||
            part.type === 'reasoning-end' ||
            part.type === 'finish'
          ) {
            protocolViolation('model_step_stream_start_missing')
          }
          continue
        }
        streamStarted = true
        continue
      }

      switch (part.type) {
        case 'stream-start':
          protocolViolation('model_step_stream_start_duplicate')
        case 'response-metadata':
          try {
            metadata = normalizeResponseMetadata(metadata, part)
          } catch (error) {
            if (error instanceof ResponseMetadataConflict) protocolViolation('model_step_response_metadata_conflict')
            throw error
          }
          break
        case 'text-start': {
          const runtimePartId = textParts.start(part.id, () => allocatePartId(input))
          input.emit({
            type: 'text-part-started',
            runId: input.runId,
            messageId: input.messageId,
            partId: runtimePartId,
          })
          break
        }
        case 'text-delta': {
          if (typeof part.delta !== 'string') protocolViolation('model_step_text_delta_invalid')
          const runtimePartId = textParts.append(part.id)
          input.emit({ type: 'text-part-delta', runId: input.runId, partId: runtimePartId, delta: part.delta })
          break
        }
        case 'text-end': {
          const runtimePartId = textParts.end(part.id)
          input.emit({ type: 'text-part-ended', runId: input.runId, partId: runtimePartId })
          break
        }
        case 'reasoning-start': {
          const runtimePartId = reasoningParts.start(part.id, () => allocatePartId(input))
          input.emit({
            type: 'reasoning-part-started',
            runId: input.runId,
            messageId: input.messageId,
            partId: runtimePartId,
          })
          break
        }
        case 'reasoning-delta': {
          if (typeof part.delta !== 'string') protocolViolation('model_step_reasoning_delta_invalid')
          const runtimePartId = reasoningParts.append(part.id)
          input.emit({ type: 'reasoning-part-delta', runId: input.runId, partId: runtimePartId, delta: part.delta })
          break
        }
        case 'reasoning-end': {
          const runtimePartId = reasoningParts.end(part.id)
          input.emit({ type: 'reasoning-part-ended', runId: input.runId, partId: runtimePartId })
          break
        }
        case 'finish': {
          textParts.assertClosed()
          reasoningParts.assertClosed()
          const usage = normalizeUsage(part.usage)
          switch (part.finishReason.unified) {
            case 'stop':
              pendingResult = {
                terminal: { runStatus: 'completed', stepStatus: 'completed', termination: 'stop' },
                ...(usage === undefined ? {} : { usage }),
              }
              break
            case 'length':
              pendingResult = {
                terminal: { runStatus: 'completed', stepStatus: 'completed', termination: 'max_output_tokens' },
                ...(usage === undefined ? {} : { usage }),
              }
              break
            case 'content-filter':
              pendingResult = {
                terminal: { runStatus: 'completed', stepStatus: 'completed', termination: 'content_filter' },
                ...(usage === undefined ? {} : { usage }),
              }
              break
            case 'tool-calls':
              pendingResult = {
                terminal: { runStatus: 'active', stepStatus: 'completed', termination: 'tool_calls' },
                ...(usage === undefined ? {} : { usage }),
              }
              break
            case 'error':
              throw new ModelStepProviderFailure(undefined)
            case 'other':
              pendingResult = {
                terminal: { runStatus: 'interrupted', stepStatus: 'interrupted' },
                ...(usage === undefined ? {} : { usage }),
              }
              break
            default:
              protocolViolation('model_step_finish_reason_unsupported')
          }
          break
        }
        case 'raw':
          break
        case 'error':
          throw new ModelStepProviderFailure(part.error)
        default:
          break
      }
    }
  } catch (error) {
    const aborted = input.abortSignal.aborted || error instanceof ModelStepCallerAbort
    const providerFailure = error instanceof ModelStepProviderFailure
    const code = aborted
      ? 'model_step_aborted'
      : providerFailure
        ? 'model_step_provider_error'
        : error instanceof ModelStepProtocolViolation || error instanceof ContentAssemblyViolation
          ? error.code
          : 'model_step_stream_read_failed'

    try {
      await reader.cancel()
    } catch {
      // Cancellation failures are transport details and must not replace the stable ingress error.
    }
    if (!terminalEmitted) {
      terminalEmitted = true
      input.emit(
        aborted
          ? createAbortedEvent(input)
          : providerFailure
            ? createFailedEvent(input, error.value)
            : createInterruptedEvent(input),
      )
    }
    throw new ModelStepIngressError(code)
  } finally {
    input.abortSignal.removeEventListener('abort', cancelForAbort)
    reader.releaseLock()
  }
}
