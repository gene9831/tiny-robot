<script setup lang="ts">
import type { ExtensionRecord } from '../../../components/src/extension-manager/index.type'
import { useExtensionManagerContext } from '../../../components/src/extension-manager/composables'

const manager = useExtensionManagerContext()

const map: ExtensionRecord = { id: 'map', type: 'mcp', name: 'Map service', installation: { enabled: true } }
const train: ExtensionRecord = { id: 'train', type: 'mcp', name: 'Train service' }
</script>

<template>
  <div>
    <div data-testid="active-type">{{ manager.activeType.value }}</div>
    <div data-testid="display-items">
      {{ manager.displayItems.value.installed.map((item) => item.name).join(',') }}|{{
        manager.displayItems.value.market.map((item) => item.name).join(',')
      }}
    </div>
    <div data-testid="installed-items">{{ manager.installedItems.value.map((item) => item.name).join(',') }}</div>
    <div data-testid="market-items">{{ manager.marketItems.value.map((item) => item.name).join(',') }}</div>
    <div data-testid="install-operation-phase">{{ manager.operationStates.value.train?.install?.phase }}</div>
    <div data-testid="installed-section-expanded">{{ manager.isSectionExpanded('installed') }}</div>
    <div data-testid="market-section-expanded">{{ manager.isSectionExpanded('market') }}</div>

    <button type="button" data-testid="show-skills" @click="manager.setActiveType('skill')">Skills</button>
    <button type="button" data-testid="show-mcp" @click="manager.setActiveType('mcp')">MCP</button>
    <button type="button" data-testid="toggle-installed-section" @click="manager.toggleSection('installed')">
      Toggle installed section
    </button>
    <button type="button" data-testid="toggle-market-section" @click="manager.toggleSection('market')">
      Toggle market section
    </button>
    <button type="button" data-testid="request-add" @click="manager.requestAdd(train, 'market')">Add</button>
    <button type="button" data-testid="request-toggle" @click="manager.requestToggle(map, false, 'installed')">
      Toggle
    </button>
    <button type="button" data-testid="request-delete" @click="manager.requestDelete(map, 'installed')">Delete</button>
    <button type="button" data-testid="request-detail-open" @click="manager.requestDetailOpen(train, 'market')">
      Details
    </button>
  </div>
</template>
