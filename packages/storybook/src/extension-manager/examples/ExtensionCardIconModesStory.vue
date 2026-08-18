<script setup lang="ts">
import { ExtensionManager } from '@opentiny/tiny-robot'
import { IconSparkles } from '@opentiny/tiny-robot-svgs'
import { markRaw } from 'vue'

const sparklesIcon = markRaw(IconSparkles)
</script>

<template>
  <div class="storybook-card-stack">
    <ExtensionManager.Card
      name="String icon"
      description="A string icon is rendered as an image."
      icon="https://cdn.jsdelivr.net/npm/remixicon@4.9.1/icons/Development/puzzle-line.svg"
    />
    <ExtensionManager.Card
      name="Component icon"
      description="A component icon is rendered with component :is."
      :icon="sparklesIcon"
    />
    <ExtensionManager.Card name="Placeholder icon" description="Omitting icon keeps the first-character placeholder." />
  </div>
</template>

<style>
.storybook-card-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
