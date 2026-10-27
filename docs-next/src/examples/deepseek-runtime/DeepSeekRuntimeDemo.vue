<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { createRuntime, type RuntimeSnapshot } from '@opentiny/tiny-robot-runtime'
import { selectConversation } from '@opentiny/tiny-robot-runtime/selectors'
import {
  DEEPSEEK_MODELS,
  DEEPSEEK_PROVIDERS,
  resolveDeepSeekRegistration,
  type DeepSeekModelId,
  type DeepSeekProviderId,
} from './providerRegistrations'

const providerId = ref<DeepSeekProviderId>('deepseek-responses')
const modelId = ref<DeepSeekModelId>('deepseek-flash')
const apiKey = ref('')
const prompt = ref('请用一句话说明这个回答经过了 Tiny Robot Runtime。')
const assistantParts = ref<ReadonlyArray<{ id: string; kind: 'text' | 'reasoning'; content: string }>>([])
const runStatus = ref('尚未发送')
const runFacts = ref('')
const submitting = ref(false)
const currentConversationId = ref<string>()

const selectedProvider = computed(() => DEEPSEEK_PROVIDERS[providerId.value])

function projectRun(snapshot: RuntimeSnapshot, conversationId: string): void {
  const turn = selectConversation(snapshot, conversationId)?.turns.at(-1)
  const run = turn?.selectedRun ?? turn?.runs.at(-1)
  if (run === undefined) {
    return
  }

  const assistant = run.outputMessages.find((message) => message.role === 'assistant')
  assistantParts.value =
    assistant?.parts
      .filter((part) => part.kind === 'text' || part.kind === 'reasoning')
      .map((part) => ({ id: part.id, kind: part.kind as 'text' | 'reasoning', content: part.content ?? '' })) ?? []
  runStatus.value = run.status
  runFacts.value = JSON.stringify(
    {
      providerId: run.providerId,
      modelId: run.modelId,
      stepKinds: run.steps.map((step) => step.kind),
      termination: run.termination,
      usage: run.usage,
    },
    null,
    2,
  )
}

const runtime = createRuntime({
  resolveProvider: (providerId) => resolveDeepSeekRegistration(providerId, () => apiKey.value.trim()),
  inspect: {
    streamPart: ({ part }) => console.log('[DeepSeek doStream chunk]', part),
  },
})
const unsubscribe = runtime.subscribe((snapshot) => {
  if (currentConversationId.value !== undefined) {
    projectRun(snapshot, currentConversationId.value)
  }
})

async function send(): Promise<void> {
  const currentModelId = modelId.value
  const currentApiKey = apiKey.value.trim()
  const currentPrompt = prompt.value.trim()
  if (currentApiKey.length === 0 || currentPrompt.length === 0 || submitting.value) {
    return
  }

  submitting.value = true
  assistantParts.value = []
  runFacts.value = ''
  runStatus.value = '正在调用'
  const conversation = runtime.createConversation()
  currentConversationId.value = conversation.id

  try {
    await conversation.send({
      providerId: providerId.value,
      modelId: currentModelId,
      content: currentPrompt,
    })
    projectRun(runtime.getSnapshot(), conversation.id)
  } catch {
    runStatus.value = 'deepseek_live_request_failed'
  } finally {
    submitting.value = false
  }
}

onBeforeUnmount(() => {
  unsubscribe()
  apiKey.value = ''
})
</script>

<template>
  <form class="deepseek-demo" @submit.prevent="send">
    <label class="deepseek-demo__field">
      <span>Provider / API 格式</span>
      <select v-model="providerId" :disabled="submitting">
        <option
          v-for="(availableProvider, availableProviderId) in DEEPSEEK_PROVIDERS"
          :key="availableProviderId"
          :value="availableProviderId"
        >
          {{ availableProvider.label }}
        </option>
      </select>
    </label>

    <p class="deepseek-demo__endpoint">
      最终请求：<code>https://api.deepseek.com{{ selectedProvider.endpoint }}</code>
    </p>

    <label class="deepseek-demo__field">
      <span>模型</span>
      <select v-model="modelId" :disabled="submitting">
        <option v-for="(_, availableModelId) in DEEPSEEK_MODELS" :key="availableModelId" :value="availableModelId">
          {{ availableModelId }}
        </option>
      </select>
    </label>

    <label class="deepseek-demo__field">
      <span>DeepSeek API Key（仅保存在当前页面内存）</span>
      <input
        v-model="apiKey"
        type="password"
        name="deepseek-api-key"
        autocomplete="off"
        placeholder="sk-..."
        :disabled="submitting"
      />
    </label>

    <label class="deepseek-demo__field">
      <span>输入</span>
      <textarea v-model="prompt" rows="4" :disabled="submitting" />
    </label>

    <button type="submit" :disabled="submitting || !apiKey.trim() || !prompt.trim()">
      {{ submitting ? '发送中…' : '通过 Runtime 发送' }}
    </button>

    <section class="deepseek-demo__result" aria-live="polite">
      <strong>Run 状态：{{ runStatus }}</strong>
      <hr v-if="assistantParts.length" class="deepseek-demo__result-divider" />
      <div v-for="part in assistantParts" :key="part.id" class="deepseek-demo__part">
        <strong>{{ part.kind }}</strong>
        <pre><code>{{ part.content }}</code></pre>
      </div>
      <pre v-if="runFacts"><code>{{ runFacts }}</code></pre>
    </section>
  </form>
</template>

<style scoped>
.deepseek-demo {
  display: grid;
  gap: 1rem;
  margin: 1.5rem 0;
  padding: 1.25rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
}

.deepseek-demo__field {
  display: grid;
  gap: 0.4rem;
  font-weight: 600;
}

.deepseek-demo select,
.deepseek-demo input,
.deepseek-demo textarea {
  width: 100%;
  padding: 0.7rem 0.8rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg);
  font: inherit;
}

.deepseek-demo button {
  width: fit-content;
  padding: 0.65rem 1rem;
  border: 0;
  border-radius: 8px;
  color: var(--vp-button-brand-text);
  background: var(--vp-button-brand-bg);
  font-weight: 600;
  cursor: pointer;
}

.deepseek-demo button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.deepseek-demo__endpoint {
  margin: -0.4rem 0 0;
  color: var(--vp-c-text-2);
}

.deepseek-demo__result {
  min-width: 0;
  min-height: 4rem;
  padding-top: 1rem;
  border-top: 1px solid var(--vp-c-divider);
}

.deepseek-demo__result pre {
  overflow: auto;
}

.deepseek-demo__result-divider {
  margin: 1rem 0;
  border: 0;
  border-top: 1px solid var(--vp-c-divider);
}

.deepseek-demo__part {
  min-width: 0;
}

.deepseek-demo__part pre {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>
