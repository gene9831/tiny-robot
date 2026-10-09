# 组件契约

## Pure component 定义

下一代 UI 组件只负责呈现和局部交互。它 **MUST NOT** 隐式读取 Runtime、Provider 或 Storage，**MUST NOT** 发起模型请求或持久化业务数据，**MUST NOT** 复制 Runtime 状态机。组件接收显式输入，发出语义事件，并允许宿主决定如何响应。

“pure” 不表示没有任何内部状态：焦点、popover 开合、输入法组合态等瞬时 UI 状态可以内部持有；Conversation、Run、Message、模型选择结果等领域状态必须由外部拥有。

## 输入分类

每个组件 API 设计时都必须把输入归入以下一类，不能用含糊的“大 props 对象”混合职责：

| 类别 | 含义 | 所有权 |
| --- | --- | --- |
| `data` | 外部事实与展示数据，例如消息或模型列表 | 外部 |
| `options` | 默认行为与视觉配置 | 内部默认或外部覆盖；持久化由宿主负责 |
| `model` | 可由组件自管或受控的交互值 | controlled 或 uncontrolled |
| `events` | 用户意图和组件生命周期通知 | 组件发出，宿主处理 |
| `services` | 非领域状态的环境能力接口 | 外部注入 |
| `templates` | 框架原生的展示定制点 | 外部 |

`options` 不是业务数据的逃生口。任何可随 Conversation/Run 变化、需要历史恢复或影响模型请求的值都应归入 `data` 或 `model`，其存储策略不属于组件。

## Controlled / uncontrolled

- 交互值同时支持两种模式时，必须明确 `defaultX`（仅初始化）、受控 `x` 和 `xChange`/等价事件的关系。
- 组件在受控模式下不得私自提交为最终值；事件表示变更请求，由宿主提供的新值完成更新。
- 运行期间从 controlled 切换到 uncontrolled 或反向切换默认不支持；若支持，必须写成显式契约并测试。
- 同一概念不得同时由 `data`、`options` 和 `model` 多处提供。

## 跨框架映射

共享的是语义和行为，不是 API 拼写：

- Vue 使用 props、`v-model`、events、slots 和 exposed methods。
- Angular 使用 input/model/output、`TemplateRef`、content projection 和公开实例方法。
- 框架层允许符合生态习惯的命名差异，但必须通过同一组行为契约测试。
- 不得在共享 contract 中出现 Vue `Ref`、VNode、Angular Signal 或 `TemplateRef`。

## 事件与定制

- 事件名称描述用户意图或已发生的 UI 事实，例如 `submit`、`abortRequest`、`modelChange`，不暴露内部 DOM 操作。
- disabled 控件不得发出对应意图事件；IME composition、键盘导航和 focus 行为属于稳定可访问性契约。
- template/slot 接收最小 View Model 与语义 action；不得把 Runtime 实例作为默认 slot scope。
- ChatLayout 只负责组合与布局，不隐式连接 Runtime。

## 首期组件边界

首期覆盖 PromptInput、ModelSelector、MessageList、Message、TextPart、ReasoningPart、ToolCallPart、ToolApproval、ErrorPart、ConversationList、ConversationItem 和 ChatLayout。是否新建、合并或重命名 package 仍属于人工确认门禁。
