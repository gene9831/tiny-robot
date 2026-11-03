import { readonly, shallowRef, type DeepReadonly, type ShallowRef } from 'vue'
import { createSeedSnapshot } from './seed'
import type { BusinessChatSnapshot, BusinessMessage, BusinessRequestState } from './types'

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const nested of Object.values(value)) deepFreeze(nested)
  }
  return value
}

function freezeSnapshot(snapshot: BusinessChatSnapshot): BusinessChatSnapshot {
  return deepFreeze(snapshot)
}

export interface ChatRepository {
  readonly snapshot: Readonly<ShallowRef<DeepReadonly<BusinessChatSnapshot>>>
  selectConversation(conversationNo: string): void
  renameConversation(conversationNo: string, subject: string): void
  deleteConversation(conversationNo: string): void
  appendMessage(message: BusinessMessage): void
  setRequestState(conversationNo: string, state: BusinessRequestState): void
  reset(): void
}

export function createChatRepository(initial: BusinessChatSnapshot = createSeedSnapshot()): ChatRepository {
  const snapshot = shallowRef(freezeSnapshot(initial))

  function replace(next: BusinessChatSnapshot) {
    snapshot.value = freezeSnapshot(next)
  }

  function selectConversation(conversationNo: string) {
    if (!snapshot.value.conversations.some((item) => item.conversationNo === conversationNo)) return
    replace({ ...snapshot.value, activeConversationNo: conversationNo })
  }

  function renameConversation(conversationNo: string, subject: string) {
    const nextSubject = subject.trim()
    if (!nextSubject) return
    replace({
      ...snapshot.value,
      conversations: snapshot.value.conversations.map((item) =>
        item.conversationNo === conversationNo ? { ...item, subject: nextSubject } : item,
      ),
    })
  }

  function deleteConversation(conversationNo: string) {
    if (!snapshot.value.conversations.some((item) => item.conversationNo === conversationNo)) return
    const conversations = snapshot.value.conversations.filter((item) => item.conversationNo !== conversationNo)
    const { [conversationNo]: _removed, ...requestStates } = snapshot.value.requestStates
    const activeConversationNo =
      snapshot.value.activeConversationNo === conversationNo
        ? (conversations[0]?.conversationNo ?? null)
        : snapshot.value.activeConversationNo
    replace({
      conversations,
      messages: snapshot.value.messages.filter((item) => item.conversationNo !== conversationNo),
      activeConversationNo,
      requestStates,
    })
  }

  function appendMessage(message: BusinessMessage) {
    if (!snapshot.value.conversations.some((item) => item.conversationNo === message.conversationNo)) return
    replace({ ...snapshot.value, messages: [...snapshot.value.messages, { ...message }] })
  }

  function setRequestState(conversationNo: string, state: BusinessRequestState) {
    if (!snapshot.value.conversations.some((item) => item.conversationNo === conversationNo)) return
    replace({
      ...snapshot.value,
      requestStates: { ...snapshot.value.requestStates, [conversationNo]: state },
    })
  }

  function reset() {
    replace(createSeedSnapshot())
  }

  return {
    snapshot: readonly(snapshot),
    selectConversation,
    renameConversation,
    deleteConversation,
    appendMessage,
    setRequestState,
    reset,
  }
}
