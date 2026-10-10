# LanguageModelV4 Runtime Boundary Contract v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:test-driven-development` for each implementation task and `superpowers:subagent-driven-development` (only if delegation is explicitly authorized) or `superpowers:executing-plans` to execute this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. This plan is temporary, must not be committed by default, and must be deleted when the implementation is complete unless a maintainer asks to keep it.

**Goal:** 在浏览器优先、BYOK 的 Tiny Robot Runtime 中实现已批准的 LanguageModelV4 Boundary v1，使 OpenAI Responses 与 OpenAI Chat Completions compatible 通过统一 `doStream()` 生命周期产生受校验、可归约、可恢复且不会泄漏凭据的多 Step Run，并用 DeepSeek 的 Chat Completions、Responses、Anthropic-compatible 三种 API 格式验证 Provider ABI 抽象。

**Architecture:** 新建独立的 Runtime package 承载公共 Domain/Command/Snapshot API、出站 CallOptions allowlist projection、Ingress Guard、reducer 与 Run coordinator；新建独立的 OpenAI Provider package，只负责创建符合固定 V4 ABI 的 Run-local model registration。Domain/Run→V4 CallOptions、V4 CallOptions→wire request、wire response→V4 StreamPart、V4 StreamPart→Domain Event、Domain Event→Snapshot 分层测试；DeepSeek 三种 wire formats 使用各自 AI SDK Provider 做 test-only conformance，不新增首期 Anthropic 公共 Provider export，Runtime 不复用现有 OpenAI-shaped `packages/kit/src/message` 状态模型。

**Tech Stack:** Node.js 22+、TypeScript 5.8、pnpm 10、Vitest、tsup、TypeDoc 0.28.20、`@ai-sdk/provider@4.0.25`、`@ai-sdk/openai@4.0.89`、`@ai-sdk/openai-compatible@3.0.66`、validation-only `@ai-sdk/anthropic@4.0.76`、Vite browser build、Vue 3.4+ consumer、Angular 20+ consumer。

**Spec:** `docs/contracts/language-model-v4-runtime-boundary-v1.md`

## Global Constraints

- `LanguageModelV4.specificationVersion` 必须为 `'v4'`；Runtime 只通过 `doStream()` 消费 stream parts。
- 一次 Model Step 的 ABI 同时包含出站 `LanguageModelV4CallOptions` 和入站 `LanguageModelV4StreamResult.stream`；完整 result 的 request/response 调试数据不得进入 Ingress Guard。
- 一次 `LanguageModelV4` 调用等于一个 Model Step；一个 Run 可以包含多个 Model Step。
- 首期 Provider 仍只实现 OpenAI Responses 与 OpenAI Chat Completions compatible；`@ai-sdk/anthropic@4.0.76` 仅用于 DeepSeek Anthropic-compatible wire→V4 和抽象验证，不形成公开 Anthropic registration、生产依赖或首期支持承诺；Gemini 仍只用于抽象审查。
- DeepSeek 必须分别验证 Chat Completions、Responses、Anthropic-compatible 三种 API 格式；三者只比较 v1 共同子集，格式特有或被服务端忽略的字段必须记录 declared loss 或 reject，不能据此扩大 Runtime allowlist。
- Runtime 不依赖 Vue、Angular、DOM、UIMessage 或 Provider wire object；Vue 3.4+、Angular 20+ 仅参与 consumer 类型与构建门禁。
- Runtime 运行在浏览器，BYOK credential、model 与 opaque continuation 都是 Run-local；Run 结束、失败、中止或恢复时必须释放。
- credential、headers、raw request/response、raw chunks、SDK object、未清洗 error/warning/metadata 不得进入 Domain Event、Snapshot、持久化、日志、fixture、诊断或 UI API。
- 同一 Conversation 最多一个 active Run；不同 Conversation 可以并行。
- hosted/provider-executed/dynamic tools、MCP、多模态、structured output、citations、AG-UI 与 Provider approval flow 必须 reject，不能静默降级。
- TypeScript consumer 门禁必须使用 5.8、`skipLibCheck: false`，并证明 `json-schema` 与 `@types/node` 不会作为未声明依赖泄漏。
- Runtime 的全部公共导出、公共属性和公共方法必须使用英文 TSDoc 描述外部可观察语义；TypeDoc 缺失文档、无效链接或生成警告必须使验证失败。
- 测试只保留公共契约、主要验收行为和重要安全/协议回归；调查性测试、私有调用序列断言、日志与临时计数器在任务结束前删除。
- 本计划不授权创建 package、添加生产依赖、修改公共导出或安全/审批策略；相应任务必须先通过下述人工门禁。
- 不自动 `git add`、commit、push 或发布；每个任务末尾以人工 review checkpoint 代替 commit。

## Repository Baseline and Reuse Decision

- 当前 `next` 只有 `components`、`chat`、`kit`、`svgs` 等既有 package，没有下一代 Runtime/Provider package。
- `packages/kit/src/message/core/engine.ts`、`packages/kit/src/message/types.ts` 与 `packages/chat/src/runtime/` 直接使用 OpenAI Chat Completion shape、Vue refs、mutable message state、headers/apiKey 配置；它们只能作为迁移行为参考，不能被新 Runtime 的 Domain 类型或 Provider 边界导入。
- 可复用模式：`packages/kit` 的 `tsup + Vitest` package 构建方式、`AsyncIterable`/`AbortSignal` 辅助函数思路、`packages/test` 的 Chromium 基础设施、现有 Node 22 CI。
- 不直接复用：`packages/kit/src/providers/openai.ts` 与 `packages/chat/src/runtime/provider/responseProvider.ts`。二者会保存 credential/header、拼装 wire request、传播 response text/error message，违反 v1 安全边界。
- 根目录没有受版本控制的 lockfile；依赖门禁必须记录安装产生的实际仓库策略，不能假设可提交 `pnpm-lock.yaml`。
- 现有 root/components/chat TypeScript 多为 5.2 且 `skipLibCheck: true`；新 package 与 consumer gate 必须独立固定 TypeScript 5.8 且关闭 `skipLibCheck`，不能以现状替代。
- Node 22 已用于 PR CI；自动发布使用 Node 24。新 package 加入构建/发布矩阵仍是独立人工审批事项。
- 2026-10-09 核对的 DeepSeek 官方资料声明 `/chat/completions`、`/responses` 与 `https://api.deepseek.com/anthropic` 三种格式；该事实只冻结验证范围，能力结论仍由 sanitized fixtures 与真实浏览器检查给出。

