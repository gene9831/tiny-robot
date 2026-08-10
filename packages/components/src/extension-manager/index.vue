<script setup lang="ts">
import { IconClose, IconPlus } from '@opentiny/tiny-robot-svgs'
import { computed, ref } from 'vue'
import ExtensionManagerRoot from './ExtensionManagerRoot.vue'
import { ExtensionFilter } from './components'
import ExtensionManagerContent from './components/ExtensionManagerContent.vue'
import type { ExtensionContext, ExtensionManagerEmits, ExtensionManagerProps } from './index.type'

const props = withDefaults(defineProps<ExtensionManagerProps>(), {
  extensions: () => [],
  operationStates: () => ({}),
  defaultActiveKind: 'mcp',
  title: '服务列表',
  searchPlaceholder: '请输入关键字搜索',
  tagPlaceholder: '全部标签',
  installedTitle: '已添加',
  availableTitle: '市场',
  showHeader: true,
  showCloseButton: false,
  showCustomAddButton: true,
  customAddButtonText: '添加自定义服务',
  enableSearch: true,
  enableTagFilter: true,
  loading: false,
  availableLoading: false,
})

const emit = defineEmits<ExtensionManagerEmits>()
const visible = defineModel<boolean>('visible', { default: true })
const managerRoot = ref<Pick<ExtensionContext, 'activeKind' | 'requestCreate'>>()

const activeKind = computed(() => managerRoot.value?.activeKind.value ?? props.activeKind ?? props.defaultActiveKind)

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
      :active-kind="props.activeKind"
      :default-active-kind="props.defaultActiveKind"
      :expanded-sections="props.expandedSections"
      @update:active-kind="emit('update:active-kind', $event)"
      @update:expanded-sections="emit('update:expanded-sections', $event)"
      @kind-change="emit('kind-change', $event)"
      @install="emit('install', $event)"
      @create="emit('create', $event)"
      @detail="emit('detail', $event)"
      @toggle="emit('toggle', $event)"
      @edit="emit('edit', $event)"
      @delete="emit('delete', $event)"
      @tool-toggle="emit('tool-toggle', $event)"
      @refresh="emit('refresh', $event)"
    >
      <div v-if="props.showHeader" class="extension-manager__header">
        <div class="extension-manager__title">{{ props.title }}</div>
        <div class="extension-manager__header-actions">
          <slot name="header-actions" :active-kind="activeKind" />
          <button
            v-if="props.showCustomAddButton"
            class="extension-manager__create"
            type="button"
            @click="managerRoot?.requestCreate(activeKind)"
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
        @query-change="emit('search-change', $event, activeKind)"
        @tag-change="emit('tag-change', $event, activeKind)"
      />

      <ExtensionManagerContent
        :installed-title="props.installedTitle"
        :available-title="props.availableTitle"
        :loading="props.loading"
        :available-loading="props.availableLoading"
        :error="props.error"
        :available-error="props.availableError"
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
