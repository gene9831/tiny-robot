# 测试策略

测试以风险和公共契约为中心。新增行为优先从消费者可观察结果写测试，完成后删除只验证实现过程、私有调用顺序或临时诊断的用例。

## 验证层级

| 层级                    | 必须保护的回归                                                                                                           | 推荐方式                                               |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| Provider Model Boundary | Domain→V4 请求投影、V4 options→wire request、wire response→V4 parts、Ingress Guard 顺序、未知 part、有损转换、取消与错误 | 脱敏 fixture、provider/request/guard conformance tests |
| Runtime                 | reducer 不变量、Run 终态、并发隔离、持久化恢复、工具审批                                                                 | 快速单元测试与状态转换表                               |
| Selector / Presenter    | 稳定投影、排序、派生状态、结构共享                                                                                       | 纯函数测试                                             |
| UI contract             | controlled/uncontrolled、语义事件、键盘与 IME、disabled、slot/template scope                                             | 一套行为规范，分别在 Vue/Angular runner 执行           |
| Renderer                | 框架生命周期、响应更新、内容定制、清理                                                                                   | 框架原生组件测试                                       |
| 完整对话                | 发送、流式、停止、错误恢复、Retry/Regenerate、历史、模型、工具审批                                                       | 真实浏览器 E2E                                         |

## 跨框架门禁

共享 UI contract 的行为场景必须同时在 Vue 与 Angular 执行。首期 Angular 支持范围为 20+；至少用 Angular 20.0 + TypeScript 5.8 和当前受支持的 Angular 主版本 + 其兼容 TypeScript 版本做 consumer 编译/运行验证。Vue 至少验证 3.4 基线与当前支持版本。

Renderer 实现只能依赖基线版本已有的公共 API。Vue 端不得无 fallback 地使用 3.5 才引入的 API 或编译器语义，例如 `useTemplateRef()` 和默认 reactive props destructure；Angular 端不得把 21+ 才提供的 API 写入共享 UI contract 或 Angular 20 renderer。

框架 runner 可以不同，但场景名称、输入 fixture 与预期语义必须可追踪到同一 contract。禁止为了让一端通过而悄悄降低另一端断言。

## 手工体验门禁

以下项目在首期发布前必须由人工体验，自动化不能替代：

- 键盘全流程和屏幕阅读器反馈；
- 中文等 IME 输入、焦点恢复与快捷键冲突；
- 长回复 streaming 时的布局稳定、自动滚动与用户回看；
- 工具审批的风险表达与误触防护；
- Vue 与 Angular 应用中的安装、主题覆盖和组合体验；
- 错误、停止、Retry/Regenerate 是否符合用户心智。

## 改动对应验证

- Provider boundary/adapter 改动：exact allowed `LanguageModelV4CallOptions` + 脱敏 wire request/response fixtures + Ingress Guard conformance + Runtime 集成测试。请求截获中的 credential、Authorization、raw headers/body 只能驻留测试进程内存，不能写入 fixture 或日志。
- Provider dependency/type 改动：`skipLibCheck: false` 的最小 consumer type-check + 浏览器 bundle，并覆盖仓库支持的 Node 版本。
- Runtime 状态改动：reducer/command 测试 + 持久化恢复；涉及并发时增加跨 Conversation 场景。
- 组件公共行为改动：共享 contract + Vue/Angular 双 runner；视觉改动补交互、a11y 或视觉验证。
- 包结构/导出改动：两个框架的最小 consumer build。
- 文档与规范改动：链接、格式和示例命令检查；不要求运行无关产品测试。
