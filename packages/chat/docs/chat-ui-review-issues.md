# ChatUI 设计 Review Issues

## Review 范围

- 组件：`packages/chat/src/ChatUI.vue`
- 相关实现：`packages/chat/src/ui/`、`packages/chat/src/types/ui/`、`packages/chat/docs/chat-ui-design.md`
- 定位：纯 UI 组件，负责布局、展示和交互事件派发，不负责 Runtime、网络请求或业务状态管理。

## 当前设计中值得保留的部分

- `ChatUI`、`Chat` 和 Runtime 的职责边界基本清晰，纯 UI 组件没有直接依赖运行时。
- 数据、展示选项和事件入口集中，且 resolver 尽量避免直接修改调用方传入的数据。
- 滚动容器的归属有明确设计，桌面端和移动端布局也已经统一收口。

## 优先级说明

- **P1**：会导致用户无法完成核心操作、状态丢失或公共 API 失效，建议优先处理。
- **P2**：会造成明显的接入成本、行为歧义或维护风险，建议在稳定 API 前处理。

---

## 追加 Review：TrChatUI 输入 Props / 输出 Emits

### 总体判断

`data / ui` 分层适合隔离 Runtime 和纯 UI，这个方向应当保留。但当前公共 API 将输入状态、展示配置、交互 callback 和组件事件拆在不同入口中：核心输入使用嵌套 callback，部分行为使用根级 emit，Aside 又使用配置内的 `onOpenChange`。组件在最简单的空态场景下接入很轻，但进入受控状态、异步提交和深度定制后，使用成本会明显上升。

以下问题聚焦公共 Props/Emits 契约；与上文重复的行为问题在这里从 API 设计角度再次标注。

### [P1] 输入框没有标准的受控/非受控 API

- 状态：待处理
- 位置：`packages/chat/src/types/ui/options.ts:18-20`、`:109-116`、`packages/chat/src/types/ui/data.ts:21-26`、`packages/chat/src/types/ui/events.ts:22-30`

#### 问题

当前输入值位于 `data.sender.inputValue`，回写则通过 `ui.sender.onInput(value)`，根级 emits 没有 `update:*` 事件。文档也明确说明不提供 `v-model`。

#### 影响

最常见的输入框接入无法写成标准的：

```vue
<TrChatUI v-model:input-value="inputValue" />
```

调用方必须同时维护 Data 对象和 UI callback；表单、快捷键、外部工具栏和状态管理库的接入都需要额外适配。

#### 建议

- 增加 `inputValue` 和 `defaultInputValue`，提供 `update:inputValue`。
- `inputValue` 已定义时表示受控模式；否则使用 `defaultInputValue` 初始化非受控草稿。
- 明确组件生命周期内不能从受控切换到非受控，反之亦然。
- 保留 `data.sender.inputValue` 和 `ui.sender.onInput` 作为兼容入口，但标记为 deprecated，并明确新旧字段的优先级。

### [P1] `submit` emit 没有异步确认语义，却默认立即清空输入

- 状态：待处理
- 位置：`packages/chat/src/ChatUI.vue:239-245`、`packages/chat/src/types/ui/options.ts:109-116`、`packages/chat/src/ui/defaults.ts:128-134`

#### 问题

`submit` 是同步事件，组件无法等待调用方的异步请求结果；但 `clearOnSubmit` 默认开启，emit 返回后立即通过内部 ref 清空草稿。直接使用 `TrChatUI` 时，请求失败没有统一的恢复通道。

同时，用户点击清空会触发根级 `clear`，提交后的自动清空只会触发输入值 callback，不会触发根级 `clear`，事件语义不完整。

#### 建议

- 纯 UI 组件默认不因 `submit` 自动清空，由调用方在接受提交后更新输入值。
- 如果保留自动清空，应提供明确的 `clearReason`，并让组件输出 `update:inputValue('')`。
- `clear` 定义为语义事件，至少区分 `user`、`submit`、`external` 三种来源。
- `TrChat` 可以在适配层继续提供“提交即清空、失败恢复”的产品行为。

