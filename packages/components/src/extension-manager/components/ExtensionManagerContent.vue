<script setup lang="ts">
import { IconArrowDown } from '@opentiny/tiny-robot-svgs'
import type { ExtensionCardActionEvent, ExtensionManagerProps, ExtensionRecord, ExtensionSource } from '../index.type'
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
const sources: ExtensionSource[] = ['installed', 'market']

const getItems = (source: ExtensionSource) => {
  return source === 'installed' ? manager.installedItems.value : manager.marketItems.value
}

const getSectionTitle = (source: ExtensionSource) => {
  const prefix = source === 'installed' ? props.installedTitle : props.marketTitle
  const typeLabel = manager.typeOptions.value.find((option) => option.value === manager.activeType.value)?.label
  return `${prefix}${typeLabel ?? manager.activeType.value}`
}

const getEmptyText = (source: ExtensionSource) => (source === 'installed' ? '暂无已添加扩展' : '暂无市场扩展')

const getLoading = (source: ExtensionSource) => (source === 'installed' ? props.loading : props.marketLoading)

const getError = (source: ExtensionSource) => (source === 'installed' ? props.error : props.marketError)

const handleCardAction = (item: ExtensionRecord, source: ExtensionSource, event: ExtensionCardActionEvent) => {
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
      <section v-for="source in sources" :key="source" class="extension-manager__section">
        <button
          class="extension-manager__section-title"
          type="button"
          :aria-expanded="manager.isSectionExpanded(source)"
          @click="manager.toggleSection(source)"
        >
          <IconArrowDown
            class="extension-manager__section-arrow"
            :class="{ 'is-expanded': manager.isSectionExpanded(source) }"
          />
          <span>{{ getSectionTitle(source) }}</span>
        </button>

        <div v-show="manager.isSectionExpanded(source)" class="extension-manager__section-body">
          <ExtensionList
            :source="source"
            :items="getItems(source)"
            :operation-states="manager.operationStates.value"
            :loading="getLoading(source)"
            :error="getError(source)"
            :empty-text="getEmptyText(source)"
            @retry="manager.requestRefresh(source)"
          >
            <ExtensionCard
              v-for="item in getItems(source)"
              :key="item.id"
              :item="item"
              @name-click="manager.requestDetailOpen(item, source)"
              @action="handleCardAction(item, source, $event)"
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
