<script setup lang="ts">
import { useExtensionContext } from '../../../components/src/extension-manager/composables'

const manager = useExtensionContext()
</script>

<template>
  <div>
    <div data-testid="display-installed">
      {{ manager.displayItems.value.installed.map((item) => item.name).join(',') }}
    </div>
    <div data-testid="display-available">
      {{ manager.displayItems.value.available.map((item) => item.name).join(',') }}
    </div>
  </div>
</template>
