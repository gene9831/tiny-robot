import type { Meta, StoryObj } from '@storybook/vue3-vite'
import type { CardGridItem } from '@opentiny/tiny-robot'
import { ExtensionManager } from '@opentiny/tiny-robot'
import { IconEditPen, IconSparkles } from '@opentiny/tiny-robot-svgs'
import { markRaw, ref } from 'vue'
import ExtensionCardGridEventsStory from './examples/ExtensionCardGridEventsStory.vue'
import ExtensionCardGridItemSlotStory from './examples/ExtensionCardGridItemSlotStory.vue'

const CardGrid = ExtensionManager.CardGrid
const editIcon = markRaw(IconEditPen)
const sparklesIcon = markRaw(IconSparkles)

const defaultItems: CardGridItem[] = [
  {
    id: 'alpha',
    name: 'Alpha extension',
    description: 'Alpha description',
    icon: 'https://example.com/alpha-icon.png',
    actions: [
      { id: 'toggle-alpha', type: 'switch', label: 'Enable Alpha', checked: true, icon: sparklesIcon },
      { id: 'install-alpha', type: 'button', label: 'Install Alpha', icon: editIcon },
      { id: 'inspect-alpha', type: 'custom', label: 'Inspect Alpha', data: { origin: 'storybook' } },
    ],
    primaryActionsLimit: 3,
    progress: 75,
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

const columnItems: CardGridItem[] = Array.from({ length: 8 }, (_, index) => ({
  id: `column-${index}`,
  name: `Column ${index}`,
  description: 'A compact CardGrid item.',
}))

const meta = {
  title: 'Extension Manager/ExtensionCardGrid',
  component: CardGrid,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'ExtensionCardGrid owns list markup, item identity, responsive tracks, and Card event wrapping. Each item keeps its string id on the Grid-owned li and passes the remaining presentation props to Card.',
      },
    },
  },
  argTypes: {
    items: { control: false },
    columns: { control: { type: 'number', min: 0, step: 0.25 } },
    emptyText: { control: 'text' },
  },
  args: {
    items: defaultItems,
    columns: 2,
    emptyText: '暂无内容',
  },
} satisfies Meta<typeof CardGrid>

export default meta

type Story = StoryObj<typeof meta>

export const DefaultCards: Story = {
  args: {
    items: defaultItems,
  },
}

export const ColumnLayout: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { CardGrid },
    setup() {
      return { columnItems }
    },
    template: `
      <div class="storybook-grid-stack">
        <section><h3>One column</h3><CardGrid :items="columnItems" :columns="1" /></section>
        <section><h3>Fractional input floors to two columns</h3><CardGrid :items="columnItems" :columns="2.75" /></section>
        <section><h3>Invalid input falls back to two columns</h3><CardGrid :items="columnItems" :columns="0" /></section>
      </div>
    `,
  }),
}

export const EmptyStates: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { CardGrid },
    setup() {
      const emptyItems: CardGridItem[] = []
      return { emptyItems }
    },
    template: `
      <div class="storybook-grid-stack">
        <section><h3>Default empty text</h3><CardGrid :items="emptyItems" /></section>
        <section><h3>Custom empty text</h3><CardGrid :items="emptyItems" empty-text="Nothing to show" /></section>
        <section>
          <h3>Custom empty slot</h3>
          <CardGrid :items="emptyItems" empty-text="Fallback text">
            <template #empty><strong>Custom empty slot</strong></template>
          </CardGrid>
        </section>
      </div>
    `,
  }),
}

export const ItemSlot: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { ExtensionCardGridItemSlotStory },
    template: '<ExtensionCardGridItemSlotStory />',
  }),
}

export const Responsive: Story = {
  parameters: {
    controls: { disable: true },
    viewport: { defaultViewport: 'responsive' },
  },
  render: () => ({
    components: { CardGrid },
    setup() {
      return { columnItems }
    },
    template: `
      <div class="storybook-grid-responsive">
        <p>Resize the Storybook canvas below 768px to see the configured tracks collapse to one column.</p>
        <CardGrid :items="columnItems" :columns="3" />
      </div>
    `,
  }),
}

export const Events: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { ExtensionCardGridEventsStory },
    template: '<ExtensionCardGridEventsStory />',
  }),
}

export const DuplicateIds: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { CardGrid },
    setup() {
      const visible = ref(false)
      const duplicateItems = ref<CardGridItem[]>([
        { id: 'duplicate-initial', name: 'First duplicate' },
        { id: 'duplicate-initial', name: 'Second duplicate' },
      ])

      const replaceItems = () => {
        duplicateItems.value = [
          { id: 'duplicate-initial', name: 'First duplicate' },
          { id: 'duplicate-initial', name: 'Second duplicate' },
        ]
      }

      const changeIds = () => {
        duplicateItems.value = [
          { id: 'duplicate-changed', name: 'First changed duplicate' },
          { id: 'duplicate-changed', name: 'Second changed duplicate' },
        ]
      }

      return { visible, duplicateItems, replaceItems, changeIds }
    },
    template: `
      <div class="storybook-grid-stack">
        <p>In development, each changed duplicate-id set logs one warning.</p>
        <div class="storybook-grid-controls">
          <button type="button" @click="visible = true">Show duplicates</button>
          <button type="button" @click="replaceItems">Replace with same ids</button>
          <button type="button" @click="changeIds">Change duplicate ids</button>
        </div>
        <CardGrid v-if="visible" :items="duplicateItems" />
      </div>
    `,
  }),
}
