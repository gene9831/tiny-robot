---
outline: [1, 3]
---

# Step 3 业务 WebMCP 与业务 Skill macOS 验证记录

## 结论

2026-08-23 在现有 `opentiny.design.home` 业务页面完成业务 WebMCP 与业务 Skill 的合同和真实浏览器验证。

```text
WEBMCP_CONTRACT_VERIFIED
WEBMCP_UI_VERIFIED
BUILD_VERIFIED
SCREENSHOT_PENDING
WINDOWS_UNVERIFIED
LINUX_COMMANDS_NOT_REPLAYED
```

验证没有创建演示页面、mock 工具或硬编码助手回复。自然语言触发 TinyRobot 中的真实 WebMCP 工具，工具更新首页共享轮播状态，页面显示与工具结果一致。

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
| Step 3 应用提交                 | 无；实现位于 dirty 工作树，不能用基线 HEAD 代替 |
| Skill Step 3 commit             | `ade0246ce32073cd82b1138e3e1f0c3d6bbf2c0c`      |
| Next SDK                        | `0.4.2`                                         |
| TinyRobot / Chat / Kit          | `0.5.2-alpha.10`                                |
| GenUI SDK                       | `1.3.0`                                         |
| Vue                             | package 声明 `^3.5.40`；当前解析 `3.5.41`       |
| Vite                            | package 声明 `^8`；当前解析 `8.2.1`             |
| 浏览器地址                      | `http://localhost:5174/`                        |
| 浏览器模式                      | GenUI 关闭；宿主策略仅允许 DeepSeek             |
| Step 3 具体模型型号             | 原验证记录只保留到 DeepSeek 模式，待补充        |

原业务工作区在 Step 3 开始前已经存在大量已暂存、未暂存和未跟踪文件。实施和文档整理均保留这些文件，没有 reset、覆盖或自动提交，也没有读取或披露私有环境配置。

## 业务能力选择

选择首页主视觉轮播作为真实业务能力，理由是：

1. 它是现有页面的主要业务展示，不是临时 demo。
2. 六个展示项都有稳定业务 ID。
3. 页面切换结果可观察，适合浏览器验收。
4. 状态和错误可由 Node 测试直接验证。
5. 切换轮播不提交表单、不删除数据、不访问外部系统。
6. 工具选择后可暂停自动轮播，避免验证结果被计时器覆盖。

稳定 ID：

```text
enterprise-ai
webmcp-ecosystem
gosim-2025
tinyvue-space
tinyengine-material-import
genui-sdk
```

## 实际工具合同

### `list_opentiny_showcases`

- TinyRobot 名称：`opentiny-page__list_opentiny_showcases`
- 参数：空对象，不允许额外属性。
- annotations：只读、非 destructive、非 open world。
- 返回：当前 `activeShowcaseId`，以及六项能力的 ID、eyebrow、标题、副标题和说明。

### `show_opentiny_showcase`

- TinyRobot 名称：`opentiny-page__show_opentiny_showcase`
- 参数：必填 `showcaseId`，enum 为六个稳定 ID，不允许额外属性。
- annotations：会改变页面状态，但非 destructive、非 open world。
- 成功：返回 `ok: true`、当前 ID、标题和反馈 message，并暂停自动轮播。
- 参数缺失：`INVALID_ARGUMENT`。
- 未知 ID：`SHOWCASE_NOT_FOUND`。
- 浏览器执行异常：adapter 返回 `WEBMCP_TOOL_EXECUTION_FAILED`。

## 注册和 Skill

入口顺序：

```text
initializeBuiltinWebMCP()
→ registerOpenTinyBusinessTools()
→ createApp(App).mount('#app')
```

业务 Skill 名称为 `opentiny-showcase`，覆盖页面能力、意图映射、稳定 ID、参数、返回、限制和反馈。TinyRobot Kit manual `skillPlugin` 将其 instructions 注入当前请求；业务执行仍由 WebMCP 工具完成，Skill 本身不修改页面。

## 文件边界

```text
M package.json
M pnpm-lock.yaml
M src/main.js
M src/TinyRobotChat.vue
M src/components/HeroCarousel.vue
A src/business/opentiny-showcases.ts
A src/webmcp/register-business-tools.ts
A src/tiny-robot-chat/webmcp/builtin-webmcp-adapter.ts
A src/tiny-robot-chat/skills/opentiny-showcase.ts
A tests/webmcp-business.test.mjs
```

状态中的 `M`/`A` 表示相对应用基线的最终文件职责，不表示这些文件已经形成独立 Step 3 Git 提交。

## 合同测试

可单独复现 WebMCP 测试的命令：

```bash
node --test --experimental-strip-types tests/webmcp-business.test.mjs
```

该文件包含 8 项测试；原 Step 3 会话没有单独保存这条独立命令的 exit code，因此不把它写成独立执行证据。八项均包含在下面当时的全量 `14/14` 结果中。

当时全量命令：

```bash
node --test --experimental-strip-types tests/*.test.mjs
```

结果：exit code `0`，GenUI 6 项加 WebMCP 8 项，共 `14/14`。

2026-08-23 文档整理时在包含 Step 4 的当前工作树再次执行同一全量命令：exit code `0`，`23/23`。这次复核证明当前代码仍通过，不替代 Step 3 当时的 `14/14` 记录。

覆盖范围：

- 真实状态按稳定 ID 切换；
- 未知 ID 不改变当前状态；
- list/show schema 和 annotations；
- 无效参数与未知 ID 的结构化错误；
- 自动轮播不覆盖工具选择；
- adapter 列出命名空间工具并执行真实 descriptor；
- 浏览器执行失败转为结构化错误；
- 业务 Skill 意图映射与指令注入。

## 生产构建

命令：

```bash
pnpm build
```

结果：exit code `0`。

允许警告：Next SDK 依赖包含 direct-eval 提示；构建仍有大 chunk 警告。原始完整构建日志没有单独保存为文件，因此本记录不补写未恢复的 chunk 数字。

## 真实浏览器闭环

可复现开发服务器命令：

```bash
pnpm dev --host 127.0.0.1 --port 5174
```

原验证使用已经运行在 `http://localhost:5174/` 的开发服务器；启动命令和进程 exit code 没有单独保存。上面的命令是与验证地址一致的复现命令，不冒充原始终端记录。

输入：

```text
带我看看 GenUI SDK 的展示
```

实际链路：

```text
自然语言
→ opentiny-page__show_opentiny_showcase
→ showcaseId = genui-sdk
→ openTinyShowcaseState 真实更新
→ 首页主视觉显示“GenUI SDK / 扩展大模型交互方式”
→ 助手按工具结果反馈
```

页面结果保持超过 9 秒，证明工具选择暂停了自动轮播，而不是偶然轮播到目标项。

## 待补证据

- Step 3 真实运行截图未保存；`SCREENSHOT_PENDING`。
- 原验证具体 DeepSeek 型号未保留，禁止推测。
- 原浏览器会话的完整 Network/console 导出未落盘；不在本记录中伪造日志细节。

这些待补项不改变已实际完成的 WebMCP 工具调用和页面状态闭环，但发布截图前必须从真实运行页面重新采集。
