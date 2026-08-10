<script setup lang="ts">
import { computed } from 'vue'
import { IconDelete } from '@opentiny/tiny-robot-svgs'
import { useExtensionContext } from '../composables'
import { provideExtensionListContext } from '../composables/useExtensionListContext'
import type {
  ExtensionCardMoreMenuAction,
  ExtensionListEmits,
  ExtensionListProps,
  ExtensionListSlots,
} from '../index.type'
import type { ExtensionCardRenderAction } from '../internal.type'

const props = withDefaults(defineProps<ExtensionListProps>(), {
  items: () => [],
  loading: false,
  emptyText: '暂无扩展',
  errorText: '加载失败，请重试',
})

defineSlots<ExtensionListSlots>()

const emit = defineEmits<ExtensionListEmits>()
const extensionContext = useExtensionContext(false)

const hasError = computed(() => props.error !== undefined && props.error !== null)
const runtimeItems = computed(() => props.items ?? [])
const operationStates = computed(() => extensionContext?.operationStates.value ?? {})

const getEnabled = (item: (typeof runtimeItems.value)[number]) => {
  if (typeof item.config !== 'object' || item.config === null || !('enabled' in item.config)) return undefined
  return typeof item.config.enabled === 'boolean' ? item.config.enabled : undefined
}

const getDefaultPrimaryActions = (id: string): ExtensionCardRenderAction[] => {
  const item = runtimeItems.value.find((candidate) => candidate.id === id)

  if (!item) return []

  if (props.scope === 'installed') {
    const enabled = getEnabled(item)
    if (enabled === undefined) return []

    return [
      {
        id: 'toggle',
        type: 'toggle',
        checked: enabled,
        ariaLabel: enabled ? '停用扩展' : '启用扩展',
      },
    ]
  }

  const installOperation = operationStates.value[item.id]?.install

  return [
    {
      id: 'install',
      type: 'install',
      state: installOperation?.status,
      progress: installOperation?.progress,
      disabled: installOperation?.status === 'error' && installOperation.retryable === false,
    },
  ]
}

const getDefaultMoreActions = (id: string): ExtensionCardMoreMenuAction[] => {
  const item = runtimeItems.value.find((candidate) => candidate.id === id)

  if (!item || props.scope !== 'installed') return []

  return [{ id: 'delete', label: '删除', icon: IconDelete, danger: true }]
}

provideExtensionListContext({ getDefaultPrimaryActions, getDefaultMoreActions })

const retry = () => emit('retry')
</script>

<template>
  <div class="tr-extension-list">
    <div v-if="loading" class="tr-extension-list__state">加载中...</div>

    <slot v-else-if="hasError" name="error" :error="error" :retry="retry">
      <div class="tr-extension-list__state tr-extension-list__state--error">
        <span>{{ errorText }}</span>
        <button type="button" class="tr-extension-list__retry" @click="retry">重试</button>
      </div>
    </slot>

    <slot v-else-if="items.length" />

    <div v-else class="tr-extension-list__state">
      {{ emptyText }}
    </div>
  </div>
</template>

<style lang="less" scoped>
.tr-extension-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 16px;
  padding: 12px 0 4px;
}

.tr-extension-list__state {
  grid-column: 1 / -1;
  padding: 28px 0;
  color: var(--tr-text-secondary);
  font-size: 13px;
  text-align: center;
}

.tr-extension-list__state--error {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.tr-extension-list__retry {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--tr-color-primary);
  cursor: pointer;
  font: inherit;
}

@media (max-width: 768px) {
  .tr-extension-list {
    grid-template-columns: 1fr;
  }
}
</style>
