import type { Ref } from 'vue'
import type { ContentBlock, EditorEventHandlers } from '../types'

/**
 * ContentEditable 事件处理
 */
export function useContentEditableEvents(
  editorRef: Ref<HTMLElement | null>,
  blocks: Ref<ContentBlock[]>,
  onUpdate: (blocks: ContentBlock[]) => void,
  onSubmit?: (value: string) => void,
): EditorEventHandlers {
  /**
   * 处理 contenteditable 的 input 事件
   */
  const handleInput = () => {
    if (!editorRef.value) return

    // 从 DOM 解析回数据结构
    const newBlocks = parseContentFromDOM(editorRef.value)
    onUpdate(newBlocks)
  }

  /**
   * 处理特殊键盘事件
   */
  const handleKeyDown = (event: KeyboardEvent) => {
    const { key, ctrlKey, metaKey, shiftKey } = event

    // Tab 键：跳转到下一个可编辑字段
    if (key === 'Tab') {
      event.preventDefault()
      navigateToNextField(shiftKey)
      return
    }

    // Enter 键：提交或换行
    if (key === 'Enter' && (ctrlKey || metaKey)) {
      event.preventDefault()
      const content = blocks.value.map((b) => b.content).join('')
      onSubmit?.(content)
      return
    }
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
      const content = element.textContent || ''

      const block: ContentBlock = {
        type: blockType,
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

  /**
   * 导航到下一个可编辑字段
   */
  const navigateToNextField = (reverse: boolean = false) => {
    if (!editorRef.value) return

    const editableFields = editorRef.value.querySelectorAll('[data-block-type="editable"]')
    if (editableFields.length === 0) return

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const currentElement = selection.getRangeAt(0).startContainer.parentElement?.closest('[data-block-type]')
    if (!currentElement) return

    const currentIndex = Array.from(editableFields).indexOf(currentElement as Element)
    let nextIndex = reverse ? currentIndex - 1 : currentIndex + 1

    if (nextIndex < 0) nextIndex = editableFields.length - 1
    if (nextIndex >= editableFields.length) nextIndex = 0

    const nextField = editableFields[nextIndex] as HTMLElement
    focusElement(nextField)
  }

  /**
   * 聚焦到指定元素
   */
  const focusElement = (element: HTMLElement) => {
    const range = document.createRange()
    const selection = window.getSelection()

    range.selectNodeContents(element)
    range.collapse(false) // 光标移到末尾

    selection?.removeAllRanges()
    selection?.addRange(range)
  }

  return {
    handleInput,
    handleKeyDown,
    handleClick,
    handleFocus,
    handleBlur,
  }
}
