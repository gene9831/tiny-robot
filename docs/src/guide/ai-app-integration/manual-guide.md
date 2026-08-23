---
outline: [1, 3]
---

# 完整人工操作手册

本页不依赖 Agent 或 Skill，开发者可以在现有 Vue 3 + Vite 应用中手动完成 Step 1 和 Step 2。示例基于 TinyRobot `0.5.2-alpha.10`、GenUI `1.3.0`，并在 `opentiny.design.home@8064255` 的临时 worktree 中从头重放。

## 环境要求

- macOS；本次验证为 macOS `26.6.2`、Apple Silicon。Linux 只可参考等价 shell 命令，未实际重放；Windows 未验证。
- Node.js `>=20.13.0`。验证使用 `v22.23.1`。
- pnpm 和 Git。本次应用 lockfile 是 `lockfileVersion: '9.0'`，实际重放工具为 pnpm `11.21.0`。不要把 lockfile 格式误认为本机 pnpm 版本。
- 一个已经能构建的 Vue 3 + Vite 业务应用，拥有独立 `package.json` 和 lockfile。
- 本地 TinyRobot 源码仓库，其中 CLI package 声明 `@opentiny/tiny-robot-cli@0.5.2-alpha.11`。

::: danger RELEASE-BLOCKER: LOCAL_CLI
当前 CLI 是本地修改、未发布版本。下面的本地路径命令是开发预览流程，不是正式发布命令。CLI 发布后必须替换为精确锁定版本的 `pnpm dlx`/`npx` 命令，并从干净应用重新验证。
:::

## Step 0：记录基线和边界

进入业务应用目录后执行：

```bash
pwd
git rev-parse --show-toplevel
git status --short
node --version
pnpm --version
```

检查项目边界：

```bash
test -f package.json
rg --files -g 'vite.config.*' -g 'src/**' -g 'pnpm-lock.yaml' -g 'package-lock.json' -g 'pnpm-workspace.yaml'
node -e "const p=require('./package.json'); console.log(JSON.stringify({name:p.name,dependencies:p.dependencies,devDependencies:p.devDependencies},null,2))"
```

成功证据：当前目录就是业务应用；Vue 3、Vite 和 lockfile 可见；你已记录所有 dirty 文件。

立即停止的情况：

- 包命令解析到父 workspace 或其他 importer：`WORKSPACE_BOUNDARY_BLOCKED`。
- 当前应用没有可核对的 lockfile，或安装后 lockfile 不记录目标依赖：`LOCKFILE_UNCHANGED`。
- CLI 目标文件已经存在或带有未保存改动：先人工合并或换干净分支，不能覆盖。

不要打开、打印或删除 `.env`。即使 `git status` 显示 `.env`，也只记录文件名。

## Step 1：使用本地 CLI 引入 TinyRobot

### 1.1 执行 CLI

通用命令：

```bash
node <TINY_ROBOT_REPO>/packages/cli/bin/cli.js add chat
```

本次验证命令：

```bash
node /Users/gene/Projects/tiny-robot/packages/cli/bin/cli.js add chat
```

CLI 会询问：

```text
Add the complete TinyRobot chat feature to <TARGET_APP_DIR>? (Y/n)
```

确认目标路径正确后输入 `Y` 或直接回车。不要使用 `create`。

### 1.2 核对 CLI 结果

执行：

```bash
git status --short
find src/tiny-robot-chat -type f | sort
node -e "const p=require('./package.json'); console.log(JSON.stringify(p.dependencies,null,2))"
```

本地 CLI 应创建：

```text
.env.example
src/TinyRobotChat.vue
src/tiny-robot-chat/components/ComposerTools.vue
src/tiny-robot-chat/components/WindowHeader.vue
src/tiny-robot-chat/composables/useWindow.ts
src/tiny-robot-chat/config/chat-runtime.ts
src/tiny-robot-chat/config/chat-ui.ts
```

并为 `package.json` 添加：

```json
{
  "@opentiny/tiny-robot": "0.5.2-alpha.10",
  "@opentiny/tiny-robot-chat": "0.5.2-alpha.10",
  "@opentiny/tiny-robot-kit": "0.5.2-alpha.10",
  "@opentiny/tiny-robot-svgs": "0.5.2-alpha.10",
  "@vueuse/core": "13.9.0"
}
```

`.env.example` 应只有空占位：

```dotenv
VITE_ALIYUN_DASHSCOPE_KEY=
VITE_DEEPSEEK_API_KEY=
```

