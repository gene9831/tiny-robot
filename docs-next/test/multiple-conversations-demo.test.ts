import { selectConversation } from '@opentiny/tiny-robot-runtime/selectors'
import { describe, expect, it } from 'vitest'
import { runMultipleConversationsDemo } from '../src/examples/multipleConversationsDemo'

describe('multiple Conversation Demo', () => {
  it('keeps two completed Conversations and their owned trees in one Snapshot', async () => {
    const result = await runMultipleConversationsDemo({ terminalDelayMs: 0 })

    expect(result.conversations.map(({ label, question, answer }) => ({ label, question, answer }))).toEqual([
      { label: 'Conversation A', question: '北京的气候有什么特点？', answer: '北京四季分明。' },
      { label: 'Conversation B', question: '深圳的气候有什么特点？', answer: '深圳温暖湿润。' },
    ])
    expect(Object.keys(result.snapshot.conversationsById)).toEqual(result.conversations.map(({ id }) => id))

    for (const item of result.conversations) {
      const selected = selectConversation(result.snapshot, item.id)
      expect(selected?.turns).toHaveLength(1)
      expect(selected?.turns[0]?.selectedRun).toMatchObject({
        status: 'completed',
        termination: 'stop',
      })
      expect(selected?.turns[0]?.inputMessages.every(({ turnId }) => turnId === selected.turns[0]?.id)).toBe(true)
      expect(
        selected?.turns[0]?.selectedRun?.outputMessages.every(({ turnId }) => turnId === selected.turns[0]?.id),
      ).toBe(true)
    }
  })

  it('selects either Conversation without changing the shared Snapshot', async () => {
    const result = await runMultipleConversationsDemo({ terminalDelayMs: 0 })
    const before = JSON.stringify(result.snapshot)

    const first = selectConversation(result.snapshot, result.conversations[0]!.id)
    const second = selectConversation(result.snapshot, result.conversations[1]!.id)

    expect(first?.id).toBe(result.conversations[0]!.id)
    expect(second?.id).toBe(result.conversations[1]!.id)
    expect(JSON.stringify(result.snapshot)).toBe(before)
  })
})
