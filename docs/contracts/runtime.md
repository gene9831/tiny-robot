# Runtime 契约

本文记录 Runtime 领域模型、执行生命周期和查询边界的规范性约束，供实现与评审核对；它不承担从零教学或学习路径导航。

本文使用 **MUST**、**SHOULD**、**MAY** 表示强制、推荐和可选约束。它记录已批准的 Runtime 目标契约，不是当前版本的功能支持矩阵；尚未实现的条款仍约束后续设计，但不能被描述为现行可调用能力。当前公共签名以 TypeScript/TypeDoc 为准，当前可用范围见文档站的“应用与模型之间的运行边界”。

## 边界

- Runtime **MUST NOT** 依赖 Vue、Angular、DOM 或组件 View Model。
- Provider 集成 **MUST** 遵守仓库固定版本的 [LanguageModelV4 Runtime Boundary Contract v1](language-model-v4-runtime-boundary-v1.md)。Runtime 出站只可通过 allowlist projection 构造允许的 `LanguageModelV4CallOptions` 子集；入站只可通过 Ingress Guard 从 `LanguageModelV4StreamResult.stream` 投影当前领域支持的 `LanguageModelV4StreamPart` 子集。
- `LanguageModelV4` **MUST NOT** 被视为 Runtime Domain Model。Provider 原始 payload、SDK 私有类型、raw chunks、headers、未经清洗的 error/warning/metadata **MUST NOT** 进入 Domain Event、Snapshot 或组件公共 API。应用可通过显式配置的 `inspect.streamPart` 临时观察 Guard 前的 V4 part；该旁路不属于 Domain，不得改变流或写入 Runtime 状态。
- Provider boundary **MUST** 明确上游版本、允许的 call options 与 prompt parts、允许的 stream parts、合法顺序、终止语义、能力声明、有损映射和双向 conformance fixtures；升级必须经过人工评审。
- 应用 **MUST** 拥有 Provider Connection Configuration 与 credential；Provider 集成层 **MUST** 使用具体 AI SDK Provider creator 处理 endpoint、headers 和认证。Runtime 只在创建新 Run 时通过同步 resolver 按 `providerId` 获取一次无 credential 的 Provider Registration。Runtime v1 不拥有可变 Provider registry。

## 公共模型

- Snapshot **MUST** 是不可变、按 ID 规范化且可序列化的当前领域状态。
- 未变化实体 **SHOULD** 保持引用稳定，以支持 Vue 与 Angular 的高效订阅和投影。
- Runtime **MUST** 提供读取 Snapshot、订阅变化和派发 Command 的稳定能力。
- `inspect.streamPart` **MAY** 观察每个 `LanguageModelV4StreamPart` 及其 Run、Step、Provider、model 上下文。Runtime **MUST NOT** 等待其返回值，且其同步异常 **MUST NOT** 中断模型流；观察到的数据可能包含 Provider metadata 或 raw value，调用方必须将其视为敏感、瞬时诊断数据。
- Runtime **MUST** 创建并拥有 Conversation ID。`createConversation()` 返回的 Conversation facade **MUST NOT** 保存领域状态；其 `send()` 只绑定该 Conversation ID 并包装同一个 `dispatch(send)` Command 路径，不能形成另一套行为语义。
- 公共生命周期事件 **MUST NOT** 直接等同于 Provider 事件或内部 Domain Event。

## Run 生命周期

