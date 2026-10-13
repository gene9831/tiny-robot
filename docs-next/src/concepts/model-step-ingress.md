# 校验一次模型文本流

模型返回的流仍然是边界输入，不能直接成为 Runtime 状态。Ingress Guard（响应检查关口）负责读取一次 `Step（kind = 'model'）`（下文简称 Model Step）的 constructed `LanguageModelV4StreamPart` 流，校验文本生命周期，并只把已经转换成 Runtime 身份的 Domain Event 交给 reducer。Model Step 与 Tool Step 只是同一 Step 实体的不同 kind。

本页解决的问题是：一组 Provider stream parts 怎样在不泄漏 Provider ID、metadata 或原始对象的前提下形成文本 Event。开始前应先理解[准备一次模型调用](./model-call-projection.md)和 [Domain Event 与 reducer](./events-and-reducer.md)。读完后，你应该能解释合法文本顺序、ID 转换和协议失败为什么只产生一个安全终态。

当前能力只处理 constructed text stream。模型创建、`doStream()` 调用和完整 Run 协调仍由执行协调层补齐；reasoning 和工具流由后续各自的组装能力处理。超出当前子集的 part 会得到稳定 protocol error，而不是被解释成文本。

## 正常场景

假设执行层已经创建 Run、一个 `Step（kind = 'model'）` 和 assistant Message，并把 Runtime IDs、同步 Part ID 分配器、stream 与 `emit(event)` 交给 Guard。Provider 流按下面的顺序到达：

```text
stream-start
→ response-metadata
→ text-start(provider-text-a)
→ text-delta(provider-text-a, "第一行\n")
→ text-delta(provider-text-a, "第二行")
→ text-end(provider-text-a)
→ finish(stop)
→ EOF
```

Guard 在 `text-start` 时向 Runtime ID 分配器取得新的 `runtime-part-a`。Provider ID 只在当前 Step 的内存映射中关联这个 Runtime ID；之后发出的 Event 是：

```text
text-part-started(runtime-part-a)
→ text-part-delta(runtime-part-a, "第一行\n")
→ text-part-delta(runtime-part-a, "第二行")
→ text-part-ended(runtime-part-a)
→ run-terminated(completed, stop)
```

delta 按观察顺序原样发送，空格、空字符串和换行都不会被 trim 或重新分词。多个 Provider text ID 可以交错到达，每个 ID 都有自己的生命周期和 Runtime Part ID。

## 状态机怎样阻止非法顺序

```mermaid
stateDiagram-v2
  [*] --> WaitingForStart
  WaitingForStart --> Streaming: stream-start
  Streaming --> Streaming: metadata / raw / closed text
  Streaming --> TextOpen: text-start
  TextOpen --> TextOpen: text-delta
  TextOpen --> Streaming: text-end
  Streaming --> FinishObserved: finish(stop)
  FinishObserved --> Completed: EOF
  WaitingForStart --> Interrupted: 非 stream-start
  Streaming --> Interrupted: 未知 ID / 重复生命周期 / 不支持 part
  TextOpen --> Interrupted: finish
  FinishObserved --> Interrupted: 任意后续 part
```

Guard 不在观察到 `finish` 时立即发出 completed terminal。它先等待 EOF；如果 finish 后还有任何 part，就改为一个 `interrupted` terminal。这样 reducer 不会先收到成功终态，再发现协议已经违反。

协议失败后 Guard 取消 reader，发出 exactly one `run-terminated(interrupted)`，再用稳定 code reject。错误不包含 Provider ID、delta、metadata、原始 finish reason、异常 message、stack 或 cause；terminal 后不再发出内容 Event。

## Metadata 与 usage 怎样停在边界内

`response-metadata` 不是领域事实。Guard 只在当前 Step 内规范化允许字段，用于检查重复值是否一致：

- response ID 和 model ID 必须是 1–128 个批准的 ASCII 字符；
- timestamp 必须能转换为 ECMAScript Date 范围内的整数 epoch milliseconds；
- 无效字段按 unavailable 处理；两个有效的同名字段不一致时中断。

这些值不会进入 Domain Event、Snapshot、返回结果、日志或诊断。`providerMetadata`、warning 自由文本和 finish 的 raw reason 同样不会穿过当前边界。

Usage 只保留 input、output、reasoning、cache read 和 cache write token。数值必须是从 0 到 `Number.MAX_SAFE_INTEGER` 的整数；合法的 0 保留，缺失或无效值保持 unavailable，`usage.raw` 始终丢弃。

## 两个关键边界场景

如果 `text-delta` 在对应 `text-start` 之前到达，Guard 返回稳定的 `model_step_text_id_unknown`。Provider ID 和 delta 内容不会出现在错误或终止 Event 中。

如果 `finish(stop)` 到达时仍有开放文本，Guard 返回 `model_step_text_open_at_finish`。这个 `Step（kind = 'model'）` 和 Run 被标记为 `interrupted`，不能伪装成 completed。

`raw` part 是明确例外：它在合法流期间无条件丢弃，不形成 Event；但 finish 后出现的 raw 仍违反 terminal silence。

## 来源、依据与回归保护

stream part、usage、finish reason 和 response metadata 的上游形状直接采用固定的 `@ai-sdk/provider@4.0.25`。合法顺序、身份转换和安全限制由 Tiny Robot 项目定义。

- 第一方来源：[AI SDK `LanguageModelV4StreamPart` 源码](https://github.com/vercel/ai/blob/main/packages/provider/src/language-model/v4/language-model-v4-stream-part.ts)
- 正式设计依据：[LanguageModelV4 Boundary Contract v1](../design/language-model-v4-runtime-boundary-v1.md#7-允许的-stream-parts) · [ADR-0002：Provider 边界](../design/adr-0002-language-model-v4-provider-boundary.md)
- 永久测试：`test/ingress-guard/text.test.ts` 保护合法映射、双 ID、metadata/usage allowlist 与 reducer 结果；`test/ingress-guard/order.test.ts` 保护非法顺序、EOF、脱敏错误和 terminal silence。

## 检查你的理解

1. Provider text ID 为什么不能直接成为 `RuntimePart.id`？
2. 为什么 completed terminal 要等到 finish 后的 EOF 才发出？
3. metadata 已经通过字符限制后，为什么仍不进入 Snapshot？

当前学习路径已经覆盖模型调用前投影和 constructed text stream 的入站校验。需要核对最终状态时回到[一次完成的文本回答](../examples/completed-text-run.md)；需要精确的规范性限制时查看 [LanguageModelV4 Boundary v1](../design/language-model-v4-runtime-boundary-v1.md)。
