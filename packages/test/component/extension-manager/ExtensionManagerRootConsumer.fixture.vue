<script setup lang="ts">
import type { Extension } from '../../../components/src/extension-manager/index.type'
import { useExtensionContext } from '../../../components/src/extension-manager/composables'

const manager = useExtensionContext()

const map: Extension = { id: 'map', kind: 'mcp', name: 'Map service', installed: true, config: { enabled: true } }
const plainInstalled: Extension = {
  id: 'plain-installed',
  kind: 'mcp',
  name: 'Plain installed service',
  installed: true,
}
const train: Extension = { id: 'train', kind: 'mcp', name: 'Train service', installed: false }

const requestMalformedToggle = () => {
  manager.requestToggle(map, 'false' as unknown as boolean)
}

const requestMalformedToolToggle = () => {
  manager.requestToolToggle(map, 'map-directions', 'false' as unknown as boolean)
}
</script>

<template>
  <div>
    <div data-testid="all-extensions">{{ manager.allExtensions.value.map((item) => item.name).join(',') }}</div>
    <div data-testid="display-items">
      {{ manager.displayItems.value.installed.map((item) => item.name).join(',') }}|{{
        manager.displayItems.value.available.map((item) => item.name).join(',')
      }}
    </div>
    <div data-testid="installed-items">{{ manager.installedItems.value.map((item) => item.name).join(',') }}</div>
    <div data-testid="available-items">{{ manager.availableItems.value.map((item) => item.name).join(',') }}</div>
    <div data-testid="install-operation-status">{{ manager.operationStates.value.train?.install?.status }}</div>
    <div data-testid="normalized-available-config">
      {{ 'config' in manager.availableItems.value[0] ? 'present' : 'absent' }}
    </div>
    <div data-testid="installed-section-expanded">{{ manager.isSectionExpanded('installed') }}</div>
    <div data-testid="available-section-expanded">{{ manager.isSectionExpanded('available') }}</div>

    <button type="button" data-testid="toggle-installed-section" @click="manager.toggleSection('installed')">
      Toggle installed section
    </button>
    <button type="button" data-testid="toggle-available-section" @click="manager.toggleSection('available')">
      Toggle available section
    </button>
    <button type="button" data-testid="request-install" @click="manager.requestInstall(train)">Install</button>
    <button type="button" data-testid="request-toggle" @click="manager.requestToggle(map, false)">Toggle</button>
    <button type="button" data-testid="request-malformed-toggle" @click="requestMalformedToggle">
      Request malformed toggle
    </button>
    <button type="button" data-testid="request-malformed-tool-toggle" @click="requestMalformedToolToggle">
      Request malformed tool toggle
    </button>
    <button
      type="button"
      data-testid="request-toggle-without-enabled"
      @click="manager.requestToggle(plainInstalled, false)"
    >
      Toggle without enabled
    </button>
    <button type="button" data-testid="request-delete-available" @click="manager.requestDelete(train)">
      Delete available
    </button>
    <button type="button" data-testid="request-delete-installed" @click="manager.requestDelete(map)">
      Delete installed
    </button>
    <button type="button" data-testid="request-detail" @click="manager.requestDetail(train)">Details</button>
    <button type="button" data-testid="request-create" @click="manager.requestCreate('mcp')">Create</button>
  </div>
</template>
