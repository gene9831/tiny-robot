<script setup lang="ts">
import type { Extension } from '../../../components/src/extension-manager/index.type'
import ExtensionCard from '../../../components/src/extension-manager/components/ExtensionCard.vue'

const item: Extension = {
  id: 'item-extension',
  kind: 'mcp',
  name: 'Item name',
  description: 'Item description',
  icon: 'https://example.com/item-icon.png',
  installed: false,
}
</script>

<template>
  <div>
    <ExtensionCard data-testid="canonical-item-card" :item="item" />
  </div>
</template>
