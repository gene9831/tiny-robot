<script setup lang="ts">
import { IconArrowDown } from '@opentiny/tiny-robot-svgs'
import type { ExtensionSectionEmits, ExtensionSectionProps } from '../index.type'

withDefaults(defineProps<ExtensionSectionProps>(), {
  expanded: true,
})

const emit = defineEmits<ExtensionSectionEmits>()
</script>

<template>
  <section class="tr-extension-section">
    <button class="tr-extension-section__title" type="button" @click="emit('toggle')">
      <IconArrowDown class="tr-extension-section__arrow" :class="{ 'is-expanded': expanded }"></IconArrowDown>
      <span>{{ title }}</span>
    </button>

    <div v-show="expanded" class="tr-extension-section__body">
      <slot />
    </div>
  </section>
</template>

<style lang="less" scoped>
.tr-extension-section__title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--tr-text-primary);
  cursor: pointer;
  font-size: 14px;
  line-height: 22px;
}

.tr-extension-section__arrow {
  font-size: 16px;
  display: inline-block;
  transform: rotate(-90deg);
  transition: transform 0.2s ease;
  color: var(--tr-text-tertiary);
}

.tr-extension-section__arrow.is-expanded {
  transform: rotate(0);
}
</style>
