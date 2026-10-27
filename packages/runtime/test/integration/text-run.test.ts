import type { LanguageModelV4, LanguageModelV4CallOptions, LanguageModelV4StreamPart } from '@ai-sdk/provider'
import { describe, expect, it } from 'vitest'
import {
  createRuntime,
  type ConversationSendInput,
  type RuntimeProviderRegistrationV1,
  type RuntimeSnapshot,
} from '../../src/index'
import { streamFromParts, textStopParts } from '../fixtures/v4/text-stop'

const requestResponseCanary = 'task-5-request-response-canary'

function createRegistration(
  callOptions: LanguageModelV4CallOptions[],
  capabilities = { streaming: true, reasoning: false },
  streamParts: ReadonlyArray<LanguageModelV4StreamPart> = textStopParts,
): RuntimeProviderRegistrationV1 {
  const model: LanguageModelV4 = {
    specificationVersion: 'v4',
    provider: 'fake-provider',
    modelId: 'model-1',
    supportedUrls: {},
    doGenerate: () => {
      throw new Error('doGenerate must not be called')
    },
    doStream: (options) => {
      callOptions.push(options)
      return Promise.resolve({
        stream: streamFromParts(streamParts),
        request: { body: { secret: requestResponseCanary } },
        response: { headers: { 'x-secret': requestResponseCanary } },
      })
    },
  }

  return {
    providerId: 'provider-1',
    models: {
      'model-1': {
        capabilities,
      },
    },
    createProvider: () => ({
      specificationVersion: 'v4',
      languageModel: () => model,
    }),
  }
}

function completedRunShape(snapshot: RuntimeSnapshot, conversationId: string) {
  const conversation = snapshot.conversationsById[conversationId]!
  const turn = snapshot.turnsById[conversation.turnIds[0]!]!
  const run = snapshot.runsById[turn.runIds[0]!]!
  const step = snapshot.stepsById[run.stepIds[0]!]!
  const inputMessages = run.inputMessageIds.map((messageId) => snapshot.messagesById[messageId]!)
  const outputMessages = run.outputMessageIds.map((messageId) => snapshot.messagesById[messageId]!)

  return {
    run: {
      status: run.status,
      providerId: run.providerId,
      modelId: run.modelId,
      capabilities: run.capabilities,
      termination: run.termination,
      usage: run.usage,
      stepCount: run.stepIds.length,
      inputMessageCount: run.inputMessageIds.length,
      outputMessageCount: run.outputMessageIds.length,
    },
    step: { kind: step.kind, status: step.status },
    inputMessages: inputMessages.map((message) => ({
      role: message.role,
      hasProducingRun: message.runId !== undefined,
      contents: message.partIds.map((partId) => snapshot.partsById[partId]?.content),
      statuses: message.partIds.map((partId) => snapshot.partsById[partId]?.status),
    })),
    outputMessages: outputMessages.map((message) => ({
      role: message.role,
      hasProducingRun: message.runId !== undefined,
      contents: message.partIds.map((partId) => snapshot.partsById[partId]?.content),
      statuses: message.partIds.map((partId) => snapshot.partsById[partId]?.status),
    })),
  }
}

