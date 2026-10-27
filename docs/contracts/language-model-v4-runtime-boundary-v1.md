# LanguageModelV4 Runtime Boundary Contract v1

本文记录 Provider 接入、模型调用和 Runtime 安全边界的规范性约束，供实现与评审核对；它不承担从零教学或学习路径导航。

本文定义 Tiny Robot Provider 实现与 Runtime 之间的模型调用边界。它是可评审、可版本化的目标契约，不是 implementation plan、当前功能支持矩阵或 Runtime Domain Model。尚未实现的工具、continuation 和完整 Provider conformance 条款继续约束后续实现，但不能据此宣称对应能力当前可用；现行公共签名和能力范围分别以 TypeScript/TypeDoc 与文档站“应用与模型之间的运行边界”为准。

本文使用 **MUST**、**MUST NOT**、**SHOULD**、**MAY** 表示强制、禁止、推荐和可选约束。

## 1. 决策与分层

```text
Snapshot / frozen Run config
  ↓ allowlist projection
LanguageModelV4CallOptions
  ↓ LanguageModelV4.doStream()
AI SDK Provider / custom LanguageModelV4 Provider ↔ Provider wire protocol
  ↓ LanguageModelV4StreamResult.stream
ReadableStream<LanguageModelV4StreamPart>
  ↓ Tiny Robot Ingress Guard
Domain Events
  ↓ Runtime reducer
Snapshot
```

四层必须保持独立：

1. Provider wire protocol：OpenAI Responses、Chat Completions compatible、Anthropic Messages、Gemini 等原始 API。
2. Provider ABI：本文固定的 `LanguageModelV4` 上游规范和 Tiny Robot 允许子集。
3. Runtime Domain Model：Conversation、Turn、Run、Step、Message、Part、ToolCall、Domain Event 与 Snapshot。
4. UI contract：由 Selector/Presenter 从 Snapshot 投影的 View Model；不属于本文。

Open Responses 只作为 OpenAI Responses mapping 和 conformance 的参考，不是 Tiny Robot 公共协议。

一次 `Step（kind = 'model'）`（下文简称 Model Step）的 Provider ABI 同时包含出站请求和入站响应：Runtime 构造允许的 `LanguageModelV4CallOptions`，调用 `LanguageModelV4.doStream()`，然后只把 `LanguageModelV4StreamResult.stream` 交给 Ingress Guard。Model Step 与 Tool Step 只是同一 Step 实体的不同 kind。`LanguageModelV4StreamResult.request` 与 `.response` 是 Provider 调试数据，不属于 Runtime 入站协议。

## 2. 上游基线与升级

v1 固定：

- `LanguageModelV4.specificationVersion === 'v4'`；
- build 与 conformance baseline：`@ai-sdk/provider@4.0.25`；
- 首期已研究的 Provider baseline：
  - `@ai-sdk/openai@4.0.89`；
  - `@ai-sdk/deepseek@3.0.63`；
  - `@ai-sdk/anthropic@4.0.76`；
  - `@ai-sdk/google@4.0.92`。

首期文本 Run 用 DeepSeek Native Chat Completions 验证官方 Provider 直接接入；DeepSeek 的 Responses 与 Anthropic-compatible 格式作为同页兼容性实验。Gemini baseline 用于检验抽象，不代表首期实现承诺。

若 Runtime 的公开 TypeScript 声明引用 `LanguageModelV4`，`@ai-sdk/provider` **SHOULD** 同时作为 peer dependency 和固定版本的 dev dependency；只在内部使用且不出现在发布声明中时才可仅作为 dev dependency。实际执行 OpenAI 请求的 Provider package 不能仅作为 dev dependency。

本地验证的上述 AI SDK packages 声明 Node.js 22+。在批准生产依赖前 **MUST** 用仓库支持的 Node、Vue 3.4+ 与 Angular 20+ consumer matrix 验证安装、类型检查和浏览器构建；若发生冲突，必须由维护者选择提高 Tiny Robot 的 Node 工具链基线，或改用不泄漏外部类型的结构化 facade。本文不自动改变仓库 Node 支持范围。

