<script setup lang="ts">
import { ref } from 'vue'
import type { ExtensionManagerTab } from '../../../components/src/extension-manager/index.type'
import ExtensionManager from '../../../components/src/extension-manager/index.vue'

const tabs = ref<ExtensionManagerTab[]>([
  {
    id: 'a/b',
    label: 'Slash tab',
    sections: [
      {
        id: '__proto__',
        title: 'Prototype section',
        items: [],
        collapsible: true,
        defaultExpanded: true,
      },
    ],
  },
  {
    id: 'a-b',
    label: 'Dash tab',
    sections: [
      {
        id: 'dash-section',
        title: 'Dash section',
        items: [],
        collapsible: true,
      },
    ],
  },
])

const eventLog = ref<string[]>([])

const record = (event: string) => eventLog.value.push(event)

const handleActiveTabUpdate = (tabId: string | undefined) => {
  record(`update:active-tab:${tabId ?? 'undefined'}`)
}

const handleExpandedSectionsUpdate = (expanded: Record<string, boolean>) => {
  record(`update:expanded-sections:${JSON.stringify(expanded)}`)
}

const handleSectionToggle = (event: { tabId: string; sectionId: string; expanded: boolean }) => {
  record(`section-toggle:${event.tabId}/${event.sectionId}/${event.expanded}`)
}

const disableDefaultTab = () => {
  tabs.value = tabs.value.map((tab) => (tab.id === 'a-b' ? { ...tab, disabled: true } : tab))
}

const craftedCanonicalStateKey = 'extension-manager/section/8:identity/9:canonical'

const identityTabs: ExtensionManagerTab[] = [
  {
    id: 'identity',
    label: 'Identity tab',
    sections: [
      {
        id: 'canonical',
        title: 'Canonical',
        items: [],
        collapsible: true,
        defaultExpanded: true,
      },
      {
        id: craftedCanonicalStateKey,
        title: 'Crafted state key',
        items: [],
        collapsible: true,
        defaultExpanded: true,
      },
      {
        id: '__proto__',
        title: 'Prototype identity',
        items: [],
        collapsible: true,
        defaultExpanded: true,
      },
    ],
  },
]

const identityExpandedSections: Record<string, boolean> = {}
Object.defineProperty(identityExpandedSections, 'canonical', {
  configurable: true,
  enumerable: true,
  value: false,
  writable: true,
})
Object.defineProperty(identityExpandedSections, craftedCanonicalStateKey, {
  configurable: true,
  enumerable: true,
  value: true,
  writable: true,
})
Object.defineProperty(identityExpandedSections, '__proto__', {
  configurable: true,
  enumerable: true,
  value: false,
  writable: true,
})
</script>

<template>
  <div data-testid="uncontrolled-manager">
    <ExtensionManager
      :tabs="tabs"
      default-active-tab="a-b"
      :default-expanded="false"
      empty-text="No uncontrolled tabs"
      @update:active-tab="handleActiveTabUpdate"
      @update:expanded-sections="handleExpandedSectionsUpdate"
      @section-toggle="handleSectionToggle"
    >
      <template #tab="{ tab, active, select }">
        <span :data-testid="`uncontrolled-tab-slot-${tab.id}`" @click="select">
          {{ tab.label }}<span v-if="active"> selected</span>
        </span>
      </template>

      <template #section-header="{ tab, section, expanded, toggle }">
        <button
          type="button"
          :data-testid="`uncontrolled-section-header-${tab.id}-${section.id}`"
          :aria-expanded="expanded"
          @click="toggle"
        >
          {{ section.title }}
        </button>
      </template>
    </ExtensionManager>
  </div>

  <button type="button" data-testid="disable-default-tab" @click="disableDefaultTab">Disable default tab</button>

  <output data-testid="uncontrolled-event-log">{{ eventLog.join('|') }}</output>

  <div data-testid="identity-manager">
    <ExtensionManager :tabs="identityTabs" :expanded-sections="identityExpandedSections" :show-header="false">
      <template #section-header="{ tab, section, expanded, toggle }">
        <button
          type="button"
          :data-testid="`identity-section-header-${tab.id}-${section.id}`"
          :aria-expanded="expanded"
          @click="toggle"
        >
          {{ section.title }}
        </button>
      </template>
    </ExtensionManager>
  </div>
</template>
