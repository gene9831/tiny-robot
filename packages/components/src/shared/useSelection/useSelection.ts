import { onBeforeUnmount, Ref, watch } from 'vue'
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

  const onSelectStart = () => {
    console.log('onSelectStart')
    selection.removeAllRanges()
  }

  const onSelectionChange = () => {
    if (composition) {
      return
    }

    const active = getActiveElement()

    if (!active || active !== element) {
      selection.removeAllRanges()
      return
    }

    if (insertingText) {
      return
    }

    console.log('insertingText')

    insertingText = true
    // 会触发 beforeinput 事件
    document.execCommand('insertText', false, '\u200B')

    insertingText = false
  }

  const onBeforeInput = (event: InputEvent) => {
    if (!insertingText) {
      return
    }

    console.log('onBeforeInput')

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
    console.log('onCompositionStart')
    composition = true
  }

  const onCompositionEnd = () => {
    console.log('onCompositionEnd')
    composition = false
  }

  const setup = (elem: HTMLElement) => {
    window.addEventListener('selectstart', onSelectStart, { capture: true })
    window.addEventListener('selectionchange', onSelectionChange, { capture: true })
    window.addEventListener('beforeinput', onBeforeInput, { capture: true })
    elem.addEventListener('compositionstart', onCompositionStart, { capture: true })
    elem.addEventListener('compositionend', onCompositionEnd, { capture: true })
  }

  const cleanup = (elem: HTMLElement) => {
    window.removeEventListener('selectstart', onSelectStart, { capture: true })
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

  let getSelection: () => Selection | ShadowDomSelection | null = () => null

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
  })

  return {
    getSelection: () => getSelection(),
  }
}
