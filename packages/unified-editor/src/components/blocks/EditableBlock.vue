<script setup lang="ts">
import { ref, inject, computed, nextTick, watch } from 'vue'
import type { BlockComponentProps, BlockComponentEmits, EditorContext } from '../../types'

const props = defineProps<BlockComponentProps>()
const emit = defineEmits<BlockComponentEmits>()

const spanRef = ref<HTMLSpanElement | null>(null)
const editorContext = inject<EditorContext | null>('editorContext', null)

// 计算是否为空内容
const isEmpty = computed(() => !props.block.content || props.block.content.trim() === '')

// 处理内容编辑
const handleInput = (event: Event) => {
  const target = event.target as HTMLSpanElement
  const newContent = target.textContent || ''
  emit('update:content', newContent)

  // 确保更新传递给父组件
  nextTick(() => {
    // 触发父组件的 input 事件，确保 useContentEditableEvents 能捕获变化
    const inputEvent = new Event('input', { bubbles: true })
    spanRef.value?.dispatchEvent(inputEvent)
  })
}

// 处理键盘事件
const handleKeyDown = (event: KeyboardEvent) => {
  // Tab 键和箭头键导航由父组件统一处理，这里不阻止事件冒泡
  // 让事件继续传播到父组件的 handleKeyDown

  // Enter 键处理
  if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
    event.preventDefault()
    // 触发提交事件
    const submitEvent = new CustomEvent('submit', {
      detail: props.block.content,
      bubbles: true,
    })
    spanRef.value?.dispatchEvent(submitEvent)
    return
  }
}

// 聚焦到指定元素
const focusElement = (element: HTMLElement) => {
  const range = document.createRange()
  const selection = window.getSelection()

  range.selectNodeContents(element)
  range.collapse(false) // 光标移到末尾

  selection?.removeAllRanges()
  selection?.addRange(range)
}

// 处理点击事件
const handleClick = () => {
  if (isEmpty.value && spanRef.value) {
    focusElement(spanRef.value)
  }
}

// 确保组件内容与 props 同步
const updateContent = () => {
  if (spanRef.value && spanRef.value.textContent !== props.block.content) {
    spanRef.value.textContent = props.block.content
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
</script>

<template>
  <span
    ref="spanRef"
    :class="['template-field', 'editable-field', { empty: isEmpty }]"
    :data-placeholder="block.options?.placeholder"
    :contenteditable="!editorContext?.readonly"
    :data-block-type="block.type"
    :data-block-id="block.id"
    @input="handleInput"
    @keydown="handleKeyDown"
    @click="handleClick"
    >{{ block.content }}</span
  >
</template>

<style scoped>
.template-field {
  display: inline;
  background: rgba(0, 0, 0, 0.05);
  padding: 3px 8px;
  margin: 0 2px;
  border-radius: 4px;
  cursor: text;
  transition: background-color 0.2s ease;
  min-width: 60px;
  white-space: pre-wrap;
  word-break: break-all;
  word-wrap: break-word;
  box-sizing: border-box;
  overflow-wrap: break-word;
  vertical-align: baseline;
  outline: none;

  box-decoration-break: clone;
  line-height: 28px;
}

.template-field:hover {
  background-color: rgba(0, 0, 0, 0.08);
}

.template-field:focus {
  background-color: rgba(0, 123, 255, 0.1);
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.template-field.empty:before {
  content: attr(data-placeholder);
  color: rgba(0, 0, 0, 0.4);
  font-style: italic;
  pointer-events: none;
}

.template-field[contenteditable='false'] {
  background-color: rgba(0, 0, 0, 0.02);
  color: rgba(0, 0, 0, 0.4);
  cursor: not-allowed;
}
</style>
