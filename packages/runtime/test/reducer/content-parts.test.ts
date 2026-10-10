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

function createMessageSnapshot() {
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
  ]

  return events.reduce(reduceRuntimeEvent, createRuntimeSnapshot())
}

describe('Runtime reducer text content', () => {
  it('appends empty and newline deltas exactly, then closes the text Part', () => {
    let snapshot = createMessageSnapshot()
    snapshot = reduceRuntimeEvent(snapshot, {
      type: 'text-part-started',
      runId: 'run-1',
      messageId: 'message-1',
      partId: 'part-1',
    })

    for (const delta of ['Hello', '', '\n', 'world']) {
      snapshot = reduceRuntimeEvent(snapshot, {
        type: 'text-part-delta',
        runId: 'run-1',
        partId: 'part-1',
        delta,
      })
    }

    snapshot = reduceRuntimeEvent(snapshot, {
      type: 'text-part-ended',
      runId: 'run-1',
      partId: 'part-1',
    })

    expect(snapshot.messagesById['message-1']?.partIds).toEqual(['part-1'])
    expect(snapshot.partsById['part-1']).toEqual({
      id: 'part-1',
      messageId: 'message-1',
      kind: 'text',
      status: 'completed',
      content: 'Hello\nworld',
    })
  })

  it('does not mutate terminal Snapshot content when later events arrive', () => {
    let snapshot = createMessageSnapshot()
    snapshot = reduceRuntimeEvent(snapshot, {
      type: 'text-part-started',
      runId: 'run-1',
      messageId: 'message-1',
      partId: 'part-1',
    })
    snapshot = reduceRuntimeEvent(snapshot, {
      type: 'text-part-delta',
      runId: 'run-1',
      partId: 'part-1',
      delta: 'final',
    })
    snapshot = reduceRuntimeEvent(snapshot, {
      type: 'text-part-ended',
      runId: 'run-1',
      partId: 'part-1',
    })
    snapshot = reduceRuntimeEvent(snapshot, {
      type: 'run-terminated',
      runId: 'run-1',
      stepId: 'step-1',
      runStatus: 'completed',
      stepStatus: 'completed',
      termination: 'stop',
    })

    const afterLateDelta = reduceRuntimeEvent(snapshot, {
      type: 'text-part-delta',
      runId: 'run-1',
      partId: 'part-1',
      delta: '-late',
    })

    expect(afterLateDelta).toBe(snapshot)
    expect(afterLateDelta.partsById['part-1']?.content).toBe('final')
  })
})
