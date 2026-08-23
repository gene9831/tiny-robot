---
outline: [1, 3]
---

# Step 1 + Step 2 完整提示词

适合在新任务中让 Codex 连续完成已验证的两步，但仍保留阶段确认点。

```text
请使用 $opentiny-ai-app-integration，在 <TARGET_APP_DIR> 依次重放已验证的 Step 1 和 Step 2。

本地 TinyRobot 仓库：<TINY_ROBOT_REPO>
本地 CLI：node <TINY_ROBOT_REPO>/packages/cli/bin/cli.js add chat

工作方式：
- 先只读预检目标目录、Git/dirty 状态、workspace/package/lockfile、Vue 3 + Vite 入口；报告后暂停等我确认。
- Step 1 只使用本地 add chat，不用 create，不读写 .env。CLI 后手动唯一挂载 TinyRobotChat，安装依赖，核对证据门，运行 build 和浏览器验证。
- Step 1 完成后列出命令、文件、exit code、警告和状态，并再次暂停；我确认后才进入 Step 2。
- Step 2 复用 Skill 的 GenUI 1.3.0 模板，保持唯一 TrChat。GenUI 是 sender-footer 开关，不是模型；默认关闭，并与深度思考、联网搜索和模型选择器共存。
- 使用 PatternExtractor、schema-card renderer 和动态 responseProvider；开关不得改变 selected model，GenUI 请求不得携带模型供应商 key。
- 只改 .env.example 空占位。没有真实服务配置时保持 disabled，报告 CONFIG_PENDING + SERVICE_UNVERIFIED。
- Step 2 运行模板 diff、集成测试、生产构建和真实浏览器验证；页面错误日志必须为空。
- 每条命令执行前先展示，执行后记录 exit code 和证据。保留既有改动，不自动提交 Git。

特别标注 RELEASE-BLOCKER: LOCAL_CLI：当前 CLI package 声明 0.5.2-alpha.11，但生成的 TinyRobot runtime 是 0.5.2-alpha.10。发布 CLI 后必须换成精确已发布版本并从干净项目重放。
```

如果 Agent 产品不支持 `$skill-name` 语法，请显式要求它先加载 `opentiny-ai-app-integration` Skill 的完整说明和其中直接链接的 Step 1/Step 2 references，再执行同一流程。
