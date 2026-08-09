<script setup lang="ts">
import { IconSearch } from '@opentiny/tiny-robot-svgs'
import { computed, onUnmounted, ref, watch } from 'vue'
import type {
  ExtensionDisplay,
  ExtensionFilterEmits,
  ExtensionFilterProps,
  ExtensionItem,
  ExtensionSource,
} from '../index.type'
import { useExtensionManagerFilterContext } from '../composables/useExtensionManager'

const props = withDefaults(defineProps<ExtensionFilterProps>(), {
  searchPlaceholder: '请输入关键字搜索',
  tagPlaceholder: '全部标签',
  showSearch: true,
  showTagFilter: true,
})
const emit = defineEmits<ExtensionFilterEmits>()

const manager = useExtensionManagerFilterContext()
const filterLease = manager.claimFilter()
const uncontrolledQuery = ref('')
const uncontrolledTag = ref('')

const searchQuery = computed({
  get: () => props.query ?? uncontrolledQuery.value,
  set: (query: string) => {
    if (props.query === undefined) uncontrolledQuery.value = query
    emit('update:query', query)
    emit('query-change', query)
  },
})

const activeTag = computed({
  get: () => props.tag ?? uncontrolledTag.value,
  set: (tag: string) => {
    if (props.tag === undefined) uncontrolledTag.value = tag
    emit('update:tag', tag)
    emit('tag-change', tag)
  },
})

const tagOptions = computed(() =>
  [...new Set(manager.catalog.value.flatMap((item) => item.tags ?? []))].map((value) => ({ value, label: value })),
)

const defaultSearch = (query: string, item: ExtensionItem) => {
  if (!query) return true

  const keyword = query.toLowerCase()
  return item.name.toLowerCase().includes(keyword) || (item.description || '').toLowerCase().includes(keyword)
}

const filterItem = (item: ExtensionItem, source: ExtensionSource) => {
  if (item.type !== manager.activeType.value) return false

  const matchesTag = !activeTag.value || item.tags?.includes(activeTag.value)
  const search = props.searchFn ?? defaultSearch
  return Boolean(matchesTag && search(searchQuery.value, item, source))
}

const display = computed<ExtensionDisplay>(() => ({
  installed: manager.installationDisplayItems.value.installed.filter((item) => filterItem(item, 'installed')),
  market: manager.installationDisplayItems.value.market.filter((item) => filterItem(item, 'market')),
}))

if (filterLease.active) {
  watch(
    display,
    (value) => {
      manager.setDisplayItems(value)
    },
    { immediate: true },
  )

  watch(manager.activeType, () => {
    searchQuery.value = ''
    activeTag.value = ''
  })
}

onUnmounted(() => {
  filterLease()
})
</script>

<template>
  <div class="extension-filter">
    <div v-if="props.showTagFilter" class="extension-filter__filter">
      <select v-model="activeTag" class="extension-filter__select" :aria-label="props.tagPlaceholder">
        <option value="">{{ props.tagPlaceholder }}</option>
        <option v-for="option in tagOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
    </div>

    <div v-if="props.showSearch" class="extension-filter__search">
      <input v-model="searchQuery" class="extension-filter__input" :placeholder="props.searchPlaceholder" />
      <IconSearch class="extension-filter__search-icon" />
    </div>
  </div>
</template>

<style lang="less" scoped>
.extension-filter {
  display: flex;
  gap: 8px;
  padding: 16px 0;
}

.extension-filter__filter {
  flex: 0 0 260px;
}

.extension-filter__search {
  position: relative;
  flex: 1;
  min-width: 220px;
}

.extension-filter__select,
.extension-filter__input {
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

.extension-filter__select:focus,
.extension-filter__input:focus {
  border-color: var(--tr-mcp-server-picker-tabs-border-color-active);
}

.extension-filter__select {
  padding: 0 12px;
  cursor: pointer;
}

.extension-filter__input {
  padding: 0 36px 0 12px;
}

.extension-filter__search-icon {
  position: absolute;
  top: 50%;
  right: 12px;
  width: 16px;
  height: 16px;
  color: var(--tr-mcp-server-picker-field-icon-color);
  pointer-events: none;
  transform: translateY(-50%);
}

@media (max-width: 640px) {
  .extension-filter {
    align-items: stretch;
    flex-direction: column;
  }

  .extension-filter__filter,
  .extension-filter__search {
    flex: none;
    width: 100%;
    min-width: 0;
  }
}
</style>
