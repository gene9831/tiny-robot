# 命名来源与项目定义

本页记录名词从哪里来，以及 Tiny Robot 是否改变了它的含义。外部资料用于说明命名背景，不能覆盖仓库中的 `CONTEXT.md`、已批准 ADR 和契约。

## 怎样阅读“来源类型”

| 来源类型     | 含义                                                           |
| ------------ | -------------------------------------------------------------- |
| **直接采用** | 名称和基础接口来自固定的外部规范；本项目必须记录版本和允许子集 |
| **借鉴模式** | 借用成熟架构概念，但具体数据结构和行为由 Tiny Robot 定义       |
| **项目定义** | 外部可能存在同名概念，但没有可直接继承的统一语义               |

## 公共边界

| 名词                              | 来源类型               | 主要来源                                                                                                                             | Tiny Robot 中的采用方式                                                                       |
| --------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `LanguageModelV4`                 | 直接采用               | [AI SDK `LanguageModelV4` 源码](https://github.com/vercel/ai/blob/main/packages/provider/src/language-model/v4/language-model-v4.ts) | 作为 Provider ABI，不作为 Runtime 领域模型；实际版本和允许子集由边界契约固定                  |
| `ProviderV4`                      | 直接采用               | [AI SDK `ProviderV4` 源码](https://github.com/vercel/ai/blob/main/packages/provider/src/provider/v4/provider-v4.ts)                  | 使用 `languageModel(modelId)` 选择真实模型；Runtime 公共边界只依赖批准的语言模型子集          |
| Command                           | 借鉴模式               | [Microsoft CQRS pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/cqrs)                                         | 表达调用者意图，可能被拒绝；便利方法不能形成第二套语义                                        |
| Snapshot / `RuntimeSnapshot`      | 项目定义               | 状态快照是通用概念；具体范围没有单一外部规范                                                                                         | 特指一个 Runtime 当前驻留的、不可变且规范化的完整领域状态                                     |
| Provider Connection Configuration | 项目定义               | [ADR-0005：Provider 注册与运行时解析](../design/adr-0005-provider-registration-and-runtime-resolution.md)                            | 应用拥有的 endpoint、Provider 类型、设置和模型目录；由 Provider 集成层转换为 registration     |
| Provider Registration             | 项目定义               | [ADR-0005：Provider 注册与运行时解析](../design/adr-0005-provider-registration-and-runtime-resolution.md)                            | Provider 集成层构造的可信 Runtime 接入对象；提供无参 Provider 工厂和模型目录                  |
| Model Descriptor                  | 项目定义               | [LanguageModelV4 Boundary Contract v1](../design/language-model-v4-runtime-boundary-v1.md#3-provider-registration)                   | 描述一个已评审模型的 Runtime capability；创建 Run 时把能力冻结进领域状态                      |
| credential / capability           | 借用通用安全与能力术语 | [AI SDK Provider architecture](https://github.com/vercel/ai/blob/main/content/docs/02-foundations/02-providers-and-models.mdx)       | credential 由应用和 Provider 管理；capability 表示 Runtime 构造和解释模型调用时依赖的语义能力 |

精确规范引用还包括 Call Options、Stream Parts 和各 Provider 流协议，统一维护在仓库文件 `docs/contracts/language-model-v4-runtime-boundary-v1.md` 的“规范引用”中。

## 领域状态

| 名词              | 来源类型               | 主要来源                                                                                                                                                           | Tiny Robot 中的采用方式                                                                 |
| ----------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| Conversation      | 项目定义               | 多个模型平台使用同名概念，但范围并不统一                                                                                                                           | 一段可持久化、可连续追问的上下文，拥有有序 Turn                                         |
| Turn              | 项目定义               | 不同 Agent/聊天系统对 Turn 的计数边界不同                                                                                                                          | 一次用户意图；Regenerate 不创建新 Turn                                                  |
| Run               | 项目定义，参考相似用法 | [OpenAI Agents SDK running agents](https://openai.github.io/openai-agents-js/guides/running-agents/)                                                               | 针对一个 Turn 的一次完整回答尝试；不能直接套用外部 SDK 的 Run 生命周期                  |
| Step / Model Step | 项目定义               | [OpenAI Agents SDK agent loop](https://openai.github.io/openai-agents-js/guides/running-agents/#the-agent-loop) 展示了多次模型与工具循环的相似结构                 | 一次模型调用或一次 Runtime 管理的工具执行；一个 Run 可以有多个 Step                     |
| Message / Part    | 借鉴结构               | [AI SDK `ModelMessage`](https://ai-sdk.dev/docs/reference/ai-sdk-core/model-message)、[`UIMessage`](https://ai-sdk.dev/docs/reference/ai-sdk-core/ui-message)      | 保留“消息由内容单元组成”的结构，但使用 Runtime 自有、可持久化且 Provider-neutral 的类型 |
| Domain Event      | 借鉴模式               | [Microsoft：Domain events](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/domain-events-design-implementation) | 表示 Runtime 内部已经确认的事实；不等于 Provider stream event 或公共生命周期事件        |
| reducer           | 借鉴模式               | [Redux：State, Actions, and Reducers](https://redux.js.org/tutorials/fundamentals/part-3-state-actions-reducers)                                                   | 纯函数式地从旧 Snapshot 和 Event 计算新 Snapshot，不执行副作用                          |
| 按 ID 规范化状态  | 借鉴模式               | [Redux：Normalizing State Shape](https://redux.js.org/usage/structuring-reducers/normalizing-state-shape)                                                          | 每类实体使用独立 ID 表，有序关系保存 ID 数组，并保持未变化引用稳定                      |

## 模型调用准备

| 名词                          | 来源类型 | 主要来源                                                                                                                                                     | Tiny Robot 中的采用方式                                                   |
| ----------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| prompt projection             | 项目定义 | [AI SDK `LanguageModelV4Prompt` 源码](https://github.com/vercel/ai/blob/main/packages/provider/src/language-model/v4/language-model-v4-prompt.ts)            | 从 Snapshot 的有序 Message/Part 明确转换允许子集，不直接复用 AI SDK 类型  |
| model call options projection | 项目定义 | [AI SDK `LanguageModelV4CallOptions` 源码](https://github.com/vercel/ai/blob/main/packages/provider/src/language-model/v4/language-model-v4-call-options.ts) | 构造 Tiny Robot 批准字段的完整对象；调用方不能注入任意 Provider/HTTP 配置 |

## 其他架构词

Ingress Guard、Selector、Presenter、View Model、continuation capsule 等名词由对应概念页解释并补充来源。快速开始只保留理解基础链路所需的最小词汇。

## 项目内的权威顺序

当外部资料、解释文档和项目定义存在差异时，按以下顺序判断：

1. 已批准的 `docs/contracts/`；
2. 已接受的 `docs/adr/`；
3. `CONTEXT.md` 中的统一语言；
4. `docs-next/` 的中文解释；
5. 外部资料中的相似用法。

外部来源只能解释“为什么采用这个名字”或“借鉴了什么模式”，不能自动扩大 Tiny Robot 的公共契约。
