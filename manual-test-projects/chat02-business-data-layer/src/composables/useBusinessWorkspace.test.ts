import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { FakeReplyService } from '../business/fakeReplyService'
import { useBusinessWorkspace } from './useBusinessWorkspace'

describe('useBusinessWorkspace', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('switches the active business conversation without mixing messages', () => {
    const workspace = useBusinessWorkspace({ replyDelayMs: 1_000 })

    workspace.selectConversation('refund-follow-up')

    expect(workspace.activeConversation.value?.subject).toBe('退款跟进')
    expect(workspace.activeMessages.value.map((message) => message.messageNo)).toEqual([
      'refund-user-1',
      'refund-assistant-error',
    ])
    expect(workspace.requestState.value).toBe('error')
  })

  it('adds the customer message immediately and the delayed business reply to its originating conversation', async () => {
    const workspace = useBusinessWorkspace({ replyDelayMs: 1_000 })
    workspace.draft.value = '查询订单状态'

    const pending = workspace.submitMessage()
    expect(workspace.draft.value).toBe('')
    expect(workspace.requestState.value).toBe('processing')
    expect(workspace.activeMessages.value.at(-1)).toMatchObject({
      sender: 'customer',
      text: '查询订单状态',
    })

    workspace.selectConversation('refund-follow-up')
    await vi.advanceTimersByTimeAsync(1_000)
    await pending
    workspace.selectConversation('order-support')

    expect(workspace.requestState.value).toBe('completed')
    expect(workspace.activeMessages.value.at(-1)).toMatchObject({
      sender: 'assistant',
      text: '业务数据层已收到：查询订单状态',
    })
  })

  it('records a failed business reply on the conversation that submitted it', async () => {
    const workspace = useBusinessWorkspace({ replyDelayMs: 1_000 })
    workspace.replyMode.value = 'failure'
    workspace.draft.value = '触发失败回答'

    const pending = workspace.submitMessage()
    workspace.selectConversation('refund-follow-up')
    await vi.advanceTimersByTimeAsync(1_000)
    await pending
    workspace.selectConversation('order-support')

    expect(workspace.requestState.value).toBe('error')
    expect(workspace.activeMessages.value.at(-1)).toMatchObject({
      sender: 'assistant',
      status: 'failed',
      errorMessage: '模拟业务请求失败',
    })
  })

  it('cancels an active request without appending an assistant result', async () => {
    const workspace = useBusinessWorkspace({ replyDelayMs: 1_000 })
    workspace.draft.value = '取消本次回答'

    const pending = workspace.submitMessage()
    workspace.cancelRequest()
    await pending

    expect(workspace.requestState.value).toBe('aborted')
    expect(workspace.activeMessages.value.at(-1)?.sender).toBe('customer')
  })

  it('ignores a late reply when the request service resolves after cancellation', async () => {
    let resolveReply!: (reply: string) => void
    const replyService: FakeReplyService = {
      request: () =>
        new Promise((resolve) => {
          resolveReply = resolve
        }),
    }
    const workspace = useBusinessWorkspace({ replyService })
    workspace.draft.value = '取消后不得写入'

    const pending = workspace.submitMessage()
    workspace.cancelRequest()
    resolveReply('晚到的业务回答')
    await pending

    expect(workspace.requestState.value).toBe('aborted')
    expect(workspace.activeMessages.value.at(-1)).toMatchObject({
      sender: 'customer',
      text: '取消后不得写入',
    })
  })

  it('keeps the restored seed state when reset aborts an active request', async () => {
    const workspace = useBusinessWorkspace({ replyDelayMs: 1_000 })
    workspace.draft.value = '重置中的请求'

    const pending = workspace.submitMessage()
    workspace.reset()
    await pending

    expect(workspace.requestState.value).toBe('idle')
    expect(workspace.activeMessages.value.map((message) => message.messageNo)).toEqual([
      'order-user-1',
      'order-assistant-1',
    ])
    expect(workspace.replyMode.value).toBe('success')
  })

  it('renames and deletes conversations only through business operations', () => {
    const workspace = useBusinessWorkspace({ replyDelayMs: 1_000 })

    workspace.renameConversation('order-support', '订单升级跟进')
    expect(workspace.activeConversation.value?.subject).toBe('订单升级跟进')

    workspace.deleteConversation('order-support')
    expect(workspace.conversations.value.map((conversation) => conversation.conversationNo)).toEqual([
      'refund-follow-up',
    ])
    expect(workspace.activeConversation.value?.conversationNo).toBe('refund-follow-up')
    expect(
      workspace.repository.snapshot.value.messages.every((message) => message.conversationNo !== 'order-support'),
    ).toBe(true)
  })
})
