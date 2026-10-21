import { describe, expect, it } from 'vitest'
import type { RuntimeSnapshot } from '../src/domain/types'
import {
  RuntimeSelectorError,
  selectConversation,
  selectMessage,
  selectRun,
  selectTurn,
} from '@opentiny/tiny-robot-runtime/selectors'

const snapshot: RuntimeSnapshot = {
  schemaVersion: 1,
  conversationsById: {
    conversation: {
      id: 'conversation',
      turnIds: ['turn-1', 'turn-2'],
      activeRunId: 'run-2',
    },
    empty: { id: 'empty', turnIds: [] },
  },
  turnsById: {
    'turn-1': {
      id: 'turn-1',
      conversationId: 'conversation',
      runIds: ['run-1'],
      selectedRunId: 'run-1',
    },
    'turn-2': {
      id: 'turn-2',
      conversationId: 'conversation',
      runIds: ['run-2', 'run-3'],
      selectedRunId: 'run-3',
    },
    empty: { id: 'empty', conversationId: 'empty', runIds: [] },
  },
  runsById: {
    'run-1': {
      id: 'run-1',
      turnId: 'turn-1',
      status: 'completed',
      stepIds: [],
      messageIds: [],
      providerId: 'provider',
      modelId: 'model',
      capabilities: { streaming: true, reasoning: false },
    },
    'run-2': {
      id: 'run-2',
      turnId: 'turn-2',
      status: 'active',
      stepIds: ['step-2', 'step-1'],
      messageIds: ['message-2', 'message-1'],
      providerId: 'provider',
      modelId: 'model',
      capabilities: { streaming: true, reasoning: true },
    },
    'run-3': {
      id: 'run-3',
      turnId: 'turn-2',
      status: 'completed',
      stepIds: [],
      messageIds: [],
      providerId: 'provider',
      modelId: 'model',
      capabilities: { streaming: true, reasoning: false },
    },
    empty: {
      id: 'empty',
      turnId: 'empty',
      status: 'completed',
      stepIds: [],
      messageIds: [],
      providerId: 'provider',
      modelId: 'model',
      capabilities: { streaming: true, reasoning: false },
    },
  },
  stepsById: {
    'step-1': { id: 'step-1', runId: 'run-2', kind: 'model', status: 'completed' },
    'step-2': { id: 'step-2', runId: 'run-2', kind: 'tool', status: 'completed' },
  },
  messagesById: {
    'message-1': {
      id: 'message-1',
      turnId: 'turn-2',
      runId: 'run-2',
      role: 'assistant',
      partIds: ['part-2', 'part-1'],
    },
    'message-2': {
      id: 'message-2',
      turnId: 'turn-2',
      runId: 'run-2',
      role: 'user',
      partIds: [],
    },
    empty: { id: 'empty', turnId: 'empty', role: 'assistant', partIds: [] },
  },
  partsById: {
    'part-1': { id: 'part-1', messageId: 'message-1', kind: 'text', content: 'answer' },
    'part-2': { id: 'part-2', messageId: 'message-1', kind: 'reasoning', content: 'thought' },
  },
  toolCallsById: {},
}

describe('Runtime domain selectors', () => {
  it('returns an ordered domain tree from a normalized snapshot', () => {
    const conversation = selectConversation(snapshot, 'conversation')

    expect(conversation?.turns.map(({ id }) => id)).toEqual(['turn-1', 'turn-2'])
    expect(conversation?.turns[1]?.runs.map(({ id }) => id)).toEqual(['run-2', 'run-3'])
    expect(conversation?.turns[1]?.runs[0]?.steps.map(({ id }) => id)).toEqual(['step-2', 'step-1'])
    expect(conversation?.turns[1]?.runs[0]?.messages.map(({ id }) => id)).toEqual(['message-2', 'message-1'])
    expect(conversation?.turns[1]?.runs[0]?.messages[1]?.parts.map(({ id }) => id)).toEqual(['part-2', 'part-1'])
  })

  it('exposes the active run and the run selected as each turn answer by shared reference', () => {
    const conversation = selectConversation(snapshot, 'conversation')
    const secondTurn = conversation?.turns[1]

    expect(conversation?.activeRun).toBe(secondTurn?.runs[0])
    expect(secondTurn?.selectedRun).toBe(secondTurn?.runs[1])
  })

  it('offers the same nested shape when selecting a turn, run, or message directly', () => {
    expect(selectTurn(snapshot, 'turn-2')?.runs.map(({ id }) => id)).toEqual(['run-2', 'run-3'])
    expect(selectRun(snapshot, 'run-2')?.messages[1]?.parts.map(({ id }) => id)).toEqual(['part-2', 'part-1'])
    expect(selectMessage(snapshot, 'message-1')?.parts.map(({ id }) => id)).toEqual(['part-2', 'part-1'])
  })

  it('preserves unaffected selection references when one streamed part changes', () => {
    const before = selectConversation(snapshot, 'conversation')
    const nextSnapshot: RuntimeSnapshot = {
      ...snapshot,
      partsById: {
        ...snapshot.partsById,
        'part-1': { ...snapshot.partsById['part-1']!, content: 'answer continued' },
      },
    }
    const after = selectConversation(nextSnapshot, 'conversation')

    expect(after).not.toBe(before)
    expect(after?.turns[0]).toBe(before?.turns[0])
    expect(after?.turns[1]?.runs[1]).toBe(before?.turns[1]?.runs[1])
    expect(after?.turns[1]?.runs[0]?.messages[0]).toBe(before?.turns[1]?.runs[0]?.messages[0])
    expect(after?.turns[1]?.runs[0]?.messages[1]?.parts[0]).toBe(before?.turns[1]?.runs[0]?.messages[1]?.parts[0])
    expect(after?.turns[1]?.runs[0]?.messages[1]?.parts[1]).not.toBe(before?.turns[1]?.runs[0]?.messages[1]?.parts[1])
    expect(selectConversation(nextSnapshot, 'conversation')).toBe(after)
  })

  it('distinguishes missing roots from existing entities with empty relationships', () => {
    expect(selectConversation(snapshot, 'missing')).toBeUndefined()
    expect(selectConversation(snapshot, 'empty')?.turns).toEqual([])
    expect(selectConversation(snapshot, 'empty')?.activeRun).toBeUndefined()

    expect(selectTurn(snapshot, 'missing')).toBeUndefined()
    expect(selectTurn(snapshot, 'empty')?.runs).toEqual([])
    expect(selectTurn(snapshot, 'empty')?.selectedRun).toBeUndefined()

    expect(selectRun(snapshot, 'missing')).toBeUndefined()
    expect(selectRun(snapshot, 'empty')?.messages).toEqual([])
    expect(selectRun(snapshot, 'empty')?.steps).toEqual([])

    expect(selectMessage(snapshot, 'missing')).toBeUndefined()
    expect(selectMessage(snapshot, 'empty')?.parts).toEqual([])
  })

  it('throws a stable selector error for dangling normalized references', () => {
    const invalidSnapshot: RuntimeSnapshot = {
      ...snapshot,
      conversationsById: {
        ...snapshot.conversationsById,
        invalid: { id: 'invalid', turnIds: ['missing-turn'] },
      },
    }

    expect(() => selectConversation(invalidSnapshot, 'invalid')).toThrowError(RuntimeSelectorError)
    expect(() => selectConversation(invalidSnapshot, 'invalid')).toThrowError(
      expect.objectContaining({
        name: 'RuntimeSelectorError',
        code: 'dangling-reference',
        sourceId: 'invalid',
        relation: 'turnIds',
        targetId: 'missing-turn',
      }),
    )
  })
})
