# Runtime 契约

本文使用 **MUST**、**SHOULD**、**MAY** 表示强制、推荐和可选约束。具体 TypeScript 类型将在实现前作为单独公共契约评审。

## 边界

- Runtime **MUST NOT** 依赖 Vue、Angular、DOM 或组件 View Model。
- Provider 集成 **MUST** 遵守仓库固定版本的 [LanguageModelV4 Runtime Boundary Contract v1](language-model-v4-runtime-boundary-v1.md)。Runtime 只可通过 Ingress Guard 消费允许的 `LanguageModelV4` 子集。
- `LanguageModelV4` **MUST NOT** 被视为 Runtime Domain Model。Provider 原始 payload、SDK 私有类型、raw chunks、headers、未经清洗的 error/warning/metadata **MUST NOT** 进入 Domain Event、Snapshot 或组件公共 API。
- Provider boundary **MUST** 明确上游版本、允许的 stream parts、合法顺序、终止语义、能力声明、有损映射和 conformance fixtures；升级必须经过人工评审。

## 公共模型

- Snapshot **MUST** 是不可变、按 ID 规范化且可序列化的当前领域状态。
- 未变化实体 **SHOULD** 保持引用稳定，以支持 Vue 与 Angular 的高效订阅和投影。
- Runtime **MUST** 提供读取 Snapshot、订阅变化和派发 Command 的稳定能力。
- 便利方法 **MAY** 包装 Command，但不能形成另一套行为语义。
- 公共生命周期事件 **MUST NOT** 直接等同于 Provider 事件或内部 Domain Event。

## Run 生命周期

- 每个 Turn **MAY** 包含多个 Run；每个 Run 固定实际 Provider、模型、选项和允许工具集合。一次模型调用是一个 Model Step；工具循环中的同一 Run **MAY** 包含多个 Model Step。
- 同一 Conversation 同时 **MUST NOT** 有超过一个 active Run；不同 Conversation **MAY** 并行。
- `abort` **MUST** 通过 `AbortSignal` 传播，并把终态归约到 Snapshot。
- 页面恢复时，无法续接的 active Run **MUST** 转换为 `interrupted`，不得伪装为 `failed` 或 `completed`。
- `retryLastRun` **MUST** 只重试最后一个失败、终止或中断的 Run。
- `regenerateLastResponse` **MUST** 从相同前置上下文创建新 Run；旧结果标记为 `superseded`，且不进入当前模型上下文。

## 工具

- 工具在根 Runtime 注册，Conversation 可限制集合，Run 创建时固定最终允许集合。
- ToolCall **MUST** 保存参数、审批、执行和结果状态，但 **MUST NOT** 保存工具实现或凭据。
- 工具声明 **MUST** 包含输入 schema、风险级别和是否需要审批。
- 浏览器中的写入或破坏性工具调用 **MUST** 获得显式人工批准后才能执行。

## 持久化

持久状态 **MUST** 带 `schemaVersion`，并保存恢复对话所需的 Conversation、Turn、Message/Part、Run 终态与冻结配置、ToolCall 审批/结果，以及当前采用的 regenerate 尝试。

以下内容 **MUST NOT** 持久化：API key、Authorization header、AbortController、订阅、瞬时 loading 标记、原始流增量、raw chunks、response headers、Provider request/response body，以及 opaque continuation metadata。Provider 原始响应不得保存；诊断只允许记录经 allowlist 生成的规范化字段。

## Selector / Presenter

- Selector **MUST** 是 Snapshot 到 View Model 的无副作用投影。
- View Model **MUST NOT** 成为第二个持久化源或包含框架响应式对象。
- UI action **MUST** 转换为语义 Command，不能直接修改 Snapshot。
