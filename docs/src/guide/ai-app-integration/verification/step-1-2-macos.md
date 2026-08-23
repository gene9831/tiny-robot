---
outline: [1, 3]
---

# Step 1/2 macOS 重放记录

## 结论

2026-08-23 在 `opentiny.design.home@8064255` 的临时 Git worktree 中，从干净业务基线完整重放了 Step 1 与 Step 2。

最终状态：

```text
TINYROBOT_INTEGRATED
CODE_INTEGRATED
BUILD_VERIFIED
UI_VERIFIED
CONFIG_PENDING
SERVICE_UNVERIFIED
RELEASE-BLOCKER: LOCAL_CLI
WINDOWS_UNVERIFIED
LINUX_COMMANDS_NOT_REPLAYED
```

真实 GenUI endpoint、Prompt ID、认证和有效 `schema-card` 响应未提供，因此没有执行真实服务请求，也没有制作启用态或卡片 mock。

## 环境

| 项目 | 值 |
| --- | --- |
| 日期 | 2026-08-23 |
| OS | macOS 26.6.2 (25G83), arm64 |
| Node.js | v22.23.1 |
| pnpm | 11.21.0 |
| 基线 lockfile | `lockfileVersion: '9.0'` |
| 应用基线 | `8064255` |
| worktree | `/private/tmp/opentiny-manual-replay-step-1-2` |
| 临时分支 | `codex/manual-replay-step-1-2` |
| Step 1 checkpoint | `131c01f` |
| Step 2 checkpoint | `09d569a` |
| 本地 CLI repo HEAD | `4b4b485264d047a255a13c272576873ca8e6d043` |
| 本地 CLI branch | `codex/fix-cli-0.5.2-alpha.11` |
| CLI package | `@opentiny/tiny-robot-cli@0.5.2-alpha.11` |
| CLI 生成 runtime | TinyRobot `0.5.2-alpha.10` |
| GenUI SDK | `1.3.0` |
| Skill GenUI workflow | `cb47887` |
| Skill GenUI template | `4f73264` |

本地 CLI 仓库有未跟踪 `.pnpm-store/`，未纳入验证变更。原业务工作区存在用户的已暂存/未暂存文件和一个未跟踪 `.env`；验证只记录状态，没有读取 `.env`，也没有改动原工作区。

## worktree 创建

命令：

```bash
git -C /Users/gene/Projects/opentiny.design.home worktree add \
  /private/tmp/opentiny-manual-replay-step-1-2 \
  -b codex/manual-replay-step-1-2 8064255
```

结果：exit code `0`。

```text
Preparing worktree (new branch 'codex/manual-replay-step-1-2')
HEAD is now at 8064255
```

worktree 在本次记录完成后仍保留，未合并回业务 `main`，未自动删除。

## 基线验证

```bash
pnpm install --frozen-lockfile
pnpm build
```

结果：均为 exit code `0`。冻结安装没有修改 package/lockfile；基线构建 19 modules，输出：

```text
dist/assets/index-CVKoq-MY.js 69.53 kB
✓ built
```

基线应用没有 test script，因此以冻结安装、生产构建和零 Git diff 作为基线门。

## Step 1

### CLI

命令：

```bash
node /Users/gene/Projects/tiny-robot/packages/cli/bin/cli.js add chat
```

交互：确认目标路径后接受默认 `Yes`。结果：exit code `0`。

实际生成：

```text
.env.example
src/TinyRobotChat.vue
src/tiny-robot-chat/components/ComposerTools.vue
src/tiny-robot-chat/components/WindowHeader.vue
src/tiny-robot-chat/composables/useWindow.ts
src/tiny-robot-chat/config/chat-runtime.ts
src/tiny-robot-chat/config/chat-ui.ts
```

CLI 修改 `package.json`，添加 TinyRobot `0.5.2-alpha.10` 与 `@vueuse/core@13.9.0`。CLI 没有改 `src/main.js`、没有安装依赖、没有更新 lockfile、没有自动挂载组件、没有创建 `.env`。

### 人工挂载和安装

在 `src/App.vue` 导入并唯一挂载 `TinyRobotChat`，然后执行：

```bash
pnpm install
pnpm list @opentiny/tiny-robot @opentiny/tiny-robot-chat @opentiny/tiny-robot-kit @opentiny/tiny-robot-svgs @vueuse/core --depth 0
```

安装结果：exit code `0`。允许警告：

```text
1 deprecated subdependencies found: lodash.isequal@4.5.0
```

`pnpm list` 首次在沙箱内因 pnpm v11 SQLite store index 权限失败；在沙箱外只读重跑后 exit code `0`，确认五个包都解析为预期版本。这是执行环境权限问题，不是应用依赖失败。

### 构建

```bash
pnpm build
```

结果：exit code `0`，3501 modules。

```text
dist/assets/index-BU6BBQ5r.js 1,839.37 kB
✓ built
```

允许警告：`Some chunks are larger than 500 kB after minification`。

### 浏览器

```bash
pnpm dev --host 127.0.0.1 --port 4173
```

沙箱内首次监听端口返回 `EPERM`；获批后在沙箱外重跑成功。浏览器确认：

