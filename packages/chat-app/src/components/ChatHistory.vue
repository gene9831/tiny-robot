<script setup lang="ts">
import { TrHistory } from '@opentiny/tiny-robot'
import { ref, watch } from 'vue'
import { useChatConversation } from '../composables/useChatConversation'

const {
  conversations,
  activeConversationId,
  switchConversation,
  createConversation,
  deleteConversation,
  updateConversationTitle,
} = useChatConversation()

const historyData = ref<Array<{ id: string; title: string }>>([])

watch(
  conversations,
  (list) => {
    historyData.value = list.map((item) => ({
      id: item.id,
      title: item.title || '新会话',
    }))
  },
  { deep: true, immediate: true },
)

const handleItemClick = (item: { id?: string }) => {
  if (item.id) {
    switchConversation(item.id)
  }
}

const handleCreate = () => {
  createConversation({
    title: '新客服咨询',
  })
}

const handleItemTitleChange = (title: string, item: { id?: string }) => {
  if (item.id) {
    const historyItem = historyData.value.find((history) => history.id === item.id)

    if (historyItem) {
      historyItem.title = title
    }

    updateConversationTitle(item.id, title)
  }
}

const handleItemAction = (action: { id: string }, item: { id?: string }) => {
  if (action.id === 'delete' && item.id) {
    deleteConversation(item.id)
  }
}
</script>

<template>
  <section class="chat-history">
    <div class="history-header">
      <h2>历史会话</h2>
      <button type="button" @click="handleCreate">新会话</button>
    </div>

    <TrHistory
      :data="historyData"
      :selected="activeConversationId ?? undefined"
      class="history-list"
      @item-click="handleItemClick"
      @item-title-change="handleItemTitleChange"
      @item-action="handleItemAction"
    />
  </section>
</template>

<style scoped>
.chat-history {
  display: flex;
  height: 100%;
  min-height: 0;
  flex-direction: column;
  padding: 16px;

  background: var(--tr-page-bg-default);
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.history-header h2 {
  margin: 0;
  font-size: 16px;
}

.history-header button {
  border: 0;
  border-radius: var(--tr-radius-md);
  padding: 6px 10px;
  background: var(--tr-color-primary);
  color: #fff;
  cursor: pointer;
  font-size: var(--tr-font-size-xs);
}

.history-list {
  flex: 1;
  min-height: 0;
  overflow: auto;
}
</style>
