---
outline: [1, 3]
---

# 完整人工操作手册

本页不依赖 Agent 或 Skill，开发者可以在现有 Vue 3 + Vite 应用中手动完成四步集成。Step 1/2 基于 TinyRobot `0.5.2-alpha.10`、GenUI `1.3.0`，并在 `opentiny.design.home@8064255` 的临时 worktree 中从头重放；Step 3/4 基于该业务项目的真实工作树、Next SDK `0.4.2` 和 `http://localhost:5174/` 浏览器闭环恢复。业务项目的 Step 3/4 尚未形成提交，不能把基线提交 `8064255` 误写成实现提交。

本页的浏览器闭环章节是**开发者人工运行时验收**，不是 Agent 完成代码接入时的默认动作。Agent 默认执行依赖/源码核对、契约测试、类型检查和生产构建；只有提示词明确要求验证对应功能时，才代为执行运行时闭环。

## 环境要求

- macOS；本次验证为 macOS `26.6.2`、Apple Silicon。Linux 只可参考等价 shell 命令，未实际重放；Windows 未验证。
- Node.js `>=20.13.0`。Step 1/2 重放使用 `v22.23.1`；Step 3/4 文档整理时的只读复核环境为 `v26.7.0`，原浏览器验证时没有单独保存 Node 版本输出。
- pnpm 和 Git。本次应用 lockfile 是 `lockfileVersion: '9.0'`，实际重放工具为 pnpm `11.21.0`。不要把 lockfile 格式误认为本机 pnpm 版本。
- 一个已经能构建的 Vue 3 + Vite 业务应用，拥有独立 `package.json` 和 lockfile。Step 3/4 还要求已有唯一 TinyRobot `TrChat` 和可观察、可测试的真实页面状态。
- 已发布的 `@opentiny/tiny-robot-cli@0.5.2-alpha.12`；建议使用完整版本号，避免 `latest` 标签解析到其他版本。
- 人工运行时验收时需要能使用当前模型服务完成自然语言工具调用。代码接入阶段不要求 endpoint、认证或密钥；这些值由开发者在私有环境中配置，本手册不读取、复制或展示。

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

## Step 1：使用 TinyRobot CLI 引入 TinyRobot

### 1.1 执行 CLI

pnpm 项目运行：

```bash
pnpm dlx @opentiny/tiny-robot-cli@0.5.2-alpha.12 add chat
```

npm 项目运行：

