<script setup lang="ts">
import { useExtensionManagerContext } from '../../../components/src/extension-manager/composables'

const manager = useExtensionManagerContext()
</script>

<template>
  <div>
    <div data-testid="active-type">{{ manager.activeType.value }}</div>
    <div data-testid="installed-items">{{ manager.installedItems.value.map((item) => item.name).join(',') }}</div>
    <div data-testid="market-items">{{ manager.marketItems.value.map((item) => item.name).join(',') }}</div>
    <div data-testid="install-operation-phase">{{ manager.operationStates.value.train?.install?.phase }}</div>

    <button type="button" data-testid="show-skills" @click="manager.setActiveType('skill')">Skills</button>
  </div>
</template>
