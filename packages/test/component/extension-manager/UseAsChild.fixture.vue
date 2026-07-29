<script setup lang="ts">
import type { ComponentPublicInstance, VNode } from 'vue'
import { createCommentVNode, createTextVNode, Fragment, h, ref, Teleport } from 'vue'
import { useAsChild } from '../../../components/src/extension-manager/composables/useAsChild'

type Mode = 'empty' | 'fragment' | 'multiple' | 'teleport' | 'text' | 'valid'

const props = withDefaults(
  defineProps<{
    debugName?: string
    mode?: Mode
  }>(),
  {
    mode: 'valid',
  },
)

const originalClicks = ref(0)
const injectedClicks = ref(0)

const resolveElement = (target: Element | ComponentPublicInstance | null) => {
  return target instanceof Element ? target : target?.$el
}

const setOriginalRef = (target: Element | ComponentPublicInstance | null) => {
  resolveElement(target)?.setAttribute('data-original-ref', 'true')
}

const setInjectedRef = (target: Element | ComponentPublicInstance | null) => {
  resolveElement(target)?.setAttribute('data-injected-ref', 'true')
}

const createTrigger = (label: string) =>
  h(
    'button',
    {
      onClick: () => {
        originalClicks.value += 1
      },
      ref: setOriginalRef,
      type: 'button',
    },
    label,
  )

const getSlot = () => {
  return ({ label }: { label: string }): VNode[] => {
    switch (props.mode) {
      case 'empty':
        return []
      case 'fragment':
        return [h(Fragment, null, [createCommentVNode('ignored'), createTextVNode('  '), createTrigger(label)])]
      case 'multiple':
        return [h('button', { type: 'button' }, 'first'), h('button', { type: 'button' }, 'second')]
      case 'teleport':
        return [
          h(
            Teleport,
            {
              to: 'body',
            },
            h('button', { type: 'button' }, 'teleported trigger'),
          ),
        ]
      case 'text':
        return [createTextVNode('text only')]
      default:
        return [createTrigger(label)]
    }
  }
}

const { renderAsChild } = useAsChild({
  getSlot,
  debugName: props.debugName,
})

const renderTrigger = () =>
  renderAsChild(
    {
      label: 'asChild trigger',
    },
    {
      'aria-label': 'Injected trigger',
      'data-testid': 'as-child-trigger',
      onClick: () => {
        injectedClicks.value += 1
      },
      ref: setInjectedRef,
    },
  )
</script>

<template>
  <section>
    <component :is="renderTrigger()" />
    <output data-testid="click-counts">{{ originalClicks }}/{{ injectedClicks }}</output>
  </section>
</template>
