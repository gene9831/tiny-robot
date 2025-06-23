<script setup lang="ts">
import { ref, computed } from 'vue'
import UnifiedEditor from '../components/UnifiedEditor.vue'
import type { ContentBlock } from '../types'
import { createTextBlock, createEditableBlock, parseTemplate, blocksToText } from '../utils/contentHelpers'
import { migrateFromTemplate } from '../migration/templateMigration'

// 基础示例数据
const content = ref<ContentBlock[]>([
  createTextBlock('你好'),
  createEditableBlock('张三', '请输入姓名'),
  createTextBlock('，欢迎使用'),
  createEditableBlock('TinyRobot', '请输入产品'),
  createTextBlock('！'),
])

// 从模板迁移的示例
const templateExample = ref<ContentBlock[]>(
  migrateFromTemplate({
    template: '[发件人]向[收件人]发送关于[主题]的邮件。',
    initialValues: {
      发件人: '北京某某科技有限公司产品研发部技术总监',
      收件人: '上海某某集团信息技术部系统架构师团队负责人',
      主题: '关于新一代人工智能客服系统设计方案的深度讨论与合作意向洽谈',
    },
  }),
)

// 当前选中的示例
const currentExample = ref<'basic' | 'template'>('basic')

// 计算当前内容
const currentContent = computed({
  get() {
    switch (currentExample.value) {
      case 'basic':
        return content.value
      case 'template':
        return templateExample.value
      default:
        return content.value
    }
  },
  set(newValue: ContentBlock[]) {
    switch (currentExample.value) {
      case 'basic':
        content.value = newValue
        break
      case 'template':
        templateExample.value = newValue
        break
    }
  },
})

// 只读模式
const readonly = ref(false)

// 编辑器引用
const editorRef = ref()

// 处理内容更新
const handleUpdate = (newContent: ContentBlock[]) => {
  console.log('内容更新:', newContent)
  currentContent.value = newContent
}

// 处理提交
const handleSubmit = (value: string) => {
  console.log('提交内容:', value)
  alert(`提交内容: ${value}`)
}

// 获取纯文本内容
const getTextContent = () => {
  return blocksToText(currentContent.value)
}

// 聚焦编辑器
const focusEditor = () => {
  editorRef.value?.focus()
}

// 添加新的可编辑块
const addEditableBlock = () => {
  currentContent.value.push(createEditableBlock('', '新字段'))
}

// 清空内容
const clearContent = () => {
  currentContent.value = []
}

// 从模板解析
const templateInput = ref('[姓名]，您好！欢迎使用[产品名称]。')
const parseFromTemplate = () => {
  const parsed = parseTemplate(templateInput.value)
  currentContent.value = parsed
  currentExample.value = 'basic'
}
</script>

<template>
  <div class="demo-app">
    <h1>统一内容编辑器演示</h1>

    <!-- 示例选择 -->
    <div class="example-selector">
      <h3>选择示例：</h3>
      <label>
        <input type="radio" v-model="currentExample" value="basic" />
        基础示例
      </label>
      <label>
        <input type="radio" v-model="currentExample" value="template" />
        模板迁移示例
      </label>
    </div>

    <!-- 控制面板 -->
    <div class="controls">
      <label>
        <input type="checkbox" v-model="readonly" />
        只读模式
      </label>
      <button @click="focusEditor">聚焦编辑器</button>
      <button @click="addEditableBlock">添加可编辑块</button>
      <button @click="clearContent">清空内容</button>
    </div>

    <!-- 模板解析工具 -->
    <div class="template-parser">
      <h3>从模板解析：</h3>
      <input
        v-model="templateInput"
        placeholder="输入模板，如：[姓名]，您好！"
        style="width: 300px; margin-right: 10px"
      />
      <button @click="parseFromTemplate">解析模板</button>
    </div>

    <!-- 编辑器 -->
    <div class="editor-container">
      <h3>编辑器：</h3>
      <UnifiedEditor
        ref="editorRef"
        v-model="currentContent"
        :readonly="readonly"
        placeholder="开始输入内容..."
        editor-class="demo-editor"
        @update:modelValue="handleUpdate"
        @submit="handleSubmit"
      />
    </div>

    <!-- 输出显示 -->
    <div class="output">
      <h3>纯文本输出：</h3>
      <div class="text-output">{{ getTextContent() }}</div>
    </div>

    <!-- 数据结构显示 -->
    <div class="data-structure">
      <h3>数据结构：</h3>
      <pre>{{ JSON.stringify(currentContent, null, 2) }}</pre>
    </div>

    <!-- 使用说明 -->
    <div class="instructions">
      <h3>使用说明：</h3>
      <ul>
        <li><strong>Tab 键</strong>：切换到下一个可编辑区域</li>
        <li><strong>Shift + Tab</strong>：切换到上一个可编辑区域</li>
        <li><strong>方向键</strong>：在编辑区域之间导航</li>
        <li><strong>Ctrl/Cmd + Enter</strong>：提交内容</li>
        <li><strong>Enter</strong>：跳转到下一个可编辑区域</li>
        <li><strong>Escape</strong>：失活编辑器</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.demo-app {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #333;
  background: #fff;
}

.example-selector {
  margin: 20px 0;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #f9f9f9;
}

.example-selector label {
  display: inline-block;
  margin-right: 20px;
  cursor: pointer;
}

.controls {
  margin: 20px 0;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #f9f9f9;
}

.controls label,
.controls button {
  margin-right: 15px;
}

.template-parser {
  margin: 20px 0;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #f9f9f9;
}

.editor-container {
  margin: 20px 0;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #f9f9f9;
}

.demo-editor {
  width: 100%;
  min-height: 100px;
  margin-top: 10px;
  background: white;
}

.output {
  margin: 20px 0;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #f9f9f9;
}

.text-output {
  margin-top: 10px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  min-height: 40px;
}

.data-structure {
  margin: 20px 0;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #f9f9f9;
}

.data-structure pre {
  margin-top: 10px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  overflow: auto;
  max-height: 300px;
}

.instructions {
  margin: 20px 0;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #f9f9f9;
}

.instructions ul {
  padding-left: 20px;
}

.instructions li {
  margin-bottom: 8px;
}
</style>
