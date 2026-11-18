# 开发文档 agent

## 使用

`developer_docs_writer` 面向开发人员编写、修改和审查开发文档，适用于架构与设计、技术规范、概念解释、操作指南、教程和 API 参考。

配置位于 [developer_docs_writer.toml](./developer_docs_writer.toml)，仅对当前仓库生效。按 Codex 官方的项目级自定义 agent 格式定义 `name`、`description` 和 `developer_instructions`，不固定模型、推理档位或权限配置，使用会话的配置解析及继承规则。[官方配置说明](https://learn.chatgpt.com/docs/agent-configuration/subagents)

可以直接要求：

> 请使用 developer_docs_writer 修改这份设计文档，核实新增概念的社区定义，保留结论和场景依据，检查链接与示例。

审查时可以要求：

> 请使用 developer_docs_writer 审查这些文档，只报告事实错误、术语问题、职责不清和混入正文的讨论过程，先不要修改文件。

自定义角色需要由当前会话识别才能委派。如果已有聊天未列出该角色，可在当前仓库的新聊天中使用；主 agent 也可以直接读取该文件执行相同写作规则。

## 写作原则

- 以开发人员的任务、知识前提和查询需求组织文档。
- 成熟概念采用标准或官方定义；项目新增概念说明场景、定义及边界。
- 正文呈现结论、契约、规则和必要的设计依据。
- 理由围绕场景、问题、约束、方案效果及代价表达。
- 对话、命名修改和编辑过程只留在协作回复中，不自动写入正文。
- 区分实际能力、确定设计、建议与待决问题；按修改范围验证。

例如，关于跨框架状态协议的设计理由，可以写为：

> 多个框架订阅同一组件状态时，统一快照提供一致的读取结果，减少适配器各自重建状态造成的语义差异。

该表述说明规则适用的场景和作用，无需介绍作者如何修改过方案。

## 社区依据与适用边界

| 来源 | 采用的原则 | 适用边界 |
| --- | --- | --- |
| [Google 开发文档指南](https://developers.google.com/style) | 面向软件开发人员；项目规范优先；表达清晰、一致 | 写作指南，不代替项目技术规范 |
| [Google Jargon](https://developers.google.com/style/jargon) | 必要术语首次解释或链接可信定义，避免模糊行话 | 成熟专业术语可保留，不强行改写为含糊的日常词 |
| [Diátaxis](https://diataxis.fr/) | 根据读者需要区分教程、操作指南、参考与解释 | 用于识别文档目的，不强制套用四份文档或固定章节 |
| [Diátaxis Explanation](https://diataxis.fr/explanation/) | 解释设计背景、约束、联系与取舍 | 必要技术背景可以保留，不等于记录协作编辑流水 |
| [Microsoft Learn 风格指南](https://learn.microsoft.com/en-us/contribute/content/style-quick-start) | 关注读者意图，使用自然、简明的语言和例子 | 按中文及领域语境采用，不机械照搬英语表达规则 |
| [MADR](https://adr.github.io/madr/) | 决策理由围绕问题、备选方案、决策和后果 | 仅在需要决策记录时采用，不给每次文档修改创建 ADR |

不记录聊天或编辑流水、不逐次增加探索文档版本，以及默认只改文档，是本仓库的约定。社区指南为读者导向、术语和理由表达提供依据，不代表全部来源都提出了这些项目约定。
