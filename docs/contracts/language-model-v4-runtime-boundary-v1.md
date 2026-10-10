# LanguageModelV4 Runtime Boundary Contract v1

本文定义 Tiny Robot Provider 实现与 Runtime 之间的模型调用边界。它是可评审、可版本化的公共契约，不是 implementation plan，也不是 Runtime Domain Model。

本文使用 **MUST**、**MUST NOT**、**SHOULD**、**MAY** 表示强制、禁止、推荐和可选约束。

## 1. 决策与分层

```text
Snapshot / frozen Run config
  ↓ capability preflight + allowlist projection
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

一次 Model Step 的 Provider ABI 同时包含出站请求和入站响应：Runtime 构造允许的 `LanguageModelV4CallOptions`，调用 `LanguageModelV4.doStream()`，然后只把 `LanguageModelV4StreamResult.stream` 交给 Ingress Guard。`LanguageModelV4StreamResult.request` 与 `.response` 是 Provider 调试数据，不属于 Runtime 入站协议。

## 2. 上游基线与升级

v1 固定：

- `LanguageModelV4.specificationVersion === 'v4'`；
- build 与 conformance baseline：`@ai-sdk/provider@4.0.25`；
- 首期已研究的 Provider baseline：
  - `@ai-sdk/openai@4.0.89`；
  - `@ai-sdk/openai-compatible@3.0.66`；
  - `@ai-sdk/anthropic@4.0.76`；
  - `@ai-sdk/google@4.0.92`。

首期交付只要求 OpenAI Responses 与 OpenAI Chat Completions compatible；Anthropic 和 Gemini baseline 用于检验抽象，不代表首期实现承诺。

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

## 3. Model registration 与凭据边界

Runtime 接收的是 Run-local model factory，而不是可持久化 Provider 配置：

```ts
interface RuntimeModelRegistrationV1 {
  id: string
  createModel(context: RuntimeModelContextV1): LanguageModelV4
  capabilities: RuntimeModelCapabilitiesV1
}

interface RuntimeModelContextV1 {
  credential?: unknown
}
```

上述类型表达语义，不要求实现采用相同名称。

- factory、model、credential **MUST NOT** 进入 Snapshot、历史或序列化 Command。
- 带凭据的 model **MUST** 为当前 Run 创建，并在 Run 结束后释放引用。
- Runtime **MUST NOT** 读取、复制、记录或持久化 credential。
- API key、Authorization、cookie、raw headers 和带 query 的 endpoint URL **MUST NOT** 出现在 Domain Event、Snapshot、日志、fixture、错误或诊断中。
- `model.provider` 和 `model.modelId` 可作为非敏感标识进入冻结 Run 配置；用户自定义值在日志前仍需长度和字符限制。
- registration 是能够接收 Run-local credential 并选择目标 endpoint 的 Provider 扩展，也是应用与 Provider 之间的信任边界；应用 **MUST** 只注册其信任的实现。
- Provider registration 维护者负责确认具体 mapping 与 endpoint 可从受支持浏览器直连。公开或启用该 registration 前 **MUST** 完成真实浏览器验证，并把 CORS、认证 header 和流式响应结果记录在 Provider conformance/live verification 资料中。

## 4. Capability descriptor

`LanguageModelV4` 不提供足够的能力发现。每个 registration **MUST** 声明 Runtime 构造模型调用时需要依赖的模型语义能力：

```ts
interface RuntimeModelCapabilitiesV1 {
  streaming: 'native' | 'emulated' | 'unsupported'
  functionTools: 'native' | 'emulated' | 'unsupported'
  parallelToolCalls: 'supported' | 'unsupported' | 'unknown'
  toolChoice: ReadonlyArray<'auto' | 'none' | 'required' | 'named'>
  reasoningRequest: 'supported' | 'unsupported' | 'unknown'
  visibleReasoning: 'summary' | 'none'
  opaqueContinuation: 'run-local' | 'none'
  usage: 'complete' | 'partial' | 'unavailable'
  knownLosses: ReadonlyArray<RuntimeMappingLossV1>
}

