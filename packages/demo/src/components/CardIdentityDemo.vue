<script setup lang="ts">
import { IconSparkles } from '@opentiny/tiny-robot-svgs'
import { computed, ref } from 'vue'
import { ExtensionManager } from '@opentiny/tiny-robot'

const useComponentIcon = ref(false)
const iconImage = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" rx="20" fill="#607ce9"/><path d="M24 42c0-11 8-19 18-19s18 8 18 19-8 19-18 19-18-8-18-19Z" fill="#9ee7d1"/><circle cx="34" cy="39" r="4" fill="#14233b"/><circle cx="50" cy="39" r="4" fill="#14233b"/><path d="M34 50c5 4 11 4 16 0" fill="none" stroke="#14233b" stroke-linecap="round" stroke-width="3"/></svg>',
)}`
const icon = computed(() => (useComponentIcon.value ? IconSparkles : iconImage))
</script>

<template>
  <article class="card-pattern">
    <div class="card-pattern__tag">01 / 标识</div>
    <h4>基础信息</h4>
    <p class="card-pattern__description">传入名称、描述和图标，就能建立清晰、安静的视觉身份。</p>

    <div class="card-pattern__preview">
      <ExtensionManager.Card
        data-testid="card-identity-preview"
        name="研究助手"
        description="把零散笔记整理成清晰的初稿。"
        :icon="icon"
      />
    </div>

    <label class="card-pattern__control">
      <input v-model="useComponentIcon" type="checkbox" />
      使用组件图标
    </label>
  </article>
</template>

<style scoped>
.card-pattern {
  min-width: 0;
  padding: 16px;
  border: 1px solid #dfe9f7;
  border-radius: 16px;
  background: #fff;
}

.card-pattern__tag {
  display: inline-flex;
  padding: 4px 7px;
  border-radius: 99px;
  background: #f0f4ff;
  color: #647be1;
  font-size: 9px;
  font-weight: 800;
}

.card-pattern h4 {
  margin: 23px 0 5px;
  color: #263c63;
  font-size: 16px;
}

.card-pattern__description {
  min-height: 36px;
  margin: 0;
  color: #7b8daa;
  font-size: 11px;
  line-height: 1.5;
}

.card-pattern__preview {
  margin-top: 14px;
  overflow: hidden;
  border-radius: 12px;
}

.card-pattern__control {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-top: 12px;
  color: #7185a5;
  font-size: 11px;
}
</style>
