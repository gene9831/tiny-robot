<script setup lang="ts">
import type { ExtensionCardGridItem } from '@opentiny/tiny-robot'
import { ExtensionManager } from '@opentiny/tiny-robot'

const items: ExtensionCardGridItem[] = Array.from({ length: 8 }, (_, index) => ({
  id: `responsive-${index}`,
  name: `Responsive ${index}`,
  description: 'Resize the canvas to inspect the responsive track.',
}))
</script>

<template>
  <div class="storybook-grid-responsive">
    <p>Resize the Storybook canvas below 768px to see the configured tracks collapse to one column.</p>
    <ExtensionManager.CardGrid :items="items" :columns="3" />
  </div>
</template>
