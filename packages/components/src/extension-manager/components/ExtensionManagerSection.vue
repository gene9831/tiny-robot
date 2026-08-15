<script setup lang="ts">
import { IconArrowDown } from '@opentiny/tiny-robot-svgs'
import { computed, type VNode } from 'vue'
import ExtensionCardGrid from './ExtensionCardGrid.vue'
import type {
  ExtensionCardGridActionEvent,
  ExtensionCardGridNameClickEvent,
  ExtensionManagerItem,
  ExtensionManagerSection as ExtensionManagerSectionData,
} from '../index.type'

defineOptions({ name: 'ExtensionManagerSection' })

const props = defineProps<{
  tabId: string
  section: ExtensionManagerSectionData
  expanded: boolean
}>()

const slots = defineSlots<{
  'section-header'?: (props: { section: ExtensionManagerSectionData; expanded: boolean; toggle: () => void }) => VNode[]
  item?: (props: { item: ExtensionManagerItem; index: number }) => VNode[]
  loading?: () => VNode[]
  error?: (props: { error: unknown; retry: () => void }) => VNode[]
  empty?: () => VNode[]
}>()

const emit = defineEmits<{
  (e: 'section-toggle', expanded: boolean): void
  (e: 'retry'): void
  (e: 'action', event: ExtensionCardGridActionEvent): void
  (e: 'name-click', event: ExtensionCardGridNameClickEvent): void
}>()

const hasError = computed(() => props.section.error !== undefined && props.section.error !== null)

const toggle = () => {
  if (props.section.collapsible === true) emit('section-toggle', !props.expanded)
}

const retry = () => emit('retry')

const handleAction = (event: ExtensionCardGridActionEvent) => emit('action', event)

const handleNameClick = (event: ExtensionCardGridNameClickEvent) => emit('name-click', event)
</script>

<template>
  <section class="extension-manager-section" :data-tab-id="props.tabId" :data-section-id="props.section.id">
    <div class="extension-manager-section__header">
      <template v-if="slots['section-header']">
        <slot name="section-header" :section="props.section" :expanded="props.expanded" :toggle="toggle" />
      </template>

      <button
        v-else-if="props.section.collapsible === true"
        class="extension-manager-section__title"
        type="button"
        :aria-expanded="props.expanded"
        @click="toggle"
      >
        <IconArrowDown class="extension-manager-section__arrow" :class="{ 'is-expanded': props.expanded }" />
        <span>{{ props.section.title }}</span>
      </button>

      <div v-else class="extension-manager-section__title">
        <span>{{ props.section.title }}</span>
      </div>
    </div>

    <div class="extension-manager-section__body">
      <div v-if="props.section.loading" class="extension-manager-section__state">
        <slot name="loading">Loading...</slot>
      </div>

      <div v-else-if="hasError" class="extension-manager-section__state extension-manager-section__state--error">
        <slot name="error" :error="props.section.error" :retry="retry">
          <span>{{ String(props.section.error) }}</span>
          <button type="button" class="extension-manager-section__retry" @click="retry">Retry</button>
        </slot>
      </div>

      <ExtensionCardGrid
        v-else-if="props.section.items.length > 0"
        :items="props.section.items"
        :columns="props.section.columns"
        :empty-text="props.section.emptyText"
        @action="handleAction"
        @name-click="handleNameClick"
      >
        <template v-if="slots.item" #item="{ item, index }">
          <slot name="item" :item="item" :index="index" />
        </template>
      </ExtensionCardGrid>

      <div v-else class="extension-manager-section__state">
        <slot name="empty">{{ props.section.emptyText ?? '暂无内容' }}</slot>
      </div>
    </div>
  </section>
</template>

<style lang="less" scoped>
.extension-manager-section {
  min-width: 0;
}

.extension-manager-section__header {
  min-height: 24px;
}

.extension-manager-section__title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--tr-text-primary);
  font-size: 14px;
  line-height: 22px;
  text-align: left;
}

button.extension-manager-section__title {
  cursor: pointer;
}

.extension-manager-section__arrow {
  display: inline-block;
  color: var(--tr-text-tertiary);
  font-size: 16px;
  transform: rotate(-90deg);
  transition: transform 0.2s ease;
}

.extension-manager-section__arrow.is-expanded {
  transform: rotate(0);
}

.extension-manager-section__body {
  min-width: 0;
}

.extension-manager-section__state {
  padding: 28px 0;
  color: var(--tr-text-secondary);
  font-size: 13px;
  text-align: center;
}

.extension-manager-section__state--error {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.extension-manager-section__retry {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--tr-color-primary);
  cursor: pointer;
  font: inherit;
}
</style>
