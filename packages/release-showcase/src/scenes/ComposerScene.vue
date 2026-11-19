<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import { TrSender, type TemplateItem } from '@opentiny/tiny-robot'
import ModelScene from './ModelScene.vue'

const input = ref('')
const submitted = ref('')
const showPrefix = ref(true)
const template = shallowRef<TemplateItem[]>([])
const extensions = [TrSender.template(template, { appendTo: '.composer-panel' })]
function insertTemplate() {
  template.value = [
    { type: 'text', content: '请把' },
    {
      type: 'select',
      content: '本周进展',
      value: '本周进展',
      placeholder: '选择内容来源',
      options: [
        { label: '本周进展', value: '本周进展' },
        { label: '会议记录', value: '会议记录' },
        { label: '项目计划', value: '项目计划' },
      ],
    },
    { type: 'text', content: '整理为一份结构清晰的文档。' },
  ]
}
function submit(text: string) {
  submitted.value = text
  input.value = ''
}
</script>

<template>
  <section class="feature-scene composer-scene">
    <div class="scene-heading">
      <span class="eyebrow">MODELS & COMPOSER</span>
      <h1>选择合适的模型，组织清晰的输入</h1>
      <p>分组搜索、思考强度与输入模板，在同一处完成。</p>
    </div>
    <div class="composer-panel">
      <div class="composer-toolbar"><ModelScene /><span class="quiet-text">为当前任务选择模型</span></div>
      <h2>今天想一起完成什么？</h2>
      <div class="composer-tools">
        <button class="utility-button" @click="insertTemplate">插入任务模板</button
        ><button class="utility-button" @click="showPrefix = !showPrefix">
          {{ showPrefix ? '隐藏首行提示' : '显示首行提示' }}
        </button>
      </div>
      <TrSender
        v-model="input"
        mode="multiple"
        submit-type="ctrlEnter"
        :extensions="extensions"
        placeholder="输入任务背景与期望结果…"
        @submit="submit"
        ><template v-if="showPrefix" #input-prefix><span class="input-prefix">需求</span></template></TrSender
      >
      <div class="composer-meta"><span>Ctrl / ⌘ + Enter 发送</span><span>支持多行输入</span></div>
      <p class="submitted-message" role="status">
        {{ submitted ? `已提交：${submitted}` : '准备好后，发送你的任务。' }}
      </p>
    </div>
  </section>
</template>
