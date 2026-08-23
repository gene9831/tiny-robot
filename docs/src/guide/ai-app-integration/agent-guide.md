---
outline: [1, 3]
---

# Agent + Skill 操作手册

本路线让编程 Agent 使用 `opentiny-ai-app-integration` Skill 修改现有 Vue 3 + Vite 业务应用。Codex 是当前完整重放基线；其他 Agent 产品可以沿用提示词和验收门槛，但其 Skill 发现方式、审批机制、终端和浏览器能力需要按产品调整。

## 环境要求

### Agent 产品

- 能访问目标仓库、运行终端命令、编辑源码并查看 Git diff。
- 能加载 `opentiny-ai-app-integration` Skill。Codex 中可在提示词使用 `$opentiny-ai-app-integration`。
- 能运行真实浏览器验证；如果产品没有浏览器能力，由开发者人工完成 UI checklist。
- 能在依赖安装、启动本地端口等动作前请求用户批准。

### 目标应用

- 已存在的 Vue 3 + Vite 应用，不是新建 demo。
- Node.js `>=20.13.0`；本次验证使用 `v22.23.1`。
- Git 已跟踪当前基线，开发者知道哪些 dirty 文件必须保留。
- 当前应用拥有自己的 `package.json` 和可核对的 lockfile。本次基线为 `pnpm-lock.yaml`、`lockfileVersion: '9.0'`。
- macOS 已验证；Linux 命令未重放；Windows 未验证。

### 本地 CLI

当前流程依赖本地修改的 CLI 源码：

```bash
node <TINY_ROBOT_REPO>/packages/cli/bin/cli.js add chat
```

本次实际命令是：

```bash
node /Users/gene/Projects/tiny-robot/packages/cli/bin/cli.js add chat
```

::: danger RELEASE-BLOCKER: LOCAL_CLI
本地 package 声明 `@opentiny/tiny-robot-cli@0.5.2-alpha.11`，尚不能把文档命令替换为 `pnpm dlx`/`npx`。CLI 发布后必须锁定精确版本、删除本地仓库要求、从干净项目重放，并更新本手册的版本、日期和验证证据。
:::

## Agent 工作协议

Agent 必须按下面顺序执行，不能看到 `TinyRobotChat.vue` 就直接声称完成：

```text
READ_ONLY_PREFLIGHT
  → USER_CONFIRMED
  → CLI_GENERATED
  → DEPENDENCIES_RESOLVED
  → APP_MOUNTED
  → BUILD_VERIFIED
  → UI_VERIFIED
  → USER_CONFIRMED
  → GENUI_CODE_INTEGRATED
  → GENUI_TESTS_VERIFIED
  → BUILD_VERIFIED
  → UI_VERIFIED
```

每次执行命令前，Agent 应说明目的和完整命令。每次执行后应记录 exit code、关键输出、允许警告、失败状态和实际文件差异。

Agent 不得：

- 读取、删除、覆盖、回显或提交真实 `.env`；文件存在也只记录文件名。
- 使用 `create`、第二个聊天框、手写聊天壳、mock schema 卡片或假服务绕过真实接入。
- 用 build 成功替代浏览器证据或真实服务证据。
- 擅自提交业务仓库。完成一个阶段后可以建议 Git checkpoint，但必须等用户明确授权。

## 1. 发起 Step 1

使用 [Step 1 提示词](./prompts/step-1-add-chat)。第一轮只允许 Agent 做只读预检：

```bash
pwd
git rev-parse --show-toplevel
git status --short
test -f package.json && node -e "const p=require('./package.json'); console.log(JSON.stringify({name:p.name,dependencies:p.dependencies,devDependencies:p.devDependencies},null,2))"
rg --files -g 'vite.config.*' -g 'src/**' -g 'pnpm-lock.yaml' -g 'package-lock.json' -g 'pnpm-workspace.yaml'
```

你需要核对 Agent 的报告：

- 目标目录确实是业务应用，而不是父 workspace。
- dirty 文件清单完整；Agent 明确承诺保留它们。
- 包管理器和当前应用 lockfile 边界清楚。
- CLI 目标文件不会覆盖已有或 dirty 文件。
- Agent 没有读取 `.env`。

确认后，再让 Agent执行本地 CLI。

## 2. 验收 Step 1

Agent 应报告 CLI 的真实行为：

- 创建 `src/TinyRobotChat.vue`。
- 创建 `src/tiny-robot-chat/components/ComposerTools.vue`。
- 创建 `src/tiny-robot-chat/components/WindowHeader.vue`。
- 创建 `src/tiny-robot-chat/composables/useWindow.ts`。
- 创建 `src/tiny-robot-chat/config/chat-runtime.ts`。
- 创建 `src/tiny-robot-chat/config/chat-ui.ts`。
- 创建或合并 `.env.example`，但不创建 `.env`。
- 给 `package.json` 添加 TinyRobot `0.5.2-alpha.10` 和 `@vueuse/core@13.9.0`。
- 不安装依赖、不修改 lockfile、不修改 `main.js/main.ts`、不自动挂载组件。

