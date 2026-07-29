<script setup lang="ts">
import { defineComponent, h, ref } from 'vue'
import ExtensionCardPopover from '../../../components/src/extension-manager/components/ExtensionCardPopover.vue'

const CustomTrigger = defineComponent({
  name: 'CustomTrigger',
  inheritAttrs: false,
  setup(_, { attrs }) {
    return () => h('button', { ...attrs, 'data-testid': 'component-trigger', type: 'button' }, '组件触发器')
  },
})

const initialSlots = {
  trigger: ({ popoverId }: { popoverId: string }) =>
    h('button', { 'data-testid': 'replaced-slot-trigger', popovertarget: popoverId, type: 'button' }, '初始 slot'),
  content: () => h('span', '初始 slot 内容'),
}

const replacementSlots = {
  trigger: ({ popoverId }: { popoverId: string }) =>
    h('button', { 'data-testid': 'replaced-slot-trigger', popovertarget: popoverId, type: 'button' }, '替换 slot'),
  content: () => h('span', '替换 slot 内容'),
}

const DynamicSlotHost = defineComponent({
  name: 'DynamicSlotHost',
  setup() {
    const useReplacement = ref(false)

    return () =>
      h('section', { 'data-testid': 'replaced-slot-section' }, [
        h(
          'button',
          {
            'data-testid': 'replace-trigger-slot',
            onClick: () => {
              useReplacement.value = true
            },
            type: 'button',
          },
          '替换 slot',
        ),
        h(ExtensionCardPopover, { asChild: true }, useReplacement.value ? replacementSlots : initialSlots),
      ])
  },
})
</script>

<template>
  <div>
    <section data-testid="native-trigger-section">
      <ExtensionCardPopover as-child>
        <template #trigger="{ popoverId, open }">
          <button
            type="button"
            data-testid="native-trigger"
            :popovertarget="popoverId"
            popovertargetaction="toggle"
            :aria-expanded="open"
          >
            原生触发器
          </button>
        </template>
        <template #content>
          <span>原生触发器内容</span>
        </template>
      </ExtensionCardPopover>
    </section>

    <section data-testid="component-trigger-section">
      <ExtensionCardPopover as-child>
        <template #trigger="{ popoverId, open }">
          <CustomTrigger :popovertarget="popoverId" popovertargetaction="toggle" :aria-expanded="open" />
        </template>
        <template #content>
          <span>组件触发器内容</span>
        </template>
      </ExtensionCardPopover>
    </section>

    <DynamicSlotHost />
  </div>
</template>