## Proposed File Map

以下路径是本计划建议，执行前须通过 Gate A；若维护者拒绝新 package，应停止并重写计划，不能把同样代码直接塞进 `kit`。

```text
packages/runtime/
  package.json
  tsconfig.json
  vitest.config.ts
  typedoc.json
  src/index.ts
  src/model/types.ts
  src/domain/types.ts
  src/commands/types.ts
  src/runtime/types.ts
  src/runtime/createRuntime.ts
  src/execution/runCoordinator.ts
  src/execution/modelCallProjection.ts
  src/execution/promptProjection.ts
  src/execution/capabilityPreflight.ts
  src/boundary/ingressGuard.ts
  src/boundary/assemblers.ts
  src/boundary/normalization.ts
  src/boundary/continuationCapsule.ts
  src/domain/events.ts
  src/domain/reducer.ts
  src/tools/registry.ts
  src/tools/execution.ts
  src/persistence/serialize.ts
  test/public-exports.test.ts
  test/capability-preflight.test.ts
  test/prompt-projection.test.ts
  test/ingress-guard/*.test.ts
  test/reducer/*.test.ts
  test/integration/*.test.ts
  test/security/credential-canary.test.ts
  test/fixtures/v4/*.ts

packages/provider-openai/
  package.json
  tsconfig.json
  vitest.config.ts
  src/index.ts
  src/responses.ts
  src/compatible.ts
  src/capabilities.ts
  test/responses-conformance.test.ts
  test/compatible-conformance.test.ts
  test/deepseek-three-format-validation.test.ts
  test/helpers/deepseekAnthropicValidation.ts
  test/fixtures/responses/*
  test/fixtures/compatible/*
  test/fixtures/deepseek/chat-completions/*
  test/fixtures/deepseek/responses/*
  test/fixtures/deepseek/anthropic/*
  test/live/README.md

tests/consumers/
  typescript-5.8/
  vue-3.4/
  angular-20/
  browser-bundle/

docs/contributing/
  public-api-documentation.md
```

后续任务 `Files` 中以 `src/` 或 `test/` 开头的路径均相对于 `packages/runtime/`；Task 11–13 中明确讨论 Provider registration/conformance 的 `src/`、`test/` 路径均相对于 `packages/provider-openai/`。花括号表示逐个创建所列文件，不表示执行时依赖 shell glob。所有其他路径均从仓库根目录解析。

## Public Interface Gate

在 Task 1 写实现前，维护者必须批准下面的公共 surface；名称调整必须在此门禁完成，不能在后续任务中随意漂移。

```ts
export interface RuntimeModelContextV1 {
  readonly credential?: unknown
}

export interface RuntimeModelRegistrationV1 {
  readonly id: string
  readonly createModel: (context: RuntimeModelContextV1) => LanguageModelV4
  readonly capabilities: RuntimeModelCapabilitiesV1
}

export interface TinyRobotRuntime {
  getSnapshot(): RuntimeSnapshot
  subscribe(listener: (snapshot: RuntimeSnapshot) => void): () => void
  dispatch(command: RuntimeCommand): Promise<void>
  send(input: SendInput): Promise<void>
  abort(conversationId: string): Promise<void>
  retryLastRun(conversationId: string): Promise<void>
  regenerateLastResponse(conversationId: string): Promise<void>
  approveToolCall(toolCallId: string): Promise<void>
  denyToolCall(toolCallId: string): Promise<void>
}
```

在 Runtime 发布声明中，AI SDK 类型只允许通过 registration factory 暴露 `LanguageModelV4`；Runtime 内部 boundary 模块可以使用 `LanguageModelV4CallOptions`、`LanguageModelV4StreamResult` 与 `LanguageModelV4StreamPart`。Snapshot、Command（序列化形态）、Domain Event 与组件 API 不得引用任何 AI SDK 类型。

## Human Approval Gates

- **Gate A — package topology:** 批准新增 `@opentiny/tiny-robot-runtime`、`@opentiny/tiny-robot-provider-openai` 与 private consumer fixtures；同时批准构建、版本、发布脚本如何识别它们。
- **Gate B — dependencies/toolchain:** 批准固定 `@ai-sdk/provider@4.0.25`（Runtime peer + dev）、`@ai-sdk/openai@4.0.89` 与 `@ai-sdk/openai-compatible@3.0.66`（Provider production）、`@ai-sdk/anthropic@4.0.76`（validation-only dev dependency）、`typedoc@0.28.20`（Runtime dev-only documentation gate）、TypeScript 5.8 和 Node 22+ 门禁；确认无 lockfile 仓库策略。
- **Gate C — public API/export:** 批准上述 registration、capability、Snapshot、Command 与 `TinyRobotRuntime` 导出位置；这是 `docs/contracts/runtime.md` 所要求的单独公共契约评审。
- **Gate D — security/tool approval:** 批准 credential 输入责任、错误 code allowlist、tool risk/approval policy、diagnostic allowlist、compatible endpoint URL/query 处理。
- **Gate E — Provider truth claims:** OpenAI 与 DeepSeek 每个格式/endpoint 的浏览器直连、CORS、reasoning、usage、tools、model mapping 与 known losses 必须逐服务人工确认；DeepSeek Anthropic-compatible 自动 model mapping、ignored fields 与格式差异必须在 manifest 中显式记录。Provider 维护者只可在真实浏览器验证成功后把对应 registration 加入支持范围。
- **Gate F — release integration:** 批准新 package 加入 `.github/workflows/*`、`scripts/publish-version-utils.js`、发布 artifacts 与版本同步；实现验证可以先完成，发布接线不可越过门禁。