CLI 不会做这些事：

- 不执行 `pnpm install`，所以 lockfile 此时尚未更新。
- 不修改 `src/main.js`/`src/main.ts`。
- 不把 `<TinyRobotChat />` 挂到业务页面。
- 不创建、读取或修改真实 `.env`。

如果交互取消、命令非零退出或只生成部分文件，记录 `CLI_INCOMPLETE`，不要手写聊天壳继续 Step 2。

### 1.3 挂载唯一聊天入口

以 `src/App.vue` 为例，在现有业务内容旁挂载一次：

```vue
<template>
  <div class="business-app">
    <ExistingBusinessContent />
    <TinyRobotChat />
  </div>
</template>

<script setup>
import ExistingBusinessContent from './components/ExistingBusinessContent.vue'
import TinyRobotChat from './TinyRobotChat.vue'
</script>
```

如果实际应用使用路由或 layout，把组件放到真实可达入口。不要同时在 `main.ts` 和页面组件中重复挂载。

CLI 生成的 `TinyRobotChat.vue` 已导入：

```ts
import { TrThemeProvider as TrTheme } from '@opentiny/tiny-robot'
import '@opentiny/tiny-robot/dist/style.css'
import { TrChat } from '@opentiny/tiny-robot-chat'
import '@opentiny/tiny-robot-chat/dist/style.css'
```

### 1.4 安装并核对解析

执行：

```bash
pnpm install
pnpm list @opentiny/tiny-robot @opentiny/tiny-robot-chat @opentiny/tiny-robot-kit @opentiny/tiny-robot-svgs @vueuse/core --depth 0
```

允许警告：`lodash.isequal@4.5.0` deprecated subdependency。本次验证中该警告不阻断安装。

检查 lockfile 和入口：

```bash
rg -n "@opentiny/tiny-robot|@vueuse/core" pnpm-lock.yaml
rg -n "TrThemeProvider|TrChat|dist/style\.css" src/TinyRobotChat.vue
rg -n "TinyRobotChat" src
git diff --check
```

必须能从真实入口追到唯一 `TinyRobotChat.vue`。字符串命中但页面未挂载不算完成。

### 1.5 构建与浏览器验收

```bash
pnpm build
pnpm dev --host 127.0.0.1 --port 4173
```

预期：构建退出码 `0`；可能出现 `Some chunks are larger than 500 kB`，它是允许警告，不是 build failure。

浏览器检查：

1. 业务页面正常显示。
2. “打开 TinyRobot”按钮可见。
3. 打开后是真实 `TrChat`，不是静态壳。
4. 深度思考、联网搜索和模型选择器仍可见。
5. 浏览器 error 日志为空。

![Step 1 TinyRobot 对话框](./images/step-1-tinyrobot-chat.png)

此时可以记录：

```text
TINYROBOT_INTEGRATED
BUILD_VERIFIED
UI_VERIFIED
```

没有真实模型 key 和联网请求证据时，仍是 `CONFIG_PENDING`/`SERVICE_UNVERIFIED`。

## Step 2：集成 GenUI 1.3.0

### 2.1 安装 GenUI 依赖

```bash
pnpm add @opentiny/genui-sdk-core@1.3.0 @opentiny/genui-sdk-vue@1.3.0 @opentiny/genui-sdk-materials-vue-opentiny-vue@1.3.0
```

三个包必须保持同一 `1.3.0` 版本。`PatternExtractor` 来自 core，因此 core 必须是直接依赖。

### 2.2 复制独立模板模块

本手册包含六个完整、可复用的 GenUI 模块：`GenuiProvider.vue`、`GenuiSwitch.vue`、`renderer.ts`、`request-routing.ts`、`stream-parser.ts`、`stream-plugin.ts`。可在 [GenUI 1.3.0 完整模板](./examples/genui-v1.3.0/) 页面查看和复制全部源码。

在 docs 源码仓库中操作时，可执行：

```bash
GENUI_EXAMPLE_DIR=/absolute/path/to/docs/tiny-robot/docs/src/guide/ai-app-integration/examples/genui-v1.3.0
mkdir -p src/tiny-robot-chat/genui
cp "$GENUI_EXAMPLE_DIR"/genui/* src/tiny-robot-chat/genui/
```

目标目录已存在或包含 dirty 文件时，不要覆盖式复制；逐文件比较并人工合并：

```bash
diff -ru "$GENUI_EXAMPLE_DIR/genui" src/tiny-robot-chat/genui
```

