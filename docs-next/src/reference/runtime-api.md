# Runtime API 与 TSDoc

本页是面向 TypeScript 开发者的 Runtime 公共 API 查询入口，假设读者熟悉 TypeScript 类型、编辑器符号跳转和 HTML 文档站。需要学习业务流程时，应先从[提交问题并读取回答](../guide/quick-start.md)开始。

**TSDoc** 是写在 TypeScript 公共声明旁的结构化代码注释；**TypeDoc** 是读取声明和 TSDoc、生成可浏览 API 页面的一套工具。本页生成的 TypeDoc 子站用于查询精确签名、字段、返回值、错误和英文注释，中文概念文档则负责解释跨类型关系。

## 在本文档站中查看

<a href="/api/runtime/index.html" target="_blank">打开生成的 Runtime API</a>

生成页面来自 Runtime 源码中的公共声明和 TSDoc；HTML 是忽略的构建产物，不是手写事实来源。维护者需要生成、检查或预览 API 文档时，使用[生成和验证 Runtime API 文档](../contributing/runtime-api-docs-workflow.md)。

## 在编辑器中查看 TSDoc

在 VS Code 等支持 TypeScript Language Service 的编辑器中：

1. 将鼠标悬停在 `RuntimeSnapshot` 等公共符号上；
2. 或在符号上使用“转到定义”；
3. 查看 summary、`@remarks`、`@param`、`@returns`、`@throws` 和 `@example`。

编辑器展示的是源码中的英文 TSDoc，因此它总是贴近类型；本网站则提供中文背景、图例和场景。两者不应复制成两套完整说明。

## 如何选择事实来源

| 想确认的问题                       | 应查看                    |
| ---------------------------------- | ------------------------- |
| 当前字段和联合类型到底是什么       | TypeDoc / TypeScript 声明 |
| 字段缺失、错误和安全限制是什么意思 | TSDoc                     |
| 为什么这样分层、实体如何关联       | 中文概念文档              |
| 什么是强制规范                     | `docs/contracts/`         |
| 行为是否真的被保护                 | 永久回归测试              |

概念页会区分当前能力与后续架构责任。查询现行公共签名时，应以 TypeDoc 和 TypeScript 声明为准；查询强制行为时，应以已批准契约和永久回归测试为准。TypeDoc 中出现一个方法不表示该能力已经实现：稳定拒绝的预留方法会在 TSDoc 中明确说明当前行为。