## Dependency and Execution Graph

```text
Gate A/B/C/D
  └─ Task 1 public boundary + package gates
      └─ Task 1.1 public TSDoc + generated API gate
          ├─ Task 2 domain reducer foundation
          ├─ Task 3 capability + prompt projection
          └─ Task 4 ingress guard minimal text
               └─ Task 5 first vertical text Run
                    ├─ Task 6 terminal/error/abort hardening
                    ├─ Task 7 reasoning/tool assembly
                    │    └─ Task 8 tool approval + multi-Step Run
                    │         └─ Task 9 continuation capsule
                    └─ Task 10 retry/regenerate/concurrency/recovery
                         ├─ Task 11 OpenAI Responses conformance
                         └─ Task 12 compatible conformance
                              └─ Task 13 DeepSeek three-format validation
                                   └─ Task 14 cross-layer fixtures + credential canary
                                        └─ Task 15 consumer/browser/CI gates
                                             └─ Task 16 docs + manual live verification
```

Tasks 2、3、4 在 Task 1.1 完成后可独立实施和评审；Tasks 11、12 在 Runtime vertical slice 稳定后可并行，二者完成后由 Task 13 统一验证 DeepSeek 三种格式。其余按箭头串行。并行执行只在用户明确授权 subagent 后进行；共享 `package.json`、workspace 与 CI 文件由单一 controller 持有。

## Review Focus

- abort 与 provider error 同时到达时，caller abort 优先，Snapshot 只能得到一个 `aborted` 终态（Task 6）。
- parallel tool input delta 交错时必须按 ID 独立组装、按观察顺序发事件，final JSON 与累计字符串不一致必须中断（Task 7）。
- `finish` 到达但仍有开放 text/reasoning/tool input 时不能完成 Run，必须 `interrupted` 且没有 terminal 后事件（Task 6）。
- DeepSeek 三种格式对相同 text/tool 输入必须得到等价 Domain observable；Anthropic model auto-mapping、ignored field、reasoning/usage/finish 差异必须表现为已声明 loss/reject，不能静默漂移（Task 13）。
- error/warning/metadata/endpoint/canary 任一位置包含 secret 时，序列化 Domain Event、Snapshot、diagnostic、fixture 与抛出值都不能包含该 secret（Task 14）。

---

### Task 1: Approve package boundaries and pin the public ABI

**Goal:** 在不实现模型调用的前提下建立可构建的 Runtime/Provider package、固定依赖策略和唯一公共导出面。

**Dependencies:** Gate A、B、C、D 全部批准。

**Files:**

- Create: `packages/runtime/package.json`, `tsconfig.json`, `vitest.config.ts`
- Create: `packages/runtime/src/index.ts`, `model/types.ts`, `domain/types.ts`, `commands/types.ts`, `runtime/types.ts`
- Create: `packages/runtime/test/public-exports.test.ts`
- Create: `packages/provider-openai/package.json`, `tsconfig.json`
- Modify after approval: `pnpm-workspace.yaml`, root `package.json`

**Interfaces:**

- Produces: `RuntimeModelRegistrationV1`, `RuntimeModelContextV1`, `RuntimeModelCapabilitiesV1`, `RuntimeMappingLossV1`, `RuntimeProviderErrorV1`, `RuntimeSnapshot`, `RuntimeCommand`, `TinyRobotRuntime`.
- Runtime uses exact `@ai-sdk/provider@4.0.25` as dev and peer dependency; Provider uses exact OpenAI packages as production dependencies.

**TDD order:**

- [ ] Write `public-exports.test.ts` as a compile-time contract proving approved symbols are exported only from the Runtime package, while Domain/Snapshot types contain no V4, provider metadata, credential, headers or raw fields.
- [ ] Run `pnpm -F @opentiny/tiny-robot-runtime test -- public-exports.test.ts`; expect failure because the package/exports do not exist.
- [ ] Add minimal package/build configuration and type declarations; do not implement Runtime behavior.
- [ ] Run Runtime test/build; expect pass and generated `dist/index.d.ts`.
- [ ] Inspect declarations with `rg "json-schema|node:|NodeJS|Buffer|raw|headers|credential" packages/runtime/dist`; only approved `credential?: unknown` input may match.

**Acceptance criteria:** Node 22/TS 5.8 build passes; public declarations match Gate C; no existing `kit`/`chat` export changes; credential-bearing data is not serializable.

**Permanent regression:** public export/type-leak contract.

**Review checkpoint:** human approves package metadata, dependency placement and declarations before Task 2.

### Task 1.1: Document the public ABI and enforce generated API documentation

**Goal:** 为 Task 1 已批准的 Runtime 公共 ABI 补齐可供人工阅读、编辑器提示和 API 文档生成使用的英文 TSDoc，并建立无输出的严格 TypeDoc CI 门禁与显式文档生成命令。

**Dependencies:** Task 1；维护者批准 `typedoc@0.28.20` 为 Runtime dev-only 依赖。该任务只解释已批准契约，不得新增、删除或重命名公共成员。

**Files:**

- Create: `packages/runtime/typedoc.json`、`docs/contributing/public-api-documentation.md`
- Modify: `packages/runtime/package.json`
- Modify: `packages/runtime/src/{index.ts,model/types.ts,domain/types.ts,commands/types.ts,runtime/types.ts}`

**Interfaces:**

- Consumes Task 1 的唯一公共入口 `packages/runtime/src/index.ts` 及全部已批准导出。
- Produces `pnpm -F @opentiny/tiny-robot-runtime docs:check`（仅转换与验证，不写生成物）和 `pnpm -F @opentiny/tiny-robot-runtime docs:build`（按需生成 HTML）。
- TSDoc 只描述 consumer-visible 语义、生命周期、不变量、错误和安全限制；不得承诺 Provider wire 细节或尚未批准的实现行为。