### [P1] 左右 Aside 的受控能力和输出事件不对称

- 状态：待处理
- 位置：`packages/chat/src/types/ui/options.ts:68-79`、`packages/chat/src/ChatUI.vue:124-140`、`packages/chat/src/ChatUI.vue:205-229`

#### 问题

左侧 Aside 只有 `defaultOpen`，没有 `open` 和 `onOpenChange`；右侧 Aside 支持 `open` 和 callback，但没有根级 open-change emit。除此之外，左右 `defaultOpen` 会被 watch，变化时会重新覆盖内部状态，和常见的“default 只用于初始化”语义不一致。

#### 影响

调用方无法用同一种方式管理左右面板，也无法可靠地从全局导航、路由或持久化状态控制左侧面板。

#### 建议

对两侧统一使用：

```ts
interface ChatAsideOptions {
  mode?: 'dock' | 'drawer'
  open?: boolean
  defaultOpen?: boolean
  width?: number
  collapsedWidth?: number
}
```

并通过统一的根级事件输出：

```ts
'left-aside-open-change': [payload: ChatAsideOpenChangePayload]
'right-aside-open-change': [payload: ChatAsideOpenChangePayload]
```

`onOpenChange` 可以作为兼容 callback 保留，但不应成为唯一的事件出口。

### [P2] Props callback 与根级 Emits 混用，事件心智模型不统一

- 状态：待处理
- 位置：`packages/chat/src/types/ui/events.ts:22-30`、`packages/chat/src/types/ui/options.ts:78-127`、`packages/chat/src/Chat.vue:107-160`

#### 问题

会话、提交、取消和清空使用根级 emits；Prompt、Bubble、Sender、Model、MCP 和右侧 Aside 使用 `ui.*.onXxx` callback。`TrChat` 还必须重新组合这些 callback，才能同时驱动 Runtime 和保留调用方逻辑。

#### 影响

- 消费者需要记住两套事件接入方式。
- callback 不如模板事件直观，也无法统一通过 Vue DevTools 观察。
- 新增交互时难以判断应该加 emit 还是加 `ui` 字段。
- 上层包装组件需要不断编写 callback 链式转发代码。

#### 建议

`ui` 只保留布局、样式、标签和行为配置；用户交互统一使用 emit。现有 callback 可以作为兼容层转发到新事件，但不再新增 callback 型公共 API。

### [P2] 事件 payload 形态和上下文信息不足，扩展时容易破坏兼容性

- 状态：待处理
- 位置：`packages/chat/src/types/ui/events.ts:3-20`、`packages/chat/src/types/ui/events.ts:22-30`

#### 问题

当前 API 同时存在无参数事件、对象 payload 和 positional arguments。`submit` 只有 `text` 和 `structuredData`，没有当前会话 ID、提交来源或规范化约定；Bubble 事件只提供 index，不提供稳定的 message ID。

另外，`TrChat` 会 trim 提交文本，而直接使用 `TrChatUI` 时拿到的是 Sender 的原始文本，两个入口的 payload 语义不完全一致。

#### 建议

- 所有可扩展事件统一使用对象 payload。
- Submit payload 增加 `conversationId` 和 `source`，并明确 `text` 是否已经 trim。
- Bubble payload 优先提供 `messageId`，保留 index 作为兼容字段。
- 不要在公共事件中继续增加新的 positional 参数。

### [P2] `ChatSubmitPayload` 和 Bubble payload 的类型扩展能力不足

- 状态：待处理
- 位置：`packages/chat/src/types/ui/events.ts:3-20`、`packages/chat/src/types/base.ts:63-68`

#### 问题

`structuredData` 被收敛为 `ChatStructuredDataItem[]`，字段为 `type: string` 加任意键；`Bubble` 的 `payload` 和状态 `value` 也是 `unknown`。这虽然允许扩展，但会让调用方失去模板、Mention 或自定义扩展的类型推导。

#### 建议

