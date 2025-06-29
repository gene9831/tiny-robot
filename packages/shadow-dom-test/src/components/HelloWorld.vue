<template>
  <div class="editor-container">
    <div
      contenteditable="true"
      ref="editorRef"
      class="editor"
      @beforeinput="handleBeforeInput"
      @compositionend="handleCompositionEnd"
      @paste="handlePaste"
    >
      <component v-for="(node, index) in data" :key="index" :is="node.component" v-bind="node" :id="node.id" />
    </div>
    <div style="margin-block: 10px">
      <button @click="showSelection">显示selection</button>
    </div>
    <textarea style="width: 100%; height: 400px" readonly v-model="str"></textarea>
  </div>
</template>

<script setup lang="ts">
import { computed, markRaw, nextTick, type Ref, ref } from 'vue'
import Block from './Block.vue'
import Text from './Text.vue'

declare global {
  interface Selection {
    getComposedRanges?: (options?: { shadowRoots: ShadowRoot[] } | ShadowRoot) => Range[]
  }
  interface ShadowRoot {
    getSelection?: () => Selection
  }
}

const SUPPORTS_SHADOW_SELECTION = typeof window.ShadowRoot.prototype.getSelection === 'function'
const SUPPORTS_COMPOSED_RANGES = typeof window.Selection.prototype.getComposedRanges === 'function'

function isSafari() {
  const ua = navigator.userAgent
  const isSafari = ua.includes('Safari') && !ua.includes('Chrome') && !ua.includes('Chromium') && !ua.includes('CriOS')
  return isSafari
}

const isSafariBrowser = isSafari()

interface DataBlock {
  id: string
  type: 'block' | 'text'
  component: typeof Block | typeof Text
  content: string
}

const getComponent = (type: 'block' | 'text') => {
  if (type === 'block') {
    return markRaw(Block)
  }
  return markRaw(Text)
}

const randomId = () => Math.random().toString(36).substring(2, 15)

const dataList: Pick<DataBlock, 'type' | 'content'>[] = (
  [
    {
      type: 'block',
      content: '',
    },
    {
      type: 'text',
      content: 'Welcome to Vue!',
    },
    {
      type: 'block',
      content: '普通文本右侧、模板左侧',
    },
    {
      type: 'block',
      content: '模板右侧',
    },
    {
      type: 'text',
      content: 'Hello world!',
    },
    {
      type: 'block',
      content: '模板中间',
    },
    {
      type: 'text',
      content: 'Hello world!',
    },
    {
      type: 'block',
      content: '',
    },
  ] as const
).map((item) => ({
  ...item,
  ...(item.type === 'block'
    ? {
        prefix: isSafariBrowser ? { outside: true } : true,
        suffix: isSafariBrowser ? true : { outside: true },
      }
    : {}),
}))

const data: Ref<DataBlock[]> = ref(
  dataList.map((item) => ({
    ...item,
    id: randomId(),
    component: getComponent(item.type),
  })),
)

const str = computed(() =>
  JSON.stringify(
    data.value.map(({ component: _, ...rest }) => rest),
    null,
    2,
  ),
)

const editorRef = ref<HTMLDivElement | null>(null)

// const history = useUndoRedo([])

// 查找祖先节点中有 data-id 的元素
const findAncestorWithDataId = (node: Node, topElement: HTMLElement = document.body): HTMLElement | null => {
  if (!topElement.contains(node)) {
    return null
  }

  if (node instanceof HTMLElement && node.dataset.id) {
    return node
  }
  return node.parentElement ? findAncestorWithDataId(node.parentElement, topElement) : null
}

const isText = (el: HTMLElement) => el.dataset.type === 'text'
const isDelimiter = (el: HTMLElement) => el.dataset.type === 'template-prefix' || el.dataset.type === 'template-suffix'

