<script setup lang="ts">
import { useExtensionManagerContext } from '../../../components/src/extension-manager/composables'

const manager = useExtensionManagerContext()
</script>

<template>
  <div>
    <div data-testid="display-installed">{{ manager.displayItems.value.installed.map((item) => item.name).join(',') }}</div>
    <div data-testid="display-market">{{ manager.displayItems.value.market.map((item) => item.name).join(',') }}</div>
    <button type="button" data-testid="show-skills" @click="manager.setActiveType('skill')">Skills</button>
  </div>
</template>
