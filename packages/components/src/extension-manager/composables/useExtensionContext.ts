import { computed, inject, provide, ref, watch } from 'vue'
import type { ComputedRef, InjectionKey } from 'vue'
import { normalizeExtensions } from '../normalizeExtension'
import type {
  Extension,
  ExtensionContext,
  ExtensionDisplay,
  ExtensionIntent,
  ExtensionKind,
  ExtensionRootEmits,
  ExtensionRootProps,
  ExtensionScope,
  ExtensionToggleIntent,
  ExtensionToolToggleIntent,
} from '../index.type'

type ExtensionFilterLease = (() => void) & { readonly active: boolean }

interface ExtensionFilterContext {
  activeKind: ExtensionContext['activeKind']
  allExtensions: ExtensionContext['allExtensions']
  unfilteredDisplayItems: ComputedRef<ExtensionDisplay>
  setDisplayItems: (displayItems?: ExtensionDisplay) => void
  claimFilter: () => ExtensionFilterLease
}

const defaultTypeOptions = [
  { value: 'mcp', label: 'MCP' },
  { value: 'skill', label: 'Skills' },
] satisfies Array<{ value: ExtensionKind; label: string }>

const extensionContextKey: InjectionKey<ExtensionContext> = Symbol('ExtensionContext')
const extensionFilterContextKey: InjectionKey<ExtensionFilterContext> = Symbol('ExtensionFilterContext')

const isEnabledExtension = (extension: Extension) => {
  if (!extension.installed || typeof extension.config !== 'object' || extension.config === null) return false

  return 'enabled' in extension.config && typeof extension.config.enabled === 'boolean'
}

const isExtensionScope = (scope: string): scope is ExtensionScope => scope === 'installed' || scope === 'available'

export const provideExtensionContext = (props: Readonly<ExtensionRootProps>, emit: ExtensionRootEmits) => {
  const defaultExpandedSections: Record<ExtensionScope, boolean> = {
    installed: true,
    available: true,
  }
  const activeKind = ref<ExtensionKind>(props.activeKind ?? props.defaultActiveKind ?? 'mcp')
  const expandedSections = ref<Record<ExtensionScope, boolean>>({
    ...defaultExpandedSections,
    ...props.expandedSections,
  })
  const allExtensions = computed(() => normalizeExtensions(props.extensions ?? []))
  const unfilteredDisplayItems = computed<ExtensionDisplay>(() => ({
    installed: allExtensions.value.filter((item) => item.installed),
    available: allExtensions.value.filter((item) => !item.installed),
  }))
  const displayItemsSource = ref<ExtensionDisplay>()
  const displayItems = computed<ExtensionDisplay>(() => displayItemsSource.value ?? unfilteredDisplayItems.value)
  const operationStates = computed(() => props.operationStates ?? {})
  const typeOptions = computed(() => defaultTypeOptions)
  const installedItems = computed(() => displayItems.value.installed)
  const availableItems = computed(() => displayItems.value.available)

  const findExtension = (item: Extension) =>
    allExtensions.value.find((candidate) => candidate.id === item.id && candidate.kind === item.kind)
  const createIntent = (item: Extension): ExtensionIntent => ({ id: item.id, kind: item.kind })
  const setDisplayItems = (nextDisplayItems?: ExtensionDisplay) => {
    displayItemsSource.value = nextDisplayItems
  }

  let activeFilterLease: ExtensionFilterLease | undefined
  const claimFilter = (): ExtensionFilterLease => {
    if (activeFilterLease) {
      if (import.meta.env.DEV) {
        console.error('[ExtensionManager] Only one ExtensionFilter can be mounted at a time.')
      }

      return Object.assign(() => undefined, { active: false })
    }

    const release: ExtensionFilterLease = Object.assign(
      () => {
        if (activeFilterLease !== release) return
        activeFilterLease = undefined
        setDisplayItems()
      },
      { active: true },
    )
    activeFilterLease = release
    return release
  }

  const setActiveKind = (kind: ExtensionKind) => {
    if (activeKind.value === kind) return
    activeKind.value = kind
    emit('update:active-kind', kind)
    emit('kind-change', kind)
  }
  const isSectionExpanded = (scope: ExtensionScope) => expandedSections.value[scope]
  const toggleSection = (scope: ExtensionScope) => {
    const nextExpandedSections = { ...expandedSections.value, [scope]: !expandedSections.value[scope] }
    expandedSections.value = nextExpandedSections
    emit('update:expanded-sections', nextExpandedSections)
  }
  const requestInstall = (item: Extension) => {
    const extension = findExtension(item)
    if (!extension || extension.installed) return
    emit('install', createIntent(extension))
  }
  const requestCreate = (kind: ExtensionKind) => {
    if (!kind) return
    emit('create', kind)
  }
  const requestToggle = (item: Extension, enabled: boolean) => {
    const extension = findExtension(item)
    if (!extension || !isEnabledExtension(extension)) return
    const intent: ExtensionToggleIntent = { ...createIntent(extension), enabled }
    emit('toggle', intent)
  }
  const requestDetail = (item: Extension) => {
    const extension = findExtension(item)
    if (!extension) return
    emit('detail', createIntent(extension))
  }
  const requestEdit = (item: Extension) => {
    const extension = findExtension(item)
    if (!extension?.installed) return
    emit('edit', createIntent(extension))
  }
  const requestDelete = (item: Extension) => {
    const extension = findExtension(item)
    if (!extension?.installed) return
    emit('delete', createIntent(extension))
  }
  const requestToolToggle = (item: Extension, toolId: string, enabled: boolean) => {
    const extension = findExtension(item)
    if (!extension?.installed || !toolId) return
    const intent: ExtensionToolToggleIntent = { ...createIntent(extension), toolId, enabled }
    emit('tool-toggle', intent)
  }
  const requestRefresh = (scope: ExtensionScope) => {
    if (!isExtensionScope(scope)) return
    emit('refresh', scope)
  }

  watch(
    () => props.activeKind,
    (kind) => {
      if (kind !== undefined) activeKind.value = kind
    },
  )
  watch(
    () => props.expandedSections,
    (sections) => {
      if (sections === undefined) return
      expandedSections.value = { ...defaultExpandedSections, ...sections }
    },
    { deep: true },
  )

  const context: ExtensionContext = {
    activeKind,
    allExtensions,
    displayItems,
    operationStates,
    typeOptions,
    installedItems,
    availableItems,
    setActiveKind,
    isSectionExpanded,
    toggleSection,
    requestInstall,
    requestCreate,
    requestToggle,
    requestDetail,
    requestEdit,
    requestDelete,
    requestToolToggle,
    requestRefresh,
  }
  const filterContext: ExtensionFilterContext = {
    activeKind,
    allExtensions,
    unfilteredDisplayItems,
    setDisplayItems,
    claimFilter,
  }

  provide(extensionContextKey, context)
  provide(extensionFilterContextKey, filterContext)
  return context
}

export const useExtensionContext = () => {
  const context = inject(extensionContextKey)
  if (!context) throw new Error('useExtensionContext must be used inside ExtensionManagerRoot')
  return context
}

export const useInternalExtensionFilterContext = () => {
  const context = inject(extensionFilterContextKey)
  if (!context) throw new Error('ExtensionFilter must be used inside ExtensionManagerRoot')
  return context
}
