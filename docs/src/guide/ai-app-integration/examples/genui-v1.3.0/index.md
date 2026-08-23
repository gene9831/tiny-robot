---
outline: [1, 3]
---

# GenUI 1.3.0 完整模板

这些文件来自 `opentiny-ai-app-integration` Skill commit `4f73264`，适配基线为 Vue 3 + Vite、TinyRobot `0.5.2-alpha.10`、GenUI `1.3.0`。独立模块可直接比较/复制；`TinyRobotChat.vue`、`chat-runtime.ts` 和 `chat-ui.ts` 等宿主文件必须按目标应用增量合并。

## GenuiProvider.vue

<<< ./genui/GenuiProvider.vue

## GenuiSwitch.vue

<<< ./genui/GenuiSwitch.vue

## renderer.ts

<<< ./genui/renderer.ts

## request-routing.ts

<<< ./genui/request-routing.ts

## stream-parser.ts

<<< ./genui/stream-parser.ts

## stream-plugin.ts

<<< ./genui/stream-plugin.ts

## genui-integration.test.mjs

<<< ./tests/genui-integration.test.mjs

## 一致性检查

在拥有 Skill 源码时，可验证文档副本没有漂移：

```bash
diff -ru \
  /Users/gene/.codex/skills/opentiny-ai-app-integration/assets/genui-v1.3.0/genui \
  /absolute/path/to/docs/tiny-robot/docs/src/guide/ai-app-integration/examples/genui-v1.3.0/genui
```

测试文件同样可以用 `diff -u` 检查。无输出表示模板副本一致，但不替代目标项目的测试、构建和浏览器验收。
