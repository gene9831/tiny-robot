import { computed, ref, watch, type ComputedRef } from 'vue'
import type {
  ExtensionManagerEmits,
  ExtensionManagerExpandedSections,
  ExtensionManagerProps,
  ExtensionManagerSectionKey,
  ExtensionManagerTab,
} from '../index.type'

type ExtensionManagerState = {
  activeTabId: ComputedRef<string | undefined>
  activeTab: ComputedRef<ExtensionManagerTab | undefined>
  expandedSections: ComputedRef<ExtensionManagerExpandedSections>
  selectTab: (tabId: string) => void
  isSectionExpanded: (tabId: string, sectionKey: ExtensionManagerSectionKey) => boolean
  toggleSection: (tabId: string, sectionKey: ExtensionManagerSectionKey) => void
}

const SECTION_KEYS: readonly ExtensionManagerSectionKey[] = ['installed', 'available']

const hasOwn = (record: object, key: PropertyKey) => Object.prototype.hasOwnProperty.call(record, key)

const createSafeRecord = <T>() => Object.create(null) as T

const setRecordValue = <T extends object, K extends PropertyKey, V>(record: T, key: K, value: V) => {
  Object.defineProperty(record, key, {
    configurable: true,
    enumerable: true,
    value,
    writable: true,
  })
}

const cloneExpandedSections = (record: ExtensionManagerExpandedSections): ExtensionManagerExpandedSections => {
  const clone = createSafeRecord<ExtensionManagerExpandedSections>()

  for (const [tabId, sectionRecord] of Object.entries(record)) {
    const sectionClone = createSafeRecord<Partial<Record<ExtensionManagerSectionKey, boolean>>>()

    for (const [sectionKey, expanded] of Object.entries(sectionRecord ?? {})) {
      if (sectionKey === 'installed' || sectionKey === 'available') {
        setRecordValue(sectionClone, sectionKey, expanded)
      }
    }

    setRecordValue(clone, tabId, sectionClone)
  }

  return clone
}

const getSectionOverride = (
  record: ExtensionManagerExpandedSections,
  tabId: string,
  sectionKey: ExtensionManagerSectionKey,
) => {
  if (!hasOwn(record, tabId)) return undefined

  const sectionRecord = record[tabId]
  if (sectionRecord === undefined || !hasOwn(sectionRecord, sectionKey)) return undefined

  return sectionRecord[sectionKey]
}

const setSectionOverride = (
  record: ExtensionManagerExpandedSections,
  tabId: string,
  sectionKey: ExtensionManagerSectionKey,
  expanded: boolean,
) => {
  const sectionRecord =
    hasOwn(record, tabId) && record[tabId] !== undefined
      ? record[tabId]!
      : createSafeRecord<Partial<Record<ExtensionManagerSectionKey, boolean>>>()

  if (!hasOwn(record, tabId)) setRecordValue(record, tabId, sectionRecord)
  setRecordValue(sectionRecord, sectionKey, expanded)
}

const getDefaultExpanded = (props: Readonly<ExtensionManagerProps>) => props.defaultExpanded ?? true

const getExpanded = (
  props: Readonly<ExtensionManagerProps>,
  record: ExtensionManagerExpandedSections,
  tabId: string,
  sectionKey: ExtensionManagerSectionKey,
) => getSectionOverride(record, tabId, sectionKey) ?? getDefaultExpanded(props)

const normalizeExpandedSections = (
  props: Readonly<ExtensionManagerProps>,
  record: ExtensionManagerExpandedSections,
): ExtensionManagerExpandedSections => {
  const normalized = createSafeRecord<ExtensionManagerExpandedSections>()

  for (const tab of props.tabs) {
    const sectionRecord = createSafeRecord<Partial<Record<ExtensionManagerSectionKey, boolean>>>()

    for (const sectionKey of SECTION_KEYS) {
      setRecordValue(sectionRecord, sectionKey, getExpanded(props, record, tab.id, sectionKey))
    }

    setRecordValue(normalized, tab.id, sectionRecord)
  }

  return normalized
}

