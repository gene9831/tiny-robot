import type { LanguageModelV4, LanguageModelV4CallOptions, LanguageModelV4StreamPart } from '@ai-sdk/provider'
import { describe, expect, it } from 'vitest'
import { ModelStepIngressError } from '../../src/boundary/ingressGuard'
import type { RuntimeDomainEvent } from '../../src/domain/events'
import { createRuntimeSnapshot, reduceRuntimeEvent } from '../../src/domain/reducer'
import { executeTextRun } from '../../src/execution/runCoordinator'
import {
  createRuntime,
  type RuntimeProviderRegistrationV1,
  type RuntimeSnapshot,
  type SendCommand,
} from '../../src/index'
import { streamFromParts, textStopParts } from '../fixtures/v4/text-stop'

interface CallCounts {
  createProvider: number
  languageModel: number
  doStream: number
  doGenerate: number
}

interface FakeRegistrationOptions {
  readonly providerId?: string
  readonly modelId?: string
  readonly returnedModelId?: string
  readonly capabilities?: { streaming: boolean; reasoning: boolean }
  readonly providerSpecificationVersion?: 'v4' | 'v3'
  readonly modelSpecificationVersion?: 'v4' | 'v3'
  readonly streamParts?: ReadonlyArray<LanguageModelV4StreamPart>
  readonly beforeStreamResult?: () => Promise<void>
  readonly canary?: string
  readonly onStream?: (stream: ReadableStream<LanguageModelV4StreamPart>) => void
  readonly callableProvider?: boolean
}

function createFakeRegistration(options: FakeRegistrationOptions = {}) {
  const providerId = options.providerId ?? 'provider-1'
  const modelId = options.modelId ?? 'model-1'
  const counts: CallCounts = { createProvider: 0, languageModel: 0, doStream: 0, doGenerate: 0 }
  const receivedOptions: LanguageModelV4CallOptions[] = []
  const providerCanary = { secret: options.canary ?? 'provider-object-canary' }
  const modelCanary = { secret: options.canary ?? 'model-object-canary' }
  const capabilities = options.capabilities ?? { streaming: true, reasoning: false }

  const model = {
    specificationVersion: options.modelSpecificationVersion ?? 'v4',
    provider: 'fake-provider',
    modelId: options.returnedModelId ?? modelId,
    supportedUrls: {},
    providerCanary: modelCanary,
    doGenerate: () => {
      counts.doGenerate += 1
      throw new Error('doGenerate must not be called')
    },
    doStream: async (callOptions: LanguageModelV4CallOptions) => {
      counts.doStream += 1
      receivedOptions.push(callOptions)
      await options.beforeStreamResult?.()
      const stream = streamFromParts(options.streamParts ?? textStopParts)
      options.onStream?.(stream)
      return {
        stream,
        request: { body: { secret: options.canary } },
        response: { headers: { 'x-secret': options.canary } },
      }
    },
  } as unknown as LanguageModelV4

  const createLanguageModel = (requestedModelId: string) => {
    counts.languageModel += 1
    expect(requestedModelId).toBe(modelId)
    return model
  }
  const provider = options.callableProvider
    ? Object.assign((requestedModelId: string) => createLanguageModel(requestedModelId), {
        specificationVersion: options.providerSpecificationVersion ?? ('v4' as const),
        languageModel: createLanguageModel,
      })
    : {
        specificationVersion: options.providerSpecificationVersion ?? ('v4' as const),
        languageModel: createLanguageModel,
      }

  const registration = {
    providerId,
    models: { [modelId]: { capabilities } },
    createProvider: () => {
      counts.createProvider += 1
      return Object.assign(provider, { providerCanary })
    },
  } as unknown as RuntimeProviderRegistrationV1

  return { registration, counts, receivedOptions, providerCanary, modelCanary, capabilities }
}

function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}

function createCommand(conversationId: string): SendCommand {
  return {
    type: 'send',
    conversationId,
    providerId: 'provider-1',
    modelId: 'model-1',
    content: 'lifecycle input',
  }
}

function createCoordinatorHarness(resolveProvider: (providerId: string) => RuntimeProviderRegistrationV1 | undefined) {
  let snapshot = createRuntimeSnapshot()
  const events: RuntimeDomainEvent[] = []
  let idCounter = 0
  const emit = (event: RuntimeDomainEvent) => {
    events.push(event)
    snapshot = reduceRuntimeEvent(snapshot, event)
  }
  emit({ type: 'conversation-created', conversationId: 'conversation-1' })

  return {
    events,
    get snapshot(): RuntimeSnapshot {
      return snapshot
    },
    execute: () =>
      executeTextRun({
        command: createCommand('conversation-1'),
        resolveProvider,
        getSnapshot: () => snapshot,
        emit,
        createId: (kind) => `${kind}-${++idCounter}`,
      }),
  }
}

