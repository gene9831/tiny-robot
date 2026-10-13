import type { LanguageModelV4StreamPart, LanguageModelV4Usage } from '@ai-sdk/provider'
import { describe, expect, it } from 'vitest'
import { expectTypeOf } from 'vitest'
import {
  consumeModelStepStream,
  type ModelStepIngressInput,
  type ModelStepIngressResult,
} from '../../src/boundary/ingressGuard'
import type { RuntimeDomainEvent } from '../../src/domain/events'
import { createRuntimeSnapshot, reduceRuntimeEvent } from '../../src/domain/reducer'
import { streamFromParts, textStopParts } from '../fixtures/v4/text-stop'

const capabilities = { streaming: true, reasoning: false } as const
type ExpectedIngressInputKey =
  'runId' | 'stepId' | 'messageId' | 'capabilities' | 'stream' | 'abortSignal' | 'createPartId' | 'emit'
type ExpectedIngressResultKey = 'terminal' | 'usage'

function createInput(parts: ReadonlyArray<LanguageModelV4StreamPart>, partIds = ['runtime-part-a', 'runtime-part-b']) {
  const events: RuntimeDomainEvent[] = []
  const availablePartIds = [...partIds]

  return {
    events,
    input: {
      runId: 'runtime-run-1',
      stepId: 'runtime-step-1',
      messageId: 'runtime-message-1',
      capabilities,
      stream: streamFromParts(parts),
      abortSignal: new AbortController().signal,
      createPartId: () => availablePartIds.shift() ?? 'unexpected-runtime-part',
      emit: (event: RuntimeDomainEvent) => events.push(event),
    },
  }
}

