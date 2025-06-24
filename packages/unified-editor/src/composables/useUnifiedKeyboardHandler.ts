import { Ref } from 'vue'
import type { ContentBlock } from '../types'
import { cleanZeroWidthSpaces, isOnlyZeroWidthSpace } from '../utils/zeroWidthUtils'

/**
 * 统一编辑器键盘事件处理选项
 */
export interface UnifiedKeyboardOptions {
  /** 编辑器DOM引用 */
  editor: Ref<HTMLDivElement | null>
  /** 内容块数组 */
  blocks: Ref<ContentBlock[]>
  /** 输入法组合状态 */
  isComposing: Ref<boolean>
  /** 是否只读 */
  readonly: Ref<boolean>
  /** 获取DOM值的方法 */
  getValueFromDOM: () => string
  /** 输入处理方法 */
  handleInput: () => void
  /** 提交事件回调 */
  onSubmit: (value: string) => void
  /** 删除块事件回调 */
  onDeleteBlock: (blockIndex: number) => void
}

/**
 * 统一编辑器键盘事件处理 Hook
 * 专门处理统一编辑器的键盘交互和自定义删除逻辑
 *
 * @param options - 键盘事件处理选项
 * @returns 键盘事件处理方法
 */
export function useUnifiedKeyboardHandler(options: UnifiedKeyboardOptions) {
  /**
   * 安全地查找块元素及其索引
   */
  const findBlockElement = (node: Node): { element: HTMLElement | null; index: number } => {
    let currentNode = node

    // 如果当前节点是文本节点，获取其父元素
    if (currentNode.nodeType === Node.TEXT_NODE) {
      currentNode = currentNode.parentNode || currentNode
    }

    // 向上查找直到找到具有 data-block-id 的元素
    while (currentNode && currentNode !== options.editor.value) {
      if (currentNode.nodeType === Node.ELEMENT_NODE && (currentNode as HTMLElement).hasAttribute?.('data-block-id')) {
        const element = currentNode as HTMLElement
        const blockId = element.getAttribute('data-block-id')

        // 尝试从 data-block-id 提取索引
        if (blockId) {
          const parts = blockId.split('-')
          if (parts.length > 1) {
            const index = parseInt(parts[1], 10)
            if (!isNaN(index)) {
              return { element, index }
            }
          }
        }

        // 如果无法从 ID 获取索引，尝试从 DOM 位置获取
        const parent = element.parentElement
        if (parent) {
          const children = Array.from(parent.children)
          const index = children.findIndex((child) => child === element)
          if (index !== -1) {
            return { element, index }
          }
        }
      }
      currentNode = currentNode.parentNode as Node
    }

    return { element: null, index: -1 }
  }

  /**
   * 处理箭头键导航
   */
  const handleArrowKeyNavigation = (event: KeyboardEvent, range: Range, editor: HTMLDivElement): boolean => {
    const { startOffset, collapsed } = range
    let startContainer = range.startContainer

    // 如果在模板字段内，获取字段元素
    if (startContainer.parentElement?.classList.contains('template-field')) {
      startContainer = startContainer.parentElement
    }

    if (!collapsed) return false // 如果有选择区域，使用默认行为

    // 判断是否在文本节点的边界
    const atTextStart = startContainer.nodeType === Node.TEXT_NODE && startOffset === 0 && event.key === 'ArrowLeft'
    const atTextEnd =
      startContainer.nodeType === Node.TEXT_NODE &&
      startOffset === (startContainer.textContent?.length || 0) &&
      event.key === 'ArrowRight'

    if (atTextStart || atTextEnd) {
      let targetNode: Node | null = null
      let targetPosition: 'before' | 'after' | 'inside' = 'inside'

      if (atTextStart) {
        // 在文本节点开头按左键
        if (
          startContainer.parentNode &&
          (startContainer.parentNode as HTMLElement).classList.contains('template-field')
        ) {
          // 当前在字段内，需要移到字段外
          targetNode = startContainer.parentNode
          targetPosition = 'before'
        } else {
          // 查找前一个节点
          let prevNode = startContainer.previousSibling
          if (!prevNode && startContainer.parentNode && startContainer.parentNode !== editor) {
            prevNode = startContainer.parentNode.previousSibling
          }

          if (
            prevNode &&
            prevNode.nodeType === Node.ELEMENT_NODE &&
            (prevNode as HTMLElement).classList.contains('template-field')
          ) {
            // 前一个节点是字段，聚焦到字段内部
            targetNode = prevNode
            targetPosition = 'inside'
          }
        }
      } else if (atTextEnd) {
        // 在文本节点末尾按右键
        if (
          startContainer.parentNode &&
          (startContainer.parentNode as HTMLElement).classList.contains('template-field')
        ) {
          // 当前在字段内，需要移到字段外
          targetNode = startContainer.parentNode
          targetPosition = 'after'
        } else {
          // 查找下一个节点
          let nextNode = startContainer.nextSibling
          if (!nextNode && startContainer.parentNode && startContainer.parentNode !== editor) {
            nextNode = startContainer.parentNode.nextSibling
          }

          if (
            nextNode &&
            nextNode.nodeType === Node.ELEMENT_NODE &&
            (nextNode as HTMLElement).classList.contains('template-field')
          ) {
            // 下一个节点是字段，聚焦到字段内部
            targetNode = nextNode
            targetPosition = 'inside'
          }
        }
      }

      if (targetNode) {
        event.preventDefault()
        const newRange = document.createRange()
        const selection = window.getSelection()
        if (!selection) return true

        if (targetPosition === 'before') {
          newRange.setStartBefore(targetNode)
        } else if (targetPosition === 'after') {
          newRange.setStartAfter(targetNode)
        } else {
          // inside
          newRange.selectNodeContents(targetNode)
          // 如果目标是向左移动，光标放在内容末尾；向右移动，光标放在内容开头
          newRange.collapse(event.key === 'ArrowLeft')
        }

        selection.removeAllRanges()
        selection.addRange(newRange)
        return true
      }
    }

    return false
  }

  /**
   * 处理Backspace键的自定义删除逻辑
   */
  const handleBackspaceKey = (event: KeyboardEvent, range: Range): boolean => {
    if (!range.collapsed) return false

    const { startContainer, startOffset } = range

    // 检查是否在零宽字符文本节点中
    if (startContainer.nodeType === Node.TEXT_NODE && isOnlyZeroWidthSpace(startContainer.textContent || '')) {
      // 在零宽字符文本节点中，查找前面的字段
      const prevSibling = startContainer.previousSibling
      if (
        prevSibling &&
        prevSibling.nodeType === Node.ELEMENT_NODE &&
        (prevSibling as HTMLElement).classList.contains('template-field')
      ) {
        const fieldElement = prevSibling as HTMLElement
        const textContent = fieldElement.textContent || ''
        const cleanContent = cleanZeroWidthSpaces(textContent)

        // 如果前面的字段为空，删除该字段
        if (!cleanContent || cleanContent.trim() === '') {
          event.preventDefault()

          // 安全地获取块元素和索引
          const { element, index } = findBlockElement(fieldElement)

          if (element && index !== -1 && index < options.blocks.value.length) {
            options.onDeleteBlock(index)
          }

          return true
        } else {
          // 如果字段有内容，将光标移到字段末尾
          event.preventDefault()
          const selection = window.getSelection()
          if (selection) {
            const newRange = document.createRange()
            newRange.selectNodeContents(fieldElement)
            newRange.collapse(false) // 光标到末尾
            selection.removeAllRanges()
            selection.addRange(newRange)
          }
          return true
        }
      }
    }

    // 判断当前是否在字段内部，且只剩一个字符即将被删除
    const isInField =
      startContainer.nodeType === Node.TEXT_NODE &&
      startContainer.parentNode &&
      (startContainer.parentNode as HTMLElement).classList.contains('template-field')

    if (isInField && startContainer.textContent) {
      const textContent = startContainer.textContent
      const cleanContent = cleanZeroWidthSpaces(textContent)

      // 检查是否是即将删除最后一个有效字符
      if (cleanContent.length === 1 && startOffset === textContent.length) {
        // 即将删除字段内最后一个有效字符，阻止默认行为
        event.preventDefault()

        // 清空字段内容
        startContainer.textContent = ''

        // 保持光标在字段内部
        const fieldElement = startContainer.parentNode as HTMLElement
        const selection = window.getSelection()
        if (selection) {
          const newRange = document.createRange()
          newRange.selectNodeContents(fieldElement)
          newRange.collapse(true) // 光标到字段开头
          selection.removeAllRanges()
          selection.addRange(newRange)
        }

        // 触发输入事件以更新值
        options.handleInput()
        return true
      }
    }

    // 情况1: 光标在字段（可能为空）的开头位置
    if (startOffset === 0) {
      let fieldElement: HTMLElement | null = null

      if (
        startContainer.nodeType === Node.ELEMENT_NODE &&
        (startContainer as HTMLElement).classList.contains('template-field')
      ) {
        fieldElement = startContainer as HTMLElement
      } else if (
        startContainer.nodeType === Node.TEXT_NODE &&
        startContainer.parentNode &&
        (startContainer.parentNode as HTMLElement).classList.contains('template-field')
      ) {
        fieldElement = startContainer.parentNode as HTMLElement
      }

      if (fieldElement) {
        const textContent = fieldElement.textContent || ''
        const cleanContent = cleanZeroWidthSpaces(textContent)

        // 如果字段为空，删除整个块
        if (!cleanContent || cleanContent.trim() === '') {
          event.preventDefault()

          // 安全地获取块元素和索引
          const { element, index } = findBlockElement(fieldElement)

          if (element && index !== -1 && index < options.blocks.value.length) {
            // 先设置光标位置，再删除块
            if (index > 0) {
              try {
                const selection = window.getSelection()
                if (selection && options.editor.value) {
                  // 找到前一个块元素
                  const blocks = Array.from(options.editor.value.children)
                  if (index - 1 < blocks.length) {
                    const prevBlock = blocks[index - 1]
                    if (prevBlock) {
                      const newRange = document.createRange()
                      newRange.selectNodeContents(prevBlock)
                      newRange.collapse(false) // 光标到末尾
                      selection.removeAllRanges()
                      selection.addRange(newRange)
                    }
                  }
                }
              } catch (e) {
                console.error('设置光标位置失败:', e)
              }
            }

            // 延迟删除，确保光标设置完成
            setTimeout(() => {
              options.onDeleteBlock(index)
            }, 0)
          }

          return true
        }
      }
    }

    return false
  }

  /**
   * 处理Delete键
   */
  const handleDeleteKey = (event: KeyboardEvent, range: Range): boolean => {
    if (!range.collapsed) return false

    const { startContainer, startOffset } = range

    // 判断当前是否在字段内部，且在字段文本的末尾
    const isInField =
      startContainer.nodeType === Node.TEXT_NODE &&
      startContainer.parentNode &&
      (startContainer.parentNode as HTMLElement).classList.contains('template-field')

    if (isInField && startContainer.textContent) {
      const textContent = startContainer.textContent
      const cleanContent = cleanZeroWidthSpaces(textContent)

      // 检查是否在末尾且即将删除最后一个有效字符
      if (startOffset === textContent.length && cleanContent.length === 1) {
        // 即将从末尾删除字段内最后一个有效字符，阻止默认行为
        event.preventDefault()

        // 清空字段内容
        startContainer.textContent = ''

        // 保持光标在字段内部
        const fieldElement = startContainer.parentNode as HTMLElement
        const selection = window.getSelection()
        if (selection) {
          const newRange = document.createRange()
          newRange.selectNodeContents(fieldElement)
          newRange.collapse(true) // 光标到字段开头
          selection.removeAllRanges()
          selection.addRange(newRange)
        }

        // 触发输入事件以更新值
        options.handleInput()
        return true
      }
    }

    return false
  }

  /**
   * 处理统一编辑器的键盘按键事件
   */
  const handleUnifiedKeyDown = (event: KeyboardEvent) => {
    if (options.isComposing.value || options.readonly.value) return

    const editor = options.editor.value
    if (!editor) return

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)

    // 处理 Ctrl+Enter 或 Cmd+Enter 提交
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault()
      options.onSubmit(options.getValueFromDOM())
      return
    }

    // 处理普通 Enter 键
    if (event.key === 'Enter' && !event.ctrlKey && !event.metaKey) {
      event.preventDefault()
      options.onSubmit(options.getValueFromDOM())
      return
    }

    // 处理左右箭头键导航
    if ((event.key === 'ArrowLeft' || event.key === 'ArrowRight') && !event.shiftKey) {
      if (handleArrowKeyNavigation(event, range, editor)) {
        return
      }
    }

    // 处理Backspace键
    if (event.key === 'Backspace') {
      if (handleBackspaceKey(event, range)) {
        return
      }
    }

    // 处理Delete键
    if (event.key === 'Delete') {
      if (handleDeleteKey(event, range)) {
        return
      }
    }
  }

  return {
    handleUnifiedKeyDown,
  }
}
