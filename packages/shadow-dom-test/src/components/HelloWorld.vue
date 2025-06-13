<template>
  <div class="editor-container">
    <div contenteditable="true" ref="editorRef">
      <component v-for="(node, index) in dataBlocks" :key="index" :is="node.component" v-bind="node.props" />
    </div>
    <div>
      {{ range.start }}
      {{ range.end }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSelection } from '@opentiny/tiny-robot'
import { markRaw, ref, watch } from 'vue'
import Block from './Block.vue'

const range = ref({
  start: 0,
  end: 0,
})

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

const { range: editorRange } = useSelection(editorRef)

watch(editorRange, (r) => {
  range.value = {
    start: r?.startOffset ?? 0,
    end: r?.endOffset ?? 0,
  }
})
</script>
