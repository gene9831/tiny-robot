<script setup lang="ts">
import { computed } from 'vue'
import type { ExtensionCardPrimaryAction, ExtensionItem, ExtensionListEmits, ExtensionListProps } from '../index.type'
import ExtensionCard from './ExtensionCard.vue'

const props = withDefaults(defineProps<ExtensionListProps>(), {
  items: () => [],
  loading: false,
  emptyText: '暂无扩展',
})

const emit = defineEmits<ExtensionListEmits>()

const getMetaText = (item: ExtensionItem) => {
  if (item.type === 'skill') {
    return ''
  }
  const allTools = Array.isArray(item.metadata?.tools) ? item.metadata?.tools : []

  if (allTools.length === 0) {
    return ''
  }

  return `${allTools.length} 个工具`
}

const getDescriptionLines = (item: ExtensionItem) => {
  return getMetaText(item) ? 1 : 2
}

const getPrimaryAction = (item: ExtensionItem): ExtensionCardPrimaryAction => {
  if (props.source === 'installed') {
    return {
      type: 'toggle',
      enabled: Boolean(item.enabled),
    }
  }

  return {
    type: 'add',
    state: item.addState,
    progress: item.progress,
  }
}

const deleteAction = computed(() => {
  if (props.source !== 'installed') {
    return undefined
  }

  return {}
})
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
        :description-lines="getDescriptionLines(item)"
        :primary-action="getPrimaryAction(item)"
        :delete-action="deleteAction"
        @add="emit('extension-add', item)"
        @name-click="emit('extension-detail-open', item)"
        @delete="emit('extension-delete', item)"
        @toggle="(enabled) => emit('extension-toggle', item, enabled)"
      >
        <template v-if="getMetaText(item)" #meta>
          {{ getMetaText(item) }}
        </template>
      </ExtensionCard>
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
