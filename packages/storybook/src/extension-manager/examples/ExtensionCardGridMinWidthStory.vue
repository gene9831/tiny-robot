<script setup lang="ts">
import type { ExtensionCardGridItem } from '@opentiny/tiny-robot'
import { ExtensionManager } from '@opentiny/tiny-robot'

const items: ExtensionCardGridItem[] = Array.from({ length: 8 }, (_, index) => ({
  id: `min-width-${index}`,
  name: `Minimum width ${index}`,
  description: 'The CardGrid derives its tracks from the container and card minimum width.',
}))
</script>

<template>
  <div class="storybook-grid-stack">
    <section>
      <h3>Default minimum width: 400px</h3>
      <ExtensionManager.CardGrid :items="items" />
    </section>
    <section>
      <h3>Custom minimum width: 260px</h3>
      <ExtensionManager.CardGrid :items="items" style="--tr-extension-card-grid-card-min-width: 260px" />
    </section>
  </div>
</template>
