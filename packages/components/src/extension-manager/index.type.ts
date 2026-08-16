import type { Component, ComputedRef, VNode } from 'vue'

export type ExtensionKind = string & {}
export type ExtensionScope = 'installed' | 'available'

export interface ExtensionInput<TConfig = unknown, TMetadata = unknown> {
  id: string
  kind: ExtensionKind
  name: string
  version?: string
  icon?: string
  description?: string
  tags?: string[]
  installed?: boolean
  config?: TConfig
  metadata?: TMetadata
}

export interface Extension<TConfig = unknown, TMetadata = unknown> extends Omit<
  ExtensionInput<TConfig, TMetadata>,
  'installed' | 'config'
> {
  installed: boolean
  config?: TConfig
}

export interface ExtensionDisplay {
  installed: Extension[]
  available: Extension[]
}

export interface McpTool {
  id: string
  name: string
  description?: string
}

export interface McpMetadata {
  tools?: McpTool[]
}

export interface McpConfig {
  enabled?: boolean
  tools?: Record<string, { enabled: boolean }>
}

export interface McpDetailProps {
  item: Extension<McpConfig, McpMetadata>
}

export interface McpDetailEmits {
  (e: 'tool-toggle', intent: ExtensionToolToggleIntent): void
}

export interface McpDefinition {
  name: string
  description: string
  transport: 'sse' | 'streamableHttp'
  url: string
  headers: Record<string, string>
}

export type McpFormMode = 'form' | 'code'

export type McpFormPayload = { mode: 'form'; data: McpDefinition } | { mode: 'code'; data: string }

export interface McpFormProps {
  mode?: McpFormMode
  definition?: McpDefinition
  code?: string
}

export interface McpFormEmits {
  (e: 'update:mode', mode: McpFormMode): void
  (e: 'submit', payload: McpFormPayload): void
  (e: 'cancel'): void
}

export type ExtensionSearchFn = (query: string, item: Extension, scope: ExtensionScope) => boolean

export type ExtensionOperation = 'install' | 'create' | 'toggle' | 'edit' | 'delete' | 'refresh' | 'tool-toggle'

export interface ExtensionOperationStatus {
  status: 'pending' | 'success' | 'error'
  progress?: number
  error?: unknown
  retryable?: boolean
}

export type ExtensionOperationStatusMap = Record<string, Partial<Record<ExtensionOperation, ExtensionOperationStatus>>>

export type ExtensionCardOverflowMenuPlacement = 'bottom-end' | 'top-end'

export interface ExtensionCardActionBase {
  id: string
  label: string
  icon?: Component
  hidden?: boolean
  disabled?: boolean
  danger?: boolean
}

export interface ExtensionCardSwitchAction extends ExtensionCardActionBase {
  type: 'switch'
  checked: boolean
}

export interface ExtensionCardButtonAction extends ExtensionCardActionBase {
  type: 'button'
}

export interface ExtensionCardCustomAction extends ExtensionCardActionBase {
  type: 'custom'
  data?: unknown
}

export type ExtensionCardAction = ExtensionCardSwitchAction | ExtensionCardButtonAction | ExtensionCardCustomAction

/** Actions passed from Card to its internal renderers after visibility is resolved. */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never
export type ExtensionCardRenderableAction = DistributiveOmit<ExtensionCardAction, 'hidden'>

export interface ExtensionCardActionEvent {
  id: string
  type: ExtensionCardAction['type']
  checked?: boolean
  payload?: unknown
}

export interface ExtensionCardProps {
  name: string
  description?: string
  icon?: string | Component
  actions?: ExtensionCardAction[]
  primaryActionsLimit?: number
  progress?: number | 'indeterminate'
  nameClickable?: boolean
  overflowMenuLabel?: string
  overflowMenuPlacement?: ExtensionCardOverflowMenuPlacement
  overflowMenuShowIcons?: boolean
}

export interface ExtensionCardSlots {
  'primary-action'?: (props: {
    action: Extract<ExtensionCardRenderableAction, { type: 'custom' }>
    trigger: (payload?: unknown) => void
  }) => VNode[]
}

export interface ExtensionCardEmits {
  (e: 'name-click', event: MouseEvent | KeyboardEvent): void
  (e: 'action', payload: ExtensionCardActionEvent): void
}

export type ExtensionCardGridItem = ExtensionCardProps & {
  id: string
}

export interface ExtensionCardGridProps {
  items: ExtensionCardGridItem[]
  columns?: number
  emptyText?: string
}

export interface ExtensionCardGridSlots {
  item?: (props: { item: ExtensionCardGridItem; index: number }) => VNode[]
  empty?: () => VNode[]
}

export interface ExtensionCardGridActionEvent {
  itemId: string
  action: ExtensionCardActionEvent
}

export interface ExtensionCardGridNameClickEvent {
  itemId: string
  event: MouseEvent | KeyboardEvent
}

export interface ExtensionCardGridEmits {
  (e: 'action', payload: ExtensionCardGridActionEvent): void
  (e: 'name-click', payload: ExtensionCardGridNameClickEvent): void
}

export type ExtensionManagerSectionKey = 'installed' | 'available'

