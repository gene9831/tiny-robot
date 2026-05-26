import { useConversation, type UseConversationReturn, type UseMessagePlugin } from '@opentiny/tiny-robot-kit'
import { initialMessages, mockResponseProvider } from '../mock/chat'

let chatConversation: UseConversationReturn | undefined

const mockErrorPlugin: UseMessagePlugin = {
  name: 'mock-error-state',
  onError({ currentTurn }) {
    const lastMessage = currentTurn.at(-1)

    if (lastMessage) {
      lastMessage.content = '响应失败，请点击重试图标重试。'
      lastMessage.state = {
        ...lastMessage.state,
        error: true,
      }
    }
  },
}

const createChatConversation = () => {
  const conversation = useConversation({
    autoSaveMessages: true,
    useMessageOptions: {
      initialMessages,
      responseProvider: mockResponseProvider,
      plugins: [mockErrorPlugin],
    },
  })

  return conversation
}

export const useChatConversation = () => {
  chatConversation ??= createChatConversation()

  return chatConversation
}
