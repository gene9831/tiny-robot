<script setup lang="ts">
import { ref, inject, computed, nextTick, watch, onMounted } from 'vue'
import type { BlockComponentProps, BlockComponentEmits, EditorContext } from '../../types'
import { cleanZeroWidthSpaces, ensureZeroWidthAroundField } from '../../utils/zeroWidthUtils'
import { calculatePlaceholderWidth } from '../../utils/contentHelpers'

const props = defineProps<BlockComponentProps>()
const emit = defineEmits<BlockComponentEmits>()

const spanRef = ref<HTMLSpanElement | null>(null)
const editorContext = inject<EditorContext | null>('editorContext', null)

// 获取 placeholder 文本
const placeholderText = computed(() => props.block.options?.placeholder || '请输入内容')
// 计算 placeholder 宽度
const placeholderWidth = computed(() => calculatePlaceholderWidth(placeholderText.value))

// 处理内容编辑
const handleInput = (event: Event) => {
  const target = event.target as HTMLSpanElement
  let newContent = target.textContent || ''

  // 清理零宽字符后再提交更新
  newContent = cleanZeroWidthSpaces(newContent)
  emit('update:content', newContent)

  // 确保更新传递给父组件
  nextTick(() => {
    // 确保字段周围有零宽字符
    if (spanRef.value) {
      ensureZeroWidthAroundField(spanRef.value)
    }

    // 触发父组件的 input 事件，确保 useContentEditableEvents 能捕获变化
    const inputEvent = new Event('input', { bubbles: true })
    spanRef.value?.dispatchEvent(inputEvent)
  })
}

// 确保组件内容与 props 同步
const updateContent = () => {
  // 添加安全检查，防止在组件销毁时操作 DOM
  if (spanRef.value && spanRef.value.isConnected && spanRef.value.textContent !== props.block.content) {
    spanRef.value.textContent = props.block.content

    // 确保字段周围有零宽字符
    nextTick(() => {
      if (spanRef.value && spanRef.value.isConnected) {
        ensureZeroWidthAroundField(spanRef.value)
      }
    })
  }
}

// 监听 props 变化
watch(
  () => props.block.content,
  () => {
    updateContent()
  },
  { immediate: true },
)

// 组件挂载后确保零宽字符并更新状态
onMounted(() => {
  if (spanRef.value) {
    ensureZeroWidthAroundField(spanRef.value)
  }
})
</script>

<template>
  <span
    ref="spanRef"
    class="template-field"
    :data-placeholder="placeholderText"
    :contenteditable="!editorContext?.readonly"
    :data-block-type="block.type"
    :data-block-id="block.id"
    :style="{
      '--placeholder-min-width': placeholderWidth.minWidth,
      '--placeholder-max-width': placeholderWidth.maxWidth,
      '--placeholder-white-space': placeholderWidth.useMaxWidth ? 'normal' : 'nowrap',
      '--placeholder-word-break': placeholderWidth.useMaxWidth ? 'break-word' : 'normal',
    }"
    @input="handleInput"
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
  padding: 2px 8px;
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
  vertical-align: middle;

  /** 换行保持样式 */
  box-decoration-break: clone;

  &:hover {
    background-color: rgba(20, 118, 255, 0.15);
  }

  &:empty {
    /* 确保空字段有足够高度 */
    min-height: 26px;
    /* 空字段使用inline确保有区域，但不改变display类型 */
    display: inline-block;
    /* 与文本保持一致的垂直对齐 */
    vertical-align: middle;
    line-height: 26px;
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

  &:empty::after {
    content: '\200b';
    display: inline;
    width: 0;
    height: 0;
    overflow: hidden;
    visibility: hidden;
  }
}
</style>
