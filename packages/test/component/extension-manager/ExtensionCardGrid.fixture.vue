<script setup lang="ts">
import { computed, ref } from 'vue'
import { IconEditPen } from '@opentiny/tiny-robot-svgs'
import type {
  ExtensionCardGridActionEvent,
  ExtensionCardGridItem,
  ExtensionCardGridNameClickEvent,
} from '../../../components/src/extension-manager/index.type'
import ExtensionCardGrid from '../../../components/src/extension-manager/components/ExtensionCardGrid.vue'

const items: ExtensionCardGridItem[] = [
  {
    id: 'alpha',
    name: 'Alpha extension',
    description: 'Alpha description',
    icon: 'https://example.com/alpha-icon.png',
    actions: [
      {
        id: 'toggle-alpha',
        type: 'switch',
        label: 'Enable Alpha',
        checked: true,
        icon: IconEditPen,
        hidden: false,
        disabled: false,
        danger: false,
      },
      {
        id: 'install-alpha',
        type: 'button',
        label: 'Install Alpha',
        icon: IconEditPen,
        hidden: false,
        disabled: false,
        danger: false,
      },
      {
        id: 'inspect-alpha',
        type: 'custom',
        label: 'Inspect Alpha',
        icon: IconEditPen,
        hidden: false,
        disabled: false,
        danger: false,
        data: { origin: 'grid-fixture', nested: { enabled: true } },
      },
    ],
    primaryActionsLimit: 3,
    progress: 75,
    nameClickable: true,
    overflowMenuLabel: 'Alpha actions',
    overflowMenuPlacement: 'top-end',
  },
  {
    id: 'beta',
    name: 'Beta extension',
    description: 'Beta description',
    nameClickable: false,
  },
]

const columnItems: ExtensionCardGridItem[] = Array.from({ length: 8 }, (_, index) => ({
  id: `column-${index}`,
  name: `Column ${index}`,
}))

const emptyItems: ExtensionCardGridItem[] = []
const actionEvents = ref<ExtensionCardGridActionEvent[]>([])
const lastNameClick = ref<ExtensionCardGridNameClickEvent>()

const actionSummary = computed(() =>
  actionEvents.value
    .map(({ itemId, action }) => `${itemId}:${action.id}:${action.type}:${action.checked ?? ''}`)
    .join('|'),
)

const serializeItem = (item: ExtensionCardGridItem) =>
  JSON.stringify(item, (key, value) => {
    if (key === 'icon' && value && typeof value !== 'string') return '[component]'
    return value
  })

const handleAction = (event: ExtensionCardGridActionEvent) => {
  actionEvents.value.push(event)
}

const handleNameClick = (event: ExtensionCardGridNameClickEvent) => {
  lastNameClick.value = event
}

const createDuplicateItems = (id: string): ExtensionCardGridItem[] => [
  { id, name: `${id} first` },
  { id, name: `${id} second` },
]

const duplicateItems = ref(createDuplicateItems('duplicate-initial'))
const duplicateGridVisible = ref(false)

const showDuplicateGrid = () => {
  duplicateGridVisible.value = true
}

const replaceDuplicateItems = () => {
  duplicateItems.value = createDuplicateItems('duplicate-initial')
}

const changeDuplicateItems = () => {
  duplicateItems.value = createDuplicateItems('duplicate-changed')
}
</script>

<template>
  <ExtensionCardGrid data-testid="default-grid" :items="items" @action="handleAction" @name-click="handleNameClick" />

  <ExtensionCardGrid data-testid="slot-grid" :items="items">
    <template #item="{ item, index }">
      <article :data-testid="`slot-item-${item.id}`">
        <output :data-testid="`slot-item-${item.id}-value`">{{ serializeItem(item) }}</output>
        <output :data-testid="`slot-item-${item.id}-index`">{{ index }}</output>
      </article>
    </template>
  </ExtensionCardGrid>

  <ExtensionCardGrid data-testid="default-empty-grid" :items="emptyItems" />
  <ExtensionCardGrid data-testid="text-empty-grid" :items="emptyItems" empty-text="Nothing to show" />
  <ExtensionCardGrid data-testid="slot-empty-grid" :items="emptyItems" empty-text="Fallback empty text">
    <template #empty>
      <span data-testid="custom-empty">Custom empty slot</span>
    </template>
  </ExtensionCardGrid>

  <div data-testid="default-min-width-container" style="width: 820px">
    <ExtensionCardGrid data-testid="default-min-width-grid" :items="columnItems" />
  </div>

  <div data-testid="narrow-min-width-container" style="width: 640px">
    <ExtensionCardGrid data-testid="narrow-min-width-grid" :items="columnItems" />
  </div>

  <div data-testid="custom-min-width-container" style="width: 820px">
    <ExtensionCardGrid
      data-testid="custom-min-width-grid"
      :items="columnItems"
      style="--tr-extension-card-grid-card-min-width: 260px"
    />
  </div>

  <button data-testid="show-duplicate-grid" type="button" @click="showDuplicateGrid">Show duplicates</button>
  <button data-testid="replace-duplicate-items" type="button" @click="replaceDuplicateItems">
    Replace duplicate items
  </button>
  <button data-testid="change-duplicate-items" type="button" @click="changeDuplicateItems">
    Change duplicate item ids
  </button>
  <ExtensionCardGrid v-if="duplicateGridVisible" data-testid="duplicate-grid" :items="duplicateItems" />

  <output data-testid="action-events">{{ actionSummary }}</output>
  <output data-testid="name-click-item-id">{{ lastNameClick?.itemId }}</output>
</template>
