import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useBusinessWorkspace } from './useBusinessWorkspace'
import { useTrChatUIAdapter } from './useTrChatUIAdapter'

describe('useTrChatUIAdapter', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('maps frozen business data into controlled TrChatUI data without changing the snapshot', () => {
    const workspace = useBusinessWorkspace({ replyDelayMs: 1_000 })
    const before = workspace.repository.snapshot.value
    const adapter = useTrChatUIAdapter(workspace)

    expect(adapter.data.value.conversation).toMatchObject({
      activeId: 'order-support',
      title: '订单咨询',
    })
    expect(adapter.data.value.conversation?.items?.map((item) => item.id)).toEqual([
      'order-support',
      'refund-follow-up',
    ])
    expect(adapter.data.value.bubble?.messages?.map((message) => message.id)).toEqual([
      'order-user-1',
      'order-assistant-1',
    ])
    expect(workspace.repository.snapshot.value).toBe(before)
    expect(Object.isFrozen(before)).toBe(true)
  })

  it('records a switch intent without mutating business data when host event handling is disabled', () => {
    const workspace = useBusinessWorkspace({ replyDelayMs: 1_000 })
    const adapter = useTrChatUIAdapter(workspace)
    adapter.hostEventsEnabled.value = false

    adapter.handleSwitchConversation({ conversationId: 'refund-follow-up' })

    expect(workspace.activeConversation.value?.conversationNo).toBe('order-support')
    expect(adapter.lastEvent.value).toMatchObject({ name: 'switch-conversation', applied: false })
  })

  it('switches the business conversation after host event handling is enabled', () => {
    const workspace = useBusinessWorkspace({ replyDelayMs: 1_000 })
    const adapter = useTrChatUIAdapter(workspace)

    adapter.handleSwitchConversation({ conversationId: 'refund-follow-up' })

    expect(adapter.data.value.conversation?.activeId).toBe('refund-follow-up')
    expect(adapter.data.value.bubble?.messages?.at(-1)).toMatchObject({
      id: 'refund-assistant-error',
      state: { error: { message: '模拟业务请求失败' } },
    })
  })

  it('forwards one submit payload to the existing business request flow', async () => {
    const workspace = useBusinessWorkspace({ replyDelayMs: 1_000 })
    const adapter = useTrChatUIAdapter(workspace)

    const pending = adapter.handleSubmit({ text: '查询订单状态' })

    expect(adapter.eventCounts.value.submit).toBe(1)
    expect(adapter.data.value.request?.state).toBe('processing')
    expect(adapter.data.value.bubble?.messages?.slice(-2)).toMatchObject([
      {
        role: 'user',
        content: '查询订单状态',
      },
      {
        role: 'assistant',
        content: '',
        loading: true,
      },
    ])

    await vi.advanceTimersByTimeAsync(1_000)
    await pending

    expect(adapter.data.value.request?.state).toBe('completed')
    expect(adapter.data.value.bubble?.messages?.at(-1)).toMatchObject({
      role: 'assistant',
      content: '业务数据层已收到：查询订单状态',
    })
  })

  it('forwards cancel to the active business request without accepting a late result', async () => {
    let resolveReply!: (reply: string) => void
    const workspace = useBusinessWorkspace({
      replyService: {
        request: () =>
          new Promise((resolve) => {
            resolveReply = resolve
          }),
      },
    })
    const adapter = useTrChatUIAdapter(workspace)

    const pending = adapter.handleSubmit({ text: '取消后不得写入' })
    adapter.handleCancel()
    resolveReply('晚到的业务回答')
    await pending

    expect(adapter.eventCounts.value).toMatchObject({ submit: 1, cancel: 1 })
    expect(adapter.data.value.request?.state).toBe('aborted')
    expect(adapter.data.value.bubble?.messages?.at(-1)).toMatchObject({
      role: 'user',
      content: '取消后不得写入',
    })
  })

  it('keeps rename and delete pending until the host confirms them', () => {
    const workspace = useBusinessWorkspace({ replyDelayMs: 1_000 })
    const adapter = useTrChatUIAdapter(workspace)

    adapter.handleRenameConversation({ conversationId: 'order-support', title: '订单升级跟进' })
    expect(workspace.activeConversation.value?.subject).toBe('订单咨询')
    adapter.confirmPendingAction()
    expect(workspace.activeConversation.value?.subject).toBe('订单升级跟进')

    const conversation = adapter.data.value.conversation?.items?.[0]
    if (!conversation) throw new Error('missing conversation')
    adapter.handleHistoryAction({
      action: { id: 'delete', text: '删除' },
      conversation,
      defaultPrevented: false,
      preventDefault() {},
    })
    expect(workspace.conversations.value).toHaveLength(2)
    adapter.dismissPendingAction()
    expect(workspace.conversations.value).toHaveLength(2)

    adapter.handleHistoryAction({
      action: { id: 'delete', text: '删除' },
      conversation,
      defaultPrevented: false,
      preventDefault() {},
    })
    adapter.confirmPendingAction()
    expect(workspace.conversations.value.map((item) => item.conversationNo)).toEqual(['refund-follow-up'])
  })
})