**TDD order:**

- [ ] 添加 TypeDoc dev dependency、`typedoc.json` 和 `docs:check`/`docs:build` scripts；配置 `entryPoints: ["src/index.ts"]`、`emit: "none"`、缺失文档与无效链接验证、warnings-as-errors，并将接口、类型别名、属性、方法和调用签名列入 `requiredToBeDocumented`。
- [ ] 在补注释前运行 `pnpm -F @opentiny/tiny-robot-runtime docs:check`；预期因公共声明缺少 TSDoc 而失败，且没有生成 HTML。
- [ ] 按 `docs/contributing/public-api-documentation.md` 规范补齐当前公共声明：summary 必填；可选值说明缺失语义；方法说明参数、返回/Promise rejection 与并发语义；credential/安全边界使用明确的 `must not`；避免复述类型语法。
- [ ] 重跑 `docs:check`；预期零 warning 通过。使用临时输出目录运行一次 `typedoc --emit docs`，证明 HTML 可生成且不污染仓库。
- [ ] 重跑 Runtime test/type-check/build，并检查 `dist/*.d.ts` 保留文档注释且敏感字段扫描仍只允许两个瞬时 credential 输入位置。

**Acceptance criteria:** 当前所有公共类型、属性、方法和调用签名都具有非重复、可执行的 TSDoc；TypeDoc 严格验证和临时 HTML 生成成功；公共名称、签名与 Task 1 相同；未提交生成 HTML；没有引入 API Extractor 或新的生产依赖。

**Permanent regressions:** `docs:check` 缺失公共文档、无效 `{@link}` 和 TypeDoc warning 门禁；Runtime 现有 public-export/type-leak contract。

**Review checkpoint:** human reviews the wording and generated API structure before Task 2.

### Task 2: Define normalized Snapshot, Domain Events, and reducer invariants

**Goal:** 建立与 V4 无关的规范化 Domain Model，并从 internal Domain Events 生成不可变 Snapshot。

**Dependencies:** Task 1.1.

**Files:** Create `packages/runtime/src/domain/events.ts`, `domain/reducer.ts` and `test/reducer/{run-lifecycle,content-parts,structural-sharing}.test.ts`; modify `domain/types.ts`.

**Interfaces:**

- Produces internal `RuntimeDomainEvent` and `reduceRuntimeEvent(snapshot, event): RuntimeSnapshot`.
- Snapshot has normalized Conversation/Turn/Run/Step/Message/Part/ToolCall maps, ordered IDs and `schemaVersion`.
- Run status is `pending | active | completed | failed | aborted | interrupted | superseded`; Step kind is `model | tool`.

**TDD order:**

- [x] Test Run/Model Step creation, exact text append including empty/newline delta, text end, finish and normalized usage/termination.
- [x] Run reducer tests; expect missing reducer/types.
- [x] Implement minimal entities/events/pure reducer; Provider IDs never become Domain IDs.
- [x] Add JSON serialization, structural sharing and exactly-one-terminal tests.
- [x] Run `pnpm -F @opentiny/tiny-robot-runtime test -- test/reducer`.

**Acceptance criteria:** no AI SDK import or side effect; Model/Tool Steps are distinct; terminal Snapshot cannot be mutated by later events.

**Permanent regressions:** lifecycle table, append fidelity, terminal immutability, structural sharing, serialization.

### Task 3: Implement capability preflight and call-options projection

**Goal:** 调用前拒绝 unsupported/unknown/undeclared-loss 请求，并把冻结 Run 配置、允许历史、工具与 AbortSignal 投影为完整的 v1 `LanguageModelV4CallOptions` allowlist。

**Dependencies:** Task 1.1; independent of Tasks 2/4.

**Files:** Create `src/execution/capabilityPreflight.ts`, `promptProjection.ts`, `modelCallProjection.ts` and `test/{capability-preflight,prompt-projection,model-call-projection}.test.ts`.

**Interfaces:**

- `assertModelCapabilities(request, capabilities): void`.
- `projectPrompt(snapshot, runId, continuation): LanguageModelV4CallOptions['prompt']`.
- `buildModelCallOptions(input: ModelCallProjectionInput): LanguageModelV4CallOptions`; implementation uses `satisfies LanguageModelV4CallOptions` so the pinned ABI checks the complete request object.
- Input is Snapshot/frozen Run config, registered function tools, `AbortSignal` plus opaque continuation handle; arbitrary headers/providerOptions、raw chunks、structured output 和 deferred prompt parts 在类型/API 层不可表达。

**TDD order:**

- [ ] Test exact projection for system/user/assistant text, allowed reasoning summary, function call and all allowed tool-result variants.
- [ ] Test exact complete options for prompt/maxOutputTokens/function tools/toolChoice/reasoning/abortSignal; assert `headers`、caller `providerOptions`、`includeRawChunks`、structured `responseFormat` and deferred prompt parts cannot be projected.
- [ ] Test rejection of deferred content and missing safe continuation with stable code.
- [ ] Test toolChoice/reasoning/functionTools/loss preflight; required `unsupported`/`unknown` rejects before `createModel`.
- [ ] Confirm RED, implement allowlist projection/preflight, then rerun.

**Acceptance criteria:** no UIMessage; unknown Snapshot part rejects rather than disappearing; every `doStream()` request is a pinned, allowlisted `LanguageModelV4CallOptions`; no mutation.

**Permanent regressions:** allowed prompt matrix and capability/deferred-part rejection.

### Task 4: Build the minimal text Ingress Guard

**Goal:** 将 constructed V4 text stream 校验并转换为 Domain Events，不让 V4 object 越界。

**Dependencies:** Task 1.1; independent of Tasks 2/3.

