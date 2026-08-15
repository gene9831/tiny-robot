<script setup lang="ts">
import type { ExtensionCardGridItem } from '@opentiny/tiny-robot'
import { ExtensionManager } from '@opentiny/tiny-robot'

const items: ExtensionCardGridItem[] = Array.from({ length: 8 }, (_, index) => ({
  id: `column-${index}`,
  name: `Column ${index}`,
  description: 'A compact CardGrid item.',
}))
</script>

<template>
  <div class="storybook-grid-stack">
    <section>
      <h3>One column</h3>
      <ExtensionManager.CardGrid :items="items" :columns="1" />
    </section>
    <section>
      <h3>Fractional input floors to two columns</h3>
      <ExtensionManager.CardGrid :items="items" :columns="2.75" />
    </section>
    <section>
      <h3>Invalid input falls back to two columns</h3>
      <ExtensionManager.CardGrid :items="items" :columns="0" />
    </section>
  </div>
</template>
