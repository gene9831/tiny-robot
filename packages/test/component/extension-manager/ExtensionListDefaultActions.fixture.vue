<script setup lang="ts">
import type {
  ExtensionCardPrimaryAction,
  ExtensionOperationStateMap,
  ExtensionRecord,
} from '../../../components/src/extension-manager/index.type'
import ExtensionCard from '../../../components/src/extension-manager/components/ExtensionCard.vue'
import ExtensionList from '../../../components/src/extension-manager/components/ExtensionList.vue'

const installedItem: ExtensionRecord = {
  id: 'installed-extension',
  type: 'mcp',
  name: 'Installed extension',
  installation: { enabled: true },
}

const unavailableInstalledItem: ExtensionRecord = {
  id: 'unavailable-installed-extension',
  type: 'mcp',
  name: 'Unavailable installed extension',
}

const marketItem: ExtensionRecord = {
  id: 'market-extension',
  type: 'skill',
  name: 'Market extension',
}

const pendingMarketItem: ExtensionRecord = {
  id: 'pending-market-extension',
  type: 'skill',
  name: 'Pending market extension',
}

const successfulMarketItem: ExtensionRecord = {
  id: 'successful-market-extension',
  type: 'skill',
  name: 'Successful market extension',
}

const idleMarketItem: ExtensionRecord = {
  id: 'idle-market-extension',
  type: 'skill',
  name: 'Idle market extension',
}

const operationStates: ExtensionOperationStateMap = {
  'market-extension': {
    install: { phase: 'error', retryable: true },
  },
  'pending-market-extension': {
    install: { phase: 'pending', progress: 50 },
  },
  'successful-market-extension': {
    install: { phase: 'success' },
  },
}

const overridePrimaryActions: ExtensionCardPrimaryAction[] = [
  {
    id: 'configure',
    type: 'button',
    label: '配置',
  },
]
</script>

<template>
  <ExtensionList source="installed" :items="[installedItem]">
    <ExtensionCard data-testid="installed-card" :item="installedItem" />
    <ExtensionCard
      id="installed-extension"
      data-testid="explicit-id-card"
      :item="{ ...installedItem, id: 'unmatched-extension' }"
      :more-menu-actions="[]"
    />
    <ExtensionCard
      data-testid="override-card"
      :item="installedItem"
      :primary-actions="overridePrimaryActions"
      :more-menu-actions="[]"
    />
    <ExtensionCard
      data-testid="empty-actions-card"
      :item="installedItem"
      :primary-actions="[]"
      :more-menu-actions="[]"
    />
  </ExtensionList>

  <ExtensionList source="installed" :items="[unavailableInstalledItem]">
    <ExtensionCard data-testid="unavailable-installed-card" :item="unavailableInstalledItem" />
  </ExtensionList>

  <ExtensionList
    source="market"
    :items="[marketItem, pendingMarketItem, successfulMarketItem, idleMarketItem]"
    :operation-states="operationStates"
  >
    <ExtensionCard data-testid="market-card" :item="marketItem" />
    <ExtensionCard data-testid="pending-market-card" :item="pendingMarketItem" />
    <ExtensionCard data-testid="successful-market-card" :item="successfulMarketItem" />
    <ExtensionCard data-testid="idle-market-card" :item="idleMarketItem" />
  </ExtensionList>

  <ExtensionCard data-testid="standalone-card" :item="installedItem" />
</template>