export type ExtensionManagerItem = ExtensionCardGridItem & {
  installed?: boolean
}

export interface ExtensionManagerTab {
  id: string
  label: string
  disabled?: boolean
  badge?: string | number
  items: ExtensionManagerItem[]
}

export interface ExtensionManagerProps {
  tabs: ExtensionManagerTab[]
  activeTab?: string
  defaultActiveTab?: string
  defaultExpanded?: boolean
  columns?: number
  title?: string
  showHeader?: boolean
  showCloseButton?: boolean
  emptyText?: string
}

export interface ExtensionManagerSlots {
  'header-actions'?: () => VNode[]
  tab?: (props: { tab: ExtensionManagerTab; active: boolean; select: () => void }) => VNode[]
  'section-header'?: (props: {
    tab: ExtensionManagerTab
    sectionKey: ExtensionManagerSectionKey
    title: string
    expanded: boolean
    toggle: () => void
    count: number
  }) => VNode[]
  item?: (props: {
    tab: ExtensionManagerTab
    sectionKey: ExtensionManagerSectionKey
    item: ExtensionCardGridItem
    index: number
  }) => VNode[]
  empty?: (props: { tab: ExtensionManagerTab; sectionKey: ExtensionManagerSectionKey; title: string }) => VNode[]
}

export interface ExtensionManagerTabChangeEvent {
  tabId: string
}

export interface ExtensionManagerSectionToggleEvent {
  tabId: string
  sectionKey: ExtensionManagerSectionKey
  expanded: boolean
}

export interface ExtensionManagerActionEvent {
  tabId: string
  sectionKey: ExtensionManagerSectionKey
  itemId: string
  action: ExtensionCardActionEvent
}

export interface ExtensionManagerNameClickEvent {
  tabId: string
  sectionKey: ExtensionManagerSectionKey
  itemId: string
  event: MouseEvent | KeyboardEvent
}

export interface ExtensionManagerEmits {
  (e: 'update:active-tab', tabId: string | undefined): void
  (e: 'tab-change', event: ExtensionManagerTabChangeEvent): void
  (e: 'section-toggle', event: ExtensionManagerSectionToggleEvent): void
  (e: 'action', event: ExtensionManagerActionEvent): void
  (e: 'name-click', event: ExtensionManagerNameClickEvent): void
  (e: 'close'): void
}

export interface ExtensionKindOption {
  value: ExtensionKind
  label: string
}

export interface ExtensionTagOption {
  value: string
  label: string
}

export interface ExtensionFilterProps {
  activeKind?: ExtensionKind
  defaultActiveKind?: ExtensionKind
  query?: string
  tag?: string
  kindLabels?: Record<string, string>
  searchPlaceholder?: string
  tagPlaceholder?: string
  showSearch?: boolean
  showTagFilter?: boolean
  searchFn?: ExtensionSearchFn
}

export interface ExtensionFilterEmits {
  (e: 'update:active-kind', kind: ExtensionKind): void
  (e: 'update:query', query: string): void
  (e: 'update:tag', tag: string): void
  (e: 'query-change', query: string): void
  (e: 'tag-change', tag: string): void
}

export interface ExtensionRootProps {
  extensions?: ExtensionInput[]
  operationStates?: ExtensionOperationStatusMap
  expandedSections?: Record<ExtensionScope, boolean>
}

export interface ExtensionRootEmits {
  (e: 'update:expanded-sections', expandedSections: Record<ExtensionScope, boolean>): void
  (e: 'install', intent: ExtensionIntent): void
  (e: 'create', kind: ExtensionKind): void
  (e: 'detail', intent: ExtensionIntent): void
  (e: 'toggle', intent: ExtensionToggleIntent): void
  (e: 'edit', intent: ExtensionIntent): void
  (e: 'delete', intent: ExtensionIntent): void
  (e: 'tool-toggle', intent: ExtensionToolToggleIntent): void
  (e: 'refresh', scope: ExtensionScope): void
}

export interface ExtensionIntent {
  id: string
  kind: ExtensionKind
}

export interface ExtensionToggleIntent extends ExtensionIntent {
  enabled: boolean
}

export interface ExtensionToolToggleIntent extends ExtensionIntent {
  toolId: string
  enabled: boolean
}

export interface ExtensionContext {
  allExtensions: ComputedRef<Extension[]>
  displayItems: ComputedRef<ExtensionDisplay>
  operationStates: ComputedRef<ExtensionOperationStatusMap>
  installedItems: ComputedRef<Extension[]>
  availableItems: ComputedRef<Extension[]>
  isSectionExpanded: (scope: ExtensionScope) => boolean
  toggleSection: (scope: ExtensionScope) => void
  requestInstall: (item: Extension) => void
  requestCreate: (kind: ExtensionKind) => void
  requestToggle: (item: Extension, enabled: boolean) => void
  requestDetail: (item: Extension) => void
  requestEdit: (item: Extension) => void
  requestDelete: (item: Extension) => void
  requestToolToggle: (item: Extension, toolId: string, enabled: boolean) => void
  requestRefresh: (scope: ExtensionScope) => void
}
