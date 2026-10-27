---
layout: home

hero:
  name: Tiny Robot Next
  text: 从一次 AI 问答理解对话运行机制
  tagline: 先提交问题并读取回答，再逐步理解状态、模型接入与扩展边界。
  actions:
    - theme: brand
      text: 完成第一次问答
      link: /guide/quick-start
    - theme: alt
      text: 查看学习路径
      link: /concepts/runtime-overview

features:
  - title: 第一次学习
    details: 从一个可运行的本地问答开始，不要求预先理解内部架构。
  - title: 集成与查询
    details: 按目标查找公共 API、模型接入方式、安全边界和精确类型。
  - title: 设计与维护
    details: 核对架构决策、正式契约和可重复执行的文档评审流程。
---

## 这套文档解决什么问题

Tiny Robot Next 提供一套与 Vue、Angular 等界面框架无关的 AI 对话运行能力。应用提交用户问题后，核心运行对象负责调用已配置的模型、检查模型结果，并保存页面可以稳定读取的对话状态。后续文档把这个核心对象称为 **Runtime**。

TypeScript 类型和英文 API 注释适合在编辑器中查询单个符号；这套中文文档负责解释完整业务流程：

- 应用怎样提交一次问题并读取回答；
- 一段可继续追问的对话怎样记录用户意图和模型回答；
- 模型返回的数据为什么需要先检查，再进入应用状态；
- 页面、Runtime 和模型接入代码分别负责什么；
- 增加新能力时应该扩展哪一层，并保持哪些边界。

第一次接触项目时，不需要先阅读实现计划、架构决策或完整 API。先完成最小问答，再沿学习路径逐步引入这些内容。

## 选择入口

- **第一次接触项目**：从[提交问题并读取回答](./guide/quick-start.md)开始。
- **准备接入应用**：完成快速开始后，阅读[应用与模型之间的运行边界](./concepts/runtime-overview.md)。
- **查询精确 API**：进入 [Runtime API 与 TSDoc](./reference/runtime-api.md)。
- **核对模型调用结束结果**：完成模型流学习后，使用[观察一次回答如何结束](./examples/runtime-terminal-semantics/)。
- **验证真实模型服务**：完成本地链路后，使用[验证 DeepSeek 三种格式](./examples/deepseek-runtime/)。
- **评审或维护设计**：查看[架构总览](./design/architecture-overview.md)、[文档完整性规范](./contributing/documentation-standard.md)和[学习文档评审指南](./contributing/learning-document-review.md)。

## 推荐学习路径

下面的顺序按认知前置关系排列。每一页只增加当前步骤需要的主要概念：

1. [提交问题并读取回答](./guide/quick-start.md)：完成一个本地问答，认识 Runtime 保存的基本业务对象。
2. [应用与模型之间的运行边界](./concepts/runtime-overview.md)：理解应用、Runtime、模型接入与页面状态的分工。
3. [请求 Runtime 执行业务动作](./concepts/commands-and-runtime.md)：理解应用可以发起哪些请求。
4. [Runtime 保存的对话状态](./concepts/snapshot-and-domain-model.md)：理解状态范围和对象关系。
5. [从状态中读取一段完整对话](./concepts/domain-selectors.md)：把按 ID 保存的记录还原成可遍历结果。
6. [同时管理多段对话](./examples/multiple-conversations.md)：验证状态所有权与隔离。
7. [根据已确认事实更新状态](./concepts/events-and-reducer.md)：理解状态怎样持续演进。
8. [注册可用的模型接入](./concepts/provider-registration.md)：理解模型、连接配置和凭据停在哪一层。
9. [准备一次模型调用](./concepts/model-call-projection.md)：把当前对话转换为允许发送给模型的数据。
10. [校验模型返回的文本流](./concepts/model-step-ingress.md)：把模型流转换为安全的业务事实。
11. [串联一次完整文本回答](./examples/completed-text-run.md)：连接问题提交、模型调用、内容追加和正常结束。
12. [观察一次回答如何结束](./examples/runtime-terminal-semantics/)：比较完成、模型失败、用户中止和协议中断。
13. [验证 DeepSeek 三种格式](./examples/deepseek-runtime/)：在真实远端接入中核对三种服务格式的结果。

学习页只描述当前已经实现并可验证的能力。工具调用、持久化恢复和更复杂的多阶段执行会在对应能力具备独立学习价值后进入后续模块。
