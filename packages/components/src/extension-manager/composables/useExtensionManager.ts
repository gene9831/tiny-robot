import { computed, inject, provide, ref, watch } from 'vue'
import type { InjectionKey } from 'vue'
import type {
  ExtensionFilterLease,
  ExtensionKind,
  ExtensionManagerContext,
  ExtensionManagerEmits,
  ExtensionManagerRootProps,
  ExtensionOperationStateMap,
} from '../index.type'
import type {
  LegacyExtensionIntent,
  LegacyExtensionManagerContext,
  LegacyExtensionManagerEmits,
  LegacyExtensionManagerFilterContext,
  LegacyExtensionManagerRootProps,
  LegacyExtensionRuntimeDisplay,
  LegacyExtensionRuntimeScope,
  LegacyExtensionToggleIntent,
} from '../internal.type'

type ExtensionRuntimeItem = NonNullable<LegacyExtensionManagerRootProps['extensions']>[number]
type ExtensionRuntimeScope = LegacyExtensionRuntimeScope
type ExtensionRuntimeDisplay = LegacyExtensionRuntimeDisplay

const defaultTypeOptions = [
  { value: 'mcp', label: 'MCP' },
  { value: 'skill', label: 'Skills' },
] satisfies Array<{ value: ExtensionKind; label: string }>

const extensionManagerContextKey: InjectionKey<ExtensionManagerContext> = Symbol('ExtensionManagerContext')
const extensionManagerFilterContextKey: InjectionKey<ExtensionManagerContext> = Symbol('ExtensionManagerFilterContext')

interface ExtensionManagerRootContext extends LegacyExtensionManagerContext, LegacyExtensionManagerFilterContext {}

export const useExtensionManager = (
  props: Readonly<ExtensionManagerRootProps>,
  emit: ExtensionManagerEmits,
): ExtensionManagerContext => {
  const legacyProps = props as unknown as Readonly<LegacyExtensionManagerRootProps>
  const legacyEmit = emit as unknown as LegacyExtensionManagerEmits
  const defaultExpandedSections: Record<ExtensionRuntimeScope, boolean> = {
    installed: true,
    market: true,
  }
  const activeType = ref<ExtensionKind>(legacyProps.activeType ?? legacyProps.defaultActiveType ?? 'mcp')
  const expandedSections = ref<Record<ExtensionRuntimeScope, boolean>>({
    ...defaultExpandedSections,
    ...legacyProps.expandedSections,
  })
  const catalog = computed(() => legacyProps.extensions ?? [])
  const installationDisplayItems = computed<ExtensionRuntimeDisplay>(() => ({
    installed: catalog.value.filter((item) => item.installation !== undefined),
    market: catalog.value.filter((item) => item.installation === undefined),
  }))
  const displayItemsSource = ref<ExtensionRuntimeDisplay>()
  const displayItems = computed<ExtensionRuntimeDisplay>(
    () => displayItemsSource.value ?? installationDisplayItems.value,
  )
  const operationStates = computed<ExtensionOperationStateMap>(() => legacyProps.operationStates ?? {})

  const typeOptions = computed(() => defaultTypeOptions)

  const installedItems = computed(() => displayItems.value.installed)
  const marketItems = computed(() => displayItems.value.market)

  const setDisplayItems = (nextDisplayItems?: ExtensionRuntimeDisplay) => {
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

  const setActiveType = (type: ExtensionKind) => {
    if (activeType.value === type) return
    activeType.value = type
    legacyEmit('update:active-type', type)
    legacyEmit('type-change', type)
  }

  const isSectionExpanded = (source: ExtensionRuntimeScope) => expandedSections.value[source]

  const toggleSection = (source: ExtensionRuntimeScope) => {
    const nextExpandedSections = {
      ...expandedSections.value,
      [source]: !expandedSections.value[source],
    }

    expandedSections.value = nextExpandedSections
    legacyEmit('update:expanded-sections', nextExpandedSections)
  }

  const createIntent = (item: ExtensionRuntimeItem, source?: ExtensionRuntimeScope): LegacyExtensionIntent => ({
    id: item.id,
    type: item.type,
    ...(source === undefined ? {} : { source }),
  })

  const requestAdd = (item: ExtensionRuntimeItem, source?: ExtensionRuntimeScope) => {
    legacyEmit('extension-add', createIntent(item, source))
  }

  const requestCreate = () => {
    legacyEmit('extension-create', activeType.value)
  }

  const requestToggle = (item: ExtensionRuntimeItem, enabled: boolean, source?: ExtensionRuntimeScope) => {
    const intent: LegacyExtensionToggleIntent = {
      ...createIntent(item, source),
      enabled,
    }
    legacyEmit('extension-toggle', intent)
  }

  const requestDetailOpen = (item: ExtensionRuntimeItem, source?: ExtensionRuntimeScope) => {
    legacyEmit('extension-detail-open', createIntent(item, source))
  }

  const requestEdit = (item: ExtensionRuntimeItem, source?: ExtensionRuntimeScope) => {
    legacyEmit('extension-edit', createIntent(item, source))
  }

  const requestDelete = (item: ExtensionRuntimeItem, source?: ExtensionRuntimeScope) => {
    legacyEmit('extension-delete', createIntent(item, source))
  }

  const requestToolToggle = (
    item: ExtensionRuntimeItem,
    toolId: string,
    enabled: boolean,
    source?: ExtensionRuntimeScope,
  ) => {
    legacyEmit('tool-toggle', {
      ...createIntent(item, source),
      toolId,
      enabled,
    })
  }

  const requestRefresh = (source: ExtensionRuntimeScope) => {
    legacyEmit('refresh', activeType.value, source)
  }

  watch(
    () => legacyProps.activeType,
    (type) => {
      if (type !== undefined) activeType.value = type
    },
  )

  watch(
    () => legacyProps.expandedSections,
    (sections) => {
      if (sections === undefined) return
      expandedSections.value = {
        ...defaultExpandedSections,
        ...sections,
      }
    },
    { deep: true },
  )
  const context: ExtensionManagerRootContext = {
    activeType,
    catalog,
    installationDisplayItems,
    displayItems,
    operationStates,
    typeOptions,
    installedItems,
    marketItems,
    setDisplayItems,
    claimFilter,
    setActiveType,
    isSectionExpanded,
    toggleSection,
    requestAdd,
    requestCreate,
    requestToggle,
    requestDetailOpen,
    requestEdit,
    requestDelete,
    requestToolToggle,
    requestRefresh,
  }

  return context as unknown as ExtensionManagerContext
}

export const provideExtensionManagerContext = (context: ExtensionManagerContext) => {
  provide(extensionManagerContextKey, context)
  provide(extensionManagerFilterContextKey, context)
}

export const useExtensionManagerContext = () => {
  const context = inject(extensionManagerContextKey)

  if (!context) {
    throw new Error('useExtensionManagerContext must be used inside ExtensionManagerRoot')
  }

  return context
}

export const useExtensionManagerFilterContext = () => {
  const context = inject(extensionManagerFilterContextKey)

  if (!context) {
    throw new Error('useExtensionManagerFilterContext must be used inside ExtensionManagerRoot')
  }

  return context
}
