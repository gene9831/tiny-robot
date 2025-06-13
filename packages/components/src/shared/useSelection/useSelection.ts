import { onBeforeUnmount, Ref, shallowRef, watch } from 'vue'
import { ShadowDomSelection } from './ShadowDomSelection'

declare global {
  interface ShadowRoot {
    getSelection?: () => Selection
  }
}

const SUPPORTS_SHADOW_SELECTION = typeof window.ShadowRoot.prototype.getSelection === 'function'
const SUPPORTS_BEFORE_INPUT = typeof window.InputEvent.prototype.getTargetRanges === 'function'
const IS_FIREFOX = window.navigator.userAgent.toLowerCase().indexOf('firefox') > -1

function getActiveElement() {
  let active = document.activeElement

  while (active?.shadowRoot?.activeElement) {
    active = active.shadowRoot.activeElement
  }

  return active
}

const initialSafariShadowDomSelection = (selection: ShadowDomSelection, element: HTMLElement) => {
  let composition = false
  let insertingText = false

  // 流程1: onSelectStart -> onSelectionChange -> onBeforeInput
  // 流程2: onCompositionStart -> onCompositionEnd -> onSelectionChange -> onBeforeInput. 输入法编辑器开始新的输入合成时。例如，当用户使用拼音输入法开始输入汉字时，这个事件就会被触发

  const onSelectStart = () => {
    selection.removeAllRanges()
  }

  const onSelectionChange = () => {
    if (composition) {
      return
    }

    const active = getActiveElement()

    if (!active || !element.contains(active)) {
      selection.removeAllRanges()
      return
    }

    if (insertingText) {
      return
    }

    try {
      insertingText = true
      // 会立即触发 beforeinput 事件
      document.execCommand('insertText', false, '\u200B')
    } catch (error) {
      console.error(error)
    } finally {
      insertingText = false
    }
  }

  const onBeforeInput = (event: InputEvent) => {
    if (!insertingText) {
      return
    }

    const ranges = event.getTargetRanges()
    const range = ranges[0]

    const newRange = new Range()

    newRange.setStart(range.startContainer, range.startOffset)
    newRange.setEnd(range.endContainer, range.endOffset)

    selection.removeAllRanges()
    selection.addRange(newRange)

    event.preventDefault()
    event.stopImmediatePropagation()
  }

  const onCompositionStart = () => {
    composition = true
  }

  const onCompositionEnd = () => {
    composition = false
  }

  const shadowRoot = element.getRootNode()

  const setup = (elem: HTMLElement) => {
    shadowRoot.addEventListener('selectstart', onSelectStart, { capture: true })
    window.addEventListener('selectionchange', onSelectionChange, { capture: true })
    window.addEventListener('beforeinput', onBeforeInput, { capture: true })
    elem.addEventListener('compositionstart', onCompositionStart, { capture: true })
    elem.addEventListener('compositionend', onCompositionEnd, { capture: true })
  }

  const cleanup = (elem: HTMLElement) => {
    shadowRoot.removeEventListener('selectstart', onSelectStart, { capture: true })
    window.removeEventListener('selectionchange', onSelectionChange, { capture: true })
    window.removeEventListener('beforeinput', onBeforeInput, { capture: true })
    elem.removeEventListener('compositionstart', onCompositionStart, { capture: true })
    elem.removeEventListener('compositionend', onCompositionEnd, { capture: true })
  }

  setup(element)

  return () => cleanup(element)
}

export const useSelection = (elemRef: Ref<HTMLElement | null>) => {
  const selection = new ShadowDomSelection()
  /**
   * 当前选中的 range，如果选中的范围不在传入的 elemRef.value 中，则返回 null
   */
  const range = shallowRef<Range | null>(null)
  let getSelection: () => Selection | ShadowDomSelection | null = () => null
  let cleanup: (() => void) | undefined = undefined

  const getSelectionFactory = (element: HTMLElement): (() => Selection | ShadowDomSelection | null) => {
    const rootNode = element.getRootNode()

    // 非 shadow dom 直接使用 window.getSelection
    if (!(rootNode instanceof ShadowRoot)) {
      return () => window.getSelection()
    }

    if (SUPPORTS_SHADOW_SELECTION) {
      return () => (rootNode as ShadowRoot & Pick<Window, 'getSelection'>).getSelection()
    }

    // firefox 的 window.getSelection 可以穿透 shadow dom
    if (IS_FIREFOX && !SUPPORTS_SHADOW_SELECTION) {
      return () => window.getSelection()
    }

    if (!IS_FIREFOX && !SUPPORTS_SHADOW_SELECTION && SUPPORTS_BEFORE_INPUT) {
      cleanup = initialSafariShadowDomSelection(selection, element)
      return () => selection
    }

    return () => window.getSelection()
  }

  const onSelectionChange = () => {
    const selection = getSelection()
    const r = (selection?.rangeCount || 0) > 0 ? selection!.getRangeAt(0) : null

    // 严格判断 startContainer 和 endContainer 是否都在 elemRef.value 中
    if (r && elemRef.value && elemRef.value.contains(r.startContainer) && elemRef.value.contains(r.endContainer)) {
      range.value = r
    } else {
      range.value = null
    }
  }

  watch(elemRef, (element, _, onCleanup) => {
    if (!element) {
      return
    }

    getSelection = getSelectionFactory(element)

    onCleanup(() => {
      if (cleanup) {
        cleanup()
        cleanup = undefined
      }
    })
  })

  onBeforeUnmount(() => {
    if (cleanup) {
      cleanup()
      cleanup = undefined
    }

    document.removeEventListener('selectionchange', onSelectionChange)
  })

  document.addEventListener('selectionchange', onSelectionChange)

  return {
    range,
    getSelection: () => getSelection(),
  }
}
