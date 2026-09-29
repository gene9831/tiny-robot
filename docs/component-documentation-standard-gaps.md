# 组件文档规范未解决事项

本文只记录 Bubble 与 Sender 文档审计中无法通过修改文档规范直接解决的问题。已经确认并写入 `docs/component-documentation-standard.md` 的规则不在此重复。

这些事项需要维护者做公共契约决定、调整组件实现，或建立机器可读的事实源。在决议完成前，正式文档应继续按可验证的当前行为编写，并显式标记类型与运行时差异。

## 规范基础设施

### U1. 公共 CSS Variables 缺少机器可读事实源

- **现状**：Bubble 和 Sender 的变量分散在公共主题文件、全局 `variables.css` 和组件局部 fallback 中。源码出现 `var(--*)` 只能证明实现使用，不能证明兼容性承诺。
- **影响**：文档作者无法稳定判断哪些变量应进入公开 API，也无法自动校验变量名、作用域、默认值和主题覆盖。
- **建议决议**：建立可生成文档的公共 token 注册表，至少包含变量名、作用域、默认值、主题覆盖和稳定级别；评审工具应能检查文档与注册表的差异。

## 公开 API 与运行时契约

### A1. Sender 插槽作用域类型与顶层转发不一致

- `SenderSlots` 声明 `actions-inline`、`footer` 和 `footer-right` 接收 `SenderSlotScope`。
- `TrSender` 的顶层插槽转发没有传递这些参数；当前只有 `content` 插槽能收到 `editor`。
- 需要决定修复顶层转发，还是收窄公开类型。

### A2. BubbleList 自定义分组函数没有公开类型名

- `BubbleListProps.groupStrategy` 使用内部 `BubbleGroupFunction`，但该类型没有从包根导出。
- 需要决定公开 `BubbleGroupFunction`，或在公开类型中直接内联签名并移除内部命名。

### A3. `SenderSuggestionItem.label` 的类型说明与运行时不一致

- 公开类型称 `label` 是显示标签，未提供时使用 `content`。
- 当前 Suggestion 列表的展示、高亮和默认回填都只读取 `content`。
- 需要决定实现类型承诺，还是收窄 `label` 的公开说明或移除该字段。

### A4. `SpeechConfig` 包含当前未生效的字段

- `autoReplace` 和 `onVoiceButtonClick` 位于公开 `SpeechConfig`，但 `VoiceButton`、`useSpeechHandler` 和 `WebSpeechHandler` 均未读取它们。
- 需要决定实现这两个配置，或从公开类型移除并提供迁移说明。

### A5. Sender 的公开注释与运行时默认行为存在偏差

- `SenderProps.stopText` 的注释写默认值为“停止响应”，但组件没有设置该默认值；省略时实际只显示停止图标。
- `SenderContext.getContent` 的注释写返回 HTML，实际实现调用 `editor.getText()` 返回纯文本。
- 需要同步修正公开类型注释，并由维护者确认 `stopText` 是否应有实际默认值。

### A6. `WordCounterProps` 已导出但组件不接收

- 包根导出了必填的 `WordCounterProps.current`、`max` 和 `isOverLimit`，但 `TrWordCounter` 当前没有声明 Props，而是从 Sender Context 读取字数、上限与超限状态。
- 需要决定删除未使用的导出类型，或让组件实际接收并定义它与 Sender Context 的优先级。

### A7. Sender 包根导出包含未分类的内部实现类型

- `KeyboardHandlers`、`UseEditorReturn`、`SuggestionListProps` 等类型可从包根导入，但它们更像内部组合函数和内部列表的实现契约。
- 正式规范已要求区分 `stable`、`advanced`、`internal-exported` 和 `deprecated`；这些 Sender 类型仍需要维护者逐项确认支持级别，并决定是否继续从包根导出。
