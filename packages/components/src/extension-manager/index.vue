<script setup lang="ts">
import { IconClose, IconPlus } from '@opentiny/tiny-robot-svgs'
import { computed, ref } from 'vue'
import type { Ref } from 'vue'
import ExtensionManagerRoot from './ExtensionManagerRoot.vue'
import { ExtensionFilter } from './components'
import ExtensionManagerContent from './components/ExtensionManagerContent.vue'
import type { ExtensionManagerEmits, ExtensionManagerProps, ExtensionType } from './index.type'

const props = withDefaults(defineProps<ExtensionManagerProps>(), {
  extensions: () => [],
  operationStates: () => ({}),
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
  loading: false,
  marketLoading: false,
})

const emit = defineEmits<ExtensionManagerEmits>()
const visible = defineModel<boolean>('visible', { default: true })
const managerRoot = ref<{
  activeType: Ref<ExtensionType>
  requestCreate: () => void
}>()

const activeType = computed(() => managerRoot.value?.activeType.value ?? props.activeType ?? props.defaultActiveType)

const handleClose = () => {
  visible.value = false
}
</script>

<template>
  <div v-if="visible" class="extension-manager">
    <ExtensionManagerRoot
      ref="managerRoot"
      :extensions="props.extensions"
      :operation-states="props.operationStates"
      :active-type="props.activeType"
      :default-active-type="props.defaultActiveType"
      :expanded-sections="props.expandedSections"
      @update:active-type="emit('update:active-type', $event)"
      @update:expanded-sections="emit('update:expanded-sections', $event)"
      @type-change="emit('type-change', $event)"
      @extension-add="emit('extension-add', $event)"
      @extension-create="emit('extension-create', $event)"
      @extension-detail-open="emit('extension-detail-open', $event)"
      @extension-toggle="emit('extension-toggle', $event)"
      @extension-edit="emit('extension-edit', $event)"
      @extension-delete="emit('extension-delete', $event)"
      @tool-toggle="emit('tool-toggle', $event)"
      @refresh="(type, source) => emit('refresh', type, source)"
    >
      <div v-if="props.showHeader" class="extension-manager__header">
        <div class="extension-manager__title">{{ props.title }}</div>
        <div class="extension-manager__header-actions">
          <slot name="header-actions" :active-type="activeType" />
          <button
            v-if="props.showCustomAddButton"
            class="extension-manager__create"
            type="button"
            @click="managerRoot?.requestCreate()"
          >
            <IconPlus class="extension-manager__icon" />
            <span>{{ props.customAddButtonText }}</span>
          </button>
          <IconClose v-if="props.showCloseButton" class="extension-manager__close" @click="handleClose" />
        </div>
      </div>

      <ExtensionFilter
        :search-placeholder="props.searchPlaceholder"
        :tag-placeholder="props.tagPlaceholder"
        :show-search="props.enableSearch"
        :show-tag-filter="props.enableTagFilter"
        :search-fn="props.searchFn"
        @query-change="emit('search-change', $event, activeType)"
        @tag-change="emit('tag-change', $event, activeType)"
      />

      <ExtensionManagerContent
        :installed-title="props.installedTitle"
        :market-title="props.marketTitle"
        :loading="props.loading"
        :market-loading="props.marketLoading"
        :error="props.error"
        :market-error="props.marketError"
      />
    </ExtensionManagerRoot>
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

@media (max-width: 640px) {
  .extension-manager {
    padding: 18px;
  }

  .extension-manager__header {
    align-items: stretch;
    flex-direction: column;
  }

  .extension-manager__header-actions {
    justify-content: space-between;
  }
}
</style>