```bash
npx @opentiny/tiny-robot-cli@0.5.2-alpha.12 add chat
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

CLI 应创建：

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

没有明确 mode allowlist 时，开关不能强制选 DeepSeek/Qwen，也不能关闭后猜测恢复另一个模型。只有业务服务合同明确给出 mode allowlist 时，才在选项、selected ID 和真实请求三个边界共同执行 allowlist。验证项目后来明确要求 GenUI 只允许 Qwen、非 GenUI 只允许 DeepSeek；这是宿主适配，不属于可复制的 GenUI 通用模板。

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
- 没有 mode allowlist 时当前模型名称不变；有明确策略时只显示当前模式允许的模型，且 UI 与真实请求一致。
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

## Step 3：添加业务 WebMCP 与业务 Skill

Step 3 的目标不是让模型“知道页面文案”，而是把真实业务状态注册成标准 WebMCP 工具，并用业务 Skill 教模型在什么意图下选择哪个工具。验证项目选择首页主视觉轮播，因为它已经存在、由六个稳定业务 ID 驱动、状态变化可见、可测试，而且不会产生提交或删除等高风险副作用。

### 3.1 只读恢复页面能力和 SDK API

**操作目的**：确认 TinyRobot、GenUI、模型策略和业务状态已经存在，并以当前安装源码为准确认 WebMCP API。

**工作目录**：业务应用根目录。

**完整命令**：

```bash
pwd
git rev-parse --show-toplevel
git status --short
node -e "const p=require('./package.json'); console.log(JSON.stringify({dependencies:p.dependencies,devDependencies:p.devDependencies},null,2))"
rg -n "TrChat|useLocalChatRuntime|mcp|skillPlugin|modelContext|initializeBuiltinWebMCP" src tests
rg -n "registerTool|listTools|getTools|executeTool" node_modules/@opentiny/next-sdk -g '*.ts' -g '*.d.ts' -g '*.js'
```

**修改或新增文件**：无。

**关键代码说明**：验证版本的 `initializeBuiltinWebMCP()` 会在浏览器中初始化 WebMCP polyfill 和 bridge；业务工具通过 `document.modelContext.registerTool` 注册。TinyRobot adapter 从 `listTools()` 读取工具，旧环境可降级到 `getTools()`，执行时调用 `executeTool(descriptor, JSON.stringify(args))`。

**预期结果**：能证明当前页面存在真实状态源或可安全提取状态；能定位当前版本的注册、列举和执行 API；现有 `TrChat`、GenUI 与模型策略保持可用。

**常见问题与排查**：

- 只能找到静态文案，没有真实状态：停止，不要用日志、mock 或硬编码助手回复冒充工具。
- `node_modules` 中没有 Next SDK：先确认 package/lockfile 边界，再执行下一节的精确安装。
- 目标能力需要未提供的 endpoint、认证或业务合同：暂停，由项目负责人提供配置和授权。

### 3.2 安装 Next SDK 并初始化 WebMCP

**操作目的**：在当前应用边界安装已验证版本，并确保业务工具在 Vue 挂载前完成注册。

**工作目录**：业务应用根目录。

**完整命令**：

```bash
pnpm add @opentiny/next-sdk@0.4.2
pnpm list @opentiny/next-sdk --depth 0
```

**修改或新增文件**：

```text
package.json
pnpm-lock.yaml
src/main.js
```

**关键代码说明**：入口使用：

```ts
import { initializeBuiltinWebMCP } from '@opentiny/next-sdk/core'
import { registerOpenTinyBusinessTools } from './webmcp/register-business-tools'

