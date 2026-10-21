# LanguageModelV4 Runtime Boundary Contract v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:test-driven-development` for each implementation task and `superpowers:subagent-driven-development` (only if delegation is explicitly authorized) or `superpowers:executing-plans` to execute this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. This plan is temporary, must not be committed by default, and must be deleted when the implementation is complete unless a maintainer asks to keep it.

**Goal:** 在浏览器优先、BYOK 的 Tiny Robot Runtime 中实现已批准的 LanguageModelV4 Boundary v1，使 OpenAI Responses 与 OpenAI Chat Completions compatible 通过统一 `doStream()` 生命周期产生受校验、可归约、可恢复且不会泄漏凭据的多 Step Run，并用 DeepSeek 的 Chat Completions、Responses、Anthropic-compatible 三种 API 格式验证 Provider ABI 抽象。

**Architecture:** 独立的 Runtime package 承载公共 Domain/Command/Snapshot API、出站 CallOptions allowlist projection、Ingress Guard、reducer 与 Run coordinator；应用直接复用具体 AI SDK Provider creator，将其拥有的 Provider Connection Configuration 与 credential 转换为可声明多个真实模型的 Provider Registration，不增加只做转发的 Tiny Robot Provider package。Runtime 不接收 credential，只在新 Run 开始时通过同步 resolver 解析一次 registration，并调用其无参 Provider 工厂。Domain/Run→V4 CallOptions、V4 CallOptions→wire request、wire response→V4 StreamPart、V4 StreamPart→Domain Event、Domain Event→Snapshot 分层测试；docs-next 的独立 DeepSeek live 示例使用三个 AI SDK Provider 验证首个 text/reasoning Run，后续 private conformance fixtures 再覆盖完整三种 wire formats。Runtime 不复用现有 OpenAI-shaped `packages/kit/src/message` 状态模型。

**Tech Stack:** Node.js 22+、TypeScript 5.8、pnpm 10、Vitest、tsup、TypeDoc 0.28.20、`@ai-sdk/provider@4.0.25`、private docs/validation dependencies `@ai-sdk/openai@4.0.89`、`@ai-sdk/deepseek@3.0.63`、`@ai-sdk/anthropic@4.0.76`、Vite browser build、Vue 3.4+ consumer、Angular 20+ consumer。

**Spec:** `docs/contracts/language-model-v4-runtime-boundary-v1.md`

## Global Constraints

- `LanguageModelV4.specificationVersion` 必须为 `'v4'`；Runtime 只通过 `doStream()` 消费 stream parts。
- 一次 `Step（kind = 'model'）`（下文简称 Model Step）的 ABI 同时包含出站 `LanguageModelV4CallOptions` 和入站 `LanguageModelV4StreamResult.stream`；完整 result 的 request/response 调试数据不得进入 Ingress Guard。
- 一次 `LanguageModelV4` 调用等于一个 `Step（kind = 'model'）`；Runtime 管理的工具执行是 `Step（kind = 'tool'）`。两者是同一 Step 实体的不同 kind，一个 Run 可以包含多个 Step。
- 首期不发布 Tiny Robot Provider wrapper；应用直接组合 AI SDK Provider 与 Registration。`@ai-sdk/anthropic@4.0.76` 只存在于 private docs/validation 环境，不形成公开 Anthropic registration、Runtime 生产依赖或首期支持承诺；Gemini 仍只用于抽象审查。
- DeepSeek 必须分别验证 Chat Completions、Responses、Anthropic-compatible 三种 API 格式；三者只比较 v1 共同子集，格式特有或被服务端忽略的字段必须记录 declared loss 或 reject，不能据此扩大 Runtime allowlist。
- Runtime 不依赖 Vue、Angular、DOM、UIMessage 或 Provider wire object；Vue 3.4+、Angular 20+ 仅参与 consumer 类型与构建门禁。
- Runtime 运行在浏览器；应用拥有 BYOK credential，Provider 集成层与 AI SDK Provider 负责认证。Runtime 的 Provider/model 与 opaque continuation 引用是 Run-local；Run 结束、失败、中止或恢复时必须释放。
- `providerId` 是应用定义的接入实例标识；Provider 配置与动态增删属于应用层。Runtime 在每个新 Run 创建时同步解析一次 registration，不拥有可变 Provider registry。
- Send、Retry、Regenerate、Command、resolver 与 Provider factory 都不接收 credential；应用通过替换 registration 或 Provider 集成层自己的 credential resolver 更新认证。
- credential、headers、raw request/response、raw chunks、SDK object、未清洗 error/warning/metadata 不得进入 Domain Event、Snapshot、持久化、日志、fixture、诊断或 UI API。
- 同一 Conversation 最多一个 active Run；不同 Conversation 可以并行。
- hosted/provider-executed/dynamic tools、MCP、多模态、structured output、citations、AG-UI 与 Provider approval flow 必须 reject，不能静默降级。
- TypeScript consumer 门禁必须使用 5.8、`skipLibCheck: false`，并证明 `json-schema` 与 `@types/node` 不会作为未声明依赖泄漏。
- Runtime 的全部公共导出、公共属性和公共方法必须使用英文 TSDoc 描述外部可观察语义；TypeDoc 缺失文档、无效链接或生成警告必须使验证失败。
- Runtime 生成 Conversation ID；`createConversation()` 返回只绑定 ID 与 dispatcher、但不保存领域状态的 `TinyRobotConversation`。`TinyRobotConversation.send()` 是 Conversation-scoped convenience，根 Runtime 的 `dispatch()` 是唯一通用 Command 入口。
- 测试只保留公共契约、主要验收行为和重要安全/协议回归；调查性测试、私有调用序列断言、日志与临时计数器在任务结束前删除。
- 创建 package、添加生产依赖、修改公共导出或安全/审批策略必须先通过下述人工门禁；任务只能实现已经通过对应门禁的 surface。
- 不自动 `git add`、commit、push 或发布；每个任务末尾以人工 review checkpoint 代替 commit。

## Repository Baseline and Reuse Decision

