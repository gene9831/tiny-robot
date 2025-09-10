<script setup lang="ts" generic="T = unknown">
import { unrefElement, useElementSize } from '@vueuse/core'
import { computed, CSSProperties, isVNode, nextTick, ref, watch } from 'vue'
import { useSlotRefs } from '../shared/composables'
import { toCssUnit } from '../shared/utils'
import { FlowLayoutProps, FlowLayoutSlots } from './index.type'

const props = withDefaults(defineProps<FlowLayoutProps<T>>(), {
  linesLimit: Number.MAX_SAFE_INTEGER,
})

const slots = defineSlots<FlowLayoutSlots<T>>()

const renderItemSlot = () => {
  if (!slots.item) return []

  // 遍历 items 数组，为每个 item 调用 slot 函数
  return props.items.flatMap((item, index) => {
    return slots.item({ item, index })
  })
}

const { vnodes, refs: itemRefs, setRefs } = useSlotRefs(renderItemSlot, true)

const computedItems = computed(() => {
  return itemRefs.value.map((e) => unrefElement(e)).filter((e): e is HTMLElement | SVGElement => Boolean(e))
})

const visibleItemCount = ref(0)

const renderMoreTiggerSlot = () => {
  if (!slots.moreTrigger) return []
  return slots.moreTrigger({ visibleItemCount: visibleItemCount.value })
}
const { vnodes: moreTriggerVnodes, ref: moreTriggerRef, setRef } = useSlotRefs(renderMoreTiggerSlot)
const moreTriggerVnode = computed(() => moreTriggerVnodes.value.at(0))
const { width: moreWidth } = useElementSize(moreTriggerRef, undefined, { box: 'border-box' })

const containerRef = ref<HTMLElement | null>(null)
const { width: containerWidth } = useElementSize(containerRef)

const gapStyle = computed(() => {
  const result = {} as CSSProperties
  if (props.gap && typeof props.gap === 'object') {
    result.rowGap = toCssUnit(props.gap.rowGap)
    result.columnGap = toCssUnit(props.gap.columnGap)
  } else {
    result.gap = toCssUnit(props.gap)
  }
  return result
})

// columnGap 不能直接取 props 中的值，因为 props 中的 gap 单位可能不一致。使用 getComputedStyle 获取的值单位会标准化为 px
const columnGap = ref(0)

watch(
  gapStyle,
  () => {
    nextTick(() => {
      if (!containerRef.value) return
      columnGap.value = parseFloat(getComputedStyle(containerRef.value).columnGap) || 0
    })
  },
  { immediate: true },
)

const calcLineNumber = (width: number, itemsWidth: number[], gap: number) => {
  const result: { index: number; line: number; right: number }[] = []
  let currentLine = 0
  let currentLineWidth = 0

  for (let i = 0; i < itemsWidth.length; i++) {
    const itemWidth = itemsWidth[i]

    // Check if current item can fit on the current line
    // Add gap if it's not the first item on the line
    const requiredWidth = currentLineWidth === 0 ? itemWidth : currentLineWidth + gap + itemWidth

    if (requiredWidth <= width) {
      // Item fits on current line
      currentLineWidth = requiredWidth
    } else {
      // Item needs to go to next line
      currentLine++
      currentLineWidth = itemWidth
    }

    result.push({
      index: i,
      line: currentLine,
      right: currentLineWidth,
    })
  }

  return result
}

const calcVisibleItemCount = (
  width: number,
  itemsWidth: number[],
  moreWidth: number,
  gap: number,
  linesLimit: number,
) => {
  const itemLines = calcLineNumber(width, itemsWidth, gap)
  const firstHidden = itemLines.find((line) => line.line >= linesLimit)

  if (firstHidden) {
    if (firstHidden.index > 0) {
      // 从firstHidden前一个索引开始往前遍历，直到找到一个索引，其right + gap + moreWidth <= width
      for (let i = firstHidden.index - 1; i >= 0; i--) {
        const item = itemLines[i]
        if (Math.ceil(item.right) + gap + Math.ceil(moreWidth) <= width) {
          return i + 1
        }
      }
      return 0
    }
    return firstHidden.index
  } else {
    return itemLines.length
  }
}

watch(
  () =>
    [
      containerWidth.value,
      computedItems.value.map((item) => item.getBoundingClientRect().width),
      Math.max(moreWidth.value, props.moreTriggerMinWidth || 0),
      columnGap.value,
      props.linesLimit,
    ] as const,
  ([containerW, itemsWidth, moreW, colGap, linesLimit]) => {
    if (containerW <= 0) {
      visibleItemCount.value = 0
    } else {
      // 计算在行数限制下能显示到第几个索引
      visibleItemCount.value = calcVisibleItemCount(containerW, itemsWidth, moreW, colGap, linesLimit)
    }
  },
)
</script>

<template>
  <div class="tr-flow-layout" ref="containerRef" :style="gapStyle">
    <component
      :is="vnode"
      v-for="(vnode, index) in vnodes"
      :key="isVNode(vnode) ? vnode.key : undefined"
      :ref="(el: unknown) => setRefs(el, index)"
      :data-hidden="index >= visibleItemCount || undefined"
    />
    <component :is="moreTriggerVnode" :ref="setRef" />
  </div>
</template>

<style lang="less" scoped>
.tr-flow-layout {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  position: relative;

  & > * {
    flex-shrink: 0;
  }

  & > :deep([data-hidden='true']) {
    position: absolute;
    visibility: hidden;
  }
}
</style>
