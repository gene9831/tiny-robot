<script setup lang="ts">
import { computed, useAttrs } from 'vue'

const props = defineProps<{
  id: string
  content: string
  prefix?: boolean | { outside?: boolean }
  suffix?: boolean | { outside?: boolean }
}>()

defineOptions({
  inheritAttrs: false,
})

const attrs = useAttrs()

// 过滤掉某些属性，例如 id 和 style
const filteredAttrs = computed(() => {
  const { type: _type, component: _component, ...rest } = attrs
  return rest
})

const prefixOutside = computed(() => {
  return typeof props.prefix === 'object' && Boolean(props.prefix.outside)
})

const prefixInside = computed(() => {
  return Boolean(props.prefix) && !prefixOutside.value
})

const suffixOutside = computed(() => {
  return typeof props.suffix === 'object' && Boolean(props.suffix.outside)
})

const suffixInside = computed(() => {
  return Boolean(props.suffix) && !suffixOutside.value
})

const prefixChar = '^'
const suffixChar = '$'
</script>
<!-- 设置 contenteditable="false" 是为了不会将文本插入到非text元素。但是可能导致光标不显示 -->
<template>
  <span v-if="prefixOutside" :data-id="id" data-type="template-prefix">{{ prefixChar }}</span>
  <span
    style="color: red; margin: 0 4px; padding: 4px 4px; background-color: yellow"
    v-bind="filteredAttrs"
    :data-id="id"
    data-type="template-block"
  >
    <span v-if="prefixInside" :data-id="id" data-type="template-prefix">{{ prefixChar }}</span>
    <span :data-id="id" data-type="text" :data-placeholder="props.id.slice(0, 4)">{{ content }}</span>
    <span v-if="suffixInside" :data-id="id" data-type="template-suffix">{{ suffixChar }}</span>
  </span>
  <span v-if="suffixOutside" :data-id="id" data-type="template-suffix">{{ suffixChar }}</span>
</template>