升级任何 baseline 前 **MUST**：

1. 比较 `LanguageModelV4` request、result、stream part、warning、usage 和 finish reason 类型；
2. 重跑 Provider、Ingress Guard 和 secret-canary conformance suite；
3. 检查浏览器 bundle 与 TypeScript consumer；
4. 记录新增、删除或行为改变的 part；
5. 若允许子集、持久化、安全或 Domain mapping 改变，升级本文版本并经过人工评审。

同一 `specificationVersion` 不表示所有新增 union member 自动受支持。运行时未知 part 必须按第 11 节处理。

TypeScript consumer 检查 **MUST** 包含 `skipLibCheck: false`，并确认 `json-schema` 与 Node 类型不会作为未声明依赖泄漏给消费者。

## 3. Provider Registration、解析与凭据边界

应用拥有 Provider Connection Configuration 与 credential。Provider 集成层复用具体 AI SDK Provider creator，把 endpoint、headers 和认证绑定到 Provider Registration 的无参工厂。Runtime 在创建新 Run 时按 `providerId` 解析 registration；registration 为当前 Run 创建 AI SDK Provider V4 的语言模型子集，并声明该接入允许选择的真实模型：

```ts
type RuntimeLanguageProviderV4 = Pick<ProviderV4, 'specificationVersion' | 'languageModel'>

interface RuntimeModelDescriptorV1 {
  capabilities: RuntimeModelCapabilitiesV1
}

interface RuntimeProviderRegistrationV1 {
  providerId: string
  models: Readonly<Record<string, RuntimeModelDescriptorV1>>
  createProvider(): RuntimeLanguageProviderV4
}

interface RuntimeStreamPartInspection {
  runId: string
  stepId: string
  providerId: string
  modelId: string
  part: LanguageModelV4StreamPart
}

interface CreateRuntimeOptions {
  resolveProvider(providerId: string): RuntimeProviderRegistrationV1 | undefined
  inspect?: {
    streamPart?(inspection: RuntimeStreamPartInspection): void
  }
}
```

上述类型表达语义，不要求实现采用相同名称。

- `providerId` 是应用分配的 Provider Registration 标识，可以表示厂商 Provider、自建 LLM API 或代理网关，不要求等于厂商名称或 `LanguageModelV4.provider`。
- `models` 的 key **MUST** 是传给 `ProviderV4.languageModel(modelId)` 的真实模型 ID。v1 不定义应用模型别名或第二个 Provider model ID。
- Runtime **MUST** 在每个新 Run 开始时调用同步 resolver 一次；resolver 返回后，应用配置的变化不得改变该 Run 使用的 registration。Runtime v1 不拥有可变 Provider registry，也不公开动态注册或注销方法。
- Runtime **MUST** 在创建 Provider 前确认 registration ID 和模型 descriptor。未知 Provider 或未知模型必须以稳定安全错误拒绝。
- Resolver 返回的 registration，其 `providerId` **MUST** 与请求值一致。
- Runtime **MUST** 为当前 Run 调用无参 `createProvider()`，再调用 `provider.languageModel(modelId)`。返回值必须满足 V4 specification，且 `LanguageModelV4.modelId` 必须与请求的真实 `modelId` 一致。
- Send、Retry、Regenerate、Command、resolver 和 `createProvider()` **MUST NOT** 接收 credential。
- resolver、registration、factory、Provider 和 model **MUST NOT** 进入 Snapshot、历史或序列化 Command。
- Provider 集成层 **MUST** 使用具体 AI SDK Provider creator 处理 credential 和认证协议；Runtime **MUST NOT** 读取、复制、接收、记录或持久化 credential。
- Provider 与 model **MUST** 在 Run 结束后从 Runtime 执行状态中释放引用。
- API key、Authorization、cookie、raw headers 和带 query 的 endpoint URL **MUST NOT** 出现在 Domain Event、Snapshot、日志、fixture、错误或诊断中。
- Run **MUST** 冻结 `providerId`、真实 `modelId` 和模型 capabilities。`LanguageModelV4.provider` 不进入 v1 Snapshot；用户自定义标识在日志前仍需长度和字符限制。
- Provider Registration 是应用与接入实现之间的信任边界；应用 **MUST** 只解析其信任的实现。
- Provider Registration 维护者负责确认具体 mapping 与 endpoint 可从受支持浏览器直连。公开或启用该 registration 前 **MUST** 完成真实浏览器验证，并把 CORS、认证 header 和流式响应结果记录在 Provider conformance/live verification 资料中。