initializeBuiltinWebMCP()
const unregisterOpenTinyBusinessTools = registerOpenTinyBusinessTools()
```

开发热更新时用注册函数返回的清理函数终止旧注册，避免同一工具重复累积。不要把工具注册延迟到模型第一次请求之后。

**预期结果**：`pnpm list` 显示 `@opentiny/next-sdk 0.4.2`；入口在 `createApp(App).mount(...)` 之前完成初始化和业务工具注册。

**常见问题与排查**：

- 安装修改了父 workspace 的 lockfile：说明目录边界错误，停止并恢复到正确应用 importer 后重做。
- `document.modelContext.registerTool` 不可用：确认初始化顺序、浏览器环境和实际 package 版本；不要吞掉错误继续启动聊天。
- HMR 后工具重复：为业务工具使用 `AbortController.signal` 注册，并在 dispose 时执行清理函数。

### 3.3 建立共享业务状态和工具合同

**操作目的**：让页面组件和 WebMCP 工具读写同一份真实状态，并提供可验证的参数、返回值和错误合同。

**工作目录**：业务应用根目录。

**完整命令**：

```bash
mkdir -p src/business src/webmcp tests
rg -n "enterprise-ai|webmcp-ecosystem|gosim-2025|tinyvue-space|tinyengine-material-import|genui-sdk" src
```

**修改或新增文件**：

```text
src/business/opentiny-showcases.ts
src/components/HeroCarousel.vue
src/webmcp/register-business-tools.ts
tests/webmcp-business.test.mjs
```

**关键代码说明**：

业务状态 `openTinyShowcaseState` 提供当前展示项、`select(showcaseId)` 和自动轮播 `advance()`。WebMCP 工具调用 `select` 时传入 `pauseAutoRotation: true`，因此工具结果不会四秒后被轮播计时器覆盖。

已验证工具合同：

| 工具 | 参数 | annotations | 成功返回 | 错误 |
| --- | --- | --- | --- | --- |
| `list_opentiny_showcases` | 空对象；不允许额外属性 | `readOnlyHint: true`、非 destructive、非 open world | `ok: true`、当前 ID、六项能力的 ID/标题/说明 | 注册或浏览器 API 错误 |
| `show_opentiny_showcase` | 必填 `showcaseId`，enum 为六个稳定 ID，不允许额外属性 | 非 read-only、非 destructive、非 open world | `ok: true`、当前 ID、标题和用户反馈 message | `INVALID_ARGUMENT`、`SHOWCASE_NOT_FOUND` |

成功结构：

```json
{
  "ok": true,
  "data": {
    "activeShowcaseId": "genui-sdk",
    "title": "扩展大模型交互方式"
  },
  "message": "已切换到 GenUI SDK：扩展大模型交互方式"
}
```

错误结果设置 `isError: true`，同时在 `structuredContent.error` 返回稳定 `code`、可读 `message` 和不含敏感数据的 `details`。`content` 保留对应文本结果，供不同 MCP 消费端显示。

**预期结果**：页面手动点击和 WebMCP 工具都更新同一状态；未知 ID 不改变当前展示；工具选择后自动轮播暂停。

**常见问题与排查**：

- 用标题或 DOM selector 当参数：改为稳定业务 ID，并把合法值写入 enum。
- 工具执行成功但页面没有变化：检查页面是否仍维护另一份局部 `ref`，应改为共享业务状态。
- 页面短暂切换后被轮播覆盖：工具选择需要暂停自动轮播，并增加对应回归测试。
- 只返回字符串：补充 `structuredContent` 和稳定错误码，不能让模型解析自然语言猜测成功与否。

### 3.4 接入 TinyRobot adapter 和业务 Skill

**操作目的**：把浏览器已注册的真实工具暴露给唯一 `TrChat`，并给模型提供业务语义而不是第二套执行逻辑。

**工作目录**：业务应用根目录。

**完整命令**：

```bash
mkdir -p src/tiny-robot-chat/webmcp src/tiny-robot-chat/skills
rg -n "useLocalChatRuntime|responseProvider|plugins|mcp" src/TinyRobotChat.vue src/tiny-robot-chat
```

**修改或新增文件**：

```text
src/TinyRobotChat.vue
src/tiny-robot-chat/webmcp/builtin-webmcp-adapter.ts
src/tiny-robot-chat/skills/opentiny-showcase.ts
```

**关键代码说明**：adapter 使用固定 server ID `opentiny-page`，向模型暴露命名空间工具名，同时用 `originalName` 找到浏览器 descriptor：

```text
list_opentiny_showcases
→ opentiny-page__list_opentiny_showcases

