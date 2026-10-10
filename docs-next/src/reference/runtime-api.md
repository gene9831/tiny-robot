# Runtime API 与 TSDoc

中文概念文档用于解释跨类型关系；TypeDoc 用于查询当前公共 TypeScript 声明的精确签名和英文 TSDoc。

## 在本文档站中查看

<a href="/api/runtime/index.html" target="_blank">打开生成的 Runtime API</a>

运行 `docs-next` 的 dev 或 build 命令前，会先执行 Runtime 的 `docs:build`，把生成结果直接写入文档站的 `/api/runtime/`。生成 HTML 是忽略的构建产物，不提交到仓库。

## 本地启动

```sh
pnpm -F @opentiny/tiny-robot-next-docs dev
```

终端会输出本地地址。浏览概念页面时点击顶部“API”，即可进入同一次预览中的 TypeDoc 子站。

构建并预览：

```sh
pnpm -F @opentiny/tiny-robot-next-docs build
pnpm -F @opentiny/tiny-robot-next-docs preview
```

## 只检查或生成 TypeDoc

严格检查英文公共文档，不写 HTML：

```sh
pnpm -F @opentiny/tiny-robot-runtime docs:check
```

生成 HTML：

```sh
pnpm -F @opentiny/tiny-robot-runtime docs:build
```

输出位于 `docs-next/src/public/api/runtime/`。它是被 `.gitignore` 排除的生成物，不是手写文档来源。

## 在编辑器中查看 TSDoc

在 VS Code 等支持 TypeScript Language Service 的编辑器中：

1. 将鼠标悬停在 `RuntimeSnapshot` 等公共符号上；
2. 或在符号上使用“转到定义”；
3. 查看 summary、`@remarks`、`@param`、`@returns`、`@throws` 和 `@example`。

编辑器展示的是源码中的英文 TSDoc，因此它总是贴近类型；本网站则提供中文背景、图例和场景。两者不应复制成两套完整说明。

## 评审时如何判断来源

| 想确认的问题                       | 应查看                    |
| ---------------------------------- | ------------------------- |
| 当前字段和联合类型到底是什么       | TypeDoc / TypeScript 声明 |
| 字段缺失、错误和安全限制是什么意思 | TSDoc                     |
| 为什么这样分层、实体如何关联       | 中文概念文档              |
| 什么是强制规范                     | `docs/contracts/`         |
| 行为是否真的被保护                 | 永久回归测试              |

当中文说明包含尚未实现的后续设计时，页面必须明确标出对应 Task 和当前支持边界。设计进入现行实现后，需要同步修改契约、类型、TSDoc、示例和永久测试，不能只改其中一处。
