# ADR-0001: 共享 Runtime 与原生框架 renderer

- **Status:** Accepted
- **Date:** 2026-10-08

共享框架无关的领域状态、规则与异步流程，Vue 和 Angular 各自使用原生 renderer。这样既避免复制复杂行为，又保留 slots、TemplateRef、响应式与生命周期等宿主生态能力；不采用通用模板 DSL。