**Files:** Create `src/boundary/{ingressGuard,assemblers,normalization}.ts`, `test/fixtures/v4/text-stop.ts`, `test/ingress-guard/{text,order}.test.ts`.

**Interfaces:**

- `consumeModelStepStream(input: ModelStepIngressInput): Promise<ModelStepIngressResult>`.
- Input contains Runtime IDs, capabilities, `ReadableStream<LanguageModelV4StreamPart>`, `AbortSignal` and synchronous `emit(event)`.
- Result contains normalized terminal/usage and opaque handle, never raw parts.

**TDD order:**

- [ ] Construct `stream-start → response-metadata → text-start → text-delta* → text-end → finish(stop)`.
- [ ] Test order, exact whitespace/newlines, safe metadata and one terminal.
- [ ] Test delta-before-start, duplicate ID/start/end, unknown ID, duplicate finish and post-finish part.
- [ ] Confirm RED, implement per-Step/per-ID state maps, observed-order emission and exactly-one-finish validation.
- [ ] Run targeted ingress tests.

**Acceptance criteria:** raw part is never stored/emitted; Provider IDs only correlate inside one Step; metadata passes explicit character/length/range limits.

**Permanent regressions:** text lifecycle, ordering, IDs, terminal silence.

### Task 5: Deliver the first vertical text Run

**Goal:** 连接 command → Run-local model → `doStream()` → Guard → events → reducer → Snapshot。

**Dependencies:** Tasks 2、3、4.

**Files:** Create `src/runtime/createRuntime.ts`, `src/execution/runCoordinator.ts`, `test/integration/text-run.test.ts`, `model-factory-lifetime.test.ts`; modify `src/index.ts`.

**Interfaces:**

- `createRuntime(options: CreateRuntimeOptions): TinyRobotRuntime`.
- Coordinator calls `createModel({ credential })` once per Run and `doStream` once per Model Step; drops credential/model references in `finally`.
- Coordinator receives `LanguageModelV4StreamResult`, passes only `result.stream` to the Guard, and immediately discards `result.request`/`result.response` debugging data.
- `send()` wraps typed `dispatch`.

**TDD order:**

- [ ] Fake V4 model emits Task 4 fixture; assert subscriber sees one completed Run/Model Step/message/text part.
- [ ] Fake result seeds canaries into `request.body` and `response.headers`; assert only `stream` crosses the coordinator boundary and no canary reaches events, Snapshot, diagnostics or errors.
- [ ] Factory lifetime test uses a credential canary; factory receives it, Snapshot never does, references are released.
- [ ] Confirm RED, implement command routing, Runtime IDs, subscription/coordinator/reducer wiring.
- [ ] Rerun integration plus Tasks 1–4.

**Acceptance criteria:** first text Run works only via `doStream()`; Snapshot is sole query source; no `doGenerate()` path.

**Permanent regressions:** text vertical slice and factory lifetime.

### Task 6: Harden terminal, error, abort, EOF, warning, and usage semantics

**Goal:** 实现终止优先级、安全 normalization、`other`、unexpected EOF 和全部 finish reasons。

**Dependencies:** Task 5.

**Files:** Modify Guard/normalization/coordinator; create `test/fixtures/v4/terminals.ts`, `test/ingress-guard/terminal.test.ts`, `test/integration/abort-error.test.ts`.

**Interfaces:** `normalizeProviderError(value, context): RuntimeProviderErrorV1`; mapping is stop/completed, tool-calls/active, length/max_output_tokens, content-filter/content_filter, error/failed, other/interrupted unless approved allowlist.

**TDD order:**

- [ ] Table-test all finish reasons and missing-vs-zero usage.
- [ ] Test exception, abrupt EOF, missing finish, open part at finish, duplicate finish and post-finish data.
- [ ] Race abort with provider error/exception; caller abort wins and one terminal exists.
- [ ] Put canaries in dynamic error/warning data; only stable category/code/retryable/httpStatus survive.
- [ ] Confirm RED, implement precedence/normalization, rerun terminal and vertical tests.

**Acceptance criteria:** failed/aborted/interrupted never conflate; accepted finish requires closed assemblers; raw thrown values never cross the boundary.

**Permanent regressions:** terminal table, EOF/open-part, abort race, safe error/warning, usage availability.

### Task 7: Add reasoning and tool-input assemblers

**Goal:** 支持 visible reasoning summary 与 single/parallel function tool input，保证 per-ID 独立和 final input 一致。

**Dependencies:** Tasks 4、6.

**Files:** Modify assemblers/Guard; create reasoning/tool fixtures and tests.

**Interfaces:** assemblers expose `start`/`append`/`end`/`assertClosed` internally. Tool finalization yields `{ toolCallId, toolName, input: JsonObject }` only when accumulated string equals final input.

**TDD order:**

- [ ] Test reasoning only for `visibleReasoning: 'summary'`.
- [ ] Test single/multiple/empty deltas with no trim/re-tokenization.
- [ ] Test interleaved parallel calls, split args, empty object, malformed/non-object JSON, name/ID/final mismatch.
- [ ] Test rejection of provider-executed/dynamic/provider tools and approval requests.
- [ ] Confirm RED, implement independent assembler maps and final validation, rerun.

**Acceptance criteria:** incomplete/malformed call never reaches approval; opaque/private reasoning never becomes Part.

**Permanent regressions:** reasoning capability, parallel assembly, malformed/mismatch/deferred rejection.

### Task 8: Implement tool registration, approval, execution, result replay, and multi-Step Runs

**Goal:** `finish(tool-calls)` 保持同一 Run active，经过 Tool Step/审批后进入下一 Model Step。

**Dependencies:** Tasks 3、5、7; Gate D final approval.

**Files:** Create `src/tools/{registry,execution}.ts` and tool integration tests; modify coordinator, prompt projection, events and reducer.

**Interfaces:**

- Tool declaration has stable name, input schema, risk, approval and async handler; handler/credential never enter Snapshot.
- Run freezes root-registered ∩ Conversation-allowed tools.
- `approveToolCall`/`denyToolCall` are commands; result variants are text/JSON/error text/error JSON/denied.