这些模块只负责 Provider/materials、开关、renderer、请求 URL/认证选择、流解析和 message plugin。模型清单、endpoint 和业务 UI 仍由宿主项目决定。

### 2.3 把 GenUI 接入唯一 TrChat

在 `src/TinyRobotChat.vue` 增加异步 Provider、状态和模块导入：

```ts
import { computed, defineAsyncComponent, reactive, ref } from 'vue'
import GenuiSwitch from './tiny-robot-chat/genui/GenuiSwitch.vue'
import { createChatProviderRuntime, genuiAvailable } from './tiny-robot-chat/config/chat-runtime'
import { createGenuiRendererMatch } from './tiny-robot-chat/genui/renderer'
import { createGenuiSchemaStreamPlugin } from './tiny-robot-chat/genui/stream-plugin'

const GenuiProvider = defineAsyncComponent(() => import('./tiny-robot-chat/genui/GenuiProvider.vue'))
const genuiEnabled = ref(false)
const providerRuntime = createChatProviderRuntime(() => genuiEnabled.value)
const runtime = useLocalChatRuntime({
  conversation: {
    useMessageOptions: {
      responseProvider: providerRuntime.responseProvider,
      plugins: [createGenuiSchemaStreamPlugin(() => genuiEnabled.value)],
    },
  },
})
runtime.composer.model = providerRuntime.model

const isGenerating = computed(() => runtime.activeConversation.value?.requestState === 'processing')
const genuiRendererMatch = createGenuiRendererMatch(isGenerating)

function handleGenuiToggle(enabled: boolean): void {
  if (enabled && !genuiAvailable) return
  genuiEnabled.value = enabled
}
```

把原来的唯一 `TrChat` 包在 Provider 中，并使用现有 Sender footer：

```vue
<GenuiProvider v-else>
  <TrChat :runtime="runtime" :ui="chatUi">
    <!-- 保留已有 layout-header、composer-before 和其他 slot -->
    <template #sender-footer>
      <GenuiSwitch
        :enabled="genuiEnabled"
        :available="genuiAvailable"
        @toggle="handleGenuiToggle"
      />
    </template>
  </TrChat>
</GenuiProvider>
```

不要再创建 `GenuiChat` 或第二个对话框。GenUI 是功能开关，不是一个名为“GenUI”的模型。

### 2.4 合并 bubble renderer

在 `chat-ui.ts` 的现有配置上增量合并：

```ts
import type {
  BubbleContentRendererMatch,
  BubbleMessage,
  LayoutFloatingOptions,
} from '@opentiny/tiny-robot'

export interface ChatUiConfigOptions {
  floatingOptions: Readonly<LayoutFloatingOptions>
  templateExtensions: NonNullable<ChatSenderOptions['extensions']>
  genuiRendererMatch: BubbleContentRendererMatch
}
```

```ts
bubble: {
  autoScroll: true,
  bubbleList: {
    contentRenderMode: 'split',
    contentResolver: (message: BubbleMessage) => {
      const state = message.state as { genuiContent?: BubbleMessage['content'] } | undefined
      return state?.genuiContent ?? message.content
    },
    roleConfigs: existingRoleConfigs,
  },
  bubbleProvider: {
    contentRendererMatches: [options.genuiRendererMatch],
  },
}
```

普通文本继续交给 `TrChat`。只有 `type: 'schema-card'` 的有效内容进入异步 `GenuiRenderer`。

### 2.5 实现动态请求 provider

`useLocalChatRuntime({ modelProviders })` 会把 endpoint 固定在 provider 配置中。GenUI 需要在每次发送时根据开关动态选 URL，因此改用 `conversation.useMessageOptions.responseProvider`，并给 `runtime.composer.model` 提供符合 TinyRobot API 的自定义 runtime。

关键契约：

```ts
const selectedModelId = ref(models[0].id)
const selectedModel = computed(() =>
  models.find(({ id }) => id === selectedModelId.value) ?? models[0],
)

const model: ChatModelRuntime = {
  options: computed(() => models), // 必须是 Ref/ComputedRef，不能直接传 models 数组
  selectedId: computed(() => selectedModelId.value),
  features: computed(() => featureState),
  select(id) {
    if (id !== null) selectedModelId.value = id
  },
  setFeature(id, enabled) {
    if (selectedModel.value.capabilities?.[id]) featureState[id] = enabled
  },
}
```

发送前动态解析目标：