- 为 `ChatSubmitPayload` 增加泛型参数。
- 为 Bubble event 建立可扩展的事件映射类型；无法识别的事件再回退到 `unknown`。
- 输出数组和对象尽量使用 readonly 语义，避免消费者误以为可以修改组件内部状态。

### [P2] Data 只读约定没有完全体现在类型上

- 状态：待处理
- 位置：`packages/chat/src/types/ui/data.ts:3-66`、`packages/chat/docs/chat-ui-design.md:39-47`

#### 问题

文档约定 Data 只读，但 `ChatUIData` 的内层对象、消息对象和会话对象并未完整使用 `readonly`。目前实现没有主动修改调用方对象，但公共类型没有把所有权边界表达出来。

#### 建议

- 将 View Data 定义为深度只读的公共协议。
- 保留 readonly 数组、readonly metadata 和 readonly 状态字段。
- 将组件内部需要修改的草稿、Aside open state 留在组件内部或通过标准受控 API 管理。

### [P2] 缺少外部命令 API，扩展 UI 只能绕过 Props/Emits

- 状态：待处理
- 位置：`packages/chat/src/ChatUI.vue:28`、`packages/chat/src/ui/ChatComposer.vue:147-149`、`packages/chat/src/types/ui/slots.ts:1-17`

#### 问题

`ChatComposer` 暴露了 `setInputValue`，但 `TrChatUI` 没有继续暴露稳定的 ref API；公共 slot 也没有 slot props。外部 Header、快捷键、工具栏或自定义空态无法直接调用输入框和 Aside 操作。

#### 建议

在不扩大内部实现的前提下，提供少量稳定命令：

```ts
interface ChatUIExpose {
  focusInput(): void
  setInputValue(value: string): void
  clearInput(): void
  submit(): void
  openLeftAside(): void
  closeLeftAside(): void
  toggleLeftAside(): void
  openRightAside(): void
  closeRightAside(): void
}
```

`submit()` 应继续遵守 disabled、空内容和 loading 校验；不建议暴露内部组件实例。

### [P2] Slot 存在会隐式启用右侧 Aside，Props 和 Slot 的职责边界不清晰

- 状态：待处理
- 位置：`packages/chat/src/ChatUI.vue:39-41`、`packages/chat/src/ui/resolveOptions.ts:153-173`

#### 问题

只要存在 `layout-right-aside` slot，组件就会自动生成右侧 Aside，并默认打开。Slot 本来应主要负责提供内容，但这里同时改变了布局和状态。

#### 建议

- 由 `ui.layout.rightAside` 明确控制是否启用右栏。
- 或增加 `enabled` 字段，slot 只负责内容，不再作为隐式开关。
- 如果为了快速接入保留自动启用行为，应在类型和文档中突出说明，并提供 `rightAside: false` 的明确覆盖方式。

## 推荐的 TrChatUI 目标 API

下面是建议的下一版公共契约草案。它是目标设计，不代表当前源码已经实现。

### 1. 输入 Props

```ts
export interface ChatUIProps<TStructuredData extends ChatStructuredData = ChatStructuredData> {
  /** 只读展示事实：会话、消息、loading、disabled、Model、MCP 等。 */
  data?: Readonly<ChatUIData>

  /** 只包含布局、视觉、标签和组件行为配置，不放用户交互 callback。 */
  ui?: ChatUIOptions

  /** 已定义时为受控输入值，空字符串表示明确清空。 */
  inputValue?: string

  /** 非受控模式的初始输入值，只在初始化时读取。 */
  defaultInputValue?: string
}
```

建议将 `data.sender.inputValue` 逐步降级为兼容字段，新的输入协议只保留 `inputValue/defaultInputValue`。`data.sender` 只表达事实状态：

```ts
export interface ChatSenderView {
  readonly loading?: boolean
  readonly disabled?: boolean
  readonly submitDisabled?: boolean
}
```

受控规则必须固定：

| 场景                     | 行为                                     |
| ------------------------ | ---------------------------------------- |
| `inputValue` 有值        | 受控，组件只发更新事件，不自行持有最终值 |
| 只有 `defaultInputValue` | 非受控，组件内部持有草稿                 |
| 两者都没有               | 非受控，初始值为空字符串                 |
| 生命周期内切换模式       | 不支持，开发环境给出警告                 |

