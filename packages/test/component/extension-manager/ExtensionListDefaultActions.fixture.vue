<script setup lang="ts">
import type {
  ExtensionCardPrimaryAction,
  Extension,
  ExtensionOperationStatusMap,
} from '../../../components/src/extension-manager/index.type'
import ExtensionCard from '../../../components/src/extension-manager/components/ExtensionCard.vue'
import ExtensionList from '../../../components/src/extension-manager/components/ExtensionList.vue'
import ExtensionManagerRoot from '../../../components/src/extension-manager/ExtensionManagerRoot.vue'

const installedItem: Extension = {
  id: 'installed-extension',
  kind: 'mcp',
  name: 'Installed extension',
  installed: true,
  config: { enabled: true },
}

const passiveInstalledItem: Extension = {
  id: 'passive-installed-extension',
  kind: 'mcp',
  name: 'Passive installed extension',
  installed: true,
}

const marketItem: Extension = {
  id: 'market-extension',
  kind: 'skill',
  name: 'Market extension',
  installed: false,
}

const pendingMarketItem: Extension = {
  id: 'pending-market-extension',
  kind: 'skill',
  name: 'Pending market extension',
  installed: false,
}

const successfulMarketItem: Extension = {
  id: 'successful-market-extension',
  kind: 'skill',
  name: 'Successful market extension',
  installed: false,
}

const idleMarketItem: Extension = {
  id: 'idle-market-extension',
  kind: 'skill',
  name: 'Idle market extension',
  installed: false,
}

const availableInstalledItem: Extension = {
  id: 'available-installed-extension',
  kind: 'mcp',
  name: 'Available installed extension',
  installed: true,
  config: { enabled: true },
}

const operationStates: ExtensionOperationStatusMap = {
  'market-extension': {
    install: { status: 'error', retryable: true },
  },
  'pending-market-extension': {
    install: { status: 'pending', progress: 50 },
  },
  'successful-market-extension': {
    install: { status: 'success' },
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
  <ExtensionManagerRoot :operation-states="operationStates">
    <ExtensionList scope="installed" :items="[installedItem]">
      <ExtensionCard data-testid="installed-card" :item="installedItem" />
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

    <ExtensionList scope="installed" :items="[passiveInstalledItem]">
      <ExtensionCard data-testid="passive-installed-card" :item="passiveInstalledItem" />
    </ExtensionList>

    <ExtensionList
      scope="available"
      :items="[marketItem, pendingMarketItem, successfulMarketItem, idleMarketItem, availableInstalledItem]"
    >
      <ExtensionCard data-testid="market-card" :item="marketItem" />
      <ExtensionCard data-testid="pending-market-card" :item="pendingMarketItem" />
      <ExtensionCard data-testid="successful-market-card" :item="successfulMarketItem" />
      <ExtensionCard data-testid="idle-market-card" :item="idleMarketItem" />
      <ExtensionCard data-testid="available-installed-card" :item="availableInstalledItem" />
    </ExtensionList>
  </ExtensionManagerRoot>

  <ExtensionCard data-testid="standalone-card" :item="installedItem" />

  <output data-testid="available-input-state">
    {{ JSON.stringify({ marketInstalled: marketItem.installed, pendingInstalled: pendingMarketItem.installed }) }}
  </output>
  <output data-testid="operation-state">{{ operationStates['pending-market-extension'].install?.status }}</output>
</template>
