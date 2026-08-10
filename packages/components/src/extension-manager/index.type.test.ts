import type {
  Extension,
  ExtensionIntent,
  ExtensionListProps,
  ExtensionManagerContext,
  ExtensionManagerRootProps,
  ExtensionScope,
  ExtensionSearchFn,
} from './index.type'

const input = { id: 'available', kind: 'skill', name: 'Available skill' }
const extension: Extension = { ...input, installed: false }

const rootProps: ExtensionManagerRootProps = {
  extensions: [input],
  expandedSections: { installed: true, available: true },
}

const listProps: ExtensionListProps = {
  items: [extension],
  scope: 'available',
}

const search: ExtensionSearchFn = (_query, item, scope) => item.kind === 'skill' && scope === 'available'

const intent: ExtensionIntent = { id: 'available', kind: 'skill' }

declare const context: ExtensionManagerContext
const scope: ExtensionScope = 'available'
const availableItems: Extension[] = context.availableItems.value

context.isSectionExpanded(scope)
context.requestInstall(extension)

void rootProps
void listProps
void search
void intent
void availableItems
