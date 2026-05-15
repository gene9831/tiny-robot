<template>
  <div>
    <slot></slot>
    <input type="text" placeholder="请输入..." v-model="text" />
    <button @click="console.log(text)">Log</button>
  </div>
</template>

<script setup lang="ts">
import { onUpdated, ref, watchEffect } from 'vue'

defineOptions({
  name: 'TinyRobotChatHeader',
})

const text = ref('')

watchEffect(() => {
  console.log('text changed:', text.value)
})

onUpdated(() => {
  console.log('TinyRobotChatHeader updated')
})
</script>
