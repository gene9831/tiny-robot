<script setup lang="ts">
import type { BlockComponentProps } from '../../types'

defineProps<BlockComponentProps>()
</script>

<template>
  <span :class="['text-block']" :data-block-type="block.type" :data-block-id="block.id" :data-block-index="index">{{
    block.content
  }}</span>
</template>

<style scoped>
.text-block {
  display: inline;
  white-space: pre-wrap;
  word-break: break-word;
}

.text-block[contenteditable='true'] {
  outline: none;
}
</style>
