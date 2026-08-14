<script setup lang="ts">
import type {
  CardGridActionEvent,
  CardGridItem,
  CardGridNameClickEvent,
  ExtensionCardActionEvent,
} from '@opentiny/tiny-robot'
import { ExtensionManager } from '@opentiny/tiny-robot'
import { IconDelete, IconEditPen, IconSparkles } from '@opentiny/tiny-robot-svgs'
import { computed, markRaw, onMounted, ref } from 'vue'

type CardProps = Omit<CardGridItem, 'id'>

type NativeEventDetails = {
  type: string
  key?: string
}

type GridDemoEvent =
  | {
      kind: 'action'
      payload: CardGridActionEvent
    }
  | {
      kind: 'name-click'
      payload: {
        itemId: string
        event: NativeEventDetails
      }
    }

type SlotDemoEvent =
  | {
      kind: 'action'
      itemId: string
      action: ExtensionCardActionEvent
    }
  | {
      kind: 'name-click'
      itemId: string
      event: NativeEventDetails
    }

const sparklesIcon = markRaw(IconSparkles)
const editPenIcon = markRaw(IconEditPen)
const deleteIcon = markRaw(IconDelete)

const defaultItems = ref<CardGridItem[]>([
  {
    id: 'code-notes',
    name: '代码笔记',
    description: '用直接的 Card props 表达名称、描述、图标和进度。',
    icon: sparklesIcon,
    progress: 74,
    nameClickable: true,
    primaryActionsLimit: 1,
    actions: [
      { id: 'pin', type: 'switch', label: '固定', checked: true },
      { id: 'edit', type: 'button', label: '编辑', icon: editPenIcon },
      { id: 'copy', type: 'custom', label: '复制', data: { source: 'default-grid' } },
    ],
  },
  {
    id: 'visual-assets',
    name: '视觉素材',
    description: '没有额外容器时，Grid 只负责排列默认 Card。',
    icon: editPenIcon,
    progress: 'indeterminate',
    nameClickable: true,
    actions: [
      { id: 'open', type: 'button', label: '打开', icon: editPenIcon },
      { id: 'copy', type: 'custom', label: '复制', data: { source: 'default-grid' } },
    ],
  },
  {
    id: 'api-notes',
    name: '接口备忘',
    description: '扁平数据可以保持稳定的字符串 id，便于定位渲染单元格。',
    nameClickable: true,
    actions: [{ id: 'clear', type: 'button', label: '清除', icon: deleteIcon, danger: true }],
  },
])

const layoutItems: CardGridItem[] = [
  {
    id: 'layout-a',
    name: '布局项目 A',
    description: 'columns 为 1 时占满整行。',
    icon: sparklesIcon,
  },
  {
    id: 'layout-b',
    name: '布局项目 B',
    description: 'columns 为 2 时与相邻单元格并排。',
    icon: editPenIcon,
  },
  {
    id: 'layout-c',
    name: '布局项目 C',
    description: '正整数列数由 Grid 直接转换为 CSS grid。',
  },
]

const customItems: CardGridItem[] = [
  {
    id: 'slot-alpha',
    name: '插槽单元格 A',
    description: '在 Card 外增加一个可见的 index 标记。',
    icon: sparklesIcon,
    nameClickable: true,
    actions: [{ id: 'inspect', type: 'button', label: '查看', icon: editPenIcon }],
  },
  {
    id: 'slot-beta',
    name: '插槽单元格 B',
    description: 'item 插槽仍然收到完整的扁平 item。',
    icon: editPenIcon,
    nameClickable: true,
    actions: [{ id: 'inspect', type: 'button', label: '查看', icon: editPenIcon }],
  },
]

const emptyItems: CardGridItem[] = []
const layoutColumns = ref(2)
const showEmptySlot = ref(false)
const latestGridEvent = ref<GridDemoEvent | null>(null)
const latestSlotEvent = ref<SlotDemoEvent | null>(null)
const identityGridHost = ref<HTMLElement | null>(null)
const inspectedIdentityIds = ref<string[]>([])

const identityItems = computed(() => defaultItems.value.slice(0, 2))
const eventItems = computed(() => defaultItems.value.slice(0, 2))

const getCardProps = ({ id: _id, ...cardProps }: CardGridItem): CardProps => cardProps

const formatJson = (value: unknown) => JSON.stringify(value, null, 2) ?? ''

