<script setup lang="ts">
import { IconArrowDown } from '@opentiny/tiny-robot-svgs'
import { computed } from 'vue'
import type { ExtensionCardActionEvent, ExtensionContext, ExtensionManagerProps } from '../index.type'
import { useExtensionContext } from '../composables'
import ExtensionCard from './ExtensionCard.vue'
import ExtensionList from './ExtensionList.vue'

const props = withDefaults(
  defineProps<
    Pick<
      ExtensionManagerProps,
      'installedTitle' | 'availableTitle' | 'loading' | 'availableLoading' | 'error' | 'availableError'
    >
  >(),
  {
    installedTitle: '已添加',
    availableTitle: '市场',
    loading: false,
    availableLoading: false,
  },
)

const manager: ExtensionContext = useExtensionContext()
const sections = computed(() => [
  { source: 'installed' as const, items: manager.displayItems.value.installed },
  { source: 'available' as const, items: manager.displayItems.value.available },
])
type ExtensionRuntimeItem = (typeof sections.value)[number]['items'][number]
type ExtensionRuntimeScope = (typeof sections.value)[number]['source']

const getSectionTitle = (source: ExtensionRuntimeScope) =>
  source === 'installed' ? props.installedTitle : props.availableTitle

const getEmptyText = (source: ExtensionRuntimeScope) => (source === 'installed' ? '暂无已添加扩展' : '暂无可用扩展')

const getLoading = (source: ExtensionRuntimeScope) => (source === 'installed' ? props.loading : props.availableLoading)

const getError = (source: ExtensionRuntimeScope) => (source === 'installed' ? props.error : props.availableError)

const handleCardAction = (item: ExtensionRuntimeItem, event: ExtensionCardActionEvent) => {
  if (event.id === 'toggle' && typeof event.checked === 'boolean') {
    manager.requestToggle(item, event.checked)
  } else if (event.id === 'add') {
    manager.requestInstall(item)
  } else if (event.id === 'delete') {
    manager.requestDelete(item)
  }
}
</script>

<template>
  <div class="extension-manager__content">
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
            :scope="section.source"
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
              @name-click="manager.requestDetail(item)"
              @action="handleCardAction(item, $event)"
            />
          </ExtensionList>
        </div>
      </section>
    </div>
  </div>
</template>

<style lang="less" scoped>
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
