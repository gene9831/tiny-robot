import type { Component } from 'vue'

/**
 * 内容类型枚举
 */
export type ContentType = 'text' | 'template'

/**
 * 用户传入的内容块
 */
export interface ContentBlock {
  /** 唯一标识符 */
  id: string
  /** 内容类型 */
  type: ContentType
  /** 显示内容/初始值 */
  content: string
  /** 可选配置 */
  options?: {
    placeholder?: string
    style?: Record<string, unknown>
    disabled?: boolean
  }
}

/**
 * 编辑器 Props
 */
export interface UnifiedEditorProps {
  /** 内容块数组 */
  modelValue: ContentBlock[]
  /** 全局样式类名 */
  editorClass?: string
  /** 是否只读 */
  readonly?: boolean
}

/**
 * 编辑器事件
 */
export interface UnifiedEditorEmits {
  'update:modelValue': [value: ContentBlock[]]
  submit: [value: string]
}

/**
 * 选区状态（简化版）
 */
export interface SelectionState {
  isActive: boolean // 是否激活状态
  range?: Range // 当前选区范围
}

/**
 * 内容解析结果
 */
export interface ParsedContent {
  blocks: ContentBlock[]
  html: string
}

/**
 * 渲染块 - 用于组件渲染
 */
export interface RenderBlock {
  /** 块ID */
  id: string
  /** 块类型 */
  type: ContentType
  /** 内容 */
  content: string
  /** 是否可编辑 */
  isEditable: boolean
  /** 选项 */
  options: {
    placeholder?: string
    style?: Record<string, unknown>
    disabled?: boolean
  }
  /** 组件 */
  component: Component
}

/**
 * 编辑器事件处理器
 */
export interface EditorEventHandlers {
  handleInput: () => void
  handlePaste: (e: ClipboardEvent) => void
  cleanupDOM: () => void
  handleKeyDown: (e: KeyboardEvent) => void
}

/**
 * 块组件 Props
 */
export interface BlockComponentProps {
  block: RenderBlock
  index: number
  isActive?: boolean
}

/**
 * 选区状态
 */
export interface Selection {
  isActive: boolean
  blockIndex: number
  offset: number // 光标在块内的位置
}

/**
 * 编辑器暴露的方法
 */
export interface UnifiedEditorExposed {
  focus: () => void
  blur: () => void
  getContent: () => string
}