### 2. 纯 UI Options

```ts
export interface ChatHeaderOptions {
  showNewConversation?: boolean
}

export interface ChatUIOptions {
  layout?: ChatLayoutOptions
  brand?: ChatBrandOptions
  labels?: Partial<ChatLabels>
  header?: false | ChatHeaderOptions
  history?: false | ChatHistoryOptions
  welcome?: false | ChatWelcomeOptions
  prompts?: false | ChatPromptsOptions
  bubble?: ChatBubbleOptions
  sender?: false | ChatSenderOptions
  model?: false | ChatModelOptions
  mcp?: false | ChatMcpOptions
}
```

目标是移除或废弃以下 callback 字段：

```ts
onInput
onFocus
onBlur
onItemClick
onStateChange
onBubbleEvent
onSelect
onFeatureChange
onAddServer
onRemoveServer
onServerEnabledChange
onToolEnabledChange
onOpenChange
```

这些行为改由 Emits 统一输出。`clearOnSubmit` 可以保留为兼容配置，但纯 UI 默认值建议改为 `false`。

### 3. Submit 类型

```ts
export type ChatSubmitSource = 'enter' | 'button' | 'external'

export interface ChatSubmitPayload<TStructuredData extends ChatStructuredData = ChatStructuredData> {
  readonly text: string
  readonly rawText?: string
  readonly conversationId: string | null
  readonly source: ChatSubmitSource
  readonly structuredData?: TStructuredData
}
```

建议约定：`text` 是经过基础规范化后的提交文本；如果调用方需要保留用户原始空格，则使用 `rawText`。直接使用 `TrChatUI` 和通过 `TrChat` 使用时必须遵循同一规则。

### 4. 推荐 Emits

```ts
export interface ChatAsideOpenChangePayload {
  readonly open: boolean
  readonly source: 'user' | 'viewport' | 'external'
}

export interface ChatUIEmits<TStructuredData extends ChatStructuredData = ChatStructuredData> {
  'update:inputValue': [value: string]

  submit: [payload: ChatSubmitPayload<TStructuredData>]
  cancel: [
    payload: {
      readonly conversationId: string | null
      readonly source: 'user' | 'external'
    },
  ]
  clear: [
    payload: {
      readonly reason: 'user' | 'submit' | 'external'
    },
  ]

  'create-conversation': [
    payload?: {
      readonly source?: string
      readonly title?: string
      readonly metadata?: Readonly<Record<string, unknown>>
    },
  ]
  'switch-conversation': [
    payload: {
      readonly id: string
      readonly source?: string
    },
  ]
  'rename-conversation': [
    payload: {
      readonly id: string
      readonly title: string
    },
  ]
  'delete-conversation': [
    payload: {
      readonly id: string
      readonly source?: string
    },
  ]

  'prompt-click': [
    payload: {
      readonly event: MouseEvent
      readonly item: PromptProps
      readonly conversationId: string | null
    },
  ]

  'bubble-state-change': [payload: ChatBubbleStateChangePayload]
  'bubble-event': [payload: ChatBubbleEventPayload]

  'model-select': [payload: { readonly id: string | null }]
  'model-feature-change': [
    payload: {
      readonly id: string
      readonly enabled: boolean
    },
  ]
  'mcp-add-server': [payload: { readonly id: string }]
  'mcp-remove-server': [payload: { readonly id: string }]
  'mcp-server-enabled-change': [
    payload: {
      readonly id: string
      readonly enabled: boolean
    },
  ]
  'mcp-tool-enabled-change': [
    payload: {
      readonly serverId: string
      readonly toolId: string
      readonly enabled: boolean
    },
  ]

  'left-aside-open-change': [payload: ChatAsideOpenChangePayload]
  'right-aside-open-change': [payload: ChatAsideOpenChangePayload]
}
```

Vue 模板层使用 kebab-case，例如 `@update:input-value`、`@switch-conversation`；TypeScript 类型和实现层应统一采用同一套事件名，不再同时维护 camelCase 和 kebab-case 两种公共命名。

