# 生成和验证 Runtime API 文档

本指南面向修改 Runtime 公共 TypeScript 声明或代码注释的维护者，假设读者熟悉 pnpm workspace、TypeScript 和命令行。**TSDoc** 是公共 TypeScript 声明旁的结构化注释；**TypeDoc** 根据声明和 TSDoc 生成 API 页面；**VitePress** 负责构建包含中文学习页的文档站。

本页目标是检查公共符号注释、生成 TypeDoc 子站，并确认 VitePress 文档站能够链接到同一份 API 输出。

开始前应已安装仓库依赖，并从仓库根目录执行命令。生成 HTML 位于忽略目录，不应提交。

## 严格检查公共 TSDoc

```sh
pnpm -F @opentiny/tiny-robot-runtime docs:check
```

命令应以零 warning 结束。它验证公开符号、链接和 TypeDoc 配置，但不写入 HTML。

## 单独生成 Runtime API

```sh
pnpm -F @opentiny/tiny-robot-runtime docs:build
```

生成结果位于 `docs-next/src/public/api/runtime/`。这个目录被 `.gitignore` 排除；公共事实仍维护在 TypeScript 声明和 TSDoc 中。

## 在完整文档站中预览

启动开发服务器：

```sh
pnpm -F @opentiny/tiny-robot-next-docs dev
```

文档站启动前会先生成 Runtime API。终端输出本地地址后，从顶部“API”进入 `/api/runtime/`，检查符号导航、源码链接和中文概念页入口。

构建并预览生产结果：

```sh
pnpm -F @opentiny/tiny-robot-next-docs build
pnpm -F @opentiny/tiny-robot-next-docs preview
```

构建必须完成 TypeDoc 生成、VitePress 客户端与服务端 bundle，以及全部页面渲染。第三方 bundle warning 应单独评估，但不能忽略 TypeDoc、Markdown、链接或 Mermaid 错误。

## 修改后的完成条件

- 公共名称、签名和 TSDoc 表达当前有效设计；
- 当前能力与稳定拒绝的预留能力没有混写；
- `docs:check` 零 warning；
- `docs-next` 构建成功；
- `docs-next/src/public/api/runtime/` 没有进入 Git 变更；
- 中文概念页没有复制维护完整 TypeScript 签名。

读者只想查询 API 时，应进入 [Runtime API 与 TSDoc](../reference/runtime-api.md)，无需执行本页命令。
