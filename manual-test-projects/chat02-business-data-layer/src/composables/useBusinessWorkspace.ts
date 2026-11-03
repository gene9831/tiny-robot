import { computed, shallowRef } from 'vue'
import { createChatRepository, type ChatRepository } from '../business/chatRepository'
import { createFakeReplyService, type FakeReplyService, type ReplyMode } from '../business/fakeReplyService'

export interface UseBusinessWorkspaceOptions {
  repository?: ChatRepository
  replyService?: FakeReplyService
  replyDelayMs?: number
}

export function useBusinessWorkspace(options: UseBusinessWorkspaceOptions = {}) {
  const repository = options.repository ?? createChatRepository()
  const replyService = options.replyService ?? createFakeReplyService(options.replyDelayMs)
  const draft = shallowRef('')
  const replyMode = shallowRef<ReplyMode>('success')
  let messageSequence = 0
  let activeRequest: { conversationNo: string; controller: AbortController } | null = null

  const conversations = computed(() => repository.snapshot.value.conversations)
  const activeConversation = computed(() => {
    const activeConversationNo = repository.snapshot.value.activeConversationNo
    return conversations.value.find((conversation) => conversation.conversationNo === activeConversationNo)
  })
  const activeMessages = computed(() => {
    const activeConversationNo = repository.snapshot.value.activeConversationNo
    return repository.snapshot.value.messages.filter((message) => message.conversationNo === activeConversationNo)
  })
  const requestState = computed(() => {
    const activeConversationNo = repository.snapshot.value.activeConversationNo
    return activeConversationNo ? (repository.snapshot.value.requestStates[activeConversationNo] ?? 'idle') : 'idle'
  })
  const snapshotProtected = computed(() => {
    const snapshot = repository.snapshot.value
    return Object.isFrozen(snapshot) && Object.isFrozen(snapshot.conversations) && Object.isFrozen(snapshot.messages)
  })

  function selectConversation(conversationNo: string) {
    repository.selectConversation(conversationNo)
  }

  function renameConversation(conversationNo: string, subject: string) {
    repository.renameConversation(conversationNo, subject)
  }

  function deleteConversation(conversationNo: string) {
    repository.deleteConversation(conversationNo)
  }

  async function submitMessage() {
    const text = draft.value.trim()
    const conversationNo = repository.snapshot.value.activeConversationNo
    if (!text || !conversationNo) return
    if (repository.snapshot.value.requestStates[conversationNo] === 'processing') return

    const previousRequest = activeRequest
    if (previousRequest) {
      activeRequest = null
      previousRequest.controller.abort()
      repository.setRequestState(previousRequest.conversationNo, 'aborted')
    }

    const request = { conversationNo, controller: new AbortController() }
    activeRequest = request
    draft.value = ''
    repository.appendMessage({
      messageNo: `business-user-${++messageSequence}`,
      conversationNo,
      sender: 'customer',
      text,
      status: 'finished',
    })
    repository.setRequestState(conversationNo, 'processing')

    try {
      const reply = await replyService.request(text, replyMode.value, request.controller.signal)
      if (activeRequest !== request) return
      repository.appendMessage({
        messageNo: `business-assistant-${++messageSequence}`,
        conversationNo,
        sender: 'assistant',
        text: reply,
        status: 'finished',
      })
      repository.setRequestState(conversationNo, 'completed')
    } catch (error) {
      if (activeRequest !== request) return
      if (error instanceof DOMException && error.name === 'AbortError') {
        repository.setRequestState(conversationNo, 'aborted')
      } else {
        repository.appendMessage({
          messageNo: `business-assistant-${++messageSequence}`,
          conversationNo,
          sender: 'assistant',
          text: '',
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : String(error),
        })
        repository.setRequestState(conversationNo, 'error')
      }
    } finally {
      if (activeRequest === request) activeRequest = null
    }
  }

  function cancelRequest() {
    const request = activeRequest
    if (!request) return
    activeRequest = null
    request.controller.abort()
    repository.setRequestState(request.conversationNo, 'aborted')
  }

  function reset() {
    const request = activeRequest
    activeRequest = null
    request?.controller.abort()
    repository.reset()
    draft.value = ''
    replyMode.value = 'success'
    messageSequence = 0
  }

  return {
    repository,
    conversations,
    activeConversation,
    activeMessages,
    requestState,
    snapshotProtected,
    draft,
    replyMode,
    selectConversation,
    renameConversation,
    deleteConversation,
    submitMessage,
    cancelRequest,
    reset,
  }
}
