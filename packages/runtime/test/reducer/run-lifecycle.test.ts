import { describe, expect, it } from 'vitest'
import type { RuntimeModelCapabilitiesV1, RuntimeSnapshot } from '../../src/index'
import { createRuntimeSnapshot, reduceRuntimeEvent } from '../../src/domain/reducer'

const capabilities: RuntimeModelCapabilitiesV1 = {
  streaming: 'native',
  functionTools: 'unsupported',
  parallelToolCalls: 'unsupported',
  toolChoice: ['none'],
  reasoningRequest: 'unsupported',
  visibleReasoning: 'none',
  opaqueContinuation: 'none',
  usage: 'partial',
  knownLosses: [],
}

function createActiveRun(stepKind: 'model' | 'tool' = 'model'): RuntimeSnapshot {
  const events = [
    { type: 'conversation-created', conversationId: 'conversation-1' },
    { type: 'turn-created', conversationId: 'conversation-1', turnId: 'turn-1' },
    {
      type: 'run-created',
      conversationId: 'conversation-1',
      turnId: 'turn-1',
      runId: 'run-1',
      provider: 'provider-1',
      modelId: 'model-1',
      capabilities,
    },
    { type: 'step-started', runId: 'run-1', stepId: 'step-1', index: 0, kind: stepKind },
  ] as const

  return events.reduce(reduceRuntimeEvent, createRuntimeSnapshot())
}

function createTwoActiveRuns(): RuntimeSnapshot {
  const secondRunEvents = [
    { type: 'conversation-created', conversationId: 'conversation-2' },
    { type: 'turn-created', conversationId: 'conversation-2', turnId: 'turn-2' },
    {
      type: 'run-created',
      conversationId: 'conversation-2',
      turnId: 'turn-2',
      runId: 'run-2',
      provider: 'provider-2',
      modelId: 'model-2',
      capabilities,
    },
    { type: 'step-started', runId: 'run-2', stepId: 'step-2', index: 0, kind: 'model' },
    {
      type: 'message-created',
      runId: 'run-2',
      turnId: 'turn-2',
      messageId: 'message-2',
      role: 'assistant',
    },
  ] as const

  return secondRunEvents.reduce(reduceRuntimeEvent, createActiveRun())
}

