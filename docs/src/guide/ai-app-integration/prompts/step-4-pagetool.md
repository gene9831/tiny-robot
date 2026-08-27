---
outline: [1, 3]
---

# Step 4：使用受限 PageTool

先接入通用 PageTool 基础设施，不让 Agent 推测业务目标：

```text
/opentiny-ai-app-integration 为当前项目接入第四步 PageTool 基础设施，不推测业务页面和操作目标。
```

基础设施完成后，由业务方在真实页面和 `src/skills/<业务名>/SKILL.md` 中声明允许操作的页面、区块、稳定标识、动作类别和排除区域。业务声明不存在时，Agent 只报告基础设施完成和业务配置待补充，不生成导航目标。

业务方填写完成后再发送：

```text
/opentiny-ai-app-integration 验证业务方已经写入的 PageTool 页面目标和 Skill，不新增或推测其他目标。
```

PageTool 默认不开放表单和副作用操作；需要时 Agent 会说明业务工具与确认合同要求。验收方式见 [Agent 操作手册](../agent-guide#step-4让-ai-查询和导航页面)。需要 Agent 执行页面闭环时，追加“并验证自然语言会调用 PageTool 完成该操作”。
