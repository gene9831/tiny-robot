<script setup lang="ts">
import { TrBubbleList, type BubbleMessage, type BubbleRoleConfig } from '@opentiny/tiny-robot'
import { IconAi, IconCopy, IconRefresh, IconUser } from '@opentiny/tiny-robot-svgs'
import { h } from 'vue'

const props = defineProps<{
  messages: BubbleMessage[]
  isProcessing: boolean
}>()

const emit = defineEmits<{
  regenerate: [userMessageIndex: number]
}>()

const roles: Record<string, BubbleRoleConfig> = {
  user: {
    placement: 'end',
    avatar: h(IconUser, { style: { width: '32px', height: '32px' } }),
  },
  assistant: {
    placement: 'start',
    avatar: h(IconAi, { style: { width: '32px', height: '32px' } }),
  },
}

const copyMessage = async (messages: BubbleMessage[]) => {
  const content = messages
    .map((message) => message.content)
    .filter((content): content is string => typeof content === 'string' && content.length > 0)
    .join('\n')

  if (!content) {
    return
  }

  await navigator.clipboard.writeText(content)
}

const hasContent = (messages: BubbleMessage[]) =>
  messages.some((message) => typeof message.content === 'string' && message.content.length > 0)

const hasError = (messages: BubbleMessage[]) => messages.some((message) => message.state?.error)

const messageIsGenerating = (messageIndexes: number[]) => {
  return props.isProcessing && messageIndexes.includes(props.messages.length - 1)
}

const regenerate = (messageIndexes: number[]) => {
  const firstMessageIndex = messageIndexes[0]
  const userMessageIndex = props.messages
    .slice(0, firstMessageIndex)
    .findLastIndex((message) => message.role === 'user')

  if (userMessageIndex !== -1) {
    emit('regenerate', userMessageIndex)
  }
}
</script>

<template>
  <TrBubbleList :messages="messages" :role-configs="roles" auto-scroll class="chat-messages">
    <template #after="{ messages: slotMessages, role, messageIndexes }">
      <div v-if="hasContent(slotMessages)" class="message-actions">
        <button v-if="role === 'user'" type="button" title="复制" @click="copyMessage(slotMessages)">
          <IconCopy />
        </button>
        <template v-if="role === 'assistant' && !messageIsGenerating(messageIndexes)">
          <button type="button" title="复制" @click="copyMessage(slotMessages)">
            <IconCopy />
          </button>
          <button
            v-if="!isProcessing"
            type="button"
            :title="hasError(slotMessages) ? '重试' : '重新生成'"
            @click="regenerate(messageIndexes)"
          >
            <IconRefresh />
          </button>
        </template>
      </div>
    </template>
  </TrBubbleList>
</template>

<style scoped>
.chat-messages {
  height: 100%;
  max-height: 100%;
  overflow: auto;
}

.chat-messages :deep(.tr-bubble[data-role='assistant']) {
  --tr-bubble-box-bg: var(--tr-container-bg-default-2);
  --tr-bubble-text-color: var(--tr-text-primary);
}

.chat-messages :deep(.tr-bubble[data-role='user']) {
  --tr-bubble-box-bg: var(--tr-color-primary);
  --tr-bubble-text-color: #fff;
}

.message-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.message-actions button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 8px;
  padding: 6px;
  background: transparent;
  color: var(--tr-icon-color-default);
  cursor: pointer;
}

.message-actions button:hover {
  background: var(--tr-container-bg-hover);
}

.message-actions svg {
  width: 16px;
  height: 16px;
}
</style>
