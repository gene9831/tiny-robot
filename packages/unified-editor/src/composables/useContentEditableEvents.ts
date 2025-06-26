import type { Ref } from 'vue'
import type { EditorEventHandlers } from '../types'
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
   * 这里不处理具体的数据更新，只做一些全局的清理工作
   */
  const handleInput = () => {
    if (!editorRef.value) return

    const selection = window.getSelection()
    if (!selection?.anchorNode) return

    let targetNode = selection.anchorNode
    if (targetNode.nodeType === Node.TEXT_NODE) {
      targetNode = targetNode.parentElement!
    }

    const blockElement = (targetNode as HTMLElement).closest<HTMLElement>('[data-block-index]')

    if (blockElement) {
      const blockIndexStr = blockElement.dataset.blockIndex
      if (blockIndexStr) {
        const blockIndex = parseInt(blockIndexStr, 10)
        const newContent = blockElement.textContent || ''
        const oldContent = dataSync.getBlockContent(blockIndex)

        if (oldContent !== newContent) {
          dataSync.updateBlockContent(blockIndex, newContent)
        }
      }
    }

    // 清理浏览器自动插入的多余标签
    cleanupDOM()
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
    cleanupDOM, // 暴露清理方法供外部调用
  }
}
