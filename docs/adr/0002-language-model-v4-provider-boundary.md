# ADR-0002: Provider 边界采用 LanguageModelV4 与 Runtime Ingress Guard

- **Status:** Accepted
- **Date:** 2026-10-08

Tiny Robot 使用 Vercel AI SDK `LanguageModelV4` 作为 Provider 实现规范。出站侧把冻结的 Runtime 历史、工具和 Run 配置投影为允许的 `LanguageModelV4CallOptions` 子集；入站侧只把 `LanguageModelV4StreamResult.stream` 交给 Runtime Ingress Guard，由 Guard 校验允许的 `LanguageModelV4StreamPart`、清洗非安全字段并转换成 Domain Event。完整自维护 Open Responses Core Profile 虽然控制力更强，但会让小团队长期承担跨 Provider wire schema、stream event 和版本兼容维护；直接信任全部 V4 数据又会泄漏 raw payload、headers、任意 metadata 和未清洗 error。Open Responses 继续作为 OpenAI Responses mapping 与 conformance 的参考，而不是 Tiny Robot 公共协议。

`LanguageModelV4` 是 Provider ABI，不是 Runtime Domain Model。一次模型调用对应一个 Model Step；带凭据的 model 按 Run 创建和释放。Provider opaque continuation 只允许在 active Run 内瞬时回传，不能进入 Snapshot、持久化、日志或组件 API。

Runtime 不公开整个 `LanguageModelV4CallOptions` 作为产品配置面，也不允许 UI 注入 arbitrary headers 或 provider options。Coordinator 可以接收完整 `LanguageModelV4StreamResult`，但必须在进入 Ingress Guard 前丢弃 result 的 request/response 调试数据；只有 `stream` 属于入站协议。