export const useExtensionManagerState = (
  props: Readonly<ExtensionManagerProps>,
  emit: ExtensionManagerEmits,
): ExtensionManagerState => {
  const uncontrolledActiveTabId = ref(props.defaultActiveTab)
  const uncontrolledExpandedSections = ref<ExtensionManagerExpandedSections>(createSafeRecord())

  const enabledTabs = computed(() => props.tabs.filter((tab) => !tab.disabled))
  const firstEnabledTabId = computed(() => enabledTabs.value[0]?.id)

  watch(
    () => props.tabs.map((tab) => tab.id),
    (tabIds) => {
      const allowedTabIds = new Set(tabIds)
      const next = createSafeRecord<ExtensionManagerExpandedSections>()

      for (const [tabId, sectionRecord] of Object.entries(uncontrolledExpandedSections.value)) {
        if (allowedTabIds.has(tabId)) setRecordValue(next, tabId, sectionRecord)
      }

      uncontrolledExpandedSections.value = next
    },
    { immediate: true },
  )

  const normalizedUncontrolledActiveTab = (nextEnabledTabs: ExtensionManagerTab[]) => {
    if (nextEnabledTabs.some((tab) => tab.id === uncontrolledActiveTabId.value)) return

    uncontrolledActiveTabId.value = nextEnabledTabs[0]?.id
  }

  watch(
    [enabledTabs, () => props.activeTab],
    ([nextEnabledTabs, activeTab]) => {
      if (activeTab !== undefined) return

      normalizedUncontrolledActiveTab(nextEnabledTabs)
    },
    { immediate: true },
  )

  const activeTabId = computed<string | undefined>(() => {
    const requestedTabId = props.activeTab ?? uncontrolledActiveTabId.value
    const requestedTab = enabledTabs.value.find((tab) => tab.id === requestedTabId)

    return requestedTab?.id ?? firstEnabledTabId.value
  })

  const activeTab = computed<ExtensionManagerTab | undefined>(() =>
    activeTabId.value === undefined
      ? undefined
      : props.tabs.find((tab) => tab.id === activeTabId.value && !tab.disabled),
  )

  let lastEmittedActiveTabId = props.activeTab
  watch(
    activeTabId,
    (nextActiveTabId) => {
      if (props.activeTab !== undefined && nextActiveTabId === props.activeTab) {
        lastEmittedActiveTabId = nextActiveTabId
        return
      }

      if (nextActiveTabId === lastEmittedActiveTabId) return

      lastEmittedActiveTabId = nextActiveTabId
      emit('update:active-tab', nextActiveTabId)
    },
    { immediate: true },
  )

  const expandedSections = computed<ExtensionManagerExpandedSections>(() =>
    normalizeExpandedSections(
      props,
      props.expandedSections === undefined ? uncontrolledExpandedSections.value : props.expandedSections,
    ),
  )

  const isSectionExpanded = (tabId: string, sectionKey: ExtensionManagerSectionKey) => {
    const record = props.expandedSections ?? uncontrolledExpandedSections.value
    return getExpanded(props, record, tabId, sectionKey)
  }

  const selectTab = (tabId: string) => {
    const tab = enabledTabs.value.find((candidate) => candidate.id === tabId)
    if (!tab || activeTabId.value === tab.id) return

    if (props.activeTab === undefined) uncontrolledActiveTabId.value = tab.id
    else emit('update:active-tab', tab.id)

    emit('tab-change', { tabId: tab.id })
  }

  const toggleSection = (tabId: string, sectionKey: ExtensionManagerSectionKey) => {
    if (!props.tabs.some((tab) => tab.id === tabId)) return

    const expanded = !isSectionExpanded(tabId, sectionKey)

    if (props.expandedSections === undefined) {
      const nextUncontrolledExpandedSections = cloneExpandedSections(uncontrolledExpandedSections.value)
      setSectionOverride(nextUncontrolledExpandedSections, tabId, sectionKey, expanded)
      uncontrolledExpandedSections.value = nextUncontrolledExpandedSections
      emit('update:expanded-sections', expandedSections.value)
    } else {
      const nextExpandedSections = cloneExpandedSections(expandedSections.value)
      setSectionOverride(nextExpandedSections, tabId, sectionKey, expanded)
      emit('update:expanded-sections', nextExpandedSections)
    }

    emit('section-toggle', { tabId, sectionKey, expanded })
  }

  return {
    activeTabId,
    activeTab,
    expandedSections,
    selectTab,
    isSectionExpanded,
    toggleSection,
  }
}
