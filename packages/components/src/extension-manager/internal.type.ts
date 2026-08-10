export type ExtensionCardPopoverPlacement = 'bottom-end' | 'top-end'

import type { ComputedRef, Ref } from 'vue'
import type { ExtensionKind, ExtensionOperationStateMap, ExtensionTypeOption } from './index.type'

export interface LegacyExtensionRuntimeRecord<TMetadata = unknown> {
  id: string
  type: ExtensionKind
  name: string
  version?: string
  icon?: string
  description?: string
  tags?: string[]
  metadata?: TMetadata
  installation?: { enabled: boolean }
}

export type LegacyExtensionRuntimeScope = 'installed' | 'market'

export interface LegacyExtensionRuntimeDisplay {
  installed: LegacyExtensionRuntimeRecord[]
  market: LegacyExtensionRuntimeRecord[]
}

export interface LegacyExtensionManagerRootProps {
  extensions?: LegacyExtensionRuntimeRecord[]
  operationStates?: ExtensionOperationStateMap
  activeType?: ExtensionKind
  defaultActiveType?: ExtensionKind
  expandedSections?: Record<LegacyExtensionRuntimeScope, boolean>
}

export type LegacyExtensionSearchFn = (
  query: string,
  item: LegacyExtensionRuntimeRecord,
  scope: LegacyExtensionRuntimeScope,
) => boolean

export interface LegacyExtensionListProps {
  items?: LegacyExtensionRuntimeRecord[]
  source?: LegacyExtensionRuntimeScope
  operationStates?: ExtensionOperationStateMap
  loading?: boolean
  error?: unknown
  emptyText?: string
  errorText?: string
}

export interface LegacyExtensionListEmits {
  (e: 'retry'): void
}

export interface LegacyExtensionFilterProps {
  query?: string
  tag?: string
  searchPlaceholder?: string
  tagPlaceholder?: string
  showSearch?: boolean
  showTagFilter?: boolean
  searchFn?: LegacyExtensionSearchFn
}

export interface LegacyExtensionFilterEmits {
  (e: 'update:query', query: string): void
  (e: 'update:tag', tag: string): void
  (e: 'query-change', query: string): void
  (e: 'tag-change', tag: string): void
}

export interface LegacyExtensionManagerProps extends LegacyExtensionManagerRootProps {
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
  searchFn?: LegacyExtensionSearchFn
  visible?: boolean
  loading?: boolean
  marketLoading?: boolean
  error?: unknown
  marketError?: unknown
}

export interface LegacyExtensionIntent {
  id: string
  type: ExtensionKind
  source?: LegacyExtensionRuntimeScope
}

export interface LegacyExtensionToggleIntent extends LegacyExtensionIntent {
  enabled: boolean
}

export interface LegacyExtensionToolToggleIntent extends LegacyExtensionIntent {
  toolId: string
  enabled: boolean
}

export interface LegacyExtensionManagerEmits {
  (e: 'update:visible', visible: boolean): void
  (e: 'update:active-type', type: ExtensionKind): void
  (e: 'update:expanded-sections', expandedSections: Record<LegacyExtensionRuntimeScope, boolean>): void
  (e: 'type-change', type: ExtensionKind): void
  (e: 'search-change', query: string, type: ExtensionKind): void
  (e: 'tag-change', tag: string, type: ExtensionKind): void
  (e: 'extension-add', intent: LegacyExtensionIntent): void
  (e: 'extension-create', type: ExtensionKind): void
  (e: 'extension-detail-open', intent: LegacyExtensionIntent): void
  (e: 'extension-toggle', intent: LegacyExtensionToggleIntent): void
  (e: 'extension-edit', intent: LegacyExtensionIntent): void
  (e: 'extension-delete', intent: LegacyExtensionIntent): void
  (e: 'tool-toggle', intent: LegacyExtensionToolToggleIntent): void
  (e: 'refresh', type: ExtensionKind, source: LegacyExtensionRuntimeScope): void
}

export interface LegacyExtensionManagerContext {
  activeType: Ref<ExtensionKind>
  catalog: ComputedRef<LegacyExtensionRuntimeRecord[]>
  displayItems: ComputedRef<LegacyExtensionRuntimeDisplay>
  operationStates: ComputedRef<ExtensionOperationStateMap>
  typeOptions: ComputedRef<ExtensionTypeOption[]>
  installedItems: ComputedRef<LegacyExtensionRuntimeRecord[]>
  marketItems: ComputedRef<LegacyExtensionRuntimeRecord[]>
  setActiveType: (type: ExtensionKind) => void
  isSectionExpanded: (source: LegacyExtensionRuntimeScope) => boolean
  toggleSection: (source: LegacyExtensionRuntimeScope) => void
  requestAdd: (item: LegacyExtensionRuntimeRecord, source?: LegacyExtensionRuntimeScope) => void
  requestCreate: () => void
  requestToggle: (item: LegacyExtensionRuntimeRecord, enabled: boolean, source?: LegacyExtensionRuntimeScope) => void
  requestDetailOpen: (item: LegacyExtensionRuntimeRecord, source?: LegacyExtensionRuntimeScope) => void
  requestEdit: (item: LegacyExtensionRuntimeRecord, source?: LegacyExtensionRuntimeScope) => void
  requestDelete: (item: LegacyExtensionRuntimeRecord, source?: LegacyExtensionRuntimeScope) => void
  requestToolToggle: (
    item: LegacyExtensionRuntimeRecord,
    toolId: string,
    enabled: boolean,
    source?: LegacyExtensionRuntimeScope,
  ) => void
  requestRefresh: (source: LegacyExtensionRuntimeScope) => void
}

export interface LegacyExtensionManagerFilterContext {
  activeType: Ref<ExtensionKind>
  catalog: ComputedRef<LegacyExtensionRuntimeRecord[]>
  installationDisplayItems: ComputedRef<LegacyExtensionRuntimeDisplay>
  setDisplayItems: (displayItems?: LegacyExtensionRuntimeDisplay) => void
  claimFilter: () => LegacyExtensionFilterLease
}

export type LegacyExtensionFilterLease = (() => void) & {
  readonly active: boolean
}

export interface LegacyExtensionManagerRootContext
  extends LegacyExtensionManagerContext, LegacyExtensionManagerFilterContext {}
