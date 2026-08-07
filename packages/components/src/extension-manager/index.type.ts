import type { Component, ComputedRef, Ref, VNode } from 'vue'
import type { ExtensionCardPopoverPlacement } from './internal.type'

export type ExtensionType = 'mcp' | 'skill' | (string & {})

export type ExtensionSource = 'installed' | 'market'

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

export type ExtensionOperationKind = 'install' | 'create' | 'toggle' | 'edit' | 'delete' | 'refresh' | 'tool-toggle'

export interface ExtensionOperationState {
  phase: 'idle' | 'pending' | 'success' | 'error'
  progress?: number
  error?: unknown
  retryable?: boolean
}

/** @deprecated Use ExtensionOperationState['phase'] instead. */
export type ExtensionAddState = ExtensionOperationState['phase']

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
  state?: ExtensionOperationState['phase']
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
  items?: ExtensionRecord[]
  source?: ExtensionSource
  operationStates?: ExtensionOperationStateMap
  loading?: boolean
  error?: unknown
  emptyText?: string
  errorText?: string
}

export interface ExtensionListSlots {
  default?: () => VNode[]
  error?: (props: { error: unknown; retry: () => void }) => VNode[]
}

export interface ExtensionListEmits {
  (e: 'retry'): void
}

export interface ExtensionDisplay {
  installed: ExtensionRecord[]
  market: ExtensionRecord[]
}

export interface ExtensionFilterProps {
  query?: string
  tag?: string
  searchPlaceholder?: string
  tagPlaceholder?: string
  showSearch?: boolean
  showTagFilter?: boolean
  searchFn?: ExtensionSearchFn
}

export interface ExtensionFilterEmits {
  (e: 'update:query', query: string): void
  (e: 'update:tag', tag: string): void
  (e: 'query-change', query: string): void
  (e: 'tag-change', tag: string): void
}

export interface ExtensionManagerRootProps {
  extensions?: ExtensionRecord[]
  operationStates?: ExtensionOperationStateMap
  activeType?: ExtensionType
  defaultActiveType?: ExtensionType
  expandedSections?: Record<ExtensionSource, boolean>
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
  /** Loading state for the installed section in the prebuilt facade. */
  loading?: boolean
  /** Loading state for the market section in the prebuilt facade. */
  marketLoading?: boolean
  /** Load failure for the installed section in the prebuilt facade. */
  error?: unknown
  /** Load failure for the market section in the prebuilt facade. */
  marketError?: unknown
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
  (e: 'update:active-type', type: ExtensionType): void
  (e: 'update:expanded-sections', expandedSections: Record<ExtensionSource, boolean>): void
  (e: 'type-change', type: ExtensionType): void
  (e: 'search-change', query: string, type: ExtensionType): void
  (e: 'tag-change', tag: string, type: ExtensionType): void
  (e: 'extension-add', intent: ExtensionIntent): void
  (e: 'extension-create', type: ExtensionType): void
  (e: 'extension-detail-open', intent: ExtensionIntent): void
  (e: 'extension-toggle', intent: ExtensionToggleIntent): void
  (e: 'extension-edit', intent: ExtensionIntent): void
  (e: 'extension-delete', intent: ExtensionIntent): void
  (e: 'tool-toggle', intent: ExtensionToolToggleIntent): void
  (e: 'refresh', type: ExtensionType, source: ExtensionSource): void
}

export interface ExtensionIntent {
  id: string
  type: ExtensionType
  source?: ExtensionSource
  item?: ExtensionRecord
}

export interface ExtensionToggleIntent extends ExtensionIntent {
  enabled: boolean
}

export interface ExtensionToolToggleIntent extends ExtensionIntent {
  toolId: string
  enabled: boolean
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
  requestAdd: (item: ExtensionRecord, source?: ExtensionSource) => void
  requestCreate: () => void
  requestToggle: (item: ExtensionRecord, enabled: boolean, source?: ExtensionSource) => void
  requestDetailOpen: (item: ExtensionRecord, source?: ExtensionSource) => void
  requestEdit: (item: ExtensionRecord, source?: ExtensionSource) => void
  requestDelete: (item: ExtensionRecord, source?: ExtensionSource) => void
  requestToolToggle: (item: ExtensionRecord, toolId: string, enabled: boolean, source?: ExtensionSource) => void
  requestRefresh: (source: ExtensionSource) => void
}

export type ExtensionFilterLease = (() => void) & {
  readonly active: boolean
}

export interface ExtensionManagerFilterContext {
  activeType: Ref<ExtensionType>
  catalog: ComputedRef<ExtensionRecord[]>
  installationDisplayItems: ComputedRef<ExtensionDisplay>
  setDisplayItems: (displayItems?: ExtensionDisplay) => void
  claimFilter: () => ExtensionFilterLease
}
