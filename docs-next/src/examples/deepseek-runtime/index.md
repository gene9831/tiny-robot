# 实际验证：DeepSeek 三种 API 格式

<script setup lang="ts">
import DeepSeekRuntimeDemo from './DeepSeekRuntimeDemo.vue'
</script>

本页用于验证首个单 Step text/reasoning Run 是否能通过三个不同的 AI SDK Provider 到达同一个 Tiny Robot Runtime。它不是 Provider 支持矩阵：真实浏览器成功、CORS、认证和流式事件仍需逐项记录后，才能形成正式支持声明。

三项 Provider 选择与两个真实模型 ID 使用同一个临时 API key 和同一条 Runtime 路径。模型列表包含 `deepseek-flash` 与 `deepseek-v4-pro`；DeepSeek 当前公告说明 `deepseek-v4-pro` 暂时路由到 V4.1 Flash，因此这里验证的是多 model descriptor 与真实请求 ID，不把它描述成独立底模证明。

| 选择                             | Runtime `providerId`          | AI SDK Provider     | 最终接口                                         |
| -------------------------------- | ----------------------------- | ------------------- | ------------------------------------------------ |
| OpenAI Responses                 | `deepseek-responses`          | `@ai-sdk/openai`    | `https://api.deepseek.com/responses`             |
| DeepSeek Native Chat Completions | `deepseek-chat-completions`   | `@ai-sdk/deepseek`  | `https://api.deepseek.com/chat/completions`      |
| Anthropic Messages               | `deepseek-anthropic-messages` | `@ai-sdk/anthropic` | `https://api.deepseek.com/anthropic/v1/messages` |

`@ai-sdk/anthropic` 会在配置的 URL 后追加 `/messages`，因此这里给 creator 的 `baseURL` 是 `https://api.deepseek.com/anthropic/v1`。这与 DeepSeek 面向 Anthropic SDK 公布的 `https://api.deepseek.com/anthropic` 基地址具有相同的最终接口语义。

三种 API 格式以 `providerId` 为 key 保存为一份 Provider 配置。Runtime 根据每次发送携带的 `providerId` 直接查找配置并解析出对应 registration；每个 registration 返回固定的 AI SDK Provider，不再通过隐藏的 UI 状态动态切换协议。页面通过 Runtime 的 `inspect.streamPart` 观察 Guard 投影前的标准 `LanguageModelV4StreamPart`。应用拥有的 Responses Provider Adapter 会在内部启用 raw chunks，将 DeepSeek 的 `response.reasoning_text.delta` 转换为标准 `reasoning-delta`，但不会把 raw part 继续暴露给 Runtime；该兼容逻辑属于 Demo 的 Provider 集成层，不属于 Runtime。固定版本的 `@ai-sdk/anthropic` 会把 Anthropic `message_start` 投影为 `custom(kind = 'anthropic.message_start')`；Runtime Guard 会忽略这种当前领域不消费的 part。

<ClientOnly>
  <DeepSeekRuntimeDemo />
</ClientOnly>

## 这个示例验证什么

每次发送都会创建一个新的 Conversation，然后执行：

```text
conversation.send({ providerId, modelId, content })
→ dispatch(send)
→ Run-local registration / Provider / model
→ LanguageModelV4.doStream()
→ Ingress Guard
→ Domain Events
→ reducer
→ Snapshot
```

当前 Runtime 把标准 text 与 reasoning 生命周期投影为 Domain Event。Custom、source、file、工具内容和尚未认识的未来 part 会在 Guard 中被忽略，不进入 Snapshot；这不等于 Runtime 已支持这些内容。显式 `error`、内容生命周期错误、缺少或重复 terminal 等结构问题仍会安全中断。

示例不发送 reasoning 控制字段，三个 Provider 都采用模型与 endpoint 的默认行为。标准 V4 reasoning part 如果实际出现，会成为独立 `ReasoningPart`；Capability metadata 不会阻止它进入 Snapshot。除 Responses reasoning 事件的标准化映射外，示例不通过隐藏的 `forceReasoning` 或额外协议转换修改请求与响应。示例由应用层主动配置 stream tap，在 Console 直接打印进入 Runtime 的标准 chunk；这项调试输出不属于 Runtime 日志或领域状态。

## API key 与错误边界

- API key 只保存在当前 Vue 组件内存和当前 Run 的 Provider Registration 闭包；registration 创建 Run-local Provider 时读取表单的当前值。页面不会写入 URL、localStorage、Snapshot、日志或示例 fixture。
- Console 诊断是本 Demo 为展示 Provider 输出而显式启用的应用层行为，会打印完整 V4 part，包括模型生成内容和可能存在的 Provider metadata；不要用真实敏感内容测试本页。Runtime 本身不会保存或记录这些 part。
- `LanguageModelV4StreamResult.request`、`.response`、headers 和 body 在 coordinator 边界丢弃。
- 页面和 Console 都不会输出 Provider 原始异常；请求抛错时只显示固定的 `deepseek_live_request_failed`。
- 当前 Task 5 尚未实现 Provider error normalization；网络、CORS 或非 2xx 失败可能不会为 Run 产生完整终态。该限制由后续 terminal/error hardening 补齐。

## 如何判断结果

成功时，页面显示 assistant text/reasoning Part 以及 Snapshot 中的 `providerId`、真实 `modelId`、唯一 Model Step、termination 和可用 usage。切换 Provider 后再次发送，应得到相同的领域关系；协议特有字段不会进入 Snapshot。

自动测试 `docs-next/test/deepseek-provider-registrations.test.ts` 固定两个 model descriptor，并对三个 providerId 与两个模型的组合验证最终 URL、Runtime 不注入 reasoning/thinking 控制字段，以及 API key 不进入请求 body；多 Provider 回归还验证两个不同 providerId 会进入各自的 Run Snapshot。独立的 Anthropic SSE 回归验证 `custom` metadata 无需 registration 包装即可完成文本 Run，DeepSeek Native SSE 回归同时验证官方 Provider 将 `reasoning_content` 投影为独立 Runtime `ReasoningPart`，以及示例 tap 能观察对应 reasoning/text delta 内容。

本页不预设 live 结果。每次 Provider 版本、registration 或 Guard 语义变化后，都必须重新完成两个模型 × 三种协议的浏览器验证，再记录当次结果；自动测试不能替代真实 endpoint、认证和流式响应证据。

如果 Chrome Network 把 `chat/completions` 标记为“来自 Service Worker”，并且 EventStream 只有 `{}`，说明浏览器中的 Service Worker 或扩展拦截了请求，DeepSeek 的真实 SSE 没有到达 Provider。Provider 产生的显式 `error` part 仍会被 Guard 清洗为稳定的 interrupted 错误；忽略未知内容绝不包括吞掉显式错误。应先在不受该 Service Worker/扩展控制的浏览器上下文中复测，或在 DevTools 中临时启用网络绕过来确认。
