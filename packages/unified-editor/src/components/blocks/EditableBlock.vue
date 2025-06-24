<script setup lang="ts">
import { ref, inject, computed, nextTick, watch, onMounted } from 'vue'
import type { BlockComponentProps, BlockComponentEmits, EditorContext } from '../../types'
import { cleanZeroWidthSpaces, ensureZeroWidthAroundField } from '../../utils/zeroWidthUtils'

const props = defineProps<BlockComponentProps>()
const emit = defineEmits<BlockComponentEmits>()

const spanRef = ref<HTMLSpanElement | null>(null)
const editorContext = inject<EditorContext | null>('editorContext', null)
const isEmptyState = ref(true) // 显式跟踪空状态

// 计算是否为空内容
const isEmpty = computed(() => isEmptyState.value)

// 检查并更新空状态
const updateEmptyState = () => {
  if (!spanRef.value) {
    isEmptyState.value = !props.block.content || props.block.content.trim() === ''
    return
  }

  const content = spanRef.value.textContent || ''
  const cleanContent = cleanZeroWidthSpaces(content)
  isEmptyState.value = !cleanContent || cleanContent.trim() === ''

  // 手动添加/移除empty类，确保CSS选择器正确匹配
  if (isEmptyState.value) {
    spanRef.value.classList.add('empty')
  } else {
    spanRef.value.classList.remove('empty')
  }
}

// 处理内容编辑
const handleInput = (event: Event) => {
  const target = event.target as HTMLSpanElement
  let newContent = target.textContent || ''

  // 清理零宽字符后再提交更新
  newContent = cleanZeroWidthSpaces(newContent)
  emit('update:content', newContent)

  // 更新空状态
  updateEmptyState()

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

  // 如果按下了退格键或删除键，并且内容为空，则更新空状态
  if ((event.key === 'Backspace' || event.key === 'Delete') && spanRef.value) {
    nextTick(() => {
      updateEmptyState()
    })
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

    // 更新空状态
    updateEmptyState()

    // 确保字段周围有零宽字符
    nextTick(() => {
      if (spanRef.value) {
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

// 处理失焦事件
const handleBlur = () => {
  updateEmptyState()
}

// 组件挂载后确保零宽字符并更新状态
onMounted(() => {
  if (spanRef.value) {
    ensureZeroWidthAroundField(spanRef.value)
    updateEmptyState()
  }
})
</script>

<template>
  <span
    ref="spanRef"
    :class="['template-field', 'editable-field', { empty: isEmpty }]"
    :data-placeholder="block.options?.placeholder || '请输入内容'"
    :contenteditable="!editorContext?.readonly"
    :data-block-type="block.type"
    :data-block-id="block.id"
    @input="handleInput"
    @keydown="handleKeyDown"
    @click="handleClick"
    @blur="handleBlur"
    >{{ block.content }}</span
  >
</template>

<style lang="less">
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
  position: relative; // 确保相对定位
  min-height: 28px; // 确保有最小高度

  box-decoration-break: clone;
  line-height: 28px;
  &:hover {
    background-color: rgba(0, 0, 0, 0.08);
  }

  &:focus {
    background-color: rgba(0, 123, 255, 0.1);
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }

  &.empty:before {
    content: attr(data-placeholder);
    color: rgba(0, 0, 0, 0.4);
    font-style: italic;
    pointer-events: none;
    position: absolute;
    left: 8px;
    top: 50%;
    transform: translateY(-50%);
  }

  &[contenteditable='false'] {
    background-color: rgba(0, 0, 0, 0.02);
    color: rgba(0, 0, 0, 0.4);
    cursor: not-allowed;
  }
}
</style>
