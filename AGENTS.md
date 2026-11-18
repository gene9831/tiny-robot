# 文档路由

根据任务读取对应文档，不需要在每次任务中加载全部规范。

| 任务 | 阅读文档 | 使用方式 |
| --- | --- | --- |
| 编写、修改或审查面向开发人员的开发文档 | [developer_docs_writer 指令](.codex/agents/developer_docs_writer.toml)，用法及社区依据见 [agent 说明](.codex/agents/README.md) | 遵循术语核实、读者任务、结论表达与场景理由规则，并结合下列任务规范；用户明确要求使用该 agent 或授权委派时调用，否则由主 agent 直接遵守同一规则 |
| 查阅或整理规范驱动开发与通用组件问答 | [本目录说明与问答](docs/spec-driven-development/README.md) | 先确认适用范围、当前结论与已有入口 |
| 讨论通用的规范驱动或描述文件驱动架构、职责分层、依赖方向、跨框架适配、AI 开发或交付流程 | [架构与开发体系总览](docs/spec-driven-development/cross-framework-component-architecture.md)，涉及组件语义时继续阅读[组件设计基础](docs/spec-driven-development/component-design-foundations.md) | 先理解整体架构、能力基础和开发方式，再按问题阅读详细补充；区分已明确范围、方案建议及待决问题 |
| 讨论通用组件模型、行为契约、职责边界、状态所有权、受控模式或副作用 | [通用 UI 组件设计基础](docs/spec-driven-development/component-design-foundations.md) | 作为通用组件设计与评审的讨论基线；区分基础原则、建议约定和待决问题 |
| 定义通用组件的输入形式、属性角色、状态所有权、默认值、事件、可选公开方法或场景验收 | [公共组件契约规范](docs/spec-driven-development/component-contract-standard.md)，概念与职责参照[组件设计基础](docs/spec-driven-development/component-design-foundations.md) | 分别核对声明形式、使用角色和状态权威来源；公开方法是可选接口。区分核心原则、推荐策略、组件须声明的选择与待决问题，不把语义示例名称当作已实现 API |
| 设计通用组件描述文件、能力引用或代码生成规则 | 先读[架构与开发体系总览](docs/spec-driven-development/cross-framework-component-architecture.md)，再按问题读[组件设计基础](docs/spec-driven-development/component-design-foundations.md)及[公共组件契约规范](docs/spec-driven-development/component-contract-standard.md) | 先确认组件契约及可复用能力，再讨论描述格式；现有文档不代表 Schema 或生成方案已确定 |
| 查找或补充探索中的公共规范、内核协议、平台能力、框架适配、样式、验证或开发工具设计 | [架构总览第 2 节的补充文档预留目录](docs/spec-driven-development/cross-framework-component-architecture.md) | 先核对主题及状态；预留路径不是已有文档。当前任务要求补充时，再形成正文并同步目录与路由 |
| 新增或实质性修改 TinyRobot 正式组件文档、相关 Demo 和 API 说明 | [TinyRobot 组件文档规范](docs/component-documentation-standard.md) | 按规范核对当前公开 API、实际行为与示例 |

## 适用边界

- 开发文档以未参与对话的开发人员为读者。成熟概念采用相关标准或官方定义，必要的项目自定义概念应明确其场景、定义与边界。
- 设计理由围绕适用场景、问题、约束、方案效果及代价表达；协作和修改经过留在聊天回复中，不自动进入正文。按文档用途保留必要的技术背景、迁移差异或明确要求的决策记录。
- 本轮规范驱动开发探索集中放在 docs/spec-driven-development/，独立于 TinyRobot；不据此修改项目实现或 docs/README.md。
- 探索阶段不逐次增加版本号或维护编辑流水；相关问答记录在探索目录的 README.md。
- 文档正文只呈现概念、结论、方案及必要的待决项；不写对话经过、标题更名理由或编辑维护过程。维护约定集中放在本文件，问答按通用问题组织。
- 架构总览由多份规范与能力设计文档补充；组件设计基础是其中一份，集中展开组件模型、行为契约和职责边界。其他主题的预留目录集中维护在总览第 2 节。
- 预留主题不创建空文档，不当作已确认的协议或已具备的能力；新增正文后更新实际链接、文档状态及相应路由。
- 规范驱动开发依赖共享内核、平台模块、框架适配及验证等能力基础；不能把组件描述文件当作这些实现与工具的替代品，也不能假设文档提及的能力已经存在。
- 通用组件规范不包含 TinyRobot 专业领域规则。后续需要时另建领域文档，并在此增加路由。
- 通用组件规范中的建议和待决项不等于已批准的实现决定，不得据此自动重构既有组件。
- 通用组件规范描述目标职责；正式产品文档仍须如实描述目标版本的公开契约和实际行为。发现差异时明确记录，不得将目标行为写成已实现能力。
- 文档记录不构成修改数据层、生成器或组件实现的授权；具体变更遵循当前任务范围。