- 当前 `next` 只有 `components`、`chat`、`kit`、`svgs` 等既有 package，没有下一代 Runtime/Provider package。
- `packages/kit/src/message/core/engine.ts`、`packages/kit/src/message/types.ts` 与 `packages/chat/src/runtime/` 直接使用 OpenAI Chat Completion shape、Vue refs、mutable message state、headers/apiKey 配置；它们只能作为迁移行为参考，不能被新 Runtime 的 Domain 类型或 Provider 边界导入。
- 可复用模式：`packages/kit` 的 `tsup + Vitest` package 构建方式、`AsyncIterable`/`AbortSignal` 辅助函数思路、`packages/test` 的 Chromium 基础设施、现有 Node 22 CI。
- 不直接复用：`packages/kit/src/providers/openai.ts` 与 `packages/chat/src/runtime/provider/responseProvider.ts`。二者自行拼装 wire request 并传播 response text/error message，没有形成所需的 V4 Provider/Ingress 边界；credential/header 只能作为 Provider 集成配置参考，不能进入 Runtime API。
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
  test/prompt-projection.test.ts
  test/ingress-guard/*.test.ts
  test/reducer/*.test.ts
  test/integration/*.test.ts
  test/security/credential-canary.test.ts
  test/fixtures/v4/*.ts

docs-next/
  src/examples/deepseek-runtime/index.md
  src/examples/deepseek-runtime/DeepSeekRuntimeDemo.vue
  src/examples/deepseek-runtime/providerRegistrations.ts
  test/deepseek-provider-registrations.test.ts
  test/provider-conformance/*
  test/fixtures/{openai-responses,openai-compatible,deepseek}/*

tests/consumers/
  typescript-5.8/
  vue-3.4/
  angular-20/
  browser-bundle/

docs/contributing/
  public-api-documentation.md
```

后续任务 `Files` 中以 `src/` 或 `test/` 开头的路径均相对于 `packages/runtime/`；Task 11–13 的 Provider conformance 路径位于 private `docs-next/test/`，不形成发布入口。花括号表示逐个创建所列文件，不表示执行时依赖 shell glob。所有其他路径均从仓库根目录解析。

## Public Interface Gate

在 Task 1 写实现前，维护者必须批准下面的公共 surface；名称调整必须在此门禁完成，不能在后续任务中随意漂移。

```ts
export type RuntimeLanguageProviderV4 = Pick<ProviderV4, 'specificationVersion' | 'languageModel'>

export interface RuntimeModelDescriptorV1 {
  readonly capabilities: RuntimeModelCapabilitiesV1
}

export interface RuntimeProviderRegistrationV1 {
  readonly providerId: string
  readonly models: Readonly<Record<string, RuntimeModelDescriptorV1>>
  readonly createProvider: () => RuntimeLanguageProviderV4
}

export interface CreateRuntimeOptions {
  readonly resolveProvider: (providerId: string) => RuntimeProviderRegistrationV1 | undefined
}

export interface TinyRobotRuntime {
  createConversation(): TinyRobotConversation
  getSnapshot(): RuntimeSnapshot
  subscribe(listener: (snapshot: RuntimeSnapshot) => void): () => void
  dispatch(command: RuntimeCommand): Promise<void>
  abort(conversationId: string): Promise<void>
  retryLastRun(input: RetryLastRunInput): Promise<void>
  regenerateLastResponse(input: RegenerateLastResponseInput): Promise<void>
  approveToolCall(toolCallId: string): Promise<void>
  denyToolCall(toolCallId: string): Promise<void>
}

export interface TinyRobotConversation {
  readonly id: string
  send(input: ConversationSendInput): Promise<void>
}

export interface ConversationSendInput {
  readonly providerId: string
  readonly modelId: string
  readonly content: string
}
```

`SendCommand` 使用 Runtime-owned `conversationId + providerId + modelId` 表达完整意图；`ConversationSendInput` 只携带已经由 facade 绑定的 Conversation 之外的 `providerId + modelId + content`。Task 5 不暴露 reasoning 控制，省略表示采用 Provider 默认行为。`TinyRobotConversation.send()` 必须构造一个 `SendCommand` 并委托同一 `dispatch()` 路径，不能拥有第二套验证或执行语义。`RetryLastRunInput` 和 `RegenerateLastResponseInput` 只携带 `conversationId`。所有 Runtime 输入都不包含 credential、endpoint、headers 或 AI SDK Provider 配置。

在 Runtime 发布声明中，AI SDK Provider 只通过 `Pick<ProviderV4, 'specificationVersion' | 'languageModel'>` 暴露，模型只通过 `LanguageModelV4` 暴露；Runtime 内部 boundary 模块可以使用 `LanguageModelV4CallOptions`、`LanguageModelV4StreamResult` 与 `LanguageModelV4StreamPart`。Snapshot、Command（序列化形态）、Domain Event 与组件 API 不得引用任何 AI SDK 类型。

## Human Approval Gates

- **Gate A — package topology:** 批准新增 `@opentiny/tiny-robot-runtime` 与 private consumer/conformance fixtures；不新增公开 Tiny Robot Provider package。
- **Gate B — dependencies/toolchain:** 批准固定 `@ai-sdk/provider@4.0.25`（Runtime peer + dev）、`@ai-sdk/openai@4.0.89`、`@ai-sdk/deepseek@3.0.63` 与 `@ai-sdk/anthropic@4.0.76`（private docs/validation dependencies）、`typedoc@0.28.20`（Runtime dev-only documentation gate）、TypeScript 5.8 和 Node 22+ 门禁；确认无 lockfile 仓库策略。
- **Gate C — public API/export:** 批准上述 Provider Registration、model descriptor、resolver、capability、Snapshot、Command 与 `TinyRobotRuntime` 导出位置；这是 `docs/contracts/runtime.md` 所要求的单独公共契约评审。
- **Gate D — security/tool approval:** 批准应用与 Provider 集成层的 credential 责任、错误 code allowlist、tool risk/approval policy、diagnostic allowlist、compatible endpoint URL/query 处理。
- **Gate E — Provider truth claims:** OpenAI 与 DeepSeek 每个格式/endpoint 的浏览器直连、CORS、reasoning、usage、tools、model mapping 与 known losses 必须逐服务人工确认；DeepSeek Anthropic-compatible 自动 model mapping、ignored fields 与格式差异必须在 manifest 中显式记录。Provider 维护者只可在真实浏览器验证成功后把对应 registration 加入支持范围。
- **Gate F — release integration:** 批准新 package 加入 `.github/workflows/*`、`scripts/publish-version-utils.js`、发布 artifacts 与版本同步；实现验证可以先完成，发布接线不可越过门禁。

## Dependency and Execution Graph

```text
Gate A/B/C/D
  └─ Task 1 public boundary + package gates
      └─ Task 1.1 public TSDoc + generated API gate
          ├─ Task 2 domain reducer foundation
          │    └─ Task 3 text/reasoning history + call-options projection
          └─ Task 4 ingress guard minimal text

Task 3 + Task 4
  └─ Task 5 first vertical text Run
      ├─ Task 6 terminal/error/abort hardening
      ├─ Task 7 tool-input assembly
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

Task 4 可在 Task 2/3 之外独立实施和评审；Tasks 11、12 在 Runtime vertical slice 稳定后可并行，二者完成后由 Task 13 统一验证 DeepSeek 三种格式。其余按箭头串行。并行执行只在用户明确授权 subagent 后进行；共享 `package.json`、workspace 与 CI 文件由单一 controller 持有。

## Review Focus

- abort 与 provider error 同时到达时，caller abort 优先，Snapshot 只能得到一个 `aborted` 终态（Task 6）。
- parallel tool input delta 交错时必须按 ID 独立组装、按观察顺序发事件，final JSON 与累计字符串不一致必须中断（Task 7）。
- `finish` 到达但仍有开放 text/reasoning/tool input 时不能完成 Run，必须 `interrupted` 且没有 terminal 后事件（text/reasoning 属于 Task 5；tool input 属于 Task 7）。
- DeepSeek 三种格式对相同 text/tool 输入必须得到等价 Domain observable；Anthropic model auto-mapping、ignored field、reasoning/usage/finish 差异必须表现为已声明 loss/reject，不能静默漂移（Task 13）。
- error/warning/metadata/endpoint/canary 任一位置包含 secret 时，序列化 Domain Event、Snapshot、diagnostic、fixture 与抛出值都不能包含该 secret（Task 14）。

---

### Task 1: Approve package boundaries and pin the public ABI

**Goal:** 在不实现模型调用的前提下建立可构建的 Runtime package、固定依赖策略和唯一公共导出面。

**Dependencies:** Gate A、B、C、D 全部批准。

**Files:**

- Create: `packages/runtime/package.json`, `tsconfig.json`, `vitest.config.ts`
- Create: `packages/runtime/src/index.ts`, `model/types.ts`, `domain/types.ts`, `commands/types.ts`, `runtime/types.ts`
- Create: `packages/runtime/test/public-exports.test.ts`
- Modify after approval: `pnpm-workspace.yaml`, root `package.json`

**Interfaces:**

- Produces: `RuntimeLanguageProviderV4`, `RuntimeProviderRegistrationV1`, `RuntimeModelDescriptorV1`, `CreateRuntimeOptions`, `RuntimeModelCapabilitiesV1`, `RuntimeProviderErrorV1`, `RuntimeSnapshot`, `RuntimeCommand`, `TinyRobotRuntime`, `TinyRobotConversation`, `ConversationSendInput`.
- Runtime uses exact `@ai-sdk/provider@4.0.25` as dev and peer dependency；具体 AI SDK Provider 只由 private docs/validation consumer 直接依赖，不形成 Runtime 生产依赖或公开 wrapper package。

**TDD order:**

- [ ] Write `public-exports.test.ts` as a compile-time contract proving approved symbols are exported only from the Runtime package, while Domain/Snapshot types contain no V4, provider metadata, credential, headers or raw fields.
- [ ] Run `pnpm -F @opentiny/tiny-robot-runtime test -- public-exports.test.ts`; expect failure because the package/exports do not exist.
- [ ] Add minimal package/build configuration and type declarations; do not implement Runtime behavior.
- [ ] Run Runtime test/build; expect pass and generated `dist/index.d.ts`.
- [ ] Inspect declarations with `rg "json-schema|node:|NodeJS|Buffer|raw|headers|credential" packages/runtime/dist`; no Runtime input or registration member may expose credential or Provider transport configuration.

**Acceptance criteria:** Node 22/TS 5.8 build passes; public declarations match Gate C; no existing `kit`/`chat` export changes; Runtime public declarations do not accept credential-bearing data.

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
- [ ] 按 `docs/contributing/public-api-documentation.md` 规范补齐当前公共声明：summary 必填；可选值说明缺失语义；方法说明参数、返回/Promise rejection 与并发语义；Provider 配置与安全边界使用明确的 `must not`；避免复述类型语法。
- [ ] 重跑 `docs:check`；预期零 warning 通过。使用临时输出目录运行一次 `typedoc --emit docs`，证明 HTML 可生成且不污染仓库。
- [ ] 重跑 Runtime test/type-check/build，并检查 `dist/*.d.ts` 保留文档注释且敏感字段扫描不存在 Runtime credential 输入位置。

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
- Run freezes the application-defined `providerId`, real `modelId` and a copy of the reviewed model capabilities; Provider registrations and SDK objects never enter Domain state.
- Run status is `pending | active | completed | failed | aborted | interrupted | superseded`; Step kind is `model | tool`.

**TDD order:**

- [x] Test Run/Model Step creation, exact text append including empty/newline delta, text end, finish and normalized usage/termination.
- [x] Run reducer tests; expect missing reducer/types.
- [x] Implement minimal entities/events/pure reducer; Provider IDs never become Domain IDs.
- [x] Add JSON serialization, structural sharing and exactly-one-terminal tests.
- [x] Run `pnpm -F @opentiny/tiny-robot-runtime test -- test/reducer`.

**Acceptance criteria:** no AI SDK import or side effect; Model/Tool Steps are distinct; terminal Snapshot cannot be mutated by later events.

**Permanent regressions:** lifecycle table, append fidelity, terminal immutability, structural sharing, serialization.

### Task 3: Implement text/reasoning history and call-options projection

**Goal:** 为文本生成建立调用前边界：把允许的 text/reasoning 历史与 `AbortSignal` 投影为完整的 v1 `LanguageModelV4CallOptions` allowlist。Task 5 暂不使用 capability gate，也不暴露 reasoning 控制；Task 8 扩展同一边界以支持完整工具领域关系；Task 9 增加 opaque continuation。

**Dependencies:** Task 2; independent of Task 4.

**Files:** Create `src/execution/promptProjection.ts`, `modelCallProjection.ts` and `test/{prompt-projection,model-call-projection}.test.ts`.

**Interfaces:**

- `projectPrompt(snapshot, runId): LanguageModelV4Prompt`；每条内部投影结果直接使用 `LanguageModelV4Message`，并投影 system/user/assistant text 与 assistant reasoning。具体 Provider prompt 转换不属于 Runtime capability。
- `RuntimeModelCallOptions` uses `Pick`/`Required` to derive the approved key set from the pinned `LanguageModelV4CallOptions`; `buildModelCallOptions(input)` returns this narrow type, and the constructed object uses `satisfies RuntimeModelCallOptions`.
- `ModelCallProjectionInput` 的完整 key 集合是 Snapshot、Run ID、`maxOutputTokens` 和 `AbortSignal`；constructed options 的 key 集合是 prompt、`maxOutputTokens` 和 `abortSignal`。
- 无法完整投影的 history Part 使用稳定 code reject，不能静默删除。
- Task 3 不解析 Provider Registration、不调用 resolver，也不创建 Provider 或 model；这些职责属于 Task 5 coordinator。Run capability 当前只是冻结 metadata，不参与 projection gate。

**TDD order:**

- [x] Test exact projection for system/user/assistant text and assistant reasoning；用 RuntimeSnapshot 的字面 fixture 独立给出期望 V4 prompt。
- [x] Test exact input and narrow return key sets: prompt、`maxOutputTokens` and `abortSignal` derive from the pinned V4 type.
- [x] Test rejection of unknown、deferred and unsupported history with stable code；不得静默删除 Snapshot part。
- [x] Through `buildModelCallOptions`, test capability metadata does not gate the constructed V4 call.
- [x] Confirm RED, implement allowlist projection, then rerun.

**Acceptance criteria:** no UIMessage；unknown、deferred 和 unsupported Snapshot part rejects rather than disappearing；Task 5 的文本 `doStream()` request 是 pinned、allowlisted `LanguageModelV4CallOptions`；no mutation。

**Permanent regressions:** allowed text/reasoning prompt matrix、exact call-option key set、capability metadata non-gating and deferred/unknown/unsupported-part rejection。Declared-loss completeness belongs to Provider conformance in Tasks 11–14.

### Task 4: Build the minimal text Ingress Guard

**Goal:** 将 constructed V4 text stream 校验并转换为 Domain Events，不让 V4 object 越界。

**Dependencies:** Task 1.1; independent of Tasks 2/3.

**Files:** Create `src/boundary/{ingressGuard,assemblers,normalization}.ts`, `test/fixtures/v4/text-stop.ts`, `test/ingress-guard/{text,order}.test.ts`.

**Interfaces:**

- `consumeModelStepStream(input: ModelStepIngressInput): Promise<ModelStepIngressResult>`.
- Input contains Runtime Run/Step/Message IDs, capabilities, a synchronous Runtime-owned `createPartId()` allocator, `ReadableStream<LanguageModelV4StreamPart>`, `AbortSignal` and synchronous `emit(event)`.
- Result contains only normalized terminal/usage and never raw parts. Task 4 does not add an opaque handle；Task 9 alone may add a reviewed continuation handle.
- Task 4 normalizes response ID/model ID with `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$` and timestamp to an integer epoch-millisecond value within the ECMAScript Date range. It retains accepted metadata only inside the current Step for repeated-field consistency and does not emit or return it.
- Task 4 projects only the current text subset. Reasoning、custom、tool、source、file、raw and future unknown content parts are ignored without Domain Event or persistence；explicit `error` and structural protocol violations still interrupt with stable sanitized codes.
- On protocol violation or unexpected EOF, the Guard cancels the reader, emits exactly one interrupted `run-terminated` event, throws a stable sanitized ingress code and emits nothing afterward. Task 5 must not emit a second terminal for that rejection. Abort/provider-error precedence remains Task 6.

**TDD order:**

- [ ] Construct `stream-start → response-metadata → text-start → text-delta* → text-end → finish(stop)`.
- [ ] Test order, exact whitespace/newlines, Runtime-owned Part ID allocation, safe metadata/usage and one terminal.
- [ ] Test delta-before-start, duplicate ID/start/end, unknown ID, duplicate finish and post-finish part.
- [ ] Confirm RED, implement per-Step/per-ID state maps, observed-order emission and exactly-one-finish validation.
- [ ] Run targeted ingress tests.

**Acceptance criteria:** raw part is never stored/emitted; Provider IDs only correlate inside one Step; metadata passes explicit character/length/range limits; usage preserves valid zero and drops invalid values; protocol failures expose only stable codes and one interrupted terminal.

**Permanent regressions:** text lifecycle, ordering, IDs, terminal silence.

### Task 5: Deliver the first vertical text Run

**Status:** Closed. Task 6 的 terminal/error/abort hardening 与 Task 10 的 concurrency/retry/regenerate 仍按原边界后续交付，不阻塞本 Task。

**Goal:** 连接 command → Run-local model → `doStream()` → Guard → events → reducer → Snapshot。

**Dependencies:** Tasks 2、3、4.

**Files:**

- Create: `packages/runtime/src/runtime/createRuntime.ts`
- Create: `packages/runtime/src/execution/runCoordinator.ts`
- Create: `packages/runtime/src/execution/inspectStream.ts`
- Create: `packages/runtime/src/selectors/index.ts`
- Create: `packages/runtime/test/integration/text-run.test.ts`
- Create: `packages/runtime/test/integration/model-factory-lifetime.test.ts`
- Create: `packages/runtime/test/selectors.test.ts`
- Modify: `packages/runtime/src/runtime/types.ts`
- Modify: `packages/runtime/src/commands/types.ts`
- Modify: `packages/runtime/src/index.ts`
- Modify: `packages/runtime/{package.json,typedoc.json}`
- Modify: `packages/runtime/test/public-exports.test.ts`
- Modify: `docs-next/src/concepts/commands-and-runtime.md`
- Modify: `docs-next/src/concepts/model-step-ingress.md`
- Modify: `docs-next/src/examples/completed-text-run.md`
- Modify: `docs-next/src/index.md`
- Create: `docs-next/src/examples/deepseek-runtime/{index.md,DeepSeekRuntimeDemo.vue}`
- Create: `docs-next/src/examples/deepseek-runtime/providerRegistrations.ts`
- Create: `docs-next/test/deepseek-provider-registrations.test.ts`
- Modify: `docs-next/{package.json,.vitepress/config.mts,.vitepress/theme/index.ts}`

**Interfaces:**

- `createRuntime(options: CreateRuntimeOptions): TinyRobotRuntime`；`resolveProvider(providerId)` 由应用拥有，可在 Runtime 创建后返回新增的自定义 Provider Registration。
- `TinyRobotRuntime.createConversation(): TinyRobotConversation` 同步生成 Runtime-owned Conversation ID，通过 `conversation-created` → reducer 发布新 Snapshot 后返回无状态 facade；facade 只保存 `id` 和 dispatcher 引用。
- `TinyRobotConversation.send(input: ConversationSendInput): Promise<void>` 构造 `{ type: 'send', conversationId: facade.id, ...input }` 并委托 `TinyRobotRuntime.dispatch()`；根 Runtime 不再公开 `send()`，旧 `SendInput` 不再导出。当前公共输入不表达 reasoning 控制，模型采用 Provider 默认行为。
- `executeTextRun(input: TextRunCoordinatorInput): Promise<void>` 是 `src/execution/runCoordinator.ts` 的内部单文本 Run 入口。它只消费 `SendCommand`、同步 resolver、当前 Snapshot getter、Runtime ID allocator 和同步 Domain Event emitter。
- Coordinator 在每次被接受的新 Run 开始时同步 resolve one registration，复制 descriptor capabilities metadata，先验证 registration `providerId`、真实 `modelId` 与 descriptor shape，再调用 `createProvider()` once、`provider.languageModel(modelId)` once。Capability metadata 不 gate 调用或入站 part。Provider 和 model 必须都是 V4，model 的真实 `modelId` 必须与请求一致；每个 Model Step 只调用 `doStream(options)` once。
- Entity/event order is Conversation already exists → resolve/validate registration and descriptor → create/validate Provider and model → `turn-created` → `run-created` → user `message-created`/text start/delta/end → `buildModelCallOptions()` → model `step-started` → assistant `message-created` → `doStream()` → Guard events/terminal。所有 Conversation、Turn、Run、Step、Message、Part ID 由 Runtime 生成；user Part 也通过现有 text events 进入 reducer。
- Coordinator drops Provider/model references in `finally`；Provider 配置在 resolver 返回后的变化不影响当前 Run。
- Coordinator receives `LanguageModelV4StreamResult`, passes only `result.stream` to the Guard, and immediately discards `result.request`/`result.response` debugging data.
- `CreateRuntimeOptions.inspect.streamPart` 是应用显式配置的 observer-only 诊断旁路；Runtime 可在读取链路中使用 pass-through stream，但必须把相同 part 原样、同序交给 Guard，忽略观察器返回值和同步异常，且不能暴露已丢弃的 request/response。
- `dispatch(command)` receives only Runtime intent；Conversation facade wraps the same path。Credential and Provider connection configuration remain outside Runtime.
- Snapshot is the only query source. The emitter applies one Domain Event with `reduceRuntimeEvent`; it publishes only when the reducer returns a new Snapshot. Unsubscribed listeners receive no later update.
- `@opentiny/tiny-robot-runtime/selectors` 作为 Task 5 amendment 公开 `selectConversation`、`selectTurn`、`selectRun`、`selectMessage` 与对应 Selection 类型。Selector 只展开 Snapshot 的规范化 ID 关系，返回可直接遍历的不可变领域树；不包含 UI state、Presenter 字段或框架响应式对象。缺失根返回 `undefined`，空关系返回空数组，悬空引用抛稳定 selector error，未变化分支保持引用稳定。
- Task 5 later-task methods retain their approved signatures and reject with `{ code: 'runtime_operation_not_implemented' }` without Snapshot change. Task 5 does not implement abort precedence, retry, regenerate, tool approval or concurrency coordination.

**TDD order:**

- [x] Add the public compile-time contract first: export `TinyRobotConversation` and `ConversationSendInput`, add `createConversation()`, remove root `send()`/`SendInput`, retain `SendCommand.conversationId`, keep both Send shapes free of reasoning control, and assert the facade exposes exactly `id | send`. Run `pnpm -F @opentiny/tiny-robot-runtime test -- test/public-exports.test.ts`; expect type-check/test failure because the new surface does not exist.
- [x] In `text-run.test.ts`, write the first failing vertical test with a fake V4 model emitting the Task 4 legal text fixture. Create two Conversations and assert distinct Runtime-owned IDs without overwriting either Snapshot entity；call `conversation.send()` on one and assert one completed Run with one `Step（kind = 'model'）`, independent user/assistant Message IDs, exact Runtime-owned text Parts, normalized usage/termination, reducer-produced subscriber updates, unsubscribe silence, and `getSnapshot()` identity with the final subscriber value. Run the focused file；expect failure because `createRuntime()` and the facade do not exist.
- [x] In the same file, write a direct `dispatch({ type: 'send', conversationId: conversation.id, ... })` case and assert it produces the same entity/lifecycle shape as `conversation.send()` without a second send implementation. Add an unknown-Conversation case that rejects with `runtime_conversation_missing` before resolver/factory invocation.
- [x] In `model-factory-lifetime.test.ts`, add resolver lifecycle cases: registration added after Runtime creation is used by the next Run；replacement/removal affects only later Runs；a registration captured at Run start remains in use while the application replaces it；each accepted or rejected send resolves exactly once.
- [x] Add factory cases that assert registration-ID mismatch, missing descriptor and malformed descriptor reject before `createProvider()`；capability metadata does not gate accepted Runs；accepted Runs call argument-free `createProvider()` once, `languageModel(modelId)` once, and `doStream(allowlistedOptions)` once. Assert Provider/model V4 and model-ID mismatches reject before `doStream()`.
- [x] Add the safety canary to `result.request.body` and `result.response.headers`; observe emitted Domain Events through the coordinator harness and assert the unique canary is absent from events, every subscriber Snapshot, final Snapshot, thrown errors, and checked-in fixture data. Assert only `result.stream` parts cross the coordinator boundary；启用 observer 时必须把相同 part 原样、同序交给 Guard，且不能让 `request`/`response` 进入诊断旁路。
- [x] Add exactly-one-terminal cases: accepted finish yields only the Guard's completed terminal；a Task 4 protocol violation yields only the Guard's interrupted terminal and its stable sanitized error, with no coordinator terminal afterward.
- [x] Add standard V4 reasoning ingress cases: independent/interleaved reasoning lifecycle, exact whitespace/delta order, Runtime-owned Part IDs, Snapshot/subscriber projection, shared text/reasoning ID uniqueness, open reasoning at finish and Provider ID isolation. Capability metadata must not gate a standard reasoning part that actually appears.
- [x] Add Runtime-enforced Snapshot immutability, later-task method rejection without Snapshot change, and the Task 5 amendment Selector regressions for ordered expansion, selected/active Run semantics, missing/empty/dangling relationships and reference stability.
- [x] Run both focused integration files and confirm RED for missing Runtime/coordinator behavior, not for fixture or type errors.
- [x] Implement the minimal public facade, Runtime ID allocation, event publication/subscription, command routing and `executeTextRun()` wiring. Use Task 3 `buildModelCallOptions()` as the only call-options constructor and Task 4 `consumeModelStepStream()` as the only stream consumer. Do not add `doGenerate()`, `streamText()`, headers, provider options, credential inputs or a second answer state.
- [x] Run `pnpm -F @opentiny/tiny-robot-runtime test -- test/integration`; expect all Task 5 tests pass. Refactor only duplicated test builders and internal validation helpers；retain no investigation-only counters, logs or fixtures.
- [x] Update English TSDoc and Chinese learning docs to explain `createConversation()` → `conversation.send()` → coordinator → Guard → reducer → Snapshot, direct `doStream()` with no `streamText()`, the precise Model Step meaning, parallel Step/Message relationships, the Domain Selector boundary, and the current single text/reasoning Run limit. Do not document tools, retries, recovery or multi-Step behavior as available.
- [x] Add the docs-next-only DeepSeek live page with a top-level format selector and in-memory password input. Reuse official `@ai-sdk/deepseek` Chat Completions and `@ai-sdk/anthropic` Messages directly；Responses registration 可以包含应用拥有的 docs-only Provider Adapter，把 DeepSeek raw reasoning event 映射为标准 V4 `reasoning-delta`，同时过滤已消费的 raw part，并以聚焦回归锁定该映射。完整 part 顺序、terminal、error、取消、背压与 declared loss conformance 仍归 Task 11。Assert the three distinct final URLs, no injected reasoning/thinking control and API-key body isolation without claiming live browser support before manual validation；按 Part 顺序展示 Snapshot 中的 text/reasoning。
- [x] Run Runtime tests, type-check, docs check, build, docs-next build, sensitive/residual symbol scans and `git diff --check`; compare every result with the commands in Final Validation Sequence that apply to Task 5.

**Acceptance criteria:** Runtime-generated Conversation ID；`conversation.send()` and direct `dispatch(send)` share one coordinator path；first text/reasoning Run works only via `doStream()`；Snapshot is immutable sole query source；resolver/factory/model are Run-local；only `result.stream` parts cross into Guard，observer 只能原样同序观察；Guard owns the unique terminal；no `doGenerate()` or `streamText()` path；capability metadata 不参与 gate；Domain Selector 从 Snapshot 投影可遍历领域树并保持未变化分支引用稳定，不包含 UI/框架职责；docs-next 的 Native/Anthropic registrations 直接复用对应 AI SDK Provider，Responses 使用应用拥有且有聚焦映射回归的 Provider Adapter，完整 conformance 归 Task 11；三者都不注入 reasoning 控制，并且不把 API key 放入 body。

**Permanent regressions:** first text/reasoning vertical slice；Conversation facade/direct dispatch equivalence；Runtime-enforced Snapshot immutability；Run-local resolver；Provider/model factory lifetime；request/response canary isolation；exactly-one terminal；interleaved standard reasoning/text、subscriber projection、Provider ID isolation；later-task methods safe rejection；Domain Selector ordered expansion、selected/active Run、missing/empty/dangling relationships and reference stability；Guard 忽略其他未支持内容但不吞显式 error；docs-next 三种 endpoint、无 reasoning 注入与 API-key body isolation。

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

### Task 7: Add tool-input assemblers

**Goal:** 支持 single/parallel function tool input，保证 per-ID 独立和 final input 一致。Visible standard V4 reasoning 已提前到 Task 5。

**Dependencies:** Tasks 4、6.

**Files:** Modify assemblers/Guard; create tool fixtures and tests.

**Interfaces:** assemblers expose `start`/`append`/`end`/`assertClosed` internally. Tool finalization yields `{ toolCallId, toolName, input: JsonObject }` only when accumulated string equals final input.

**TDD order:**

- [ ] Test interleaved parallel calls, split args, empty object, malformed/non-object JSON, name/ID/final mismatch.
- [ ] Test rejection of provider-executed/dynamic/provider tools and approval requests.
- [ ] Confirm RED, implement independent assembler maps and final validation, rerun.

**Acceptance criteria:** incomplete/malformed call never reaches approval；Task 5 的 reasoning lifecycle 保持不变；opaque/private reasoning never becomes Part.

**Permanent regressions:** parallel tool assembly, malformed/mismatch/deferred rejection, Task 5 reasoning non-regression.

### Task 8: Implement tool registration, approval, execution, result replay, and multi-Step Runs

**Goal:** `finish(tool-calls)` 保持同一 Run active，经过 Tool Step/审批后进入下一 Model Step。

**Dependencies:** Tasks 3、5、7; Gate D final approval.

**Files:** Create `src/tools/{registry,execution}.ts` and tool integration tests; modify coordinator, prompt/model-call projection, Domain types/events and reducer.

**Interfaces:**

- Tool declaration has stable name, input schema, risk, approval and async handler; handler/credential never enter Snapshot.
- Run freezes root-registered ∩ Conversation-allowed tools.
- `approveToolCall`/`denyToolCall` are commands; result variants are text/JSON/error text/error JSON/denied.
- Task 8 defines the complete Domain relationship from assistant tool-call Part to `RuntimeToolCall`, Tool Step and tool-result Message/Part before enabling replay；normalized Snapshot 是 replay 的唯一领域来源。
- `assertModelCapabilities` expands only with the boolean tool capabilities required by the approved tool behavior；`projectPrompt` expands to assistant function tool call and all five allowed tool-result variants；`buildModelCallOptions` expands to function tools and toolChoice while retaining the Task 3 exact-key allowlist。Provider 原生或兼容实现方式不进入 Runtime capability。

**TDD order:**

- [ ] Test Model Step 1 → two parallel ToolCalls → Tool Steps → Model Step 2 → completed answer.
- [ ] Test exact assistant function-call replay and text/JSON/error-text/error-JSON/execution-denied tool-result replay from the normalized Snapshot；expand the positive projection matrix.
- [ ] Test exact function tool declarations、toolChoice and complete `LanguageModelV4CallOptions`；所需 boolean tool capability 为 `false` 或请求的 toolChoice 不可用时，在创建模型前拒绝。
- [ ] Test read auto-execution, write/destructive approval, approve/deny, handler failure and abort while waiting/running.
- [ ] Test disabled/unregistered/schema-invalid tools reject before handler.
- [ ] Confirm RED, implement registry freeze, approval machine, handler isolation, events and replay.
- [ ] Rerun tool, reducer, prompt and terminal suites.

**Acceptance criteria:** Provider request never implies approval; write/destructive handler never runs without approval; implementation/credential never persist.

**Permanent regressions:** normalized tool relationships、tool capability preflight、tool declaration/toolChoice projection、all allowed replay variants、multi-Step loop、approval、denied/error replay and abort.

### Task 9: Add the opaque continuation capsule

**Goal:** 同一 active Run 工具循环可回传 opaque metadata，但不可解释、序列化或跨 Run。

**Dependencies:** Task 8.

**Files:** Create `src/boundary/continuationCapsule.ts` and continuation integration test; modify Guard/prompt and model-call projection/coordinator.

**Interfaces:** private `ContinuationCapsuleStore` keyed by provider/model/run/part, exposing only `capture`, `readForNextStep`, `dropRun`.

**TDD order:**

- [ ] Test verbatim capture in Step 1 and matching replay in Step 2；Task 9 才为 `projectPrompt`/`buildModelCallOptions` 增加 opaque continuation handle。
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

- [ ] Test retry accepts only latest failed/aborted/interrupted Run, resolves the currently available registration and creates a new frozen Run without Runtime auth input.
- [ ] Test regenerate uses the same preceding context and currently resolved registration, creates same-Turn Run, marks old result superseded and excludes it from prompt.
- [ ] Test missing/removed Provider or model rejects Retry/Regenerate before Provider creation.
- [ ] Test same-Conversation conflict and two-Conversation parallel isolation.
- [ ] Test persistence allowlist/recovery with canaries in all forbidden fields.
- [ ] Confirm RED, implement commands/maps/serializer, rerun integration/reducer/security tests.

**Acceptance criteria:** one active Run per Conversation; parallel isolation; exact retry/regenerate; active recovery is interrupted.

**Permanent regressions:** retry/regenerate, concurrency, recovery, persistence allowlist.

### Task 11: Integrate OpenAI Responses through the maintained V4 Provider

**Goal:** 用 `@ai-sdk/openai@4.0.89` 创建 Responses registration，以允许的 V4 CallOptions 验证脱敏 wire request，并以脱敏 HTTP/SSE fixtures 验证 exact V4 parts。

**Dependencies:** Tasks 5–10; Gate E.

**Files:** Create private helpers under `docs-next/test/provider-conformance/openai-responses/`, including the conformance test, manifest and sanitized fixtures；reuse the application-owned creator composition from `docs-next/src/examples/deepseek-runtime/providerRegistrations.ts` where appropriate.

**Interfaces:** private `createOpenAIResponsesRegistration(options): RuntimeProviderRegistrationV1`. Options contain application-owned connection/auth settings and reviewed model descriptors；the creator binds them through `createOpenAI()` and returns a registration with an argument-free Provider factory。该 helper 不从 Runtime package 导出，也不形成新的发布 package。应用维护者对其公开的 registration 浏览器直连负责；每个 model descriptor 显式声明 tools/reasoning/continuation/usage/losses 等模型语义能力。

**TDD order:**

- [ ] Manifest requires API format, package version, provenance, redaction manifest and expected observable result.
- [ ] Construct allowed text/reasoning/function-tool/tool-result `LanguageModelV4CallOptions`; intercept transport in memory and assert the exact sanitized Responses request semantics without writing credential、Authorization、raw headers/body to fixtures or logs.
- [ ] Add cases for normalized non-stream lifecycle, text deltas, reasoning, tool calls, usage, all finishes, non-2xx, mid-stream error, abort and EOF.
- [ ] Run Provider tests; expect RED.
- [ ] Implement Provider configuration/model creation only; do not reimplement OpenAI semantic parser.
- [ ] Assert exact wire→V4 output, then separately feed V4 into Runtime tests.

**Acceptance criteria:** private conformance suite owns V4 options→wire request and wire response→V4 proof；Runtime has no OpenAI wire types；hosted/custom/background/compaction content does not enter Domain；没有只做 creator 转发的公开 Provider package。

**Permanent regressions:** sanitized V4 request→wire and wire response→V4 suites plus manifest validation.

### Task 12: Integrate OpenAI Chat Completions compatible per endpoint

**Goal:** 用 `@ai-sdk/openai-compatible@3.0.66` 创建 compatible registration，不从格式兼容推断能力。

**Dependencies:** Tasks 5–10; parallel with Task 11 after Gate E.

**Files:** Create private helpers/tests/manifests/fixtures under `docs-next/test/provider-conformance/openai-compatible/`；reuse the application-owned docs-next registration factory where appropriate.

**Interfaces:** private `createOpenAICompatibleRegistration(options): RuntimeProviderRegistrationV1` requires base URL、Provider name、auth settings and a reviewed descriptor for every exposed real model ID, then reuses `createOpenAICompatible()`。该 helper 不形成公开 Tiny Robot package。Snapshot/diagnostic stores the application-defined safe `providerId`, never the endpoint or query URL.

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

- Create: `docs-next/test/provider-conformance/deepseek-three-format-validation.test.ts`
- Create: `docs-next/test/provider-conformance/helpers/deepseekAnthropicValidation.ts`
- Create: `docs-next/test/fixtures/deepseek/manifest.json`
- Create during implementation: sanitized fixtures under `docs-next/test/fixtures/deepseek/{chat-completions,responses,anthropic}/`
- Reuse the Gate-B-approved private docs-next dependencies；不得把 `@ai-sdk/anthropic` 加到 Runtime 或新增公开 package

**Interfaces:**

- Chat Completions validation consumes the private `createOpenAICompatibleRegistration(options)` from Task 12.
- Responses validation consumes the private `createOpenAIResponsesRegistration(options)` from Task 11 with a reviewed DeepSeek endpoint profile.
- Anthropic validation uses test-only `createDeepSeekAnthropicValidationModel(credential): LanguageModelV4` backed by `@ai-sdk/anthropic@4.0.76`; the helper is not exported, bundled or published.
- Produces no new Runtime/Provider public API; its deliverable is a mapping matrix, sanitized fixtures and conformance evidence.

**TDD order:**

- [ ] Write `manifest.json` entries for each format with exact base URL/path, authentication header family, model mapping, supported v1 request fields, stream ordering/terminal rules, ID behavior, usage/reasoning/tool mapping, ignored fields, declared losses, fixture provenance and redaction manifest.
- [ ] Add one equivalent text stream and one equivalent client function-tool loop in all three formats; assert each sanitized wire fixture maps to its exact V4 stream parts before any Runtime assertion.
- [ ] Feed the same allowed text/tool `LanguageModelV4CallOptions` to all three formats; compare sanitized wire request semantics and require every format-specific divergence to match a declared loss/reject entry.
- [ ] Add format-specific cases: Chat Completions `reasoning_content`/indexed tool deltas and vendor finish reasons; Responses semantic SSE/`sequence_number` and completed/incomplete/failed terminals; Anthropic message stream, thinking/tool_use/tool_result, Claude-name→DeepSeek model mapping and ignored headers/fields.
- [ ] Add negative fixtures proving v1 rejects or declares loss for DeepSeek image/document/search/server-tool/MCP/citation/custom-tool behavior rather than widening the Runtime allowlist.
- [ ] Run `pnpm -F @opentiny/tiny-robot-next-docs test -- deepseek-three-format-validation.test.ts`; expect RED until all three adapters/fixtures and manifest declarations exist.
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
- [ ] Seed unique canary through Provider creator settings into credential, auth/cookie/header, query URL, bodies, raw chunk, thrown values, warning, metadata, capsule and tool data; no Runtime API receives the credential directly.
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
- [ ] Vite browser consumer bundles Runtime and representative application-owned AI SDK Provider registrations and fails on Node builtins.
- [ ] Run before declaration fixes and record expected failures.
- [ ] Fix only dependencies/exports/build declarations; no skipLibCheck, hidden consumer dependency or Node polyfill.
- [ ] Run:
  - `pnpm --dir tests/consumers/typescript-5.8 type-check`
  - `pnpm --dir tests/consumers/vue-3.4 build`
  - `pnpm --dir tests/consumers/angular-20 build`
  - `pnpm --dir tests/consumers/browser-bundle build`
  - `rg "node:|Buffer|process\.versions|json-schema" tests/consumers/browser-bundle/dist packages/runtime/dist/*.d.ts`
- [ ] Add Node 22 CI commands after local pass/Gate F.

**Acceptance criteria:** all consumers pass; Runtime has no framework/DOM import; browser output has no secret literal/Node builtin/undeclared types.

**Permanent regressions:** consumer projects, browser build and approved CI gates.

### Task 16: Document support, losses, security, and manual live-provider verification

**Goal:** 提供真实可复现说明与人工 live-provider 清单，不扩大 v1。

**Dependencies:** Tasks 11–15; Gate E.

**Files:** Create `docs/runtime/getting-started.md`, `docs/providers/{openai-responses,openai-compatible,deepseek-formats}.md`, `docs-next/test/provider-conformance/live/README.md`; modify architecture/testing docs only for approved implementation facts. The Task 5 docs-next live page remains the earliest manual first-text-Run validation surface and must not be described as the completed Task 16 support matrix.

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
pnpm -F @opentiny/tiny-robot-runtime type-check
pnpm -F @opentiny/tiny-robot-runtime docs:check
pnpm -F @opentiny/tiny-robot-runtime build
pnpm -F @opentiny/tiny-robot-next-docs test
pnpm -F @opentiny/tiny-robot-next-docs build
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
  packages/runtime/dist docs-next/.vitepress/dist tests/consumers/browser-bundle/dist
```

不要用全仓无关测试替代目标验证；若 package/build/release wiring 扩大，再由 reviewer 指定额外命令。

## Plan Self-Review Record

- **Spec coverage:** Contract v1 sections 1–18 map to Tasks 1–16; the Conversation-scoped API design maps entirely to Task 5 public types, identity, facade routing, integration tests and learning documentation. Provider conformance, Guard, reducer and integration suites remain separate. The Task 5 docs-next page validates only the current first text/reasoning Run and outbound mapping；later DeepSeek three-format fixtures remain additional abstraction evidence and do not expand the approved first-phase implementation scope.
- **Step scan:** each task has checkable RED/implementation/GREEN actions; no unnamed “handle edge cases”.
- **Type consistency:** Provider/Domain public names originate in Task 1；the approved Task 5 amendment replaces `SendInput` and root `send()` with `ConversationSendInput`, `TinyRobotConversation` and `createConversation()` while retaining self-contained `SendCommand`；Task 5 Send 不表达 reasoning 控制；Domain Events stay internal；Snapshot/Command never import V4 types.
- **Task boundary consistency:** Task 3 projects text/reasoning history into prompt；Task 5 adds standard reasoning ingress；Task 7 adds tool-input assembly；Task 8 adds complete tool Domain relationships、capability/options projection and replay；Task 9 alone adds opaque continuation.
- **Review Focus:** all five cross-plan high-risk cases have owner tests in Tasks 6、7、13、14；Task 5 additionally owns unknown Conversation, ID uniqueness, resolver replacement/removal, factory rejection, request/response canary and exactly-one-terminal tests from the Conversation-scoped spec.
- **Proportion:** bodies are omitted; only signatures, ownership, assertions and fixed mappings remain.
- **Repository safety:** the Conversation-scoped spec and this plan amendment are temporary working artifacts and are not committed by default。Task 5 的 approved dependency exception 只修改 private docs-next package metadata；安装同步了仓库既有但未跟踪的本地 `pnpm-lock.yaml`，不把它加入 Git。该例外不修改 Git index、branch 或 Runtime production dependencies，并保留获批的 contract 文档基线。
