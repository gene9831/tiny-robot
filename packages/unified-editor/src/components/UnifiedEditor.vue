<script setup lang="ts">
import { ref, computed, watch, provide, markRaw } from 'vue'
import type { UnifiedEditorProps, UnifiedEditorEmits, ContentBlock, RenderBlock } from '../types'

// 导入组件
import TextBlock from './blocks/TextBlock.vue'
import EditableBlock from './blocks/EditableBlock.vue'

// 导入 composables
import { useUnifiedSelection } from '../composables/useUnifiedSelection'
import { useKeyboardNavigation } from '../composables/useKeyboardNavigation'
import { useContentEditableEvents } from '../composables/useContentEditableEvents'

const props = withDefaults(defineProps<UnifiedEditorProps>(), {
  editorClass: '',
  readonly: false,
  placeholder: '开始输入内容...',
})

const emit = defineEmits<UnifiedEditorEmits>()

// 内部状态
const editorRef = ref<HTMLDivElement | null>(null)
const internalBlocks = ref<ContentBlock[]>([...props.modelValue])

// 使用选区管理 composable
const selection = useUnifiedSelection(editorRef, internalBlocks)

// 使用键盘导航 composable
const keyboard = useKeyboardNavigation(selection, () => {
  // 提交回调
  const content = internalBlocks.value.map((b) => b.content).join('')
  emit('submit', content)
})

// 使用内容编辑事件处理 composable
const contentEvents = useContentEditableEvents(
  editorRef,
  internalBlocks,
  (newBlocks) => {
    // 更新内部状态并发射更新事件
    internalBlocks.value = [...newBlocks]
    emit('update:modelValue', [...newBlocks])
  },
  (content) => {
    // 提交回调
    emit('submit', content)
  },
)

const handleClick = (event: MouseEvent) => {
  // 编辑器容器点击处理
  contentEvents.handleClick(event)
  emit('click', event)
}

const handleFocus = (event: FocusEvent) => {
  contentEvents.handleFocus(event)
  emit('focus', event)
}

const handleBlur = (event: FocusEvent) => {
  contentEvents.handleBlur(event)
  emit('blur', event)
}

// 监听外部数据变化
watch(
  () => props.modelValue,
  (newValue) => {
    internalBlocks.value = [...newValue]
  },
  { deep: true },
)

// 将用户数据转换为渲染块
const renderBlocks = computed<RenderBlock[]>(() => {
  return internalBlocks.value.map((block, index) => ({
    id: `block-${index}`,
    type: block.type,
    content: block.content,
    options: block.options || {},
    isEditable: block.type === 'editable',
    component: getComponentForType(block.type),
  }))
})

// 根据类型选择组件
const getComponentForType = (type: ContentBlock['type']) => {
  const componentMap = {
    text: markRaw(TextBlock),
    editable: markRaw(EditableBlock),
  }
  return componentMap[type] || markRaw(TextBlock)
}

// 处理块内容更新
const handleBlockUpdate = (blockIndex: number, newContent: string) => {
  if (blockIndex >= 0 && blockIndex < internalBlocks.value.length) {
    internalBlocks.value[blockIndex].content = newContent
    emit('update:modelValue', [...internalBlocks.value])
  }
}

// 处理删除块事件
const handleDeleteBlock = (blockIndex: number) => {
  if (blockIndex >= 0 && blockIndex < internalBlocks.value.length) {
    // 删除指定索引的块
    const newBlocks = [...internalBlocks.value]
    newBlocks.splice(blockIndex, 1)

    internalBlocks.value = newBlocks
    emit('update:modelValue', [...newBlocks])

    // 聚焦到合适的位置
    setTimeout(() => {
      focusAfterDelete(blockIndex)
    }, 0)
  }
}

// 删除后的聚焦处理
const focusAfterDelete = (deletedIndex: number) => {
  const fields = selection.getAllEditableFields()
  if (fields.length === 0) return

  // 聚焦到删除位置的前一个或后一个可编辑字段
  let targetIndex = Math.max(0, deletedIndex - 1)
  if (targetIndex >= fields.length) {
    targetIndex = fields.length - 1
  }

  selection.focusField(targetIndex)
}

// 计算是否显示占位符
const showPlaceholder = computed(() => {
  return (
    internalBlocks.value.length === 0 || (internalBlocks.value.length === 1 && !internalBlocks.value[0].content.trim())
  )
})

// 提供编辑器上下文
provide('editorContext', {
  readonly: props.readonly,
  onBlockUpdate: handleBlockUpdate,
  navigateField: selection.navigateField,
  focusField: selection.focusField,
  getAllEditableFields: selection.getAllEditableFields,
  getCurrentFieldIndex: selection.getCurrentFieldIndex,
})

// 暴露方法给父组件
defineExpose({
  focus: () => editorRef.value?.focus(),
  getContent: () => internalBlocks.value.map((b) => b.content).join(''),
})
</script>

<template>
  <div
    ref="editorRef"
    :class="['unified-editor', editorClass, { 'is-readonly': readonly, 'is-empty': showPlaceholder }]"
    :contenteditable="!readonly"
    tabindex="0"
    :data-placeholder="placeholder"
    @keydown="keyboard.handleKeyDown"
    @input="contentEvents.handleInput"
    @click="handleClick"
    @focus="handleFocus"
    @blur="handleBlur"
    @delete-block="(event: CustomEvent) => handleDeleteBlock(event.detail.index)"
  >
    <component
      v-for="(block, index) in renderBlocks"
      :key="block.id"
      :is="block.component"
      :block="block"
      :index="index"
      @update:content="(content: string) => handleBlockUpdate(index, content)"
    />
  </div>
</template>

<style scoped>
.unified-editor {
  min-height: 32px;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  outline: none;
  font-size: 14px;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-word;
  cursor: text;
  background: white;
  box-sizing: border-box;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
  text-align: left;
}

.unified-editor:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.unified-editor.is-readonly {
  background-color: #f8f9fa;
  cursor: default;
}

.unified-editor.is-empty:before {
  content: attr(data-placeholder);
  color: #999;
  font-style: italic;
}

/* 继承原有的 template-field 样式 */
.unified-editor :deep(.template-field) {
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
}

.unified-editor :deep(.template-field:hover) {
  background-color: rgba(0, 0, 0, 0.08);
}

.unified-editor :deep(.template-field.empty:before) {
  content: attr(data-placeholder);
  color: rgba(0, 0, 0, 0.4);
  font-style: italic;
  position: absolute;
  pointer-events: none;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .unified-editor {
    padding: 6px 10px;
    font-size: 16px; /* 防止移动端缩放 */
  }
}
</style>