**TDD order:**

- [ ] Test Model Step 1 → two parallel ToolCalls → Tool Steps → Model Step 2 → completed answer.
- [ ] Test read auto-execution, write/destructive approval, approve/deny, handler failure and abort while waiting/running.
- [ ] Test disabled/unregistered/schema-invalid tools reject before handler.
- [ ] Confirm RED, implement registry freeze, approval machine, handler isolation, events and replay.
- [ ] Rerun tool, reducer, prompt and terminal suites.

**Acceptance criteria:** Provider request never implies approval; write/destructive handler never runs without approval; implementation/credential never persist.

**Permanent regressions:** multi-Step loop, approval, denied/error replay, abort.

### Task 9: Add the opaque continuation capsule

**Goal:** 同一 active Run 工具循环可回传 opaque metadata，但不可解释、序列化或跨 Run。

**Dependencies:** Task 8.

**Files:** Create `src/boundary/continuationCapsule.ts` and continuation integration test; modify Guard/projection/coordinator.

**Interfaces:** private `ContinuationCapsuleStore` keyed by provider/model/run/part, exposing only `capture`, `readForNextStep`, `dropRun`.

**TDD order:**

- [ ] Test verbatim capture in Step 1 and matching replay in Step 2.
- [ ] Test provider/model/run/part mismatch, required capsule missing and cleanup on all terminals/recovery.
- [ ] Assert Snapshot/persistence/diagnostics/events contain no capsule canary.
- [ ] Confirm RED, implement private store and coordinator `finally` cleanup, rerun.

**Acceptance criteria:** capsule exists only for active Run and never enters reducer.

**Permanent regressions:** binding isolation, cleanup, serialization exclusion.

### Task 10: Complete Retry/Regenerate, concurrency, persistence, and recovery

**Goal:** 实现最后失败 Run retry、同 Turn regenerate、单 Conversation active Run、跨 Conversation 并行和恢复中断。

**Dependencies:** Tasks 5、6、8、9.

**Files:** Create `src/persistence/serialize.ts` and retry/concurrency/recovery/security tests; modify Runtime/coordinator/reducer.

**Interfaces:** `serializeSnapshot(snapshot): PersistedRuntimeStateV1` is allowlist-only with `schemaVersion`. Recovery changes persisted active Run to `interrupted` and restores no runtime-only references.

**TDD order:**

- [ ] Test retry accepts only latest failed/aborted/interrupted Run and creates a new frozen Run.
- [ ] Test regenerate uses same preceding context, creates same-Turn Run, marks old result superseded and excludes it from prompt.
- [ ] Test same-Conversation conflict and two-Conversation parallel isolation.
- [ ] Test persistence allowlist/recovery with canaries in all forbidden fields.
- [ ] Confirm RED, implement commands/maps/serializer, rerun integration/reducer/security tests.

**Acceptance criteria:** one active Run per Conversation; parallel isolation; exact retry/regenerate; active recovery is interrupted.

**Permanent regressions:** retry/regenerate, concurrency, recovery, persistence allowlist.

### Task 11: Integrate OpenAI Responses through the maintained V4 Provider

**Goal:** 用 `@ai-sdk/openai@4.0.89` 创建 Responses registration，以允许的 V4 CallOptions 验证脱敏 wire request，并以脱敏 HTTP/SSE fixtures 验证 exact V4 parts。

**Dependencies:** Tasks 5–10; Gate E.

**Files:** Create `packages/provider-openai/src/{responses,capabilities}.ts`, update `src/index.ts`, add `test/responses-conformance.test.ts` and `test/fixtures/responses/manifest.json` plus sanitized fixtures during implementation.

**Interfaces:** `createOpenAIResponsesRegistration(options): RuntimeModelRegistrationV1`. Credential only enters via Run context. Provider 维护者对已发布 registration 的浏览器直连负责；descriptor 显式声明 tools/reasoning/continuation/usage/losses 等模型语义能力。

**TDD order:**

- [ ] Manifest requires API format, package version, provenance, redaction manifest and expected observable result.
- [ ] Construct allowed text/reasoning/function-tool/tool-result `LanguageModelV4CallOptions`; intercept transport in memory and assert the exact sanitized Responses request semantics without writing credential、Authorization、raw headers/body to fixtures or logs.
- [ ] Add cases for normalized non-stream lifecycle, text deltas, reasoning, tool calls, usage, all finishes, non-2xx, mid-stream error, abort and EOF.
- [ ] Run Provider tests; expect RED.
- [ ] Implement Provider configuration/model creation only; do not reimplement OpenAI semantic parser.
- [ ] Assert exact wire→V4 output, then separately feed V4 into Runtime tests.

**Acceptance criteria:** Provider package owns V4 options→wire request and wire response→V4 proof; Runtime has no OpenAI wire types; hosted/custom/background/compaction content remains rejected.

**Permanent regressions:** sanitized V4 request→wire and wire response→V4 suites plus manifest validation.

### Task 12: Integrate OpenAI Chat Completions compatible per endpoint

**Goal:** 用 `@ai-sdk/openai-compatible@3.0.66` 创建 compatible registration，不从格式兼容推断能力。

**Dependencies:** Tasks 5–10; parallel with Task 11 after Gate E.

**Files:** Create `src/compatible.ts`, update capabilities/index, add compatible conformance test/manifest/fixtures.

**Interfaces:** `createOpenAICompatibleRegistration(options): RuntimeModelRegistrationV1` requires base URL, model ID and full descriptor. Snapshot/diagnostic stores safe endpoint ID, never query URL.

**TDD order:**

