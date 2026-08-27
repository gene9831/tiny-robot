---
outline: [1, 3]
---

# 完整流程提示词

在 Agent 中打开目标项目，然后发送：

```text
/opentiny-ai-app-integration 为当前项目完成 TinyRobot Chat、GenUI、业务 WebMCP 和受限 PageTool 集成。
```

Agent 会按顺序完成四步通用基础设施，并在需要业务选择、服务合同或副作用授权时向你提问。业务 WebMCP、业务 Skill、PageTool 页面目标和对应 Skill 仍由业务方提供；缺失时 Agent 会暂停相应功能验收，不根据页面内容生成。缺少运行时环境变量不会中断代码接入，真实模型和浏览器闭环默认由开发者人工验收。

需要 Agent 同时闭环时，在提示词中明确列出验证范围：

```text
/opentiny-ai-app-integration 为当前项目完成四步集成，并验证 TinyRobot 真实对话、GenUI 卡片，以及业务方已经写入的 WebMCP、业务 Skill、PageTool 页面目标和对应 Skill；不要生成或推测缺失的业务配置。
```
