import type { Component, ComputedRef, Ref, VNode } from 'vue'
import type { ExtensionCardPopoverPlacement } from './internal.type'

export type ExtensionType = 'mcp' | 'skill' | (string & {})

export type ExtensionSource = 'installed' | 'market'

export type ExtensionAddState = 'idle' | 'loading' | 'added' | 'failed'

export interface ExtensionInstallation {
  enabled: boolean
}

export interface ExtensionRecord<TMetadata = unknown> {
  id: string
  type: ExtensionType
  name: string
  version?: string
  icon?: string
  description?: string
  tags?: string[]
  metadata?: TMetadata
  installation?: ExtensionInstallation
}

/** @deprecated Use ExtensionRecord instead. */
export type ExtensionItem<TMetadata = unknown> = ExtensionRecord<TMetadata>

export type ExtensionSearchFn = (query: string, item: ExtensionItem, source: ExtensionSource) => boolean

export type ExtensionOperationKind =
  | 'install'
  | 'create'
  | 'toggle'
  | 'edit'
  | 'delete'
  | 'refresh'
  | 'tool-toggle'

export interface ExtensionOperationState {
  phase: 'idle' | 'pending' | 'success' | 'error'
  progress?: number
  error?: unknown
  retryable?: boolean
}

export type ExtensionOperationStateMap = Record<
  string,
  Partial<Record<ExtensionOperationKind, ExtensionOperationState>>
>

export interface ExtensionCardActionBase {
  id: string
  hidden?: boolean
  disabled?: boolean
  ariaLabel?: string
}

export interface ExtensionCardToggleAction extends ExtensionCardActionBase {
  type: 'toggle'
  checked?: boolean
}

export interface ExtensionCardAddAction extends ExtensionCardActionBase {
  type: 'add'
  state?: ExtensionAddState
  progress?: number
  label?: string
}

export interface ExtensionCardButtonAction extends ExtensionCardActionBase {
  type: 'button'
  label: string
  icon?: Component
}

export interface ExtensionCardCustomAction extends ExtensionCardActionBase {
  type: 'custom'
  data?: unknown
}

export type ExtensionCardPrimaryAction =
  ExtensionCardToggleAction | ExtensionCardAddAction | ExtensionCardButtonAction | ExtensionCardCustomAction

export interface ExtensionCardMoreMenuAction {
  id: string
  label: string
  icon?: Component
  disabled?: boolean
  danger?: boolean
}

export type ExtensionCardMoreMenuPlacement = ExtensionCardPopoverPlacement

export interface ExtensionCardActionEvent {
  id: string
  checked?: boolean
  payload?: unknown
}

export interface ExtensionCardItem {
  id?: string
  name: string
  description?: string
  icon?: string
  iconAlt?: string
}

export type ExtensionCardProps = Partial<ExtensionCardItem> & {
  item?: ExtensionCardItem
  nameClickable?: boolean
  primaryActions?: ExtensionCardPrimaryAction[]
  moreMenuActions?: ExtensionCardMoreMenuAction[]
  moreMenuTriggerAriaLabel?: string
  moreMenuPlacement?: ExtensionCardMoreMenuPlacement
}

export interface ExtensionCardSlots {
  icon?: () => VNode[]
  'custom-action'?: (props: { action: ExtensionCardCustomAction; trigger: (payload?: unknown) => void }) => VNode[]
}

export interface ExtensionCardEmits {
  (e: 'name-click', event: MouseEvent | KeyboardEvent): void
  (e: 'action', payload: ExtensionCardActionEvent): void
}

export interface ExtensionTypeOption {
  value: ExtensionType
  label: string
}

export interface ExtensionTagOption {
  value: string
  label: string
}

export interface ExtensionListProps {
  items?: ExtensionItem[]
  source?: ExtensionSource
  loading?: boolean
  emptyText?: string
}

export interface ExtensionListSlots {
  default?: () => VNode[]
}

export interface ExtensionDisplay {
  installed: ExtensionRecord[]
  market: ExtensionRecord[]
}

export interface ExtensionFilterProps {
  searchPlaceholder?: string
  tagPlaceholder?: string
  showSearch?: boolean
  showTagFilter?: boolean
  searchFn?: ExtensionSearchFn
}

export interface ExtensionManagerRootProps {
  extensions?: ExtensionRecord[]
  operationStates?: ExtensionOperationStateMap
  defaultActiveType?: ExtensionType
}

export interface ExtensionManagerProps extends ExtensionManagerRootProps {
  title?: string
  searchPlaceholder?: string
  tagPlaceholder?: string
  installedTitle?: string
  marketTitle?: string
  showHeader?: boolean
  showCloseButton?: boolean
  showCustomAddButton?: boolean
  customAddButtonText?: string
  enableSearch?: boolean
  enableTagFilter?: boolean
  searchFn?: ExtensionSearchFn
  visible?: boolean
}

export interface ExtensionManagerPermissions {
  allowExtensionAdd: boolean
  allowExtensionCreate: boolean
  allowExtensionEdit: boolean
  allowExtensionDelete: boolean
  allowExtensionDetail: boolean
  allowExtensionToggle: boolean
  allowToolToggle: boolean
}

export interface ExtensionManagerEmits {
  (e: 'update:visible', visible: boolean): void
  (e: 'type-change', type: ExtensionType): void
  (e: 'search-change', query: string, type: ExtensionType): void
  (e: 'tag-change', tag: string, type: ExtensionType): void
  (e: 'extension-add', item: ExtensionItem): void
  (e: 'extension-create', type: ExtensionType): void
  (e: 'extension-detail-open', item: ExtensionItem): void
  (e: 'extension-toggle', item: ExtensionItem, enabled: boolean): void
  (e: 'extension-edit', item: ExtensionItem): void
  (e: 'extension-delete', item: ExtensionItem): void
  (e: 'tool-toggle', item: ExtensionItem, toolId: string, enabled: boolean): void
  (e: 'refresh', type: ExtensionType, source: ExtensionSource): void
}

export interface ExtensionManagerContext {
  activeType: Ref<ExtensionType>
  catalog: ComputedRef<ExtensionRecord[]>
  displayItems: ComputedRef<ExtensionDisplay>
  operationStates: ComputedRef<ExtensionOperationStateMap>
  typeOptions: ComputedRef<ExtensionTypeOption[]>
  installedItems: ComputedRef<ExtensionRecord[]>
  marketItems: ComputedRef<ExtensionRecord[]>
  setActiveType: (type: ExtensionType) => void
  isSectionExpanded: (source: ExtensionSource) => boolean
  toggleSection: (source: ExtensionSource) => void
}