Agent 还必须完成 CLI 之外的工作：

1. 在真实 `App.vue`/路由页面唯一挂载 `<TinyRobotChat />`。
2. 执行当前应用的依赖安装，让 package 和 lockfile 同步。
3. 核对 `TrThemeProvider`、`TrChat` 和 TinyRobot styles 的有效导入。
4. 运行生产构建。
5. 启动本地页面，在浏览器打开 TinyRobot，并确认错误日志为空。

![Step 1 TinyRobot 对话框](./images/step-1-tinyrobot-chat.png)

只有这些证据齐全，才接受 `TINYROBOT_INTEGRATED + BUILD_VERIFIED + UI_VERIFIED`。模型 key 未提供或未发送真实请求时，继续保留 `CONFIG_PENDING`/`SERVICE_UNVERIFIED`。

## 3. 确认进入 Step 2

Step 1 验收后再使用 [Step 2 提示词](./prompts/step-2-genui)。Agent 必须重新做只读证据门检查，不能默认 Step 1 一定正确。

确认 Agent 的实施计划包含：

- GenUI SDK 三个包统一为 `1.3.0`。
- 复用 Skill 的 `assets/genui-v1.3.0/`，不依赖 `robot-client`。
- 保持唯一 `TrChat`。
- GenUI 在 `sender-footer` 中作为默认关闭的功能开关。
- `PatternExtractor` 跨 chunk 解析；只将有效 `schema-card` 交给 `GenuiRenderer`。
- 普通/GenUI 请求动态路由，切换前后保持 selected model。
- GenUI 认证与模型供应商 key 隔离。
- 只写 `.env.example` 空占位。

## 4. 验收 Step 2

要求 Agent 提供以下命令和结果：

```bash
diff -ru <SKILL_DIR>/assets/genui-v1.3.0/genui src/tiny-robot-chat/genui
node --experimental-strip-types --test tests/genui-integration.test.mjs
pnpm build
```

通用模板测试至少覆盖五项：

1. schema 跨 chunk 仍能被解析。
2. Markdown 和 `schema-card` 顺序不丢失。
3. GenUI 开关通过 TinyRobot `sender-footer` 渲染。
4. 请求路由保留 selected model。
5. GenUI 请求不转发模型供应商 key。

宿主项目还应验证 `ChatModelRuntime.options` 是 `Ref`/`ComputedRef`。如果传入 plain array，`model.options.value` 会变成 `undefined`，浏览器中原有的深度思考、联网搜索和模型选择器会一起消失。

浏览器验收：

- GenUI 与原有工具并列，而不是替换它们。
- 默认 `aria-pressed="false"`。
- 缺 URL/Prompt ID 时原生 `disabled`，title 提示具体变量。
- 开关切换不会改变当前模型。
- 样式与相邻按钮高度、圆角、字号和颜色一致。
- 页面错误日志为空。

![Step 2 GenUI 缺配置禁用态](./images/step-2-genui-disabled.png)

## 5. 区分代码、配置和服务状态

当 Agent 没有真实服务合同和授权时，正确结果是：

```text
CODE_INTEGRATED
BUILD_VERIFIED
UI_VERIFIED
CONFIG_PENDING
SERVICE_UNVERIFIED
```

只有 endpoint、Prompt ID、认证方式均由用户提供，并且真实请求返回有效 `schema-card` 且在浏览器渲染，才能升级为 `SERVICE_VERIFIED`。使用占位 URL、静态 JSON、mock response 或本地卡片都不算。

## 6. Git 检查点

推荐在两个阶段分别创建提交，便于复查和回滚：

```text
Step 1: feat: integrate TinyRobot chat
Step 2: feat: integrate GenUI interactions
```

这只是建议。Agent 必须先展示 `git status --short`、目标文件清单和验证结果，再等用户明确要求提交。

## 其他 Agent 产品适配

如果产品不支持 Codex 的 Skill 语法：

1. 让 Agent 完整加载 `opentiny-ai-app-integration/SKILL.md` 及其直接链接的 Step 1/Step 2 reference。
2. 把本页提示词中的 `$opentiny-ai-app-integration` 改成该产品的 Skill 调用方式。
3. 保留两次用户确认、`.env` 禁区、Git dirty 保护和全部状态码。
4. 如果 Agent 无法操作真实浏览器，把 UI checklist 交给开发者执行，结果只能写 `UI_UNVERIFIED`，不能按推测填写 `UI_VERIFIED`。