interface RuntimeMappingLossV1 {
  code: string
  feature: string
  consequence: string
}
```

- required capability 为 `unsupported` 或 `unknown` 时 **MUST** 在调用前 reject。
- `emulated` 和每项 loss **MUST** 可由稳定 code 诊断，不能只有自由文本。
- Chat Completions compatible endpoint **MUST** 逐服务声明模型语义能力；格式兼容不能推导 reasoning、usage 或 tool 能力。
- Provider registration 维护者 **MUST** 在准入阶段验证浏览器直连，并以 conformance 测试、live verification 清单和支持文档记录证据。`RuntimeModelCapabilitiesV1` 只描述构造和解释模型调用所需的语义能力。

## 5. 允许的 call options

Runtime **MUST** 从冻结的 Run 配置、Snapshot 历史、已注册工具和当前 `AbortSignal` 构造完整的 `LanguageModelV4CallOptions`。调用对象必须通过固定版本 `@ai-sdk/provider` 的类型检查；禁止字段必须保持不可由 Command、UI 或任意 consumer 输入表达，而不是先接受再清洗。

Runtime v1 可构造：

- `prompt`；
- `maxOutputTokens`；
- function `tools`；
- `toolChoice`；
- `reasoning`；
- `abortSignal`。

Runtime v1 不公开以下跨 Provider 配置：

- `temperature`、`topP`、`topK`；
- frequency/presence penalty；
- stop sequences、seed；
- structured `responseFormat`；
- arbitrary `headers`；
- caller-supplied `providerOptions`；
- `includeRawChunks: true`。

Provider factory 可以在 Runtime 之外封装 Provider 特有默认值，但这些值不构成 Runtime 公共协议。

Provider conformance **MUST** 同时验证允许的 `LanguageModelV4CallOptions` 被映射为预期的脱敏 wire request，且禁止字段不会由 Runtime 注入。验证过程中截获的原始 request、credential 和 authorization material 只能存在于测试进程内存，不得写入 fixture、日志或快照。

## 6. 允许的 prompt

v1 支持：

- system text；
- user text；
- assistant text；
- assistant reasoning summary，仅当 capability 为 `visibleReasoning: summary`；
- assistant function tool call replay；
- tool result：text、JSON、error text、error JSON、execution denied。

v1 暂缓：

- file、image、audio、video；
- reasoning file；
- custom part；
- provider tool；
- provider tool approval response；
- source/citation replay。

暂缓 part 出现在需要发送的历史中时 **MUST** capability reject，不能静默删除后继续调用。

## 7. 允许的 stream parts

Runtime v1 **MUST** 通过 `doStream()` 消费模型调用；非流式 Provider 行为由 Provider 实现规范化为同一 stream-part 生命周期。Runtime 不维护第二套 `doGenerate()` Domain mapping。

Coordinator **MAY** 接收完整 `LanguageModelV4StreamResult`，但 **MUST** 仅把 `result.stream` 传给 Ingress Guard。`result.request`、`result.response` 及其 body/headers **MUST** 在该边界丢弃，不得传给 Domain Event、reducer、Snapshot、持久化、日志、fixture、诊断或 UI API。

Ingress Guard v1 接受：

- `stream-start`；
- `response-metadata`；
- `text-start`、`text-delta`、`text-end`；
- `reasoning-start`、`reasoning-delta`、`reasoning-end`；
- `tool-input-start`、`tool-input-delta`、`tool-input-end`；
- client-executed `tool-call`；
- `finish`；
- `error`，仅作为待清洗的边界输入。

以下 part 不进入 Domain：

- `raw`：始终丢弃；
- response request body、response body、headers：始终丢弃；
- `providerMetadata`：只允许第 10 节的 Run-local opaque continuation；
- file、reasoning-file、source、custom content：v1 reject；
- provider-executed/dynamic tool call、provider tool result、tool approval request：v1 reject。

## 8. 顺序、ID 与组装

每次 `doStream()` 是一个 Model Step，并必须满足：

```text
doStream pending
  → stream-start exactly once
  → supported parts*
  → finish exactly once
