import { computed, inject, provide, ref, watch } from 'vue'
import type { InjectionKey } from 'vue'
import type {
  ExtensionFilterLease,
  ExtensionIntent,
  ExtensionKind,
  ExtensionManagerFilterContext,
  ExtensionManagerContext,
  ExtensionManagerEmits,
  ExtensionManagerRootProps,
  ExtensionOperationStateMap,
  ExtensionToggleIntent,
} from '../index.type'

type ExtensionRuntimeItem = NonNullable<ExtensionManagerRootProps['extensions']>[number]
type ExtensionRuntimeScope = keyof NonNullable<ExtensionManagerRootProps['expandedSections']>
type ExtensionRuntimeDisplay = {
  installed: ExtensionRuntimeItem[]
  market: ExtensionRuntimeItem[]
}

const defaultTypeOptions = [
  { value: 'mcp', label: 'MCP' },
  { value: 'skill', label: 'Skills' },
] satisfies Array<{ value: ExtensionKind; label: string }>

const extensionManagerContextKey: InjectionKey<ExtensionManagerContext> = Symbol('ExtensionManagerContext')
const extensionManagerFilterContextKey: InjectionKey<ExtensionManagerFilterContext> = Symbol(
  'ExtensionManagerFilterContext',
)

interface ExtensionManagerRootContext extends ExtensionManagerContext, ExtensionManagerFilterContext {}

export const useExtensionManager = (
  props: Readonly<ExtensionManagerRootProps>,
  emit: ExtensionManagerEmits,
): ExtensionManagerRootContext => {
  const defaultExpandedSections: Record<ExtensionRuntimeScope, boolean> = {
    installed: true,
    market: true,
  }
  const activeType = ref<ExtensionKind>(props.activeType ?? props.defaultActiveType ?? 'mcp')
  const expandedSections = ref<Record<ExtensionRuntimeScope, boolean>>({
    ...defaultExpandedSections,
    ...props.expandedSections,
  })
  const catalog = computed(() => props.extensions ?? [])
  const installationDisplayItems = computed<ExtensionRuntimeDisplay>(() => ({
    installed: catalog.value.filter((item) => item.installation !== undefined),
    market: catalog.value.filter((item) => item.installation === undefined),
  }))
  const displayItemsSource = ref<ExtensionRuntimeDisplay>()
  const displayItems = computed<ExtensionRuntimeDisplay>(
    () => displayItemsSource.value ?? installationDisplayItems.value,
  )
  const operationStates = computed<ExtensionOperationStateMap>(() => props.operationStates ?? {})

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
    emit('update:active-type', type)
    emit('type-change', type)
  }

  const isSectionExpanded = (source: ExtensionRuntimeScope) => expandedSections.value[source]

  const toggleSection = (source: ExtensionRuntimeScope) => {
    const nextExpandedSections = {
      ...expandedSections.value,
      [source]: !expandedSections.value[source],
    }

    expandedSections.value = nextExpandedSections
    emit('update:expanded-sections', nextExpandedSections)
  }

  const createIntent = (item: ExtensionRuntimeItem, source?: ExtensionRuntimeScope): ExtensionIntent => ({
    id: item.id,
    type: item.type,
    ...(source === undefined ? {} : { source }),
  })

  const requestAdd = (item: ExtensionRuntimeItem, source?: ExtensionRuntimeScope) => {
    emit('extension-add', createIntent(item, source))
  }

  const requestCreate = () => {
    emit('extension-create', activeType.value)
  }

  const requestToggle = (item: ExtensionRuntimeItem, enabled: boolean, source?: ExtensionRuntimeScope) => {
    const intent: ExtensionToggleIntent = {
      ...createIntent(item, source),
      enabled,
    }
    emit('extension-toggle', intent)
  }

  const requestDetailOpen = (item: ExtensionRuntimeItem, source?: ExtensionRuntimeScope) => {
    emit('extension-detail-open', createIntent(item, source))
  }

  const requestEdit = (item: ExtensionRuntimeItem, source?: ExtensionRuntimeScope) => {
    emit('extension-edit', createIntent(item, source))
  }

  const requestDelete = (item: ExtensionRuntimeItem, source?: ExtensionRuntimeScope) => {
    emit('extension-delete', createIntent(item, source))
  }

  const requestToolToggle = (
    item: ExtensionRuntimeItem,
    toolId: string,
    enabled: boolean,
    source?: ExtensionRuntimeScope,
  ) => {
    emit('tool-toggle', {
      ...createIntent(item, source),
      toolId,
      enabled,
    })
  }

  const requestRefresh = (source: ExtensionRuntimeScope) => {
    emit('refresh', activeType.value, source)
  }

  watch(
    () => props.activeType,
    (type) => {
      if (type !== undefined) activeType.value = type
    },
  )

  watch(
    () => props.expandedSections,
    (sections) => {
      if (sections === undefined) return
      expandedSections.value = {
        ...defaultExpandedSections,
        ...sections,
      }
    },
    { deep: true },
  )
  return {
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
}

export const provideExtensionManagerContext = (context: ExtensionManagerRootContext) => {
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