## 4. Capability descriptor

`LanguageModelV4` 不提供足够的能力发现。Provider Registration 中的每个模型 descriptor 当前保留以下 capability metadata：

```ts
interface RuntimeModelCapabilitiesV1 {
  streaming: boolean
  reasoning: boolean
}
```

- 当前 Runtime 只校验 descriptor 的结构并把 capability 复制到 Run；它不把 capability metadata 作为 resolver、factory、模型调用或入站 stream part 的准入条件。
- capability metadata 可供后续 UI 展示，但当前版本不承诺其默认开关、可控强度或 wire mapping 语义。
- 当前公共 Send 输入不包含 reasoning 控制字段，Runtime 不发送 `LanguageModelV4CallOptions.reasoning`；省略表示完全采用 Provider 默认行为。
- 标准 V4 reasoning part 是本次 Run 实际产生的事实，Guard 必须按其标准生命周期处理，不得因为 capability metadata 为 `false` 而丢弃。
- Registration 不得仅为了迎合 Runtime Domain 而改写已经符合本契约的标准 V4 part。应用拥有的 Provider Adapter 可以在 registration 边界内包装 model 或 `doStream()`，把具体服务尚未标准化的 wire/raw event 映射为经评审的标准 V4 part；该映射必须保持 part 顺序、terminal、显式 `error`、取消和背压语义，不得把 Runtime Domain Event 或 Snapshot 职责带入 Provider Adapter。文档站当前的 Responses adapter 只用聚焦回归证明 reasoning delta 映射；它不构成完整 conformance fixture 或 declared loss 证据。
- 当产品需要显式开启、关闭或选择 reasoning effort 时，必须重新设计可验证的控制 capability 与公共输入，不能从当前 boolean 推断。
- Chat Completions compatible endpoint **MUST** 逐服务声明模型语义能力；格式兼容不能推导 reasoning、usage 或 tool 能力。
- Provider Registration 维护者 **MUST** 在准入阶段验证浏览器直连，并以 conformance 测试、live verification 清单和支持文档记录证据。Provider mapping 的兼容转换与有损行为记录在 conformance evidence 中，不进入 Runtime capability 或 Snapshot。

## 5. 允许的 call options

Runtime **MUST** 从冻结的 Run 配置、Snapshot 历史、已注册工具和当前 `AbortSignal` 构造完整的 `LanguageModelV4CallOptions`。调用对象必须通过固定版本 `@ai-sdk/provider` 的类型检查；禁止字段必须保持不可由 Command、UI 或任意 consumer 输入表达，而不是先接受再清洗。

Runtime v1 可构造：

- `prompt`；
- `maxOutputTokens`；
- function `tools`；
- `toolChoice`；
- `abortSignal`。

Runtime v1 不公开以下跨 Provider 配置：

- `temperature`、`topP`、`topK`；
- frequency/presence penalty；
- stop sequences、seed；
- structured `responseFormat`；
- arbitrary `headers`；
- caller-supplied `providerOptions`；
- `includeRawChunks: true`。

Provider Registration 的 `createProvider` 可以在 Runtime 之外封装 Provider 特有默认值、endpoint 与认证行为，但这些值不构成 Runtime 公共协议。

Provider conformance **MUST** 同时验证允许的 `LanguageModelV4CallOptions` 被映射为预期的脱敏 wire request，且禁止字段不会由 Runtime 注入。验证过程中截获的原始 request、credential 和 authorization material 只能存在于测试进程内存，不得写入 fixture、日志或快照。

