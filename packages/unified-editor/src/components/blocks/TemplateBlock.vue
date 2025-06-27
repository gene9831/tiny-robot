<script setup lang="ts">
import type { BlockComponentProps } from '../../types'

defineProps<BlockComponentProps>()
</script>

<template>
  <span
    :class="['template-field', { 'is-empty': !block.content }]"
    :data-placeholder="block.options?.placeholder"
    :data-block-type="block.type"
    :data-block-id="block.id"
    :data-block-index="index"
    >{{ block.content || '\u200b' }}</span
  >
</template>

<style lang="less">
.template-field {
  display: inline;
  caret-color: #191919;
  color: #1476ff;
  max-width: none;
  background: rgba(20, 118, 255, 0.1);
  padding: 3.3px 8px;
  margin: 0 4px;
  border-radius: 4px;
  cursor: text;
  transition: background-color 0.2s;
  /* 允许字段内容换行，与容器保持一致 */
  white-space: pre-wrap;
  /* 强制换行设置 - 允许在任意字符处断行 */
  word-break: break-all;
  word-wrap: break-word;
  box-sizing: border-box;
  overflow-wrap: break-word;
  position: relative;
  /* 启用连字符，帮助长英文词的折行 */
  hyphens: auto;

  /** 换行保持样式 */
  box-decoration-break: clone;

  &:hover {
    background-color: rgba(20, 118, 255, 0.15);
  }

  &.is-empty {
    display: inline-block;
    width: 32px;
    height: 28px;
    line-height: 21.4px;
  }
}
</style>