- “打开 TinyRobot”按钮可见；
- 对话框可以打开；
- 深度思考、联网搜索和 Qwen3.7 Flash 模型选择器可见；
- console error 为 `[]`。

截图：[Step 1 TinyRobot](../images/step-1-tinyrobot-chat.png)。

### checkpoint

```bash
git commit -m "test: replay TinyRobot chat integration"
```

临时提交：`131c01f`，10 files changed。

## Step 2

### GenUI 依赖

```bash
pnpm add @opentiny/genui-sdk-core@1.3.0 @opentiny/genui-sdk-vue@1.3.0 @opentiny/genui-sdk-materials-vue-opentiny-vue@1.3.0
```

结果：exit code `0`。三个 GenUI 包均为 `1.3.0`。

### 模板和宿主适配

从 Skill commit `4f73264` 的 `assets/genui-v1.3.0/` 添加六个独立模块和通用测试。宿主修改：

- `TinyRobotChat.vue`：异步 Provider、stream plugin、renderer、Sender footer switch、动态 response provider。
- `chat-ui.ts`：split content、state resolver、`schema-card` renderer match。
- `chat-runtime.ts`：selected model、动态 URL、prompt、认证隔离。
- `.env.example`：GenUI 三个空占位。

独立模块一致性：

```bash
diff -ru \
  /Users/gene/.codex/skills/opentiny-ai-app-integration/assets/genui-v1.3.0/genui \
  src/tiny-robot-chat/genui
```

结果：exit code `0`，无输出。

### 通用测试

```bash
node --experimental-strip-types --test tests/genui-integration.test.mjs
```

模板的五项测试首先全部通过：

```text
tests 5
pass 5
fail 0
```

### 构建失败与根因

首次 `pnpm build` 失败，exit code `1`：

```text
Failed to resolve import "@opentiny/vue-theme/slider-button/index.css"
from "@opentiny/vue-slider-button@3.31.0/lib/pc.js"
```

调查确认 slider-button 源码直接 import theme CSS，但自身 package 未声明 theme 依赖；应用根目录也没有可解析的 direct link。添加：

```bash
pnpm add @opentiny/vue-theme@3.31.1
```

结果：exit code `0`。重跑构建成功。

### 浏览器发现的宿主回归

第一次打开 Step 2 页面时只显示 GenUI，深度思考、联网搜索和模型选择器消失。目标包源码证明 `sender-footer` 会追加在 `ModelFeatures`/`ModelSelector` 之后，并非 slot 覆盖。

根因：自定义 `ChatModelRuntime` 使用：

```ts
options: models
```

TinyRobot adapter 实际读取 `model.options.value`，因此 options 必须是 `Ref`/`ComputedRef`。修复：

```ts
options: computed(() => models)
```

新增一项宿主回归测试，验证 options 可读和开关前后 selected model 不变。最终结果：

```text
tests 6
pass 6
fail 0
```

### 最终构建

```bash
pnpm build
```

结果：exit code `0`，5706 modules。

主要异步产物：

```text
renderer-*.js       844.19 kB
GenuiProvider-*.js  3,441.53 kB
```

允许警告仍为 `Some chunks are larger than 500 kB after minification`。

### 最终 UI

依赖变更后重启 Vite，浏览器确认：

- 深度思考、联网搜索、Qwen3.7 Flash、GenUI 同时存在；
- GenUI `disabled=true`、`aria-pressed="false"`；
- title 明确提示 `VITE_GENUI_URL` 和 `VITE_GENUI_PROMPT_ID`；
- GenUI 与深度思考计算样式一致：height `32px`、border-radius `9999px`、font-size `14px`、color `rgb(89, 89, 89)`；
- console error 为 `[]`。

截图：[Step 2 GenUI 禁用态](../images/step-2-genui-disabled.png)。

### checkpoint

```bash
git commit -m "test: replay GenUI integration"
```

临时提交：`09d569a`，13 files changed。

## 最终文件边界

Step 1 相对 `8064255`：

```text
A .env.example
M package.json
M pnpm-lock.yaml
M src/App.vue
A src/TinyRobotChat.vue
A src/tiny-robot-chat/components/ComposerTools.vue
A src/tiny-robot-chat/components/WindowHeader.vue
A src/tiny-robot-chat/composables/useWindow.ts
A src/tiny-robot-chat/config/chat-runtime.ts
A src/tiny-robot-chat/config/chat-ui.ts
```

Step 2 相对 Step 1：

```text
M .env.example
M package.json
M pnpm-lock.yaml
M src/TinyRobotChat.vue
M src/tiny-robot-chat/config/chat-runtime.ts
M src/tiny-robot-chat/config/chat-ui.ts
A src/tiny-robot-chat/genui/*
A tests/genui-integration.test.mjs
```

## 未验证项

- 真实 GenUI endpoint、Prompt ID、认证方式和 `schema-card`：`SERVICE_UNVERIFIED`。
- GenUI enabled 截图：没有用占位 URL 伪造。
- Step 3 业务 WebMCP 与业务 Skill：不属于本次重放。
- Step 4 PageTool：不属于本次重放。
- Windows：`WINDOWS_UNVERIFIED`。
- Linux：`LINUX_COMMANDS_NOT_REPLAYED`。