## 6. 允许的 prompt

v1 支持：

- system text；
- user text；
- assistant text；
- assistant reasoning；
- assistant function tool call replay；
- tool result：text、JSON、error text、error JSON、execution denied。

v1 暂缓：

- file、image、audio、video；
- reasoning file；
- custom part；
- provider tool；
- provider tool approval response；
- source/citation replay。

暂缓 part 出现在需要发送的历史中时 **MUST** 在 prompt projection 阶段 reject，不能静默删除后继续调用。

## 7. 允许的 stream parts

Runtime v1 **MUST** 通过 `doStream()` 消费模型调用；非流式 Provider 行为由 Provider 实现规范化为同一 stream-part 生命周期。Runtime 不维护第二套 `doGenerate()` Domain mapping。

Coordinator **MAY** 接收完整 `LanguageModelV4StreamResult`，但 Ingress Guard **MUST** 只消费源自 `result.stream` 的 part。Coordinator 可以在读取链路中插入 observer-only pass-through，不要求 Guard 接收同一个 `ReadableStream` 对象；该旁路必须把 part 原样、同序传递。`result.request`、`result.response` 及其 body/headers **MUST** 在该边界丢弃，不得传给 Domain Event、reducer、Snapshot、持久化、日志、fixture、诊断或 UI API。

应用显式配置 `inspect.streamPart` 时，Runtime **MAY** 在 Guard 投影前把每个 V4 part 及其 Run、Step、Provider、model 上下文交给该观察器。它是 observer-only 的瞬时诊断旁路：Runtime 不等待返回值、吞掉同步异常，并把同一个 part 原样、同序继续交给 Guard。观察器不能转换、删除或注入 part，也不能访问已在 coordinator 丢弃的 request/response。观察到的 part 可能包含 Provider metadata、warning、error 或 raw value；调用方拥有其诊断用途与处置责任。本地 Demo 可以显式打印完整 part 以展示实际输出，但必须说明敏感风险；生产日志或上报必须先建立 allowlist 并脱敏，任何 credential 都不得记录。

Ingress Guard v1 投影：

- `stream-start`；
- `response-metadata`；
- `text-start`、`text-delta`、`text-end`；
- `reasoning-start`、`reasoning-delta`、`reasoning-end`；
- `finish`；
- `error`，仅作为待清洗的边界输入。

以下 part 不进入 Domain：

- `raw`：始终丢弃；
- response request body、response body、headers：始终丢弃；
- `providerMetadata`：只允许第 10 节的 Run-local opaque continuation；
- tool、file、reasoning-file、source、custom content 以及未知未来 part：v1 忽略且不持久化。

忽略只代表 v1 没有为该 part 建立领域投影，不代表相应能力已实现。显式 `error` 必须清洗为稳定 Provider error 并使 Run `failed`；已投影 text/reasoning 的生命周期错误、缺少或重复 `finish`、不支持的 finish reason 以及 finish 后任意 part 仍是 protocol violation。

## 8. 顺序、ID 与组装

每次 `doStream()` 是一个 Model Step，并必须满足：

```text
doStream pending
  → stream-start exactly once
  → supported parts*
  → finish exactly once
```

`response-metadata` 可缺失，但同一字段重复出现时值必须一致。

允许的 metadata 只有 response ID、model ID 和 timestamp。response ID 与 model ID 必须匹配
`^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$`；不匹配的字段按 unavailable 处理。
timestamp 必须是有效 `Date`，并转换为 `-8_640_000_000_000_000` 到
`8_640_000_000_000_000` 范围内的整数 epoch milliseconds；无效字段按 unavailable
处理。Ingress Guard 只在当前 Model Step 内保留规范化 metadata，用于检查重复字段一致性；
它不把 metadata 写入 Domain Event、返回结果或 Runtime 自身的日志与诊断；显式 `inspect.streamPart` 仍可在 Guard 前观察原 part。两个有效的同名字段值不一致时
属于 protocol violation。

Text 与 reasoning：