- 每个 Turn **MAY** 包含多个 Run；每个 Run 固定应用定义的 `providerId`、真实 `modelId`、模型能力、选项和允许工具集合。一次模型调用是一个 `Step（kind = 'model'）`；一次 Runtime 管理的工具执行是一个 `Step（kind = 'tool'）`。两者是同一 Step 实体的不同 kind，工具循环中的同一 Run **MAY** 包含多个 Step。
- `Turn.inputMessageIds` **MUST** 按接受顺序保存表达该用户意图的输入 Message。用户输入 Message 及其 Part **MUST** 在 Run 创建前成为完整的领域输入，**MUST NOT** 记录 producing `runId`。Retry 或 Regenerate **MUST** 复用同一 Turn 输入，而不是复制用户 Message。
- `Run.inputMessageIds` **MUST** 按模型上下文顺序引用该执行尝试开始时采用的 Message。被引用 Message **MUST** 属于同一 Conversation；它可以来自当前或先前的 Turn。该关系是只读消费引用，**MUST NOT** 改变 Message 所有权，也 **MUST NOT** 授权该 Run 创建、追加、结束或以其他方式修改输入 Message 的 Part。
- `Run.outputMessageIds` **MUST** 按产生顺序保存本次尝试产生的 Message；这些 Message 的 `runId` **MUST** 等于该 Run。Run 的内容 Part Event **MUST** 只修改该 Run 产生的 Message。
- `Run.stepIds` **MUST** 按 `step-started` 的接受顺序保存 Step，并且是 Step 顺序的唯一来源；Step 实体 **MUST NOT** 重复保存位置索引。
- `Run.stepIds` 与 `Run.outputMessageIds` 是两条独立的有序关系，长度 **MAY** 不同，且 **MUST NOT** 按数组位置配对。当前公共模型不表达某个输出 Message 由哪个 Step 产生。
- Send、Retry、Regenerate、Command、resolver 与 Provider factory **MUST NOT** 接收 credential。Runtime 只管理当前 Run 使用的 Provider 与 model 引用，并必须在 Run 结束时释放这些执行引用。
- 当前首个 Run 的 Send 输入不表达 reasoning 控制策略。Runtime 不发送 `reasoning` call option，模型采用 Provider 默认行为；标准 V4 reasoning part 若实际出现，必须由 Guard 投影为可见 `ReasoningPart`。
- Runtime v1 **MUST** 直接调用 `LanguageModelV4.doStream()`，**MUST NOT** 使用 `streamText()` 或增加其包装层。`LanguageModelV4StreamResult` 只有 `.stream` 可以进入 Ingress Guard；`.request`、`.response`、headers、body 与调试数据必须在 coordinator 边界丢弃。
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

以下内容 **MUST NOT** 持久化：API key、Authorization header、AbortController、订阅、瞬时 loading 标记、原始流增量、raw chunks、response headers、Provider request/response body，以及 opaque continuation metadata。Runtime 自身的日志与诊断只允许记录经 allowlist 生成的规范化字段；`inspect.streamPart` 只提供瞬时观察，不形成保存或上报这些数据的许可。

## Selector / Presenter

- Runtime Domain Selector **MUST** 从 Snapshot 选择 Conversation、Turn、Run 或 Message 领域根节点，并把所有权与输入引用分别投影成可直接遍历的不可变领域树；`TurnSelection.inputMessages`、`RunSelection.inputMessages` 与 `RunSelection.outputMessages` **MUST NOT** 合并成一个含义不明的消息数组。Selector 不得包含 UI 状态或框架响应式对象。
- `ConversationSelection.activeRun` **MUST** 表示该 Conversation 当前仍在执行的 Run；`TurnSelection.selectedRun` **MUST** 表示同一 Turn 的多次执行尝试中当前被选作该轮回答结果的 Run。两者存在时 **MUST** 复用所展开关系中的同一个 Run 对象，不得复制实体。
- Domain Selector 查询缺失的根实体时 **MUST** 返回 `undefined`；已有实体的空关系 **MUST** 返回空数组；已有实体指向缺失实体的悬空引用 **MUST** 抛出稳定的 selector error。
- 对不可变 Snapshot 连续执行 Selector 时，未变化的领域分支 **MUST** 保持引用稳定，使 Vue、Angular 等框架可以通过浅层响应式容器消费结果。
- Presenter 与面向组件的 View Model 投影不属于当前 Domain Selector 职责；View Model **MUST NOT** 成为第二个持久化源。
- UI action **MUST** 转换为语义 Command，不能直接修改 Snapshot。