- [ ] Test rejection of missing/unknown tool/usage/reasoning/loss declarations; Provider conformance establishes browser access support for each registration.
- [ ] Intercept allowed `LanguageModelV4CallOptions` in memory and assert exact sanitized Chat Completions request semantics; credentials、Authorization、raw headers/body never enter checked-in fixtures or logs.
- [ ] Add indexed/interleaved tool, missing usage, vendor finish, private reasoning, non-2xx/error/abort/EOF fixtures.
- [ ] Assert `reasoning_content`/`reasoning`/`thinking` is not visible without reviewed endpoint mapping.
- [ ] Confirm RED, implement explicit wrapper/safe ID, rerun.
- [ ] Assert Responses/compatible equivalents produce equivalent Domain observables.

**Acceptance criteria:** descriptor is per concrete service; V4 options→wire request and wire response→V4 mappings are both explicit; no arbitrary Runtime headers/providerOptions; no compatible-private field leak.

**Permanent regressions:** explicit capabilities, indexed deltas, private reasoning, provider equivalence.

### Task 13: Validate DeepSeek across Chat Completions, Responses, and Anthropic-compatible formats

**Goal:** 用 DeepSeek 同一服务的三种公开 API 格式验证 Provider ABI：每种 wire format 独立证明共同 V4 request→wire 和 wire response→V4 映射，再证明 v1 共同子集产生等价 Domain observable。

**Dependencies:** Tasks 11、12; Gate B for validation-only Anthropic dependency; Gate E for DeepSeek capability/model-mapping claims.

**Files:**

- Create: `packages/provider-openai/test/deepseek-three-format-validation.test.ts`
- Create: `packages/provider-openai/test/helpers/deepseekAnthropicValidation.ts`
- Create: `packages/provider-openai/test/fixtures/deepseek/manifest.json`
- Create during implementation: sanitized fixtures under `packages/provider-openai/test/fixtures/deepseek/{chat-completions,responses,anthropic}/`
- Modify: `packages/provider-openai/package.json` only after Gate B, adding exact `@ai-sdk/anthropic@4.0.76` as a dev dependency, never production dependency

**Interfaces:**

- Chat Completions validation consumes `createOpenAICompatibleRegistration(options)` from Task 12.
- Responses validation consumes `createOpenAIResponsesRegistration(options)` from Task 11 with a reviewed DeepSeek endpoint profile.
- Anthropic validation uses test-only `createDeepSeekAnthropicValidationModel(credential): LanguageModelV4` backed by `@ai-sdk/anthropic@4.0.76`; the helper is not exported, bundled or published.
- Produces no new Runtime/Provider public API; its deliverable is a mapping matrix, sanitized fixtures and conformance evidence.

**TDD order:**

- [ ] Write `manifest.json` entries for each format with exact base URL/path, authentication header family, model mapping, supported v1 request fields, stream ordering/terminal rules, ID behavior, usage/reasoning/tool mapping, ignored fields, declared losses, fixture provenance and redaction manifest.
- [ ] Add one equivalent text stream and one equivalent client function-tool loop in all three formats; assert each sanitized wire fixture maps to its exact V4 stream parts before any Runtime assertion.
- [ ] Feed the same allowed text/tool `LanguageModelV4CallOptions` to all three formats; compare sanitized wire request semantics and require every format-specific divergence to match a declared loss/reject entry.
- [ ] Add format-specific cases: Chat Completions `reasoning_content`/indexed tool deltas and vendor finish reasons; Responses semantic SSE/`sequence_number` and completed/incomplete/failed terminals; Anthropic message stream, thinking/tool_use/tool_result, Claude-name→DeepSeek model mapping and ignored headers/fields.
- [ ] Add negative fixtures proving v1 rejects or declares loss for DeepSeek image/document/search/server-tool/MCP/citation/custom-tool behavior rather than widening the Runtime allowlist.
- [ ] Run `pnpm -F @opentiny/tiny-robot-provider-openai test -- deepseek-three-format-validation.test.ts`; expect RED until all three adapters/fixtures and manifest declarations exist.
- [ ] Configure the three AI SDK Provider paths, keeping the Anthropic helper test-only; do not implement a custom Anthropic parser or export an Anthropic registration.
- [ ] Feed the three accepted V4 streams into the same Runtime integration harness; assert equivalent text, ToolCall, Run/Step terminal state and normalized usage availability for the common subset, while every expected divergence matches a stable declared-loss/reject code.
- [ ] Re-run Task 11–13 Provider tests and the Runtime provider-equivalence test; expect pass.

**Acceptance criteria:** DeepSeek Chat Completions, Responses and Anthropic-compatible formats each have separate V4 request→wire and wire response→V4 proof; common v1 behavior is Domain-equivalent; format-specific differences are explicit; no Anthropic production dependency/export or new Runtime part is introduced.

**Permanent regressions:** DeepSeek three-format manifests/fixtures, exact bidirectional V4 mappings, cross-format common-subset equivalence, model-mapping and declared-loss/reject cases.

**Official mapping references checked 2026-10-09:**

- `https://api-docs.deepseek.com/api/create-chat-completion/`
- `https://api-docs.deepseek.com/guides/responses_api/`
- `https://api-docs.deepseek.com/guides/anthropic_api/`

### Task 14: Complete bidirectional boundary fixtures and the credential canary suite

**Goal:** 固化 Domain/Run→V4 request、V4 request→wire、wire response→V4 stream 与 V4 stream→Domain/Snapshot 分层，并证明所有出口不泄密。

**Dependencies:** Tasks 6–13.

**Files:** Complete both fixture trees; create `test/security/credential-canary.test.ts` and `test/integration/provider-equivalence.test.ts`.

**TDD order:**

- [ ] Coverage table maps contract section 15 items 1–14 to Provider and/or constructed V4 fixture; missing expected/redaction metadata fails.
- [ ] Coverage table separately accounts for exact allowed CallOptions projection, sanitized outbound wire semantics, inbound wire→V4 parts and V4 parts→Domain/Snapshot.
- [ ] Seed unique canary into credential, auth/cookie/header, query URL, bodies, raw chunk, thrown values, warning, metadata, capsule and tool data.
- [ ] Assert absence from serialized events/Snapshot/persistence/diagnostics/errors/checked-in fixtures.
- [ ] Assert order, per-ID transitions, assembly, one terminal, terminal silence, Step/Run mapping and provider equivalence.
- [ ] Run full Runtime and Provider suites.

