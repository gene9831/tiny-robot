# 自定义编辑器 (Unified Editor)

一个基于 Vue 3 的现代化内容编辑器，采用 ContentEditable + 动态组件的混合架构，提供流畅的编辑体验和灵活的内容类型支持。

### 解决方案
**ContentEditable + 动态组件的混合架构**
- 统一的 contenteditable 容器保证流畅的编辑体验
- 动态 Vue 组件提供灵活的内容类型支持
- 智能的键盘事件处理和光标管理
- 自适应的样式系统和零宽字符处理
- 数据驱动的响应式更新机制

## 数据模型

### 核心类型定义

```typescript
// 内容类型
export type ContentType = 'text' | 'editable'

/**
 * 内容块 - 用户传入的数据结构
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
  /** 占位符文本 */
  placeholder?: string
}

/**
 * 编辑器事件
 */
export interface UnifiedEditorEmits {
  'update:modelValue': [value: ContentBlock[]]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
  click: [event: MouseEvent]
  submit: [value: string]
}
```

### 基础使用

```vue
<template>
  <UnifiedEditor
    v-model="content"
    placeholder="开始输入内容..."
    editor-class="my-editor"
    @submit="handleSubmit"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import UnifiedEditor from '@tiny-robot/unified-editor'
import type { ContentBlock } from '@tiny-robot/unified-editor'
import { createTextBlock, createEditableBlock } from '@tiny-robot/unified-editor'

const content = ref<ContentBlock[]>([
  createTextBlock('你好'),
  createEditableBlock('张三', '请输入姓名'),
  createTextBlock('，欢迎使用编辑器！'),
])

const handleSubmit = (value: string) => {
  console.log('提交内容:', value)
}
</script>
```

### 工具函数

```typescript
import {
  createTextBlock,
  createEditableBlock,
  blocksToText,
  migrateFromTemplate
} from 'unified-editor/src/migration/templateMigration'

// 创建文本块
const textBlock = createTextBlock('静态文本')

// 创建可编辑块
const editableBlock = createEditableBlock('初始值', '请输入内容')

// 将块数组转换为纯文本
const text = blocksToText(content.value)

// 从模板字符串迁移
const blocks = migrateFromTemplate({
  template: '你好[姓名]，欢迎使用[产品]！',
  initialValues: {
    姓名: '张三',
    产品: 'TinyRobot'
  }
})
```

## 架构设计

### 核心架构：ContentEditable + 动态组件

```vue
<!-- 核心模板结构 -->
<div
  contenteditable="true"
  ref="editorRef"
  @keydown="unifiedKeyboard.handleUnifiedKeyDown"
  @input="contentEvents.handleInput"
  @compositionstart="handleCompositionStart"
  @compositionend="handleCompositionEnd"
>
  <component
    v-for="(block, index) in renderBlocks"
    :key="getStableBlockId(block)"
    :is="block.component"
    :block="block"
    :index="index"
    @update:content="handleBlockUpdate"
  />
</div>
```

### ID 设计

```typescript
// 生成唯一 ID 的计数器
let blockIdCounter = 0
const generateBlockId = () => `block-${Date.now()}-${++blockIdCounter}`

// 为每个块维护稳定的 ID 映射
const blockIdMap = new WeakMap<ContentBlock, string>()

// 获取或生成块的稳定 ID
const getStableBlockId = (block: ContentBlock): string => {
  if (!blockIdMap.has(block)) {
    blockIdMap.set(block, generateBlockId())
  }
  return blockIdMap.get(block)!
}

// 将用户数据转换为渲染块
const renderBlocks = computed<RenderBlock[]>(() => {
  return internalBlocks.value.map((block) => ({
    id: getStableBlockId(block), // 使用稳定的 ID
    type: block.type,
    content: block.content,
    options: block.options || {},
    isEditable: block.type === 'editable',
    component: getComponentForType(block.type),
  }))
})

// 根据类型自动选择组件（使用 markRaw 避免响应式包装）
const getComponentForType = (type: ContentBlock['type']) => {
  const componentMap = {
    text: markRaw(TextBlock),
    editable: markRaw(EditableBlock),
  }
  return componentMap[type] || markRaw(TextBlock)
}
```

### 键盘事件处理系统