describe('minimal text Ingress Guard', () => {
  it('keeps the internal ingress input and result surfaces allowlisted', () => {
    expectTypeOf<keyof ModelStepIngressInput>().toEqualTypeOf<ExpectedIngressInputKey>()
    expectTypeOf<keyof ModelStepIngressResult>().toEqualTypeOf<ExpectedIngressResultKey>()
  })

  it('maps interleaved text IDs to Runtime Parts and preserves exact delta order', async () => {
    const { input, events } = createInput(textStopParts)

    const result = await consumeModelStepStream(input)

    expect(events).toEqual([
      {
        type: 'text-part-started',
        runId: 'runtime-run-1',
        messageId: 'runtime-message-1',
        partId: 'runtime-part-a',
      },
      { type: 'text-part-delta', runId: 'runtime-run-1', partId: 'runtime-part-a', delta: ' first ' },
      {
        type: 'text-part-started',
        runId: 'runtime-run-1',
        messageId: 'runtime-message-1',
        partId: 'runtime-part-b',
      },
      { type: 'text-part-delta', runId: 'runtime-run-1', partId: 'runtime-part-b', delta: 'second\nline' },
      { type: 'text-part-delta', runId: 'runtime-run-1', partId: 'runtime-part-a', delta: '\nlast' },
      { type: 'text-part-ended', runId: 'runtime-run-1', partId: 'runtime-part-b' },
      { type: 'text-part-ended', runId: 'runtime-run-1', partId: 'runtime-part-a' },
      {
        type: 'run-terminated',
        runId: 'runtime-run-1',
        stepId: 'runtime-step-1',
        runStatus: 'completed',
        stepStatus: 'completed',
        termination: 'stop',
        usage: {
          inputTokens: 12,
          outputTokens: 7,
          reasoningTokens: 2,
          cacheReadTokens: 3,
          cacheWriteTokens: 1,
        },
      },
    ])
    expect(result).toEqual({
      terminal: {
        runStatus: 'completed',
        stepStatus: 'completed',
        termination: 'stop',
      },
      usage: {
        inputTokens: 12,
        outputTokens: 7,
        reasoningTokens: 2,
        cacheReadTokens: 3,
        cacheWriteTokens: 1,
      },
    })

    const serializedBoundaryOutput = JSON.stringify({ events, result })
    expect(serializedBoundaryOutput).not.toContain('provider-text')
    expect(serializedBoundaryOutput).not.toContain('canary')
    expect(Object.keys(result)).toEqual(['terminal', 'usage'])

    const initialEvents: ReadonlyArray<RuntimeDomainEvent> = [
      { type: 'conversation-created', conversationId: 'runtime-conversation-1' },
      {
        type: 'turn-created',
        conversationId: 'runtime-conversation-1',
        turnId: 'runtime-turn-1',
      },
      {
        type: 'run-created',
        conversationId: 'runtime-conversation-1',
        turnId: 'runtime-turn-1',
        runId: 'runtime-run-1',
        providerId: 'runtime-provider-1',
        modelId: 'runtime-model-1',
        capabilities,
      },
      {
        type: 'step-started',
        runId: 'runtime-run-1',
        stepId: 'runtime-step-1',
        kind: 'model',
      },
      {
        type: 'message-created',
        runId: 'runtime-run-1',
        turnId: 'runtime-turn-1',
        messageId: 'runtime-message-1',
        role: 'assistant',
      },
    ]
    const activeSnapshot = initialEvents.reduce(reduceRuntimeEvent, createRuntimeSnapshot())
    const completedSnapshot = events.reduce(reduceRuntimeEvent, activeSnapshot)

    expect(completedSnapshot.partsById['runtime-part-a']?.content).toBe(' first \nlast')
    expect(completedSnapshot.partsById['runtime-part-b']?.content).toBe('second\nline')
    expect(completedSnapshot.runsById['runtime-run-1']).toMatchObject({
      status: 'completed',
      termination: 'stop',
      usage: result.usage,
    })
  })

  it('drops raw parts and unavailable metadata while preserving valid zero usage', async () => {
    const usage = {
      inputTokens: {
        total: -1,
        noCache: undefined,
        cacheRead: Number.POSITIVE_INFINITY,
        cacheWrite: 1.5,
      },
      outputTokens: {
        total: 0,
        text: undefined,
        reasoning: Number.MAX_SAFE_INTEGER + 1,
      },
      raw: { secret: 'raw-usage-canary' },
    } satisfies LanguageModelV4Usage
    const invalidMetadata = {
      type: 'response-metadata',
      id: `x${'a'.repeat(128)}`,
      modelId: 'model id with spaces',
      timestamp: new Date(Number.NaN),
    } as const
    const validMetadata = {
      type: 'response-metadata',
      id: 'response-valid',
      modelId: 'model/valid',
      timestamp: new Date(0),
    } as const
    const parts = [
      { type: 'stream-start', warnings: [] },
      invalidMetadata,
      validMetadata,
      { type: 'raw', rawValue: { secret: 'raw-part-canary' } },
      { type: 'text-start', id: 'provider-secret-id' },
      { type: 'text-delta', id: 'provider-secret-id', delta: '' },
      { type: 'text-end', id: 'provider-secret-id' },
      { type: 'finish', finishReason: { unified: 'stop', raw: undefined }, usage },
    ] satisfies ReadonlyArray<LanguageModelV4StreamPart>
    const { input, events } = createInput(parts, ['runtime-part-1'])

    const result = await consumeModelStepStream(input)

    expect(result.usage).toEqual({ outputTokens: 0 })
    expect(events.at(-1)).toMatchObject({ type: 'run-terminated', usage: { outputTokens: 0 } })
    expect(JSON.stringify({ events, result })).not.toContain('canary')
    expect(events.filter((event) => event.type === 'run-terminated')).toHaveLength(1)
  })

  it('accepts repeated normalized metadata when every accepted field is identical', async () => {
    const metadata = {
      type: 'response-metadata',
      id: 'r'.repeat(128),
      modelId: 'model/1',
      timestamp: new Date(8_640_000_000_000_000),
    } as const
    const finish = textStopParts.at(-1)!
    const { input, events } = createInput([
      { type: 'stream-start', warnings: [] },
      metadata,
      { ...metadata, timestamp: new Date(metadata.timestamp.getTime()) },
      finish,
    ])

    await expect(consumeModelStepStream(input)).resolves.toMatchObject({
      terminal: { termination: 'stop' },
    })
    expect(events.filter((event) => event.type === 'run-terminated')).toHaveLength(1)
  })

  it('treats runtime-invalid metadata field types as unavailable without coercion', async () => {
    const invalidMetadata = {
      type: 'response-metadata',
      id: 123,
      modelId: { secret: 'metadata-object-canary' },
      timestamp: '2026-10-12T00:00:00.000Z',
    } as unknown as LanguageModelV4StreamPart
    const { input, events } = createInput([
      { type: 'stream-start', warnings: [] },
      invalidMetadata,
      { type: 'response-metadata', id: '123', modelId: 'model-valid', timestamp: new Date(0) },
      textStopParts.at(-1)!,
    ])

    await expect(consumeModelStepStream(input)).resolves.toMatchObject({
      terminal: { termination: 'stop' },
    })
    expect(JSON.stringify(events)).not.toContain('metadata-object-canary')
  })
})
