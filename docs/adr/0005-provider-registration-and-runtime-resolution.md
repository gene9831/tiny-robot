# ADR-0005: Provider Registration 复用 Provider V4 并按 Run 解析

- **Status:** Accepted
- **Date:** 2026-10-11

Tiny Robot 区分应用拥有的 Provider Connection Configuration 与 Runtime 消费的 Provider Registration。连接配置包含 `providerId`、endpoint、Provider 类型、模型目录以及 AI SDK Provider creator 所需的设置；registration 是 Provider 集成层根据该配置构造的可信接入对象。`providerId` 可以表示厂商 Provider、自建 LLM API、代理网关或其他自定义接入，不要求包含厂商语义。

Provider 集成层复用 AI SDK creator，把 endpoint、headers 和 credential 转换为具体 Provider 的连接与认证行为。Registration 不重新定义这些设置，也不向 Runtime 暴露 credential；它通过无参 `createProvider()` 为当前 Run 创建 `Pick<ProviderV4, 'specificationVersion' | 'languageModel'>`，Runtime 再调用 `languageModel(modelId)` 获得 `LanguageModelV4`。Tiny Robot 自有类型只承载 AI SDK 未提供的应用信任、模型目录、能力声明和 Runtime 安全策略。

Provider 集成默认由应用直接组合对应的 AI SDK creator 与 Runtime Registration，不要求 Tiny Robot 为每个厂商发布包装 package。独立 Provider package 只有在存在需要跨应用复用、具有稳定 conformance 证据且不能由 creator 配置表达的策略时才成立；单纯转发 `baseURL`、API key 和 `languageModel()` 会重复 AI SDK 的维护职责。应用侧为固定 Provider 版本封装的兼容默认值仍属于 Registration 信任边界，不得扩展 Runtime 的公共 call-options surface。

连接配置和 credential 由应用拥有，AI SDK Provider 负责将 credential 映射为请求认证。Runtime 在创建新 Run 时通过同步 resolver 按 `providerId` 获取一次 registration，校验真实 `modelId` 与 descriptor 结构后冻结 `providerId`、`modelId` 与 capability metadata。Task 5 不用 capability metadata gate 调用或入站内容。应用随后增加、移除或替换配置及其 registration，不影响已经开始或已经完成的 Run；新的发送、重试和重新生成使用解析时可用的 registration。找不到 Provider 或模型时，Runtime 在调用工厂前以稳定安全错误拒绝请求。

Runtime v1 不提供可变 Provider registry 或 `registerProvider()` / `unregisterProvider()`。静态初始化数组会迫使网页应用在用户新增自定义 Provider 时重建 Runtime；由 Runtime 拥有可变 registry 则会提前引入配置持久化、订阅和热替换语义。外部 resolver 保留动态配置能力，同时让 Provider 管理继续属于应用层。

Runtime 的 Command、便利输入、resolver 和 Provider factory 都不接收 credential。Provider 集成层可以在应用更新配置时替换 registration，或者让无参工厂读取应用拥有的当前 credential；两种方式都不能把 credential 暴露给 Runtime。Runtime 只持有当前 Run 所需的 Provider 与 model 引用，并在 Run 终止时释放它们。
