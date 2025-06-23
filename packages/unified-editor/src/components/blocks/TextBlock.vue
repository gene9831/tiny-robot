<script setup lang="ts">
import { inject, computed, nextTick } from 'vue'
import type { BlockComponentProps, EditorContext } from '../../types'

const props = defineProps<BlockComponentProps>()

const emit = defineEmits<{
  (e: 'update:content', content: string): void
}>()

const editorContext = inject<EditorContext | null>('editorContext', null)
const isEditable = computed(() => !editorContext?.readonly)

const handleInput = (event: Event) => {
  const target = event.target as HTMLElement
  // 当可编辑内容为空时，浏览器可能会插入 <br>，需要处理
  if (target.innerHTML === '<br>') {
    emit('update:content', '')
    return
  }

  const newContent = target.innerText
  emit('update:content', newContent)

  // 确保更新传递给父组件
  nextTick(() => {
    // 触发父组件的 input 事件，确保 useContentEditableEvents 能捕获变化
    const inputEvent = new Event('input', { bubbles: true })
    target.dispatchEvent(inputEvent)
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
    event.target?.dispatchEvent(submitEvent)
    return
  }
}
</script>

<template>
  <span
    :class="['text-block']"
    :data-block-type="block.type"
    :data-block-id="block.id"
    :contenteditable="isEditable"
    @input="handleInput"
    @keydown="handleKeyDown"
    >{{ block.content }}</span
  >
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
