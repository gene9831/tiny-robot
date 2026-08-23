---
outline: [1, 3]
---

# 现有 Web 应用智能化集成

本手册面向已经存在的 Vue 3 + Vite 业务应用，说明如何依次引入 TinyRobot AI 对话框、用 GenUI 升级交互、注册业务 WebMCP 与业务 Skill，并通过受限 PageTool 完成自然语言页面操作。当前版本是 **development preview**，四个步骤均以 `opentiny.design.home` 的真实实现和浏览器验证为证据，不使用演示页、mock 工具或硬编码回复替代业务闭环。

::: warning 发布阻塞项
`RELEASE-BLOCKER: LOCAL_CLI`：当前 `@opentiny/tiny-robot-cli@0.5.2-alpha.11` 来自本地修改、尚未发布的源码。文档中的本地 CLI 命令必须在发布后替换成精确的已发布版本，并重新从干净项目完整重放。
:::

## 选择操作路线

| 路线 | 适合谁 | 自动化范围 | 环境要求 | 入口 |
| --- | --- | --- | --- | --- |
| Agent + Skill | 使用 Codex 或其他编程 Agent，希望 Agent 修改并验证项目 | Agent 做预检、编辑、测试、构建和浏览器检查；每个阶段先报告再继续 | Agent 能访问目标仓库；已安装 `opentiny-ai-app-integration`；本地 CLI 仓库可用 | [Agent 操作手册](./agent-guide) |
| 完整人工操作 | 不依赖 Agent/Skill，希望开发者逐条执行 | 开发者手动运行 CLI、合并代码、配置和验证 | macOS、Node.js、pnpm、Git、现有 Vue 3 + Vite 应用、本地 CLI 仓库 | [人工操作手册](./manual-guide) |

两条路线的环境需求不同，但验收门槛相同：源码存在不等于接入完成，构建成功不等于真实 GenUI 服务、WebMCP 工具或 PageTool 页面操作已经在浏览器闭环。

## 当前验证范围

| 步骤 | 目标 | 当前状态 |
| --- | --- | --- |
| Step 1 | 使用 CLI 引入 TinyRobot 对话框并挂载到业务应用 | `TINYROBOT_INTEGRATED`、`BUILD_VERIFIED`、`UI_VERIFIED` |
| Step 2 | 接入 GenUI SDK，并将开关放到 Sender footer | `CODE_INTEGRATED`、`BUILD_VERIFIED`、`UI_VERIFIED` |
| Step 3 | 添加业务 WebMCP 与业务 Skill | `WEBMCP_CONTRACT_VERIFIED`、`WEBMCP_UI_VERIFIED` |
| Step 4 | 使用 WebMCP 与 PageTool 自动操作页面 | `PAGETOOL_CONTRACT_VERIFIED`、`PAGETOOL_UI_VERIFIED` |

Step 1/2 的独立重放没有使用真实 GenUI endpoint、Prompt ID 和授权，因此对应记录继续保留 `CONFIG_PENDING` 与 `SERVICE_UNVERIFIED`。Step 3/4 后续使用了用户已配置的真实模型服务完成自然语言工具调用，但文档不读取、复制或披露任何私有配置。验证项目有明确模型 allowlist：GenUI 模式只展示 Qwen，非 GenUI 模式只展示 DeepSeek；其他项目没有同类合同时，不得复制这一宿主策略。

## 验证版本

| 项目 | 版本/证据 |
| --- | --- |
| 本地 CLI package | `@opentiny/tiny-robot-cli@0.5.2-alpha.11` |
| CLI 生成的 TinyRobot runtime | `0.5.2-alpha.10` |
| GenUI SDK | `1.3.0` |
| Next SDK | `@opentiny/next-sdk@0.4.2` |
| 兼容主题包 | `@opentiny/vue-theme@3.31.1`，仅在明确出现主题 CSS 解析错误时添加 |
| 验证应用基线 | `opentiny.design.home@8064255` |
| Step 1/2 macOS 重放记录 | [Step 1/2 验证记录](./verification/step-1-2-macos) |
| Step 3 macOS 验证记录 | [业务 WebMCP 与业务 Skill 验证记录](./verification/step-3-webmcp-macos) |
| Step 4 macOS 验证记录 | [PageTool 自动操作验证记录](./verification/step-4-pagetool-macos) |

## 配套材料

- [Step 1 提示词](./prompts/step-1-add-chat)
- [Step 2 提示词](./prompts/step-2-genui)
- [Step 3 提示词](./prompts/step-3-webmcp-skill)
- [Step 4 提示词](./prompts/step-4-pagetool)
- [Step 1 至 Step 4 完整提示词](./prompts/full-flow)
- [GenUI 1.3.0 完整模板与通用测试](./examples/genui-v1.3.0/)

## 状态码

- `TINYROBOT_INTEGRATED`：依赖、有效导入、唯一入口挂载和样式证据齐全。
- `CODE_INTEGRATED`：GenUI SDK、单一聊天面、流式 plugin、renderer 和动态请求路由齐全。
- `CONFIG_PENDING`：`VITE_GENUI_URL` 或 `VITE_GENUI_PROMPT_ID` 缺失，开关必须禁用。
- `BUILD_VERIFIED`：生产构建成功；大 chunk 警告单独记录。
- `UI_VERIFIED`：在真实浏览器检查了按钮位置、禁用态、宿主模型策略和页面错误日志。
- `SERVICE_UNVERIFIED`：没有真实服务的有效 `schema-card` 响应证据。
- `WEBMCP_CONTRACT_VERIFIED`：业务状态、工具 schema、注册、adapter、业务 Skill 与结构化错误测试通过。
- `WEBMCP_UI_VERIFIED`：真实自然语言触发指定业务工具，页面业务状态变化并稳定反馈。
- `PAGETOOL_CONTRACT_VERIFIED`：原生 PageTool 注册、语义暴露、动作策略、错误边界和 Skill 测试通过。
- `PAGETOOL_UI_VERIFIED`：真实自然语言触发 PageTool，现有页面发生预期变化且未越过业务边界。
- `WINDOWS_UNVERIFIED`：Windows 未重放。
- `LINUX_COMMANDS_NOT_REPLAYED`：Linux 仅提供等价命令思路，未重放。
