<script setup lang="ts">
import type { ExtensionManagerTagOption } from '../index.type'

defineOptions({ name: 'ExtensionFilterControls' })

const props = defineProps<{
  tags: readonly ExtensionManagerTagOption[]
}>()

const selectedTag = defineModel<string>('selectedTag', { default: '' })
const searchValue = defineModel<string>('searchValue', { default: '' })
</script>

<template>
  <div class="extension-filter-controls" data-testid="extension-filter-controls">
    <div data-testid="filter-root" class="extension-filter-controls__fields">
      <select
        data-testid="filter-tag"
        class="extension-filter-controls__select"
        aria-label="标签"
        :disabled="props.tags.length === 0"
        v-model="selectedTag"
      >
        <option value="">全部标签</option>
        <option v-for="tag in props.tags" :key="tag.value" :value="tag.value">{{ tag.label }}</option>
      </select>
      <input
        data-testid="filter-search"
        class="extension-filter-controls__input"
        type="search"
        aria-label="搜索扩展"
        placeholder="请输入关键字搜索"
        v-model="searchValue"
      />
    </div>
  </div>
</template>

<style lang="less" scoped>
.extension-filter-controls {
  display: flex;
  gap: 8px;
  padding: 16px 0;
}

.extension-filter-controls__select,
.extension-filter-controls__input {
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

.extension-filter-controls__fields {
  display: contents;
}

.extension-filter-controls__select {
  flex: 0 0 260px;
  padding: 0 12px;
}
.extension-filter-controls__input {
  flex: 1;
  min-width: 220px;
  padding: 0 12px;
}

.extension-filter-controls__select:focus,
.extension-filter-controls__input:focus {
  border-color: var(--tr-mcp-server-picker-tabs-border-color-active);
}

@media (max-width: 640px) {
  .extension-filter-controls {
    align-items: stretch;
    flex-direction: column;
  }
  .extension-filter-controls__select,
  .extension-filter-controls__input {
    flex: none;
    width: 100%;
    min-width: 0;
  }
}
</style>
