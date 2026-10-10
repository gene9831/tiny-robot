# ADR-0003: 浏览器优先且 transport 可替换

- **Status:** Accepted
- **Date:** 2026-10-08

首期 Runtime 在浏览器内以 BYOK 直接访问 Provider，同时把传输定义为可替换边界。该选择降低首期接入成本，并保留未来代理服务以解决生产密钥、安全策略和跨域限制的路径；凭据不进入 Runtime 持久状态。

浏览器直连兼容性由能够接收 credential、选择 endpoint 并创建模型的 Provider registration 维护者负责。真实浏览器验证和 CORS 结果属于 Provider 的 conformance 与发布准入证据；Run 只记录影响模型调用与结果解释的模型语义能力。