```

`response-metadata` 可缺失，但同一字段重复出现时值必须一致。

允许的 metadata 只有通过字符和长度约束的 response ID、model ID，以及转换为 epoch milliseconds 的有效 timestamp；其他字段不得进入 Domain。

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
- delta 按 `ReadableStream` 到达顺序原样 append；不得 trim、重新 tokenize 或改变换行。
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

- 只有 registration 声明 `visibleReasoning: summary` 时，reasoning delta 才可形成 Domain `ReasoningPart`。
- Generic compatible endpoint 的 `reasoning_content`、`reasoning`、`thinking` 等字段不能自动声明为 summary。
- OpenAI encrypted reasoning、Anthropic signature/redacted block、Gemini thought signature 等 opaque 数据不得成为 Message Part。

为完成同一 Run 内的工具循环，Ingress Guard **MAY** 将 Provider output `providerMetadata` 保存到 Run-local continuation capsule，并在下一 Model Step 作为对应 prompt part 的 `providerOptions` 原样回传。

Continuation capsule：

- **MUST** 与原 Provider、model、Run、part 绑定；
- **MUST NOT** 被 Runtime、日志或诊断解释；
- **MUST NOT** 进入 Snapshot、持久化、fixture 或组件 API；
- **MUST** 在 Run 结束、abort、failure 或 page recovery 时丢弃；
- 缺失 capsule 导致无法安全续接时，Run 必须 `interrupted` 或下一调用 capability reject。

## 11. Unknown、warning 与 lossy mapping

- 未知 `LanguageModelV4StreamPart.type`：protocol violation，Run `interrupted`。
- 已知 part 上的未知字段：默认忽略且不持久化；若改变安全、关联或终止语义则 protocol violation。
- `raw`：无条件丢弃，不做 Domain mapping。
- Provider wire 层的未知事件由所采用的 AI SDK Provider 负责。Tiny Robot 无法在 `includeRawChunks: false` 时证明其存在，因此 package upgrade 和 raw-to-V4 conformance 是信任边界的一部分。
- `SharedV4Warning` 的自由文本 `details/message` 不得直接显示、持久化或上报；只允许映射为 Tiny Robot 稳定 warning code。
- 未声明的有损转换 **MUST** reject；已声明 loss 必须出现在 capability descriptor 和文档中。

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
- final usage 可以映射 input、output、reasoning、cache read/write token；是否完整由 capability descriptor 标明。

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
- Provider/model 非敏感标识；
- normalized usage、termination、error category/code；
- boundary version 与恢复行为所需的 capability snapshot。

任何模式下不得进入 Snapshot、持久化、日志、fixture、URL 或错误上报：

- credential、Authorization、cookies；
- raw request/response headers 或 body；
- raw V4 chunk、SDK object、thrown error；
- arbitrary provider metadata/options；
- opaque continuation、encrypted reasoning、signature；
- 未 opt-in 的用户内容、工具参数或结果。

诊断采用 allowlist 生成结构化字段，不允许依靠字符串替换做脱敏。

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
13. capability reject 与 declared loss；
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

OpenAI Responses 新增 hosted tool、compaction、background 或其他 custom content 时，除非本契约升级，否则必须 capability reject 或由 Ingress Guard 拒绝，不能自动进入 Domain。

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

- Provider wire object 或未清洗 V4 object 进入 Runtime/UI 公共 API；
- arbitrary headers/providerOptions 从 UI 进入 model call；
- 静默 capability downgrade 或 lossy mapping；
- 未完成或无法关联的 tool call 进入审批/执行；
- raw error/header/body/metadata 进入可序列化状态；
- 把 abort、unexpected EOF、`other` 或结构不完整的 stream 伪装为正常完成。

## 18. 规范引用

- [AI SDK Provider architecture](https://github.com/vercel/ai/blob/main/content/docs/02-foundations/02-providers-and-models.mdx)
- [LanguageModelV4 call options](https://github.com/vercel/ai/blob/main/packages/provider/src/language-model/v4/language-model-v4-call-options.ts)
- [LanguageModelV4 stream parts](https://github.com/vercel/ai/blob/main/packages/provider/src/language-model/v4/language-model-v4-stream-part.ts)
- [OpenAI Responses streaming events](https://developers.openai.com/api/reference/resources/responses/streaming-events)
- [OpenAI Chat Completions streaming events](https://developers.openai.com/api/reference/resources/chat/subresources/completions/streaming-events)
- [Anthropic streaming messages](https://platform.claude.com/docs/en/build-with-claude/streaming)
- [Gemini function calling](https://ai.google.dev/gemini-api/docs/generate-content/function-calling)
- [Gemini thought signatures](https://ai.google.dev/gemini-api/docs/generate-content/thought-signatures)

Live Provider 文档用于 mapping review，不会隐式扩大本文允许子集。升级只有在完成第 2 节门禁后生效。
