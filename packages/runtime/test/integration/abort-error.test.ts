import type { LanguageModelV4, LanguageModelV4CallOptions, LanguageModelV4StreamPart } from '@ai-sdk/provider'
import { describe, expect, it } from 'vitest'
import { createRuntime, type RuntimeProviderRegistrationV1 } from '../../src/index'

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

function createRegistration(
  doStream: (options: LanguageModelV4CallOptions) => Promise<{ stream: ReadableStream<LanguageModelV4StreamPart> }>,
): RuntimeProviderRegistrationV1 {
  const model = {
    specificationVersion: 'v4',
    provider: 'fake-provider',
    modelId: 'model-1',
    supportedUrls: {},
    doGenerate: async () => {
      throw new Error('unused')
    },
    doStream,
  } as unknown as LanguageModelV4

  return {
    providerId: 'provider-1',
    models: { 'model-1': { capabilities: { streaming: true, reasoning: false } } },
    createProvider: () => ({
      specificationVersion: 'v4',
      languageModel: () => model,
    }),
  }
}

function activeRun(runtime: ReturnType<typeof createRuntime>) {
  return Object.values(runtime.getSnapshot().runsById)[0]!
}

describe('caller abort precedence', () => {
  it('interrupts a doStream exception without exposing its thrown value', async () => {
    const registration = createRegistration(async () => {
      throw new Error('do-stream-interruption-canary')
    })
    const runtime = createRuntime({ resolveProvider: () => registration })
    const conversation = runtime.createConversation()

    const caught = await conversation
      .send({ providerId: 'provider-1', modelId: 'model-1', content: 'exception' })
      .catch((error: unknown) => error)

    expect(caught).toMatchObject({ code: 'model_step_stream_unavailable', stack: undefined })
    expect(activeRun(runtime).status).toBe('interrupted')
    expect(JSON.stringify({ caught, snapshot: runtime.getSnapshot() })).not.toContain('do-stream-interruption-canary')
  })

  it('aborts a pending Provider stream with one sanitized terminal', async () => {
    const started = deferred<void>()
    const registration = createRegistration(async (options) => ({
      stream: new ReadableStream<LanguageModelV4StreamPart>({
        start(controller) {
          controller.enqueue({ type: 'stream-start', warnings: [] })
          started.resolve()
          options.abortSignal?.addEventListener('abort', () => controller.error(new Error('abort-canary')), {
            once: true,
          })
        },
      }),
    }))
    const runtime = createRuntime({ resolveProvider: () => registration })
    const conversation = runtime.createConversation()
    const observedStatuses: string[] = []
    runtime.subscribe((snapshot) => {
      const run = Object.values(snapshot.runsById)[0]
      if (run !== undefined) observedStatuses.push(run.status)
    })

    const send = conversation.send({ providerId: 'provider-1', modelId: 'model-1', content: 'abort' })
    await started.promise
    await runtime.abort(conversation.id)
    const caught = await send.catch((error: unknown) => error)

    expect(caught).toMatchObject({ code: 'model_step_aborted', stack: undefined })
    expect(activeRun(runtime)).toMatchObject({
      status: 'aborted',
      error: { category: 'aborted', code: 'caller_aborted', retryable: true },
    })
    expect(observedStatuses.filter((status) => status === 'aborted')).toHaveLength(1)
    expect(JSON.stringify({ caught, snapshot: runtime.getSnapshot() })).not.toContain('abort-canary')
  })

  it('lets caller abort beat a simultaneous stream exception', async () => {
    let streamController!: ReadableStreamDefaultController<LanguageModelV4StreamPart>
    const streamReady = deferred<void>()
    const registration = createRegistration(async () => ({
      stream: new ReadableStream<LanguageModelV4StreamPart>({
        start(controller) {
          streamController = controller
          controller.enqueue({ type: 'stream-start', warnings: [] })
          streamReady.resolve()
        },
      }),
    }))
    const runtime = createRuntime({ resolveProvider: () => registration })
    const conversation = runtime.createConversation()
    const send = conversation.send({ providerId: 'provider-1', modelId: 'model-1', content: 'race' })
    await streamReady.promise

    streamController.error(new Error('provider-exception-canary'))
    await runtime.abort(conversation.id)
    await expect(send).rejects.toMatchObject({ code: 'model_step_aborted' })

    expect(activeRun(runtime).status).toBe('aborted')
    expect(JSON.stringify(runtime.getSnapshot())).not.toContain('provider-exception-canary')
  })

  it('lets caller abort beat a simultaneous explicit Provider error', async () => {
    let streamController!: ReadableStreamDefaultController<LanguageModelV4StreamPart>
    const streamReady = deferred<void>()
    const registration = createRegistration(async () => ({
      stream: new ReadableStream<LanguageModelV4StreamPart>({
        start(controller) {
          streamController = controller
          controller.enqueue({ type: 'stream-start', warnings: [] })
          streamReady.resolve()
        },
      }),
    }))
    const runtime = createRuntime({ resolveProvider: () => registration })
    const conversation = runtime.createConversation()
    const send = conversation.send({ providerId: 'provider-1', modelId: 'model-1', content: 'race' })
    await streamReady.promise

    streamController.enqueue({ type: 'error', error: new Error('provider-error-race-canary') })
    await runtime.abort(conversation.id)
    await expect(send).rejects.toMatchObject({ code: 'model_step_aborted' })

    expect(activeRun(runtime).status).toBe('aborted')
    expect(JSON.stringify(runtime.getSnapshot())).not.toContain('provider-error-race-canary')
  })

  it('lets caller abort beat a simultaneous doStream rejection', async () => {
    const streamResult = deferred<{ stream: ReadableStream<LanguageModelV4StreamPart> }>()
    const registration = createRegistration(async () => streamResult.promise)
    const runtime = createRuntime({ resolveProvider: () => registration })
    const conversation = runtime.createConversation()
    const send = conversation.send({ providerId: 'provider-1', modelId: 'model-1', content: 'race' })
    await Promise.resolve()

    const abort = runtime.abort(conversation.id)
    streamResult.reject(new Error('do-stream-canary'))
    await abort
    await expect(send).rejects.toMatchObject({ code: 'model_step_aborted' })

    expect(activeRun(runtime).status).toBe('aborted')
    expect(JSON.stringify(runtime.getSnapshot())).not.toContain('do-stream-canary')
  })
})
