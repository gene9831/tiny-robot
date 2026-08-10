<script setup lang="ts">
import { ref, watch } from 'vue'
import McpCodeEditor from './mcp-form/McpCodeEditor.vue'
import McpDefinitionEditor from './mcp-form/McpDefinitionEditor.vue'
import type { McpDefinition, McpFormEmits, McpFormMode, McpFormProps } from '../index.type'

const props = withDefaults(defineProps<McpFormProps>(), {
  mode: 'form',
  code: '',
})
const emit = defineEmits<McpFormEmits>()

const createDefinition = (definition?: McpDefinition): McpDefinition => ({
  name: definition?.name ?? '',
  description: definition?.description ?? '',
  transport: definition?.transport ?? 'streamableHttp',
  url: definition?.url ?? '',
  headers: { ...definition?.headers },
})

const mode = ref<McpFormMode>(props.mode)
const definition = ref(createDefinition(props.definition))
const code = ref(props.code)

watch(
  () => props.mode,
  (nextMode) => {
    mode.value = nextMode
  },
)

watch(
  () => props.definition,
  (nextDefinition) => {
    definition.value = createDefinition(nextDefinition)
  },
)

watch(
  () => props.code,
  (nextCode) => {
    code.value = nextCode
  },
)

const handleModeUpdate = (nextMode: McpFormMode) => {
  mode.value = nextMode
  emit('update:mode', nextMode)
}

const handleSubmit = () => {
  if (mode.value === 'form') {
    emit('submit', { mode: 'form', data: { ...definition.value, headers: { ...definition.value.headers } } })
    return
  }

  emit('submit', { mode: 'code', data: code.value })
}
</script>

<template>
  <form class="tr-mcp-form" @submit.prevent="handleSubmit">
    <fieldset class="tr-mcp-form__mode" aria-label="MCP mode">
      <legend>Mode</legend>
      <label>
        <input type="radio" name="mcp-mode" :checked="mode === 'form'" @change="handleModeUpdate('form')" />
        Form
      </label>
      <label>
        <input type="radio" name="mcp-mode" :checked="mode === 'code'" @change="handleModeUpdate('code')" />
        Code
      </label>
    </fieldset>

    <McpDefinitionEditor v-if="mode === 'form'" v-model:definition="definition" />
    <McpCodeEditor v-else v-model:code="code" />

    <div class="tr-mcp-form__actions">
      <button type="button" @click="emit('cancel')">Cancel</button>
      <button type="submit">Submit</button>
    </div>
  </form>
</template>

<style lang="less" scoped>
.tr-mcp-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  color: var(--tr-text-primary);
}

.tr-mcp-form__mode {
  display: flex;
  gap: 16px;
  margin: 0;
  padding: 0;
  border: 0;
}

.tr-mcp-form__mode legend {
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
}

.tr-mcp-form__mode label {
  display: inline-flex;
  gap: 6px;
  align-items: center;
}

.tr-mcp-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.tr-mcp-form__actions button {
  min-width: 72px;
  height: 32px;
  padding: 0 16px;
  border: 1px solid var(--tr-border-color-divider, #d9d9d9);
  border-radius: 999px;
  background: var(--tr-container-bg-default, #fff);
  color: var(--tr-text-primary);
  cursor: pointer;
}

.tr-mcp-form__actions button[type='submit'] {
  border-color: var(--tr-color-primary, #191919);
  background: var(--tr-color-primary, #191919);
  color: #fff;
}
</style>
