<script setup lang="ts">
import { IconDelete } from '@opentiny/tiny-robot-svgs'
import type {
  ExtensionCardActionEvent,
  ExtensionCardMoreAction,
  ExtensionCardPrimaryAction,
  ExtensionItem,
  ExtensionListEmits,
  ExtensionListProps,
} from '../index.type'
import ExtensionCard from './ExtensionCard.vue'

const props = withDefaults(defineProps<ExtensionListProps>(), {
  items: () => [],
  loading: false,
  emptyText: '暂无扩展',
})

const emit = defineEmits<ExtensionListEmits>()

const getPrimaryActions = (item: ExtensionItem): ExtensionCardPrimaryAction[] => {
  if (props.source === 'installed') {
    return [
      {
        id: 'toggle',
        type: 'toggle',
        enabled: Boolean(item.enabled),
        ariaLabel: item.enabled ? '停用扩展' : '启用扩展',
      },
    ]
  }

  return [
    {
      id: 'add',
      type: 'add',
      state: item.addState,
      progress: item.progress,
    },
  ]
}

const getMoreActions = (): ExtensionCardMoreAction[] => {
  if (props.source !== 'installed') {
    return []
  }

  return [
    {
      id: 'delete',
      label: '删除',
      icon: IconDelete,
      danger: true,
    },
  ]
}

const handleAction = (item: ExtensionItem, event: ExtensionCardActionEvent) => {
  if (event.type === 'more') {
    if (event.action.id === 'delete') {
      emit('extension-delete', item)
    }
    return
  }

  if (event.type === 'toggle') {
    emit('extension-toggle', item, event.enabled)
  } else if (event.type === 'add') {
    emit('extension-add', item)
  }
}
</script>

<template>
  <div class="tr-extension-list">
    <div v-if="loading" class="tr-extension-list__state">加载中...</div>

    <template v-else-if="items.length">
      <ExtensionCard
        v-for="item in items"
        :key="item.id"
        :name="item.name"
        :description="item.description"
        :icon="item.icon"
        :primary-actions="getPrimaryActions(item)"
        :more-actions="getMoreActions()"
        @action="(event) => handleAction(item, event)"
        @name-click="emit('extension-detail-open', item)"
      />
    </template>

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

@media (max-width: 768px) {
  .tr-extension-list {
    grid-template-columns: 1fr;
  }
}
</style>