const findElementFrom = (
  anchor: Node,
  condition: (el: HTMLElement) => boolean,
  topEl: HTMLElement = document.body,
  direction: 'next' | 'previous',
): HTMLElement | null => {
  const walker = document.createTreeWalker(topEl, NodeFilter.SHOW_ELEMENT, {
    acceptNode(node) {
      return node instanceof HTMLElement && condition(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP
    },
  })

  walker.currentNode = anchor

  if (direction === 'next') {
    return walker.nextNode() as HTMLElement | null
  } else {
    return walker.previousNode() as HTMLElement | null
  }
}

const getSelectionRange = (el: Element) => {
  const selection = window.getSelection()

  if (!selection) {
    return null
  }

  const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null
  const rootNode = el.getRootNode()

  // 非 shadow dom，直接使用 selection.getRangeAt(0)
  if (!(rootNode instanceof ShadowRoot)) {
    return range
  }

  // 下面是 shadow dom 的逻辑

  // chrome 和 safari 都支持 getComposedRanges，可以穿透 shadow dom。不过参数结构稍有不同
  // MDN 文档中描述的参数结构在 chrome 中可行。https://developer.mozilla.org/en-US/docs/Web/API/Selection/getComposedRanges
  // safari 使用是直接传入 shadowRoot。来源：https://github.com/WebKit/WebKit/blob/main/LayoutTests/fast/shadow-dom/selection-getComposedRanges.html
  if (SUPPORTS_COMPOSED_RANGES) {
    const composedRanges = selection.getComposedRanges!(isSafariBrowser ? rootNode : { shadowRoots: [rootNode] })
    return composedRanges?.[0] ?? null
  }

  if (SUPPORTS_SHADOW_SELECTION) {
    const shadowSelection = rootNode.getSelection!()
    return shadowSelection.rangeCount > 0 ? shadowSelection.getRangeAt(0) : null
  }

  return range
}

// document.addEventListener('selectionchange', () => {
//   console.log(getSelectionRange(editorRef.value!))
// })

const setCaretPosition = (el: Element, offset: number) => {
  if (!el.firstChild || el.firstChild.nodeType !== Node.TEXT_NODE) {
    console.warn('el.firstChild is not a text node. set anchor and focus to the element with offset 0', el)
    window.getSelection()?.setBaseAndExtent(el, 0, el, 0)
    console.log(getSelectionRange(editorRef.value!))
    return
  }

  // TODO firefox 设置光标位置可能报错
  // 英文文档中描述了此方法可以穿透 shadow dom，中文文档没有这些描述。https://developer.mozilla.org/en-US/docs/Web/API/Selection/setBaseAndExtent
  window.getSelection()?.setBaseAndExtent(el.firstChild, offset, el.firstChild, offset)
  console.log(getSelectionRange(editorRef.value!))
}

const insertTextAroundDelimiter = (delimiterEl: HTMLElement, direction: 'previous' | 'next', inputData: string) => {
  const isPrevious = direction === 'previous'
  const textEl = findElementFrom(delimiterEl, isText, editorRef.value!, direction)

  if (textEl) {
    // 目标元素存在时的处理
    const block = data.value.find((item) => item.id === textEl.dataset.id)
    if (block) {
      // 根据方向决定插入位置
      block.content = isPrevious ? block.content + inputData : inputData + block.content
    }

    nextTick(() => {
      // 根据方向计算光标位置
      const offset = isPrevious ? textEl.textContent!.length + inputData.length : inputData.length
      setCaretPosition(textEl, offset)
    })
  } else {
    // 目标元素不存在时创建新元素
    const id = randomId()
    const newBlock: DataBlock = {
      type: 'text',
      content: inputData,
      id,
      component: markRaw(Text),
    }

    // 根据方向决定插入位置
    if (isPrevious) {
      data.value.unshift(newBlock)
    } else {
      data.value.push(newBlock)
    }

    nextTick(() => {
      const newTextEl = editorRef.value!.querySelector(`[data-id="${id}"]`)
      if (newTextEl) {
        setCaretPosition(newTextEl, inputData.length)
      }
    })
  }
}

const insertTextBetweenTexts = (
  startEl: HTMLElement,
  endEl: HTMLElement,
  inputData: string,
  startOffset: number,
  endOffset: number,
) => {
  const startBlockIndex = data.value.findIndex((item) => item.id === startEl.dataset.id)
  const endBlockIndex = data.value.findIndex((item) => item.id === endEl.dataset.id)

  if (startBlockIndex === -1 || endBlockIndex === -1 || startBlockIndex > endBlockIndex) {
    console.warn('something wrong', { startEl, endEl, startBlockIndex, endBlockIndex })
    return
  }

  const startBlock = data.value[startBlockIndex]
  const endBlock = data.value[endBlockIndex]

  if (startBlockIndex === endBlockIndex) {
    startBlock.content = startBlock.content.slice(0, startOffset) + inputData + startBlock.content.slice(endOffset)
  } else {
    startBlock.content = startBlock.content.slice(0, startOffset) + inputData
    endBlock.content = endBlock.content.slice(endOffset)
    // 删除中间的 block
    data.value = data.value.slice(0, startBlockIndex + 1).concat(data.value.slice(endBlockIndex))
  }
  // 去掉空 text block
  data.value = data.value.filter((item) => !(item.type === 'text' && item.content.length === 0))

  nextTick(() => {
    setCaretPosition(startEl, startOffset + inputData.length)
  })
}

type NewRange = {
  startEl: HTMLElement
  endEl: HTMLElement
  startOffset: number
  endOffset: number
  collapsed: boolean
}

const handleBeforeInput = (e: Event) => {
  const ev = e as InputEvent
  e.preventDefault()

  showSelection()

  const { inputType } = ev
  const inputData = ev.data || ev.dataTransfer?.getData('text/plain')
  console.log({ inputType, inputData })

  const range = ev.getTargetRanges()[0] as StaticRange | undefined
  console.log(
    'range startContainer',
    range?.startContainer.parentElement,
    `"${range?.startContainer.textContent}"`,
    range?.startOffset,
  )
  console.log(
    'range endContainer',
    range?.endContainer.parentElement,
    `"${range?.endContainer.textContent}"`,
    range?.endOffset,
  )

  // https://w3c.github.io/input-events/#overview
  // 1. isnert. 有 data 或者 dataTransfer 的 inputType
  // - 🚧 insertText 插入文本。TODO 两个分隔符中间插入文本
  // - ⏳ insertCompositionText 无法 preventDefault 拦截
  // - ✅ insertFromPaste
  // - ❌ insertFromPasteAsQuotation 粘贴为引用，很少见的功能。不处理
  // - ❌ insertFromDrop 不处理
  // - ✅ insertReplacementText 通常出现在：自动更正、输入建议（autocomplete）、拼写纠错、操作系统层面的文字替换
  // - ✅ insertFromYank 剪贴板中粘贴最近剪切的内容，很少见。视为 insertFromPaste 处理

  // 2. delete
  // - ✅ deleteContentBackward
  // - ✅ deleteContentForward
  // - ✅ deleteWordBackward
  // - ✅ deleteWordForward
  // - ✅ deleteSoftLineBackward
  // - ✅ deleteSoftLineForward
  // - ✅ deleteByCut

  // 3. ⏳ history 使用快捷键处理
  // - historyUndo
  // - historyRedo

  if (!range) {
    console.warn('range is null', range)
    return
  }

  if (isEditor(range.startContainer) && isEditor(range.endContainer) && inputData) {
    // 输入框为空，直接插入
    const id = randomId()
    data.value.push({
      type: 'text',
      content: inputData,
      id,
      component: markRaw(Text),
    })

    nextTick(() => {
      const newTextEl = editorRef.value!.querySelector(`[data-id="${id}"]`)
      if (newTextEl) {
        setCaretPosition(newTextEl, inputData.length)
      }
    })
    return
  }

  const startEl = findAncestorWithDataId(range.startContainer, editorRef.value!)
  const endEl = findAncestorWithDataId(range.endContainer, editorRef.value!)

  if (!(startEl && endEl)) {
    console.warn('range.startEl or range.endEl is null', { range, startEl, endEl })
    return
  }

  const newRange: NewRange = {
    startEl,
    endEl,
    startOffset: range.startOffset,
    endOffset: range.endOffset,
    collapsed: range.collapsed,
  }

  if (
    inputData &&
    (inputType === 'insertText' ||
      inputType === 'insertFromPaste' ||
      inputType === 'insertFromYank' ||
      inputType === 'insertReplacementText')
  ) {
    handleInsertText(newRange, inputData)
  } else if (
    inputType === 'deleteContentBackward' ||
    inputType === 'deleteContentForward' ||
    inputType === 'deleteWordBackward' ||
    inputType === 'deleteWordForward' ||
    inputType === 'deleteSoftLineBackward' ||
    inputType === 'deleteSoftLineForward' ||
    inputType === 'deleteByCut'
  ) {
    handleDeleteContent(newRange, inputType)
  }
}

const isEditor = (node: Node) => {
  return node === editorRef.value || node.parentElement === editorRef.value
}

const handleInsertText = (range: NewRange, inputData: string) => {
  if (range.collapsed) {
    // 没有选中文本
    if (isText(range.startEl)) {
      // 光标定位在文本元素中
      insertTextBetweenTexts(range.startEl, range.startEl, inputData, range.startOffset, range.startOffset)
    } else if (isDelimiter(range.startEl)) {
      // 光标定位在分隔符左右两侧
      const direction = range.startOffset === 0 ? 'previous' : 'next'
      insertTextAroundDelimiter(range.startEl, direction, inputData)
    } else {
      console.warn('range.startEl is not a text or delimiter', range.startEl)
    }
  } else {
    // 选中了文本

    // 如果 start 是分隔符，取 start 的后一个文本元素；如果 end 是分隔符，取 end 的前一个文本元素
    const startTextEl = isText(range.startEl)
      ? range.startEl
      : isDelimiter(range.startEl)
        ? findElementFrom(range.startEl, isText, editorRef.value!, 'next')
        : null
    const startOffset = isText(range.startEl) ? range.startOffset : 0

    const endTextEl = isText(range.endEl)
      ? range.endEl
      : isDelimiter(range.endEl)
        ? findElementFrom(range.endEl, isText, editorRef.value!, 'previous')
        : null
    const endOffset = isText(range.endEl) ? range.endOffset : (endTextEl?.textContent?.length ?? 0)

    if (startTextEl && endTextEl) {
      insertTextBetweenTexts(startTextEl, endTextEl, inputData, startOffset, endOffset)
    } else {
      console.warn('startTextEl or endTextEl is null', { startTextEl, endTextEl })
    }
  }
}

const handleDeleteContent = (range: NewRange, inputType: string) => {
  if (range.collapsed) {
    // 一般情况删除时 collapsed 都为 false。少数特殊情况不处理，比如，文本开头按下 backspace；macos 下 ctrl + backspace
    console.warn('range is collapsed', range)
    return
  }

  const startIsDelimiter = isDelimiter(range.startEl)
  const endIsDelimiter = isDelimiter(range.endEl)

  const startTextEl = isText(range.startEl)
    ? range.startEl
    : startIsDelimiter
      ? findElementFrom(range.startEl, isText, editorRef.value!, 'next')
      : null
  const startOffset = isText(range.startEl) ? range.startOffset : 0

  const endTextEl = isText(range.endEl)
    ? range.endEl
    : endIsDelimiter
      ? findElementFrom(range.endEl, isText, editorRef.value!, 'previous')
      : null
  const endOffset = isText(range.endEl) ? range.endOffset : (endTextEl?.textContent?.length ?? 0)

  if (startIsDelimiter && range.startEl === range.endEl) {
    // 首尾都是同一个分隔符
    if (inputType.includes('Backward')) {
      const previousTextEl = findElementFrom(range.startEl, isText, editorRef.value!, 'previous')
      if (previousTextEl) {
        const contentLength = previousTextEl.textContent?.length ?? 0
        if (!contentLength) {
          const toDeleteIndex = data.value.findIndex((item) => item.id === previousTextEl.dataset.id)
          // 删除空 block
          data.value = data.value.slice(0, toDeleteIndex).concat(data.value.slice(toDeleteIndex + 1))
          // Backward 需要改变光标位置，移动至被删除的 block 的左侧节点的最右侧
          // Forward 不需要改变光标位置，无需额外处理
          const previousBlock = data.value[toDeleteIndex - 1]
          if (previousBlock) {
            const selector =
              previousBlock.type === 'text'
                ? `[data-id="${previousBlock.id}"][data-type="text"]`
                : `[data-id="${previousBlock.id}"][data-type="template-suffix"]`
            const targetEl = editorRef.value!.querySelector(selector)
            if (targetEl) {
              setCaretPosition(targetEl, targetEl.textContent?.length ?? 0)
            }
          } else {
            setCaretPosition(editorRef.value!, 0)
          }
        } else {
          insertTextBetweenTexts(previousTextEl, previousTextEl, '', contentLength - 1, contentLength)
        }
      }
    } else if (inputType.includes('Forward')) {
      const nextTextEl = findElementFrom(range.startEl, isText, editorRef.value!, 'next')
      if (nextTextEl) {
        const contentLength = nextTextEl.textContent?.length ?? 0
        if (!contentLength) {
          // 删除空 block
          data.value = data.value.filter((item) => item.id !== nextTextEl.dataset.id)
        } else {
          insertTextBetweenTexts(nextTextEl, nextTextEl, '', 0, 1)
        }
      }
    } else {
      console.warn('something wrong', { range, inputType })
    }
  } else if (startTextEl && endTextEl) {
    insertTextBetweenTexts(startTextEl, endTextEl, '', startOffset, endOffset)
  } else {
    console.warn('startTextEl or endTextEl is null', { startTextEl, endTextEl })
  }
}

const handleCompositionEnd = (e: Event) => {
  const ev = e as CompositionEvent
  console.log(ev)
}

const handlePaste = (_e: ClipboardEvent) => {}

const showSelection = () => {
  const range = getSelectionRange(editorRef.value!)
  console.log('===============')
  console.log(range?.startContainer.parentElement, range?.startContainer.textContent, range?.startOffset)
  console.log(range?.endContainer.parentElement, range?.endContainer.textContent, range?.endOffset)
  console.log('===============')
}
</script>

<style></style>
