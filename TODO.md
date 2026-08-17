# ExtensionManager 内部架构优化 TODO

> 工作目录：`/Users/gene/Projects/tiny-robot.worktrees/component-extension-ui`
>
> 本 TODO 只记录后续任务，不改变当前 ExtensionManager、Card、CardGrid 的已确认公共契约。

## 本轮已确认

- [x] `ExtensionManagerTab` 精简为 `id`、`label`、`items`；不再承载 tab 级 `tags`、`badge` 或 `disabled`。
- [x] Filter 标签从当前 tab 的 item `tags` 派生，继续保持 Filter 始终显示和状态按 tab 隔离。

## P0：先确认设计不变量

- [ ] 确认 `ExtensionManagerTab.id` 在一个 Manager 内必须全局唯一且稳定；若重复，确定是开发期 warning、忽略重复项，还是其他明确行为。
- [ ] 确认 `ExtensionCardGridItem.id` 只需在单个 tab 内唯一，还是要求跨 tab 全局唯一。

## P1：收紧 Manager 状态边界

- [ ] 将 `useExtensionManagerState` 的 emitter 改为精确的内部事件类型，移除 `index.vue` 中 `(string, unknown)` 到 `ExtensionManagerEmits` 的强制转换。
- [ ] 统一 section 展开状态和 tab 独立 filter 状态的 tab-scoped 存储/清理逻辑；保持状态按 tab 隔离，并在 tab 移除时清理。
- [ ] 明确并测试 controlled/uncontrolled active tab 的 fallback、`update:active-tab` 与 `tab-change` 事件顺序。
- [ ] 根据 P0 决策增加重复 tab ID 的开发期诊断或确定性行为。

## P1：优化渲染与交互性能

- [ ] 将 installed/available section 派生改为单次 partition，减少重复 `filter` 和中间对象创建。
- [ ] 让 Card popover 只在打开期间注册 scroll/resize 监听，并对滚动中的定位更新做合并调度。
- [ ] 清理私有 section 事件中未使用的 `expanded` 传递，避免子组件计算一次、父组件再次计算。

## P1：补齐可访问性边界

- [ ] 修正非 active tab 的 `aria-controls` 与实际 tabpanel 不存在的关系。
- [ ] 为可折叠 section 建立按钮与内容区域的 `aria-controls`/region 关联。
- [ ] 检查自定义 tab slot 嵌套交互元素的语义，避免在 tab button 内生成非法交互结构。
- [ ] 评估 Card 名称的自定义 `role="button"` 是否需要改为等价的原生交互元素；不得改变已完成事件行为。

## P2：类型与运行时健壮性

- [ ] 合并或建立别名统一 public overflow placement 与 private popover placement 类型，避免重复 union 定义。
- [ ] 抽出纯的 Manager view-projection 类型/函数，明确 `installed`、`tags` 只存在于 Manager item 边界，不进入 Card/Grid props。
- [ ] 为 `primaryActionsLimit` 和 `progress` 增加有限值归一化，覆盖 `NaN` 等运行时输入；保持现有 Card 公共类型、事件和 slot 不变。
- [ ] 评估 `ExtensionCardRenderableAction` 是否只是内部 renderer 类型；如需调整，单独处理兼容性，不在内部重构中悄悄删除公共导出。

## P2：测试质量

- [ ] 增加 tab ID 唯一性、tab 删除/重新加入、active fallback 和事件顺序测试。
- [ ] 增加 tab/tabpanel ARIA、section 折叠语义测试。
- [ ] 增加多 Card popover 的滚动/窗口边界行为测试。
- [ ] 增加 Card 数值输入为 `NaN` 时的归一化测试。
- [ ] 保持现有 Card/Grid 的 direct props、Grid-owned `li` identity、事件、slot 和类型测试不变。

## P2：文档一致性（单独确认后处理）

- [ ] 后续同步仍描述旧 Root/List/Filter/context/McpDetail/McpForm 的 `AGENTS.md` 与 `docs/src/components/extension-manager.md`。
- [ ] 更新过时的测试数量和架构说明；本轮不修改用户已有 `AGENTS.md`、`CONTEXT.md`、`docs/adr` 或无关文档。

## 完成验证清单

- [ ] focused Extension Manager CT tests
- [ ] components type-check/build
- [ ] Storybook Extension Manager/Card/CardGrid 对应验证
- [ ] `git diff --check`
- [ ] 只提交本轮相关改动，不提交用户已有文档、配置、生成物或无关修改
