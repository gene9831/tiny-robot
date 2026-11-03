<script setup lang="ts">
import { computed } from 'vue'
import { BubbleRenderers } from '@opentiny/tiny-robot'
import { TrChatUI, type ChatUIOptions } from '@opentiny/tiny-robot-chat'
import { useTrChatUIAdapter } from '../composables/useTrChatUIAdapter'

const {
  workspace,
  data,
  inputValue,
  hostEventsEnabled,
  eventCounts,
  lastEvent,
  pendingAction,
  handleSwitchConversation,
  handleSubmit,
  handleCancel,
  handleRenameConversation,
  handleHistoryAction,
  confirmPendingAction,
  dismissPendingAction,
  resetIntegration,
} = useTrChatUIAdapter()

const ui: ChatUIOptions = {
  layout: {
    leftAside: { width: 260, defaultOpen: true },
    rightAside: false,
    contentMaxWidth: 900,
  },
  brand: { name: '业务助手' },
  history: { showRenameControls: true },
  welcome: false,
  prompts: false,
  model: false,
  mcp: false,
  extensions: false,
  sender: { toolbar: [] },
  bubble: { bubbleProvider: { errorRenderer: BubbleRenderers.Error } },
}

const activeConversationNo = computed(() => data.value.conversation?.activeId ?? null)
</script>

<template>
  <main class="integration-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">CHAT-02 · TrChatUI 1.0.0-rc.5</p>
        <h1>接入既有业务数据层</h1>
        <p>业务仓库继续拥有会话、消息、请求和确认操作；TrChatUI 只消费受控数据并发出事件。</p>
      </div>
      <button type="button" class="secondary-button" @click="resetIntegration">恢复测试数据</button>
    </header>

    <section class="integration-shell">
      <aside class="control-panel" aria-label="接入测试控制">
        <h2>宿主状态</h2>
        <label class="toggle-row">
          <input v-model="hostEventsEnabled" type="checkbox" />
          宿主处理事件
        </label>

        <label class="field-row">
          <span>下一次业务结果</span>
          <select v-model="workspace.replyMode.value" :disabled="workspace.requestState.value === 'processing'">
            <option value="success">成功</option>
            <option value="failure">失败</option>
          </select>
        </label>

        <dl class="status-list">
          <div>
            <dt>当前会话</dt>
            <dd>{{ activeConversationNo ?? '未选择' }}</dd>
          </div>
          <div>
            <dt>请求状态</dt>
            <dd>{{ workspace.requestState.value }}</dd>
          </div>
          <div>
            <dt>业务快照</dt>
            <dd :class="workspace.snapshotProtected.value ? 'status-ok' : 'status-error'">
              {{ workspace.snapshotProtected.value ? '只读' : '已被修改' }}
            </dd>
          </div>
        </dl>

        <h2>事件次数</h2>
        <p v-if="Object.keys(eventCounts).length === 0" class="muted">尚无事件</p>
        <ul v-else class="event-counts">
          <li v-for="(count, name) in eventCounts" :key="name">
            <span>{{ name }}</span>
            <strong>{{ count }}</strong>
          </li>
        </ul>

        <h2>最近事件</h2>
        <pre class="event-payload">{{ lastEvent ? JSON.stringify(lastEvent, null, 2) : '尚无事件' }}</pre>
      </aside>

      <section class="chat-card" aria-label="TrChatUI 业务接入结果">
        <TrChatUI
          v-model:input-value="inputValue"
          :data="data"
          :ui="ui"
          @submit="handleSubmit"
          @cancel="handleCancel"
          @switch-conversation="handleSwitchConversation"
          @rename-conversation="handleRenameConversation"
          @history-action="handleHistoryAction"
        >
          <template #layout-left-aside-actions>
            <span class="existing-business-badge">既有会话</span>
          </template>
          <template #layout-left-aside-rail="{ openLeftAside }">
            <button type="button" class="rail-open-button" aria-label="展开会话列表" @click="openLeftAside">
              会话
            </button>
          </template>
          <template #layout-header="{ title, isMobileViewport, isLeftAsideOpen, openLeftAside }">
            <header class="business-chat-header">
              <button
                v-if="isMobileViewport && !isLeftAsideOpen"
                type="button"
                class="header-conversation-button"
                aria-label="打开会话列表"
                @click="openLeftAside"
              >
                会话列表
              </button>
              <h3>{{ title }}</h3>
            </header>
          </template>
        </TrChatUI>
      </section>
    </section>

    <div v-if="pendingAction" class="dialog-backdrop" role="presentation">
      <section class="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <h2 id="confirm-title">宿主业务确认</h2>
        <p v-if="pendingAction.type === 'rename'">确认将会话名称改为“{{ pendingAction.title }}”？</p>
        <p v-else>确认删除会话“{{ pendingAction.title }}”及其全部消息吗？</p>
        <div class="dialog-actions">
          <button type="button" class="secondary-button" @click="dismissPendingAction">取消</button>
          <button type="button" class="primary-button" @click="confirmPendingAction">确认</button>
        </div>
      </section>
    </div>
  </main>
</template>