```ts
const activeModel = selectedModel.value
const useGenui = isGenuiEnabled() && genuiAvailable
const target = resolveChatRequestTarget({
  modelId: activeModel.id,
  modelUrl: normalizeChatCompletionsUrl(activeModel.apiUrl),
  genuiEnabled: useGenui,
  genuiUrl,
})
const authorizationKey = resolveChatAuthorizationKey({
  genuiEnabled: useGenui,
  genuiApiKey,
  modelApiKey: activeModel.apiKey,
})
```

请求体必须始终使用当前选择：

```ts
body.model = activeModel.id
```

只有 GenUI 分支追加服务合同确认的 prompt：

```ts
body.prompt = {
  strategy: 'append',
  id: genuiPromptId,
  params: {
    customComponents: [],
    customExamples: [],
    customSnippets: [],
    customActions: [],
  },
}
```

开关不能强制选 DeepSeek/Qwen，也不能关闭后猜测恢复另一个模型。只有业务服务合同明确给出 mode allowlist 时，才在选项、selected ID 和真实请求三个边界共同执行 allowlist。

### 2.6 配置 `.env.example`

只向 `.env.example` 添加空占位：

```dotenv
VITE_GENUI_URL=
VITE_GENUI_PROMPT_ID=
VITE_GENUI_API_KEY=
```

启用条件只有 URL + Prompt ID：

```ts
export const genuiAvailable = Boolean(genuiUrl && genuiPromptId)
```

`VITE_GENUI_API_KEY` 是可选的浏览器 Bearer 配置，不是开关必需条件。任何 `VITE_*` 都会进入浏览器 bundle，不能放真正的服务端 secret；需要保密的认证必须走同源 BFF/服务端代理。

不要把 DashScope、DeepSeek 或其他模型供应商 key 发到不同 origin 的 GenUI endpoint。

修改 Vite 环境变量后必须重启 dev server。

### 2.7 复制并运行测试

模板测试文件也完整展示在 [GenUI 1.3.0 完整模板](./examples/genui-v1.3.0/) 页面。复制到应用：

```bash
mkdir -p tests
cp "$GENUI_EXAMPLE_DIR/tests/genui-integration.test.mjs" tests/genui-integration.test.mjs
```

执行：

```bash
node --experimental-strip-types --test tests/genui-integration.test.mjs
```

预期五项通过：跨 chunk parser、消息顺序、Sender footer、模型保持和认证隔离。

宿主项目建议再增加一个重要回归：实际 `ChatModelRuntime.options.value` 是数组，并且切换 GenUI 前后 `selectedId.value` 不变。本次重放正是这条检查发现了 plain array 导致原工具栏消失的问题。

### 2.8 生产构建

```bash
pnpm build
```

如果出现：

```text
Failed to resolve import "@opentiny/vue-theme/slider-button/index.css"
```

先确认错误确实来自 `@opentiny/vue-slider-button@3.31.x`，再添加对齐的兼容依赖：

```bash
pnpm add @opentiny/vue-theme@3.31.1
pnpm build
```

本次重放在添加 theme 后构建成功。GenUI Provider/Renderer 形成独立异步 chunk；仍出现大 chunk 警告，记录为已知性能风险，不要写成构建失败。

### 2.9 浏览器验收

重启 dev server：

```bash
pnpm dev --host 127.0.0.1 --port 4173
```

缺真实服务配置时，检查：

- GenUI 位于 Sender footer，并与深度思考、联网搜索、模型选择器共存。
- 默认关闭，`aria-pressed="false"`。
- 原生 `disabled=true`。
- title 为“请先配置 VITE_GENUI_URL 和 VITE_GENUI_PROMPT_ID”。
- 当前模型名称未变化。
- GenUI 与相邻工具计算样式一致。
- 浏览器 error 日志为空。

![Step 2 GenUI 缺配置禁用态](./images/step-2-genui-disabled.png)

此时正确状态：

```text
CODE_INTEGRATED
BUILD_VERIFIED
UI_VERIFIED
CONFIG_PENDING
SERVICE_UNVERIFIED
```

### 2.10 真实服务验收

只有得到用户提供的服务合同、endpoint、Prompt ID、认证方式并被授权发送请求后，才做真实服务验证：

