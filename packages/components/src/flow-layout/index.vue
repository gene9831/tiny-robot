<script setup lang="ts">
import { IconArrowDown } from '@opentiny/tiny-robot-svgs'
import { onClickOutside, useElementHover, useElementSize } from '@vueuse/core'
import { computed, isVNode, ref, watch } from 'vue'
import IconButton from '../icon-button'
import { useSlotRefs } from '../shared/composables'
import { FlowLayoutProps, FlowLayoutSlots } from './index.type'

const props = withDefaults(defineProps<FlowLayoutProps>(), {
  linesLimit: Number.MAX_SAFE_INTEGER,
  openMoreTrigger: 'click',
})

const slots = defineSlots<FlowLayoutSlots>()

const { vnodes, refs: itemRefs, setRefs } = useSlotRefs(slots.default, true)
const { vnodes: moreTriggerVnodes, ref: moreTriggerRef, setRef } = useSlotRefs(slots.moreTrigger)

const containerRef = ref<HTMLElement | null>(null)
const { width: containerWidth } = useElementSize(containerRef)
const { width: moreWidth } = useElementSize(moreTriggerRef)

const computedItems = computed(() => {
  return itemRefs.value.map((e) => e).filter((e) => e instanceof Element)
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

const sliceIndex = computed(() => {
  if (containerWidth.value <= 0) return 0

  const itemsWidth = computedItems.value.map((item) => item.getBoundingClientRect().width)
  const gap = parseFloat(getComputedStyle(containerRef.value!).rowGap) || 0
  const itemLines = calcLineNumber(containerWidth.value, itemsWidth, gap)

  const firstHidden = itemLines.find((line) => line.line >= props.linesLimit)

  if (firstHidden) {
    const beforeFirstHidden = itemLines[firstHidden.index - 1]
    if (beforeFirstHidden.right + gap + moreWidth.value > containerWidth.value) {
      return firstHidden.index - 1
    } else {
      return firstHidden.index
    }
  } else {
    return itemLines.length
  }
})

const openMore = defineModel<FlowLayoutProps['openMore']>('openMore', { default: false })

const moreRef = ref<HTMLDivElement | null>(null)

if (props.openMoreTrigger === 'click') {
  onClickOutside(moreRef, () => {
    openMore.value = false
  })
} else if (props.openMoreTrigger === 'hover') {
  const isHovering = useElementHover(moreRef)
  watch(isHovering, (isHover) => {
    if (isHover) {
      openMore.value = true
    } else {
      openMore.value = false
    }
  })
}
</script>

<template>
  <div class="tr-flow-layout" ref="containerRef">
    <component
      :is="vnode"
      v-for="(vnode, index) in vnodes"
      :key="isVNode(vnode) ? vnode.key : undefined"
      :ref="(el: unknown) => setRefs(el, index)"
      :class="{ hidden: index >= sliceIndex }"
      :style="{ margin: 0 }"
    />
    <div class="tr-flow-layout-more" v-if="sliceIndex < computedItems.length" ref="moreRef">
      <component
        v-if="moreTriggerVnodes[0]"
        :is="moreTriggerVnodes[0]"
        :ref="setRef"
        :data-active="openMore"
        @click="openMore = !openMore"
      />
      <IconButton
        v-else
        :ref="setRef"
        :icon="IconArrowDown"
        :data-default-trigger="true"
        :data-active="openMore"
        @click="openMore = !openMore"
      />
      <div class="tr-flow-layout-more-list" v-show="openMore">
        <div class="tr-flow-layout-more-list-top-gap"></div>
        <div class="tr-flow-layout-more-list-content">
          <component
            :is="vnode"
            v-for="vnode in vnodes.slice(sliceIndex)"
            :key="isVNode(vnode) ? vnode.key : undefined"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="less">
:root {
  --tr-flow-layout-gap: 8px;

  --tr-flow-layout-more-list-bg: white;
  --tr-flow-layout-more-list-box-shadow: 0 0 16px rgba(0, 0, 0, 0.08);
}
</style>

<style lang="less" scoped>
.tr-flow-layout {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--tr-flow-layout-gap);
  position: relative;

  & > * {
    flex-shrink: 0;
  }

  & > :deep(.hidden) {
    position: absolute;
    visibility: hidden;
  }
}

.tr-flow-layout-more {
  position: relative;
  display: inline-flex;

  & > [data-default-trigger][data-active='true'] {
    background-color: var(--tr-icon-button-hover-bg);
  }
}

.tr-flow-layout-more-list {
  position: absolute;
  top: 100%;
  right: 0;

  .tr-flow-layout-more-list-top-gap {
    height: 8px;
  }
  .tr-flow-layout-more-list-content {
    display: flex;
    flex-direction: column;
    background: var(--tr-flow-layout-more-list-bg);
    box-shadow: var(--tr-flow-layout-more-list-box-shadow);

    white-space: nowrap;
  }
}
</style>
