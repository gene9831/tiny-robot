import { describe, expect, it } from 'vitest'
import type { RuntimeModelCapabilitiesV1, RuntimeSnapshot } from '../src/index'
import { projectPrompt } from '../src/execution/promptProjection'

const capabilities: RuntimeModelCapabilitiesV1 = {
  streaming: true,
  reasoning: true,
}

function textAndReasoningSnapshot(runCapabilities: RuntimeModelCapabilitiesV1 = capabilities): RuntimeSnapshot {
  return {
    schemaVersion: 1,
    conversationsById: {
      'conversation-1': {
        id: 'conversation-1',
        turnIds: ['turn-1'],
        activeRunId: 'run-1',
      },
    },
    turnsById: {
      'turn-1': {
        id: 'turn-1',
        conversationId: 'conversation-1',
        runIds: ['run-1'],
      },
    },
    runsById: {
      'run-1': {
        id: 'run-1',
        turnId: 'turn-1',
        status: 'active',
        stepIds: ['step-1'],
        messageIds: ['message-system', 'message-user', 'message-assistant'],
        providerId: 'provider-1',
        modelId: 'model-1',
        capabilities: runCapabilities,
      },
    },
    stepsById: {
      'step-1': {
        id: 'step-1',
        runId: 'run-1',
        index: 0,
        kind: 'model',
        status: 'active',
      },
    },
    messagesById: {
      'message-system': {
        id: 'message-system',
        turnId: 'turn-1',
        runId: 'run-1',
        role: 'system',
        partIds: ['part-system-1', 'part-system-2'],
      },
      'message-user': {
        id: 'message-user',
        turnId: 'turn-1',
        runId: 'run-1',
        role: 'user',
        partIds: ['part-user-1', 'part-user-2'],
      },
      'message-assistant': {
        id: 'message-assistant',
        turnId: 'turn-1',
        runId: 'run-1',
        role: 'assistant',
        partIds: ['part-assistant-text', 'part-assistant-reasoning'],
      },
    },
    partsById: {
      'part-system-1': {
        id: 'part-system-1',
        messageId: 'message-system',
        kind: 'text',
        content: 'Follow ',
        status: 'completed',
      },
      'part-system-2': {
        id: 'part-system-2',
        messageId: 'message-system',
        kind: 'text',
        content: 'instructions.\n',
        status: 'completed',
      },
      'part-user-1': {
        id: 'part-user-1',
        messageId: 'message-user',
        kind: 'text',
        content: 'Hello',
        status: 'completed',
      },
      'part-user-2': {
        id: 'part-user-2',
        messageId: 'message-user',
        kind: 'text',
        content: '\nworld',
        status: 'completed',
      },
      'part-assistant-text': {
        id: 'part-assistant-text',
        messageId: 'message-assistant',
        kind: 'text',
        content: 'Answer',
        status: 'completed',
      },
      'part-assistant-reasoning': {
        id: 'part-assistant-reasoning',
        messageId: 'message-assistant',
        kind: 'reasoning',
        content: 'Summary',
        status: 'completed',
      },
    },
    toolCallsById: {},
  }
}

function expectProjectionCode(snapshot: RuntimeSnapshot, code: string): void {
  expect(() => projectPrompt(snapshot, 'run-1')).toThrow(expect.objectContaining({ code }))
}

describe('Runtime Snapshot prompt projection', () => {
  it('projects exact system, user, assistant text and allowed reasoning summary without mutation', () => {
    const snapshot = textAndReasoningSnapshot()
    const before = JSON.stringify(snapshot)

    expect(projectPrompt(snapshot, 'run-1')).toEqual([
      { role: 'system', content: 'Follow instructions.\n' },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Hello' },
          { type: 'text', text: '\nworld' },
        ],
      },
      {
        role: 'assistant',
        content: [
          { type: 'text', text: 'Answer' },
          { type: 'reasoning', text: 'Summary' },
        ],
      },
    ])
    expect(JSON.stringify(snapshot)).toBe(before)
  })

  it.each([
    ['tool-call', 'prompt_part_not_supported'],
    ['error', 'prompt_part_not_supported'],
    ['future-part', 'prompt_part_unknown'],
  ] as const)('rejects %s history instead of silently dropping it', (kind, code) => {
    const snapshot = textAndReasoningSnapshot()
    const part = snapshot.partsById['part-assistant-text']
    const unsafeSnapshot = {
      ...snapshot,
      partsById: {
        ...snapshot.partsById,
        'part-assistant-text': { ...part, kind },
      },
    } as RuntimeSnapshot

    expectProjectionCode(unsafeSnapshot, code)
  })

  it('rejects streaming history that is not complete', () => {
    const snapshot = textAndReasoningSnapshot()
    const part = snapshot.partsById['part-user-1']
    const incompleteSnapshot: RuntimeSnapshot = {
      ...snapshot,
      partsById: {
        ...snapshot.partsById,
        'part-user-1': { ...part, status: 'streaming' },
      },
    }

    expectProjectionCode(incompleteSnapshot, 'prompt_part_incomplete')
  })
})
