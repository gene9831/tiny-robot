<script setup lang="ts">
import { IconArrowDown } from '@opentiny/tiny-robot-svgs'
import { computed } from 'vue'
import type { ExtensionCardActionEvent, ExtensionManagerProps } from '../index.type'
import { useExtensionManagerContext } from '../composables'
import ExtensionCard from './ExtensionCard.vue'
import ExtensionList from './ExtensionList.vue'

const props = withDefaults(
  defineProps<
    Pick<
      ExtensionManagerProps,
      'installedTitle' | 'marketTitle' | 'loading' | 'marketLoading' | 'error' | 'marketError'
    >
  >(),
  {
    installedTitle: '已添加',
    marketTitle: '市场',
    loading: false,
    marketLoading: false,
  },
)

const manager = useExtensionManagerContext()
const sections = computed(() => [
  { source: 'installed' as const, items: manager.displayItems.value.installed },
  { source: 'market' as const, items: manager.displayItems.value.market },
])
type ExtensionRuntimeItem = (typeof sections.value)[number]['items'][number]
type ExtensionRuntimeScope = (typeof sections.value)[number]['source']

const getSectionTitle = (source: ExtensionRuntimeScope) => {
  const prefix = source === 'installed' ? props.installedTitle : props.marketTitle
  const typeLabel = manager.typeOptions.value.find((option) => option.value === manager.activeType.value)?.label
  return `${prefix}${typeLabel ?? manager.activeType.value}`
}

const getEmptyText = (source: ExtensionRuntimeScope) => (source === 'installed' ? '暂无已添加扩展' : '暂无市场扩展')

const getLoading = (source: ExtensionRuntimeScope) => (source === 'installed' ? props.loading : props.marketLoading)

const getError = (source: ExtensionRuntimeScope) => (source === 'installed' ? props.error : props.marketError)

const handleCardAction = (
  item: ExtensionRuntimeItem,
  source: ExtensionRuntimeScope,
  event: ExtensionCardActionEvent,
) => {
  if (event.id === 'toggle' && typeof event.checked === 'boolean') {
    manager.requestToggle(item, event.checked, source)
  } else if (event.id === 'add') {
    manager.requestAdd(item, source)
  } else if (event.id === 'delete') {
    manager.requestDelete(item, source)
  }
}
</script>

<template>
  <div class="extension-manager__content">
    <nav class="extension-manager__tabs" aria-label="扩展类型">
      <button
        v-for="option in manager.typeOptions.value"
        :key="option.value"
        class="extension-manager__tab"
        :class="{ 'is-active': manager.activeType.value === option.value }"
        type="button"
        @click="manager.setActiveType(option.value)"
      >
        {{ option.label }}
      </button>
    </nav>

    <div class="extension-manager__sections">
      <section v-for="section in sections" :key="section.source" class="extension-manager__section">
        <button
          class="extension-manager__section-title"
          type="button"
          :aria-expanded="manager.isSectionExpanded(section.source)"
          @click="manager.toggleSection(section.source)"
        >
          <IconArrowDown
            class="extension-manager__section-arrow"
            :class="{ 'is-expanded': manager.isSectionExpanded(section.source) }"
          />
          <span>{{ getSectionTitle(section.source) }}</span>
        </button>

        <div v-show="manager.isSectionExpanded(section.source)" class="extension-manager__section-body">
          <ExtensionList
            :source="section.source"
            :items="section.items"
            :operation-states="manager.operationStates.value"
            :loading="getLoading(section.source)"
            :error="getError(section.source)"
            :empty-text="getEmptyText(section.source)"
            @retry="manager.requestRefresh(section.source)"
          >
            <ExtensionCard
              v-for="item in section.items"
              :key="item.id"
              :item="item"
              @name-click="manager.requestDetailOpen(item, section.source)"
              @action="handleCardAction(item, section.source, $event)"
            />
          </ExtensionList>
        </div>
      </section>
    </div>
  </div>
</template>

<style lang="less" scoped>
.extension-manager__tabs {
  display: flex;
  gap: 28px;
  border-bottom: 1px solid var(--tr-mcp-server-picker-tabs-divider-color);
}

.extension-manager__tab {
  position: relative;
  padding: 0 0 10px;
  border: 0;
  background: transparent;
  color: var(--tr-text-primary);
  cursor: pointer;
  font-size: 14px;
  line-height: 22px;
}

.extension-manager__tab::after {
  position: absolute;
  right: 0;
  bottom: -1px;
  left: 0;
  height: 2px;
  background: transparent;
  content: '';
}

.extension-manager__tab.is-active {
  font-weight: 600;
}

.extension-manager__tab.is-active::after {
  background: var(--tr-mcp-server-picker-tabs-border-color-active);
}

.extension-manager__sections {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.extension-manager__section-title {
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

.extension-manager__section-arrow {
  display: inline-block;
  color: var(--tr-text-tertiary);
  font-size: 16px;
  transform: rotate(-90deg);
  transition: transform 0.2s ease;
}

.extension-manager__section-arrow.is-expanded {
  transform: rotate(0);
}
</style>
