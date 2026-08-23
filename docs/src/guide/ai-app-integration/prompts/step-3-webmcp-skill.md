---
outline: [1, 3]
---

# Step 3 提示词：业务 WebMCP 与业务 Skill

在 Step 1/2 已完成并验证后使用。把尖括号占位符替换为真实值；如果项目有明确的 GenUI/非 GenUI 模型 allowlist，一并写入宿主策略，不能让 Agent 猜测。

```text
请使用 $opentiny-ai-app-integration，只执行 Step 3：为现有页面添加真实业务 WebMCP 与业务 Skill，实现业务理解。

目标项目：<TARGET_APP_DIR>
浏览器地址：<DEV_URL>
宿主模型策略：<HOST_MODEL_POLICY；没有明确策略时写“无 mode allowlist”>

约束：
1. 完整读取 Skill 的 SKILL.md 和 references/webmcp-business-skill.md。先只读检查 Git/dirty 状态、package/lockfile、唯一 TrChat、GenUI、模型策略、当前安装的 Next SDK/TinyRobot API、页面状态和真实业务能力；报告证据后暂停等我确认。
2. 不重复运行 TinyRobot CLI，不重建 GenUI，不创建第二个聊天框，不覆盖现有 dirty 文件。不得读取、删除、覆盖、回显或提交真实 .env。
3. 从现有页面选择可观察、可测试且由稳定业务 ID 驱动的真实能力。先说明选择依据、状态源、可见结果和风险；不得用 mock、日志、静态回复或硬编码对话冒充工具执行。
4. 以目标项目当前实际解析的 Next SDK 与 TinyRobot 源码、类型和导出为准。需要新增依赖时锁定已验证兼容版本，并在安装前报告完整命令和 package/lockfile 边界。
5. 先增加业务状态与工具合同测试，再实现标准 WebMCP 工具。每个工具必须有稳定 name/title/description、严格 inputSchema、annotations、结构化成功结果和结构化错误。
6. 通过浏览器 document.modelContext 注册真实工具；TinyRobot adapter 必须从 listTools 或兼容 getTools 读取真实 descriptor，并通过 executeTool 执行。给模型暴露命名空间工具名，同时保留原工具名用于执行。
7. 增加业务 Skill，完整说明页面能力、自然语言意图与工具映射、参数、返回值、限制、错误码和结果反馈。工具返回失败时不得声称成功。
8. 保留唯一 TrChat、普通文本、GenUI 和宿主模型策略。没有 mode allowlist 时不得因 Step 3 改变模型；有明确策略时选项、selected ID 和实际请求必须一致遵循。
9. 增加真实状态、工具 schema、成功/失败、adapter、Skill 和重要回归测试。运行目标测试、全量测试、生产构建；记录完整命令、exit code 和允许警告。
10. 启动现有页面，用当前允许模型验证“自然语言 → 指定业务工具 → 真实业务状态变化 → 页面反馈”。记录提示词、工具名、参数、操作前后状态和浏览器错误日志。
11. 合同测试通过才报告 WEBMCP_CONTRACT_VERIFIED；真实浏览器链路通过才报告 WEBMCP_UI_VERIFIED。两者不能互相替代。
12. 需要 endpoint、认证、浏览器操作或人工配置时立即暂停让我处理。不要提交 Git；完成 Step 3 后再次暂停，等我确认进入 Step 4。

结束时列出：
- 选择的业务能力和稳定 ID；
- 工具原名、命名空间名、参数、返回和错误；
- 业务 Skill 的意图映射与限制；
- 所有命令、exit code、文件变化、测试和构建结果；
- 浏览器完整链路、状态码、待补证据和风险。
```

## 预期暂停点

1. 只读调查后暂停，确认真实业务能力、API 证据和文件边界。
2. 需要安装依赖、endpoint、认证或人工配置时暂停。
3. `WEBMCP_CONTRACT_VERIFIED` 与 `WEBMCP_UI_VERIFIED` 均有证据后暂停，等用户确认进入 Step 4。

## 验证项目参考意图

`opentiny.design.home` 使用的最小提示词是：

```text
带我看看 GenUI SDK 的展示
```

它映射到 `opentiny-page__show_opentiny_showcase` 和稳定业务 ID `genui-sdk`。该名称和 ID 只属于验证项目，其他页面必须选择自己的真实业务能力。
