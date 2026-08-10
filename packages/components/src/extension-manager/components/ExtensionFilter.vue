<script setup lang="ts">
import { IconSearch } from '@opentiny/tiny-robot-svgs'
import type { ExtensionFilterEmits, ExtensionFilterProps } from '../index.type'
import { useExtensionFilter } from '../composables/useExtensionFilter'

const props = withDefaults(defineProps<ExtensionFilterProps>(), {
  searchPlaceholder: '请输入关键字搜索',
  tagPlaceholder: '全部标签',
  showSearch: true,
  showTagFilter: true,
})
const emit = defineEmits<ExtensionFilterEmits>()

const { activeKind, activeTag, kindOptions, searchQuery, tagOptions } = useExtensionFilter(props, emit)

defineExpose({ activeKind })
</script>

<template>
  <div class="extension-filter">
    <div class="extension-filter__filter">
      <select v-model="activeKind" class="extension-filter__select" aria-label="Extension kind">
        <option v-if="!kindOptions.length" value="">No extension types</option>
        <option v-for="option in kindOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
    </div>

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