```text
*-start(id)
  → *-delta(id)*
  → *-end(id)
```

Tool input：

```text
tool-input-start(id, toolName)
  → tool-input-delta(id)*
  → tool-input-end(id)
  → tool-call(toolCallId = id, toolName, input)
```

- ID 在同一 Model Step 内 **MUST** 唯一且稳定。
- Runtime Domain ID **MUST** 由 Runtime 生成；Provider ID 只作为 Step 内关联或经 allowlist 的诊断信息。
- text 或 reasoning 首次开始时，Ingress Guard **MUST** 通过 Runtime 提供的同步 Part ID 分配器取得新的
  Runtime Domain ID，并只在当前 Step 的内存映射中关联 Provider ID 与 Runtime Part ID。
  分配器返回空 ID 或当前 Step 已使用的 Runtime Part ID 时属于 protocol violation。
- delta 按 `ReadableStream` 到达顺序原样 append；不得 trim、重新 tokenize 或改变换行。
- 标准 reasoning 与 text 使用独立的 per-ID lifecycle，但共享当前 Model Step 的 Runtime Part ID 唯一性检查；两者均不受 capability metadata gate。
- V4 没有全局 sequence number；Ingress Guard 以观察顺序和 per-ID state machine 校验。
- start 前 delta、end 后 delta、重复 end、未知 ID、未关闭 part、finish 后 part 均为 protocol violation。
- tool input 在 final `tool-call` 前只作为字符串；final input 必须与累计字符串一致并解析为 JSON object，才能进入审批或执行。

## 9. Step 与 Run 终止

`finishReason.unified` 映射：

| V4 reason        | Model Step  | Run                                               |
| ---------------- | ----------- | ------------------------------------------------- |
| `stop`           | completed   | completed                                         |
| `tool-calls`     | completed   | 保持 active，进入工具审批/执行                    |
| `length`         | completed   | completed，termination=`max_output_tokens`        |
| `content-filter` | completed   | completed，termination=`content_filter`           |
| `error`          | failed      | failed                                            |
| `other`          | interrupted | interrupted，除非 registration 有已评审 allowlist |

终止优先级：

1. caller `AbortSignal`：Run `aborted`；
2. 明确且已清洗的 Provider error：Run `failed`；
3. exception、unexpected EOF、缺少 finish、结构未闭合或 protocol violation：Run `interrupted`；
4. 只有结构完整的 accepted finish 才可按表映射。

收到 `finish` 本身不足以证明成功。Guard 必须先验证所有打开 part 已关闭、tool input 已完成且没有先前 protocol violation。

`length` 和 `content-filter` 不新增 Run status；UI 通过 termination 和内容状态表达回答被截断或过滤。

## 10. Reasoning 与 opaque continuation

Readable reasoning 与 continuation metadata 是不同数据：

- 只有经评审的 Provider mapping 产生的标准 V4 reasoning part 才可形成 Domain `ReasoningPart`。
- Generic compatible endpoint 的 `reasoning_content`、`reasoning`、`thinking` 等字段不能自动声明为 summary。
- OpenAI encrypted reasoning、Anthropic signature/redacted block、Gemini thought signature 等 opaque 数据不得成为 Message Part。

为完成同一 Run 内的工具循环，Ingress Guard **MAY** 将 Provider output `providerMetadata` 保存到 Run-local continuation capsule，并在下一 Model Step 作为对应 prompt part 的 `providerOptions` 原样回传。

Continuation capsule：

- **MUST** 与原 Provider、model、Run、part 绑定；
- **MUST NOT** 被 Runtime、日志或诊断解释；
- **MUST NOT** 进入 Snapshot、持久化、fixture 或组件 API；
- **MUST** 在 Run 结束、abort、failure 或 page recovery 时丢弃；
- 缺失 capsule 导致无法安全续接时，Run 必须 `interrupted` 或在下一调用前 reject。

## 11. Unknown、warning 与 lossy mapping

