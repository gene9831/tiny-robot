import type { useUnifiedSelection } from './useUnifiedSelection'

type SelectionManager = ReturnType<typeof useUnifiedSelection>

/**
 * 一个 Composable，封装了编辑器所有的键盘导航逻辑。
 * @param selection - 从 useUnifiedSelection 返回的选区管理器。
 * @param onSubmit - 当用户按下 Ctrl/Cmd + Enter 时触发的回调。
 */
export function useKeyboardNavigation(selection: SelectionManager, onSubmit: () => void) {
  // 处理跨块的左右箭头导航
  const handleArrowNavigation = (event: KeyboardEvent) => {
    const activeElement = document.activeElement as HTMLElement
    if (!activeElement) return false

    const windowSelection = window.getSelection()
    if (!windowSelection || windowSelection.rangeCount === 0) return false

    const range = windowSelection.getRangeAt(0)
    const text = activeElement.textContent || ''

    if (event.key === 'ArrowRight') {
      // 在字段末尾按右箭头，跳转到下一个字段
      if (range.startOffset === text.length && range.collapsed) {
        event.preventDefault()
        selection.navigateField('next')
        return true
      }
    } else if (event.key === 'ArrowLeft') {
      // 在字段开头按左箭头，跳转到上一个字段
      if (range.startOffset === 0 && range.collapsed) {
        event.preventDefault()
        selection.navigateField('prev')
        return true
      }
    }

    return false
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    // 处理左右箭头键导航
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      if (handleArrowNavigation(event)) {
        return // 已处理，不继续传播
      }
    }

    // Tab 键导航
    if (event.key === 'Tab') {
      event.preventDefault()
      selection.navigateField(event.shiftKey ? 'prev' : 'next')
      return
    }

    // 全局快捷键处理
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault()
      onSubmit()
      return
    }

    // 其他键盘事件可以在这里扩展
    // 例如：Escape 键退出编辑模式等
    if (event.key === 'Escape') {
      event.preventDefault()
      selection.deactivateEditor()
      return
    }
  }

  return {
    handleKeyDown,
    handleArrowNavigation,
  }
}
