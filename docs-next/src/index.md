---
layout: home

hero:
  name: Tiny Robot Next
  text: Runtime 架构评审文档
  tagline: 用中文概念说明、局部图例和可运行示例解释下一代 Runtime。
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/quick-start
    - theme: alt
      text: 理解 RuntimeSnapshot
      link: /concepts/snapshot-and-domain-model

features:
  - title: Task 1 · 边界
    details: Runtime 公共入口、Command、模型注册、能力声明与凭据边界。
  - title: Task 2 · 状态
    details: Conversation、Turn、Run、Step、Message、Part、Domain Event 与 reducer。
  - title: 按 Task 渐进
    details: 当前页面只解释已经进入实现范围的概念，后续能力在对应 Task 再加入学习路径。
---

## 这套文档解决什么问题

TypeScript 类型和英文 TSDoc 适合在编辑器中查询单个符号，但不擅长回答下面的问题：

- `RuntimeSnapshot` 的数据范围到底有多大？
- 一个回答完成后，Conversation 会不会自动从 Snapshot 释放？
- UI、后台 API、Provider、Domain Event 和 reducer 分别负责什么？
- 为什么 Runtime 不直接复用 AI SDK 的消息和 Part 类型？
- Regenerate 创建新 Run 后，旧回答和新回答如何共存？

本项目专门解释这些跨类型、跨生命周期的概念。公共符号的精确签名仍以 Runtime 的 TypeDoc 为准。

## 当前实现范围

Task 1 的公共 Runtime 边界和 Task 2 的 Snapshot、Domain Event、reducer 已进入现行实现。Task 3/4 及模型适配、执行协调、工具流程等后续能力会在对应 Task 开始时加入文档。

## 推荐阅读顺序

1. [快速开始](./guide/quick-start.md)：从一个问答场景理解 Runtime、Run、Snapshot 等基础概念。
2. [Runtime 总览](./concepts/runtime-overview.md)：再看各层职责。
3. [Command 与 Runtime API](./concepts/commands-and-runtime.md)：理解谁可以请求状态变化。
4. [模型注册与安全边界](./concepts/model-registration.md)：理解 AI SDK 为什么停在边界层。
5. [Snapshot 与领域模型](./concepts/snapshot-and-domain-model.md)：理解状态范围、实体关系和释放策略。
6. [Domain Event 与 reducer](./concepts/events-and-reducer.md)：理解状态如何演进。
7. [一次文本回答](./examples/completed-text-run.md)：把前面的概念串成完整场景。

如果只想查看某个 TypeScript 类型，请直接进入 [Runtime API 与 TSDoc](./reference/runtime-api.md)。