- 未知 `LanguageModelV4StreamPart.type`：Guard 忽略且不持久化，不形成 Domain Event 或错误；显式 inspector 仍可观察原 part。
- 已知 part 上的未知字段：默认忽略且不持久化；若改变安全、关联或终止语义则 protocol violation。
- `raw`：无条件丢弃，不做 Domain mapping。
- `error`：不得按未知内容忽略；必须清洗为稳定安全错误并使 Run `failed`。
- Provider wire 层的未知事件由所采用的 AI SDK Provider 负责；需要 raw chunk 完成规范化的 Provider adapter 必须自行请求并映射，不得依赖 Runtime 或 inspector 配置。package upgrade 和 raw-to-V4 conformance 是信任边界的一部分。
- `SharedV4Warning` 的自由文本 `details/message` 不得直接显示、持久化或上报；只允许映射为 Tiny Robot 稳定 warning code。
- 未声明的有损转换 **MUST** reject；已声明 loss 必须以稳定 code 出现在 Provider conformance evidence、manifest 和支持文档中，不得写入 Runtime capability 或 Snapshot。

## 12. Error 与 usage

Ingress Guard 不得把 `error: unknown` 或 thrown value 直接传播到 Runtime。

安全错误只包含：

```ts
interface RuntimeProviderErrorV1 {
  category:
    | 'aborted'
    | 'authentication'
    | 'permission'
    | 'rate_limit'
    | 'invalid_request'
    | 'unavailable'
    | 'timeout'
    | 'transport'
    | 'protocol'
    | 'unknown'
  code: string
  retryable: boolean
  httpStatus?: number
}
```

- `code` 必须来自 adapter/guard allowlist，不能复制 Provider 动态 code 或 message。
- error message、response body、headers、request body、stack 和 cause 不得进入 Domain 或诊断。
- usage 中缺失值保持 unavailable，不能写成 0。
- `usage.raw` 不进入 Runtime。
- final usage 可以映射 input、output、reasoning、cache read/write token；Provider 未提供的值保持 unavailable，不能根据模型名称或格式兼容性推断。
- usage 数值只有在 `0` 到 `Number.MAX_SAFE_INTEGER` 范围内且为整数时才可映射；无效值按
  unavailable 处理，合法的 `0` 必须保留。

## 13. Tool lifecycle 与审批

```text
Model Step emits client tool-call
  → Runtime creates Domain ToolCall
  → Runtime evaluates risk and approval requirement
  → user approval when required
  → Runtime invokes registered tool
  → Runtime records tool result
  → next Model Step receives tool-result plus Run-local continuation
```

- V4 tool call 只表达模型请求，不表示已经获批或执行。
- 工具实现、credential 和审批策略不属于 Provider ABI。
- `providerExecuted: true`、dynamic/provider tools 和 Provider approval flow 在 v1 reject。
- 写入或破坏性工具仍必须遵守 Runtime 人工审批契约。

## 14. 持久化、日志与诊断

允许进入 Snapshot/持久化：

- Runtime Domain IDs；
- 最终 text、允许展示的 reasoning summary；
- 规范化 ToolCall arguments、approval 和 result；
- 应用定义的 `providerId` 与真实 `modelId`；
- normalized usage、termination、error category/code；
- boundary version 与恢复行为所需的 capability snapshot。

不得进入 Runtime 管理的 Snapshot、持久化、日志、fixture、URL 或错误上报：

- credential、Authorization、cookies；
- raw request/response headers 或 body；
- raw V4 chunk、SDK object、thrown error；
- arbitrary provider metadata/options；
- opaque continuation、encrypted reasoning、signature；
- 未 opt-in 的用户内容、工具参数或结果。

Runtime 自身的诊断采用 allowlist 生成结构化字段，不允许依靠字符串替换做脱敏。`inspect.streamPart` 是应用负责的瞬时观察入口，Runtime 不得缓存、重放或自动写入日志。应用可以为明确披露的本地调试主动记录完整 part；生产日志或上报仍必须先建立 allowlist 并脱敏。

## 15. Conformance fixtures

首期每种格式至少提供脱敏 fixture：