describe('Runtime reducer run lifecycle', () => {
  it('creates a normalized active Run and preserves the Step kind', () => {
    const snapshot = createActiveRun('model')

    expect(snapshot.conversationsById['conversation-1']).toEqual({
      id: 'conversation-1',
      turnIds: ['turn-1'],
      activeRunId: 'run-1',
    })
    expect(snapshot.turnsById['turn-1']).toEqual({
      id: 'turn-1',
      conversationId: 'conversation-1',
      runIds: ['run-1'],
    })
    expect(snapshot.runsById['run-1']).toEqual({
      id: 'run-1',
      turnId: 'turn-1',
      status: 'active',
      stepIds: ['step-1'],
      messageIds: [],
      provider: 'provider-1',
      modelId: 'model-1',
      capabilities,
    })
    expect(snapshot.stepsById['step-1']).toEqual({
      id: 'step-1',
      runId: 'run-1',
      index: 0,
      kind: 'model',
      status: 'active',
    })
  })

  it('keeps model and tool Steps distinct in Snapshot state', () => {
    expect(createActiveRun('model').stepsById['step-1']?.kind).toBe('model')
    expect(createActiveRun('tool').stepsById['step-1']?.kind).toBe('tool')
  })

  it('records one completed terminal with normalized usage and termination', () => {
    const active = createActiveRun()
    const completed = reduceRuntimeEvent(active, {
      type: 'run-terminated',
      runId: 'run-1',
      stepId: 'step-1',
      runStatus: 'completed',
      stepStatus: 'completed',
      termination: 'max_output_tokens',
      usage: { inputTokens: 7, outputTokens: 11 },
    })

    expect(completed.runsById['run-1']).toMatchObject({
      status: 'completed',
      termination: 'max_output_tokens',
      usage: { inputTokens: 7, outputTokens: 11 },
    })
    expect(completed.stepsById['step-1']?.status).toBe('completed')
    expect(completed.conversationsById['conversation-1']?.activeRunId).toBeUndefined()
    expect(completed.turnsById['turn-1']?.selectedRunId).toBe('run-1')

    const ignoredSecondTerminal = reduceRuntimeEvent(completed, {
      type: 'run-terminated',
      runId: 'run-1',
      stepId: 'step-1',
      runStatus: 'failed',
      stepStatus: 'failed',
    })

    expect(ignoredSecondTerminal).toBe(completed)
  })

  it.each([
    ['completed', 'completed'],
    ['failed', 'failed'],
    ['aborted', 'aborted'],
    ['interrupted', 'interrupted'],
    ['superseded', 'completed'],
  ] as const)('records the %s Run terminal without conflating Step state', (runStatus, stepStatus) => {
    const terminal = reduceRuntimeEvent(createActiveRun(), {
      type: 'run-terminated',
      runId: 'run-1',
      stepId: 'step-1',
      runStatus,
      stepStatus,
    })

    expect(terminal.runsById['run-1']?.status).toBe(runStatus)
    expect(terminal.stepsById['step-1']?.status).toBe(stepStatus)
    expect(terminal.conversationsById['conversation-1']?.activeRunId).toBeUndefined()
  })

  it('stores only the normalized provider error supplied by the Domain Event', () => {
    const failed = reduceRuntimeEvent(createActiveRun(), {
      type: 'run-terminated',
      runId: 'run-1',
      stepId: 'step-1',
      runStatus: 'failed',
      stepStatus: 'failed',
      error: {
        category: 'rate_limit',
        code: 'provider_rate_limited',
        retryable: true,
        httpStatus: 429,
      },
    })

    expect(failed.runsById['run-1']?.error).toEqual({
      category: 'rate_limit',
      code: 'provider_rate_limited',
      retryable: true,
      httpStatus: 429,
    })
  })

  it('rejects a Run whose Turn belongs to a different Conversation', () => {
    let snapshot = createRuntimeSnapshot()
    snapshot = reduceRuntimeEvent(snapshot, { type: 'conversation-created', conversationId: 'conversation-1' })
    snapshot = reduceRuntimeEvent(snapshot, { type: 'conversation-created', conversationId: 'conversation-2' })
    snapshot = reduceRuntimeEvent(snapshot, {
      type: 'turn-created',
      conversationId: 'conversation-1',
      turnId: 'turn-1',
    })

    expect(() =>
      reduceRuntimeEvent(snapshot, {
        type: 'run-created',
        conversationId: 'conversation-2',
        turnId: 'turn-1',
        runId: 'run-1',
        provider: 'provider-1',
        modelId: 'model-1',
        capabilities,
      }),
    ).toThrow()
  })

  it('rejects a Step whose index does not match the Run order', () => {
    const snapshot = createActiveRun()

    expect(() =>
      reduceRuntimeEvent(snapshot, {
        type: 'step-started',
        runId: 'run-1',
        stepId: 'step-2',
        index: 3,
        kind: 'tool',
      }),
    ).toThrow()
  })

  it('rejects a Message whose Turn does not own the Run', () => {
    const snapshot = createTwoActiveRuns()

    expect(() =>
      reduceRuntimeEvent(snapshot, {
        type: 'message-created',
        runId: 'run-1',
        turnId: 'turn-2',
        messageId: 'message-cross-owner',
        role: 'assistant',
      }),
    ).toThrow()
  })

  it('rejects a text Part whose Message belongs to another Run', () => {
    const snapshot = createTwoActiveRuns()

    expect(() =>
      reduceRuntimeEvent(snapshot, {
        type: 'text-part-started',
        runId: 'run-1',
        messageId: 'message-2',
        partId: 'part-cross-owner',
      }),
    ).toThrow()
  })

  it('rejects a text delta targeting a Part owned by another Run', () => {
    let snapshot = createTwoActiveRuns()
    snapshot = reduceRuntimeEvent(snapshot, {
      type: 'text-part-started',
      runId: 'run-2',
      messageId: 'message-2',
      partId: 'part-2',
    })

    expect(() =>
      reduceRuntimeEvent(snapshot, {
        type: 'text-part-delta',
        runId: 'run-1',
        partId: 'part-2',
        delta: 'cross-owner',
      }),
    ).toThrow()
  })

  it('rejects a text end targeting a Part owned by another Run', () => {
    let snapshot = createTwoActiveRuns()
    snapshot = reduceRuntimeEvent(snapshot, {
      type: 'text-part-started',
      runId: 'run-2',
      messageId: 'message-2',
      partId: 'part-2',
    })

    expect(() =>
      reduceRuntimeEvent(snapshot, {
        type: 'text-part-ended',
        runId: 'run-1',
        partId: 'part-2',
      }),
    ).toThrow()
  })

  it('rejects a terminal Step owned by another Run', () => {
    const snapshot = createTwoActiveRuns()

    expect(() =>
      reduceRuntimeEvent(snapshot, {
        type: 'run-terminated',
        runId: 'run-1',
        stepId: 'step-2',
        runStatus: 'completed',
        stepStatus: 'completed',
        termination: 'stop',
      }),
    ).toThrow()
  })
})
