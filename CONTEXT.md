# 领域词汇

本文只定义 Tiny Robot 下一代架构中的项目术语。技术约束见 `docs/architecture/` 与 `docs/contracts/`。

## Conversation

一段可持久化的对话上下文，包含有序的 Turn，并负责协调该上下文中的 active Run。

## Turn

用户发起的一轮意图及其一个或多个执行尝试。Regenerate 会在同一 Turn 上创建新的 Run，而不是修改旧 Run。

## Run

针对一个 Turn 的一次完整执行尝试。`Run` 是名词，即使它处于 `pending`、`completed`、`failed`、`aborted`、`interrupted` 或 `superseded` 状态仍称为 Run。

## Step

Run 内可识别、可排序的执行阶段。`kind = 'model'` 表示一次模型调用，`kind = 'tool'` 表示一次 Runtime 管理的工具执行；两者是同一 Step 实体的不同 kind，不是两套平行实体。Step 不等于 UI 组件。

## Message

Conversation 中由某个角色产生、可持久化的语义内容容器。Message 由有序 Part 组成，不承载 Provider 原始响应对象。

## Part

Message 中可独立投影和渲染的内容单元，例如 TextPart、ReasoningPart、ToolCallPart 或 ErrorPart。

## ToolCall

模型对已注册工具的一次调用请求及其审批、执行和结果生命周期。工具实现和凭据不属于可持久化 ToolCall 数据。

## Snapshot

Runtime 在某个时刻的不可变、规范化领域状态。它是业务与 UI 查询当前结果的唯一事实来源。

## Command

调用方向 Runtime 提交的语义请求，包含识别目标动作及执行该动作所需的领域输入。

## Provider Connection Configuration

应用拥有的 Provider 连接资料，包含接入标识、endpoint、Provider 类型、模型目录及创建 AI SDK Provider 所需的设置。Credential 由应用与 Provider 集成层管理，不属于 Runtime 输入或领域状态。

## Provider Registration

Provider 集成层根据连接配置构造、供 Runtime 解析的可信接入对象。它以稳定的 `providerId` 标识，声明可选模型，并通过无参工厂为一次 Run 提供已经具备连接与认证行为的 AI SDK Provider；它不是可持久化的连接配置。

## Model Descriptor

Provider Registration 中针对一个真实 `modelId` 的已审核能力声明。Runtime 在创建 Run 时冻结该声明，后续 registration 变化不修改既有 Run。

## Domain Event

表示 Runtime 中已发生事实的内部事件。Reducer 使用它演进 Snapshot；它与 Provider stream part、对外生命周期事件相互独立。

## View Model

Selector/Presenter 从 Snapshot 计算出的、小而稳定的组件输入。它不保存领域状态，也不发起业务动作。

## Model Step / Tool Step

“Model Step”是 `Step（kind = 'model'）` 的简称，“Tool Step”是 `Step（kind = 'tool'）` 的简称。一个 Run 可以包含多个 Step，例如工具调用前后的两次模型生成和中间的工具执行。
