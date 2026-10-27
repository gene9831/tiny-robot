import type { RuntimeSnapshot } from '@opentiny/tiny-robot-runtime'
import { RuntimeSelectorError, selectConversation } from '@opentiny/tiny-robot-runtime/selectors'

export type DomainSelectorScenarioId = 'existing' | 'missing' | 'dangling'

export type DomainSelectorDemoResult =
  | {
      readonly scenario: 'existing'
      readonly outcome: 'selected'
      readonly tree: {
        readonly conversationId: string
        readonly turnIds: ReadonlyArray<string>
        readonly runIds: ReadonlyArray<string>
        readonly messageRoles: ReadonlyArray<string>
        readonly texts: ReadonlyArray<string>
      }
    }
  | {
      readonly scenario: 'missing'
      readonly outcome: 'missing'
      readonly value: 'undefined'
    }
  | {
      readonly scenario: 'dangling'
      readonly outcome: 'error'
      readonly error: {
        readonly name: 'RuntimeSelectorError'
        readonly code: 'dangling-reference'
        readonly sourceId: string
        readonly relation: string
        readonly targetId: string
      }
    }

const existingSnapshot: RuntimeSnapshot = {
  schemaVersion: 1,
  conversationsById: {
    'conversation-1': { id: 'conversation-1', turnIds: ['turn-1'] },
  },
  turnsById: {
    'turn-1': {
      id: 'turn-1',
      conversationId: 'conversation-1',
      inputMessageIds: ['message-user'],
      runIds: ['run-1'],
      selectedRunId: 'run-1',
    },
  },
  runsById: {
    'run-1': {
      id: 'run-1',
      turnId: 'turn-1',
      status: 'completed',
      stepIds: ['step-1'],
      inputMessageIds: ['message-user'],
      outputMessageIds: ['message-assistant'],
      providerId: 'selector-demo-local',
      modelId: 'selector-demo-model',
      capabilities: { streaming: true, reasoning: false },
      termination: 'stop',
    },
  },
  stepsById: {
    'step-1': { id: 'step-1', runId: 'run-1', kind: 'model', status: 'completed' },
  },
  messagesById: {
    'message-user': {
      id: 'message-user',
      turnId: 'turn-1',
      role: 'user',
      partIds: ['part-user'],
    },
    'message-assistant': {
      id: 'message-assistant',
      turnId: 'turn-1',
      runId: 'run-1',
      role: 'assistant',
      partIds: ['part-assistant'],
    },
  },
  partsById: {
    'part-user': {
      id: 'part-user',
      messageId: 'message-user',
      kind: 'text',
      content: '解释 Selector。',
      status: 'completed',
    },
    'part-assistant': {
      id: 'part-assistant',
      messageId: 'message-assistant',
      kind: 'text',
      content: 'Selector 把规范化关系展开成只读领域树。',
      status: 'completed',
    },
  },
  toolCallsById: {},
}

const danglingSnapshot: RuntimeSnapshot = {
  ...existingSnapshot,
  conversationsById: {
    'conversation-dangling': { id: 'conversation-dangling', turnIds: ['turn-missing'] },
  },
}

/** Runs one public Selector query and projects its observable result for the page. */
export function runDomainSelectorScenario(scenario: DomainSelectorScenarioId): DomainSelectorDemoResult {
  if (scenario === 'missing') {
    const selected = selectConversation(existingSnapshot, 'conversation-missing')
    if (selected !== undefined) throw new Error('Expected the missing Selector scenario to return undefined')
    return { scenario, outcome: 'missing', value: 'undefined' }
  }

  if (scenario === 'dangling') {
    try {
      selectConversation(danglingSnapshot, 'conversation-dangling')
    } catch (error) {
      if (error instanceof RuntimeSelectorError) {
        return {
          scenario,
          outcome: 'error',
          error: {
            name: 'RuntimeSelectorError',
            code: error.code,
            sourceId: error.sourceId,
            relation: error.relation,
            targetId: error.targetId,
          },
        }
      }
      throw error
    }
    throw new Error('Expected the dangling Selector scenario to fail')
  }

  const selected = selectConversation(existingSnapshot, 'conversation-1')
  if (selected === undefined) throw new Error('Expected the existing Selector scenario to return a tree')

  return {
    scenario,
    outcome: 'selected',
    tree: {
      conversationId: selected.id,
      turnIds: selected.turns.map(({ id }) => id),
      runIds: selected.turns.flatMap(({ runs }) => runs.map(({ id }) => id)),
      messageRoles: selected.turns.flatMap(({ inputMessages, runs }) => [
        ...inputMessages.map(({ role }) => role),
        ...runs.flatMap(({ outputMessages }) => outputMessages.map(({ role }) => role)),
      ]),
      texts: selected.turns.flatMap(({ inputMessages, runs }) =>
        [...inputMessages, ...runs.flatMap(({ outputMessages }) => outputMessages)].flatMap(({ parts }) =>
          parts.flatMap(({ content }) => (content === undefined ? [] : [content])),
        ),
      ),
    },
  }
}
