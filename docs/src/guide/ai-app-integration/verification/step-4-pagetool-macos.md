---
outline: [1, 3]
---

# Step 4 PageTool 自动操作 macOS 验证记录

## 结论

2026-08-23 在 `opentiny.design.home` 的现有首页完成原生 PageTool 注册、受限动作策略和真实自然语言页面操作验证。

```text
PAGETOOL_CONTRACT_VERIFIED
PAGETOOL_UI_VERIFIED
BUILD_VERIFIED
SCREENSHOT_PENDING
WINDOWS_UNVERIFIED
LINUX_COMMANDS_NOT_REPLAYED
```

验证没有创建演示页面。PageTool 操作真实首页，TinyRobot 自身和危险区域不在允许语义面中；表单与副作用动作在进入浏览器执行前被 adapter 拒绝。

## 环境与版本

| 项目                            | 值                                              |
| ------------------------------- | ----------------------------------------------- |
| 日期                            | 2026-08-23                                      |
| OS                              | macOS 26.6.2 (25G83), arm64                     |
| 原验证 Node.js                  | 未单独保存命令输出，待补充                      |
| 2026-08-23 文档只读复核 Node.js | v26.7.0                                         |
| pnpm                            | 11.21.0                                         |
| 应用路径                        | `/Users/gene/Projects/opentiny.design.home`     |
| 应用基线 HEAD                   | `80642553c32cd0446a72389dfa7186964efcbb59`      |
| Step 4 应用提交                 | 无；实现位于 dirty 工作树，不能用基线 HEAD 代替 |
| Skill Step 4 commit             | `a1582ff5ac50be07483cea7726c5c5e259539f5b`      |
| Next SDK                        | `0.4.2`                                         |
| TinyRobot / Chat / Kit          | `0.5.2-alpha.10`                                |
| GenUI SDK                       | `1.3.0`                                         |
| 浏览器地址                      | `http://localhost:5174/`                        |
| 浏览器模式                      | GenUI 关闭；DeepSeek V4 Flash                   |

## API 与源码证据

当前安装源码确认：

- `registerPageAgentTool(options)` 会初始化内置 WebMCP。
- 固定注册工具名 `page-agent-tool`。
- TinyRobot adapter 暴露名称 `opentiny-page__page-agent-tool`。
- `PageAgentToolOptions` 支持 `enableHighlight`、`removeMaskAfterToolCall` 和 `a11yConfig`。
- input schema 包含 `browserState`、`searchTree`、`click`、`scroll`、`fill`、`select`、`executeJavascript`。
- `browserState` 会重建 A11y tree 和当前 ref map；页面状态变化后继续操作必须重新 observe。
- SDK 没有业务动作 allowlist、提交确认合同或执行前取消钩子，因此项目必须在 adapter 和页面暴露面共同限制。

## 实际注册和页面语义面

配置：

```text
enableHighlight = false
removeMaskAfterToolCall = true

blacklist:
- .chat-add-window
- .chat-add-launcher
- [data-page-tool-exclude="true"]

whitelist:
- [data-page-tool-id]

exposedAttributes:
- data-page-tool-id
- data-page-tool-action
- data-business-id
```

实际语义节点位于 Header、HeroCarousel 和 ScenarioSection，使用原生链接/按钮、section ID、可访问名称、稳定 PageTool ID 和业务 ID。外部 GitHub 链接与视频控件显式排除。

whitelist 只帮助构建语义树，不被当作授权控制。真正的动作限制在 TinyRobot adapter 调用浏览器 `executeTool` 之前执行。

## 动作和错误边界

| 类别   | 动作                                  | 结果                                |
| ------ | ------------------------------------- | ----------------------------------- |
| 查询   | `browserState`、`searchTree`          | 允许                                |
| 导航   | `click`、`scroll`                     | 允许                                |
| 表单   | `fill`、`select`                      | `PAGE_TOOL_FORM_ACTION_UNAVAILABLE` |
| 副作用 | `executeJavascript`、空动作、未知动作 | `PAGE_TOOL_SIDE_EFFECT_BLOCKED`     |

额外错误：

