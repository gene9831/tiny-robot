---
layout: home

hero:
  name: Tiny Robot Next
  text: Runtime 学习与技术文档
  tagline: 从一次文本问答开始，逐步理解公共边界、领域状态和模型调用准备。
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/quick-start
    - theme: alt
      text: 查看学习路径
      link: /concepts/runtime-overview

features:
  - title: 第一次学习
    details: 沿着一个连续场景，从应用请求逐步走到 Snapshot 和模型调用参数。
  - title: 集成与查询
    details: 按目标查看公共 API、Provider 注册、安全边界和精确类型说明。
  - title: 设计与维护
    details: 核对 ADR、契约、文档规范和可重复执行的学习评审流程。
---

## 这套文档帮助你完成什么

TypeScript 类型和英文 TSDoc 适合在编辑器中查询单个符号，但不擅长回答下面的问题：

- `RuntimeSnapshot` 的数据范围到底有多大？
- 一个回答完成后，Conversation 会不会自动从 Snapshot 释放？
- UI、后台 API、Provider、Domain Event 和 reducer 分别负责什么？
- 为什么 Runtime 不直接复用 AI SDK 的消息和 Part 类型？
- Regenerate 创建新 Run 后，旧回答和新回答如何共存？

本项目用连续场景解释这些跨类型、跨生命周期的概念。你可以先沿着主学习路径建立整体理解，再按需进入公共 API、ADR 和契约。

## 选择你的入口

- **第一次接触 Runtime**：从[快速开始](./guide/quick-start.md)进入，不需要预先阅读源码或实施计划。
- **正在集成 Runtime**：先看[Command 与 Runtime API](./concepts/commands-and-runtime.md)，再按需查询 [Runtime API](./reference/runtime-api.md)。
- **正在理解模型终态**：使用[观察 Run 如何结束](./examples/runtime-terminal-semantics/)在本地稳定重现完成、失败、中止和中断。
- **正在验证真实 Provider**：走通首个 text/reasoning Run 后，使用[DeepSeek 三种 API 格式实际验证](./examples/deepseek-runtime/)。
- **正在评审或维护设计**：查看[架构总览](./design/architecture-overview.md)、[文档完整性规范](./contributing/documentation-standard.md)和[学习文档评审指南](./contributing/learning-document-review.md)。

当前学习范围覆盖公共 Runtime 边界、Conversation facade、首个单 Step text/reasoning Run 的执行协调、Snapshot、Domain Event、reducer、Prompt 投影、调用选项投影，以及 constructed text/reasoning stream 的入站校验。Runtime 直接调用 `LanguageModelV4.doStream()`，不使用 `streamText()`。工具流程、重试、恢复和多 Step Run 不会被当作现行能力。

## 推荐阅读顺序

1. [快速开始](./guide/quick-start.md)：从一个问答场景理解 Runtime、Run、Snapshot 等基础概念。
2. [Runtime 总览](./concepts/runtime-overview.md)：再看各层职责。
3. [Command 与 Runtime API](./concepts/commands-and-runtime.md)：理解谁可以请求状态变化。
4. [Snapshot 与领域模型](./concepts/snapshot-and-domain-model.md)：理解状态范围和实体关系。
5. [多个 Conversation](./examples/multiple-conversations.md)：验证状态作用域和所有权隔离。
6. [Domain Event 与 reducer](./concepts/events-and-reducer.md)：理解状态如何演进。
7. [一次文本回答](./examples/completed-text-run.md)：串联状态创建、内容追加和终止。
8. [Provider 注册与安全边界](./concepts/provider-registration.md)：理解接入实例、模型、能力和凭据停在哪一层。
9. [准备一次模型调用](./concepts/model-call-projection.md)：理解 Snapshot 怎样变成允许的模型调用对象。
10. [校验一次模型文本流](./concepts/model-step-ingress.md)：理解 Provider stream 怎样被校验并转换为安全的 Domain Event。
11. [观察 Run 如何结束](./examples/runtime-terminal-semantics/)：比较正常完成、Provider 失败、用户中止、协议中断和 usage 边界。

如果只想查看某个 TypeScript 类型，请直接进入 [Runtime API 与 TSDoc](./reference/runtime-api.md)。
