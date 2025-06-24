<script setup lang="ts">
import { ref, computed, watch, provide, markRaw, nextTick } from 'vue'
import type { UnifiedEditorProps, UnifiedEditorEmits, ContentBlock, RenderBlock } from '../types'

// 导入组件
import TextBlock from './blocks/TextBlock.vue'
import EditableBlock from './blocks/EditableBlock.vue'

// 导入 composables
import { useUnifiedSelection } from '../composables/useUnifiedSelection'
import { useContentEditableEvents } from '../composables/useContentEditableEvents'
import { useUnifiedKeyboardHandler } from '../composables/useUnifiedKeyboardHandler'

const props = withDefaults(defineProps<UnifiedEditorProps>(), {
  editorClass: '',
  readonly: false,
  placeholder: '开始输入内容...',
})

const emit = defineEmits<UnifiedEditorEmits>()

// 内部状态
const editorRef = ref<HTMLDivElement | null>(null)
const internalBlocks = ref<ContentBlock[]>([...props.modelValue])
const isComposing = ref(false)

// 使用选区管理 composable
const selection = useUnifiedSelection(editorRef, internalBlocks)

// 使用内容编辑事件处理 composable
const contentEvents = useContentEditableEvents(editorRef, (newBlocks) => {
  // 更新内部状态并触发更新事件
  internalBlocks.value = [...newBlocks]
  emit('update:modelValue', [...newBlocks])
})

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
    // 使用 nextTick 确保 DOM 操作完成后再更新数据
    nextTick(() => {
      // 再次检查索引有效性，防止并发删除
      if (blockIndex >= 0 && blockIndex < internalBlocks.value.length) {
        // 删除指定索引的块
        const newBlocks = [...internalBlocks.value]
        newBlocks.splice(blockIndex, 1)

        // 如果删除后数组为空，添加一个空的文本块
        if (newBlocks.length === 0) {
          const newBlock = {
            id: `empty-${Date.now()}`,
            type: 'text' as const,
            content: '',
            options: {},
          }
          newBlocks.push(newBlock)
        }

        internalBlocks.value = newBlocks
        emit('update:modelValue', [...newBlocks])
      }
    })
  }
}

// 设置统一键盘处理器
const unifiedKeyboard = useUnifiedKeyboardHandler({
  editor: editorRef,
  blocks: internalBlocks,
  isComposing,
  readonly: computed(() => props.readonly),
  getValueFromDOM: () => internalBlocks.value.map((b) => b.content).join(''),
  handleInput: () => {
    // 触发输入处理
    contentEvents.handleInput()
  },
  onSubmit: (value: string) => {
    emit('submit', value)
  },
  onDeleteBlock: (blockIndex: number) => {
    handleDeleteBlock(blockIndex)
  },
})

// 输入法组合事件处理
const handleCompositionStart = () => {
  isComposing.value = true
}

const handleCompositionEnd = () => {
  isComposing.value = false
}

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
    :class="['unified-editor', editorClass, { 'is-readonly': readonly }]"
    :contenteditable="!readonly"
    tabindex="0"
    :data-placeholder="placeholder"
    @keydown="unifiedKeyboard.handleUnifiedKeyDown"
    @input="contentEvents.handleInput"
    @click="handleClick"
    @focus="handleFocus"
    @blur="handleBlur"
    @compositionstart="handleCompositionStart"
    @compositionend="handleCompositionEnd"
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

<style lang="less" scoped>
.unified-editor {
  width: 100%;
  min-height: 26px;
  font-size: 16px;
  line-height: 26px;
  border-radius: 4px;
  word-break: break-word;
  word-wrap: break-word;
  /* 保持空格和换行符 */
  white-space: pre-wrap;
  outline: none;
  display: block;
  box-sizing: border-box;
  /* 确保长单词可以折行 */
  overflow-wrap: break-word;
  /* 确保文本左对齐 */
  text-align: left;

  &.is-readonly {
    border-color: #ced4da;
    cursor: default;
  }

  /* 确保所有内联元素垂直居中对齐 */
  * {
    vertical-align: baseline;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .unified-editor {
    padding: 6px 10px;
    font-size: 16px; /* 防止移动端缩放 */
  }
}
</style>