1. non-stream text；
2. single/multiple/empty text delta；
3. single 与 parallel tool calls；
4. split arguments、malformed JSON、final mismatch；
5. reasoning present/absent；
6. usage complete/missing；
7. normal stop、tool calls、length、content filter、error、other；
8. pre-stream non-2xx；
9. mid-stream error；
10. abort before first delta 与 mid-stream abort；
11. abrupt EOF、missing end、duplicate end、finish 后 part；
12. unknown V4 part；
13. capability metadata 与 Provider declared loss；
14. credential canary。

测试必须覆盖三个方向，并保持 fixture/断言边界独立：

1. Snapshot/冻结 Run 配置 → exact allowed `LanguageModelV4CallOptions`；
2. constructed `LanguageModelV4CallOptions` → sanitized Provider wire request，且 sanitized Provider HTTP/SSE fixture → exact `LanguageModelV4StreamPart`；
3. constructed `LanguageModelV4StreamPart` → exact Domain Events、Run terminal state 与 Snapshot。

第 2 层可在测试进程内通过受控 transport/fetch 截获请求，但 checked-in fixture 只能保存经过 allowlist 生成的请求语义和 redaction manifest，不能保存 credential、Authorization、cookie、带 query 的 endpoint URL 或原始 headers/body。

每项 fixture 记录 Provider/API 格式、AI SDK package/version、constructed 或 sanitized recording、redaction manifest 和 expected observable result。

Compliance tests 至少断言：

- exact allowed call options 及禁止字段不可表达；
- prompt、tool declaration、tool choice、reasoning、output limit 与 abort 的 wire request 映射；
- exact accepted part order；
- per-ID state transition；
- text/tool delta assembly；
- exactly one accepted finish；
- terminal 后无事件；
- Step 与 Run mapping；
- unknown/loss policy；
- abort、failed、interrupted 不混淆；
- credential canary 不出现在 serialized Domain Event、Snapshot、diagnostic 或 error；
- OpenAI Responses 与 Chat Completions compatible 的等价 fixture 得到等价 Domain observable result。

## 16. 首期 Provider mapping

### OpenAI Responses

使用 `@ai-sdk/openai` 的 Responses model。Tiny Robot 验证允许的 V4 prompt、output limit、reasoning、function tools、tool choice 与 tool result 被映射为预期的脱敏 Responses request 语义，同时验证 text、reasoning summary、function tool call、usage、finish 和 abort 的 V4 输出；不重复实现 OpenAI semantic event parser。

OpenAI Responses 新增 hosted tool、compaction、background 或其他 custom content 时，除非本契约升级，否则不会进入 Domain；出站 projection 不构造这些能力，Ingress Guard 忽略对应内容 part。

当 `@ai-sdk/openai` 用于第三方 Responses endpoint 且真实模型 ID 不属于其内建 OpenAI reasoning-model 目录时，application-owned registration **MUST NOT** 包装 `doStream()` 注入 `openai.forceReasoning`。无法证明标准 `reasoning` 值由 Provider 直接映射时，该 registration 必须声明 `reasoning: false`。

### DeepSeek Native Chat Completions

DeepSeek 原生 Chat Completions 使用官方 `@ai-sdk/deepseek` Provider。Registration 直接返回 Provider；Runtime 仍只调用其 `LanguageModelV4.doStream()`，不引入 `ai` Core，也不维护 DeepSeek wire parser。

### OpenAI Chat Completions compatible

使用 `@ai-sdk/openai-compatible`。每个具体 endpoint 仍需由 Provider 维护者登记并验证：

- 安全 base URL 标识，以及真实浏览器中的 CORS、认证 header 和流式响应结果；
- 允许的 V4 call options 如何映射为该 endpoint 的脱敏 request 语义；
- tool call ID 与 indexed delta 行为；
- usage 是否存在；
- finish reason 集合；
- reasoning 私有字段的语义；
- structured output 和其他扩展是否有损。

Generic compatible adapter 不得把任意 `reasoning_content` 自动声明为用户可见 reasoning summary。

