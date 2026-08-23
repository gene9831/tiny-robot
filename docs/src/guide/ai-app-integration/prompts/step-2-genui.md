---
outline: [1, 3]
---

# Step 2 提示词：GenUI 交互升级

在 Step 1 已通过 TinyRobot 证据门后使用。这里不再依赖 `robot-client`，以目标项目实际安装 API 和 Skill 中的 GenUI `1.3.0` 模板为准。

```text
请使用 $opentiny-ai-app-integration，只执行 Step 2：在现有唯一 TinyRobot TrChat 中集成 GenUI 1.3.0。

目标项目：<TARGET_APP_DIR>

约束：
1. 先只读检查 Step 1 证据：当前应用 package + lockfile 的 TinyRobot 解析、TrThemeProvider/TrChat 有效导入、真实入口唯一挂载、TinyRobot 样式；证据不足时按 TINYROBOT_SOURCE_MISSING 停止。
2. 预检并报告现有 dirty 文件、TinyRobot/GenUI 版本、sender-footer、message plugin、content renderer 和 responseProvider 的实际 API，然后暂停等我确认。
3. 优先复用 Skill 的 assets/genui-v1.3.0；已存在或 dirty 的目标文件只能合并，不能覆盖。不要参考 robot-client，不要创建第二个聊天框或 mock schema 卡片。
4. GenUI 是 Sender footer 中的功能开关，不是模型。默认关闭；没有明确 mode allowlist 时开关前后必须保留当前 selected model，有明确宿主策略时模型选项、selected ID 和真实请求必须一致执行。它必须与深度思考、联网搜索和模型选择器共存。
5. 使用 PatternExtractor 跨 chunk 保留 Markdown/schema-card 顺序；只把有效 schema-card 交给异步 GenuiRenderer。
6. 只在 .env.example 增加 VITE_GENUI_URL、VITE_GENUI_PROMPT_ID、VITE_GENUI_API_KEY 空占位。不得读取、删除、覆盖或输出 .env。
7. 缺 URL 或 Prompt ID 时开关禁用并提示缺失变量；VITE_GENUI_API_KEY 不是启用开关的必需条件。GenUI 请求不得转发模型供应商 key。
8. 运行 GenUI 集成测试、模板 diff、生产构建和真实浏览器验证。若主题 CSS 解析失败，先定位实际 import 和版本，再决定是否补 theme 包。
9. 每次执行前给出步骤和完整命令；执行后给出 exit code、关键证据、允许警告与失败状态。不要提交 Git，等我明确授权。

没有真实 endpoint、Prompt ID、授权和有效 schema-card 响应时，必须报告 CONFIG_PENDING + SERVICE_UNVERIFIED，不得伪装 SERVICE_VERIFIED。
```

## 必查回归

浏览器中不能只看到 GenUI。Sender footer 至少应同时保留当前模型选择器；模型支持相应能力时，还应保留深度思考、联网搜索。自定义 `ChatModelRuntime.options` 必须是 TinyRobot 要求的 `Ref`/`ComputedRef`，不能传 plain array。
