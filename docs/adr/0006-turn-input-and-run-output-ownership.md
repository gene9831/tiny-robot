# ADR-0006: Turn 拥有用户输入，Run 分离输入引用与输出所有权

- **Status:** Accepted
- **Date:** 2026-10-27

## 背景

早期 Runtime Snapshot 使用单一 `Run.messageIds` 同时保存模型调用消费的输入和本次执行产生的输出。这个结构可以表达首个单 Step 文本回答，却无法区分 Message 所有权与执行引用：用户 Message 被标记为由首个 Run 产生，Regenerate 复用同一用户意图时只能复制 Message 或让一个 Message 同时属于多个 Run；多轮上下文也会使“本次回答”和“模型完整输入”混成同一数组。

## 决策

Turn 通过 `inputMessageIds` 拥有表达当前用户意图的完整输入 Message。Run 通过 `inputMessageIds` 保存开始执行时实际采用的有序、只读 Message 引用，通过 `outputMessageIds` 保存本次尝试产生的有序 Message。输入可以来自同一 Conversation 中当前或先前的 Turn，但 Run 不得通过内容 Part Event 修改它。`RuntimeMessage.runId` 只表示 producing Run，因此用户输入不设置 `runId`，assistant 或 tool 输出设置产生它们的 Run ID。

Run 的 `stepIds` 与 `outputMessageIds` 保持独立，当前仍不持久化 Step → Message 关系。模型调用投影按 Run 的输入引用和执行中已产生的输出构造上下文；Selector 分别暴露 Turn 输入、Run 输入与 Run 输出。

## 取舍

保留单一 Run transcript 字段改动更小，但会永久混淆“被 Run 使用”与“由 Run 产生”，并阻碍 Retry、Regenerate 和多轮上下文。只让 Turn 保存输入、Run 保存输出虽然所有权清晰，却不能审计某次执行实际采用的冻结上下文。分离输入引用和输出所有权会增加一条 ID 关系，但使所有权、执行输入和展示结果都能独立验证。

本契约尚未定稿，因此本次直接移除 `Run.messageIds`，不提供兼容字段或历史 Snapshot 迁移，也不提升当前 schema version。
