<template>
  <div>
    <button
      class="sender-action-btn sender-capability-btn"
      :class="{ 'sender-capability-btn--active': selectedSkillCount > 0 }"
      type="button"
      @click="skillPanelVisible = true"
    >
      <IconPlugin :size="16" class="sender-action-btn__icon" />
      Skill
      <span v-if="selectedSkillCount > 0" class="skill-active-count">{{ selectedSkillCount }}</span>
    </button>

    <Teleport to="body">
      <div v-if="skillPanelVisible" class="skill-panel-layer" @click.self="skillPanelVisible = false">
        <section class="skill-panel" role="dialog" aria-modal="true" aria-label="Skill 管理">
          <header class="skill-panel__header">
            <div>
              <h2>Skill 管理</h2>
              <p>导入能力模板，并为当前会话选择要启用的 skills。</p>
            </div>
            <button class="icon-button" type="button" aria-label="关闭" @click="skillPanelVisible = false">×</button>
          </header>

          <div class="skill-panel__actions">
            <button class="primary-button" type="button" :disabled="isImportingSkills" @click="openFilePicker">
              {{ isImportingSkills ? '导入中...' : '导入 Skill' }}
            </button>
            <input
              ref="fileInputRef"
              class="file-input"
              type="file"
              multiple
              webkitdirectory
              @change="handleFileChange"
            />
          </div>

          <p v-if="importError" class="skill-alert skill-alert--error">{{ importError }}</p>
          <div v-if="importWarnings.length > 0" class="skill-alert">
            <strong>导入警告</strong>
            <span v-for="warning in importWarnings" :key="`${warning.code}-${warning.path || ''}`">
              {{ warning.path ? `${warning.path}: ` : '' }}{{ warning.message }}
            </span>
          </div>

          <div v-if="skills.length === 0" class="skill-empty">
            <strong>还没有导入 Skill</strong>
            <span>选择一个包含 SKILL.md 的目录后，它会出现在这里。</span>
          </div>

          <div v-else class="skill-list">
            <article v-for="skill in skills" :key="skill.name" class="skill-item">
              <label class="skill-item__main">
                <input
                  type="checkbox"
                  :checked="selectedSkillSet.has(skill.name)"
                  @change="toggleSkill(skill.name, ($event.target as HTMLInputElement).checked)"
                />
                <span class="skill-item__text">
                  <strong>{{ skill.name }}</strong>
                  <small>{{ skill.description || '没有描述' }}</small>
                </span>
              </label>
              <div class="skill-item__meta">
                <span>{{ skill.files?.length || 0 }} files</span>
                <button class="text-button" type="button" @click="removeSkill(skill.name)">删除</button>
              </div>
            </article>
          </div>
        </section>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useChat } from '../composables/useChat'
import { IconPlugin } from './icons'

const {
  skills,
  selectedSkillSet,
  selectedSkillCount,
  importWarnings,
  importError,
  isImportingSkills,
  toggleSkill,
  removeSkill,
  importSkillFiles,
} = useChat()

const skillPanelVisible = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

function openFilePicker() {
  fileInputRef.value?.click()
}

async function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  await importSkillFiles(input.files)
  input.value = ''
}
</script>

<style scoped>
.sender-action-btn {
  border: 1px solid var(--tr-border-color-disabled);
  border-radius: var(--tr-radius-full);
  background: var(--tr-container-bg-default);
  color: var(--tr-text-secondary);
  font-size: var(--tr-font-size-sm);
  height: 32px;
  padding: 0 10px;
  line-height: 1;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.sender-action-btn:hover:not(:disabled) {
  border-color: var(--tr-border-color-hover);
  color: var(--tr-text-primary);
  background: var(--tr-container-bg-hover);
}

.sender-action-btn__icon {
  flex-shrink: 0;
}

.sender-capability-btn--active {
  border-color: var(--tr-border-color-hover);
  color: var(--tr-text-primary);
  background: var(--tr-container-bg-default-2);
}

.skill-active-count {
  min-width: 14px;
  height: 14px;
  border-radius: 999px;
  background: var(--tr-color-brand, #1476ff);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  padding: 0 3px;
}

.skill-panel-layer {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
  background: rgba(15, 23, 42, 0.24);
}

.skill-panel {
  width: min(420px, 100vw);
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  background: var(--tr-container-bg-default);
  color: var(--tr-text-primary);
  box-shadow: -12px 0 32px rgba(15, 23, 42, 0.16);
}

.skill-panel__header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.skill-panel__header h2 {
  margin: 0;
  font-size: 20px;
  line-height: 1.3;
}

.skill-panel__header p {
  margin: 6px 0 0;
  color: var(--tr-text-secondary);
  font-size: 13px;
  line-height: 1.5;
}

.icon-button {
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--tr-text-secondary);
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
}

.icon-button:hover {
  background: var(--tr-container-bg-hover);
  color: var(--tr-text-primary);
}

.skill-panel__actions {
  display: flex;
  gap: 8px;
}

.primary-button {
  height: 34px;
  border: 1px solid var(--tr-color-brand, #1476ff);
  border-radius: 6px;
  padding: 0 14px;
  color: #fff;
  background: var(--tr-color-brand, #1476ff);
  cursor: pointer;
}

.primary-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.file-input {
  display: none;
}

.skill-alert {
  display: grid;
  gap: 4px;
  margin: 0;
  padding: 10px 12px;
  border-radius: 6px;
  background: var(--tr-container-bg-default-2);
  color: var(--tr-text-secondary);
  font-size: 12px;
  line-height: 1.4;
}

.skill-alert--error {
  background: var(--tr-color-error-light);
  color: var(--tr-color-error);
}

.skill-empty {
  min-height: 180px;
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 6px;
  text-align: center;
  color: var(--tr-text-secondary);
  border: 1px dashed var(--tr-border-color-disabled);
  border-radius: 8px;
  padding: 24px;
}

.skill-empty strong {
  color: var(--tr-text-primary);
}

.skill-list {
  min-height: 0;
  overflow: auto;
  display: grid;
  gap: 10px;
  padding-right: 2px;
}

.skill-item {
  display: grid;
  gap: 10px;
  border: 1px solid var(--tr-border-color-disabled);
  border-radius: 8px;
  padding: 12px;
  background: var(--tr-container-bg-default);
}

.skill-item__main {
  min-width: 0;
  display: flex;
  gap: 10px;
  align-items: flex-start;
  cursor: pointer;
}

.skill-item__main input {
  margin-top: 3px;
}

.skill-item__text {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.skill-item__text strong {
  overflow-wrap: anywhere;
}

.skill-item__text small {
  color: var(--tr-text-secondary);
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.skill-item__meta {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
  color: var(--tr-text-secondary);
  font-size: 12px;
}

.text-button {
  border: 0;
  background: transparent;
  color: var(--tr-color-error, #f23030);
  cursor: pointer;
  padding: 4px 0;
}

@media (max-width: 560px) {
  .skill-panel {
    width: 100vw;
  }
}
</style>
