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
const columnCases = [
  { testId: 'columns-one', columns: 1 },
  { testId: 'columns-sub-unit', columns: 0.5 },
  { testId: 'columns-fraction', columns: 2.75 },
  { testId: 'columns-integer', columns: 7 },
  { testId: 'columns-zero', columns: 0 },
  { testId: 'columns-negative', columns: -2 },
  { testId: 'columns-nan', columns: Number.NaN },
  { testId: 'columns-infinity', columns: Number.POSITIVE_INFINITY },
]

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

  <ExtensionCardGrid
    v-for="columnCase in columnCases"
    :key="columnCase.testId"
    :data-testid="columnCase.testId"
    :items="columnItems"
    :columns="columnCase.columns"
  />

  <ExtensionCardGrid data-testid="responsive-grid" :items="columnItems" :columns="3" />

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