```typescript
// 统一键盘处理器
const unifiedKeyboard = useUnifiedKeyboardHandler({
  editor: editorRef,
  blocks: internalBlocks,
  isComposing,
  readonly: computed(() => props.readonly),
  getValueFromDOM: () => internalBlocks.value.map((b) => b.content).join(''),
  handleInput: () => {
    contentEvents.handleInput()
  },
  onSubmit: (value: string) => {
    emit('submit', value)
  },
  onDeleteBlock: handleDeleteBlock,
  onMergeWithPrevious: handleMergeWithPrevious,
  onUpdateBlock: handleBlockUpdate,
})

// 处理块内容更新
const handleBlockUpdate = (blockIndex: number, newContent: string) => {
  if (blockIndex >= 0 && blockIndex < internalBlocks.value.length) {
    internalBlocks.value[blockIndex].content = newContent
    emit('update:modelValue', [...internalBlocks.value])
  }
}

// 通过 provide/inject 提供编辑器上下文
provide('editorContext', {
  readonly: props.readonly,
  onBlockUpdate: handleBlockUpdate
})
```

## 其他功能
### 零宽字符管理

```typescript
// 确保字段周围有零宽字符，用于光标定位
const ensureZeroWidthAroundField = (fieldElement: HTMLElement) => {
  // 在字段前后添加零宽字符，确保光标能正确定位
}

// 清理多余的零宽字符
const cleanupZeroWidthNodes = (container: HTMLElement) => {
  // 批量删除连续的零宽字符，避免DOM操作冲突
}
```

### 自适应样式系统

```typescript
// 根据内容自动调整字段宽度
const setFieldWidth = (fieldElement: HTMLElement, content: string) => {
  const cleanContent = cleanZeroWidthSpaces(content)

  if (!cleanContent || cleanContent.trim() === '') {
    // 空内容时根据 placeholder 计算宽度
    const placeholder = fieldElement.getAttribute('data-placeholder') || ''
    if (placeholder) {
      setFieldWidthByText(fieldElement, placeholder, true)
    }
  } else {
    // 有内容时根据实际内容计算宽度
    setFieldWidthByText(fieldElement, cleanContent, false)
  }
}
```

## 组件设计

### 文本块组件（TextBlock.vue）

```vue
<script setup lang="ts">
import type { BlockComponentProps } from '../../types'

defineProps<BlockComponentProps>()
</script>

<template>
  <span class="text-block">{{ block.content }}</span>
</template>

<style scoped>
.text-block {
  display: inline;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: inherit;
}
</style>
```

### 可编辑块组件（EditableBlock.vue）

```vue
<template>
  <span
    ref="spanRef"
    class="template-field"
    :data-placeholder="block.options?.placeholder"
    :data-block-type="block.type"
    :data-block-id="block.id"
    :contenteditable="!editorContext?.readonly"
    @input="handleInput"
  >{{ block.content }}</span>
</template>
```

## API 文档

### 组件 Props

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `modelValue` | `ContentBlock[]` | `[]` | 内容块数组 |
| `readonly` | `boolean` | `false` | 是否只读模式 |
| `placeholder` | `string` | `''` | 占位符文本 |
| `editorClass` | `string` | `''` | 编辑器自定义样式类 |

### 组件事件

| 事件名 | 参数 | 描述 |
|--------|------|------|
| `update:modelValue` | `ContentBlock[]` | 内容更新时触发 |
| `submit` | `string` | 按 Enter 键提交时触发 |
| `focus` | `FocusEvent` | 编辑器获得焦点时触发 |
| `blur` | `FocusEvent` | 编辑器失去焦点时触发 |
| `click` | `MouseEvent` | 点击编辑器时触发 |

### 组件方法

| 方法名 | 参数 | 返回值 | 描述 |
|--------|------|--------|------|
| `focus()` | - | `void` | 聚焦到编辑器 |
| `getContent()` | - | `string` | 获取纯文本内容 |
| `updateFieldWidths()` | - | `void` | 更新所有字段宽度 |


## 存在问题

### 1. 不按照顺序删除编辑块时、或者复制粘贴后，浏览器控制台报错 

vue.js?v=2437d1e2:10509 Uncaught (in promise) TypeError: Cannot read properties of null (reading 'insertBefore')


### 2. 样式相关问题: 
#### 2.1 编辑块组件 有内容 和 无内容时，高度不一致，导致编辑块组件高度跳动

  主要体现在 `.template-field` 的 display: inline 和 `.template-field:empty` 的 display: inline-block 的差异

  
  如果要通过修改编辑块的 display 属性来对齐两种状态的高度、则在样式方面无法对齐设计规范，如最直观的导致 换行 问题


#### 2.2 编辑块组件无法和普通文本水平对齐、编辑块组件通过键盘导航时，光标会出现下沉的情况