<script setup lang="ts">
import type { CardGridItem } from '@opentiny/tiny-robot'
import { ExtensionManager } from '@opentiny/tiny-robot'

const items: CardGridItem[] = [
  {
    id: 'alpha',
    name: 'Alpha extension',
    description: 'The full item is available to the consumer slot.',
    icon: 'https://example.com/alpha-icon.png',
    primaryActionsLimit: 1,
  },
  {
    id: 'beta',
    name: 'Beta extension',
    description: 'Grid identity stays outside the Card props.',
    nameClickable: false,
  },
]

const serializeItem = (item: CardGridItem) =>
  JSON.stringify(item, (key, value) => {
    if (key === 'icon' && value && typeof value !== 'string') return '[component]'
    return value
  })
</script>

<template>
  <ExtensionManager.CardGrid :items="items" :columns="2">
    <template #item="{ item, index }">
      <article class="storybook-grid-slot-item">
        <strong>{{ item.name }}</strong>
        <span>Grid id: {{ item.id }}</span>
        <span>Index: {{ index }}</span>
        <code>{{ serializeItem(item) }}</code>
      </article>
    </template>
  </ExtensionManager.CardGrid>
</template>

<style scoped>
.storybook-grid-slot-item {
  display: grid;
  gap: 6px;
  min-height: 108px;
  padding: 14px;
  border: 1px dashed #9eb4d6;
  border-radius: 8px;
  background: #fff;
  color: #52607a;
  font-size: 12px;
}

.storybook-grid-slot-item strong {
  color: #243f75;
  font-size: 14px;
}

.storybook-grid-slot-item code {
  overflow: hidden;
  color: #7082a1;
  font:
    11px/1.4 ui-monospace,
    SFMono-Regular,
    Consolas,
    monospace;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
