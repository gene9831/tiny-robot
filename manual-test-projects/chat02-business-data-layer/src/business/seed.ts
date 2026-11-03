import type { BusinessChatSnapshot } from './types'

export function createSeedSnapshot(): BusinessChatSnapshot {
  return {
    conversations: [
      {
        conversationNo: 'order-support',
        subject: '订单咨询',
        updatedAt: 1_762_169_400_000,
      },
      {
        conversationNo: 'refund-follow-up',
        subject: '退款跟进',
        updatedAt: 1_762_169_460_000,
      },
    ],
    messages: [
      {
        messageNo: 'order-user-1',
        conversationNo: 'order-support',
        sender: 'customer',
        text: '订单 TR-2026-1103 什么时候发货？',
        status: 'finished',
      },
      {
        messageNo: 'order-assistant-1',
        conversationNo: 'order-support',
        sender: 'assistant',
        text: '订单已进入出库流程，预计今天发货。',
        status: 'finished',
      },
      {
        messageNo: 'refund-user-1',
        conversationNo: 'refund-follow-up',
        sender: 'customer',
        text: '请查询退款 TR-R-1024 的进度。',
        status: 'finished',
      },
      {
        messageNo: 'refund-assistant-error',
        conversationNo: 'refund-follow-up',
        sender: 'assistant',
        text: '',
        status: 'failed',
        errorMessage: '模拟业务请求失败',
      },
    ],
    activeConversationNo: 'order-support',
    requestStates: {
      'order-support': 'idle',
      'refund-follow-up': 'error',
    },
  }
}
