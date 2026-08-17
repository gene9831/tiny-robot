import type { Component } from 'vue'
import type {
  ExtensionCardGridActionEvent,
  ExtensionCardGridEmits,
  ExtensionCardGridItem,
  ExtensionCardGridNameClickEvent,
  ExtensionCardGridProps,
  ExtensionCardGridSlots,
  ExtensionCardAction,
  ExtensionCardActionEvent,
  ExtensionCardProps,
  ExtensionManagerActionEvent,
  ExtensionManagerEmits,
  ExtensionManagerItem,
  ExtensionManagerNameClickEvent,
  ExtensionManagerProps,
  ExtensionManagerSectionKey,
  ExtensionManagerSectionToggleEvent,
  ExtensionManagerSlots,
  ExtensionManagerTab,
  ExtensionManagerTabChangeEvent,
} from './index.type'

const legacyItem = { id: 'legacy', kind: 'skill', name: 'Legacy extension' }

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

const managerTab: ExtensionManagerTab = {
  id: 'catalog',
  label: 'Catalog',
  items: [managerItem],
}
const secondManagerTab: ExtensionManagerTab = {
  id: 'updates',
  label: 'Updates',
  items: [],
}

const managerProps: ExtensionManagerProps = {
  tabs: [managerTab, secondManagerTab],
  activeTab: 'catalog',
  defaultActiveTab: 'updates',
  columns: 3,
  title: 'Extensions',
  showCloseButton: true,
  emptyText: 'No enabled tabs',
}

const managerTabChangeEvent: ExtensionManagerTabChangeEvent = {
  tabId: managerTab.id,
}
const managerSectionKey: ExtensionManagerSectionKey = 'installed'
const managerSectionToggleEvent: ExtensionManagerSectionToggleEvent = {
  tabId: managerTab.id,
  sectionKey: managerSectionKey,
  expanded: true,
}
const managerActionEvent: ExtensionManagerActionEvent = {
  tabId: managerTab.id,
  sectionKey: managerSectionKey,
  itemId: managerItem.id,
  action: event,
}
const managerNameClickEvent: ExtensionManagerNameClickEvent = {
  tabId: managerTab.id,
  sectionKey: managerSectionKey,
  itemId: managerItem.id,
  event: {} as MouseEvent,
}

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
  item: ({ tab, sectionKey, item, index }) => {
    const tabId: string = tab.id
    const itemId: string = item.id
    const itemIndex: number = index

    void tabId
    void sectionKey
    void itemId
    void itemIndex
    return []
  },
  empty: ({ tab, sectionKey, title }) => {
    const tabId: string = tab.id
    const sectionTitle: string = title

    void tabId
    void sectionKey
    void sectionTitle
    return []
  },
}

declare const managerEmit: ExtensionManagerEmits
managerEmit('update:active-tab', managerTab.id)
managerEmit('update:active-tab', undefined)
managerEmit('tab-change', managerTabChangeEvent)
managerEmit('section-toggle', managerSectionToggleEvent)
managerEmit('action', managerActionEvent)
managerEmit('name-click', managerNameClickEvent)
managerEmit('close')
// @ts-expect-error Close does not accept a payload.
managerEmit('close', managerTab.id)

// @ts-expect-error Manager items retain Grid-owned identity.
const managerItemWithoutId: ExtensionManagerItem = { name: 'Missing Manager identity' }
const oldManagerFacadeProps = {
  extensions: [legacyItem],
  operationStates: {},
}
// @ts-expect-error The old extensions/operationStates facade is not the Manager contract.
const oldManagerProps: ExtensionManagerProps = oldManagerFacadeProps

const oldControlledManagerProps: ExtensionManagerProps = {
  tabs: [managerTab],
  // @ts-expect-error Section expansion is internal state, not a public Manager prop.
  expandedSections: { catalog: { installed: true, available: false } },
}

const oldDefaultExpandedProps: ExtensionManagerProps = {
  tabs: [managerTab],
  // @ts-expect-error Section expansion is always initialized and managed internally.
  defaultExpanded: false,
}

const oldShowHeaderProps: ExtensionManagerProps = {
  tabs: [managerTab],
  // @ts-expect-error Header visibility is derived from its content.
  showHeader: false,
}

// @ts-expect-error Manager tabs own flat items; explicit sections are no longer the Manager input model.
const oldTreeManagerTab: ExtensionManagerTab = { id: 'old', label: 'Old', sections: [] }

const oldTabWithTags: ExtensionManagerTab = {
  id: 'old-fields',
  label: 'Old fields',
  items: [],
  // @ts-expect-error Tab filter options are derived from item tags.
  tags: [],
}
const oldTabWithBadge: ExtensionManagerTab = {
  id: 'old-badge',
  label: 'Old badge',
  items: [],
  // @ts-expect-error Tab badges are not part of the lean tab model.
  badge: 'new',
}
const oldDisabledTab: ExtensionManagerTab = {
  id: 'old-disabled',
  label: 'Old disabled',
  items: [],
  // @ts-expect-error Tabs are always selectable in the lean tab model.
  disabled: true,
}

// @ts-expect-error Card no longer accepts an Extension item.
const oldCardProps: ExtensionCardProps = { item: legacyItem }
// @ts-expect-error Grid identity is not a Card prop.
const cardPropsWithGridId: ExtensionCardProps = { name: 'Card without Grid identity', id: 'grid-only' }
// @ts-expect-error ExtensionCardGridItem requires the Grid-owned id.
const cardGridItemWithoutId: ExtensionCardGridItem = { name: 'Missing Grid identity' }
// @ts-expect-error Every action requires a label.
const unlabeledAction: ExtensionCardAction = { id: 'install', type: 'button' }
// @ts-expect-error Domain-specific install action is not a Card action type.
const installAction: ExtensionCardAction = { id: 'install', type: 'install', label: '安装' }

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
void managerTab
void secondManagerTab
void managerProps
void managerTabChangeEvent
void managerSectionToggleEvent
void managerActionEvent
void managerNameClickEvent
void managerSectionKey
void oldTreeManagerTab
void oldTabWithTags
void oldTabWithBadge
void oldDisabledTab
void managerSlots
void managerItemWithoutId
void oldManagerFacadeProps
void oldManagerProps
void oldControlledManagerProps
void oldDefaultExpandedProps
void oldShowHeaderProps
void oldCardProps
void cardPropsWithGridId
void cardGridItemWithoutId
void unlabeledAction
void installAction
