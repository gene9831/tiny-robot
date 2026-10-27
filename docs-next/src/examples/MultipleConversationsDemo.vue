<script setup lang="ts">
import { computed, ref } from 'vue'
import { runMultipleConversationsDemo, type MultipleConversationsDemoResult } from './multipleConversationsDemo'

const running = ref(false)
const result = ref<MultipleConversationsDemoResult>()
const selectedId = ref('')
const error = ref('')
const selected = computed(() => result.value?.conversations.find(({ id }) => id === selectedId.value))

async function createConversations(): Promise<void> {
  if (running.value) return
  running.value = true
  result.value = undefined
  selectedId.value = ''
  error.value = ''
  try {
    const next = await runMultipleConversationsDemo()
    result.value = next
    selectedId.value = next.conversations[0]?.id ?? ''
  } catch {
    error.value = '本地示例未能完成，请重新运行。'
  } finally {
    running.value = false
  }
}
</script>

<template>
  <section class="conversation-demo">
    <div class="conversation-demo__header">
      <button type="button" :disabled="running" @click="createConversations">
        {{ running ? '依次创建回答…' : '创建两段 Conversation' }}
      </button>
      <span>本示例顺序执行两个本地回答，不验证并发协调。</span>
    </div>

    <p v-if="running" class="conversation-demo__hint" aria-live="polite">
      两段 Conversation 正在写入同一个 Runtime Snapshot…
    </p>
    <p v-else-if="error" class="conversation-demo__error" aria-live="polite">{{ error }}</p>

    <template v-else-if="result">
      <div class="conversation-demo__tabs" aria-label="选择要展示的 Conversation">
        <button
          v-for="conversation in result.conversations"
          :key="conversation.id"
          type="button"
          :class="{ 'is-selected': selectedId === conversation.id }"
          :aria-pressed="selectedId === conversation.id"
          @click="selectedId = conversation.id"
        >
          {{ conversation.label }}
        </button>
      </div>

      <div class="conversation-demo__result" aria-live="polite">
        <p>
          <strong>{{ selected?.label }}</strong>
        </p>
        <p>问题：{{ selected?.question }}</p>
        <p>回答：{{ selected?.answer }}</p>
      </div>

      <ul class="conversation-demo__residents">
        <li v-for="conversation in result.conversations" :key="conversation.id">
          {{ conversation.label }}：仍保留在 Snapshot
        </li>
      </ul>
    </template>

    <p v-else class="conversation-demo__hint">运行后可在 A、B 之间切换，并观察两段对话仍同时存在。</p>
  </section>
</template>

<style scoped>
.conversation-demo {
  display: grid;
  gap: 1rem;
  margin: 1.25rem 0 1.75rem;
  padding: 1.25rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
}

.conversation-demo__header,
.conversation-demo__tabs {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.conversation-demo button {
  padding: 0.6rem 0.9rem;
  border: 1px solid var(--vp-c-brand-1);
  border-radius: 8px;
  color: var(--vp-c-brand-1);
  background: var(--vp-c-bg);
  font-weight: 600;
  cursor: pointer;
}

.conversation-demo__header > button,
.conversation-demo__tabs button.is-selected {
  color: var(--vp-button-brand-text);
  background: var(--vp-button-brand-bg);
}

.conversation-demo button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.conversation-demo__header span,
.conversation-demo__hint {
  color: var(--vp-c-text-2);
}

.conversation-demo__hint,
.conversation-demo__error,
.conversation-demo__result p,
.conversation-demo__residents {
  margin: 0;
}

.conversation-demo__result {
  padding: 1rem;
  border-radius: 8px;
  background: var(--vp-c-bg);
}

.conversation-demo__result p + p {
  margin-top: 0.35rem;
}

.conversation-demo__residents {
  padding-left: 1.25rem;
}

.conversation-demo__error {
  color: var(--vp-c-danger-1);
}
</style>