const getNativeEventDetails = (event: MouseEvent | KeyboardEvent): NativeEventDetails => {
  if ('key' in event) return { type: event.type, key: event.key }
  return { type: event.type }
}

const handleGridAction = (payload: CardGridActionEvent) => {
  const item = defaultItems.value.find((candidate) => candidate.id === payload.itemId)
  const action = item?.actions?.find((candidate) => candidate.id === payload.action.id)

  if (action?.type === 'switch' && typeof payload.action.checked === 'boolean') {
    action.checked = payload.action.checked
  }

  latestGridEvent.value = { kind: 'action', payload }
}

const handleGridNameClick = (payload: CardGridNameClickEvent) => {
  latestGridEvent.value = {
    kind: 'name-click',
    payload: {
      itemId: payload.itemId,
      event: getNativeEventDetails(payload.event),
    },
  }
}

const handleCustomSlotAction = (itemId: string, action: ExtensionCardActionEvent) => {
  latestSlotEvent.value = { kind: 'action', itemId, action }
}

const handleCustomSlotNameClick = (itemId: string, event: MouseEvent | KeyboardEvent) => {
  latestSlotEvent.value = { kind: 'name-click', itemId, event: getNativeEventDetails(event) }
}

const inspectIdentityAttributes = () => {
  inspectedIdentityIds.value = [...(identityGridHost.value?.querySelectorAll<HTMLElement>('[data-card-id]') ?? [])]
    .map((element) => element.dataset.cardId)
    .filter((id): id is string => Boolean(id))
}

const latestGridEventText = computed(() =>
  formatJson(
    latestGridEvent.value ?? {
      hint: '点击 Card 名称，或使用卡片操作查看 payload。',
    },
  ),
)

const latestSlotEventText = computed(() =>
  formatJson(
    latestSlotEvent.value ?? {
      hint: '插槽里的 Card 由插槽内容自己监听事件。',
    },
  ),
)

onMounted(inspectIdentityAttributes)
</script>

