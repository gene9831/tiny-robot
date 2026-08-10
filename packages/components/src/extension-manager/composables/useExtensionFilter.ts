import { computed, onUnmounted, ref, watch } from 'vue'
import type {
  ExtensionFilterEmits,
  ExtensionFilterProps,
  ExtensionKind,
  ExtensionKindOption,
  ExtensionScope,
  ExtensionTagOption,
} from '../index.type'
import { useInternalExtensionFilterContext } from './internalExtensionContext'

export const useExtensionFilter = (props: Readonly<ExtensionFilterProps>, emit: ExtensionFilterEmits) => {
  const manager = useInternalExtensionFilterContext()
  const filterLease = manager.claimFilter()
  type ExtensionRuntimeItem = (typeof manager.allExtensions.value)[number]

  const uncontrolledActiveKind = ref<ExtensionKind>()
  const uncontrolledQuery = ref('')
  const uncontrolledTag = ref('')

  const kindOptions = computed<ExtensionKindOption[]>(() => {
    const seenKinds = new Set<ExtensionKind>()

    return manager.allExtensions.value.flatMap((item) => {
      if (seenKinds.has(item.kind)) return []
      seenKinds.add(item.kind)
      return [{ value: item.kind, label: props.kindLabels?.[item.kind] ?? item.kind }]
    })
  })
  const tagOptions = computed<ExtensionTagOption[]>(() => {
    const seenTags = new Set<string>()

    return manager.allExtensions.value.flatMap((item) =>
      (item.tags ?? []).flatMap((tag) => {
        if (seenTags.has(tag)) return []
        seenTags.add(tag)
        return [{ value: tag, label: tag }]
      }),
    )
  })
  const activeKind = computed({
    get: () => {
      const requestedKind = props.activeKind ?? uncontrolledActiveKind.value ?? props.defaultActiveKind
      if (kindOptions.value.some((option) => option.value === requestedKind)) return requestedKind
      return kindOptions.value[0]?.value
    },
    set: (kind: ExtensionKind) => {
      if (props.activeKind === undefined) uncontrolledActiveKind.value = kind
      emit('update:active-kind', kind)
    },
  })
  const searchQuery = computed({
    get: () => props.query ?? uncontrolledQuery.value,
    set: (query: string) => {
      if (props.query === undefined) uncontrolledQuery.value = query
      emit('update:query', query)
      emit('query-change', query)
    },
  })
  const activeTag = computed({
    get: () => props.tag ?? uncontrolledTag.value,
    set: (tag: string) => {
      if (props.tag === undefined) uncontrolledTag.value = tag
      emit('update:tag', tag)
      emit('tag-change', tag)
    },
  })

  watch(
    kindOptions,
    (options) => {
      const requestedKind = props.activeKind ?? uncontrolledActiveKind.value ?? props.defaultActiveKind
      const nextKind = options.some((option) => option.value === requestedKind) ? requestedKind : options[0]?.value

      if (props.activeKind === undefined && uncontrolledActiveKind.value !== nextKind) {
        uncontrolledActiveKind.value = nextKind
      }
    },
    { immediate: true },
  )

  const defaultSearch = (query: string, item: ExtensionRuntimeItem) => {
    if (!query) return true

    const keyword = query.toLowerCase()
    return item.name.toLowerCase().includes(keyword) || (item.description || '').toLowerCase().includes(keyword)
  }
  const filteredItems = computed(() =>
    manager.allExtensions.value.filter((item) => {
      if (item.kind !== activeKind.value) return false
      if (activeTag.value && !item.tags?.includes(activeTag.value)) return false

      const scope: ExtensionScope = item.installed ? 'installed' : 'available'
      return (props.searchFn ?? defaultSearch)(searchQuery.value, item, scope)
    }),
  )
  const display = computed(() => ({
    installed: filteredItems.value.filter((item) => item.installed),
    available: filteredItems.value.filter((item) => !item.installed),
  }))

  if (filterLease.active) {
    watch(
      display,
      (value) => {
        manager.setDisplayItems(value)
      },
      { immediate: true },
    )
  }

  onUnmounted(filterLease)

  return { activeKind, activeTag, kindOptions, searchQuery, tagOptions }
}
