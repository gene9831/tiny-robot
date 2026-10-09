# 下一代架构总览

## 目标

Tiny Robot 的下一代架构以 AI 应用常用组件和浏览器 Runtime 为中心，首期同时支持 Vue 3.4+ 与 Angular 20+。它共享状态、规则和异步流程，同时保留两个框架原生的渲染、生命周期和组合能力。

```text
Provider API
    ↓
AI SDK Provider / Provider Adapter
    ↓  LanguageModelV4 stream parts
Runtime Ingress Guard
    ↓  Domain Events
Runtime commands → domain events → reducer → normalized Snapshot
                                         ↓
                                 Selector / Presenter
                                         ↓
                              component View Models
                                ↙                 ↘
                         Vue renderer       Angular renderer
```

## 分层职责

### Provider Model Boundary

- 使用 `LanguageModelV4` 作为 Provider 实现与 Runtime 之间的统一模型调用规范；OpenAI Responses、Chat Completions compatible、Anthropic、Gemini 或私有接口由对应 AI SDK Provider 或自定义 Provider 实现该规范。
- Runtime Ingress Guard 只接受契约允许的 V4 子集，校验事件顺序和终止条件，清洗 error、warning、metadata，并转换为 Domain Event。
- `LanguageModelV4` 是 Provider ABI，不是 Runtime Domain Model；Provider 原始 payload、headers、raw chunks、SDK 对象和未清洗 metadata 不得进入 Snapshot 或组件公共 API。
- 一次 `LanguageModelV4` 调用对应一个 Model Step。包含工具执行的 Run 可以有多个 Model Step。

### Runtime

- 拥有 Conversation、Turn、Run、Message、ToolCall 等领域状态及其不变量。
- 通过 command 驱动用例，通过 domain event 和 reducer 生成不可变 Snapshot。
- 公开稳定的 `getSnapshot`、`subscribe`、`dispatch`，以及 `send`、`abort`、`retryLastRun`、`regenerateLastResponse` 等便利方法。
- 使用 `AsyncIterable`、`AbortSignal` 和 `Promise` 表达首期异步流程；公共 API 不依赖 RxJS。

### Selector / Presenter

- 从规范化 Snapshot 投影出面向小组件的 View Model。
- 负责排序、组合、派生状态和展示需要的降维；必须是可测试的无副作用计算。
- 不持有第二份可变领域状态，不反向依赖框架。

### Web layer

- 容纳焦点、测量、滚动、浮层定位等依赖 DOM、但不依赖 Vue 或 Angular 的能力。
- Runtime 不能导入本层。

### UI contract 与 renderer

- UI contract 定义数据、配置、交互模型、事件、服务接口和定制点的语义。
- Vue renderer 使用 props、`v-model`、events 和 slots；Angular renderer 使用 input/model/output、`TemplateRef` 和 content projection。
- 两端共享行为契约和设计 token，不共享模板语法或框架响应式对象。

## 状态与事件流

Runtime Snapshot 是当前结果的唯一事实来源。流式增量先由 Ingress Guard 校验和清洗，再被解释为领域事件并归约到 Snapshot；组件不通过重放事件自行恢复状态。内部领域事件、Provider stream parts 和公共生命周期事件必须分层命名。

实体按 ID 规范化存储，并使用结构共享保持未变化引用稳定。首期每个 Conversation 最多一个 active Run；切换 Conversation 不会终止其 Run，不同 Conversation 可以并行。

## 浏览器优先与安全

首期 Runtime 全部在浏览器运行，使用 Provider 与用户提供的 API key 直接访问模型服务。Runtime 接收瞬时凭据但不拥有或持久化凭据；用户输入的 BYOK 默认只驻留内存。带凭据的 model 必须按 Run 创建和释放，不能作为 Runtime 长期状态。Provider 必须声明 `browserDirect`、streaming、tools、reasoning、attachments 等能力。

传输边界必须可替换：首期实现 `BrowserDirectTransport`，未来可增加 `ProxyTransport`，而不改变 Runtime 领域协议。工具写操作或破坏性操作在浏览器侧执行前必须经过明确审批。

## 首期垂直切片

首期交付完整的一次 AI 对话：PromptInput、ModelSelector、MessageList 及各类 Part、ConversationList、ChatLayout，配套文本发送、流式输出、停止、错误恢复、最后一次回答的 Retry/Regenerate、历史持久化、工具调用与人工审批，并在 Vue 与 Angular 中保持行为一致。

暂缓 attachments/多模态协议、正式 MCP 集成、任意历史消息编辑与分支 UI、Runtime-connected 包装组件，以及 AG-UI 远程 Runtime。AG-UI 可在未来作为服务端 Runtime 到前端的适配协议，不与首期 Provider 边界混用。

## 目标 package 方向

以下是下一代的逻辑边界，不表示当前目录已经存在，也不授权一次性重排现有包：

- `@opentiny/tiny-robot-runtime`
- `@opentiny/tiny-robot-ui`
- `@opentiny/tiny-robot-vue`
- `@opentiny/tiny-robot-angular`
- `@opentiny/tiny-robot-tokens`
- `@opentiny/tiny-robot-provider-openai`
- `@opentiny/tiny-robot-provider-anthropic`