<template>
  <div class="card-grid-demo">
    <section class="demo-section">
      <header class="demo-section__header">
        <div>
          <div class="demo-section__eyebrow">01 / 默认渲染</div>
          <h2>直接传入扁平 items</h2>
          <p>没有 item 插槽时，每个 item 都会被转换成一个默认的 ExtensionManager.Card。</p>
        </div>
        <code class="demo-section__api">ExtensionManager.CardGrid</code>
      </header>

      <div class="demo-contract">
        <div class="demo-contract__item">
          <strong>items</strong>
          <code>CardGridItem[]</code>
        </div>
        <p><code>id</code> 只属于 Grid：用于 key 和 <code>li[data-card-id]</code>，不会传给 Card。</p>
      </div>

      <div class="demo-grid-frame">
        <ExtensionManager.CardGrid
          data-testid="card-grid-default"
          :items="defaultItems"
          :columns="2"
          @action="handleGridAction"
          @name-click="handleGridNameClick"
        />
      </div>
    </section>

    <section class="demo-section">
      <header class="demo-section__header">
        <div>
          <div class="demo-section__eyebrow">02 / columns</div>
          <h2>一列和两列布局</h2>
          <p>columns 接收正整数；这个示例只切换 1 和 2，观察同一组 items 的布局变化。</p>
        </div>

        <label class="demo-select">
          <span>columns</span>
          <select v-model.number="layoutColumns">
            <option :value="1">1 列</option>
            <option :value="2">2 列</option>
          </select>
        </label>
      </header>

      <div class="demo-grid-frame">
        <ExtensionManager.CardGrid :items="layoutItems" :columns="layoutColumns" />
      </div>
      <div class="demo-note">
        <code>:columns="{{ layoutColumns }}"</code> 控制当前网格的列数。
      </div>
    </section>

    <section class="demo-section">
      <header class="demo-section__header">
        <div>
          <div class="demo-section__eyebrow">03 / item 插槽</div>
          <h2>自定义单元格内容</h2>
          <p>item 插槽会收到完整 item；插槽内容自己渲染 Card，并负责监听其中的事件。</p>
        </div>
        <code class="demo-section__api">#item=&quot;{ item, index }&quot;</code>
      </header>

      <div class="demo-contract">
        <div class="demo-contract__item">
          <strong>插槽内的 Card</strong>
          <code>v-bind="getCardProps(item)"</code>
        </div>
        <p>getCardProps 会先移除 <code>id</code>；身份仍由外层 Grid 的 <code>li[data-card-id]</code> 提供。</p>
      </div>

      <div class="demo-grid-frame demo-grid-frame--slot">
        <ExtensionManager.CardGrid :items="customItems" :columns="2">
          <template #item="{ item, index }">
            <div class="demo-custom-cell">
              <div class="demo-custom-cell__meta">
                <span>item 插槽</span>
                <code>index={{ index }}</code>
              </div>
              <ExtensionManager.Card
                :data-testid="`card-grid-custom-${item.id}`"
                v-bind="getCardProps(item)"
                @action="handleCustomSlotAction(item.id, $event)"
                @name-click="handleCustomSlotNameClick(item.id, $event)"
              />
              <small
                ><code>data-card-id=&quot;{{ item.id }}&quot;</code> 仍在外层 li。</small
              >
            </div>
          </template>
        </ExtensionManager.CardGrid>
      </div>

      <pre class="demo-event demo-event--compact">{{ latestSlotEventText }}</pre>
    </section>

    <section class="demo-section">
      <header class="demo-section__header">
        <div>
          <div class="demo-section__eyebrow">04 / empty</div>
          <h2>items 为空时的空状态</h2>
          <p>不提供 empty 插槽时显示 emptyText；提供插槽后，插槽内容优先。</p>
        </div>

        <label class="demo-check">
          <input v-model="showEmptySlot" type="checkbox" />
          <span>使用 empty 插槽</span>
        </label>
      </header>

      <div class="demo-grid-frame">
        <ExtensionManager.CardGrid :items="emptyItems" empty-text="emptyText：暂无卡片">
          <template v-if="showEmptySlot" #empty>
            <div class="demo-empty-slot">
              <strong>empty 插槽内容</strong>
              <span>这段内容替换了 emptyText。</span>
            </div>
          </template>
        </ExtensionManager.CardGrid>
      </div>
      <div class="demo-note"><code>items.length === 0</code> 时只渲染一个空状态单元格。</div>
    </section>

    <section class="demo-section">
      <header class="demo-section__header">
        <div>
          <div class="demo-section__eyebrow">05 / 事件 payload</div>
          <h2>检查 Grid 包装后的事件</h2>
          <p>默认 Card 的 action 和 name-click 都会补上触发它的 itemId。</p>
        </div>
        <div class="demo-event-shape">
          <code>action: { itemId, action }</code>
          <code>name-click: { itemId, event }</code>
        </div>
      </header>

      <div class="demo-event-layout">
        <div class="demo-grid-frame">
          <ExtensionManager.CardGrid
            data-testid="card-grid-events"
            :items="eventItems"
            :columns="2"
            @action="handleGridAction"
            @name-click="handleGridNameClick"
          />
        </div>

        <aside class="demo-inspector" aria-label="Grid 事件 payload">
          <div class="demo-inspector__title">
            <strong>最近一次 payload</strong>
            <span>JSON</span>
          </div>
          <pre class="demo-event">{{ latestGridEventText }}</pre>
        </aside>
      </div>
    </section>

    <section class="demo-section">
      <header class="demo-section__header">
        <div>
          <div class="demo-section__eyebrow">06 / data-card-id</div>
          <h2>从 DOM 检查稳定身份</h2>
          <p>下面读取实际渲染出来的 li[data-card-id]，确认字符串 id 没有进入 Card props。</p>
        </div>
        <button class="demo-button" type="button" @click="inspectIdentityAttributes">重新读取 DOM</button>
      </header>

      <div ref="identityGridHost" class="demo-grid-frame">
        <ExtensionManager.CardGrid :items="identityItems" :columns="2" />
      </div>

      <div class="demo-identity-inspection">
        <div class="demo-inspector__title">
          <strong>实际读取到的属性</strong>
          <span>{{ inspectedIdentityIds.length }} 个</span>
        </div>
        <div class="demo-identity-inspection__values">
          <code v-for="id in inspectedIdentityIds" :key="id">data-card-id=&quot;{{ id }}&quot;</code>
        </div>
        <p><code>id</code> 是 Grid 的稳定字符串身份字段；Card 只接收名称、描述、图标和其他直接 props。</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.card-grid-demo {
  display: grid;
  gap: 18px;
}

.demo-section {
  min-width: 0;
  padding: 22px;
  border: 1px solid #d8e6f8;
  border-radius: 18px;
  background: #fff;
}

