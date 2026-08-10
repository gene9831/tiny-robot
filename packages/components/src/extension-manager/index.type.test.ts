import type {
  Extension,
  ExtensionContext,
  ExtensionCardPrimaryAction,
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

const cardProps: ExtensionCardProps = { item: extension }

// Card presentation is canonicalized through the required Extension item.
// @ts-expect-error ExtensionCardProps requires an item
const cardWithoutItem: ExtensionCardProps = {}

// Operation state is projected privately by List, not accepted from public actions.
const installAction: ExtensionCardPrimaryAction = { id: 'install', type: 'install' }
// @ts-expect-error public install actions do not expose operation status
const installActionWithState: ExtensionCardPrimaryAction = { id: 'install', type: 'install', state: 'pending' }

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
void cardWithoutItem
void installAction
void installActionWithState
