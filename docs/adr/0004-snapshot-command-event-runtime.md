# ADR-0004: Snapshot、Command 与 Domain Event 分工

- **Status:** Accepted
- **Date:** 2026-10-08

Runtime 用 Command 表达意图、Domain Event 表达已发生事实、Reducer 生成不可变规范化 Snapshot。Snapshot 是查询当前业务结果的唯一事实来源，事件负责过程与副作用，而不是要求组件自行重建状态。
