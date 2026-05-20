import { loadSkillFilesFromFileList, SkillManager } from '@opentiny/tiny-robot-kit/core'
import type { SkillDefinition, SkillLoaderResult } from '@opentiny/tiny-robot-kit/core'
import { computed, ref } from 'vue'

const DRAFT_SCOPE = '__draft__'

function createSkillStore() {
  const manager = new SkillManager()
  const skills = ref<SkillDefinition[]>([])
  const activeScopeId = ref(DRAFT_SCOPE)
  const draftSkillNames = ref<string[]>([])
  const selectedSkillNamesByConversation = ref<Record<string, string[]>>({})
  const importWarnings = ref<SkillLoaderResult['warnings']>([])
  const importError = ref('')
  const isImportingSkills = ref(false)

  const currentSelectedSkillNames = computed(() => {
    if (activeScopeId.value === DRAFT_SCOPE) {
      return draftSkillNames.value
    }
    return selectedSkillNamesByConversation.value[activeScopeId.value] || []
  })

  const selectedSkillSet = computed(() => new Set(currentSelectedSkillNames.value))

  const selectedSkills = computed(() =>
    currentSelectedSkillNames.value.flatMap((name) => {
      const skill = manager.get(name)
      return skill ? [skill] : []
    }),
  )

  const selectedSkillCount = computed(() => selectedSkills.value.length)

  function refreshSkills() {
    skills.value = manager.list()
  }

  function setSelectedSkillNamesForScope(scopeId: string, names: string[]) {
    const uniqueNames = Array.from(new Set(names)).filter((name) => manager.has(name))

    if (scopeId === DRAFT_SCOPE) {
      draftSkillNames.value = uniqueNames
      return
    }

    selectedSkillNamesByConversation.value = {
      ...selectedSkillNamesByConversation.value,
      [scopeId]: uniqueNames,
    }
  }

  function setActiveSkillConversation(conversationId: string | null) {
    activeScopeId.value = conversationId || DRAFT_SCOPE
  }

  function attachDraftSkillsToConversation(conversationId: string) {
    if (!selectedSkillNamesByConversation.value[conversationId]) {
      setSelectedSkillNamesForScope(conversationId, draftSkillNames.value)
    }
    setActiveSkillConversation(conversationId)
  }

  function toggleSkill(name: string, selected?: boolean) {
    if (!manager.has(name)) {
      return
    }

    const scopeId = activeScopeId.value
    const next = new Set(currentSelectedSkillNames.value)
    const shouldSelect = selected ?? !next.has(name)

    if (shouldSelect) {
      next.add(name)
    } else {
      next.delete(name)
    }

    setSelectedSkillNamesForScope(scopeId, Array.from(next))
  }

  function removeSkill(name: string) {
    manager.remove(name)
    refreshSkills()
    draftSkillNames.value = draftSkillNames.value.filter((skillName) => skillName !== name)
    selectedSkillNamesByConversation.value = Object.fromEntries(
      Object.entries(selectedSkillNamesByConversation.value).map(([conversationId, skillNames]) => [
        conversationId,
        skillNames.filter((skillName) => skillName !== name),
      ]),
    )
  }

  async function importSkillFiles(fileList: FileList | null | undefined) {
    if (!fileList?.length || isImportingSkills.value) {
      return
    }

    isImportingSkills.value = true
    importError.value = ''
    importWarnings.value = []

    try {
      const files = await loadSkillFilesFromFileList(fileList)
      const result = manager.import(files)
      importWarnings.value = result.warnings
      refreshSkills()
      toggleSkill(result.skill.name, true)
    } catch (error) {
      importError.value = error instanceof Error ? error.message : String(error)
    } finally {
      isImportingSkills.value = false
    }
  }

  return {
    skills,
    selectedSkills,
    currentSelectedSkillNames,
    selectedSkillSet,
    selectedSkillCount,
    importWarnings,
    importError,
    isImportingSkills,
    setActiveSkillConversation,
    attachDraftSkillsToConversation,
    toggleSkill,
    removeSkill,
    importSkillFiles,
  }
}

type SkillStore = ReturnType<typeof createSkillStore>
let skillStore: SkillStore | null = null

export function useSkills() {
  if (!skillStore) {
    skillStore = createSkillStore()
  }
  return skillStore
}
