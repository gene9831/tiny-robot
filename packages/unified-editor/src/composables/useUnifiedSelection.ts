import { ref, computed, nextTick, Ref } from 'vue'
import type { ContentBlock, Selection } from '../types'

/**
 * 一个 Composable，用于管理编辑器内部的选区和焦点状态。
 * @param editorRef - 编辑器根元素的引用。
 * @param blocks - 内容块数据的引用。
 */
export function useUnifiedSelection(editorRef: Ref<HTMLElement | null>, blocks: Ref<ContentBlock[]>) {
  // 内部选区状态
  const currentSelection = ref<Selection>({
    isActive: false,
    blockIndex: -1,
    offset: 0,
  })

  // 获取所有可编辑字段（DOM 元素）
  const getAllEditableFields = () => {
    if (!editorRef.value) return []
    return Array.from(editorRef.value.querySelectorAll('.template-field, .text-block[contenteditable="true"]'))
  }

  // 获取当前聚焦的字段索引
  const getCurrentFieldIndex = () => {
    const activeElement = document.activeElement
    const fields = getAllEditableFields()
    return fields.findIndex((field) => field === activeElement || field.contains(activeElement))
  }

  // 计算所有可编辑块的索引
  const editableBlockIndices = computed(() => {
    return blocks.value
      .map((block, index) => ({ block, index }))
      .filter(({ block }) => block.type !== 'text')
      .map(({ index }) => index)
  })

  // 计算所有可编辑字段的索引（包括文本块）
  const allEditableFieldIndices = computed(() => {
    return blocks.value
      .map((block, index) => ({ block, index }))
      .filter(({ block }) => ['editable', 'dropdown', 'date', 'number', 'text'].includes(block.type))
      .map(({ index }) => index)
  })

  // 聚焦到指定字段（DOM 元素）
  const focusField = (index: number) => {
    const fields = getAllEditableFields()
    if (index >= 0 && index < fields.length) {
      const field = fields[index] as HTMLElement
      field.focus()

      // 设置光标位置
      const range = document.createRange()
      const selection = window.getSelection()

      range.selectNodeContents(field)
      range.collapse(false) // 光标移到末尾

      selection?.removeAllRanges()
      selection?.addRange(range)
    }
  }

  // 导航到下一个/上一个字段
  const navigateField = (direction: 'next' | 'prev') => {
    const currentIndex = getCurrentFieldIndex()
    if (currentIndex === -1) return

    const fields = getAllEditableFields()
    let nextIndex: number

    if (direction === 'next') {
      nextIndex = currentIndex + 1
      if (nextIndex >= fields.length) nextIndex = 0 // 循环到第一个
    } else {
      nextIndex = currentIndex - 1
      if (nextIndex < 0) nextIndex = fields.length - 1 // 循环到最后一个
    }

    focusField(nextIndex)
  }

  // 检查光标是否在字段边界
  const isCursorAtStart = (): boolean => {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return false
    const range = sel.getRangeAt(0)
    return range.startOffset === 0 && range.collapsed
  }

  const isCursorAtEnd = (element?: HTMLElement): boolean => {
    const activeElement = element || (document.activeElement as HTMLElement)
    if (!activeElement || !activeElement.textContent) return false

    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return false

    const range = sel.getRangeAt(0)
    const textLength = activeElement.textContent.length

    return range.endOffset === textLength && range.collapsed
  }

  /**
   * 激活编辑器，并聚焦到第一个可编辑块。
   */
  const activateEditor = () => {
    currentSelection.value.isActive = true
    if (editableBlockIndices.value.length > 0) {
      setSelection(editableBlockIndices.value[0])
    } else if (blocks.value.length > 0) {
      setSelection(0)
    }
  }

  /**
   * 停用编辑器，清除选区状态。
   */
  const deactivateEditor = () => {
    currentSelection.value.isActive = false
    currentSelection.value.blockIndex = -1
  }

  /**
   * 查找指定索引的块元素
   */
  const findBlockElement = (index: number): HTMLElement | null => {
    if (!editorRef.value) return null

    // 尝试多种选择器以找到正确的块元素
    const selectors = [
      `[data-block-index="${index}"]`,
      `span[data-block-index="${index}"]`,
      `div[data-block-index="${index}"]`,
      `*[data-block-index="${index}"]`,
    ]

    for (const selector of selectors) {
      const el = editorRef.value.querySelector(selector)
      if (el) return el as HTMLElement
    }

    console.warn(`找不到索引为 ${index} 的块元素`)
    return null
  }

  /**
   * 设置选区到指定的块和位置。
   * @param index - 要选中的块的索引。
   * @param offset - 光标在块内的位置。
   */
  const setSelection = async (index: number, offset?: number) => {
    if (index >= 0 && index < blocks.value.length) {
      currentSelection.value.blockIndex = index
      currentSelection.value.isActive = true

      await nextTick()

      const blockEl = findBlockElement(index)
      if (blockEl) {
        console.log('找到块元素:', blockEl)

        // 尝试聚焦元素本身
        try {
          blockEl.focus()
        } catch (e) {
          console.warn('无法聚焦块元素', e)
        }

        // 尝试设置光标位置
        try {
          const targetNode = blockEl.firstChild || blockEl
          const finalOffset = offset ?? (targetNode.textContent?.length || 0)

          console.log('设置光标位置:', {
            targetNode,
            finalOffset,
            textContent: targetNode.textContent,
          })

          const range = document.createRange()
          const sel = window.getSelection()

          range.setStart(targetNode, Math.min(finalOffset, targetNode.textContent?.length || 0))
          range.collapse(true)
          sel?.removeAllRanges()
          sel?.addRange(range)
        } catch (e) {
          console.error('无法设置光标位置', e)
        }
      } else {
        console.error('找不到块元素，无法设置选区')
      }
    }
  }

  /**
   * 选中下一个可编辑的块。
   */
  const selectNext = () => {
    const currentIndex = currentSelection.value.blockIndex
    const currentEditableIndex = editableBlockIndices.value.indexOf(currentIndex)

    if (currentEditableIndex < editableBlockIndices.value.length - 1) {
      setSelection(editableBlockIndices.value[currentEditableIndex + 1])
    }
  }

  /**
   * 选中上一个可编辑的块。
   */
  const selectPrev = () => {
    const currentIndex = currentSelection.value.blockIndex
    const currentEditableIndex = editableBlockIndices.value.indexOf(currentIndex)

    if (currentEditableIndex > 0) {
      const prevIndex = editableBlockIndices.value[currentEditableIndex - 1]
      const prevBlock = blocks.value[prevIndex]
      setSelection(prevIndex, prevBlock.content.length)
    }
  }

  return {
    currentSelection,
    activateEditor,
    deactivateEditor,
    setSelection,
    selectNext,
    selectPrev,
    editableBlockIndices,
    allEditableFieldIndices,
    getAllEditableFields,
    getCurrentFieldIndex,
    focusField,
    navigateField,
    isCursorAtStart,
    isCursorAtEnd,
  }
}
