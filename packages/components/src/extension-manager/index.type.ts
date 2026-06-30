import type { VNode } from 'vue'

export type ExtensionType = 'mcp' | 'skill'

export type ExtensionSource = 'installed' | 'market'

export type ExtensionAddState = 'idle' | 'loading' | 'added' | 'failed'

export interface ExtensionItem<TMetadata = Record<string, unknown>> {
  id: string
  type: ExtensionType
  name: string
  icon?: string
  description?: string
  enabled?: boolean
  tags?: string[]
  addState?: ExtensionAddState
  progress?: number
  metadata?: TMetadata
}

export type ExtensionCardPrimaryAction =
  | {
      type: 'toggle'
      enabled?: boolean
      disabled?: boolean
    }
  | {
      type: 'add'
      state?: ExtensionAddState
      progress?: number
      disabled?: boolean
    }

export interface ExtensionCardProps {
  name: string
  description?: string
  descriptionLines?: number
  icon?: string
  iconAlt?: string
  nameClickable?: boolean
  primaryAction?: ExtensionCardPrimaryAction
  deleteAction?: {
    disabled?: boolean
  }
}

export interface ExtensionCardSlots {
  icon?: () => VNode[]
  meta?: () => VNode[]
}

export interface ExtensionCardEmits {
  (e: 'name-click', event: MouseEvent | KeyboardEvent): void
  (e: 'toggle', enabled: boolean): void
  (e: 'add'): void
  (e: 'delete'): void
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
  source: ExtensionSource
  loading?: boolean
  emptyText?: string
}

export interface ExtensionListEmits {
  (e: 'extension-add', item: ExtensionItem): void
  (e: 'extension-detail-open', item: ExtensionItem): void
  (e: 'extension-toggle', item: ExtensionItem, enabled: boolean): void
  (e: 'extension-delete', item: ExtensionItem): void
}

export interface ExtensionSectionProps {
  title: string
  expanded?: boolean
}

export interface ExtensionSectionEmits {
  (e: 'toggle'): void
}

export interface ExtensionManagerProps {
  installedExtensions?: ExtensionItem[]
  marketExtensions?: ExtensionItem[]
  typeOptions?: ExtensionTypeOption[]
  tagOptions?: ExtensionTagOption[]
  defaultActiveType?: ExtensionType
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
  allowExtensionAdd?: boolean
  allowExtensionCreate?: boolean
  allowExtensionEdit?: boolean
  allowExtensionDelete?: boolean
  allowExtensionDetail?: boolean
  allowExtensionToggle?: boolean
  allowToolToggle?: boolean
  loading?: boolean
  marketLoading?: boolean
  visible?: boolean
  searchFn?: (query: string, item: ExtensionItem, source: ExtensionSource) => boolean
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
