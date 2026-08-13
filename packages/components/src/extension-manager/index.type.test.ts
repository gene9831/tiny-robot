import type { Component } from 'vue'
import type {
  Extension,
  ExtensionContext,
  ExtensionCardAction,
  ExtensionCardActionEvent,
  ExtensionCardProps,
  ExtensionIntent,
  ExtensionListProps,
  ExtensionRootProps,
  ExtensionScope,
  ExtensionSearchFn,
} from './index.type'

const input = { id: 'available', kind: 'skill', name: 'Available skill' }
const extension: Extension = { ...input, installed: false }

const rootProps: ExtensionRootProps = {
  extensions: [input],
  expandedSections: { installed: true, available: true },
}

const listProps: ExtensionListProps = {
  items: [extension],
  scope: 'available',
}

const icon = {} as Component

const cardProps: ExtensionCardProps = {
  name: 'Standalone card',
  description: 'Card description',
  icon,
  actions: [
    { id: 'enabled', type: 'switch', label: '启用扩展', checked: true },
    { id: 'install', type: 'button', label: '安装' },
    { id: 'inspect', type: 'custom', label: '检查', data: { origin: 'type-test' } },
  ],
  primaryActionsLimit: 1,
  progress: 'indeterminate',
  nameClickable: false,
  overflowMenuLabel: '扩展操作',
  overflowMenuPlacement: 'top-end',
}

const switchAction: ExtensionCardAction = {
  id: 'enabled',
  type: 'switch',
  label: '启用扩展',
  checked: false,
}
const buttonAction: ExtensionCardAction = {
  id: 'install',
  type: 'button',
  label: '安装',
}
const customAction: ExtensionCardAction = {
  id: 'inspect',
  type: 'custom',
  label: '检查',
}
const event: ExtensionCardActionEvent = {
  id: 'enabled',
  type: 'switch',
  checked: true,
}

// @ts-expect-error Card no longer accepts an Extension item.
const oldCardProps: ExtensionCardProps = { item: extension }
// @ts-expect-error Every action requires a label.
const unlabeledAction: ExtensionCardAction = { id: 'install', type: 'button' }
// @ts-expect-error Domain-specific install action is not a Card action type.
const installAction: ExtensionCardAction = { id: 'install', type: 'install', label: '安装' }

const search: ExtensionSearchFn = (_query, item, scope) => item.kind === 'skill' && scope === 'available'

const intent: ExtensionIntent = { id: 'available', kind: 'skill' }

declare const context: ExtensionContext
const scope: ExtensionScope = 'available'
const availableItems: Extension[] = context.availableItems.value

context.isSectionExpanded(scope)
context.requestInstall(extension)

void rootProps
void listProps
void search
void intent
void availableItems
void cardProps
void switchAction
void buttonAction
void customAction
void event
void oldCardProps
void unlabeledAction
void installAction
