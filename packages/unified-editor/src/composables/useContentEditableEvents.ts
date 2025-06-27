import type { Ref } from 'vue'
import { useSelection } from '@opentiny/tiny-robot'
import type { EditorEventHandlers } from '../types'
import { isZWS } from '../utils/contentHelpers'
import { useBlockDataSync } from './useBlockDataSync'

/**
 * ContentEditable 事件处理
 */
export function useContentEditableEvents(
  editorRef: Ref<HTMLElement | null>,
  dataSync: ReturnType<typeof useBlockDataSync>,
): EditorEventHandlers {
  /**
   * 处理编辑器级别的 input 事件
   */
  const handleInput = () => {
    if (!editorRef.value) return

    // 构建 DOM 的当前状态 Map
    const domBlockElements = editorRef.value.querySelectorAll<HTMLElement>('[data-block-index]')
    const domBlockMap = new Map<number, { content: string; element: HTMLElement }>()
    domBlockElements.forEach((element) => {
      const blockIndexStr = element.dataset.blockIndex
      if (blockIndexStr) {
        const blockIndex = parseInt(blockIndexStr, 10)
        let content = element.innerText || ''
        if (isZWS(content)) {
          content = ''
        }
        domBlockMap.set(blockIndex, { content, element })
      }
    })

    // 将数据模型与 DOM 状态进行协调
    dataSync.internalBlocks.value.forEach((modelBlock, index) => {
      const domBlock = domBlockMap.get(index)

      if (domBlock) {
        // DOM 中存在该块，检查内容是否不匹配
        if (modelBlock.content !== domBlock.content) {
          dataSync.updateBlockContent(index, domBlock.content)
        }
      } else {
        // DOM 中不存在该块，说明它可能已被删除
        if (modelBlock.content !== '') {
          dataSync.updateBlockContent(index, '')
        }
      }
    })

    // 清理浏览器自动插入的多余标签
    cleanupDOM()
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Backspace' && event.key !== 'Delete') {
      return
    }

    const selection = useSelection(editorRef).getSelection() as Selection | null
    if (!selection?.anchorNode || selection.rangeCount === 0) {
      return
    }

    const range = selection.getRangeAt(0)
    const container = range.commonAncestorContainer
    const blockElement = (container instanceof Element ? container : container.parentElement)?.closest<HTMLElement>(
      '[data-block-index]',
    )

    if (!blockElement || blockElement.dataset.blockType !== 'template') {
      return
    }

    const currentContent = blockElement.innerText
    const selectedText = selection.toString()
    let isAboutToBeEmptied = false

    // Case 1: 全部内容被选中删除
    if (selectedText.length > 0 && selectedText.length === currentContent.length) {
      isAboutToBeEmptied = true
    }
    // Case 2: 单个字符被删除
    else if (range.collapsed && currentContent.length === 1) {
      isAboutToBeEmptied = true
    }

    if (isAboutToBeEmptied) {
      const blockIndexStr = blockElement.dataset.blockIndex
      if (blockIndexStr) {
        const blockIndex = parseInt(blockIndexStr, 10)

        // 如果模型中内容已经为空，则不进行任何操作
        if (dataSync.getBlockContent(blockIndex) === '') {
          return
        }

        // 阻止浏览器删除 span 节点
        event.preventDefault()

        // 手动更新模型
        dataSync.updateBlockContent(blockIndex, '')
      }
    }
  }

  const handlePaste = (event: ClipboardEvent) => {
    event.preventDefault()
    const text = event.clipboardData?.getData('text/plain') || ''
    document.execCommand('insertText', false, text)
  }

  /**
   * 清理浏览器自动插入的多余标签
   * 这是唯一允许的 DOM 操作，用于维护 DOM 结构的整洁
   */
  const cleanupDOM = () => {
    if (!editorRef.value) return

    // 清理浏览器自动插入的空 <br> 标签
    const emptyBrs = editorRef.value.querySelectorAll('br:only-child')
    emptyBrs.forEach((br) => {
      if (br.parentElement && br.parentElement.textContent?.trim() === '') {
        br.remove()
      }
    })

    // 清理空的 <div> 或 <p> 标签
    const emptyDivs = editorRef.value.querySelectorAll('div:empty, p:empty')
    emptyDivs.forEach((div) => div.remove())
  }

  return {
    handleInput,
    handlePaste,
    handleKeyDown,
    cleanupDOM,
  }
}
