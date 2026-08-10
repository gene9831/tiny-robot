<script setup lang="ts">
import ExtensionCard from '../../../components/src/extension-manager/components/ExtensionCard.vue'

const item = {
  id: 'item-extension',
  name: 'Item name',
  description: 'Item description',
  icon: 'https://example.com/item-icon.png',
  iconAlt: 'Item icon alt',
}
</script>

<template>
  <div>
    <ExtensionCard data-testid="item-fallback-card" :item="item" icon="https://example.com/explicit-icon.png" />

    <ExtensionCard
      data-testid="explicit-override-card"
      :item="item"
      name="Explicit name"
      description="Explicit description"
      icon-alt="Explicit icon alt"
    />
  </div>
</template>
