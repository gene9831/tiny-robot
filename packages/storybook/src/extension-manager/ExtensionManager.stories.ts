import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ExtensionManager } from '@opentiny/tiny-robot'
import ExtensionManagerPlaygroundStory from './examples/ExtensionManagerPlaygroundStory.vue'
import extensionManagerPlaygroundSource from './examples/ExtensionManagerPlaygroundStory.vue?raw'

const meta = {
  title: 'Extension Manager/ExtensionManager',
  component: ExtensionManager,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'ExtensionManager composes tabs, independent sections, and CardGrid-backed extension items. The Playground keeps the state local so each foundation state can be inspected without a service or persistence layer.',
      },
    },
  },
} satisfies Meta<typeof ExtensionManager>

export default meta

type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    tabs: [],
  },
  parameters: {
    controls: { disable: true },
    docs: {
      source: {
        code: extensionManagerPlaygroundSource,
        language: 'html',
        type: 'code',
      },
    },
  },
  render: () => ({
    components: { ExtensionManagerPlaygroundStory },
    template: '<ExtensionManagerPlaygroundStory />',
  }),
}
