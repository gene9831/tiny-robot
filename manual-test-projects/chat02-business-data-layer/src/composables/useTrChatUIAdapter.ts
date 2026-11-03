import { computed, shallowRef } from 'vue'
import type {
  ChatHistoryActionPayload,
  ChatMessageItem,
  ChatRenameConversationPayload,
  ChatSendPayload,
  ChatSwitchConversationPayload,
  ChatUIData,
} from '@opentiny/tiny-robot-chat'
import type { BusinessMessage } from '../business/types'
import { useBusinessWorkspace } from './useBusinessWorkspace'

type BusinessWorkspace = ReturnType<typeof useBusinessWorkspace>

type HostEventName = 'submit' | 'cancel' | 'switch-conversation' | 'rename-conversation' | 'history-action'

export interface HostEventLogEntry {
  readonly sequence: number
  readonly name: HostEventName
  readonly payload?: unknown
  readonly applied: boolean
}

export type PendingHostAction =
  | { readonly type: 'rename'; readonly conversationNo: string; readonly title: string }
  | { readonly type: 'delete'; readonly conversationNo: string; readonly title: string }

function toChatMessage(message: BusinessMessage): ChatMessageItem {
  return {
    id: message.messageNo,
    renderKey: message.messageNo,
    role: message.sender === 'customer' ? 'user' : 'assistant',
    content: message.text,
    streamState: message.status === 'pending' ? 'streaming' : 'finished',
    state: message.errorMessage ? { error: { message: message.errorMessage } } : undefined,
    metadata: {
      businessConversationNo: message.conversationNo,
      businessStatus: message.status,
    },
  }
}

export function useTrChatUIAdapter(workspace: BusinessWorkspace = useBusinessWorkspace()) {
  const hostEventsEnabled = shallowRef(true)
  const eventLog = shallowRef<HostEventLogEntry[]>([])
  const pendingAction = shallowRef<PendingHostAction | null>(null)
  let eventSequence = 0

  function recordEvent(name: HostEventName, payload?: unknown) {
    eventLog.value = [
      ...eventLog.value,
      {
        sequence: ++eventSequence,
        name,
        payload,
        applied: hostEventsEnabled.value,
      },
    ]
  }

  const data = computed<ChatUIData>(() => {
    const activeMessages = workspace.activeMessages.value
    const messages = activeMessages.map(toChatMessage)
    const lastMessage = activeMessages.at(-1)

    if (workspace.requestState.value === 'processing' && lastMessage?.sender === 'customer') {
      messages.push({
        id: `loading-${lastMessage.messageNo}`,
        renderKey: `loading-${lastMessage.messageNo}`,
        role: 'assistant',
        content: '',
        loading: true,
        streamState: 'streaming',
      })
    }

    return {
      conversation: {
        items: workspace.conversations.value.map((conversation) => ({
          id: conversation.conversationNo,
          title: conversation.subject,
          updatedAt: conversation.updatedAt,
        })),
        activeId: workspace.activeConversation.value?.conversationNo ?? null,
        title: workspace.activeConversation.value?.subject ?? '未选择会话',
      },
      bubble: { messages },
      sender: {
        loading: workspace.requestState.value === 'processing',
      },
      request: {
        state: workspace.requestState.value,
      },
    }
  })

  const eventCounts = computed<Record<string, number>>(() => {
    const counts: Record<string, number> = {}
    for (const event of eventLog.value) counts[event.name] = (counts[event.name] ?? 0) + 1
    return counts
  })
  const lastEvent = computed(() => eventLog.value.at(-1))

  function handleSwitchConversation(payload: ChatSwitchConversationPayload) {
    recordEvent('switch-conversation', payload)
    if (hostEventsEnabled.value) workspace.selectConversation(payload.conversationId)
  }

  async function handleSubmit(payload: ChatSendPayload) {
    recordEvent('submit', payload)
    if (!hostEventsEnabled.value) return
    workspace.draft.value = payload.text
    await workspace.submitMessage()
  }

  function handleCancel() {
    recordEvent('cancel')
    if (hostEventsEnabled.value) workspace.cancelRequest()
  }

  function handleRenameConversation(payload: ChatRenameConversationPayload) {
    recordEvent('rename-conversation', payload)
    if (!hostEventsEnabled.value) return
    pendingAction.value = {
      type: 'rename',
      conversationNo: payload.conversationId,
      title: payload.title,
    }
  }

  function handleHistoryAction(payload: ChatHistoryActionPayload) {
    recordEvent('history-action', {
      actionId: payload.action.id,
      conversationId: payload.conversation.id,
    })
    if (!hostEventsEnabled.value || payload.action.id !== 'delete') return
    pendingAction.value = {
      type: 'delete',
      conversationNo: payload.conversation.id,
      title: payload.conversation.title,
    }
  }

  function confirmPendingAction() {
    const action = pendingAction.value
    if (!action) return
    if (action.type === 'rename') workspace.renameConversation(action.conversationNo, action.title)
    else workspace.deleteConversation(action.conversationNo)
    pendingAction.value = null
  }

  function dismissPendingAction() {
    pendingAction.value = null
  }

  function resetIntegration() {
    workspace.reset()
    hostEventsEnabled.value = true
    eventLog.value = []
    pendingAction.value = null
    eventSequence = 0
  }

  return {
    workspace,
    data,
    inputValue: workspace.draft,
    hostEventsEnabled,
    eventLog,
    eventCounts,
    lastEvent,
    pendingAction,
    handleSwitchConversation,
    handleSubmit,
    handleCancel,
    handleRenameConversation,
    handleHistoryAction,
    confirmPendingAction,
    dismissPendingAction,
    resetIntegration,
  }
}
