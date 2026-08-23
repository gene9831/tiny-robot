---
outline: [1, 3]
---

# Step 1 至 Step 4 完整提示词

适合在新任务中让 Codex 连续完成四个已验证步骤，但仍保留每个阶段的确认点。若目标应用已经完成前两步，明确要求 Agent 从 Step 3 开始，不要重复运行 CLI 或重建 GenUI。

```text
请使用 $opentiny-ai-app-integration，在 <TARGET_APP_DIR> 依次完成并验证 Step 1 至 Step 4。

本地 TinyRobot 仓库：<TINY_ROBOT_REPO>
本地 CLI：node <TINY_ROBOT_REPO>/packages/cli/bin/cli.js add chat

工作方式：
- 先只读预检目标目录、Git/dirty 状态、workspace/package/lockfile、Vue 3 + Vite 入口；报告后暂停等我确认。
- Step 1 只使用本地 add chat，不用 create，不读写 .env。CLI 后手动唯一挂载 TinyRobotChat，安装依赖，核对证据门，运行 build 和浏览器验证。
- Step 1 完成后列出命令、文件、exit code、警告和状态，并再次暂停；我确认后才进入 Step 2。
- Step 2 复用 Skill 的 GenUI 1.3.0 模板，保持唯一 TrChat。GenUI 是 sender-footer 开关，不是模型；默认关闭，并与深度思考、联网搜索和模型选择器共存。
- 使用 PatternExtractor、schema-card renderer 和动态 responseProvider；没有明确 mode allowlist 时开关不得改变 selected model，有明确宿主策略时模型选项、selected ID 和请求边界必须一致执行。GenUI 请求不得携带模型供应商 key。
- 只改 .env.example 空占位。没有真实服务配置时保持 disabled，报告 CONFIG_PENDING + SERVICE_UNVERIFIED。
- Step 2 运行模板 diff、集成测试、生产构建和真实浏览器验证；页面错误日志必须为空。完成后暂停，等我确认进入 Step 3。
- Step 3 先从现有页面选择由稳定业务 ID 驱动、可观察且可测试的真实能力。以目标项目当前安装的 Next SDK 和 TinyRobot API 为准，注册标准 WebMCP 工具，并新增业务 Skill，说明页面能力、意图映射、参数、返回值、限制、错误和结果反馈。
- Step 3 必须增加工具合同、真实业务状态、adapter 和错误测试；用真实浏览器验证“自然语言 → 指定业务工具 → 业务状态变化 → 页面反馈”。分别报告 WEBMCP_CONTRACT_VERIFIED 和 WEBMCP_UI_VERIFIED，完成后暂停。
- Step 4 只在 Step 3 闭环后开始。读取目标版本的 PageTool 类型与源码，使用原生 registerPageAgentTool 操作现有页面，不创建 demo。
- 用稳定业务 ID、可访问名称和语义属性暴露页面。TinyRobot、外部链接、媒体控件和危险区域必须排除；不能把 whitelist 当作动作授权。
- 在 TinyRobot adapter 中区分查询、导航、表单和副作用操作。页面没有允许的表单时阻止 fill/select；禁止 executeJavascript；提交、删除、发布必须改用带明确确认合同的专用业务 WebMCP 工具。
- PageTool 每次页面状态变化后重新 observe，不猜测 ref，不使用临时 CSS 选择器。增加注册、语义面、策略和错误测试，并验证“自然语言 → PageTool → 真实页面变化 → 一致反馈”。分别报告 PAGETOOL_CONTRACT_VERIFIED 和 PAGETOOL_UI_VERIFIED。
- 每条命令执行前先展示，执行后记录 exit code 和证据。保留既有改动，不自动提交 Git。

特别标注 RELEASE-BLOCKER: LOCAL_CLI：当前 CLI package 声明 0.5.2-alpha.11，但生成的 TinyRobot runtime 是 0.5.2-alpha.10。发布 CLI 后必须换成精确已发布版本并从干净项目重放。
```

如果 Agent 产品不支持 `$skill-name` 语法，请显式要求它先加载 `opentiny-ai-app-integration` Skill 的完整说明和当前步骤直接链接的 references，再执行同一流程。
