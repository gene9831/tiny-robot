<template>
  <div class="editor-container">
    <div contenteditable="true" ref="editorRef">
      <template v-for="(node, index) in dataBlocks" :key="index">
        <component :is="node.component" v-bind="node.props" />
      </template>
    </div>
    <div>
      {{ range.start }}
      {{ range.end }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { markRaw, onMounted, ref } from 'vue'
import Block from './Block.vue'

interface Block {
  type: 'block'
  component: typeof Block
  props: {
    content: string
    style?: string
  }
}

type DataBlock = Block

const dataBlocks = ref<DataBlock[]>([
  {
    type: 'block',
    component: markRaw(Block),
    props: {
      content: 'Hello, world!',
    },
  },
  {
    type: 'block',
    component: markRaw(Block),
    props: {
      content: 'Hello Hello ',
      style: 'color: red; margin: 0 4px; padding: 0 4px; background-color: yellow;',
    },
  },
  {
    type: 'block',
    component: markRaw(Block),
    props: {
      content: 'Hello Hello ',
      style: 'color: blue; margin: 0 4px; padding: 0 4px; background-color: yellow;',
    },
  },
  {
    type: 'block',
    component: markRaw(Block),
    props: {
      content: 'Hello, world!',
    },
  },
])

const editorRef = ref<HTMLDivElement | null>(null)

function getActiveElement() {
  let active = document.activeElement

  while (active?.shadowRoot?.activeElement) {
    active = active.shadowRoot.activeElement
  }

  return active
}

class ShadowSelection implements Pick<Selection, 'getRangeAt' | 'addRange' | 'removeAllRanges'> {
  private ranges: Range[] = []

  constructor() {
    this.ranges = []
  }

  getRangeAt(index: number) {
    return this.ranges[index]
  }

  addRange(range: Range) {
    this.ranges.push(range)
  }

  removeAllRanges() {
    this.ranges = []
  }

  // todo: implement remaining `Selection` methods and properties.
}

const log = (...args: Parameters<typeof console.log>) => {
  const root = editorRef.value?.getRootNode()
  if (root instanceof ShadowRoot) {
    console.log('[ShadowDom]', ...args)
  } else {
    console.log(...args)
  }
}

const selection = new ShadowSelection()

const range = ref({
  start: 0,
  end: 0,
})

document.addEventListener('selectionchange', () => {
  const r = selection.getRangeAt(0) as Range | undefined
  range.value = {
    start: r?.startOffset ?? 0,
    end: r?.endOffset ?? 0,
  }
})

let composition = false

let processing = false
window.addEventListener(
  'selectionchange',
  () => {
    log('selectionchange')

    if (composition) {
      return
    }

    const active = getActiveElement()

    if (!active || active !== editorRef.value) {
      selection.removeAllRanges()
      return
    }

    if (processing) {
      return
    }

    processing = true

    log('insertText')
    document.execCommand('insertText', false, '\u200B')

    log('processing set to false')
    processing = false
  },
  true,
)

window.addEventListener(
  'beforeinput',
  (event) => {
    if (processing) {
      log('beforeinput')
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
  },
  true,
)

onMounted(() => {
  const shadowRoot = editorRef.value?.getRootNode()
  if (shadowRoot instanceof ShadowRoot) {
    shadowRoot.addEventListener(
      'selectstart',
      () => {
        log('shadowDom selectstart')
        selection.removeAllRanges()
      },
      true,
    )
  } else {
    window.addEventListener(
      'selectstart',
      () => {
        log('selectstart')
        selection.removeAllRanges()
      },
      true,
    )
  }

  if (editorRef.value) {
    editorRef.value.addEventListener(
      'compositionstart',
      () => {
        composition = true
      },
      true,
    )
    editorRef.value.addEventListener(
      'compositionend',
      () => {
        composition = false
      },
      true,
    )
  }
})
</script>

<style lang="less">
.editor-container {
  width: 100%;
  border: 1px solid #ccc;
  padding: 10px;
}
</style>
