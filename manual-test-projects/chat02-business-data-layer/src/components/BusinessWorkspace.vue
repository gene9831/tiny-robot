<script setup lang="ts">
import { shallowRef } from 'vue'
import type { BusinessConversation } from '../business/types'
import { useBusinessWorkspace } from '../composables/useBusinessWorkspace'

const {
  conversations,
  activeConversation,
  activeMessages,
  requestState,
  snapshotProtected,
  draft,
  replyMode,
  selectConversation,
  renameConversation,
  deleteConversation,
  submitMessage,
  cancelRequest,
  reset,
} = useBusinessWorkspace()

const editingConversationNo = shallowRef<string | null>(null)
const renameDraft = shallowRef('')
const pendingDelete = shallowRef<BusinessConversation | null>(null)

function startRename(conversation: BusinessConversation) {
  editingConversationNo.value = conversation.conversationNo
  renameDraft.value = conversation.subject
}

function confirmRename() {
  if (!editingConversationNo.value) return
  renameConversation(editingConversationNo.value, renameDraft.value)
  editingConversationNo.value = null
  renameDraft.value = ''
}

function cancelRename() {
  editingConversationNo.value = null
  renameDraft.value = ''
}

function confirmDelete() {
  if (!pendingDelete.value) return
  deleteConversation(pendingDelete.value.conversationNo)
  pendingDelete.value = null
}

function resetWorkspace() {
  reset()
  cancelRename()
  pendingDelete.value = null
}
</script>

<template>
  <main class="business-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">既有业务系统</p>
        <h1>客户服务工作台</h1>
        <p>订单和退款会话由业务数据层统一管理。</p>
      </div>
      <div class="header-actions">
        <span class="snapshot-status" :class="{ protected: snapshotProtected }">
          数据快照：{{ snapshotProtected ? '只读' : '可变' }}
        </span>
        <button type="button" class="secondary-button" @click="resetWorkspace">恢复测试数据</button>
      </div>
    </header>

    <section class="workspace-shell">
      <aside class="conversation-panel" aria-label="业务会话">
        <div class="panel-heading">
          <h2>业务会话</h2>
          <span>{{ conversations.length }}</span>
        </div>

        <p v-if="conversations.length === 0" class="empty-copy">暂无会话</p>
        <ul v-else class="conversation-list">
          <li
            v-for="conversation in conversations"
            :key="conversation.conversationNo"
            :class="{ active: conversation.conversationNo === activeConversation?.conversationNo }"
          >
            <form
              v-if="editingConversationNo === conversation.conversationNo"
              class="rename-form"
              @submit.prevent="confirmRename"
            >
              <input v-model="renameDraft" aria-label="会话名称" maxlength="40" />
              <button type="submit">保存</button>
              <button type="button" @click="cancelRename">取消</button>
            </form>
            <template v-else>
              <button
                type="button"
                class="conversation-select"
                @click="selectConversation(conversation.conversationNo)"
              >
                <strong>{{ conversation.subject }}</strong>
                <span>{{ conversation.conversationNo }}</span>
              </button>
              <div class="conversation-actions">
                <button type="button" @click="startRename(conversation)">重命名</button>
                <button type="button" class="danger-link" @click="pendingDelete = conversation">删除</button>
              </div>
            </template>
          </li>
        </ul>
      </aside>

      <section class="case-panel" aria-label="会话处理区">
        <template v-if="activeConversation">
          <header class="case-header">
            <div>
              <span>当前会话</span>
              <h2>{{ activeConversation.subject }}</h2>
            </div>
            <span class="request-state" :data-state="requestState">{{ requestState }}</span>
          </header>

          <ol class="message-list" aria-label="业务消息记录">
            <li v-for="message in activeMessages" :key="message.messageNo" :class="['message-row', message.sender]">
              <article :class="['message-card', { failed: message.status === 'failed' }]">
                <div class="message-meta">
                  <strong>{{ message.sender === 'customer' ? '客户' : '业务系统' }}</strong>
                  <span>{{ message.status }}</span>
                </div>
                <p v-if="message.errorMessage" role="alert">{{ message.errorMessage }}</p>
                <p v-else>{{ message.text }}</p>
              </article>
            </li>
          </ol>

          <form class="reply-box" @submit.prevent="submitMessage">
            <label>
              <span>下一次业务处理结果</span>
              <select v-model="replyMode" :disabled="requestState === 'processing'">
                <option value="success">成功</option>
                <option value="failure">失败</option>
              </select>
            </label>
            <textarea
              v-model="draft"
              aria-label="业务回复内容"
              placeholder="输入客户问题或业务备注"
              maxlength="1000"
              rows="3"
              :disabled="requestState === 'processing'"
            />
            <div class="reply-actions">
              <span>{{ draft.length }} / 1000</span>
              <button v-if="requestState === 'processing'" type="button" class="danger-button" @click="cancelRequest">
                取消请求
              </button>
              <button v-else type="submit" class="primary-button" :disabled="!draft.trim()">提交业务请求</button>
            </div>
          </form>
        </template>

        <div v-else class="empty-workspace">
          <h2>暂无可处理会话</h2>
          <p>恢复测试数据后可继续操作。</p>
        </div>
      </section>
    </section>

    <div v-if="pendingDelete" class="dialog-backdrop" role="presentation">
      <section class="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-title">
        <h2 id="delete-title">删除业务会话</h2>
        <p>确认删除“{{ pendingDelete.subject }}”及其全部消息吗？</p>
        <div class="dialog-actions">
          <button type="button" class="secondary-button" @click="pendingDelete = null">取消</button>
          <button type="button" class="danger-button" @click="confirmDelete">确认删除</button>
        </div>
      </section>
    </div>
  </main>
</template>
