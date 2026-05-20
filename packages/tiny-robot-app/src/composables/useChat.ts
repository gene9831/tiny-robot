import { skillPlugin, sseStreamToGenerator, toolPlugin, useConversation } from '@opentiny/tiny-robot-kit'
import { computed, ref, watch } from 'vue'
import type { McpServerKey } from '../mcpServers'
import { useMcp } from './useMcp'
import { useModel } from './useModel'
import { useSkills } from './useSkills'

function createChatStore() {
  const inputMessage = ref('')
  const modelStore = useModel()
  const mcpStore = useMcp()
  const skillStore = useSkills()
  const { listTools, callTool } = mcpStore
  const { selectedModel, getSelectedModelParams } = modelStore
  const { selectedSkills, setActiveSkillConversation, attachDraftSkillsToConversation } = skillStore

  const useConversationReturn = useConversation({
    useMessageOptions: {
      responseProvider: async (requestBody, abortSignal) => {
        const currentModel = selectedModel.value
        if (!currentModel) {
          throw new Error('No model selected.')
        }
        if (!currentModel.apiKey) {
          throw new Error(`Missing API key for provider "${currentModel.provider}".`)
        }

        const response = await fetch(currentModel.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentModel.apiKey}`,
          },
          body: JSON.stringify({
            ...requestBody,
            ...getSelectedModelParams(),
            stream: true,
          }),
          signal: abortSignal,
        })

        if (!response.ok) {
          const detail = await response.text().catch(() => '')
          throw new Error(`HTTP ${response.status}: ${response.statusText}${detail ? ` - ${detail}` : ''}`)
        }

        return sseStreamToGenerator(response, { signal: abortSignal })
      },
      initialMessages: [
        {
          role: 'system',
          content: 'You are a helpful assistant.',
        },
      ],
      plugins: [
        skillPlugin({
          skills: selectedSkills,
        }),
        toolPlugin({
          getTools: async () => {
            const mcpTools = await listTools()
            return mcpTools.map((tool) => ({
              type: 'function',
              function: {
                name: tool.name,
                description: tool.description || '',
                parameters: (tool.inputSchema as Record<string, unknown> | undefined) || {
                  type: 'object',
                  properties: {},
                },
              },
            }))
          },
          callTool: async (toolCall) => {
            const toolName = toolCall.function?.name
            if (!toolName || !toolName.includes('__')) {
              throw new Error(`Unknown MCP tool name: ${toolName || '(empty)'}`)
            }
            const [serverKeyPart, ...nameParts] = toolName.split('__')
            const originalToolName = nameParts.join('__')
            const serverKey = serverKeyPart as McpServerKey
            if (!originalToolName) {
              throw new Error(`Unknown MCP tool name: ${toolName}`)
            }
            const args = JSON.parse(toolCall.function?.arguments || '{}') as Record<string, unknown>
            return await callTool(serverKey, originalToolName, args)
          },
        }),
        {
          onError({ currentTurn, error }) {
            console.error(error)
            currentTurn[currentTurn.length - 1].content = String(error)
          },
        },
      ],
    },
    autoSaveMessages: true,
  })

  watch(useConversationReturn.activeConversationId, (conversationId) => {
    setActiveSkillConversation(conversationId)
  })

  const messages = computed(() => useConversationReturn.activeConversation.value?.engine.messages.value || [])
  const isProcessing = computed(
    () => useConversationReturn.activeConversation.value?.engine.isProcessing.value ?? false,
  )

  function sendMessage(content: string) {
    const value = content?.trim()
    if (!value || isProcessing.value) {
      return
    }
    if (!useConversationReturn.activeConversationId.value) {
      const conversation = useConversationReturn.createConversation({ title: value.slice(0, 24) })
      attachDraftSkillsToConversation(conversation.id)
    }
    useConversationReturn.sendMessage(value)
    inputMessage.value = ''
  }

  return {
    ...useConversationReturn,
    ...modelStore,
    ...skillStore,
    messages,
    inputMessage,
    isProcessing,
    sendMessage,
  }
}

type ChatStore = ReturnType<typeof createChatStore>
let chatStore: ChatStore | null = null

export function useChat() {
  if (!chatStore) {
    chatStore = createChatStore()
  }
  return chatStore
}