**Acceptance criteria:** request projection、outbound wire、inbound V4 stream 与 Domain mapping 的 fixture/断言边界保持独立；no real credential、raw request/response or authorization material；coverage has no gap.

**Permanent regressions:** conformance fixtures, manifests, canary, equivalence.

### Task 15: Enforce Node/TypeScript/consumer/browser bundle gates

**Goal:** 证明 Node 22、TS 5.8、Vue 3.4+、Angular 20+ 可消费，且无 Node/json-schema 类型泄漏。

**Dependencies:** Tasks 1、14; Gate F before CI/release edits.

**Files:** Create private consumers under `tests/consumers/{typescript-5.8,vue-3.4,angular-20,browser-bundle}`; update workspace/root scripts after approval; update `.github/workflows/pr-ci-build.yml` after Gate F.

**Interfaces:** consumers import published roots only, never source paths/workspace aliases.

**TDD order:**

- [ ] TS consumer uses 5.8, DOM libs, `skipLibCheck: false` and no explicit Node/json-schema types; imports all public APIs.
- [ ] Minimal Vue 3.4 and Angular 20 consumers instantiate registration/runtime types without framework coupling.
- [ ] Vite browser consumer bundles Runtime and both Provider factories and fails on Node builtins.
- [ ] Run before declaration fixes and record expected failures.
- [ ] Fix only dependencies/exports/build declarations; no skipLibCheck, hidden consumer dependency or Node polyfill.
- [ ] Run:
  - `pnpm --dir tests/consumers/typescript-5.8 type-check`
  - `pnpm --dir tests/consumers/vue-3.4 build`
  - `pnpm --dir tests/consumers/angular-20 build`
  - `pnpm --dir tests/consumers/browser-bundle build`
  - `rg "node:|Buffer|process\.versions|json-schema" tests/consumers/browser-bundle/dist packages/runtime/dist/*.d.ts packages/provider-openai/dist/*.d.ts`
- [ ] Add Node 22 CI commands after local pass/Gate F.

**Acceptance criteria:** all consumers pass; Runtime has no framework/DOM import; browser output has no secret literal/Node builtin/undeclared types.

**Permanent regressions:** consumer projects, browser build and approved CI gates.

### Task 16: Document support, losses, security, and manual live-provider verification

**Goal:** 提供真实可复现说明与人工 live-provider 清单，不扩大 v1。

**Dependencies:** Tasks 11–15; Gate E.

**Files:** Create `docs/runtime/getting-started.md`, `docs/providers/{openai-responses,openai-compatible,deepseek-formats}.md`, `packages/provider-openai/test/live/README.md`; modify architecture/testing docs only for approved implementation facts.

**TDD/verification order:**

- [ ] Document fixed versions, BYOK/CORS risk, descriptors/losses, error/abort/EOF, tool approval, retry/regenerate and proxy alternative.
- [ ] Manual matrix covers text, reasoning policy, tool loop, abort before/mid, non-2xx, usage, CORS and browser execution for OpenAI plus DeepSeek Chat Completions/Responses/Anthropic-compatible endpoints; record actual model mapping for the Anthropic-compatible path.
- [ ] Use disposable environment-provided key; never save credential/raw headers/body.
- [ ] Run link/example checks, package test/build, consumer builds and credential scan; record actual output.
- [ ] Human performs live checks. Only a recorded real-browser success may add the concrete registration/endpoint to the supported browser matrix; failures remain visible and the registration stays outside that support claim.

**Acceptance criteria:** docs match tested behavior/exclusions; no secret; live failures stay visible.

**Permanent regressions:** automated links/examples; manual procedure remains secret-free.

## Final Validation Sequence

```bash
node --version
pnpm --version
pnpm -F @opentiny/tiny-robot-runtime test
pnpm -F @opentiny/tiny-robot-runtime build
pnpm -F @opentiny/tiny-robot-provider-openai test
pnpm -F @opentiny/tiny-robot-provider-openai test -- deepseek-three-format-validation.test.ts
pnpm -F @opentiny/tiny-robot-provider-openai build
pnpm --dir tests/consumers/typescript-5.8 type-check
pnpm --dir tests/consumers/vue-3.4 build
pnpm --dir tests/consumers/angular-20 build
pnpm --dir tests/consumers/browser-bundle build
pnpm test:release-scripts
git diff --check
```

随后运行 allowlist scan；命中逐条人工解释，不能用字符串替换式“脱敏”掩盖：

```bash
rg -n "Authorization|cookie|raw(?:Chunk|Request|Response)|providerMetadata|credential|node:|NodeJS|Buffer|json-schema" \
  packages/runtime/dist packages/provider-openai/dist tests/consumers/browser-bundle/dist
```

不要用全仓无关测试替代目标验证；若 package/build/release wiring 扩大，再由 reviewer 指定额外命令。

## Plan Self-Review Record

- **Spec coverage:** Contract v1 sections 1–18 map to Tasks 1–16; Provider conformance, Guard, reducer and integration suites are separate. DeepSeek three-format validation is additional abstraction evidence and does not expand the approved first-phase implementation scope.
- **Step scan:** each task has checkable RED/implementation/GREEN actions; no unnamed “handle edge cases”.
- **Type consistency:** public names originate in Task 1; Domain Events stay internal; Snapshot/Command never import V4.
- **Review Focus:** all five high-risk cases have owner tests in Tasks 6、7、13、14.
- **Proportion:** bodies are omitted; only signatures, ownership, assertions and fixed mappings remain.
- **Repository safety:** this plan adds only this temporary Markdown file. It does not alter staged design docs, package metadata, lockfiles, dependencies, Git index or branch.
