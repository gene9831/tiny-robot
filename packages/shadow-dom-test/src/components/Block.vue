<script setup lang="ts">
import { useAttrs } from 'vue'

type DataItem = {
  id: string
  type: 'block' | 'text' | 'template' | 'prefix' | 'suffix'
  content: string | DataItem[]
  readonly?: boolean
  asChild?: boolean
}

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<DataItem>()
const attrs = useAttrs()
</script>
<!-- 设置 contenteditable="false" 是为了不会将文本插入到非text元素。但是可能导致光标不显示 -->
<template>
  <span
    v-if="props.type !== 'block'"
    :data-id="props.id"
    :data-type="props.type"
    v-bind="attrs"
    :data-placeholder="props.id"
  >
    {{ props.content }}
  </span>
  <template v-else>
    <template v-if="props.asChild">
      <Block v-for="item in props.content as DataItem[]" :key="`${item.id}-${item.type}`" v-bind="item" />
    </template>
    <span v-else :data-id="props.id" :data-type="props.type" v-bind="attrs">
      <Block v-for="item in props.content as DataItem[]" :key="`${item.id}-${item.type}`" v-bind="item" />
    </span>
  </template>
</template>
