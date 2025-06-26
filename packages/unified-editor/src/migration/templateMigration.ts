import { ref } from 'vue'
import type { ContentBlock } from '../types'
import {
  parseTemplate,
  blocksToText,
  createTextBlock,
  createEditableBlock,
  generateUniqueId,
} from '../utils/contentHelpers'

/**
 * 模板参数接口（兼容现有 TemplateEditor）
 */
export interface SetTemplateParams {
  template: string
  initialValues?: Record<string, string>
}

/**
 * 模板迁移配置
 */
export interface TemplateMigrationConfig {
  /** 模板字符串，使用 [占位符] 语法 */
  template: string
  /** 初始值映射 */
  initialValues?: Record<string, string>
}

/**
 * 将现有模板格式转换为新的内容块格式
 */
export function migrateFromTemplate(config: TemplateMigrationConfig): ContentBlock[] {
  const { template, initialValues = {} } = config
  const blocks: ContentBlock[] = []

  // 解析模板
  const regex = /\[([^\]]+)\]/g
  let lastIndex = 0
  let match

  while ((match = regex.exec(template)) !== null) {
    // 添加前面的文本
    if (match.index > lastIndex) {
      const textContent = template.slice(lastIndex, match.index)
      if (textContent) {
        blocks.push(createTextBlock(textContent))
      }
    }

    // 获取字段名和初始值
    const fieldName = match[1]
    const initialValue = initialValues[fieldName] || ''

    // 添加可编辑字段
    blocks.push(createEditableBlock(initialValue, fieldName))

    lastIndex = regex.lastIndex
  }

  // 添加剩余的文本
  if (lastIndex < template.length) {
    const textContent = template.slice(lastIndex)
    if (textContent) {
      blocks.push(createTextBlock(textContent))
    }
  }

  return blocks
}

/**
 * 将内容块格式转换回模板格式
 */
export const migrateToTemplate = (blocks: ContentBlock[]): SetTemplateParams => {
  const initialValues: Record<string, string> = {}

  const template = blocks
    .map((block) => {
      if (block.type === 'template' && block.options?.placeholder) {
        const placeholder = block.options.placeholder
        if (block.content) {
          initialValues[placeholder] = block.content
        }
        return `[${placeholder}]`
      }
      return block.content
    })
    .join('')

  return {
    template,
    initialValues: Object.keys(initialValues).length > 0 ? initialValues : undefined,
  }
}

/**
 * 兼容性包装器 - 保持现有 API
 */
export const createCompatibleEditor = () => {
  const blocks = ref<ContentBlock[]>([])

  const setTemplate = (params: SetTemplateParams) => {
    blocks.value = migrateFromTemplate(params)
  }

  const getValue = (): string => {
    return blocksToText(blocks.value)
  }

  const getTemplate = (): SetTemplateParams => {
    return migrateToTemplate(blocks.value)
  }

  const resetFields = () => {
    blocks.value.forEach((block) => {
      if (block.type === 'template') {
        block.content = ''
      }
    })
  }

  const activateFirstField = () => {
    // 这个方法需要在组件实例中实现
    console.warn('activateFirstField should be called on the component instance')
  }

  return {
    blocks,
    setTemplate,
    getValue,
    getTemplate,
    resetFields,
    activateFirstField,
  }
}

/**
 * 从现有 TemplateEditor 的值解析内容块
 */
export const parseTemplateValue = (
  template: string,
  value: string,
  initialValues?: Record<string, string>,
): ContentBlock[] => {
  const blocks = parseTemplate(template)

  // 尝试从 value 中提取实际内容
  // 这是一个简化的实现，实际可能需要更复杂的解析逻辑
  let valueIndex = 0

  blocks.forEach((block) => {
    // 确保每个块都有唯一ID
    if (!block.id) {
      block.id = generateUniqueId()
    }

    if (block.type === 'text') {
      // 跳过文本块的长度
      valueIndex += block.content.length
    } else if (block.type === 'template') {
      // 尝试提取可编辑块的内容
      const placeholder = block.options?.placeholder
      if (placeholder && initialValues?.[placeholder]) {
        block.content = initialValues[placeholder]
        valueIndex += block.content.length
      } else {
        // 从 value 中提取内容（简化实现）
        const remainingValue = value.slice(valueIndex)
        const nextTextBlock = blocks.find((b) => blocks.indexOf(b) > blocks.indexOf(block) && b.type === 'text')

        if (nextTextBlock) {
          const nextTextIndex = remainingValue.indexOf(nextTextBlock.content)
          if (nextTextIndex !== -1) {
            block.content = remainingValue.slice(0, nextTextIndex)
            valueIndex += block.content.length
          }
        } else {
          // 最后一个可编辑块，取剩余所有内容
          block.content = remainingValue
        }
      }
    }
  })

  return blocks
}

/**
 * 批量迁移多个模板
 */
export const batchMigrateTemplates = (templates: SetTemplateParams[]): ContentBlock[][] => {
  return templates.map((template) => migrateFromTemplate(template))
}

/**
 * 验证模板迁移结果
 */
export const validateMigration = (
  original: SetTemplateParams,
  migrated: ContentBlock[],
): { valid: boolean; errors: string[] } => {
  const errors: string[] = []

  // 检查是否能正确转换回原始格式
  const backConverted = migrateToTemplate(migrated)

  if (backConverted.template !== original.template) {
    errors.push('Template structure mismatch after migration')
  }

  // 检查初始值是否保持一致
  if (original.initialValues) {
    Object.entries(original.initialValues).forEach(([key, value]) => {
      const migratedBlock = migrated.find((block) => block.type === 'template' && block.options?.placeholder === key)

      if (!migratedBlock) {
        errors.push(`Missing template block for placeholder: ${key}`)
      } else if (migratedBlock.content !== value) {
        errors.push(`Content mismatch for placeholder ${key}: expected "${value}", got "${migratedBlock.content}"`)
      }
    })
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
