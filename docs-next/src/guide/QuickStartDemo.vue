<script setup lang="ts">
import { computed, ref } from 'vue'
import { runQuickStartDemo, type QuickStartDemoResult } from './quickStartDemo'

const question = ref('请用一句话介绍北京的气候特点。')
const running = ref(false)
const result = ref<QuickStartDemoResult>()
const unexpectedError = ref('')
const canSubmit = computed(() => !running.value && question.value.trim().length > 0)

async function submitQuestion(): Promise<void> {
  if (!canSubmit.value) return

  running.value = true
  result.value = undefined
  unexpectedError.value = ''
  try {
    result.value = await runQuickStartDemo(question.value)
  } catch {
    unexpectedError.value = '本地示例未能完成，请重新运行。'
  } finally {
    running.value = false
  }
}
</script>

<template>
  <section class="quick-start-demo">
    <label for="quick-start-question">用户问题</label>
    <textarea id="quick-start-question" v-model="question" rows="3" :disabled="running" />
    <div class="quick-start-demo__actions">
      <button type="button" :disabled="!canSubmit" @click="submitQuestion">
        {{ running ? 'Runtime 正在生成回答…' : '提交给本地 Runtime' }}
      </button>
      <span>不访问网络，也不需要 API key。</span>
    </div>

    <div class="quick-start-demo__result" aria-live="polite">
      <p v-if="running">Run 已进入执行阶段，正在等待本地 Provider 结束。</p>
      <template v-else-if="result?.ok">
        <dl>
          <div>
            <dt>问题</dt>
            <dd>{{ result.question }}</dd>
          </div>
          <div>
            <dt>回答</dt>
            <dd>{{ result.answer }}</dd>
          </div>
          <div>
            <dt>Run 结果</dt>
            <dd>
              <code>{{ result.status }}</code> · <code>{{ result.termination }}</code>
            </dd>
          </div>
        </dl>
      </template>
      <p v-else-if="result && !result.ok" class="quick-start-demo__error">{{ result.error.message }}</p>
      <p v-else-if="unexpectedError" class="quick-start-demo__error">{{ unexpectedError }}</p>
      <p v-else>提交后，这里会显示从 Snapshot 选出的最终回答和 Run 结果。</p>
    </div>
  </section>
</template>

<style scoped>
.quick-start-demo {
  display: grid;
  gap: 0.75rem;
  margin: 1.25rem 0 1.75rem;
  padding: 1.25rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
}

.quick-start-demo label,
.quick-start-demo dt {
  font-weight: 600;
}

.quick-start-demo textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg);
  font: inherit;
  resize: vertical;
}

.quick-start-demo__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.quick-start-demo button {
  padding: 0.65rem 1rem;
  border: 0;
  border-radius: 8px;
  color: var(--vp-button-brand-text);
  background: var(--vp-button-brand-bg);
  font-weight: 600;
  cursor: pointer;
}

.quick-start-demo button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.quick-start-demo__actions span,
.quick-start-demo__result > p {
  color: var(--vp-c-text-2);
}

.quick-start-demo__result {
  padding: 1rem;
  border-radius: 8px;
  background: var(--vp-c-bg);
}

.quick-start-demo__result dl,
.quick-start-demo__result p {
  margin: 0;
}

.quick-start-demo__result div + div {
  margin-top: 0.75rem;
}

.quick-start-demo__result dd {
  margin: 0.2rem 0 0;
}

.quick-start-demo__error {
  color: var(--vp-c-danger-1) !important;
}
</style>
