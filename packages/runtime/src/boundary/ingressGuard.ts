import type { LanguageModelV4StreamPart } from '@ai-sdk/provider'
import type { RuntimeDomainEvent } from '../domain/events'
import {
  ReasoningPartAssemblers,
  ContentAssemblyViolation,
  TextPartAssemblers,
  type ReasoningAssemblyViolationCode,
  type TextAssemblyViolationCode,
} from './assemblers'
import {
  normalizeResponseMetadata,
  normalizeUsage,
  ResponseMetadataConflict,
  type NormalizedResponseMetadata,
  type RuntimeTokenUsage,
} from './normalization'

export type ModelStepIngressErrorCode =
  | TextAssemblyViolationCode
  | ReasoningAssemblyViolationCode
  | 'model_step_finish_duplicate'
  | 'model_step_finish_missing'
  | 'model_step_finish_reason_unsupported'
  | 'model_step_part_after_finish'
  | 'model_step_part_id_allocation_failed'
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
    readonly runStatus: 'completed'
    readonly stepStatus: 'completed'
    readonly termination: 'stop'
  }>
  readonly usage?: RuntimeTokenUsage
}

function protocolViolation(code: ModelStepIngressErrorCode): never {
  throw new ModelStepProtocolViolation(code)
}

function createInterruptedEvent(input: ModelStepIngressInput): RuntimeDomainEvent {
  return {
    type: 'run-terminated',
    runId: input.runId,
    stepId: input.stepId,
    runStatus: 'interrupted',
    stepStatus: 'interrupted',
  }
}

function createCompletedEvent(input: ModelStepIngressInput, usage: RuntimeTokenUsage | undefined): RuntimeDomainEvent {
  return {
    type: 'run-terminated',
    runId: input.runId,
    stepId: input.stepId,
    runStatus: 'completed',
    stepStatus: 'completed',
    termination: 'stop',
    ...(usage === undefined ? {} : { usage }),
  }
}

function allocatePartId(input: ModelStepIngressInput): string {
  try {
    return input.createPartId()
  } catch {
    return protocolViolation('model_step_part_id_allocation_failed')
  }
}

/** Consumes one constructed V4 text/reasoning stream and emits only normalized Runtime facts. */
export async function consumeModelStepStream(input: ModelStepIngressInput): Promise<ModelStepIngressResult> {
  let reader: ReadableStreamDefaultReader<LanguageModelV4StreamPart>
  try {
    reader = input.stream.getReader()
  } catch {
    input.emit(createInterruptedEvent(input))
    throw new ModelStepIngressError('model_step_stream_unavailable')
  }
  const runtimePartIds = new Set<string>()
  const textParts = new TextPartAssemblers(runtimePartIds)
  const reasoningParts = new ReasoningPartAssemblers(runtimePartIds)
  let metadata: NormalizedResponseMetadata = {}
  let streamStarted = false
  let pendingResult: ModelStepIngressResult | undefined
  let terminalEmitted = false

  try {
    while (true) {
      let readResult: ReadableStreamReadResult<LanguageModelV4StreamPart>
      try {
        readResult = await reader.read()
      } catch {
        protocolViolation('model_step_stream_read_failed')
      }

      if (readResult.done) {
        if (!streamStarted) {
          protocolViolation('model_step_stream_start_missing')
        }
        if (pendingResult === undefined) {
          protocolViolation('model_step_finish_missing')
        }

        terminalEmitted = true
        input.emit(createCompletedEvent(input, pendingResult.usage))
        return pendingResult
      }

      const part = readResult.value
      if (pendingResult !== undefined) {
        protocolViolation(part.type === 'finish' ? 'model_step_finish_duplicate' : 'model_step_part_after_finish')
      }

      if (!streamStarted) {
        if (part.type !== 'stream-start') {
          if (part.type === 'error') {
            protocolViolation('model_step_stream_read_failed')
          }
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
            if (error instanceof ResponseMetadataConflict) {
              protocolViolation('model_step_response_metadata_conflict')
            }
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
          if (typeof part.delta !== 'string') {
            protocolViolation('model_step_text_delta_invalid')
          }
          const runtimePartId = textParts.append(part.id)
          input.emit({
            type: 'text-part-delta',
            runId: input.runId,
            partId: runtimePartId,
            delta: part.delta,
          })
          break
        }
        case 'text-end': {
          const runtimePartId = textParts.end(part.id)
          input.emit({
            type: 'text-part-ended',
            runId: input.runId,
            partId: runtimePartId,
          })
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
          if (typeof part.delta !== 'string') {
            protocolViolation('model_step_reasoning_delta_invalid')
          }
          const runtimePartId = reasoningParts.append(part.id)
          input.emit({
            type: 'reasoning-part-delta',
            runId: input.runId,
            partId: runtimePartId,
            delta: part.delta,
          })
          break
        }
        case 'reasoning-end': {
          const runtimePartId = reasoningParts.end(part.id)
          input.emit({
            type: 'reasoning-part-ended',
            runId: input.runId,
            partId: runtimePartId,
          })
          break
        }
        case 'finish': {
          textParts.assertClosed()
          reasoningParts.assertClosed()
          if (part.finishReason.unified !== 'stop') {
            protocolViolation('model_step_finish_reason_unsupported')
          }
          const usage = normalizeUsage(part.usage)
          pendingResult = {
            terminal: {
              runStatus: 'completed',
              stepStatus: 'completed',
              termination: 'stop',
            },
            ...(usage === undefined ? {} : { usage }),
          }
          break
        }
        case 'raw':
          break
        case 'error':
          protocolViolation('model_step_stream_read_failed')
        default:
          break
      }
    }
  } catch (error) {
    const code =
      error instanceof ModelStepProtocolViolation || error instanceof ContentAssemblyViolation
        ? error.code
        : 'model_step_stream_read_failed'

    try {
      await reader.cancel()
    } catch {
      // Cancellation failures are transport details and must not replace the stable ingress error.
    }
    if (!terminalEmitted) {
      terminalEmitted = true
      input.emit(createInterruptedEvent(input))
    }
    throw new ModelStepIngressError(code)
  } finally {
    reader.releaseLock()
  }
}
