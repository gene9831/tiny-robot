<script setup lang="ts">
import type { ExtensionCardGridItem } from '@opentiny/tiny-robot'
import { ExtensionManager } from '@opentiny/tiny-robot'

const items: ExtensionCardGridItem[] = []
</script>

<template>
  <div class="storybook-grid-stack">
    <section>
      <h3>Default empty text</h3>
      <ExtensionManager.CardGrid :items="items" />
    </section>
    <section>
      <h3>Custom empty text</h3>
      <ExtensionManager.CardGrid :items="items" empty-text="Nothing to show" />
    </section>
    <section>
      <h3>Custom empty slot</h3>
      <ExtensionManager.CardGrid :items="items" empty-text="Fallback text">
        <template #empty><strong>Custom empty slot</strong></template>
      </ExtensionManager.CardGrid>
    </section>
  </div>
</template>