show_opentiny_showcase
→ opentiny-page__show_opentiny_showcase
```

业务 Skill 名为 `opentiny-showcase`，使用 TinyRobot Kit 的 manual `skillPlugin` 注入当前请求。它必须说明：

- 页面有哪些能力；
- “有哪些”映射到 list，“看看/展示/切换”映射到 show；
- 六个自然语言名称和稳定 ID 的映射；
- 参数不能是标题或临时 DOM 标识；
- 成功只根据 `ok: true` 和工具 message 反馈；
- `INVALID_ARGUMENT`、`SHOWCASE_NOT_FOUND`、`WEBMCP_TOOL_EXECUTION_FAILED` 时不得声称成功；
- show 只切换轮播，不提交、删除或打开外部链接。

**预期结果**：TinyRobot 的 MCP UI 显示一个已启用的页面 server 和两个业务工具；普通文本、GenUI、宿主模型选择和业务 Skill 共存于同一 `TrChat`。

**常见问题与排查**：

- 模型能看到工具但调用名不匹配：检查命名空间名、`originalName` 和 descriptor 查找是否分别处理。
- 工具调用抛异常后助手仍说成功：adapter 应返回 `WEBMCP_TOOL_EXECUTION_FAILED` 结构，Skill 必须要求按 `ok` 判断。
- MCP 接入后 GenUI 或模型工具栏消失：检查是否创建了第二个 runtime/聊天框，或覆盖了已有 plugins、response provider 和模型 runtime。

### 3.5 合同测试和生产构建

**操作目的**：分别验证业务合同和全部既有回归，再确认生产构建仍成立。

**工作目录**：业务应用根目录。

**完整命令**：

```bash
node --test --experimental-strip-types tests/webmcp-business.test.mjs
node --test --experimental-strip-types tests/*.test.mjs
pnpm build
```

**修改或新增文件**：测试只读取源码；构建更新被项目忽略的 `dist` 产物，不应修改业务源码。

**关键代码说明**：八项 WebMCP 测试覆盖真实状态成功/失败、两个工具合同、参数错误、未知 ID、轮播保持、adapter 真实 descriptor 执行、浏览器执行错误和业务 Skill 注入。Step 3 当时的全量测试由 GenUI 6 项和 WebMCP 8 项组成。

**预期结果**：WebMCP `8/8`；当时全量 `14/14`；`pnpm build` exit code `0`。加入 Step 4 后当前全量复核为 `23/23`。构建允许记录 Next SDK direct-eval 和大 chunk 警告，但不能把警告写成失败或静默删除。

**常见问题与排查**：

- Node 不识别 `.ts`：确认 Node 版本支持 `--experimental-strip-types`，并保持参数位置与命令一致。
- 单项测试通过、全量测试失败：优先检查 GenUI plugins、模型策略和 adapter 是否被覆盖。
- build 通过但工具合同失败：仍不能记录 `WEBMCP_CONTRACT_VERIFIED`。

### 3.6 真实浏览器闭环

**操作目的**：证明模型通过指定 WebMCP 工具改变真实页面状态，而不是只生成了一段正确文字。

**工作目录**：业务应用根目录。

**完整命令**：

```bash
pnpm dev --host 127.0.0.1 --port 5174
```

浏览器打开：

```text
http://localhost:5174/
```

**修改或新增文件**：无。

**关键代码说明**：验证项目在 GenUI 关闭、DeepSeek 模式下输入：

```text
带我看看 GenUI SDK 的展示
```

完整链路：

```text
自然语言
→ opentiny-page__show_opentiny_showcase
→ { "showcaseId": "genui-sdk" }
→ openTinyShowcaseState.select(...)
→ 首页主视觉显示 GenUI SDK
→ 工具 message 反馈给用户
```

**预期结果**：页面显示“GenUI SDK / 扩展大模型交互方式”，结果保持超过 9 秒，没有被自动轮播覆盖。分别记录 `WEBMCP_CONTRACT_VERIFIED` 和 `WEBMCP_UI_VERIFIED`。

**常见问题与排查**：

- 模型直接回答但没有工具卡片：确认 MCP server/tool enabled、Skill 已注入、提示词能唯一映射到工具。
- 调用 list 而不是 show：提示词需要包含明确“看看/展示/切换”意图和具体能力。
- 页面变化但助手说失败，或页面未变却说成功：同时检查工具结构化结果、页面状态和最终反馈，三者必须一致。
- 没有可用模型 endpoint 或认证：立即暂停让开发者配置，不读取或回显私有值。

## Step 4：使用 WebMCP 与 PageTool 自动操作

PageTool 适合查询页面结构、定位内容、滚动和安全导航，不是通用业务写操作接口。验证项目没有创建新页面，而是在现有 Header、轮播、场景区块和产品区块上补充稳定语义。

### 4.1 阅读当前版本 PageTool 类型、源码和动作 schema

**操作目的**：确认真实注册 API、固定工具名、动作参数和 SDK 自身没有提供的安全能力。

**工作目录**：业务应用根目录。

**完整命令**：

```bash
node -e "const p=require('./node_modules/@opentiny/next-sdk/package.json'); console.log(p.version)"
rg -n "registerPageAgentTool|PageAgentToolOptions|page-agent-tool" node_modules/@opentiny/next-sdk -g '*.ts' -g '*.d.ts' -g '*.js'
rg -n "browserState|searchTree|click|scroll|fill|select|executeJavascript" node_modules/@opentiny/next-sdk/page-tools -g '*.ts'
sed -n '1,240p' node_modules/@opentiny/next-sdk/page-tools/page-agent-tool.ts
sed -n '1,220p' node_modules/@opentiny/next-sdk/page-tools/schema.ts
```

**修改或新增文件**：无。

**关键代码说明**：验证版本 `0.4.2` 的 `registerPageAgentTool(options)` 固定注册 `page-agent-tool`。`browserState` 重建 A11y tree 和 ref map；`searchTree` 按语义关键词缩小树；`click`、`fill`、`select` 使用 ref；`scroll` 可作用于页面或容器；`executeJavascript` 会进入实际脚本执行实现。

SDK 没有业务动作 allowlist、提交确认参数或调用前取消钩子。页面 whitelist 只影响语义树构造，不能阻止模型调用 `executeJavascript`，因此必须另加 adapter 执行前策略。

**预期结果**：确认工具名、options 类型和七个动作均来自当前安装源码，而不是其他项目或旧版本示例。

**常见问题与排查**：

- 文档示例与安装源码不同：始终以目标项目 package、类型和源码为准。
- 认为 blacklist/whitelist 是权限系统：它们只裁剪或增强语义树，必须继续实现 adapter 策略。
- 计划直接开放 `executeJavascript`：停止；当前项目明确禁止该动作。

### 4.2 注册 PageTool 并暴露稳定页面语义

**操作目的**：注册原生工具，并让模型通过业务 ID、可访问名称和语义属性定位现有页面。

**工作目录**：业务应用根目录。

**完整命令**：

```bash
mkdir -p src/webmcp
rg -n "id=|aria-|role=|href=|button|input|select|form" src/components src/App.vue
```

**修改或新增文件**：

```text
src/webmcp/register-page-tool.ts
src/main.js
src/components/Header.vue
src/components/HeroCarousel.vue
src/components/ScenarioSection.vue
src/TinyRobotChat.vue
```

**关键代码说明**：注册配置为：

```ts
export const OPEN_TINY_PAGE_TOOL_OPTIONS = {
  enableHighlight: false,
  removeMaskAfterToolCall: true,
  a11yConfig: {
    blacklist: [
      '.chat-add-window',
      '.chat-add-launcher',
      '[data-page-tool-exclude="true"]',
    ],
    whitelist: ['[data-page-tool-id]'],
    exposedAttributes: [
      'data-page-tool-id',
      'data-page-tool-action',
      'data-business-id',
    ],
  },
}
```

在入口中调用 `registerOpenTinyPageTool(registerPageAgentTool)`。TinyRobot adapter 增加 PageTool summary 后，模型看到 `opentiny-page__page-agent-tool`。

语义节点示例：

```html
<a
  href="#products"
  data-page-tool-id="scenario-view-products"
  data-page-tool-action="navigation"
>
  查看其他应用智能化改造后提升效率的案例
</a>
```

轮播 Tab 同时暴露 `data-business-id`、稳定 `data-page-tool-id`、原生 `role="tab"`、`aria-label` 和 `aria-selected`。TinyRobot 区域通过 class blacklist 排除；外部 GitHub 链接和视频通过 `data-page-tool-exclude="true"` 排除。

**预期结果**：PageTool 树能识别首页、产品导航、轮播 Tab、场景入口和产品区块；不会把 TinyRobot 自身、外部跳转或媒体控件作为可操作业务面。

**常见问题与排查**：

- 用构建生成的 class 或 `nth-child` 定位：改为稳定业务 ID、section ID、组件语义和可访问名称。
- 只添加自定义属性，没有原生语义：链接仍用 `<a>`，按钮仍用 `<button>`，并补充正确名称和状态。
- TinyRobot 出现在页面树中：检查窗口与 launcher 的 blacklist 是否匹配实际 class，且没有被组件重命名。

### 4.3 增加 adapter 动作策略和 PageTool Skill

**操作目的**：在真实浏览器执行前区分允许动作与危险动作，并让模型遵循 observe、定位、执行、重新 observe 的顺序。

**工作目录**：业务应用根目录。

**完整命令**：

```bash
mkdir -p src/tiny-robot-chat/webmcp src/tiny-robot-chat/skills
rg -n "callTool|executeTool|page-agent-tool|browserState|executeJavascript" src/tiny-robot-chat src/webmcp
```

**修改或新增文件**：

```text
src/tiny-robot-chat/webmcp/page-tool-policy.ts
src/tiny-robot-chat/webmcp/builtin-webmcp-adapter.ts
src/tiny-robot-chat/skills/opentiny-page-agent.ts
src/tiny-robot-chat/skills/opentiny-showcase.ts
```

**关键代码说明**：策略在 adapter 调用 `executeTool` 之前运行：

| 类别 | 动作 | 验证项目策略 |
| --- | --- | --- |
| 查询 | `browserState`、`searchTree` | 允许 |
| 导航 | `click`、`scroll` | 允许 |
| 表单 | `fill`、`select` | 返回 `PAGE_TOOL_FORM_ACTION_UNAVAILABLE` |
| 副作用 | `executeJavascript`、空动作、未知动作 | 返回 `PAGE_TOOL_SIDE_EFFECT_BLOCKED` |

adapter 还区分：

- `WEBMCP_API_UNAVAILABLE`：缺少工具列表或执行 API；
- `WEBMCP_TOOL_UNAVAILABLE`：当前页面没有 descriptor；
- `WEBMCP_TOOL_EXECUTION_FAILED`：浏览器执行抛错。

PageTool Skill 名为 `opentiny-page-agent`，说明：

1. 查询内容、定位区块、滚动和安全页内导航才使用 PageTool。
2. 已知轮播业务切换优先调用专用 `show_opentiny_showcase`。
3. click 前先 `browserState`；关键词定位可先 `searchTree`。
4. 只使用最新工具结果中的 ref，不猜索引或临时 CSS。
5. 页面状态变化后继续操作前重新 observe。
6. 当前页面不允许 `fill`、`select`、`executeJavascript`。
7. 提交、删除、发布必须改用带明确确认参数的专用业务 WebMCP；没有该工具时拒绝。

**预期结果**：不允许动作在浏览器执行前即返回结构化错误，`executeTool` 调用次数保持为零；允许查询和滚动仍通过真实 descriptor 执行。

**常见问题与排查**：

- 只在 Skill 里写“不要执行”：提示词不是安全机制，必须保留 adapter 策略测试。
- 页面更新后 click 失败：ref 是每次 A11y tree 生成的临时索引，重新调用 `browserState` 获取新 ref。
- 用户要求提交或删除：不要用 PageTool 点击按钮；检查是否存在带确认合同的业务工具，不存在就说明无法执行。

### 4.4 PageTool 合同测试和生产构建

**操作目的**：验证注册、语义面、策略、错误分类和 Skill，同时确认 Step 1 至 Step 3 不回归。

**工作目录**：业务应用根目录。

**完整命令**：

```bash
node --test --experimental-strip-types tests/page-tool.test.mjs
node --test --experimental-strip-types tests/*.test.mjs
pnpm build
```

**修改或新增文件**：

```text
tests/page-tool.test.mjs
```

测试和构建不应修改业务源码；构建只更新被忽略的 `dist`。

**关键代码说明**：九项 PageTool 测试覆盖注册配置、四类动作、阻止脚本执行、允许查询、允许滚动、工具不存在、执行 API 不存在、列表 API 不存在和 PageTool Skill 边界。

**预期结果**：PageTool `9/9`；当前全量 `23/23`；`pnpm build` exit code `0`。构建可保留 Next SDK direct-eval 和大 chunk 警告。

**常见问题与排查**：

- 单项 `9/9` 但全量不足 `23/23`：检查是否覆盖了业务 Skill plugins、GenUI 或模型策略。
- 阻止测试通过但实际仍执行：测试必须正向断言 browser execution count 为零，并核对策略位于 `executeTool` 之前。
- 构建失败于 Next SDK API：重新检查当前安装版本的导出路径，不照搬其他版本。

### 4.5 真实自然语言页面操作闭环

**操作目的**：证明模型通过 PageTool 操作现有页面，并且没有顺带改变用户明确要求保持不变的业务状态。

**工作目录**：业务应用根目录。

**完整命令**：

```bash
pnpm dev --host 127.0.0.1 --port 5174
```

浏览器打开：

```text
http://localhost:5174/
```

**修改或新增文件**：无。

**关键代码说明**：验证时关闭 GenUI，选择宿主允许的 DeepSeek V4 Flash，输入：

```text
请把页面滚动到最下方“让企业前端应用自然拥有智能交互能力”这个区块，不要切换轮播图。
```

完整链路：

```text
自然语言
→ opentiny-page__page-agent-tool
→ PageTool 查询/滚动
→ window.scrollY 由 0 变为 856
→ products 区块 top 约由 1442.39 变为 586.39
→ 轮播业务状态保持不变
→ 助手反馈已定位目标区块
```

**预期结果**：目标标题“让企业前端应用自然拥有智能交互能力”进入可见区域；轮播不切换；浏览器 error/warn 为 `[]`。分别记录 `PAGETOOL_CONTRACT_VERIFIED` 和 `PAGETOOL_UI_VERIFIED`。

**常见问题与排查**：

- 模型调用业务 show 工具：提示词要明确是滚动/定位页面区块，并说明不切换轮播。
- 页面滚动但没有到目标区块：先用 `searchTree` 或 `browserState` 确认目标语义，再分段滚动并重新 observe。
- 复用旧 ref：任何页面状态变化后重新 observe；不要把上一次索引写进 Skill 或业务代码。
- 没有模型服务或认证：暂停让开发者配置，不能用静态工具调用或 mock 助手消息代替自然语言闭环。
- 没有截图：验证状态可以依据真实浏览器记录，但发布验证页必须保留明确待补项，禁止引用其他步骤截图。

## 故障排查

| 症状 | 根因 | 核对命令/证据 | 修复 | 复验 |
| --- | --- | --- | --- | --- |
| 为什么要移除 `.env` | 不需要移除；删除会破坏用户配置 | `git status --short` 只看文件名，不打开内容 | 保留 `.env`；只维护 `.env.example` | 确认 Git diff/报告无 secret |
| GenUI 按钮禁用 | URL 或 Prompt ID 缺失；API key 不决定可用性 | 检查私有配置是否包含 `VITE_GENUI_URL` 和 `VITE_GENUI_PROMPT_ID`，不要打印值 | 补齐真实配置并重启 Vite | 按钮 enabled，默认仍关闭 |
| 修改配置后仍禁用 | Vite 在启动时读取环境变量 | dev server 启动时间早于配置修改 | 停止并重启 `pnpm dev` | `disabled=false` |
| 模型选择器与真实请求模型不一致 | mode allowlist 只在 UI 或请求一侧执行 | 查看模型 options、selected ID、provider 和请求 `body.model` | 无 allowlist 时保持模型；有明确策略时三个边界读取同一策略 | UI 与请求模型一致；验证项目 GenUI 为 Qwen、非 GenUI 为 DeepSeek |
| GenUI 出现后原工具栏消失 | 自定义 `ChatModelRuntime.options` 传了 plain array | 浏览器只剩 GenUI；源码为 `options: models` | 改为 `options: computed(() => models)` | 深度思考、搜索、模型和 GenUI 共存 |
| GenUI 按钮风格不一致 | 没复用 TinyRobot token/响应式规则 | 比较计算样式 | 使用 32px、full radius、14px、`currentColor` 16px 图标和同一 token | 与相邻按钮高度/圆角/色值一致 |
| schema 被截断或吞掉文字 | 对单 chunk `JSON.parse`，没有跨 chunk 状态 | 运行 parser 测试 | 使用 `PatternExtractor`，保留有序 text/card parts | 跨 chunk 测试通过 |
| GenUI 认证失败或泄露模型 key | 把供应商 key 当作 GenUI fallback | 检查请求 headers，不打印真实值 | GenUI 只用专用 key、会话认证或无认证 | 认证隔离测试和 Network 检查通过 |
| 缺主题 CSS，build 失败 | `vue-slider-button` 导入未声明的 theme 包 | 构建错误精确指向 `@opentiny/vue-theme/...` | 仅在证据成立时加 `@opentiny/vue-theme@3.31.1` | 重跑 build |
| build 通过但有大 chunk 警告 | TinyRobot/GenUI materials 体积大 | 构建输出包含 `larger than 500 kB` | 保留异步 Provider/Renderer；另开性能优化任务 | 记录警告，build 仍为 verified |
| WebMCP 工具存在但模型不调用 | MCP server/tool 未启用、Skill 未注入或意图不唯一 | 检查 MCP UI、命名空间工具名和请求 system instructions | 启用真实工具并补充明确意图映射 | 浏览器出现实际工具调用并改变业务状态 |
| 工具成功但轮播很快切走 | 自动轮播仍在推进 | 查看共享状态和计时器 | 工具选择时暂停自动轮播 | 结果保持超过一个轮播周期 |
| PageTool 能看到 TinyRobot | blacklist 未匹配真实窗口/launcher | 检查 A11y tree | 按实际稳定 class 排除聊天区域 | PageTool 树不再暴露聊天内部控件 |
| PageTool 使用旧 ref 失败 | 页面变化后没有重新 observe | 工具返回 stale ref 或节点不匹配 | 重新调用 `browserState`/`searchTree` | 使用最新 ref 完成后续动作 |
| `executeJavascript` 仍被执行 | 只有提示词约束，没有 adapter 策略 | 记录 browser execution count | 在 `executeTool` 前返回 `PAGE_TOOL_SIDE_EFFECT_BLOCKED` | 阻止测试和真实调用均不进入浏览器执行 |

## Git 检查点与回滚

完成每个步骤后分别检查：

```bash
git status --short
git diff --check
git diff --stat
```

建议分别提交，避免把四步和其他业务修改混在一起：

```bash
git add <STEP_1_FILES>
git commit -m "feat: integrate TinyRobot chat"
```

```bash
git add <STEP_2_FILES>
git commit -m "feat: integrate GenUI interactions"
```

```bash
git add <STEP_3_FILES>
git commit -m "feat: add business WebMCP tools and Skill"
```

```bash
git add <STEP_4_FILES>
git commit -m "feat: add restricted PageTool automation"
```

提交前再次确认 `.env` 不在 staged 文件中。若需要回滚，优先用阶段提交的 `git revert <commit>`，不要对包含用户其他改动的工作区执行 `git reset --hard`。

## 发布前清单

- [ ] 已从干净 Vue 3 + Vite 项目重新执行发布 CLI。
- [ ] CLI package 版本、生成 runtime 版本和文档版本表一致且不混淆。
- [ ] Step 1 与 Step 2 的测试、构建、UI 证据已更新。
- [ ] 真实 GenUI 服务已验证，或仍明确写 `SERVICE_UNVERIFIED`。
- [ ] Windows 若未重放，继续写 `WINDOWS_UNVERIFIED`。
- [ ] Linux 若未重放，继续写 `LINUX_COMMANDS_NOT_REPLAYED`。
- [ ] Step 3 业务工具合同、结构化错误、业务 Skill 和真实页面闭环证据已更新。
- [ ] Step 4 PageTool 注册、语义面、adapter 策略、重新 observe 和真实页面闭环证据已更新。
- [ ] Step 3/4 真实截图已补充；若尚未获取，验证记录明确保留待补项。
