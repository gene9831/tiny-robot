---
outline: [1, 3]
---

# Step 1：添加 TinyRobot Chat

在 Agent 中打开目标项目，然后发送：

```text
/opentiny-ai-app-integration 为当前项目添加 TinyRobot Chat。
```

Agent 会自行检查项目并完成接入；只有发现真实阻塞时才需要你补充信息。验收方式见 [Agent 操作手册](../agent-guide#step-1添加-tinyrobot-chat)。

这条提示词默认只验证代码接入。需要 Agent 发送真实消息时，追加“并验证 TinyRobot 能正常对话”；需要模型矩阵时再明确写“逐个验证所有模型”。
