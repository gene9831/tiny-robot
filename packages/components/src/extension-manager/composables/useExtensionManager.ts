import { computed, inject, provide, ref, watch } from 'vue'
import type { InjectionKey } from 'vue'
import type {
  ExtensionDisplay,
  ExtensionManagerContext,
  ExtensionManagerEmits,
  ExtensionManagerRootProps,
  ExtensionOperationStateMap,
  ExtensionSource,
  ExtensionType,
} from '../index.type'

const defaultTypeOptions = [
  { value: 'mcp', label: 'MCP' },
  { value: 'skill', label: 'Skills' },
] satisfies Array<{ value: ExtensionType; label: string }>

const extensionManagerContextKey: InjectionKey<ExtensionManagerContext> = Symbol('ExtensionManagerContext')

interface ExtensionManagerRootContext extends ExtensionManagerContext {
  setDisplayItems: (displayItems: ExtensionDisplay) => void
}

export const useExtensionManager = (
  props: Readonly<ExtensionManagerRootProps>,
  emit: ExtensionManagerEmits,
): ExtensionManagerRootContext => {
  const activeType = ref<ExtensionType>(props.defaultActiveType ?? 'mcp')
  const expandedSections = ref<Record<ExtensionSource, boolean>>({
    installed: true,
    market: true,
  })
  const catalog = computed(() => props.extensions ?? [])
  const displayItemsSource = ref<ExtensionDisplay>({ installed: [], market: [] })
  const displayItems = computed<ExtensionDisplay>(() => displayItemsSource.value)
  const operationStates = computed<ExtensionOperationStateMap>(() => props.operationStates ?? {})

  const typeOptions = computed(() => defaultTypeOptions)

  const installedItems = computed(() =>
    displayItems.value.installed.filter((item) => item.type === activeType.value),
  )
  const marketItems = computed(() => displayItems.value.market.filter((item) => item.type === activeType.value))

  const setDisplayItems = (nextDisplayItems: ExtensionDisplay) => {
    displayItemsSource.value = nextDisplayItems
  }

  const setActiveType = (type: ExtensionType) => {
    activeType.value = type
  }

  const isSectionExpanded = (source: ExtensionSource) => expandedSections.value[source]

  const toggleSection = (source: ExtensionSource) => {
    expandedSections.value[source] = !expandedSections.value[source]
  }

  watch(activeType, (type, oldType) => {
    if (type === oldType) return
    emit('type-change', type)
  })

  watch(
    catalog,
    (items) => {
      setDisplayItems({
        installed: items.filter((item) => item.installation !== undefined),
        market: items.filter((item) => item.installation === undefined),
      })
    },
    { deep: true, immediate: true },
  )

  return {
    activeType,
    catalog,
    displayItems,
    operationStates,
    typeOptions,
    installedItems,
    marketItems,
    setDisplayItems,
    setActiveType,
    isSectionExpanded,
    toggleSection,
  }
}

export const provideExtensionManagerContext = (context: ExtensionManagerContext) => {
  provide(extensionManagerContextKey, context)
}

export const useExtensionManagerContext = () => {
  const context = inject(extensionManagerContextKey)

  if (!context) {
    throw new Error('useExtensionManagerContext must be used inside ExtensionManagerRoot')
  }

  return context
}
