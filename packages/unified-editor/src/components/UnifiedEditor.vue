<script setup lang="ts">
import { ref, computed, markRaw } from 'vue'
import type { UnifiedEditorProps, UnifiedEditorEmits, ContentBlock, RenderBlock } from '../types'

// 导入组件
import TextBlock from './blocks/TextBlock.vue'
import TemplateBlock from './blocks/TemplateBlock.vue'

// 导入 composables
import { useContentEditableEvents } from '../composables/useContentEditableEvents'
import { useBlockDataSync } from '../composables/useBlockDataSync'

const props = withDefaults(defineProps<UnifiedEditorProps>(), {
  editorClass: '',
  readonly: false,
})

const emit = defineEmits<UnifiedEditorEmits>()

// 内部状态
const editorRef = ref<HTMLDivElement | null>(null)

// 使用数据同步管理
const dataSync = useBlockDataSync(
  computed(() => props.modelValue),
  (event: 'update:modelValue', value: ContentBlock[]) => {
    emit(event, value)
  },
)

const { handleInput, handlePaste, handleKeyDown: handleBlockKeyDown } = useContentEditableEvents(editorRef, dataSync)

// 将用户数据转换为渲染块
const renderBlocks = computed<RenderBlock[]>(() => {
  return dataSync.internalBlocks.value.map((block, index) => ({
    id: `block-${index}`,
    type: block.type,
    content: block.content,
    options: block.options || {},
    isEditable: block.type === 'template',
    component: getComponentForType(block.type),
  }))
})

// 根据类型选择组件
const getComponentForType = (type: ContentBlock['type']) => {
  const componentMap = {
    text: markRaw(TextBlock),
    template: markRaw(TemplateBlock),
  }
  return componentMap[type] || markRaw(TextBlock)
}

// 键盘处理 - 只保留基本的提交功能
const handleKeyDown = (event: KeyboardEvent) => {
  // 优先处理块级别的键盘事件（例如，防止删除空的模板块）
  handleBlockKeyDown(event)

  // 如果事件已经被块处理器阻止，则不执行后续逻辑
  if (event.defaultPrevented) {
    return
  }

  if (props.readonly) return

  // 处理 Ctrl+Enter 或 Cmd+Enter 提交
  if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
    event.preventDefault()
    const value = dataSync.getAllContent()
    emit('submit', value)
    return
  }

  // 处理普通 Enter 键
  if (event.key === 'Enter' && !event.ctrlKey && !event.metaKey) {
    event.preventDefault()
    const value = dataSync.getAllContent()
    emit('submit', value)
    return
  }
}

// 暴露方法给父组件
defineExpose({
  focus: () => editorRef.value?.focus(),
  getContent: () => dataSync.getAllContent(),
  reset: () => dataSync.reset(),
})
</script>

<template>
  <div
    ref="editorRef"
    :class="['unified-editor', editorClass, { 'is-readonly': readonly }]"
    contenteditable="true"
    @keydown="handleKeyDown"
    @paste="handlePaste"
    @input="handleInput"
  >
    <component
      v-for="(block, index) in renderBlocks"
      :index="index"
      :key="index"
      :is="block.component"
      :block="block"
    />
  </div>
</template>

<style lang="less" scoped>
.unified-editor {
  width: 100%;
  min-height: 26px;
  font-size: 16px;
  line-height: 2.5;
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
}

/* 响应式设计 */
@media (max-width: 768px) {
  .unified-editor {
    padding: 6px 10px;
    font-size: 16px; /* 防止移动端缩放 */
  }
}
</style>