1. 在私有环境文件中配置真实值，不写入 Git。
2. 重启 Vite。
3. 确认 GenUI 按钮启用且默认仍关闭。
4. 选择一个模型，记录模型名称；打开 GenUI 后名称保持不变。
5. 发送最小业务提示词。
6. 核对 Network：请求发往 GenUI URL，`body.model` 是当前模型，prompt ID 正确，未携带模型供应商 key。
7. 确认同一消息按顺序显示普通文本和真实 `schema-card`。
8. 确认 console error 为空。

全部通过才能记录 `SERVICE_VERIFIED`。本次手册验证没有执行这一步。

## 故障排查

| 症状 | 根因 | 核对命令/证据 | 修复 | 复验 |
| --- | --- | --- | --- | --- |
| 为什么要移除 `.env` | 不需要移除；删除会破坏用户配置 | `git status --short` 只看文件名，不打开内容 | 保留 `.env`；只维护 `.env.example` | 确认 Git diff/报告无 secret |
| GenUI 按钮禁用 | URL 或 Prompt ID 缺失；API key 不决定可用性 | 检查私有配置是否包含 `VITE_GENUI_URL` 和 `VITE_GENUI_PROMPT_ID`，不要打印值 | 补齐真实配置并重启 Vite | 按钮 enabled，默认仍关闭 |
| 修改配置后仍禁用 | Vite 在启动时读取环境变量 | dev server 启动时间早于配置修改 | 停止并重启 `pnpm dev` | `disabled=false` |
| GenUI 只能用 DeepSeek | 把 GenUI 错做成模型或写了无合同的 allowlist | 查看模型 options、selected ID 和请求 `body.model` | 删除合成 GenUI model；开关只切 URL/prompt | 开关前后模型名不变 |
| GenUI 出现后原工具栏消失 | 自定义 `ChatModelRuntime.options` 传了 plain array | 浏览器只剩 GenUI；源码为 `options: models` | 改为 `options: computed(() => models)` | 深度思考、搜索、模型和 GenUI 共存 |
| GenUI 按钮风格不一致 | 没复用 TinyRobot token/响应式规则 | 比较计算样式 | 使用 32px、full radius、14px、`currentColor` 16px 图标和同一 token | 与相邻按钮高度/圆角/色值一致 |
| schema 被截断或吞掉文字 | 对单 chunk `JSON.parse`，没有跨 chunk 状态 | 运行 parser 测试 | 使用 `PatternExtractor`，保留有序 text/card parts | 跨 chunk 测试通过 |
| GenUI 认证失败或泄露模型 key | 把供应商 key 当作 GenUI fallback | 检查请求 headers，不打印真实值 | GenUI 只用专用 key、会话认证或无认证 | 认证隔离测试和 Network 检查通过 |
| 缺主题 CSS，build 失败 | `vue-slider-button` 导入未声明的 theme 包 | 构建错误精确指向 `@opentiny/vue-theme/...` | 仅在证据成立时加 `@opentiny/vue-theme@3.31.1` | 重跑 build |
| build 通过但有大 chunk 警告 | TinyRobot/GenUI materials 体积大 | 构建输出包含 `larger than 500 kB` | 保留异步 Provider/Renderer；另开性能优化任务 | 记录警告，build 仍为 verified |

## Git 检查点与回滚

完成 Step 1、Step 2 后分别检查：

```bash
git status --short
git diff --check
git diff --stat
```

建议分别提交，避免把两步和其他业务修改混在一起：

```bash
git add <STEP_1_FILES>
git commit -m "feat: integrate TinyRobot chat"
```

```bash
git add <STEP_2_FILES>
git commit -m "feat: integrate GenUI interactions"
```

提交前再次确认 `.env` 不在 staged 文件中。若需要回滚，优先用阶段提交的 `git revert <commit>`，不要对包含用户其他改动的工作区执行 `git reset --hard`。

## 发布前清单

- [ ] `RELEASE-BLOCKER: LOCAL_CLI` 已由精确发布版本替代。
- [ ] 已从干净 Vue 3 + Vite 项目重新执行发布 CLI。
- [ ] CLI package 版本、生成 runtime 版本和文档版本表一致且不混淆。
- [ ] Step 1 与 Step 2 的测试、构建、UI 证据已更新。
- [ ] 真实 GenUI 服务已验证，或仍明确写 `SERVICE_UNVERIFIED`。
- [ ] Windows 若未重放，继续写 `WINDOWS_UNVERIFIED`。
- [ ] Linux 若未重放，继续写 `LINUX_COMMANDS_NOT_REPLAYED`。
- [ ] Step 3 WebMCP 和 Step 4 PageTool 未混入本手册的已验证范围。
