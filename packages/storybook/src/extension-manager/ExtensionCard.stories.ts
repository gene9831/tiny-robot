import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ExtensionManager } from '@opentiny/tiny-robot'
import { IconDelete, IconEditPen, IconSparkles } from '@opentiny/tiny-robot-svgs'
import { markRaw } from 'vue'
import ExtensionCardCustomActionStory from './examples/ExtensionCardCustomActionStory.vue'
import ExtensionCardPlaygroundStory from './examples/ExtensionCardPlaygroundStory.vue'

const Card = ExtensionManager.Card
const sparklesIcon = markRaw(IconSparkles)
const editIcon = markRaw(IconEditPen)
const deleteIcon = markRaw(IconDelete)

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
    icon: 'https://example.com/search-extension.png',
  },
}

export const IconModes: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { Card },
    setup() {
      return { sparklesIcon }
    },
    template: `
      <div class="storybook-card-stack">
        <Card name="String icon" description="A string icon is rendered as an image." icon="https://example.com/icon.png" />
        <Card name="Component icon" description="A component icon is rendered with component :is." :icon="sparklesIcon" />
        <Card name="Placeholder icon" description="Omitting icon keeps the first-character placeholder." />
      </div>
    `,
  }),
}

export const Actions: Story = {
  args: {
    name: 'Action states',
    description: 'Hidden actions are removed before partitioning; disabled and danger states remain visible.',
    icon: sparklesIcon,
    actions: [
      { id: 'enabled', type: 'switch', label: '启用扩展', checked: true, icon: sparklesIcon },
      { id: 'configure', type: 'button', label: '配置', icon: editIcon },
      { id: 'inspect', type: 'custom', label: '检查', data: { origin: 'storybook' } },
      { id: 'delete', type: 'button', label: '删除', icon: deleteIcon, danger: true },
      { id: 'hidden', type: 'button', label: '隐藏操作', hidden: true },
      { id: 'disabled', type: 'button', label: '暂不可用', disabled: true },
    ],
    primaryActionsLimit: 2,
    overflowMenuLabel: '扩展操作',
  },
}

export const OverflowWithoutIcons: Story = {
  parameters: {
    controls: { disable: true },
  },
  args: {
    name: 'Overflow icon policy',
    description: 'The menu can keep labels and events while omitting every action icon and icon slot.',
    actions: [
      { id: 'edit', type: 'button', label: '编辑', icon: editIcon },
      { id: 'remove', type: 'button', label: '移除', icon: deleteIcon, danger: true },
    ],
    primaryActionsLimit: 0,
    overflowMenuLabel: '无图标溢出菜单',
    overflowMenuShowIcons: false,
  },
}

export const ProgressModes: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { Card },
    template: `
      <div class="storybook-card-stack">
        <Card name="Determinate progress" description="Numeric values are clamped to 0..100." :progress="45" />
        <Card name="Indeterminate progress" description="The caller can show activity without exposing a percentage." progress="indeterminate" />
        <Card name="No progress" description="Omitting progress hides the progress bar." />
      </div>
    `,
  }),
}

export const CustomPrimaryAction: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { ExtensionCardCustomActionStory },
    template: '<ExtensionCardCustomActionStory />',
  }),
}

export const Playground: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { ExtensionCardPlaygroundStory },
    template: '<ExtensionCardPlaygroundStory />',
  }),
}
