<script setup lang="ts">
import type { ExtensionCardAction, ExtensionCardActionEvent } from '@opentiny/tiny-robot'
import { ExtensionManager } from '@opentiny/tiny-robot'
import { IconDelete, IconEditPen } from '@opentiny/tiny-robot-svgs'
import { computed, ref } from 'vue'

const checked = ref(true)
const primaryActionsLimit = ref(2)
const showCustom = ref(true)
const showDanger = ref(true)
const disableSwitch = ref(false)
const disableButton = ref(false)
const latestEvent = ref('暂无操作')

const actions = computed<ExtensionCardAction[]>(() => [
  {
    id: 'focus-mode',
    type: 'switch',
    label: checked.value ? '退出专注模式' : '开启专注模式',
    checked: checked.value,
    disabled: disableSwitch.value,
  },
  {
    id: 'edit-details',
    type: 'button',
    label: '编辑详情',
    icon: IconEditPen,
    disabled: disableButton.value,
  },
  {
    id: 'quick-note',
    type: 'custom',
    label: '快速记录',
    hidden: !showCustom.value,
    data: { origin: 'action-anatomy' },
  },
  {
    id: 'clear-draft',
    type: 'button',
    label: '清除草稿',
    icon: IconDelete,
    danger: true,
    hidden: !showDanger.value,
  },
])

const handleAction = (event: ExtensionCardActionEvent) => {
  if (event.type === 'switch' && typeof event.checked === 'boolean') checked.value = event.checked
  latestEvent.value = JSON.stringify(event)
}
</script>

<template>
  <article class="card-pattern">
    <div class="card-pattern__tag">02 / 操作</div>
    <h4>操作组合</h4>
    <p class="card-pattern__description">一组有序的操作可以同时表达主操作、溢出操作、受控状态和自定义行为。</p>

    <div class="card-pattern__preview">
      <ExtensionManager.Card
        data-testid="card-action-preview"
        name="工作空间助手"
        description="把常用操作放在卡片表面，保持交互集中。"
        :actions="actions"
        :primary-actions-limit="primaryActionsLimit"
        overflow-menu-label="更多操作"
        @action="handleAction"
      />
    </div>

    <div class="card-pattern__controls">
      <label
        >主操作数量
        <select v-model.number="primaryActionsLimit">
          <option :value="0">0 个可见</option>
          <option :value="1">1 个可见</option>
          <option :value="2">2 个可见</option>
          <option :value="3">3 个可见</option>
        </select></label
      >
      <label><input v-model="showCustom" type="checkbox" /> 显示自定义</label>
      <label><input v-model="showDanger" type="checkbox" /> 显示危险操作</label>
      <label><input v-model="disableSwitch" type="checkbox" /> 禁用开关</label>
      <label><input v-model="disableButton" type="checkbox" /> 禁用按钮</label>
    </div>
    <code class="card-pattern__event">{{ latestEvent }}</code>
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
.card-pattern__controls {
  display: flex;
  flex-wrap: wrap;
  gap: 9px 12px;
  margin-top: 12px;
  color: #7185a5;
  font-size: 11px;
}
.card-pattern__controls label {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.card-pattern__controls select {
  height: 24px;
  border: 1px solid #d6e2f2;
  border-radius: 6px;
  color: #536fe0;
  font-size: 11px;
}
.card-pattern__event {
  display: block;
  overflow: hidden;
  margin-top: 12px;
  padding: 8px 9px;
  border-radius: 8px;
  background: #f4f8ff;
  color: #61779a;
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
