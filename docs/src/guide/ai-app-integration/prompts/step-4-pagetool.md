---
outline: [1, 3]
---

# Step 4 提示词：WebMCP 与 PageTool 自动操作

只在 Step 3 已同时获得 `WEBMCP_CONTRACT_VERIFIED` 和 `WEBMCP_UI_VERIFIED` 后使用。把占位符替换为真实路径和地址。

```text
请使用 $opentiny-ai-app-integration，只执行 Step 4：通过 WebMCP 与受限 PageTool 完成现有页面的自然语言自动操作。

目标项目：<TARGET_APP_DIR>
浏览器地址：<DEV_URL>
宿主模型策略：<HOST_MODEL_POLICY>

约束：
1. 完整读取 Skill 的 SKILL.md 和 references/pagetool-automation.md。先只读检查 Step 3 证据、Git/dirty 状态、当前安装的 Next SDK 版本、PageTool 类型/schema/注册源码、TinyRobot adapter、现有页面结构和可访问语义；报告后暂停等我确认。
2. 不新建演示页面，不重复实现 TinyRobot/GenUI/业务 WebMCP，不覆盖现有 dirty 文件。不得读取、删除、覆盖、回显或提交真实 .env。
3. 以目标项目当前安装版本为准确认 registerPageAgentTool、固定工具名、options 和所有动作。不得直接照搬其他项目或旧版本 PageTool 示例。
4. 只操作现有页面。使用稳定业务 ID、组件引用、原生 section ID、可访问名称和语义属性；不使用构建 class、nth-child 或临时 CSS 选择器。
5. 明确列出并排除 TinyRobot 自身、外部跳转、媒体控件和危险区域。说明 whitelist 只影响语义树，不是动作授权。
6. 在 TinyRobot adapter 的浏览器执行前把动作分为查询、导航、表单和副作用。只开放页面真实需要的动作；当前页面没有获准表单时阻止 fill/select；禁止 executeJavascript 和未声明动作，并返回结构化错误。
7. PageTool Skill 必须要求：click 前先 browserState；关键词定位可先 searchTree；只使用最新 ref；页面状态变化后重新 observe；不猜索引，不用脚本绕过语义面。
8. 已知业务状态切换优先使用 Step 3 的专用 WebMCP。提交、删除、发布等操作必须使用带明确确认合同的专用业务工具；不存在时明确拒绝，不能由 PageTool 点击代替。
9. 增加注册配置、语义面、动作分类、允许动作、阻止动作、浏览器 API 缺失、工具缺失、执行失败和 Skill 边界测试。运行 PageTool 测试、全量测试和生产构建，记录命令、exit code 与允许警告。
10. 在真实浏览器验证“自然语言 → 命名空间 PageTool → 真实页面变化 → 一致反馈”。记录实际提示词、工具名、操作前后页面状态、未应改变的业务状态和浏览器 error/warn。
11. 合同测试通过才报告 PAGETOOL_CONTRACT_VERIFIED；真实页面闭环通过才报告 PAGETOOL_UI_VERIFIED。没有真实截图时明确标记待补，不得复用其他步骤截图。
12. 需要 endpoint、认证、浏览器操作或人工配置时立即暂停让我处理。不要提交 Git；完成后给出文件清单、diff 摘要、验证结果和风险，等我确认。
```

## 预期暂停点

1. API、页面语义面和动作策略调查后暂停。
2. 需要模型服务、认证、人工确认或发现危险动作没有业务合同时暂停。
3. `PAGETOOL_CONTRACT_VERIFIED` 与 `PAGETOOL_UI_VERIFIED` 均有证据后暂停，等待用户检查文件和决定是否提交。

## 验证项目参考意图

`opentiny.design.home` 使用的完整提示词是：

```text
请把页面滚动到最下方“让企业前端应用自然拥有智能交互能力”这个区块，不要切换轮播图。
```

它触发 `opentiny-page__page-agent-tool`，页面滚动到现有 products 区块，并保持轮播业务状态不变。