describe('first vertical text Run', () => {
  it('creates Runtime-owned Conversations and exposes one completed text Run only through Snapshot updates', async () => {
    const callOptions: LanguageModelV4CallOptions[] = []
    const registration = createRegistration(callOptions)
    const runtime = createRuntime({
      resolveProvider: (providerId) => (providerId === registration.providerId ? registration : undefined),
    })
    const observed: RuntimeSnapshot[] = []
    const unsubscribe = runtime.subscribe((snapshot) => observed.push(snapshot))

    const conversation = runtime.createConversation()
    const untouchedConversation = runtime.createConversation()

    expect(conversation.id).not.toBe(untouchedConversation.id)
    expect(Object.keys(conversation).sort()).toEqual(['id', 'send'])
    expect(runtime.getSnapshot().conversationsById[conversation.id]).toEqual({
      id: conversation.id,
      turnIds: [],
    })
    expect(runtime.getSnapshot().conversationsById[untouchedConversation.id]).toEqual({
      id: untouchedConversation.id,
      turnIds: [],
    })

    await conversation.send({
      providerId: 'provider-1',
      modelId: 'model-1',
      content: 'Hello Runtime',
    })

    const finalSnapshot = runtime.getSnapshot()
    expect(completedRunShape(finalSnapshot, conversation.id)).toEqual({
      run: {
        status: 'completed',
        providerId: 'provider-1',
        modelId: 'model-1',
        capabilities: { streaming: true, reasoning: false },
        termination: 'stop',
        usage: {
          inputTokens: 12,
          outputTokens: 7,
          reasoningTokens: 2,
          cacheReadTokens: 3,
          cacheWriteTokens: 1,
        },
        stepCount: 1,
        inputMessageCount: 1,
        outputMessageCount: 1,
      },
      step: { kind: 'model', status: 'completed' },
      inputMessages: [{ role: 'user', hasProducingRun: false, contents: ['Hello Runtime'], statuses: ['completed'] }],
      outputMessages: [
        {
          role: 'assistant',
          hasProducingRun: true,
          contents: [' first \nlast', 'second\nline'],
          statuses: ['completed', 'completed'],
        },
      ],
    })
    expect(finalSnapshot.conversationsById[untouchedConversation.id]?.turnIds).toEqual([])
    expect(observed.at(-1)).toBe(finalSnapshot)
    expect(new Set(observed).size).toBe(observed.length)
    expect(JSON.stringify({ observed, finalSnapshot })).not.toContain(requestResponseCanary)
    expect(callOptions).toHaveLength(1)
    expect(Object.keys(callOptions[0]!).sort()).toEqual(['abortSignal', 'prompt'])
    expect(callOptions[0]?.prompt).toEqual([{ role: 'user', content: [{ type: 'text', text: 'Hello Runtime' }] }])

    unsubscribe()
    const observedCount = observed.length
    runtime.createConversation()
    expect(observed).toHaveLength(observedCount)
  })

  it('prevents consumers from mutating the published Snapshot', () => {
    const runtime = createRuntime({ resolveProvider: () => undefined })
    const conversation = runtime.createConversation()
    const snapshot = runtime.getSnapshot()
    const publishedConversation = snapshot.conversationsById[conversation.id]!

    expect(() => (publishedConversation.turnIds as string[]).push('forged-turn')).toThrow(TypeError)
    expect(() => {
      ;(snapshot.conversationsById as Record<string, unknown>)['forged-conversation'] = {
        id: 'forged-conversation',
        turnIds: [],
      }
    }).toThrow(TypeError)
    expect(runtime.getSnapshot()).toBe(snapshot)
    expect(runtime.getSnapshot().conversationsById[conversation.id]?.turnIds).toEqual([])
    expect(runtime.getSnapshot().conversationsById['forged-conversation']).toBeUndefined()
  })

  it('routes Conversation.send and direct dispatch through equivalent text Run behavior', async () => {
    const callOptions: LanguageModelV4CallOptions[] = []
    const registration = createRegistration(callOptions, { streaming: true, reasoning: true })
    const runtime = createRuntime({ resolveProvider: () => registration })
    const throughFacade = runtime.createConversation()
    const throughDispatch = runtime.createConversation()

    await throughFacade.send({
      providerId: 'provider-1',
      modelId: 'model-1',
      content: 'same input',
    })
    await runtime.dispatch({
      type: 'send',
      conversationId: throughDispatch.id,
      providerId: 'provider-1',
      modelId: 'model-1',
      content: 'same input',
    })

    expect(completedRunShape(runtime.getSnapshot(), throughFacade.id)).toEqual(
      completedRunShape(runtime.getSnapshot(), throughDispatch.id),
    )
    expect(callOptions.map((options) => options.prompt)).toEqual([
      [{ role: 'user', content: [{ type: 'text', text: 'same input' }] }],
      [{ role: 'user', content: [{ type: 'text', text: 'same input' }] }],
    ])
    expect(callOptions.map((options) => Object.keys(options).sort())).toEqual([
      ['abortSignal', 'prompt'],
      ['abortSignal', 'prompt'],
    ])
  })

  it('projects interleaved V4 reasoning and text into ordered subscriber Snapshots', async () => {
    const callOptions: LanguageModelV4CallOptions[] = []
    const parts = [
      { type: 'stream-start', warnings: [] },
      { type: 'reasoning-start', id: 'provider-reasoning-id' },
      { type: 'reasoning-delta', id: 'provider-reasoning-id', delta: ' first thought ' },
      { type: 'text-start', id: 'provider-text-id' },
      { type: 'text-delta', id: 'provider-text-id', delta: 'final ' },
      { type: 'reasoning-delta', id: 'provider-reasoning-id', delta: '\nsecond thought' },
      { type: 'text-delta', id: 'provider-text-id', delta: 'answer' },
      { type: 'reasoning-end', id: 'provider-reasoning-id' },
      { type: 'text-end', id: 'provider-text-id' },
      textStopParts.at(-1)!,
    ] satisfies ReadonlyArray<LanguageModelV4StreamPart>
    const registration = createRegistration(callOptions, { streaming: false, reasoning: false }, parts)
    const runtime = createRuntime({ resolveProvider: () => registration })
    const conversation = runtime.createConversation()
    const observedAssistantParts: Array<ReadonlyArray<{ kind: string; content?: string; status?: string }>> = []
    runtime.subscribe((snapshot) => {
      const run = Object.values(snapshot.runsById)[0]
      const assistant = run?.outputMessageIds
        .map((messageId) => snapshot.messagesById[messageId])
        .find((message) => message?.role === 'assistant')
      if (assistant !== undefined) {
        observedAssistantParts.push(
          assistant.partIds.map((partId) => {
            const part = snapshot.partsById[partId]!
            return { kind: part.kind, content: part.content, status: part.status }
          }),
        )
      }
    })

    await conversation.send({ providerId: 'provider-1', modelId: 'model-1', content: 'think' })

    const snapshot = runtime.getSnapshot()
    const run = Object.values(snapshot.runsById)[0]!
    const assistant = run.outputMessageIds
      .map((messageId) => snapshot.messagesById[messageId]!)
      .find((message) => message.role === 'assistant')!
    const assistantParts = assistant.partIds.map((partId) => snapshot.partsById[partId]!)

    expect(assistantParts.map(({ kind, content, status }) => ({ kind, content, status }))).toEqual([
      { kind: 'reasoning', content: ' first thought \nsecond thought', status: 'completed' },
      { kind: 'text', content: 'final answer', status: 'completed' },
    ])
    expect(observedAssistantParts).toContainEqual([
      { kind: 'reasoning', content: ' first thought ', status: 'streaming' },
      { kind: 'text', content: 'final ', status: 'streaming' },
    ])
    expect(observedAssistantParts).toContainEqual([
      { kind: 'reasoning', content: ' first thought \nsecond thought', status: 'streaming' },
      { kind: 'text', content: 'final ', status: 'streaming' },
    ])
    expect(observedAssistantParts).toContainEqual([
      { kind: 'reasoning', content: ' first thought \nsecond thought', status: 'streaming' },
      { kind: 'text', content: 'final answer', status: 'streaming' },
    ])
    expect(new Set(assistantParts.map((part) => part.id)).size).toBe(assistantParts.length)
    expect(assistantParts.every((part) => !part.id.includes('provider'))).toBe(true)
    expect(JSON.stringify(snapshot)).not.toContain('provider-reasoning-id')
  })

  it('isolates reused Provider part IDs across Runs', async () => {
    const parts = [
      { type: 'stream-start', warnings: [] },
      { type: 'reasoning-start', id: 'shared-reasoning-provider-id' },
      { type: 'reasoning-delta', id: 'shared-reasoning-provider-id', delta: 'thought' },
      { type: 'reasoning-end', id: 'shared-reasoning-provider-id' },
      { type: 'text-start', id: 'shared-text-provider-id' },
      { type: 'text-delta', id: 'shared-text-provider-id', delta: 'answer' },
      { type: 'text-end', id: 'shared-text-provider-id' },
      textStopParts.at(-1)!,
    ] satisfies ReadonlyArray<LanguageModelV4StreamPart>
    const registration = createRegistration([], undefined, parts)
    const runtime = createRuntime({ resolveProvider: () => registration })
    const conversations = [runtime.createConversation(), runtime.createConversation()]

    for (const conversation of conversations) {
      await conversation.send({ providerId: 'provider-1', modelId: 'model-1', content: 'same IDs' })
    }

    const snapshot = runtime.getSnapshot()
    const partIdsByRun = Object.values(snapshot.runsById).map((run) => {
      const assistant = run.outputMessageIds
        .map((messageId) => snapshot.messagesById[messageId]!)
        .find((message) => message.role === 'assistant')!
      return assistant.partIds
    })

    expect(partIdsByRun).toHaveLength(2)
    expect(partIdsByRun[0]).toHaveLength(2)
    expect(partIdsByRun[1]).toHaveLength(2)
    expect(partIdsByRun[0]).not.toEqual(partIdsByRun[1])
    expect(new Set(partIdsByRun.flat()).size).toBe(4)
    expect(partIdsByRun.flat().every((partId) => !partId.includes('provider-id'))).toBe(true)
  })

  it('inspects every V4 stream part before ignored parts are projected out by the Guard', async () => {
    const callOptions: LanguageModelV4CallOptions[] = []
    const ignoredPart = { type: 'custom', kind: 'fake.trace' } as const
    const parts = [
      textStopParts[0]!,
      ignoredPart,
      ...textStopParts.slice(1),
    ] satisfies ReadonlyArray<LanguageModelV4StreamPart>
    const registration = createRegistration(callOptions, { streaming: true, reasoning: false }, parts)
    const inspected: Array<{
      runId: string
      stepId: string
      providerId: string
      modelId: string
      part: LanguageModelV4StreamPart
    }> = []
    const runtime = createRuntime({
      resolveProvider: () => registration,
      inspect: {
        streamPart: (inspection) => inspected.push(inspection),
      },
    })
    const conversation = runtime.createConversation()

    await conversation.send({ providerId: 'provider-1', modelId: 'model-1', content: 'inspect' })

    const snapshot = runtime.getSnapshot()
    const run = Object.values(snapshot.runsById)[0]!
    const stepId = run.stepIds[0]!
    expect(inspected).toHaveLength(parts.length)
    expect(inspected.map(({ part }) => part)).toEqual(parts)
    expect(inspected.find(({ part }) => part === ignoredPart)).toEqual({
      runId: run.id,
      stepId,
      providerId: 'provider-1',
      modelId: 'model-1',
      part: ignoredPart,
    })
    expect(JSON.stringify(snapshot)).not.toContain('fake.trace')
  })

  it('does not let inspector failures interrupt stream consumption', async () => {
    const registration = createRegistration([])
    let inspectedPartCount = 0
    const runtime = createRuntime({
      resolveProvider: () => registration,
      inspect: {
        streamPart: () => {
          inspectedPartCount += 1
          throw new Error('inspector failed')
        },
      },
    })
    const conversation = runtime.createConversation()

    await conversation.send({ providerId: 'provider-1', modelId: 'model-1', content: 'continue' })

    const run = Object.values(runtime.getSnapshot().runsById)[0]
    expect(inspectedPartCount).toBe(textStopParts.length)
    expect(run).toMatchObject({ status: 'completed', termination: 'stop' })
  })

  it('keeps Conversation.send bound to its Runtime-owned Conversation ID', async () => {
    const registration = createRegistration([])
    const runtime = createRuntime({ resolveProvider: () => registration })
    const boundConversation = runtime.createConversation()
    const attemptedOverride = runtime.createConversation()
    const untrustedInput = {
      providerId: 'provider-1',
      modelId: 'model-1',
      content: 'bound input',
      conversationId: attemptedOverride.id,
    } as ConversationSendInput

    await boundConversation.send(untrustedInput)

    expect(runtime.getSnapshot().conversationsById[boundConversation.id]?.turnIds).toHaveLength(1)
    expect(runtime.getSnapshot().conversationsById[attemptedOverride.id]?.turnIds).toEqual([])
  })

  it('rejects an unknown Conversation before resolving a Provider', async () => {
    let resolverCalls = 0
    const runtime = createRuntime({
      resolveProvider: () => {
        resolverCalls += 1
        return undefined
      },
    })

    await expect(
      runtime.dispatch({
        type: 'send',
        conversationId: 'caller-created-id',
        providerId: 'provider-1',
        modelId: 'model-1',
        content: 'must reject',
      }),
    ).rejects.toMatchObject({ code: 'runtime_conversation_missing' })
    expect(resolverCalls).toBe(0)
    expect(runtime.getSnapshot().turnsById).toEqual({})
  })

  it('rejects an abort when the Conversation has no active execution', async () => {
    const runtime = createRuntime({ resolveProvider: () => undefined })
    const conversation = runtime.createConversation()
    const snapshot = runtime.getSnapshot()

    await expect(runtime.abort(conversation.id)).rejects.toMatchObject({ code: 'runtime_active_run_missing' })
    expect(runtime.getSnapshot()).toBe(snapshot)
  })

  it('rejects remaining later-task methods without changing the Snapshot', async () => {
    const runtime = createRuntime({ resolveProvider: () => undefined })
    const conversation = runtime.createConversation()
    const snapshot = runtime.getSnapshot()
    const operations: ReadonlyArray<() => Promise<void>> = [
      () => runtime.retryLastRun({ conversationId: conversation.id }),
      () => runtime.regenerateLastResponse({ conversationId: conversation.id }),
      () => runtime.approveToolCall('tool-call-1'),
      () => runtime.denyToolCall('tool-call-1'),
    ]

    for (const operation of operations) {
      await expect(operation()).rejects.toMatchObject({ code: 'runtime_operation_not_implemented' })
      expect(runtime.getSnapshot()).toBe(snapshot)
    }
  })
})
