import type { Ref } from 'vue'
import type { ContentBlock, EditorEventHandlers } from '../types'
import { cleanZeroWidthSpaces, cleanupZeroWidthNodes } from '../utils/zeroWidthUtils'

/**
 * ContentEditable 事件处理
 */
export function useContentEditableEvents(
  editorRef: Ref<HTMLElement | null>,
  onUpdate: (blocks: ContentBlock[]) => void,
): EditorEventHandlers {
  /**
   * 处理 contenteditable 的 input 事件
   */
  const handleInput = () => {
    if (!editorRef.value) return

    // 清理多余的零宽字符节点
    cleanupZeroWidthNodes(editorRef.value)

    // 从 DOM 解析回数据结构
    const newBlocks = parseContentFromDOM(editorRef.value)
    onUpdate(newBlocks)
  }

  /**
   * 处理点击事件 - 特殊字段交互
   */
  const handleClick = (_event: MouseEvent) => {
    // 编辑器点击事件处理
  }

  /**
   * 处理聚焦事件
   */
  const handleFocus = (_event: FocusEvent) => {
    // 编辑器获得焦点时的处理
  }

  /**
   * 处理失焦事件
   */
  const handleBlur = (_event: FocusEvent) => {
    // 编辑器失去焦点时的处理
  }

  /**
   * 从 DOM 解析内容回数据结构（数据驱动的核心）
   */
  const parseContentFromDOM = (container: HTMLElement): ContentBlock[] => {
    const blocks: ContentBlock[] = []
    const blockElements = container.querySelectorAll('[data-block-id]')

    blockElements.forEach((element) => {
      const blockType = element.getAttribute('data-block-type') as ContentBlock['type']
      const blockId = element.getAttribute('data-block-id') || ''

      // 获取内容并清理零宽字符
      let content = element.textContent || ''
      content = cleanZeroWidthSpaces(content)

      const block: ContentBlock = {
        id: blockId,
        type: blockType || 'text',
        content,
        options: {},
      }

      // 恢复选项配置
      if (blockType === 'editable') {
        block.options!.placeholder = element.getAttribute('data-placeholder') || ''
      }

      blocks.push(block)
    })

    return blocks
  }

  return {
    handleInput,
    handleClick,
    handleFocus,
    handleBlur,
  }
}
