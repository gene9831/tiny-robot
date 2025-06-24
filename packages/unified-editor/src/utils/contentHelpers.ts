import type { ContentBlock } from '../types'

/**
 * 生成唯一ID
 */
export const generateUniqueId = (): string => {
  return `block-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * 创建文本块
 */
export const createTextBlock = (content: string): ContentBlock => ({
  id: generateUniqueId(),
  type: 'text',
  content,
})

/**
 * 创建可编辑块
 */
export const createEditableBlock = (content: string = '', placeholder?: string): ContentBlock => ({
  id: generateUniqueId(),
  type: 'editable',
  content,
  options: { placeholder },
})

/**
 * 从模板字符串解析内容块
 * 支持 [占位符] 语法
 */
export const parseTemplate = (template: string): ContentBlock[] => {
  const blocks: ContentBlock[] = []
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

    // 添加可编辑字段
    blocks.push(createEditableBlock('', match[1]))
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
 * 将内容块数组转换为纯文本
 */
export const blocksToText = (blocks: ContentBlock[]): string => {
  return blocks.map((block) => block.content).join('')
}

/**
 * 将内容块数组转换为模板字符串
 * 可编辑块转换为 [占位符] 格式
 */
export const blocksToTemplate = (blocks: ContentBlock[]): string => {
  return blocks
    .map((block) => {
      if (block.type === 'editable' && block.options?.placeholder) {
        return `[${block.options.placeholder}]`
      }
      return block.content
    })
    .join('')
}

/**
 * 合并相邻的文本块
 */
export const mergeTextBlocks = (blocks: ContentBlock[]): ContentBlock[] => {
  const merged: ContentBlock[] = []

  for (const block of blocks) {
    const lastBlock = merged[merged.length - 1]

    if (lastBlock && lastBlock.type === 'text' && block.type === 'text') {
      // 合并相邻的文本块
      lastBlock.content += block.content
    } else {
      merged.push({ ...block })
    }
  }

  return merged
}

/**
 * 清理空的内容块
 */
export const cleanEmptyBlocks = (blocks: ContentBlock[]): ContentBlock[] => {
  return blocks.filter((block) => {
    // 保留非文本块，即使内容为空
    if (block.type !== 'text') {
      return true
    }
    // 只移除完全为空的文本块
    return block.content.trim() !== ''
  })
}

/**
 * 验证内容块数组
 */
export const validateBlocks = (blocks: ContentBlock[]): { valid: boolean; errors: string[] } => {
  const errors: string[] = []

  blocks.forEach((block, index) => {
    // 检查必需字段
    if (!block.type) {
      errors.push(`Block ${index}: missing type`)
    }

    if (block.content === undefined || block.content === null) {
      errors.push(`Block ${index}: missing content`)
    }
  })

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * 深度克隆内容块数组
 */
export const cloneBlocks = (blocks: ContentBlock[]): ContentBlock[] => {
  return blocks.map((block) => ({
    ...block,
    options: block.options ? { ...block.options } : undefined,
  }))
}

/**
 * 计算 placeholder 宽度
 */
export const calculatePlaceholderWidth = (placeholderText: string) => {
  const text = placeholderText

  // 基本字符宽度估算 (em单位)
  const defaultMinWidthEm = 2

  // 根据字符数估算宽度 (中文字符约为1em，英文字符约为0.6em)
  const chineseCharCount = (text.match(/[\u4e00-\u9fa5]/g) || []).length
  const otherCharCount = text.length - chineseCharCount

  // 计算估计宽度 (中文1em/字，其他0.6em/字)
  const estimatedWidth = chineseCharCount + otherCharCount * 0.6

  // 添加一些额外空间用于内边距
  const paddingEm = 1

  // 计算最终宽度，确保至少有最小宽度
  const minWidthEm = Math.max(defaultMinWidthEm, Math.ceil(estimatedWidth) + paddingEm)

  // 设置最大宽度限制
  const maxWidthEm = 20

  return {
    minWidth: `${minWidthEm}em`,
    useMaxWidth: minWidthEm > maxWidthEm,
    maxWidth: `${maxWidthEm}em`,
  }
}
