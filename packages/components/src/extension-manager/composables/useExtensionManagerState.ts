import { computed, ref, watch, type ComputedRef } from 'vue'
import type {
  ExtensionManagerEmits,
  ExtensionManagerProps,
  ExtensionManagerSection,
  ExtensionManagerTab,
} from '../index.type'

type ExtensionManagerState = {
  activeTabId: ComputedRef<string | undefined>
  activeTab: ComputedRef<ExtensionManagerTab | undefined>
  expandedSections: ComputedRef<Record<string, boolean>>
  selectTab: (tabId: string) => void
  isSectionExpanded: (tabId: string, sectionId: string, section: ExtensionManagerSection) => boolean
  toggleSection: (tabId: string, section: ExtensionManagerSection) => void
}

interface SectionIdentity {
  tabId: string
  sectionId: string
  section: ExtensionManagerSection
  stateKey: string
  publicKey: string
}

const hasOwn = (record: Record<string, boolean>, key: string) => Object.prototype.hasOwnProperty.call(record, key)

const setRecordValue = (record: Record<string, boolean>, key: string, value: boolean) => {
  Object.defineProperty(record, key, {
    configurable: true,
    enumerable: true,
    value,
    writable: true,
  })
}

const cloneRecord = (record: Record<string, boolean>) => {
  const clone: Record<string, boolean> = {}

  for (const [key, value] of Object.entries(record)) setRecordValue(clone, key, value)

  return clone
}

const filterRecord = (record: Record<string, boolean>, allowedKeys: Set<string>) => {
  let hasRemovedKey = false
  const filtered: Record<string, boolean> = {}

  for (const [key, value] of Object.entries(record)) {
    if (allowedKeys.has(key)) setRecordValue(filtered, key, value)
    else hasRemovedKey = true
  }

  return hasRemovedKey ? filtered : record
}

const encodeSectionPart = (value: string) => `${value.length}:${value}`

const getSectionStateKey = (tabId: string, sectionId: string) =>
  `extension-manager/section/${encodeSectionPart(tabId)}/${encodeSectionPart(sectionId)}`

export const useExtensionManagerState = (
  props: Readonly<ExtensionManagerProps>,
  emit: ExtensionManagerEmits,
): ExtensionManagerState => {
  const uncontrolledActiveTabId = ref(props.defaultActiveTab)
  const uncontrolledExpandedSections = ref<Record<string, boolean>>({})

  const enabledTabs = computed(() => props.tabs.filter((tab) => !tab.disabled))
  const firstEnabledTabId = computed(() => enabledTabs.value[0]?.id)

  const sectionIdentities = computed<SectionIdentity[]>(() => {
    const sectionIdCounts = new Map<string, number>()

    for (const tab of props.tabs) {
      for (const section of tab.sections) {
        sectionIdCounts.set(section.id, (sectionIdCounts.get(section.id) ?? 0) + 1)
      }
    }

    const entries = props.tabs.flatMap((tab) =>
      tab.sections.map((section) => ({
        tabId: tab.id,
        section,
        sectionId: section.id,
        stateKey: getSectionStateKey(tab.id, section.id),
      })),
    )
    const stateKeys = new Set(entries.map((entry) => entry.stateKey))
    const usedPublicKeys = new Set<string>()

    return entries.map((entry) => {
      const canUseSectionId =
        sectionIdCounts.get(entry.sectionId) === 1 &&
        !stateKeys.has(entry.sectionId) &&
        !usedPublicKeys.has(entry.sectionId)
      const publicKey = canUseSectionId ? entry.sectionId : entry.stateKey

      usedPublicKeys.add(publicKey)

      return {
        ...entry,
        publicKey,
      }
    })
  })

  watch(
    sectionIdentities,
    (identities) => {
      const currentStateKeys = new Set(identities.map((identity) => identity.stateKey))
      uncontrolledExpandedSections.value = filterRecord(uncontrolledExpandedSections.value, currentStateKeys)
    },
    { immediate: true, flush: 'sync' },
  )

  const getSectionIdentity = (tabId: string, sectionId: string) =>
    sectionIdentities.value.find((identity) => identity.tabId === tabId && identity.sectionId === sectionId)

  const readSectionOverride = (tabId: string, sectionId: string, record: Record<string, boolean>) => {
    const identity = getSectionIdentity(tabId, sectionId)
    const stateKey = identity?.stateKey ?? getSectionStateKey(tabId, sectionId)
    const publicKey = identity?.publicKey ?? sectionId

    if (hasOwn(record, stateKey)) return record[stateKey]
    if (hasOwn(record, publicKey)) return record[publicKey]

    return undefined
  }

  const getDefaultExpanded = (section: ExtensionManagerSection) =>
    section.defaultExpanded ?? props.defaultExpanded ?? true

  const getSectionExpanded = (
    identity: SectionIdentity | undefined,
    tabId: string,
    section: ExtensionManagerSection,
    record: Record<string, boolean>,
  ) => {
    if (section.collapsible !== true) return true

    const override =
      identity === undefined
        ? readSectionOverride(tabId, section.id, record)
        : readSectionOverride(identity.tabId, identity.sectionId, record)

    return override ?? getDefaultExpanded(section)
  }

  const toPublicExpandedRecord = (record: Record<string, boolean>) => {
    const publicRecord: Record<string, boolean> = {}

    for (const identity of sectionIdentities.value) {
      setRecordValue(
        publicRecord,
        identity.publicKey,
        getSectionExpanded(identity, identity.tabId, identity.section, record),
      )
    }

    return publicRecord
  }

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

  const expandedSections = computed<Record<string, boolean>>(() =>
    props.expandedSections === undefined
      ? toPublicExpandedRecord(uncontrolledExpandedSections.value)
      : toPublicExpandedRecord(props.expandedSections),
  )

  const isSectionExpanded = (tabId: string, sectionId: string, section: ExtensionManagerSection) => {
    const record = props.expandedSections
    const identity = getSectionIdentity(tabId, sectionId)

    return getSectionExpanded(
      identity,
      tabId,
      section,
      record === undefined ? uncontrolledExpandedSections.value : record,
    )
  }

  const selectTab = (tabId: string) => {
    const tab = enabledTabs.value.find((candidate) => candidate.id === tabId)
    if (!tab || activeTabId.value === tab.id) return

    if (props.activeTab === undefined) uncontrolledActiveTabId.value = tab.id
    else emit('update:active-tab', tab.id)

    emit('tab-change', { tabId: tab.id })
  }

  const toggleSection = (tabId: string, section: ExtensionManagerSection) => {
    if (section.collapsible !== true) return

    const identity = getSectionIdentity(tabId, section.id)
    if (!identity) return

    const expanded = !isSectionExpanded(tabId, section.id, section)

    if (props.expandedSections === undefined) {
      const nextUncontrolledExpandedSections = cloneRecord(uncontrolledExpandedSections.value)
      setRecordValue(nextUncontrolledExpandedSections, identity.stateKey, expanded)
      uncontrolledExpandedSections.value = nextUncontrolledExpandedSections
      emit('update:expanded-sections', expandedSections.value)
    } else {
      const nextExpandedSections = cloneRecord(expandedSections.value)
      setRecordValue(nextExpandedSections, identity.publicKey, expanded)
      emit('update:expanded-sections', nextExpandedSections)
    }

    emit('section-toggle', { tabId, sectionId: section.id, expanded })
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
