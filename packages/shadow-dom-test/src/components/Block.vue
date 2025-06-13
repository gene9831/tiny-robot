<script setup lang="ts">
import type { StyleValue } from 'vue'

defineProps<{
  content: string
  style?: StyleValue
}>()
</script>

<template>
  <span :style="style">{{ content }}</span>
</template>
