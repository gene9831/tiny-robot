<script setup lang="ts">
import { IconClose, IconPlus, IconSearch } from '@opentiny/tiny-robot-svgs'
import { ExtensionList, ExtensionSection } from './components'
import { computed, ref, watch } from 'vue'
import type {
  ExtensionItem,
  ExtensionManagerEmits,
  ExtensionManagerProps,
  ExtensionSource,
  ExtensionType,
} from './index.type'

const props = withDefaults(defineProps<ExtensionManagerProps>(), {
  installedExtensions: () => [],
  marketExtensions: () => [],
  typeOptions: () => [
    { value: 'mcp', label: 'MCP' },
    { value: 'skill', label: 'Skills' },
  ],
  tagOptions: () => [],
  defaultActiveType: 'mcp',
  title: '服务列表',
  searchPlaceholder: '请输入关键字搜索',
  tagPlaceholder: '全部标签',
  installedTitle: '已添加',
  marketTitle: '市场',
  showHeader: true,
  showCloseButton: false,
  showCustomAddButton: true,
  customAddButtonText: '添加自定义服务',
  enableSearch: true,
  enableTagFilter: true,
  allowExtensionAdd: true,
  allowExtensionCreate: true,
  allowExtensionEdit: true,
  allowExtensionDelete: true,
  allowExtensionDetail: true,
  allowExtensionToggle: true,
  allowToolToggle: true,
  loading: false,
  marketLoading: false,
  searchFn: (query: string, item: ExtensionItem) => {
    if (!query) {
      return true
    }

    const keyword = query.toLowerCase()
    return item.name.toLowerCase().includes(keyword) || (item.description || '').toLowerCase().includes(keyword)
  },
})

const emit = defineEmits<ExtensionManagerEmits>()

const visible = defineModel<boolean>('visible', {
  default: true,
})

const activeType = ref<ExtensionType>(props.defaultActiveType)
const searchQuery = ref('')
const activeTag = ref('')
const expandedSections = ref<Record<ExtensionSource, boolean>>({
  installed: true,
  market: true,
})

const activeTypeLabel = computed(() => {
  return props.typeOptions.find((item) => item.value === activeType.value)?.label || activeType.value
})

const installedByType = computed(() => {
  return props.installedExtensions.filter((item) => item.type === activeType.value)
})

const marketByType = computed(() => {
  return props.marketExtensions.filter((item) => item.type === activeType.value)
})

const filterExtension = (item: ExtensionItem, source: ExtensionSource) => {
  const matchTag = source === 'installed' || !activeTag.value || item.tags?.includes(activeTag.value)
  const matchSearch = props.searchFn(searchQuery.value, item, source)
  return matchTag && matchSearch
}

const installedFilteredExtensions = computed(() => {
  return installedByType.value.filter((item) => filterExtension(item, 'installed'))
})

const marketFilteredExtensions = computed(() => {
  return marketByType.value.filter((item) => filterExtension(item, 'market'))
})

const getSectionTitle = (source: ExtensionSource) => {
  const prefix = source === 'installed' ? props.installedTitle : props.marketTitle
  return `${prefix}${activeTypeLabel.value}`
}

const getListBySource = (source: ExtensionSource) => {
  return source === 'installed' ? installedFilteredExtensions.value : marketFilteredExtensions.value
}

const getLoadingBySource = (source: ExtensionSource) => {
  return source === 'installed' ? props.loading : props.marketLoading
}

const getEmptyText = (source: ExtensionSource) => {
  if (searchQuery.value || (source === 'market' && activeTag.value)) {
    return '暂无匹配结果'
  }

  return source === 'installed' ? '暂无已添加扩展' : '暂无市场扩展'
}

const toggleSection = (source: ExtensionSource) => {
  expandedSections.value[source] = !expandedSections.value[source]
}

const handleTypeChange = (type: ExtensionType) => {
  activeType.value = type
}

const handleClose = () => {
  visible.value = false
  emit('update:visible', false)
}

const handleCreate = () => {
  if (!props.allowExtensionCreate) return
  emit('extension-create', activeType.value)
}

const handleAdd = (item: ExtensionItem) => {
  if (!props.allowExtensionAdd || item.addState === 'loading' || item.addState === 'added') return
  emit('extension-add', item)
}

const handleToggle = (item: ExtensionItem, enabled: boolean) => {
  if (!props.allowExtensionToggle) return
  emit('extension-toggle', item, enabled)
}

const handleOpenDetail = (item: ExtensionItem) => {
  if (!props.allowExtensionDetail) return
  emit('extension-detail-open', item)
}

const handleDelete = (item: ExtensionItem) => {
  if (!props.allowExtensionDelete) return
  if (!window.confirm('确定移除该扩展吗？')) return
  emit('extension-delete', item)
}

watch(activeType, (type, oldType) => {
  if (type === oldType) return
  searchQuery.value = ''
  activeTag.value = ''
  emit('type-change', type)
})

watch(searchQuery, (query) => {
  emit('search-change', query, activeType.value)
})

