import type { LanguageModelV4, LanguageModelV4StreamPart } from '@ai-sdk/provider'
import { consumeModelStepStream, terminateModelStepBeforeStream } from '../boundary/ingressGuard'
import type { SendCommand } from '../commands/types'
import type { RuntimeDomainEvent } from '../domain/events'
import type { RuntimeSnapshot } from '../domain/types'
import type {
  RuntimeLanguageProviderV4,
  RuntimeModelCapabilitiesV1,
  RuntimeModelDescriptorV1,
  RuntimeProviderRegistrationV1,
} from '../model/types'
import { inspectStream } from './inspectStream'
import { buildModelCallOptions } from './modelCallProjection'

export type RuntimeIdKind = 'conversation' | 'turn' | 'run' | 'step' | 'message' | 'part'

export interface TextRunCoordinatorInput {
  readonly command: SendCommand
  readonly resolveProvider: (providerId: string) => RuntimeProviderRegistrationV1 | undefined
  readonly getSnapshot: () => RuntimeSnapshot
  readonly emit: (event: RuntimeDomainEvent) => void
  readonly createId: (kind: RuntimeIdKind) => string
  readonly abortSignal: AbortSignal
  readonly inspectStreamPart?: (inspection: {
    readonly runId: string
    readonly stepId: string
    readonly providerId: string
    readonly modelId: string
    readonly part: LanguageModelV4StreamPart
  }) => void
}

export class RuntimeExecutionError extends Error {
  readonly code: string

  constructor(code: string) {
    super(code)
    this.name = 'RuntimeExecutionError'
    this.code = code
    this.stack = undefined
  }
}

function reject(code: string): never {
  throw new RuntimeExecutionError(code)
}

function copyCapabilities(descriptor: RuntimeModelDescriptorV1): RuntimeModelCapabilitiesV1 {
  const capabilities = descriptor?.capabilities
  if (
    capabilities === undefined ||
    typeof capabilities.streaming !== 'boolean' ||
    typeof capabilities.reasoning !== 'boolean'
  ) {
    return reject('runtime_model_descriptor_invalid')
  }

  return {
    streaming: capabilities.streaming,
    reasoning: capabilities.reasoning,
  }
}

function validateProvider(provider: RuntimeLanguageProviderV4): void {
  if (
    provider === null ||
    (typeof provider !== 'object' && typeof provider !== 'function') ||
    provider.specificationVersion !== 'v4' ||
    typeof provider.languageModel !== 'function'
  ) {
    reject('runtime_provider_v4_invalid')
  }
}

function validateModel(model: LanguageModelV4, modelId: string): void {
  if (
    model === null ||
    typeof model !== 'object' ||
    model.specificationVersion !== 'v4' ||
    typeof model.doStream !== 'function'
  ) {
    reject('runtime_model_v4_invalid')
  }
  if (model.modelId !== modelId) {
    reject('runtime_model_id_mismatch')
  }
}

/** Executes the currently supported single-Model-Step text/reasoning Run. */
export async function executeTextRun(input: TextRunCoordinatorInput): Promise<void> {
  const { command } = input
  if (input.getSnapshot().conversationsById[command.conversationId] === undefined) {
    reject('runtime_conversation_missing')
  }

  let registration: RuntimeProviderRegistrationV1 | undefined
  let descriptor: RuntimeModelDescriptorV1 | undefined
  let provider: RuntimeLanguageProviderV4 | undefined
  let model: LanguageModelV4 | undefined

  try {
    registration = input.resolveProvider(command.providerId)
    if (registration === undefined) {
      reject('runtime_provider_missing')
    }
    if (registration.providerId !== command.providerId) {
      reject('runtime_provider_id_mismatch')
    }

    descriptor = registration.models[command.modelId]
    if (descriptor === undefined) {
      reject('runtime_model_missing')
    }
    const capabilities = copyCapabilities(descriptor)
    provider = registration.createProvider()
    validateProvider(provider)
    model = provider.languageModel(command.modelId)
    validateModel(model, command.modelId)

    const turnId = input.createId('turn')
    const runId = input.createId('run')
    const userMessageId = input.createId('message')
    const userPartId = input.createId('part')
    const stepId = input.createId('step')
    const assistantMessageId = input.createId('message')

    input.emit({
      type: 'turn-created',
      conversationId: command.conversationId,
      turnId,
    })
    input.emit({
      type: 'turn-input-message-created',
      turnId,
      messageId: userMessageId,
      partId: userPartId,
      role: 'user',
      content: command.content,
    })
    input.emit({
      type: 'run-created',
      conversationId: command.conversationId,
      turnId,
      runId,
      inputMessageIds: [userMessageId],
      providerId: command.providerId,
      modelId: command.modelId,
      capabilities,
    })
    const callOptions = buildModelCallOptions({
      snapshot: input.getSnapshot(),
      runId,
      abortSignal: input.abortSignal,
    })

    input.emit({ type: 'step-started', runId, stepId, kind: 'model' })
    input.emit({
      type: 'run-output-message-created',
      runId,
      turnId,
      messageId: assistantMessageId,
      role: 'assistant',
    })

    let stream: ReadableStream<LanguageModelV4StreamPart>
    try {
      stream = (await model.doStream(callOptions)).stream
    } catch {
      terminateModelStepBeforeStream({
        runId,
        stepId,
        abortSignal: input.abortSignal,
        emit: input.emit,
      })
    }
    const inspectStreamPart = input.inspectStreamPart
    const inspectedStream =
      inspectStreamPart === undefined
        ? stream
        : inspectStream(stream, (part) =>
            inspectStreamPart({
              runId,
              stepId,
              providerId: command.providerId,
              modelId: command.modelId,
              part,
            }),
          )
    await consumeModelStepStream({
      runId,
      stepId,
      messageId: assistantMessageId,
      stream: inspectedStream,
      abortSignal: input.abortSignal,
      createPartId: () => input.createId('part'),
      emit: input.emit,
    })
  } finally {
    model = undefined
    provider = undefined
    descriptor = undefined
    registration = undefined
  }
}