## 17. 明确暂缓与拒绝

暂缓：attachments/多模态、citations、structured output、logprobs、hosted tools、MCP、provider tool approval、provider-managed conversation、background/WebSocket、AG-UI、UIMessage。

拒绝：

- Provider wire object 或未清洗 V4 object 进入 Runtime Domain、Snapshot 或 UI 公共 API；显式 `inspect.streamPart` 除外；
- arbitrary headers/providerOptions 从 UI 进入 model call；
- 静默删除已请求的标准调用参数或执行 lossy mapping；
- 未完成或无法关联的 tool call 进入审批/执行；
- raw error/header/body/metadata 进入可序列化状态；
- 把 abort、unexpected EOF、`other` 或结构不完整的 stream 伪装为正常完成。

### 设计问答：为什么 Runtime v1 不使用 AI SDK Core `streamText()`？

**问：** 能否用 `streamText()` 包装已经解析的 `LanguageModelV4`，由它承担模型调用和多步工具循环？

**答：** 当前 v1 不采用 `streamText()`，也不增加它的包装层；Runtime 继续直接调用 `LanguageModelV4.doStream()`。评估确认 `streamText()` 能接收 V4 model 并执行工具循环，但它不替代 Tiny Robot 的领域和安全边界：

- AI SDK step 把一次模型调用及其触发的本地工具执行放在同一生命周期中，而 Tiny Robot 需要独立的 Model Step 与 Tool Step，用于审批、拒绝、失败、恢复和审计；
- 需要用户审批的工具不能在一次 `streamText()` 调用内暂停并恢复，批准或拒绝必须通过后续调用继续；
- `fullStream`、steps 和 callbacks 仍可能携带 Provider metadata、response headers、raw usage、未清洗 error 和 Provider-owned ID；
- Provider stream 在产生部分输出后无 `finish` 结束、自动 retry 等行为，与本契约要求的严格顺序和 canonical terminal 语义不同；
- 当前仓库没有锁定或安装 `ai` Core；引入它还需要独立验证浏览器 bundle、运行环境、tree-shaking 和依赖边界。

因此必须保留 Runtime Ingress Guard、Domain Event 投影、Runtime-owned ID、reducer，以及 `Step.kind = 'tool'`。未来只有在锁定精确 Core 版本、完成 fake V4 conformance 与安全 canary、验证跨调用审批，并证明公共契约无需接收 SDK message object 或 Provider 私有状态后，才重新评估受限 wrapper。

## 18. 规范引用

- [AI SDK Provider architecture](https://github.com/vercel/ai/blob/main/content/docs/02-foundations/02-providers-and-models.mdx)
- [AI SDK Core `streamText()` implementation (`ai@7.0.133`)](https://github.com/vercel/ai/blob/ai%407.0.133/packages/ai/src/generate-text/stream-text.ts)
- [AI SDK Core `streamText()` tests (`ai@7.0.133`)](https://github.com/vercel/ai/blob/ai%407.0.133/packages/ai/src/generate-text/stream-text.test.ts)
- [LanguageModelV4 call options](https://github.com/vercel/ai/blob/main/packages/provider/src/language-model/v4/language-model-v4-call-options.ts)
- [LanguageModelV4 stream parts](https://github.com/vercel/ai/blob/main/packages/provider/src/language-model/v4/language-model-v4-stream-part.ts)
- [OpenAI Responses streaming events](https://developers.openai.com/api/reference/resources/responses/streaming-events)
- [OpenAI Chat Completions streaming events](https://developers.openai.com/api/reference/resources/chat/subresources/completions/streaming-events)
- [Anthropic streaming messages](https://platform.claude.com/docs/en/build-with-claude/streaming)
- [Gemini function calling](https://ai.google.dev/gemini-api/docs/generate-content/function-calling)
- [Gemini thought signatures](https://ai.google.dev/gemini-api/docs/generate-content/thought-signatures)

Live Provider 文档用于 mapping review，不会隐式扩大本文允许子集。升级只有在完成第 2 节门禁后生效。
