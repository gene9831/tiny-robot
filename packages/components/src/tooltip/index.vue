<script setup lang="ts">
import { useElementBounding } from '@vueuse/core'
import { computed, CSSProperties, defineSlots, ref, VNode, watch } from 'vue'
import { toCssUnit } from '../shared/utils'

export interface TooltipProps {
  content?: string
  defaultOpen?: boolean
  delayDuration?: number
  disabled?: boolean
  open?: boolean
  placement?: 'top' | 'bottom'
  appendTo?: HTMLElement | null
}

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<TooltipProps>(), {
  delayDuration: 500,
  placement: 'top',
})

const slots = defineSlots<{
  trigger?: () => VNode | VNode[]
  content?: () => VNode | VNode[]
}>()

const openModel = defineModel<TooltipProps['open']>('open')
openModel.value = props.defaultOpen
const openTooltip = ref(openModel.value)

const triggerSlots = slots.trigger?.()
// TODO 如何合理利用所有的 triggerSlots ，循环渲染场景
const triggerVNodes = Array.isArray(triggerSlots) ? triggerSlots : [triggerSlots]

const refs = ref<HTMLElement[]>([])
const setRef = (el: HTMLElement, index: number) => {
  refs.value[index] = el
}

const triggerRef = computed(() => refs.value.at(0))
const tooltipRef = ref<HTMLElement | null>(null)

const { x, y, width, height } = useElementBounding(triggerRef)

const toopTipStyle = computed<CSSProperties>(() => {
  const result: CSSProperties = {
    top: props.placement === 'top' ? toCssUnit(y.value) : toCssUnit(y.value + height.value),
    left: toCssUnit(x.value),
    transform:
      props.placement === 'top'
        ? `translate(calc(-50% + ${toCssUnit(width.value / 2)}), -100%)`
        : `translate(calc(-50% + ${toCssUnit(width.value / 2)}), 0)`,
  }

  return result
})

const handleMouseEnter = () => {
  openModel.value = true
}

const handleMouseLeave = (ev: MouseEvent) => {
  if (triggerRef.value?.contains(ev.relatedTarget as Node) || tooltipRef.value?.contains(ev.relatedTarget as Node)) {
    return
  }
  openModel.value = false
}

let delayTimer: ReturnType<typeof setTimeout> | undefined

watch(
  () => openModel.value,
  (show) => {
    const delay = show ? props.delayDuration : 0
    if (delayTimer) {
      clearTimeout(delayTimer)
      delayTimer = undefined
      if (!show) {
        openTooltip.value = false
      }
    }

    if (delay) {
      delayTimer = setTimeout(() => (openTooltip.value = show || false), delay)
    } else {
      openTooltip.value = show || false
    }
  },
)

const teleportNode = computed(() => {
  if (triggerRef.value) {
    const rootNode = triggerRef.value.getRootNode()

    return rootNode instanceof ShadowRoot ? rootNode : document.body
  }

  return document.body
})
</script>

<template>
  <component
    v-for="(trigger, index) in triggerVNodes"
    :key="index"
    :is="trigger"
    :ref="(el: HTMLElement) => setRef(el, index)"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  />
  <Transition name="tr-tooltip">
    <Teleport v-if="openTooltip && !props.disabled" :to="props.appendTo || teleportNode">
      <div
        class="tr-tooltip"
        :class="`placement-${props.placement}`"
        :style="toopTipStyle"
        v-bind="$attrs"
        ref="tooltipRef"
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
      >
        <div class="tr-tooltip-content">
          <slot name="content">{{ content }}</slot>
        </div>
        <div class="tr-tooltip-arrow"></div>
      </div>
    </Teleport>
  </Transition>
</template>

<style>
:root {
  --tr-tooltip-bg: rgb(255, 255, 255);
  --tr-tooltip-text: rgb(25, 25, 25);
  --tr-tooltip-shadow: 0 2px 12px rgba(0, 0, 0, 0.16);
  --tr-tooltip-radius: 12px;
  --tr-tooltip-padding: 16px;
  --tr-tooltip-font-size: 14px;
  --tr-tooltip-line-height: 22px;
  --tr-tooltip-arrow-size: 10px;
  --tr-tooltip-offset: 10px;
}
</style>

<style scoped lang="less">
.tr-tooltip {
  display: flex;
  flex-direction: column;
  position: fixed;
  z-index: var(--tr-z-index-tooltip);

  &-enter-active,
  &-leave-active {
    transition: opacity 0.3s ease;
  }

  &-enter-from,
  &-leave-to {
    opacity: 0;
  }

  &-enter-to,
  &-leave-from {
    opacity: 1;
  }

  .tr-tooltip-content {
    padding: var(--tr-tooltip-padding);
    color: var(--tr-tooltip-text);
    font-size: var(--tr-tooltip-font-size);
    line-height: var(--tr-tooltip-line-height);
    word-break: break-word;
    background-color: var(--tr-tooltip-bg);
    border-radius: var(--tr-tooltip-radius);
    box-shadow: var(--tr-tooltip-shadow);
  }

  .tr-tooltip-arrow {
    height: var(--tr-tooltip-offset);
    background: transparent;
    overflow: hidden;
    position: relative;

    &::before {
      content: '';
      position: absolute;
      width: var(--tr-tooltip-arrow-size);
      height: var(--tr-tooltip-arrow-size);
      background: var(--tr-tooltip-bg);
      box-shadow: var(--tr-tooltip-shadow);
      border-radius: 2px;
      transform: translate(-50%, -50%) rotate(45deg);
    }
  }

  &.placement-top {
    .tr-tooltip-arrow::before {
      left: 50%;
      top: 0;
    }
  }

  &.placement-bottom {
    flex-direction: column-reverse;
    .tr-tooltip-arrow::before {
      left: 50%;
      top: 100%;
    }
  }
}
</style>
