import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ExtensionManager } from '@opentiny/tiny-robot'
import ExtensionCardActionsStory from './examples/ExtensionCardActionsStory.vue'
import extensionCardActionsSource from './examples/ExtensionCardActionsStory.vue?raw'
import ExtensionCardCustomActionStory from './examples/ExtensionCardCustomActionStory.vue'
import extensionCardCustomActionSource from './examples/ExtensionCardCustomActionStory.vue?raw'
import ExtensionCardIconModesStory from './examples/ExtensionCardIconModesStory.vue'
import extensionCardIconModesSource from './examples/ExtensionCardIconModesStory.vue?raw'
import ExtensionCardOverflowWithoutIconsStory from './examples/ExtensionCardOverflowWithoutIconsStory.vue'
import extensionCardOverflowWithoutIconsSource from './examples/ExtensionCardOverflowWithoutIconsStory.vue?raw'
import ExtensionCardPlaygroundStory from './examples/ExtensionCardPlaygroundStory.vue'
import extensionCardPlaygroundSource from './examples/ExtensionCardPlaygroundStory.vue?raw'
import ExtensionCardProgressModesStory from './examples/ExtensionCardProgressModesStory.vue'
import extensionCardProgressModesSource from './examples/ExtensionCardProgressModesStory.vue?raw'

const Card = ExtensionManager.Card

const meta = {
  title: 'Extension Manager/ExtensionCard',
  component: Card,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'ExtensionCard is a standalone presentation primitive. It receives direct display fields and stateless action descriptors; the caller owns switch state, progress meaning, and business operations.',
      },
    },
  },
  argTypes: {
    icon: {
      control: false,
      description: 'A string URL renders an image; a Vue component renders directly; omission uses the placeholder.',
    },
    actions: {
      control: false,
      description: 'One ordered action array is split between the primary region and overflow menu.',
    },
    primaryActionsLimit: {
      control: { type: 'number', min: 0, step: 1 },
    },
    progress: {
      control: 'select',
      options: [undefined, 'indeterminate', 0, 45, 100],
    },
    overflowMenuPlacement: {
      control: 'select',
      options: ['bottom-end', 'top-end'],
    },
  },
  args: {
    name: 'Standalone extension',
    description: 'A reusable card without ExtensionManager Root or List context.',
    nameClickable: true,
    actions: [],
    primaryActionsLimit: 1,
    overflowMenuLabel: '更多操作',
    overflowMenuPlacement: 'bottom-end',
    overflowMenuShowIcons: true,
  },
} satisfies Meta<typeof Card>

export default meta

type Story = StoryObj<typeof meta>

export const Basic: Story = {
  args: {
    name: 'Search extension',
    description: 'Direct presentation props are enough for a compact summary card.',
    icon: 'https://cdn.jsdelivr.net/npm/remixicon@4.9.1/icons/Development/puzzle-line.svg',
  },
}

export const IconModes: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      source: {
        code: extensionCardIconModesSource,
        language: 'html',
        type: 'code',
      },
    },
  },
  render: () => ({
    components: { ExtensionCardIconModesStory },
    template: '<ExtensionCardIconModesStory />',
  }),
}

export const Actions: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      source: {
        code: extensionCardActionsSource,
        language: 'html',
        type: 'code',
      },
    },
  },
  render: () => ({
    components: { ExtensionCardActionsStory },
    template: '<ExtensionCardActionsStory />',
  }),
}

export const OverflowWithoutIcons: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      source: {
        code: extensionCardOverflowWithoutIconsSource,
        language: 'html',
        type: 'code',
      },
    },
  },
  render: () => ({
    components: { ExtensionCardOverflowWithoutIconsStory },
    template: '<ExtensionCardOverflowWithoutIconsStory />',
  }),
}

export const ProgressModes: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      source: {
        code: extensionCardProgressModesSource,
        language: 'html',
        type: 'code',
      },
    },
  },
  render: () => ({
    components: { ExtensionCardProgressModesStory },
    template: '<ExtensionCardProgressModesStory />',
  }),
}

export const CustomPrimaryAction: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      source: {
        code: extensionCardCustomActionSource,
        language: 'html',
        type: 'code',
      },
    },
  },
  render: () => ({
    components: { ExtensionCardCustomActionStory },
    template: '<ExtensionCardCustomActionStory />',
  }),
}

export const Playground: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      source: {
        code: extensionCardPlaygroundSource,
        language: 'html',
        type: 'code',
      },
    },
  },
  render: () => ({
    components: { ExtensionCardPlaygroundStory },
    template: '<ExtensionCardPlaygroundStory />',
  }),
}
