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

export const useExtensionManager = (
  props: Readonly<ExtensionManagerRootProps>,
  emit: ExtensionManagerEmits,
): ExtensionManagerContext => {
  const activeType = ref<ExtensionType>(props.defaultActiveType ?? 'mcp')
  const expandedSections = ref<Record<ExtensionSource, boolean>>({
    installed: true,
    market: true,
  })
  const catalog = computed(() => props.extensions ?? [])
  const displayItems = computed<ExtensionDisplay>(() => ({
    installed: catalog.value.filter((item) => item.installation !== undefined),
    market: catalog.value.filter((item) => item.installation === undefined),
  }))
  const operationStates = computed<ExtensionOperationStateMap>(() => props.operationStates ?? {})

  const typeOptions = computed(() => defaultTypeOptions)

  const installedItems = computed(() =>
    displayItems.value.installed.filter((item) => item.type === activeType.value),
  )
  const marketItems = computed(() => displayItems.value.market.filter((item) => item.type === activeType.value))

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

  return {
    activeType,
    catalog,
    displayItems,
    operationStates,
    typeOptions,
    installedItems,
    marketItems,
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
