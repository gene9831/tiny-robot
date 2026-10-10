# 领域词汇

本文只定义 Tiny Robot 下一代架构中的项目术语。技术约束见 `docs/architecture/` 与 `docs/contracts/`。

## Conversation

一段可持久化的对话上下文，包含有序的 Turn，并负责协调该上下文中的 active Run。

## Turn

用户发起的一轮意图及其一个或多个执行尝试。Regenerate 会在同一 Turn 上创建新的 Run，而不是修改旧 Run。

## Run

针对一个 Turn 的一次完整执行尝试。`Run` 是名词，即使它处于 `pending`、`completed`、`failed`、`aborted`、`interrupted` 或 `superseded` 状态仍称为 Run。

## Step

Run 内可识别、可排序的执行阶段，例如模型生成或工具执行。Step 不等于 UI 组件。

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

## Domain Event

表示 Runtime 中已发生事实的内部事件。Reducer 使用它演进 Snapshot；它与 Provider stream part、对外生命周期事件相互独立。

## View Model

Selector/Presenter 从 Snapshot 计算出的、小而稳定的组件输入。它不保存领域状态，也不发起业务动作。

## Model Step

Run 中一次完整的模型调用。一个 Run 可以包含多个 Model Step，例如工具调用前后的两次模型生成。
