<script setup lang="ts">
import { IconArrowDown } from '@opentiny/tiny-robot-svgs'
import { onClickOutside, unrefElement, useElementHover, useElementSize } from '@vueuse/core'
import { computed, CSSProperties, isVNode, nextTick, ref, watch } from 'vue'
import IconButton from '../icon-button'
import { useSlotRefs } from '../shared/composables'
import { toCssUnit } from '../shared/utils'
import { FlowLayoutProps, FlowLayoutSlots } from './index.type'

const props = withDefaults(defineProps<FlowLayoutProps>(), {
  linesLimit: Number.MAX_SAFE_INTEGER,
  expandMode: 'expand',
  dropdownTrigger: 'click',
})

const slots = defineSlots<FlowLayoutSlots>()

const openMore = defineModel<FlowLayoutProps['openMore']>('openMore', { default: false })

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

const { vnodes, refs: itemRefs, setRefs } = useSlotRefs(slots.default, true)

const renderMoreTiggerSlot = () => {
  if (!slots.moreTrigger) return []
  return slots.moreTrigger({ active: openMore.value || false })
}
const { vnodes: moreTriggerVnodes, ref: moreTriggerRef, setRef } = useSlotRefs(renderMoreTiggerSlot)
const { width: moreWidth } = useElementSize(moreTriggerRef)

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

const computedItems = computed(() => {
  return itemRefs.value.map((e) => unrefElement(e)).filter((e): e is HTMLElement | SVGElement => Boolean(e))
})

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

const calcMaxLineIndex = (width: number, itemsWidth: number[], moreWidth: number, gap: number) => {
  const itemLines = calcLineNumber(width, itemsWidth, gap)
  const firstHidden = itemLines.find((line) => line.line >= props.linesLimit)

  if (firstHidden) {
    const beforeFirstHidden = itemLines[firstHidden.index - 1]
    if (beforeFirstHidden.right + gap + moreWidth > width) {
      return firstHidden.index - 1
    } else {
      return firstHidden.index
    }
  } else {
    return itemLines.length
  }
}

// 计算在行数限制下能显示到第几个索引
const maxLineIndex = computed(() => {
  const containerW = containerWidth.value
  if (containerW <= 0) return 0

  const itemsWidth = computedItems.value.map((item) => item.getBoundingClientRect().width)
  const moreW = moreWidth.value
  const colGap = columnGap.value

  return calcMaxLineIndex(containerW, itemsWidth, moreW, colGap)
})

// 最终可见项目数量（考虑展开模式）
const visibleItemCount = computed(() => {
  if (props.expandMode === 'expand' && openMore.value) {
    return computedItems.value.length
  }
  return maxLineIndex.value
})

const moreRef = ref<HTMLDivElement | null>(null)

if (props.expandMode === 'dropdown') {
  if (props.dropdownTrigger === 'click') {
    onClickOutside(moreRef, () => {
      openMore.value = false
    })
  } else if (props.dropdownTrigger === 'hover') {
    const isHovering = useElementHover(moreRef)
    watch(isHovering, (isHover) => {
      if (isHover) {
        openMore.value = true
      } else {
        openMore.value = false
      }
    })
  }
}
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
    <div class="tr-flow-layout-more" v-if="maxLineIndex < computedItems.length" ref="moreRef">
      <component v-if="moreTriggerVnodes[0]" :is="moreTriggerVnodes[0]" :ref="setRef" @click="openMore = !openMore" />
      <IconButton v-else :ref="setRef" :icon="IconArrowDown" @click="openMore = !openMore" />
      <div class="tr-flow-layout-more-list" v-if="props.expandMode === 'dropdown'" v-show="openMore">
        <div class="tr-flow-layout-more-list-top-gap"></div>
        <div class="tr-flow-layout-more-list-content" data-more-list="true">
          <component
            :is="vnode"
            v-for="vnode in vnodes.slice(maxLineIndex)"
            :key="isVNode(vnode) ? vnode.key : undefined"
            data-more-list-item="true"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="less">
:root {
  --tr-flow-layout-more-list-top-gap: 8px;
  --tr-flow-layout-more-list-bg: white;
  --tr-flow-layout-more-list-box-shadow: 0 0 16px rgba(0, 0, 0, 0.08);
  --tr-flow-layout-more-list-padding: 0;
  --tr-flow-layout-more-list-border-radius: 0;
}
</style>

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

.tr-flow-layout-more {
  position: relative;
  display: inline-flex;
}

.tr-flow-layout-more-list {
  z-index: var(--tr-z-index-dropdown);
  position: absolute;
  top: 100%;
  right: 0;

  .tr-flow-layout-more-list-top-gap {
    height: var(--tr-flow-layout-more-list-top-gap);
  }
  .tr-flow-layout-more-list-content {
    display: flex;
    flex-direction: column;
    background: var(--tr-flow-layout-more-list-bg);
    box-shadow: var(--tr-flow-layout-more-list-box-shadow);
    padding: var(--tr-flow-layout-more-list-padding);
    border-radius: var(--tr-flow-layout-more-list-border-radius);
    white-space: nowrap;
  }
}
</style>
