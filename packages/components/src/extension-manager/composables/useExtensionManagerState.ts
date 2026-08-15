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
  stateKey: string
  publicKey: string
}

const hasOwn = (record: Record<string, boolean>, key: string) => Object.prototype.hasOwnProperty.call(record, key)

const getSectionStateKey = (tabId: string, sectionId: string) => JSON.stringify([tabId, sectionId])

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

    return props.tabs.flatMap((tab) =>
      tab.sections.map((section) => {
        const stateKey = getSectionStateKey(tab.id, section.id)

        return {
          tabId: tab.id,
          sectionId: section.id,
          stateKey,
          publicKey: sectionIdCounts.get(section.id) === 1 ? section.id : stateKey,
        }
      }),
    )
  })

  const getSectionIdentity = (tabId: string, sectionId: string) =>
    sectionIdentities.value.find((identity) => identity.tabId === tabId && identity.sectionId === sectionId)

  const getKnownExpandedKeys = () => {
    const knownKeys = new Set<string>()

    for (const identity of sectionIdentities.value) {
      knownKeys.add(identity.stateKey)
      knownKeys.add(identity.publicKey)
    }

    return knownKeys
  }

  const cleanExpandedRecord = (record: Record<string, boolean>) => {
    const knownKeys = getKnownExpandedKeys()

    return Object.fromEntries(Object.entries(record).filter(([key]) => knownKeys.has(key)))
  }

  const toPublicExpandedRecord = (record: Record<string, boolean>) => {
    const publicRecord: Record<string, boolean> = {}

    for (const identity of sectionIdentities.value) {
      if (hasOwn(record, identity.stateKey)) {
        publicRecord[identity.publicKey] = record[identity.stateKey]
      }
    }

    return publicRecord
  }

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
      : cleanExpandedRecord(props.expandedSections),
  )

  const isSectionExpanded = (tabId: string, sectionId: string, section: ExtensionManagerSection) => {
    if (section.collapsible !== true) return true

    const record = props.expandedSections
    const override =
      record === undefined
        ? readSectionOverride(tabId, sectionId, uncontrolledExpandedSections.value)
        : readSectionOverride(tabId, sectionId, record)

    return override ?? getDefaultExpanded(section)
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
      uncontrolledExpandedSections.value = {
        ...uncontrolledExpandedSections.value,
        [identity.stateKey]: expanded,
      }
      emit('update:expanded-sections', expandedSections.value)
    } else {
      const nextExpandedSections = cleanExpandedRecord({ ...props.expandedSections })
      delete nextExpandedSections[identity.stateKey]
      delete nextExpandedSections[identity.publicKey]
      nextExpandedSections[identity.publicKey] = expanded
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
