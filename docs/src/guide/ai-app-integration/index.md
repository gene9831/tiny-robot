---
outline: [1, 3]
---

# 使用 Agent 为现有应用添加 OpenTiny AI

如果你熟悉 Vue 和基本前端开发，并且已经有一个 Vue 3 + Vite 业务应用，可以让 Codex、Cursor、Claude Code 等编程 Agent 使用 `opentiny-ai-app-integration` Skill，逐步完成以下集成：

1. 添加 TinyRobot Chat。
2. 在同一个对话框中启用 GenUI。
3. 把真实业务能力注册为 WebMCP 工具。
4. 使用受限 PageTool 查询、定位和安全导航现有页面。

你可以在目标项目中用一句话要求 Agent 接入通用基础设施。业务 WebMCP 合同和 PageTool 操作目标仍由业务方声明，Agent 不根据页面内容或示例工程推测。依赖检查、组件定位、代码适配、契约测试和构建由 Agent 按 Skill 执行；真实模型对话和浏览器闭环默认留给开发者人工验收。提示词明确要求验证某项功能时，Agent 才执行对应闭环。

## 推荐路线

| 步骤 | 你可以这样说 | 完成后得到什么 |
| --- | --- | --- |
| Step 1：TinyRobot Chat | “为当前项目添加 TinyRobot Chat” | 现有业务页面中的真实 TinyRobot 对话框 |
| Step 2：GenUI | “在当前 TinyRobot Chat 中集成 GenUI” | 同一对话框中的 GenUI 开关和 schema 卡片渲染 |
| Step 3：业务 WebMCP | “让 AI 能切换商品展示” | AI 能通过自然语言查询或改变真实业务状态 |
| Step 4：PageTool | “为当前项目接入 PageTool 基础设施，不推测业务目标” | 通用基础设施完成；业务方声明目标后，AI 才能操作对应安全页面语义面 |

从 [使用 Agent 集成 OpenTiny AI](./agent-guide) 开始。可以一次完成四步代码接入，并在最后统一补充环境变量；也可以只完成单个步骤。如果项目已经完成前置步骤，可以直接从后续步骤开始。

## 开始前准备

- 一个已有的 Vue 3 + Vite 应用，不要为了接入另建 demo。
- 能访问目标仓库、终端和 Git diff 的编程 Agent。
- 已安装 `opentiny-ai-app-integration` Skill。
- Step 1 使用已发布的 `@opentiny/tiny-robot-cli@0.5.2-alpha.12`，只运行 `add chat`，不要运行 `create`。
- 需要真实联网验收时，由你在私有环境中准备 endpoint 和认证；不要把密钥粘贴到提示词或文档。

## 其他路线

- [完整人工操作手册](./manual-guide)：适合需要查看所有命令、代码接入点和排查过程的维护者。
- [Step 1/2 macOS 重放记录](./verification/step-1-2-macos)：保留 TinyRobot Chat 与 GenUI 的历史验证证据。
- [Step 3 WebMCP 验证记录](./verification/step-3-webmcp-macos)：保留业务工具合同和真实页面闭环证据。
- [Step 4 PageTool 验证记录](./verification/step-4-pagetool-macos)：保留动作策略和真实页面操作证据。

Step 1/2 尚未取得真实 GenUI 服务响应；Step 3/4 已在 `opentiny.design.home` 的真实业务页面完成合同、构建和浏览器闭环。验证项目的具体工具名、业务 ID 和模型策略只属于该项目，不应复制到其他应用。