.demo-section__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 16px;
}

.demo-section__eyebrow {
  margin-bottom: 7px;
  color: #607ce9;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.demo-section h2 {
  margin: 0;
  color: #253a60;
  font-size: 22px;
  letter-spacing: -0.04em;
}

.demo-section__header p {
  max-width: 600px;
  margin: 8px 0 0;
  color: #7185a5;
  font-size: 12px;
  line-height: 1.6;
}

.demo-section__api,
.demo-event-shape code {
  display: inline-flex;
  flex: 0 0 auto;
  padding: 7px 9px;
  border-radius: 8px;
  background: #f0f4ff;
  color: #526fe4;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
  font-size: 10px;
  white-space: nowrap;
}

.demo-contract {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
  padding: 11px 13px;
  border: 1px solid #e0eafa;
  border-radius: 10px;
  background: #f7faff;
}

.demo-contract__item {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
  color: #2e4774;
  font-size: 11px;
}

.demo-contract p,
.demo-note,
.demo-identity-inspection p {
  margin: 0;
  color: #7185a5;
  font-size: 11px;
  line-height: 1.5;
}

.demo-contract code,
.demo-note code,
.demo-identity-inspection code,
.demo-custom-cell code {
  color: #526fe4;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
  font-size: 10px;
}

.demo-grid-frame {
  min-width: 0;
  padding: 2px 12px 8px;
  border: 1px solid #edf1f7;
  border-radius: 12px;
  background: #fcfdff;
}

.demo-grid-frame--slot {
  padding-top: 12px;
}

.demo-note {
  margin-top: 10px;
}

.demo-select,
.demo-check {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
  color: #526b91;
  font-size: 11px;
}

.demo-select select {
  height: 30px;
  padding: 0 8px;
  border: 1px solid #d5e1f2;
  border-radius: 7px;
  background: #fff;
  color: #526fe4;
  font-size: 11px;
}

.demo-check input {
  accent-color: #526fe4;
}

.demo-custom-cell {
  display: grid;
  gap: 8px;
}

.demo-custom-cell__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: #607ce9;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.demo-custom-cell small {
  color: #8aa0c2;
  font-size: 10px;
  line-height: 1.4;
}

.demo-event {
  box-sizing: border-box;
  min-height: 120px;
  margin: 0;
  padding: 12px;
  overflow: auto;
  border: 1px solid #e0eafa;
  border-radius: 10px;
  background: #f7faff;
  color: #526b91;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
  font-size: 10px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.demo-event--compact {
  min-height: 64px;
  margin-top: 12px;
}

.demo-event-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(220px, 0.75fr);
  gap: 14px;
}

.demo-inspector,
.demo-identity-inspection {
  min-width: 0;
  padding: 13px;
  border: 1px solid #e0eafa;
  border-radius: 12px;
  background: #f7faff;
}

.demo-inspector__title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 9px;
  color: #2e4774;
  font-size: 11px;
}

.demo-inspector__title span {
  color: #8aa0c2;
  font-size: 10px;
  font-weight: 500;
}

.demo-event-shape {
  display: grid;
  flex: 0 0 auto;
  gap: 6px;
}

.demo-empty-slot {
  display: grid;
  justify-items: center;
  gap: 5px;
  padding: 20px 0;
  color: #526b91;
  font-size: 12px;
  text-align: center;
}

.demo-empty-slot span {
  color: #8aa0c2;
  font-size: 11px;
}

.demo-button {
  flex: 0 0 auto;
  height: 30px;
  padding: 0 11px;
  border: 1px solid #d5e1f2;
  border-radius: 7px;
  background: #fff;
  color: #526fe4;
  cursor: pointer;
  font-size: 11px;
}

.demo-button:hover {
  border-color: #9eb0ed;
  background: #f5f7ff;
}

.demo-identity-inspection {
  margin-top: 12px;
}

.demo-identity-inspection__values {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-bottom: 9px;
}

.demo-identity-inspection__values code {
  padding: 5px 7px;
  border-radius: 6px;
  background: #fff;
}

@media (max-width: 760px) {
  .demo-section {
    padding: 18px;
  }

  .demo-section__header,
  .demo-contract {
    align-items: flex-start;
    flex-direction: column;
  }

  .demo-section__header {
    gap: 12px;
  }

  .demo-event-layout {
    grid-template-columns: 1fr;
  }
}
</style>
