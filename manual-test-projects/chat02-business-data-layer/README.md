# CHAT-02 TrChatUI 接入既有业务数据层

基线提交 `643418e39` 是未接入 TinyRobot 的业务项目。当前工作区在不改变 `src/business/` 领域模型和仓库职责的前提下，使用 `@opentiny/tiny-robot-chat@1.0.0-rc.5` 接入了受控 `TrChatUI`。

查看完整接入差异：

```bash
git diff 643418e39 -- manual-test-projects/chat02-business-data-layer
```

## 接入结构

- `src/business/`：既有会话、消息、请求状态、仓库和模拟业务服务。
- `src/composables/useBusinessWorkspace.ts`：既有业务操作，不依赖 TinyRobot。
- `src/composables/useTrChatUIAdapter.ts`：`ChatUIData` 映射和 `TrChatUI` 事件适配。
- `src/components/BusinessChatUI.vue`：唯一的 `TrChatUI` 挂载点及宿主确认界面。

请求、加载状态、成功/失败结果、取消、重命名和删除均由业务层处理；未使用 Runtime 或 Kit 应用 API。

## 启动

```bash
npm install
npm run dev
```

关闭“宿主处理事件”后切换会话，组件只记录事件，业务数据不变；重新开启后，切换、提交、取消、重命名和删除由宿主业务操作生效。

## 验证

```bash
npm test -- --run
npm run type-check
npm run build
```
