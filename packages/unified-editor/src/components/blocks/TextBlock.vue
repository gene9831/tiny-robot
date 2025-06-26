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

  /* 允许字段内容换行，与容器保持一致 */
  white-space: pre-wrap;
  /* 强制换行设置 - 允许在任意字符处断行 */
  word-break: break-all;
  word-wrap: break-word;
}

.text-block[contenteditable='true'] {
  outline: none;
}
</style>
