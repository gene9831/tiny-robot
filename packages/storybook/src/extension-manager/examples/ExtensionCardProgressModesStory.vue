<script setup lang="ts">
import { ExtensionManager } from '@opentiny/tiny-robot'
</script>

<template>
  <div class="storybook-card-stack">
    <ExtensionManager.Card
      name="Determinate progress"
      description="Numeric values are clamped to 0..100."
      :progress="45"
    />
    <ExtensionManager.Card
      name="Indeterminate progress"
      description="The caller can show activity without exposing a percentage."
      progress="indeterminate"
    />
    <ExtensionManager.Card name="No progress" description="Omitting progress hides the progress bar." />
  </div>
</template>