### 5. 推荐使用方式

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { TrChatUI, type ChatSubmitPayload, type ChatUIData, type ChatUIOptions } from '@opentiny/tiny-robot-chat'

const inputValue = ref('')
const loading = ref(false)

const data = computed<ChatUIData>(() => ({
  conversation: {
    items: [],
    activeId: null,
    title: '新对话',
  },
  bubble: {
    messages: [],
  },
  sender: {
    loading: loading.value,
    disabled: false,
    submitDisabled: false,
  },
}))

const ui: ChatUIOptions = {
  sender: {
    clearOnSubmit: false,
  },
}

function handleSubmit(payload: ChatSubmitPayload) {
  // 调用方决定何时更新 inputValue、如何处理失败和恢复草稿。
  void payload
}

function handleSwitchConversation(payload: { id: string }) {
  void payload
}
</script>

<template>
  <TrChatUI
    v-model:input-value="inputValue"
    :data="data"
    :ui="ui"
    @submit="handleSubmit"
    @clear="inputValue = ''"
    @switch-conversation="handleSwitchConversation"
  />
</template>
```

### 6. 兼容迁移顺序

1. 先新增 `inputValue/defaultInputValue` 和 `update:inputValue`，保留旧的 `data.sender.inputValue`、`ui.sender.onInput`。
2. 将所有 `ui.onXxx` 内部转发为对应 emits，并在类型上标记 deprecated。
3. 统一左右 Aside 的 `open/defaultOpen` 和 open-change 事件。
4. 统一事件为对象 payload，旧 payload 在一个兼容周期内继续支持。
5. 明确 `submit` 的文本规范化、清空和失败恢复语义，再调整 `clearOnSubmit` 默认值。
6. 最后补充组件测试，覆盖受控输入、异步提交失败、事件 payload 和 Aside 双向控制。

### 推荐设计验收标准

- 普通输入接入只需要 `v-model:input-value`，不需要同时构造 Data 和 callback。
- 所有用户交互均能通过 Vue 模板事件发现和监听。
- 受控和非受控模式语义明确，且不会在生命周期内静默切换。
- `TrChatUI` 和 `TrChat` 对 submit 文本、清空和失败恢复的行为一致。
- 新增事件字段不需要改变已有 positional 参数。
- 左右 Aside、输入框和外部工具栏都能通过统一的 Props/Emits 或稳定 ref API 接入。

## Issues

### [P1] 右侧 Aside 关闭后，在非受控模式下无法重新打开

- 状态：待处理
- 位置：`packages/chat/src/ChatUI.vue:102-115`、`:223-225`、`:395-405`

#### 问题

右侧 Aside 只要存在 slot 就会默认展示；点击关闭后，组件内部状态变为关闭，但 UI 没有提供重新打开的入口。调用方如果没有额外控制状态或自行实现触发器，用户只能通过重新挂载组件才能恢复面板。

#### 影响

右侧配置、上下文或扩展面板属于一次性可关闭 UI，关闭后会变成不可恢复状态，核心交互不完整。

#### 建议

- 增加内置的右侧 Aside 打开/切换入口，或增加 `right-aside-trigger` / `layout-right-aside-trigger` slot。
- 为相关 slot 提供 `openRightAside`、`closeRightAside`、`toggleRightAside` 等操作。
- 明确区分 `defaultOpen`（非受控初始值）和 `open`（受控值），并提供对应的更新事件。

#### 验收标准

- 非受控模式下，右侧 Aside 可以完成“打开 → 关闭 → 再打开”。
- 受控模式下，关闭事件和再次打开事件都能被调用方可靠接管。
- 桌面端和移动端的 Drawer 行为一致，且没有重复触发或状态不同步。

### [P1] 默认消息角色配置会被覆盖，默认头像和用户消息对齐失效

- 状态：待处理
- 位置：`packages/chat/src/ui/ChatMessages.vue:40-79`、`packages/chat/src/ui/resolveOptions.ts:210-227`

#### 问题

`ChatMessages` 先设置了 `defaultRoleConfigs`，随后又通过 `...bubbleList` 覆盖整个 `roleConfigs`。同时，`resolveBubble` 即使没有自定义角色配置，也始终返回 `bubbleList`，导致“使用默认角色配置”的分支实际上不可达。

#### 影响

不传自定义配置时，默认 assistant/user 的 placement 和 fallback avatar 可能不生效；user 消息可能沿用 Bubble 的默认 start 对齐，也可能缺少预期头像。Demo 中的自定义角色配置会掩盖这个问题。

#### 建议

- 合并默认角色配置和用户配置，而不是覆盖整个对象：

  ```ts
  roleConfigs: {
    ...defaultRoleConfigs,
    ...bubbleList.roleConfigs,
  }
  ```

- 如果角色配置内部还允许只覆盖部分字段，则继续按 role 做字段级合并。
- 删除不可达分支，或调整 resolver，使“无自定义配置”确实能走默认配置路径。

#### 验收标准

- 不传 `bubble.roleConfigs` 时，assistant 默认左对齐、user 默认右对齐，并使用默认 fallback avatar。
- 只覆盖一个 role 或一个字段时，其余默认值仍然保留。
- system 消息默认隐藏的行为保持不变。

### [P1] 替换型 slot 没有暴露操作上下文，定制 UI 无法完成核心交互

- 状态：待处理
- 位置：`packages/chat/src/types/ui/slots.ts:1-17`、`packages/chat/src/ChatUI.vue:291-293`、`:315-317`、`:336-338`、`:382-384`
- 相关实现：`packages/chat/src/ui/ChatComposer.vue:152-185`、`packages/chat/src/ui/ChatHeader.vue:45-53`、`packages/chat/src/ui/ChatLeftAside.vue:145-151`

#### 问题

公共 slot 类型全部是 `() => unknown`，`ChatUI` 转发 slot 时也没有透传子组件已有的 slot props。尤其是 `layout-footer` 会直接替换 `ChatComposer` 内部的 `TrSender`，替换后无法自然获得输入值、提交、取消、清空等操作。

#### 影响

调用方可以替换外观，却无法可靠复用 ChatUI 的行为状态：

- 自定义 Header 无法直接复用新建会话、Aside 开关等操作。
- 自定义 Left Aside 无法直接复用会话切换、创建、删除等操作。
- 自定义 Sender 无法接入 `submit`、`cancel`、`clear` 和 loading/disabled 状态。

#### 建议

- 区分“完整替换 slot”和“局部扩展 slot”。如果只想扩展 Sender，优先提供 `sender-footer` 等扩展点，不要要求调用方替换整个 Sender。
- 为完整替换 slot 定义显式、稳定的 slot props，例如：

  ```ts
  type SenderSlotProps = {
    value: string
    loading: boolean
    disabled: boolean
    submitDisabled: boolean
    setInputValue: (value: string) => void
    submit: () => void
    cancel: () => void
    clear: () => void
  }
  ```

- Header、Left Aside 和 Main 也应透传对应的状态和操作上下文；slot 类型不能继续全部退化为 `unknown`。

#### 验收标准

- 自定义 Sender 能完成输入、提交、取消、清空，并正确反映 loading/disabled 状态。
- 自定义 Header 能复用新建会话和左右 Aside 开关。
- 自定义 Left Aside 能复用会话创建、切换、删除和开关操作。
- slot props 有明确的 TypeScript 类型，并纳入公共 API 文档。

### [P1] `submit` 后立即清空草稿，纯 UI 无法获知异步失败

- 状态：待处理
- 位置：`packages/chat/src/ChatUI.vue:239-245`
- 相关实现：`packages/chat/src/composables/useChatInput.ts:33-48`

#### 问题

`handleSubmit` 先派发 `submit`，随后默认立即清空输入框。`ChatUI` 本身不负责请求，也没有 Promise/acknowledgement 语义，因此无法判断调用方的异步提交是否成功。

`TrChat` 外层目前通过 `useChatInput` 保存并在 Runtime 失败时恢复草稿，但直接使用 `TrChatUI` 的调用方没有这层保护。

#### 影响

请求失败、网络断开或业务校验不通过时，用户输入可能丢失；同一个 UI 组件在 `TrChat` 和直接接入场景下的失败行为也不一致。

#### 建议

需要先确定提交契约，推荐二选一：

1. 纯 UI 默认不清空草稿，由调用方在确认接受后主动清空；`TrChat` 再由适配层决定何时清空。
2. 让 `submit` 支持明确的异步确认/拒绝结果，组件只在 accepted 后清空，并在 rejected 时保留输入。

无论采用哪种方案，都应保留 `clearOnSubmit` 的兼容策略，并明确失败恢复责任归属。

#### 验收标准

- 直接使用 `TrChatUI` 时，异步提交失败不会静默丢失草稿。
- 成功、失败、取消和重复提交的行为有明确测试覆盖。
- `TrChat` 与 `TrChatUI` 对 `clearOnSubmit` 的语义一致且有文档说明。

### [P2] `layout.leftAside === false` 时，桌面端缺少“新建会话”入口

- 状态：待处理
- 位置：`packages/chat/src/ChatUI.vue:274-294`、`packages/chat/src/ui/ChatHeader.vue:70-78`、`:136-138`、`:171-174`

#### 问题

关闭左侧 Aside 后，LeftAside 内的新建入口随之消失。Header 的新建按钮在桌面端默认隐藏，只在窄屏媒体查询下显示。因此桌面端没有稳定的 `createConversation` 用户入口。

#### 影响

调用方只想隐藏会话列表、保留聊天主区域时，用户仍然需要创建新会话，但组件没有可见入口。

#### 建议

- 当 `leftAside` 不可用时，在 Header 显示新建会话操作。
- 或增加 `header-actions` slot，并通过 slot props 暴露 `createConversation`。
- 在无左侧 Aside 的布局模式文档中明确新建会话入口的责任归属。

#### 验收标准

- 桌面端隐藏左侧 Aside 后，仍有可发现的新建会话入口。
- 新建操作与 LeftAside 内操作使用同一事件和状态逻辑。

### [P2] `inputValue === undefined` 的“不同步”契约在状态切换时不成立

- 状态：待处理
- 位置：`packages/chat/docs/chat-ui-design.md:66-69`、`packages/chat/src/ui/ChatComposer.vue:58`
- 相关实现：`packages/components/src/sender/composables/useEditor.ts:104-111`

#### 问题

设计文档约定 `inputValue === undefined` 表示“不做外部同步”，清空应使用 `''`。但 `ChatComposer` 始终把 `props.sender.inputValue` 传给底层 Editor；当受控值从字符串切换为 `undefined` 时，底层 watcher 可能将编辑器内容清空。

#### 影响

受控/非受控模式切换时，用户正在编辑的草稿可能被意外清除，和公开契约不一致。

#### 建议

- 在 `ChatComposer` 建立明确的本地 draft bridge：只有值不是 `undefined` 时才同步到 Editor。
- 或修改底层 Editor 的 watcher，使 `undefined` 在初始化之后表示跳过同步，而不是清空内容。
- 补充 string → `undefined` → string、`''` 清空和用户输入回传的测试。

#### 验收标准

- 外部值为 `undefined` 时，用户已有草稿保持不变。
- 外部值为 `''` 时，明确清空草稿。
- 受控和非受控模式切换不会产生额外的 input/change 事件。

### [P2] ChatUI 默认高度是视口高度，容器嵌入契约不清晰

- 状态：待处理
- 位置：`packages/components/src/layout/components/LayoutSurface.vue:283-289`、`packages/chat/src/ChatUI.vue` 的根节点样式、`packages/chat/demo/style.css:113-120`

#### 问题

底层 LayoutSurface 默认使用 `100vh/100dvh`。ChatUI 当前没有在自身根节点建立“填满父容器”的默认高度，Demo 需要额外通过 `--tr-layout-height: 100%` 覆盖才能嵌入固定区域。

#### 影响

开发者把 ChatUI 放入卡片、抽屉或应用内容区时，组件可能撑满整个视口，造成溢出或覆盖周边布局；“快速接入”所需的尺寸前置条件不够直观。

#### 建议

- 明确 ChatUI 的尺寸契约：是默认视口级 Shell，还是默认填充父容器。
- 如果目标是嵌入式 UI，提供明确的 `height`/`fill` 选项，或在组件根节点稳定设置 `--tr-layout-height: 100%`，同时说明父容器必须有确定高度。
- 将 Demo 的覆盖方式补充到接入文档，而不是只留在 Demo CSS 中。

#### 验收标准

- 视口级和固定父容器两种场景都有可预测的高度行为。
- 不需要调用方阅读底层 Layout 实现才能完成基本嵌入。

### [P2] `defaultOpen` 被当成实时控制值，语义容易与受控模式混淆

- 状态：待处理
- 位置：`packages/chat/src/ChatUI.vue:124-140`

#### 问题

左右 Aside 都 watch `defaultOpen`，并在其变化时覆盖内部 open state。按照常见 Vue API 约定，`defaultOpen` 应只用于初始化；如果需要实时控制，应提供 `open`/`v-model`。

#### 影响

调用方因配置对象重建、响应式依赖变化或其他无关状态更新而改变 `defaultOpen` 时，可能覆盖用户刚刚进行的手动打开/关闭操作，造成状态跳变。

#### 建议

- 让 `defaultOpen` 只参与初始值计算。
- 为需要实时控制的场景提供明确的 `leftAsideOpen`、`rightAsideOpen` 或 `v-model:*` API。
- 如果暂时保留当前行为，至少在文档中将 `defaultOpen` 定义为实时同步值，避免误用。

#### 验收标准

- 非受控模式下，外部配置对象变化不会重置用户的手动状态。
- 受控模式下，外部 open 值是唯一状态源，关闭/打开事件可以正常回写。

### [P2] 缺少 ChatUI 公共行为的自动化回归测试

- 状态：待处理
- 位置：`packages/chat`、`packages/test`

#### 问题

当前测试中没有发现覆盖 ChatUI 主流程的组件或端到端用例。现有实现涉及布局、slot 替换、受控输入、移动端 Drawer 和异步提交，多数问题仅靠手工 Demo 才能发现。

#### 建议

建立一组围绕公共契约的测试矩阵，至少覆盖：

- 默认角色配置、system 隐藏和部分 role override；
- 受控/非受控输入，以及 `inputValue` 的 `undefined`/`''` 语义；
- prompt 点击后的 input 更新与 submit 顺序；
- submit 成功、失败、取消、重复提交和草稿恢复；
- 右侧 Aside 打开、关闭、再次打开，以及受控/非受控模式；
- 隐藏左侧 Aside 时的新建会话入口；
- Header、Left Aside、Main、Footer/Sender slot 的上下文和事件；
- 桌面端、移动端以及固定父容器尺寸。

#### 验收标准

- 测试断言面向消费者可观察的 UI、事件和状态，而不是内部调用次数。
- 每个 P1 问题至少有一个稳定的回归用例。
- CI 中能执行 ChatUI 测试，不依赖手工启动 Demo。

## 建议实施顺序

1. 先补齐右侧 Aside 的重新打开能力和左右 Aside 的受控/非受控契约。
2. 修正默认 role 配置合并，避免基础消息展示错误。
3. 设计并冻结 slot props 与 Sender/Header/LeftAside 的扩展边界。
4. 明确 submit 的成功确认和草稿清空策略，同时修复 `undefined` 输入同步语义。
5. 固化尺寸契约，补齐 ChatUI 的组件/端到端测试矩阵。

## Review 验证记录

- `packages/chat` 的 `vue-tsc --noEmit`：通过。
- 相关 ChatUI 文件的 ESLint 检查：通过。
- Demo 已手工验证桌面端和移动端基本布局；浏览器控制台无错误。
- 本次只记录问题，没有修改 ChatUI 源码。
