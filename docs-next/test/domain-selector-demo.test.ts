import { describe, expect, it } from 'vitest'
import { runDomainSelectorScenario } from '../src/concepts/domainSelectorDemo'

describe('Domain Selector Demo', () => {
  it('expands an existing root in Snapshot order', () => {
    expect(runDomainSelectorScenario('existing')).toEqual({
      scenario: 'existing',
      outcome: 'selected',
      tree: {
        conversationId: 'conversation-1',
        turnIds: ['turn-1'],
        runIds: ['run-1'],
        messageRoles: ['user', 'assistant'],
        texts: ['解释 Selector。', 'Selector 把规范化关系展开成只读领域树。'],
      },
    })
  })

  it('reports an absent query root as undefined rather than an invariant error', () => {
    expect(runDomainSelectorScenario('missing')).toEqual({
      scenario: 'missing',
      outcome: 'missing',
      value: 'undefined',
    })
  })

  it('projects stable fields when an existing root has a dangling reference', () => {
    expect(runDomainSelectorScenario('dangling')).toEqual({
      scenario: 'dangling',
      outcome: 'error',
      error: {
        name: 'RuntimeSelectorError',
        code: 'dangling-reference',
        sourceId: 'conversation-dangling',
        relation: 'turnIds',
        targetId: 'turn-missing',
      },
    })
  })
})
