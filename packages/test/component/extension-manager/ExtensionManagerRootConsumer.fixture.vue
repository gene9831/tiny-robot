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
    <div data-testid="installed-section-expanded">{{ manager.isSectionExpanded('installed') }}</div>
    <div data-testid="market-section-expanded">{{ manager.isSectionExpanded('market') }}</div>

    <button type="button" data-testid="show-skills" @click="manager.setActiveType('skill')">Skills</button>
    <button type="button" data-testid="toggle-installed-section" @click="manager.toggleSection('installed')">
      Toggle installed section
    </button>
    <button type="button" data-testid="toggle-market-section" @click="manager.toggleSection('market')">
      Toggle market section
    </button>
  </div>
</template>
