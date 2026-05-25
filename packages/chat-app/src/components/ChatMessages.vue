<script setup lang="ts">
import { TrBubbleList, type BubbleRoleConfig } from '@opentiny/tiny-robot'
import { IconAi, IconUser } from '@opentiny/tiny-robot-svgs'
import { h } from 'vue'

defineProps<{
  messages: {
    role: string
    content: string
    [x: string]: unknown
  }[]
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
  <TrBubbleList :messages="messages" :role-configs="roles" class="chat-messages" />
</template>

<style scoped>
.chat-messages {
  --tr-bubble-box-bg: #f0f1f3;
}
</style>
