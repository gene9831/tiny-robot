<script setup lang="ts">
import { computed } from 'vue'
import type { BlockComponentProps } from '../../types'
import { calculatePlaceholderWidth } from '../../utils/contentHelpers'

const props = defineProps<BlockComponentProps>()

// 获取 placeholder 文本
const placeholderText = computed(() => props.block.options?.placeholder || '请输入内容')
// 计算 placeholder 宽度
const placeholderWidth = computed(() => calculatePlaceholderWidth(placeholderText.value))
</script>

<template>
  <span
    class="template-field"
    :data-placeholder="placeholderText"
    :data-block-type="block.type"
    :data-block-id="block.id"
    :data-block-index="index"
    :style="{
      '--placeholder-min-width': placeholderWidth.minWidth,
      '--placeholder-max-width': placeholderWidth.maxWidth,
      '--placeholder-white-space': placeholderWidth.useMaxWidth ? 'normal' : 'nowrap',
      '--placeholder-word-break': placeholderWidth.useMaxWidth ? 'break-word' : 'normal',
    }"
    >{{ block.content }}</span
  >
</template>

<style lang="less">
.template-field {
  display: inline;
  caret-color: #191919;
  color: #1476ff;
  min-width: 2em;
  max-width: none;
  background: rgba(20, 118, 255, 0.1);
  padding: 3px 8px;
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
  line-height: 26px;
  position: relative;
  /* 启用连字符，帮助长英文词的折行 */
  hyphens: auto;
  /* 修改为中线对齐，确保与文本一致 */
  vertical-align: baseline;

  /** 换行保持样式 */
  box-decoration-break: clone;

  &:hover {
    background-color: rgba(20, 118, 255, 0.15);
  }

  &:empty {
    /* 确保空字段有足够高度 */
    min-height: 28px;
    /* 空字段使用inline确保有区域，但不改变display类型 */
    display: inline-block;
    /* 与文本保持一致的垂直对齐 */
    vertical-align: baseline;
    line-height: 20px;
    /* 使用计算的宽度变量 */
    min-width: var(--placeholder-min-width, 2em);
    max-width: var(--placeholder-max-width, 20em);
    white-space: var(--placeholder-white-space, nowrap);
    word-break: var(--placeholder-word-break, normal);
  }

  &:empty::before {
    content: attr(data-placeholder);
    color: #a6cafd;
    pointer-events: none;
    position: absolute;
    /* 修改为垂直居中，不使用transform */
    top: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    left: 8px;
    right: 8px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: var(--placeholder-white-space, nowrap);
    word-break: var(--placeholder-word-break, normal);
  }
}
</style>
