<script setup lang="ts">
import { computed, ref } from 'vue'
import type {
  CardGridActionEvent,
  CardGridItem,
  CardGridNameClickEvent,
} from '../../../components/src/extension-manager/index.type'
import ExtensionCardGrid from '../../../components/src/extension-manager/components/ExtensionCardGrid.vue'

const items: CardGridItem[] = [
  {
    id: 'alpha',
    name: 'Alpha extension',
    description: 'Alpha description',
    actions: [
      { id: 'toggle-alpha', type: 'switch', label: 'Enable Alpha', checked: true },
      { id: 'install-alpha', type: 'button', label: 'Install Alpha' },
      { id: 'inspect-alpha', type: 'custom', label: 'Inspect Alpha' },
    ],
    primaryActionsLimit: 3,
    nameClickable: true,
  },
  {
    id: 'beta',
    name: 'Beta extension',
    description: 'Beta description',
    nameClickable: false,
  },
]

const emptyItems: CardGridItem[] = []
const columnCases = [
  { testId: 'columns-one', columns: 1 },
  { testId: 'columns-fraction', columns: 2.75 },
  { testId: 'columns-integer', columns: 7 },
  { testId: 'columns-zero', columns: 0 },
  { testId: 'columns-negative', columns: -2 },
  { testId: 'columns-nan', columns: Number.NaN },
  { testId: 'columns-infinity', columns: Number.POSITIVE_INFINITY },
]

const actionEvents = ref<CardGridActionEvent[]>([])
const lastNameClick = ref<CardGridNameClickEvent>()

const actionSummary = computed(() =>
  actionEvents.value
    .map(({ itemId, action }) => `${itemId}:${action.id}:${action.type}:${action.checked ?? ''}`)
    .join('|'),
)

const describeItem = (item: CardGridItem) =>
  [
    item.id,
    item.name,
    item.description,
    item.actions?.map((action) => action.id).join(',') ?? '',
    String(item.nameClickable),
  ].join('|')

const handleAction = (event: CardGridActionEvent) => {
  actionEvents.value.push(event)
}

const handleNameClick = (event: CardGridNameClickEvent) => {
  lastNameClick.value = event
}

const createDuplicateItems = (id: string): CardGridItem[] => [
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
        <output :data-testid="`slot-item-${item.id}-value`">{{ describeItem(item) }}</output>
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
    :items="emptyItems"
    :columns="columnCase.columns"
  />

  <ExtensionCardGrid data-testid="responsive-grid" :items="items" :columns="3" />

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
