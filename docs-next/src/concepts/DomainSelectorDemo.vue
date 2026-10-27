<script setup lang="ts">
import { computed, ref } from 'vue'
import { runDomainSelectorScenario, type DomainSelectorScenarioId } from './domainSelectorDemo'

const scenarios: ReadonlyArray<{ id: DomainSelectorScenarioId; label: string }> = [
  { id: 'existing', label: '已有根节点' },
  { id: 'missing', label: '查询根不存在' },
  { id: 'dangling', label: '存在悬空引用' },
]
const scenario = ref<DomainSelectorScenarioId>('existing')
const result = computed(() => runDomainSelectorScenario(scenario.value))
const serialized = computed(() => JSON.stringify(result.value, null, 2))
</script>

<template>
  <section class="selector-demo">
    <div class="selector-demo__controls" aria-label="选择 Selector 场景">
      <button
        v-for="item in scenarios"
        :key="item.id"
        type="button"
        :class="{ 'is-selected': scenario === item.id }"
        :aria-pressed="scenario === item.id"
        @click="scenario = item.id"
      >
        {{ item.label }}
      </button>
    </div>

    <div class="selector-demo__result" aria-live="polite">
      <p v-if="result.outcome === 'selected'">Selector 返回按领域关系展开的树。</p>
      <p v-else-if="result.outcome === 'missing'">查询根不存在，结果是 <code>undefined</code>。</p>
      <p v-else>查询根存在，但关系损坏，Selector 抛出稳定错误。</p>
      <pre><code>{{ serialized }}</code></pre>
    </div>
  </section>
</template>

<style scoped>
.selector-demo {
  display: grid;
  gap: 1rem;
  margin: 1.25rem 0 1.75rem;
  padding: 1.25rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
}

.selector-demo__controls {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.selector-demo button {
  padding: 0.6rem 0.9rem;
  border: 1px solid var(--vp-c-brand-1);
  border-radius: 8px;
  color: var(--vp-c-brand-1);
  background: var(--vp-c-bg);
  font-weight: 600;
  cursor: pointer;
}

.selector-demo button.is-selected {
  color: var(--vp-button-brand-text);
  background: var(--vp-button-brand-bg);
}

.selector-demo__result p,
.selector-demo__result pre {
  margin: 0;
}

.selector-demo__result pre {
  margin-top: 0.75rem;
  max-height: 24rem;
  overflow: auto;
}
</style>
