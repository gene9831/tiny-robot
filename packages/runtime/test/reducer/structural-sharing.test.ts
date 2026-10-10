import { describe, expect, it } from 'vitest'
import type { RuntimeModelCapabilitiesV1 } from '../../src/index'
import type { RuntimeDomainEvent } from '../../src/domain/events'
import { createRuntimeSnapshot, reduceRuntimeEvent } from '../../src/domain/reducer'

const capabilities: RuntimeModelCapabilitiesV1 = {
  streaming: 'native',
  functionTools: 'unsupported',
  parallelToolCalls: 'unsupported',
  toolChoice: ['none'],
  reasoningRequest: 'unsupported',
  visibleReasoning: 'none',
  opaqueContinuation: 'none',
  usage: 'unavailable',
  knownLosses: [],
}

function createTextSnapshot() {
  const events: ReadonlyArray<RuntimeDomainEvent> = [
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
    { type: 'step-started', runId: 'run-1', stepId: 'step-1', index: 0, kind: 'model' },
    {
      type: 'message-created',
      runId: 'run-1',
      turnId: 'turn-1',
      messageId: 'message-1',
      role: 'assistant',
    },
    { type: 'text-part-started', runId: 'run-1', messageId: 'message-1', partId: 'part-1' },
  ]

  return events.reduce(reduceRuntimeEvent, createRuntimeSnapshot())
}

describe('Runtime reducer structural sharing', () => {
  it('replaces only the changed Part map and preserves unrelated references', () => {
    const before = createTextSnapshot()
    const after = reduceRuntimeEvent(before, {
      type: 'text-part-delta',
      runId: 'run-1',
      partId: 'part-1',
      delta: 'delta',
    })

    expect(after).not.toBe(before)
    expect(after.partsById).not.toBe(before.partsById)
    expect(after.partsById['part-1']).not.toBe(before.partsById['part-1'])
    expect(after.conversationsById).toBe(before.conversationsById)
    expect(after.turnsById).toBe(before.turnsById)
    expect(after.runsById).toBe(before.runsById)
    expect(after.stepsById).toBe(before.stepsById)
    expect(after.messagesById).toBe(before.messagesById)
    expect(after.toolCallsById).toBe(before.toolCallsById)
  })

  it('serializes Snapshot state as plain JSON without Provider identifiers from the stream', () => {
    const snapshot = reduceRuntimeEvent(createTextSnapshot(), {
      type: 'text-part-delta',
      runId: 'run-1',
      partId: 'part-1',
      delta: 'serializable',
    })

    const serialized = JSON.stringify(snapshot)
    const parsed = JSON.parse(serialized)

    expect(parsed).toEqual(snapshot)
    expect(serialized).not.toContain('provider-part-id')
    expect(parsed.schemaVersion).toBe(1)
  })
})