- `WEBMCP_API_UNAVAILABLE`：工具列表或执行 API 缺失；
- `WEBMCP_TOOL_UNAVAILABLE`：页面没有 PageTool descriptor；
- `WEBMCP_TOOL_EXECUTION_FAILED`：浏览器执行抛错。

提交、删除、发布等动作不能由 PageTool 代替。它们必须使用包含明确确认参数的专用业务 WebMCP；验证页面没有此类写操作工具，因此相应请求应被拒绝。

## 文件边界

```text
M src/main.js
M src/TinyRobotChat.vue
M src/components/Header.vue
M src/components/HeroCarousel.vue
M src/components/ScenarioSection.vue
M src/tiny-robot-chat/webmcp/builtin-webmcp-adapter.ts
M src/tiny-robot-chat/skills/opentiny-showcase.ts
A src/webmcp/register-page-tool.ts
A src/tiny-robot-chat/webmcp/page-tool-policy.ts
A src/tiny-robot-chat/skills/opentiny-page-agent.ts
A tests/page-tool.test.mjs
```

这些职责相对当前应用基线恢复；业务工作树没有独立 Step 4 提交。

## 合同测试

单项命令：

```bash
node --test --experimental-strip-types tests/page-tool.test.mjs
```

结果：exit code `0`，`9/9`。

覆盖：

- 原生注册函数收到受限 options；
- query、navigation、form、side-effect 分类；
- adapter 在浏览器执行前阻止脚本；
- 允许的 `browserState` 和 `scroll` 通过真实 descriptor；
- 工具不存在、执行 API 不存在和列表 API 不存在分别返回结构化错误；
- PageTool Skill 包含工具路由、observe、稳定语义、表单/脚本限制和专用业务工具边界。

全量命令：

```bash
node --test --experimental-strip-types tests/*.test.mjs
```

最终实施和 2026-08-23 文档只读复核结果均为 exit code `0`：

```text
tests 23
pass 23
fail 0
```

## 生产构建

命令：

```bash
pnpm build
```

结果：exit code `0`。

允许警告：Next SDK direct-eval 提示和大 chunk 警告。完整构建日志未保存为独立文件，因此不补写未恢复的产物数字。

## 真实浏览器闭环

可复现开发服务器命令：

```bash
pnpm dev --host 127.0.0.1 --port 5174
```

原验证使用已经运行在 `http://localhost:5174/` 的开发服务器；启动命令和进程 exit code 没有单独保存。浏览器访问该地址，GenUI 关闭，模型为 DeepSeek V4 Flash。上面的命令用于复现同一地址，不冒充原始终端记录。

输入：

```text
请把页面滚动到最下方“让企业前端应用自然拥有智能交互能力”这个区块，不要切换轮播图。
```

实际工具：

```text
opentiny-page__page-agent-tool
```

实际页面变化：

| 指标              |       操作前 |    操作后 |
| ----------------- | -----------: | --------: |
| `window.scrollY`  |            0 |       856 |
| products 区块 top |   约 1442.39 | 约 586.39 |
| 当前轮播          | 保持原展示项 |    未切换 |
| 浏览器 error/warn |         `[]` |      `[]` |

目标标题“让企业前端应用自然拥有智能交互能力”进入可见区域，助手反馈与真实页面状态一致。

## 重新 observe 的验证边界

PageTool 的 ref 是每次 A11y tree 构建产生的临时索引。点击、条件渲染、轮播切换或页面结构变化后，继续操作前必须重新执行 `browserState` 或 `searchTree`。本项目没有把 ref 写进业务代码、Skill 或稳定 ID，也没有使用临时 CSS selector 替代重新 observe。

原浏览器会话没有单独保存每次 PageTool action payload 和 ref 索引，因此本记录只写已恢复的工具名与页面前后状态，不推测中间参数。

## 待补证据

- Step 4 真实运行截图未保存；`SCREENSHOT_PENDING`。
- 原 PageTool 每次 action payload、ref 索引和最终助手逐字回复没有落盘。
- 浏览器 console 的可导出日志文件未保存；记录只保留当时检查结果 `error/warn = []`。

补截图时必须从真实 `http://localhost:5174/` 页面重新运行同一提示词并采集，不能使用 Step 1/2 图片或新建演示页替代。
