import { describe, expect, it } from 'vitest'
import { createChatRepository } from './chatRepository'

describe('createChatRepository', () => {
  it('selects a conversation by replacing the frozen snapshot without changing its messages', () => {
    const repository = createChatRepository()
    const before = repository.snapshot.value

    repository.selectConversation('refund-follow-up')

    expect(repository.snapshot.value).not.toBe(before)
    expect(repository.snapshot.value.activeConversationNo).toBe('refund-follow-up')
    expect(repository.snapshot.value.messages).toEqual(before.messages)
    expect(before.activeConversationNo).toBe('order-support')
    expect(Object.isFrozen(before)).toBe(true)
    expect(Object.isFrozen(before.conversations)).toBe(true)
  })

  it('renames and deletes only through repository operations while preserving previous snapshots', () => {
    const repository = createChatRepository()
    const beforeRename = repository.snapshot.value

    repository.renameConversation('order-support', '订单咨询（已更新）')

    expect(repository.snapshot.value.conversations[0]?.subject).toBe('订单咨询（已更新）')
    expect(beforeRename.conversations[0]?.subject).toBe('订单咨询')

    const beforeDelete = repository.snapshot.value
    repository.deleteConversation('order-support')

    expect(repository.snapshot.value.conversations.map((item) => item.conversationNo)).toEqual(['refund-follow-up'])
    expect(repository.snapshot.value.messages.every((item) => item.conversationNo === 'refund-follow-up')).toBe(true)
    expect(repository.snapshot.value.activeConversationNo).toBe('refund-follow-up')
    expect(beforeDelete.conversations).toHaveLength(2)
  })

  it('updates request state and appends a message only to the addressed conversation', () => {
    const repository = createChatRepository()
    const before = repository.snapshot.value

    repository.setRequestState('order-support', 'processing')
    repository.appendMessage({
      messageNo: 'assistant-new',
      conversationNo: 'order-support',
      sender: 'assistant',
      text: '新的业务回答',
      status: 'finished',
    })

    expect(repository.snapshot.value.requestStates).toEqual({
      'order-support': 'processing',
      'refund-follow-up': 'error',
    })
    expect(repository.snapshot.value.messages.at(-1)?.messageNo).toBe('assistant-new')
    expect(repository.snapshot.value.messages.filter((item) => item.conversationNo === 'refund-follow-up')).toEqual(
      before.messages.filter((item) => item.conversationNo === 'refund-follow-up'),
    )
    expect(before.requestStates['order-support']).toBe('idle')
  })
})
