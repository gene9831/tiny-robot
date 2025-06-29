<script setup lang="ts">
import { computed, useAttrs } from 'vue'

defineProps<{
  content: string
  id: string
}>()

defineOptions({
  inheritAttrs: false,
})

const attrs = useAttrs()

// 过滤掉某些属性，例如 id 和 style
const filteredAttrs = computed(() => {
  const { type: _type, component: _component, ...rest } = attrs
  return rest
})
</script>

<template>
  <span :data-id="id" data-type="text" v-bind="filteredAttrs">{{ content }}</span>
</template>