describe('Run-local resolver and model factory lifetime', () => {
  it('accepts the callable ProviderV4 shape returned by maintained AI SDK creators', async () => {
    const fake = createFakeRegistration({ callableProvider: true })
    const runtime = createRuntime({ resolveProvider: () => fake.registration })
    const conversation = runtime.createConversation()

    await conversation.send({ providerId: 'provider-1', modelId: 'model-1', content: 'callable provider' })

    expect(fake.counts).toEqual({ createProvider: 1, languageModel: 1, doStream: 1, doGenerate: 0 })
  })

  it('uses registrations added, replaced, or removed after Runtime creation only for later Runs', async () => {
    const registrations = new Map<string, RuntimeProviderRegistrationV1>()
    let resolverCalls = 0
    const runtime = createRuntime({
      resolveProvider: (providerId) => {
        resolverCalls += 1
        return registrations.get(providerId)
      },
    })
    const firstConversation = runtime.createConversation()
    const firstResultGate = deferred()
    const first = createFakeRegistration({ beforeStreamResult: () => firstResultGate.promise })
    registrations.set('provider-1', first.registration)

    const firstSend = firstConversation.send({
      providerId: 'provider-1',
      modelId: 'model-1',
      content: 'first',
    })
    await Promise.resolve()
    expect(first.counts).toMatchObject({ createProvider: 1, languageModel: 1, doStream: 1 })

    const replacement = createFakeRegistration()
    registrations.set('provider-1', replacement.registration)
    firstResultGate.resolve()
    await firstSend

    const firstSnapshot = runtime.getSnapshot()
    const firstRun = Object.values(firstSnapshot.runsById)[0]!
    expect(firstRun.capabilities).toEqual({ streaming: true, reasoning: false })
    expect(firstRun.capabilities).not.toBe(first.capabilities)
    expect(first.counts).toEqual({ createProvider: 1, languageModel: 1, doStream: 1, doGenerate: 0 })
    expect(replacement.counts).toEqual({ createProvider: 0, languageModel: 0, doStream: 0, doGenerate: 0 })

    const secondConversation = runtime.createConversation()
    await secondConversation.send({ providerId: 'provider-1', modelId: 'model-1', content: 'second' })
    expect(replacement.counts).toEqual({ createProvider: 1, languageModel: 1, doStream: 1, doGenerate: 0 })

    registrations.delete('provider-1')
    const thirdConversation = runtime.createConversation()
    await expect(
      thirdConversation.send({ providerId: 'provider-1', modelId: 'model-1', content: 'third' }),
    ).rejects.toMatchObject({ code: 'runtime_provider_missing' })
    expect(resolverCalls).toBe(3)
    expect(replacement.counts).toEqual({ createProvider: 1, languageModel: 1, doStream: 1, doGenerate: 0 })
  })

  it.each([
    ['missing Provider', undefined, 'runtime_provider_missing'],
    [
      'registration ID mismatch',
      createFakeRegistration({ providerId: 'other-provider' }).registration,
      'runtime_provider_id_mismatch',
    ],
    ['missing model descriptor', { ...createFakeRegistration().registration, models: {} }, 'runtime_model_missing'],
    [
      'malformed descriptor',
      { ...createFakeRegistration().registration, models: { 'model-1': { capabilities: { streaming: 'yes' } } } },
      'runtime_model_descriptor_invalid',
    ],
  ] as const)('rejects %s before Provider creation', async (_label, registration, code) => {
    let resolverCalls = 0
    let factoryCalls = 0
    const registrationWithCount =
      registration === undefined
        ? undefined
        : ({
            ...registration,
            createProvider: () => {
              factoryCalls += 1
              return registration.createProvider()
            },
          } as RuntimeProviderRegistrationV1)
    const runtime = createRuntime({
      resolveProvider: () => {
        resolverCalls += 1
        return registrationWithCount
      },
    })
    const conversation = runtime.createConversation()

    await expect(
      conversation.send({ providerId: 'provider-1', modelId: 'model-1', content: 'reject' }),
    ).rejects.toMatchObject({ code })
    expect(resolverCalls).toBe(1)
    expect(factoryCalls).toBe(0)
    expect(runtime.getSnapshot().turnsById).toEqual({})
  })

  it('treats capability declarations as frozen metadata rather than a factory gate', async () => {
    const fake = createFakeRegistration({ capabilities: { streaming: false, reasoning: false } })
    const runtime = createRuntime({ resolveProvider: () => fake.registration })
    const conversation = runtime.createConversation()

    await conversation.send({ providerId: 'provider-1', modelId: 'model-1', content: 'metadata only' })

    expect(fake.counts).toEqual({ createProvider: 1, languageModel: 1, doStream: 1, doGenerate: 0 })
    expect(Object.values(runtime.getSnapshot().runsById)[0]?.capabilities).toEqual({
      streaming: false,
      reasoning: false,
    })
  })

  it.each([
    ['Provider specification mismatch', { providerSpecificationVersion: 'v3' }, 'runtime_provider_v4_invalid', 1, 0],
    ['model specification mismatch', { modelSpecificationVersion: 'v3' }, 'runtime_model_v4_invalid', 1, 1],
    ['model ID mismatch', { returnedModelId: 'different-model' }, 'runtime_model_id_mismatch', 1, 1],
  ] as const)(
    'rejects %s at the earliest factory boundary',
    async (_label, options, code, createProviderCalls, languageModelCalls) => {
      const fake = createFakeRegistration(options)
      const runtime = createRuntime({ resolveProvider: () => fake.registration })
      const conversation = runtime.createConversation()

      await expect(
        conversation.send({ providerId: 'provider-1', modelId: 'model-1', content: 'reject' }),
      ).rejects.toMatchObject({ code })
      expect(fake.counts.createProvider).toBe(createProviderCalls)
      expect(fake.counts.languageModel).toBe(languageModelCalls)
      expect(fake.counts.doStream).toBe(0)
    },
  )

  it('keeps Provider, model, request, and response objects outside Domain Events and Snapshot', async () => {
    const canary = 'task-5-boundary-canary'
    let guardedStream: ReadableStream<LanguageModelV4StreamPart> | undefined
    let readerCalls = 0
    const fake = createFakeRegistration({
      canary,
      onStream: (stream) => {
        guardedStream = stream
        const getReader = stream.getReader.bind(stream)
        stream.getReader = (() => {
          readerCalls += 1
          return getReader()
        }) as typeof stream.getReader
      },
    })
    const harness = createCoordinatorHarness(() => fake.registration)

    await harness.execute()

    expect(guardedStream).toBeDefined()
    expect(readerCalls).toBe(1)
    expect(fake.counts).toEqual({ createProvider: 1, languageModel: 1, doStream: 1, doGenerate: 0 })
    expect(Object.keys(fake.receivedOptions[0]!).sort()).toEqual(['abortSignal', 'prompt'])
    expect(JSON.stringify({ events: harness.events, snapshot: harness.snapshot })).not.toContain(canary)
    expect(JSON.stringify(harness.snapshot)).not.toContain('providerCanary')

    const rejected = createFakeRegistration({
      canary,
      streamParts: [
        { type: 'stream-start', warnings: [] },
        { type: 'text-delta', id: 'unknown-provider-id', delta: 'unsafe ordering' },
      ],
    })
    const rejectedHarness = createCoordinatorHarness(() => rejected.registration)
    const error = await rejectedHarness.execute().catch((reason: unknown) => reason)

    expect(error).toMatchObject({ name: 'ModelStepIngressError', code: 'model_step_text_id_unknown' })
    expect(JSON.stringify(error)).not.toContain(canary)
    expect(JSON.stringify(rejectedHarness.events)).not.toContain(canary)
  })

  it('leaves the Guard as the only terminal emitter for completion and interruption', async () => {
    const completed = createFakeRegistration()
    const completedHarness = createCoordinatorHarness(() => completed.registration)

    await completedHarness.execute()
    expect(completedHarness.events.filter((event) => event.type === 'run-terminated')).toEqual([
      expect.objectContaining({ runStatus: 'completed', stepStatus: 'completed', termination: 'stop' }),
    ])

    const interrupted = createFakeRegistration({
      streamParts: [
        { type: 'stream-start', warnings: [] },
        { type: 'text-delta', id: 'unknown-provider-id', delta: 'unsafe ordering' },
      ],
    })
    const interruptedHarness = createCoordinatorHarness(() => interrupted.registration)

    await expect(interruptedHarness.execute()).rejects.toMatchObject({
      name: 'ModelStepIngressError',
      code: 'model_step_text_id_unknown',
    } satisfies Partial<ModelStepIngressError>)
    expect(interruptedHarness.events.filter((event) => event.type === 'run-terminated')).toEqual([
      expect.objectContaining({ runStatus: 'interrupted', stepStatus: 'interrupted' }),
    ])
  })
})
