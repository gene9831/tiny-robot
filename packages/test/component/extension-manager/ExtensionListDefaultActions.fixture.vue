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

const availableItem: Extension = {
  id: 'available-extension',
  kind: 'skill',
  name: 'Available extension',
  installed: false,
}

const pendingAvailableItem: Extension = {
  id: 'pending-available-extension',
  kind: 'skill',
  name: 'Pending available extension',
  installed: false,
}

const successfulAvailableItem: Extension = {
  id: 'successful-available-extension',
  kind: 'skill',
  name: 'Successful available extension',
  installed: false,
}

const idleAvailableItem: Extension = {
  id: 'idle-available-extension',
  kind: 'skill',
  name: 'Idle available extension',
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
  'available-extension': {
    install: { status: 'error', retryable: true },
  },
  'pending-available-extension': {
    install: { status: 'pending', progress: 50 },
  },
  'successful-available-extension': {
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
      :items="[availableItem, pendingAvailableItem, successfulAvailableItem, idleAvailableItem, availableInstalledItem]"
    >
      <ExtensionCard data-testid="available-card" :item="availableItem" />
      <ExtensionCard data-testid="pending-available-card" :item="pendingAvailableItem" />
      <ExtensionCard data-testid="successful-available-card" :item="successfulAvailableItem" />
      <ExtensionCard data-testid="idle-available-card" :item="idleAvailableItem" />
      <ExtensionCard data-testid="available-installed-card" :item="availableInstalledItem" />
    </ExtensionList>
  </ExtensionManagerRoot>

  <ExtensionCard data-testid="standalone-card" :item="installedItem" />

  <output data-testid="available-input-state">
    {{
      JSON.stringify({ availableInstalled: availableItem.installed, pendingInstalled: pendingAvailableItem.installed })
    }}
  </output>
  <output data-testid="operation-state">{{ operationStates['pending-available-extension'].install?.status }}</output>
</template>
