// 主组件
export { default as UnifiedEditor } from './components/UnifiedEditor.vue'

// 块组件
export { default as TextBlock } from './components/blocks/TextBlock.vue'
export { default as EditableBlock } from './components/blocks/EditableBlock.vue'

// 类型定义
export type {
  ContentType,
  ContentBlock,
  UnifiedEditorProps,
  UnifiedEditorEmits,
  SelectionState,
  ParsedContent,
  EditorEventHandlers,
  RenderBlock,
  BlockComponentProps,
} from './types'

// Composables
export { useContentEditableEvents } from './composables/useContentEditableEvents'

// 工具函数
export {
  createTextBlock,
  createEditableBlock,
  parseTemplate,
  blocksToText,
  blocksToTemplate,
  mergeTextBlocks,
  cleanEmptyBlocks,
  validateBlocks,
  cloneBlocks,
} from './utils/contentHelpers'

// 迁移工具
export {
  migrateFromTemplate,
  migrateToTemplate,
  createCompatibleEditor,
  parseTemplateValue,
  batchMigrateTemplates,
  validateMigration,
} from './migration/templateMigration'

export type { SetTemplateParams } from './migration/templateMigration'
