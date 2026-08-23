---
outline: [1, 3]
---

# Step 1 提示词：引入 TinyRobot 对话框

将下面提示词交给 Codex。把尖括号占位符替换成真实绝对路径。

```text
请使用 $opentiny-ai-app-integration，只执行 Step 1：在现有 Vue 3 + Vite 应用中接入 TinyRobot 对话框。

目标项目：<TARGET_APP_DIR>
本地 TinyRobot 仓库：<TINY_ROBOT_REPO>
CLI 命令：node <TINY_ROBOT_REPO>/packages/cli/bin/cli.js add chat

约束：
1. 先只读预检：pwd、Git 根、git status --short、package.json、lockfile、Vite 入口和应用挂载链；报告现有 dirty 文件和 workspace 边界后暂停，等我确认。
2. 这是本地修改、未发布的 @opentiny/tiny-robot-cli@0.5.2-alpha.11。标注 RELEASE-BLOCKER: LOCAL_CLI，不要替换成 pnpm dlx 或 npx。
3. 只允许 add chat，禁止 create。不得读取、删除、覆盖或输出 .env；只允许检查/修改 .env.example。
4. CLI 完成后，列出它实际创建/修改的文件，确认它没有安装依赖、没有修改入口、没有创建 .env。
5. 人工把 TinyRobotChat.vue 唯一挂载到真实应用入口，安装依赖，并核对 package + 当前应用 lockfile、TrThemeProvider/TrChat 导入、样式和唯一挂载。
6. 运行项目现有构建命令和真实浏览器验证；不要发送模型请求，不要用 mock 冒充联网完成。
7. 每次执行前先给出步骤和完整命令；每次执行后给出 exit code、关键证据、允许警告与失败状态。
8. 不要提交 Git；完成后只建议 Step 1 检查点，等我明确授权。

结束时分别报告：TINYROBOT_INTEGRATED、BUILD_VERIFIED/BUILD_FAILED、UI_VERIFIED、CONFIG_PENDING、SERVICE_UNVERIFIED。
```

## 预期暂停点

Agent 应在只读预检后暂停一次。确认目标目录、dirty 文件和本地 CLI 路径无误后，再允许它执行 CLI 和写文件。

## 发布后必须改写

本地 CLI 发布后，把命令替换成精确锁定版本的已发布命令，删除本地仓库前置条件，并从干净 Vue 3 + Vite 项目重放。未重放前不要删除 `RELEASE-BLOCKER: LOCAL_CLI`。
