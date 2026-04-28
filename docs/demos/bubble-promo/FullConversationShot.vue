<template>
  <section class="promo-shot">
    <header class="shot-header">
      <div>
        <p class="eyebrow">TinyRobot Bubble</p>
        <h2>企业 AI 助手对话流</h2>
      </div>
      <span class="status">Streaming</span>
    </header>

    <tr-bubble-provider :content-renderer-matches="contentRendererMatches">
      <tr-bubble-list class="chat-list" :messages="messages" :role-configs="roleConfigs" auto-scroll>
        <template #content-footer="{ messages: groupMessages }">
          <div v-if="groupMessages.at(-1)?.role === 'assistant'" class="message-actions">
            <button>复制</button>
            <button>点赞</button>
            <button>重新生成</button>
          </div>
        </template>
      </tr-bubble-list>
    </tr-bubble-provider>

    <footer class="sender-preview">
      <span class="sender-plus">+</span>
      <span class="sender-text">继续追问：帮我生成一份实施计划...</span>
      <button>发送</button>
    </footer>
  </section>
</template>

<script setup lang="ts">
import type {
  BubbleContentRendererMatch,
  BubbleContentRendererProps,
  BubbleListProps,
  BubbleRoleConfig,
} from '@opentiny/tiny-robot'
import { BubbleRendererMatchPriority, TrBubbleList, TrBubbleProvider } from '@opentiny/tiny-robot'
import { IconAi, IconUser } from '@opentiny/tiny-robot-svgs'
import { defineComponent, h, markRaw } from 'vue'

const aiAvatar = h(IconAi, { style: { fontSize: '30px' } })
const userAvatar = h(IconUser, { style: { fontSize: '30px' } })

const messages: BubbleListProps['messages'] = [
  {
    role: 'user',
    content: '我们准备把知识库助手接入内部工单系统，消息展示层需要支持哪些能力？',
  },
  {
    role: 'assistant',
    content:
      '建议优先覆盖四类能力：流式回复、结构化卡片、引用来源和工具调用状态。Bubble 可以把这些内容统一放进消息模型里展示。',
  },
  {
    role: 'assistant',
    content: [
      { type: 'text', text: '例如可以把工单摘要渲染成业务卡片：' },
      {
        type: 'schema_card',
        title: '工单摘要',
        description: '账号权限申请，优先级 P1，等待主管审批。',
      },
    ],
  },
  {
    role: 'user',
    content: '如果模型正在调用工具，用户能看到执行过程吗？',
  },
  {
    role: 'assistant',
    content: '可以。Bubble 内置工具调用渲染器，也可以通过 BubbleProvider 替换为你的业务卡片。',
    tool_calls: [
      {
        id: 'call_search_ticket',
        type: 'function',
        function: {
          name: 'search_ticket',
          arguments: '{"keyword":"账号权限","priority":"P1"}',
        },
      },
    ],
    state: {
      toolCall: {
        call_search_ticket: { status: 'running', open: true },
      },
    },
  },
]

const roleConfigs: Record<string, BubbleRoleConfig> = {
  assistant: {
    placement: 'start',
    avatar: aiAvatar,
    shape: 'corner',
  },
  user: {
    placement: 'end',
    avatar: userAvatar,
    shape: 'corner',
  },
}

const SchemaCardRenderer = defineComponent({
  name: 'SchemaCardRenderer',
  props: {
    message: {
      type: Object,
      required: true,
    },
    contentIndex: {
      type: Number,
      required: true,
    },
  },
  setup(props: BubbleContentRendererProps) {
    return () => {
      const content = Array.isArray(props.message.content) ? props.message.content[props.contentIndex] : null
      const title = typeof content?.title === 'string' ? content.title : '业务卡片'
      const description = typeof content?.description === 'string' ? content.description : ''

      return h('article', { class: 'schema-card' }, [
        h('span', { class: 'schema-card__tag' }, 'Workflow'),
        h('h3', {}, title),
        h('p', {}, description),
      ])
    }
  },
})

const contentRendererMatches: BubbleContentRendererMatch[] = [
  {
    find: (_, content) => content.type === 'schema_card',
    renderer: markRaw(SchemaCardRenderer),
    priority: BubbleRendererMatchPriority.CONTENT,
  },
]
</script>

<style scoped>
.promo-shot {
  box-sizing: border-box;
  width: 960px;
  height: 640px;
  padding: 28px;
  background:
    linear-gradient(180deg, rgba(245, 249, 255, 0.96), rgba(255, 255, 255, 0.98)),
    radial-gradient(circle at 16% 20%, rgba(17, 118, 255, 0.14), transparent 30%);
  color: #172033;
  font-family:
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
}

.shot-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.eyebrow {
  margin: 0 0 4px;
  color: #2563eb;
  font-size: 13px;
  font-weight: 700;
}

h2 {
  margin: 0;
  font-size: 26px;
  font-weight: 750;
  line-height: 1.2;
}

.status {
  padding: 7px 12px;
  border: 1px solid #bfdbfe;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 13px;
  font-weight: 700;
}

.chat-list {
  height: 484px;
  border: 1px solid #dde7f7;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.84);
  box-shadow: 0 18px 50px rgba(24, 55, 99, 0.12);
}

.chat-list :deep([data-role='user']) {
  --tr-bubble-box-bg: #e8f1ff;
}

.chat-list :deep([data-role='assistant']) {
  --tr-bubble-box-bg: #ffffff;
  --tr-bubble-box-border: 1px solid #e5edf8;
}

.chat-list :deep(.schema-card) {
  width: 330px;
  box-sizing: border-box;
  padding: 14px;
  border: 1px solid #d7e3f4;
  border-radius: 8px;
  background: #f8fbff;
}

.chat-list :deep(.schema-card__tag) {
  display: inline-flex;
  margin-bottom: 8px;
  padding: 4px 7px;
  border-radius: 999px;
  background: #e0efff;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 800;
}

.chat-list :deep(.schema-card h3) {
  margin: 0 0 6px;
  color: #172033;
  font-size: 16px;
}

.chat-list :deep(.schema-card p) {
  margin: 0;
  color: #506078;
  font-size: 13px;
  line-height: 1.6;
}

.message-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.message-actions button,
.sender-preview button {
  border: 1px solid #d3def0;
  border-radius: 6px;
  background: #ffffff;
  color: #34435c;
  font-size: 12px;
  line-height: 1;
  padding: 7px 9px;
}

.sender-preview {
  display: grid;
  grid-template-columns: 32px 1fr auto;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  padding: 11px 12px;
  border: 1px solid #dbe5f3;
  border-radius: 8px;
  background: #ffffff;
}

.sender-plus {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border-radius: 50%;
  background: #f0f5ff;
  color: #1d4ed8;
  font-size: 20px;
  font-weight: 600;
}

.sender-text {
  color: #738198;
  font-size: 14px;
}
</style>
