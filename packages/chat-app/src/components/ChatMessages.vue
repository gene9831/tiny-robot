<script setup lang="ts">
import { TrBubbleList, type BubbleRoleConfig } from '@opentiny/tiny-robot'
import { ChatMessage } from '@opentiny/tiny-robot-kit'
import { IconAi, IconUser } from '@opentiny/tiny-robot-svgs'
import { h } from 'vue'

defineProps<{
  messages: ChatMessage[]
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
</script>

<template>
  <TrBubbleList :messages="messages" :role-configs="roles" auto-scroll class="chat-messages" />
</template>

<style scoped>
.chat-messages {
  --tr-bubble-box-bg: #f0f1f3;

  height: 100%;
  max-height: 100%;
  overflow: auto;
}
</style>
