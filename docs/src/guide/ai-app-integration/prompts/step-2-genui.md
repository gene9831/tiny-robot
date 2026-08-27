---
outline: [1, 3]
---

# Step 2：集成 GenUI

完成 TinyRobot Chat 后发送：

```text
/opentiny-ai-app-integration 在当前 TinyRobot Chat 中集成 GenUI。
```

没有真实 GenUI 服务配置时，Agent 仍可以完成代码集成，并将开关保持为禁用。验收方式见 [Agent 操作手册](../agent-guide#step-2集成-genui)。

这条提示词默认只验证代码接入。需要 Agent 请求真实服务时，追加“并验证 GenUI 能返回并渲染 schema 卡片”。
