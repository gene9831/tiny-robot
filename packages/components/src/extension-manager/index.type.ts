import type { Component, ComputedRef, VNode } from 'vue'
import type { McpAddFormData, McpAddFormProps } from '../mcp-add-form/index.type'
import type { ExtensionCardPopoverPlacement } from './internal.type'

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

export interface McpExtensionTool {
  id: string
  name: string
  description?: string
  enabled: boolean
}

export interface McpExtensionMetadata {
  tools?: McpExtensionTool[]
}

export interface McpExtensionDetailProps {
  item: Extension<unknown, McpExtensionMetadata>
}

export interface McpExtensionDetailEmits {
  (e: 'tool-toggle', toolId: string, enabled: boolean): void
}

export type McpExtensionCreatePayload = { mode: 'form'; data: McpAddFormData } | { mode: 'code'; data: string }

export type McpExtensionFormProps = McpAddFormProps

export interface McpExtensionFormEmits {
  (e: 'submit', payload: McpExtensionCreatePayload): void
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
  state?: ExtensionOperationStatus['status']
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
  value: ExtensionKind
  label: string
}

export interface ExtensionTagOption {
  value: string
  label: string
}

export interface ExtensionListProps {
  items?: Extension[]
  scope?: ExtensionScope
  operationStates?: ExtensionOperationStatusMap
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

export interface ExtensionRootProps {
  extensions?: ExtensionInput[]
  operationStates?: ExtensionOperationStatusMap
  activeKind?: ExtensionKind
  defaultActiveKind?: ExtensionKind
  expandedSections?: Record<ExtensionScope, boolean>
}

export interface ExtensionRootEmits {
  (e: 'update:active-kind', kind: ExtensionKind): void
  (e: 'update:expanded-sections', expandedSections: Record<ExtensionScope, boolean>): void
  (e: 'kind-change', kind: ExtensionKind): void
  (e: 'install', intent: ExtensionIntent): void
  (e: 'create', kind: ExtensionKind): void
  (e: 'detail', intent: ExtensionIntent): void
  (e: 'toggle', intent: ExtensionToggleIntent): void
  (e: 'edit', intent: ExtensionIntent): void
  (e: 'delete', intent: ExtensionIntent): void
  (e: 'tool-toggle', intent: ExtensionToolToggleIntent): void
  (e: 'refresh', scope: ExtensionScope): void
}

export interface ExtensionManagerProps extends ExtensionRootProps {
  title?: string
  searchPlaceholder?: string
  tagPlaceholder?: string
  installedTitle?: string
  availableTitle?: string
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
  /** Loading state for the available section in the prebuilt facade. */
  availableLoading?: boolean
  /** Load failure for the installed section in the prebuilt facade. */
  error?: unknown
  /** Load failure for the available section in the prebuilt facade. */
  availableError?: unknown
}

export interface ExtensionManagerEmits extends ExtensionRootEmits {
  (e: 'update:visible', visible: boolean): void
  (e: 'search-change', query: string, kind: ExtensionKind): void
  (e: 'tag-change', tag: string, kind: ExtensionKind): void
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
  activeKind: ComputedRef<ExtensionKind>
  allExtensions: ComputedRef<Extension[]>
  displayItems: ComputedRef<ExtensionDisplay>
  operationStates: ComputedRef<ExtensionOperationStatusMap>
  typeOptions: ComputedRef<ExtensionTypeOption[]>
  installedItems: ComputedRef<Extension[]>
  availableItems: ComputedRef<Extension[]>
  setActiveKind: (kind: ExtensionKind) => void
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
