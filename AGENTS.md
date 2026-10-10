# Tiny Robot 开发约定

本仓库的 `next` 分支用于开发下一代 AI 原生、跨框架组件库。目标框架是 Vue 3.4+ 与 Angular 20+；旧实现仅作为行为和迁移参考，不约束新 API。

## 开始工作前

1. 阅读 [领域词汇](CONTEXT.md)、[总体架构](docs/architecture/overview.md) 和与任务相关的契约。
2. 判断改动属于 Provider Adapter、Runtime、Selector/Presenter、Web layer、UI contract 还是框架 renderer；不要跨层泄漏类型或职责。
3. 新行为与缺陷修复遵循 TDD。测试描述最终可观察行为，不为制造 RED 而破坏已有正确代码。
4. 大型或仍有产品选择的工作先完成方案确认，再写临时实施计划；不要把生成的计划默认提交到仓库。

## 强制边界

- Provider 集成通过固定版本的 `LanguageModelV4` 规范接入；Runtime 必须先经 Ingress Guard 校验、清洗并转换为 Domain Event。Provider 原始 payload、SDK 私有类型和未清洗的 V4 metadata 不得进入 Snapshot 或组件公共 API。
- Runtime 领域模型与组件 View Model 分离。View Model 是 Snapshot 的无副作用投影，不是第二套状态机。
- Runtime 不依赖 Vue、Angular 或 DOM。DOM 相关但框架无关的能力放入 Web layer。
- UI 组件不读取 Runtime 或存储，不启动业务异步；只渲染输入并发出语义事件。
- Vue 与 Angular 使用各自原生组合方式，不引入通用模板 DSL。
- API key、Authorization header 和其他凭据不得进入 Snapshot、消息、历史、日志、URL、测试 fixture 或错误上报。
- 第一阶段同一 Conversation 只允许一个 active Run；不同 Conversation 可以并行。
- Retry/Regenerate 的 Runtime 能力只针对最后一次回答暴露给首期 UI。

## 人工确认门禁

以下变更必须先由维护者确认，AI 不得自行定案：

- Runtime 或 Provider Model Boundary 的公共契约变更；
- 新增生产依赖、拆分/合并 package、破坏性 API；
- 凭据、安全、工具执行审批策略；
- 视觉与交互体验取舍；
- 向远端推送 `next`、发布和版本号变更。

在已批准方案内，AI 可以自行实现代码、测试、局部重构、文档和本地验证。

## 验证与交付

- 只保留保护公共契约、主要验收行为或重要回归的测试；完成前移除临时 fixture、日志和诊断代码。
- 按 [测试策略](docs/testing/strategy.md) 选择与改动风险相称的验证，不用无关的全仓测试代替目标验证。
- 不声称完成，除非实际运行了报告中的验证命令并检查了结果。
- 不自动提交或推送。不要覆盖工作区中与任务无关的用户改动。

常用现有命令：

```bash
pnpm -F @opentiny/tiny-robot-kit test
pnpm -F @opentiny/tiny-robot-kit build
pnpm -F @opentiny/tiny-robot-chat test
pnpm -F @opentiny/tiny-robot-chat type-check
pnpm -F @opentiny/tiny-robot type-check
pnpm -F tiny-robot-test test:ct
pnpm build:components
```

安装、增加或更新依赖需要网络权限，不应把依赖锁文件的意外变化混入功能改动。

## 文档与命名

- 说明文档以中文为主；标识符、规范关键字和协议原名保留英文。
- Task 完成前必须按 [下一代文档完整性规范](docs-next/src/contributing/documentation-standard.md) 检查概念说明、图例、场景、公共 TSDoc 与可验证示例；不适用项必须说明原因。
- 行业术语使用 `Conversation`、`Turn`、`Run`、`Step`、`Message`、`Part`、`ToolCall`，含义以 `CONTEXT.md` 为准。
- 架构决策仅在具备真实备选方案、长期影响和明确理由时写 ADR；不要把普通实现细节写成 ADR。
- 可重复工作流放在 `.agents/skills/`，稳定约束放在本文件或 `docs/contracts/`，不要复制成多套规则。
