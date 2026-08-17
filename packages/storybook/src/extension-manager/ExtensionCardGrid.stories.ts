import type { Meta, StoryObj } from '@storybook/vue3-vite'
import type { ExtensionCardGridItem } from '@opentiny/tiny-robot'
import { ExtensionManager } from '@opentiny/tiny-robot'
import { IconEditPen, IconSparkles } from '@opentiny/tiny-robot-svgs'
import { markRaw } from 'vue'
import ExtensionCardGridMinWidthStory from './examples/ExtensionCardGridMinWidthStory.vue'
import minWidthSource from './examples/ExtensionCardGridMinWidthStory.vue?raw'
import ExtensionCardGridDefaultCardsStory from './examples/ExtensionCardGridDefaultCardsStory.vue'
import defaultCardsSource from './examples/ExtensionCardGridDefaultCardsStory.vue?raw'
import ExtensionCardGridDuplicateIdsStory from './examples/ExtensionCardGridDuplicateIdsStory.vue'
import duplicateIdsSource from './examples/ExtensionCardGridDuplicateIdsStory.vue?raw'
import ExtensionCardGridEmptyStatesStory from './examples/ExtensionCardGridEmptyStatesStory.vue'
import emptyStatesSource from './examples/ExtensionCardGridEmptyStatesStory.vue?raw'
import ExtensionCardGridEventsStory from './examples/ExtensionCardGridEventsStory.vue'
import eventsSource from './examples/ExtensionCardGridEventsStory.vue?raw'
import ExtensionCardGridItemSlotStory from './examples/ExtensionCardGridItemSlotStory.vue'
import itemSlotSource from './examples/ExtensionCardGridItemSlotStory.vue?raw'
import ExtensionCardGridResponsiveStory from './examples/ExtensionCardGridResponsiveStory.vue'
import responsiveSource from './examples/ExtensionCardGridResponsiveStory.vue?raw'

const CardGrid = ExtensionManager.CardGrid
const editIcon = markRaw(IconEditPen)
const sparklesIcon = markRaw(IconSparkles)

const defaultItems: ExtensionCardGridItem[] = [
  {
    id: 'alpha',
    name: 'Alpha extension',
    description: 'Alpha description',
    icon: 'https://cdn.jsdelivr.net/npm/remixicon@4.9.1/icons/Development/puzzle-line.svg',
    actions: [
      { id: 'toggle-alpha', type: 'switch', label: 'Enable Alpha', checked: true, icon: sparklesIcon },
      { id: 'install-alpha', type: 'button', label: 'Install Alpha', icon: editIcon },
      { id: 'inspect-alpha', type: 'custom', label: 'Inspect Alpha', data: { origin: 'storybook' } },
    ],
    progress: 75,
  },
  {
    id: 'beta',
    name: 'Beta extension',
    description: 'Beta description',
    nameClickable: false,
  },
]

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
    emptyText: { control: 'text' },
  },
  args: {
    items: defaultItems,
    emptyText: '暂无内容',
  },
} satisfies Meta<typeof CardGrid>

export default meta

type Story = StoryObj<typeof meta>

export const DefaultCards: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      source: {
        code: defaultCardsSource,
        language: 'html',
        type: 'code',
      },
    },
  },
  args: {
    items: defaultItems,
  },
  render: () => ({
    components: { ExtensionCardGridDefaultCardsStory },
    template: '<ExtensionCardGridDefaultCardsStory />',
  }),
}

export const MinCardWidth: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      source: {
        code: minWidthSource,
        language: 'html',
        type: 'code',
      },
    },
  },
  render: () => ({
    components: { ExtensionCardGridMinWidthStory },
    template: '<ExtensionCardGridMinWidthStory />',
  }),
}

export const EmptyStates: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      source: {
        code: emptyStatesSource,
        language: 'html',
        type: 'code',
      },
    },
  },
  render: () => ({
    components: { ExtensionCardGridEmptyStatesStory },
    template: '<ExtensionCardGridEmptyStatesStory />',
  }),
}

export const ItemSlot: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      source: {
        code: itemSlotSource,
        language: 'html',
        type: 'code',
      },
    },
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
    docs: {
      source: {
        code: responsiveSource,
        language: 'html',
        type: 'code',
      },
    },
  },
  render: () => ({
    components: { ExtensionCardGridResponsiveStory },
    template: '<ExtensionCardGridResponsiveStory />',
  }),
}

export const Events: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      source: {
        code: eventsSource,
        language: 'html',
        type: 'code',
      },
    },
  },
  render: () => ({
    components: { ExtensionCardGridEventsStory },
    template: '<ExtensionCardGridEventsStory />',
  }),
}

export const DuplicateIds: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      source: {
        code: duplicateIdsSource,
        language: 'html',
        type: 'code',
      },
    },
  },
  render: () => ({
    components: { ExtensionCardGridDuplicateIdsStory },
    template: '<ExtensionCardGridDuplicateIdsStory />',
  }),
}
