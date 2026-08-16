import type { Component } from 'vue'
import type {
  ExtensionCardGridActionEvent,
  ExtensionCardGridEmits,
  ExtensionCardGridItem,
  ExtensionCardGridNameClickEvent,
  ExtensionCardGridProps,
  ExtensionCardGridSlots,
  Extension,
  ExtensionContext,
  ExtensionCardAction,
  ExtensionCardActionEvent,
  ExtensionCardProps,
  ExtensionIntent,
  ExtensionManagerActionEvent,
  ExtensionManagerExpandedSections,
  ExtensionManagerEmits,
  ExtensionManagerItem,
  ExtensionManagerNameClickEvent,
  ExtensionManagerProps,
  ExtensionManagerSection,
  ExtensionManagerSectionKey,
  ExtensionManagerSectionToggleEvent,
  ExtensionManagerSlots,
  ExtensionManagerTab,
  ExtensionManagerTabChangeEvent,
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

const cardGridItem: ExtensionCardGridItem = {
  ...cardProps,
  id: 'grid-item',
}

const cardGridProps: ExtensionCardGridProps = {
  items: [cardGridItem],
  columns: 3,
  emptyText: 'No cards',
}
const cardGridDefaultProps: ExtensionCardGridProps = {
  items: [cardGridItem],
}

const cardGridSlots: ExtensionCardGridSlots = {
  item: ({ item, index }) => {
    const itemId: string = item.id
    const itemName: string = item.name
    const itemIndex: number = index

    void itemId
    void itemName
    void itemIndex
    return []
  },
  empty: () => [],
}

const cardGridActionEvent: ExtensionCardGridActionEvent = {
  itemId: cardGridItem.id,
  action: event,
}
const cardGridNameClickEvent: ExtensionCardGridNameClickEvent = {
  itemId: cardGridItem.id,
  event: {} as MouseEvent,
}

declare const cardGridEmit: ExtensionCardGridEmits
cardGridEmit('action', cardGridActionEvent)
cardGridEmit('name-click', cardGridNameClickEvent)

const managerItem: ExtensionManagerItem = {
  ...cardProps,
  id: 'manager-item',
  installed: true,
}

const managerSection: ExtensionManagerSection = {
  key: 'installed',
  title: '已安装',
  items: [managerItem],
  columns: 2,
}
const managerEmptySection: ExtensionManagerSection = {
  key: 'available',
  title: '可安装',
  items: [],
}

const managerTab: ExtensionManagerTab = {
  id: 'catalog',
  label: 'Catalog',
  disabled: false,
  badge: 2,
  items: [managerItem],
}
const secondManagerTab: ExtensionManagerTab = {
  id: 'updates',
  label: 'Updates',
  badge: 'new',
  items: [],
}

const managerExpandedSections: ExtensionManagerExpandedSections = {
  catalog: { installed: true, available: false },
  updates: { installed: false, available: true },
}
const managerProps: ExtensionManagerProps = {
  tabs: [managerTab, secondManagerTab],
  activeTab: 'catalog',
  defaultActiveTab: 'updates',
  expandedSections: managerExpandedSections,
  defaultExpanded: false,
  columns: 3,
  title: 'Extensions',
  showHeader: true,
  showCloseButton: true,
  emptyText: 'No enabled tabs',
}

const managerTabChangeEvent: ExtensionManagerTabChangeEvent = {
  tabId: managerTab.id,
}
const managerSectionToggleEvent: ExtensionManagerSectionToggleEvent = {
  tabId: managerTab.id,
  sectionKey: managerSection.key,
  expanded: true,
}
const managerActionEvent: ExtensionManagerActionEvent = {
  tabId: managerTab.id,
  sectionKey: managerSection.key,
  itemId: managerItem.id,
  action: event,
}
const managerNameClickEvent: ExtensionManagerNameClickEvent = {
  tabId: managerTab.id,
  sectionKey: managerSection.key,
  itemId: managerItem.id,
  event: {} as MouseEvent,
}
const managerSectionKey: ExtensionManagerSectionKey = 'available'

const managerSlots: ExtensionManagerSlots = {
  'header-actions': () => [],
  tab: ({ tab, active, select }) => {
    const tabId: string = tab.id
    const isActive: boolean = active
    select()

    void tabId
    void isActive
    return []
  },
  'section-header': ({ tab, section, expanded, toggle }) => {
    const tabId: string = tab.id
    const sectionKey: ExtensionManagerSectionKey = section.key
    const isExpanded: boolean = expanded
    const count: number = section.items.length
    toggle()

    void tabId
    void sectionKey
    void isExpanded
    void count
    return []
  },
  item: ({ tab, section, item, index }) => {
    const tabId: string = tab.id
    const sectionKey: ExtensionManagerSectionKey = section.key
    const itemId: string = item.id
    const itemIndex: number = index

    void tabId
    void sectionKey
    void itemId
    void itemIndex
    return []
  },
  empty: ({ tab, section }) => {
    const tabId: string = tab.id
    const sectionKey: ExtensionManagerSectionKey = section.key

    void tabId
    void sectionKey
    return []
  },
}

declare const managerEmit: ExtensionManagerEmits
managerEmit('update:active-tab', managerTab.id)
managerEmit('update:active-tab', undefined)
managerEmit('tab-change', managerTabChangeEvent)
managerEmit('update:expanded-sections', { catalog: { installed: true, available: false } })
managerEmit('section-toggle', managerSectionToggleEvent)
managerEmit('action', managerActionEvent)
managerEmit('name-click', managerNameClickEvent)
managerEmit('close')
// @ts-expect-error Close does not accept a payload.
managerEmit('close', managerTab.id)

// @ts-expect-error Manager items retain Grid-owned identity.
const managerItemWithoutId: ExtensionManagerItem = { name: 'Missing Manager identity' }
const oldManagerFacadeProps = {
  extensions: [input],
  operationStates: {},
}
// @ts-expect-error The old extensions/operationStates facade is not the Manager contract.
const oldManagerProps: ExtensionManagerProps = oldManagerFacadeProps

// @ts-expect-error Manager tabs own flat items; explicit sections are no longer the Manager input model.
const oldTreeManagerTab: ExtensionManagerTab = { id: 'old', label: 'Old', sections: [] }

// @ts-expect-error Card no longer accepts an Extension item.
const oldCardProps: ExtensionCardProps = { item: extension }
// @ts-expect-error Grid identity is not a Card prop.
const cardPropsWithGridId: ExtensionCardProps = { name: 'Card without Grid identity', id: 'grid-only' }
// @ts-expect-error ExtensionCardGridItem requires the Grid-owned id.
const cardGridItemWithoutId: ExtensionCardGridItem = { name: 'Missing Grid identity' }
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
void search
void intent
void availableItems
void cardProps
void switchAction
void buttonAction
void customAction
void event
void cardGridItem
void cardGridProps
void cardGridDefaultProps
void cardGridSlots
void cardGridActionEvent
void cardGridNameClickEvent
void managerItem
void managerSection
void managerEmptySection
void managerTab
void secondManagerTab
void managerExpandedSections
void managerProps
void managerTabChangeEvent
void managerSectionToggleEvent
void managerActionEvent
void managerNameClickEvent
void managerSectionKey
void oldTreeManagerTab
void managerSlots
void managerItemWithoutId
void oldManagerFacadeProps
void oldManagerProps
void oldCardProps
void cardPropsWithGridId
void cardGridItemWithoutId
void unlabeledAction
void installAction
