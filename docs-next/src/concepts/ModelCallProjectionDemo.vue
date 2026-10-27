<script setup lang="ts">
import { computed, ref } from 'vue'
import { runModelCallProjectionDemo, type ModelCallProjectionDemoResult } from './modelCallProjectionDemo'

const content = ref('解释模型调用边界。')
const running = ref(false)
const result = ref<ModelCallProjectionDemoResult>()
const error = ref('')
const canRun = computed(() => !running.value && content.value.trim().length > 0)
const serialized = computed(() =>
  result.value?.ok ? JSON.stringify(result.value.callOptions, null, 2) : '尚未捕获调用对象',
)

async function runProjection(): Promise<void> {
  if (!canRun.value) return
  running.value = true
  result.value = undefined
  error.value = ''
  try {
    result.value = await runModelCallProjectionDemo(content.value)
  } catch {
    error.value = '本地示例未能完成，请重新运行。'
  } finally {
    running.value = false
  }
}
</script>

<template>
  <section class="projection-demo">
    <label for="projection-demo-content">用户消息</label>
    <textarea id="projection-demo-content" v-model="content" rows="2" :disabled="running" />
    <div class="projection-demo__actions">
      <button type="button" :disabled="!canRun" @click="runProjection">
        {{ running ? 'Runtime 正在调用本地模型…' : '捕获实际调用对象' }}
      </button>
      <span><code>AbortSignal</code> 仅显示是否可用，不序列化对象本身。</span>
    </div>

    <p v-if="error" class="projection-demo__error" aria-live="polite">{{ error }}</p>
    <p v-else-if="result && !result.ok" class="projection-demo__error" aria-live="polite">
      {{ result.error.message }}
    </p>
    <pre aria-live="polite"><code>{{ running ? '等待本地模型接收调用对象…' : serialized }}</code></pre>
  </section>
</template>

<style scoped>
.projection-demo {
  display: grid;
  gap: 0.75rem;
  margin: 1.25rem 0 1.75rem;
  padding: 1.25rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
}

.projection-demo label {
  font-weight: 600;
}

.projection-demo textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg);
  font: inherit;
  resize: vertical;
}

.projection-demo__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.projection-demo button {
  padding: 0.65rem 1rem;
  border: 0;
  border-radius: 8px;
  color: var(--vp-button-brand-text);
  background: var(--vp-button-brand-bg);
  font-weight: 600;
  cursor: pointer;
}

.projection-demo button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.projection-demo__actions span {
  color: var(--vp-c-text-2);
}

.projection-demo pre,
.projection-demo__error {
  margin: 0;
}

.projection-demo pre {
  max-height: 24rem;
  overflow: auto;
}

.projection-demo__error {
  color: var(--vp-c-danger-1);
}
</style>