watch(activeTag, (value) => {
  emit('tag-change', value, activeType.value)
})
</script>

<template>
  <div v-if="visible" class="extension-manager">
    <div v-if="props.showHeader" class="extension-manager__header">
      <div class="extension-manager__title">{{ props.title }}</div>
      <div class="extension-manager__header-actions">
        <slot name="header-actions" :active-type="activeType" />
        <button
          v-if="props.showCustomAddButton"
          class="extension-manager__create"
          type="button"
          :disabled="!props.allowExtensionCreate"
          @click="handleCreate"
        >
          <IconPlus class="extension-manager__icon" />
          <span>{{ props.customAddButtonText }}</span>
        </button>
        <IconClose v-if="props.showCloseButton" class="extension-manager__close" @click="handleClose" />
      </div>
    </div>

    <div class="extension-manager__tabs">
      <button
        v-for="typeOption in props.typeOptions"
        :key="typeOption.value"
        class="extension-manager__tab"
        :class="{ 'is-active': activeType === typeOption.value }"
        type="button"
        @click="handleTypeChange(typeOption.value)"
      >
        {{ typeOption.label }}
      </button>
    </div>

    <div class="extension-manager__panel">
      <div class="extension-manager__toolbar">
        <div v-if="props.enableTagFilter" class="extension-manager__filter">
          <select v-model="activeTag" class="extension-manager__select" :aria-label="props.tagPlaceholder">
            <option value="">{{ props.tagPlaceholder }}</option>
            <option v-for="option in props.tagOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>

        <div v-if="props.enableSearch" class="extension-manager__search">
          <input v-model="searchQuery" class="extension-manager__input" :placeholder="props.searchPlaceholder" />
          <IconSearch class="extension-manager__search-icon" />
        </div>
      </div>

      <div class="extension-manager__sections">
        <ExtensionSection
          v-for="source in ['installed', 'market'] as ExtensionSource[]"
          :key="source"
          :title="getSectionTitle(source)"
          :expanded="expandedSections[source]"
          @toggle="toggleSection(source)"
        >
          <ExtensionList
            :items="getListBySource(source)"
            :source="source"
            :loading="getLoadingBySource(source)"
            :empty-text="getEmptyText(source)"
            @extension-add="handleAdd"
            @extension-detail-open="handleOpenDetail"
            @extension-delete="handleDelete"
            @extension-toggle="handleToggle"
          />
        </ExtensionSection>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
.extension-manager {
  box-sizing: border-box;
  width: 100%;
  max-width: 820px;
  padding: 24px;
  background: var(--tr-container-bg-default);
  border: 1px solid var(--tr-mcp-server-picker-border-color-default);
  border-radius: 12px;
  color: var(--tr-text-primary);
}

.extension-manager__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.extension-manager__title {
  font-size: 16px;
  font-weight: 600;
}

.extension-manager__header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.extension-manager__create {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 16px;
  border: 1px solid var(--tr-mcp-server-picker-header-button-border-color);
  border-radius: 999px;
  background: transparent;
  color: var(--tr-mcp-server-picker-header-button-text-color);
  cursor: pointer;
  font-size: 12px;
}

.extension-manager__create:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.extension-manager__close {
  box-sizing: border-box;
  width: 28px;
  height: 28px;
  padding: 5px;
  border-radius: 8px;
  cursor: pointer;
}

.extension-manager__close:hover {
  background: var(--tr-mcp-server-picker-bg-hover);
}

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

.extension-manager__toolbar {
  display: flex;
  gap: 8px;
  padding: 16px 0;
}

.extension-manager__filter {
  flex: 0 0 260px;
}

.extension-manager__search {
  position: relative;
  flex: 1;
  min-width: 220px;
}

.extension-manager__select,
.extension-manager__input {
  box-sizing: border-box;
  width: 100%;
  height: 32px;
  border: 1px solid var(--tr-mcp-server-picker-field-border-color);
  border-radius: 8px;
  outline: none;
  background: var(--tr-container-bg-default);
  color: var(--tr-text-primary);
  font-size: 13px;
}

.extension-manager__select:focus,
.extension-manager__input:focus {
  border-color: var(--tr-mcp-server-picker-tabs-border-color-active);
}

.extension-manager__select {
  padding: 0 12px;
  cursor: pointer;
}

.extension-manager__input {
  padding: 0 36px 0 12px;
}

.extension-manager__search-icon {
  position: absolute;
  top: 50%;
  right: 12px;
  width: 16px;
  height: 16px;
  color: var(--tr-mcp-server-picker-field-icon-color);
  pointer-events: none;
  transform: translateY(-50%);
}

.extension-manager__sections {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.extension-manager__option {
  color: var(--tr-text-primary);
}

@media (max-width: 640px) {
  .extension-manager {
    padding: 18px;
  }

  .extension-manager__header,
  .extension-manager__toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .extension-manager__header-actions {
    justify-content: space-between;
  }

  .extension-manager__filter,
  .extension-manager__search {
    flex: none;
    width: 100%;
    min-width: 0;
  }
}
</style>
