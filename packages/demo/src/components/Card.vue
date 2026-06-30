<script setup lang="ts">
import type { ExtensionAddState, ExtensionCardPrimaryAction } from '@opentiny/tiny-robot'
import { ExtensionManager } from '@opentiny/tiny-robot'
import { computed, ref } from 'vue'

const primaryActionType = ref<ExtensionCardPrimaryAction['type'] | 'none'>('toggle')
const enabled = ref(true)
const toggleDisabled = ref(false)
const addState = ref<ExtensionAddState>('idle')
const progress = ref(45)
const showProgressValue = ref(true)
const addDisabled = ref(false)
const hasDeleteAction = ref(true)
const deleteDisabled = ref(false)
const nameClickable = ref(true)
const events = ref<string[]>([])

const primaryAction = computed<ExtensionCardPrimaryAction | undefined>(() => {
  if (primaryActionType.value === 'toggle') {
    return {
      type: 'toggle',
      enabled: enabled.value,
      disabled: toggleDisabled.value,
    }
  }

  if (primaryActionType.value === 'add') {
    return {
      type: 'add',
      state: addState.value,
      progress: showProgressValue.value ? progress.value : undefined,
      disabled: addDisabled.value,
    }
  }

  return undefined
})

const deleteAction = computed(() => {
  if (!hasDeleteAction.value) return undefined

  return {
    disabled: deleteDisabled.value,
  }
})

const logEvent = (message: string) => {
  events.value.unshift(`${new Date().toLocaleTimeString()} ${message}`)
  events.value = events.value.slice(0, 8)
}

const handleToggle = (value: boolean) => {
  enabled.value = value
  logEvent(`切换：${value ? '启用' : '停用'}`)
}
</script>

<template>
  <div class="extension-card-demo">
    <header class="extension-card-demo__header">
      <h2>ExtensionCard</h2>
      <p>primaryAction 表达互斥的主操作，deleteAction 表达独立的次级删除操作。</p>
    </header>

    <section class="card-playground">
      <form class="card-playground__form">
        <label>
          primaryAction
          <select v-model="primaryActionType">
            <option value="none">none</option>
            <option value="toggle">toggle</option>
            <option value="add">add</option>
          </select>
        </label>

        <template v-if="primaryActionType === 'toggle'">
          <label class="card-playground__checkbox">
            <input v-model="enabled" type="checkbox" />
            toggle enabled
          </label>
          <label class="card-playground__checkbox">
            <input v-model="toggleDisabled" type="checkbox" />
            toggle disabled
          </label>
        </template>

        <template v-else-if="primaryActionType === 'add'">
          <label>
            add state
            <select v-model="addState">
              <option value="idle">idle</option>
              <option value="loading">loading</option>
              <option value="added">added</option>
              <option value="failed">failed</option>
            </select>
          </label>

          <template v-if="addState === 'loading'">
            <label>
              progress
              <input v-model.number="progress" type="number" min="0" max="100" :disabled="!showProgressValue" />
            </label>

            <label class="card-playground__checkbox">
              <input v-model="showProgressValue" type="checkbox" />
              progress is number
            </label>
          </template>

          <template v-if="addState === 'idle'">
            <label class="card-playground__checkbox">
              <input v-model="addDisabled" type="checkbox" />
              add disabled
            </label>
          </template>
        </template>

        <label class="card-playground__checkbox">
          <input v-model="hasDeleteAction" type="checkbox" />
          deleteAction
        </label>

        <label class="card-playground__checkbox">
          <input v-model="deleteDisabled" type="checkbox" :disabled="!hasDeleteAction" />
          delete disabled
        </label>

        <label class="card-playground__checkbox">
          <input v-model="nameClickable" type="checkbox" />
          nameClickable
        </label>
      </form>

      <div class="card-playground__preview">
        <div class="card-playground__preview-group">
          <div class="card-playground__preview-title">MCP：name + description + tools meta</div>
          <ExtensionManager.Card
            name="高德地图 MCP"
            description="提供地理编码、路线规划、天气查询等地图工具。"
            icon="https://img.alicdn.com/imgextra/i4/O1CN01iPPabT1EGRN6uatHP_!!6000000000324-0-tps-512-512.jpg"
            :description-lines="1"
            :primary-action="primaryAction"
            :delete-action="deleteAction"
            :name-clickable="nameClickable"
            @add="logEvent('添加：高德地图 MCP')"
            @delete="logEvent('删除：高德地图 MCP')"
            @name-click="logEvent('打开详情：高德地图 MCP')"
            @toggle="handleToggle"
          >
            <template #meta>2 个工具 · 已启用 1 个</template>
          </ExtensionManager.Card>
        </div>

        <div class="card-playground__preview-group">
          <div class="card-playground__preview-title">Skill：name + 最多两行 description</div>
          <ExtensionManager.Card
            name="头条搜索"
            description="使用头条的搜索功能来阅读或搜索 URL，并对搜索结果进行提炼、归纳和结构化输出。"
            :description-lines="2"
            :primary-action="primaryAction"
            :delete-action="deleteAction"
            :name-clickable="nameClickable"
            @add="logEvent('添加：头条搜索')"
            @delete="logEvent('删除：头条搜索')"
            @name-click="logEvent('打开详情：头条搜索')"
            @toggle="handleToggle"
          />
        </div>
      </div>
    </section>

    <section class="event-panel">
      <h3>事件日志</h3>
      <div v-if="events.length" class="event-list">
        <div v-for="event in events" :key="event" class="event-item">{{ event }}</div>
      </div>
      <p v-else>暂无事件。</p>
    </section>
  </div>
</template>

<style scoped>
.extension-card-demo {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px;
}

.extension-card-demo__header {
  margin-bottom: 20px;
}

.extension-card-demo__header h2 {
  margin: 0 0 8px;
  color: #1f2937;
  font-size: 24px;
}

.extension-card-demo__header p {
  margin: 0;
  color: #667085;
}

.card-playground {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 20px;
  padding: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
}

.card-playground__form {
  display: grid;
  gap: 12px;
  align-content: start;
}

.card-playground__form label {
  display: grid;
  gap: 6px;
  color: #344054;
  font-size: 13px;
}

.card-playground__form select {
  height: 32px;
  padding: 0 10px;
  border: 1px solid #d0d5dd;
  border-radius: 6px;
}

.card-playground__form input[type='number'] {
  height: 32px;
  padding: 0 10px;
  border: 1px solid #d0d5dd;
  border-radius: 6px;
}

.card-playground__checkbox {
  display: flex !important;
  align-items: center;
  gap: 8px !important;
}

.card-playground__preview {
  display: grid;
  gap: 16px;
  min-width: 0;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.card-playground__preview-group {
  display: grid;
  align-items: center;
  gap: 8px;
}

.card-playground__preview-title {
  color: #667085;
  font-size: 13px;
  font-weight: 600;
}

.event-panel {
  margin-top: 24px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fafafa;
}

.event-panel h3 {
  margin: 0 0 12px;
  font-size: 16px;
}

.event-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.event-item {
  padding: 8px 10px;
  border-radius: 6px;
  background: #fff;
  color: #333;
  font-size: 13px;
}

@media (max-width: 760px) {
  .card-playground {
    grid-template-columns: 1fr;
  }
}
</style>
