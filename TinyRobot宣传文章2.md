# TinyRobot

**面向企业 AI 应用的 Vue 3 交互组件与对话框架**

TinyRobot 是一套专为 AI 应用构建的前端交互框架，帮助团队快速搭建企业级 AI 助手、智能客服与多轮对话系统。

基于 OpenTiny 设计体系，TinyRobot 提供从对话 UI、流式渲染到会话管理的完整能力，使开发者无需自研复杂交互逻辑，即可构建体验一致、可扩展的 AI 产品。

**从原型到可运行 AI 应用，仅需数小时。**

---

## 为什么需要 TinyRobot

构建 AI 对话类产品通常涉及以下工程挑战：

- 流式响应渲染与中断控制
- 多轮会话状态管理
- 工具调用结果展示
- Markdown / 多模态内容渲染
- 输入增强（联想、附件、模板）
- UI 与模型交互逻辑耦合严重

TinyRobot 将这些能力抽象为标准化组件与组合式 API，使 AI 应用开发从“系统工程”转变为“组件组合”。

---

## 产品定位

TinyRobot 并非通用 UI 组件库，而是：

> **AI 交互层框架（AI Interaction Layer）**

职责边界：

- 负责 AI 对话界面与交互协议
- 提供模型响应处理与状态管理能力
- 不绑定任何具体模型或后端

这使其能够无缝对接 OpenAI、Azure、私有模型或企业服务。

---

## 核心能力

### 1️⃣ 原生 AI 交互组件体系

内置面向对话场景设计的 UI 组件：

- Bubble：支持流式文本、Markdown、代码块、工具调用展示
- Sender：支持多行输入、模板、@提及、附件上传
- Container：会话容器与布局系统
- History：会话历史管理
- Attachments：文件与多模态输入展示
- ThemeProvider：主题与外观系统

组件采用可组合架构，支持按需引入与 Tree Shaking。

---

### 2️⃣ 模型无关的响应处理机制

通过 `useMessage` 与 `responseProvider` 抽象 AI 响应协议：

- 支持 Promise 与 AsyncGenerator
- 原生支持流式响应
- 支持工具调用（Function Calling）
- 提供插件扩展机制
- 内置请求状态管理与中断控制

开发者仅需实现模型请求逻辑，即可完成完整对话链路。

---

### 3️⃣ 可扩展插件与工具调用体系

TinyRobot 提供标准化工具调用展示机制：

- 自动解析 tool_calls
- 统一展示工具执行结果
- 支持自定义插件扩展
- 支持外部系统集成

该机制使 AI 应用具备可扩展能力，而非仅限文本对话。

---

### 4️⃣ 主题系统与品牌定制

基于 CSS 变量的主题架构：

- 亮色 / 暗色模式切换
- 主题嵌套支持
- 持久化存储
- 品牌级 UI 定制能力

可快速构建符合企业视觉规范的 AI 产品界面。

---

### 5️⃣ 会话存储与状态持久化

支持多种存储策略：

- LocalStorage
- IndexedDB
- 自定义存储实现

适用于长对话、用户偏好与多会话管理场景。

---

## 架构设计

TinyRobot 采用分层架构，解耦 UI 渲染与 AI 协议处理：

**组件层（UI Layer）**
负责交互呈现与用户体验。

**Kit 层（AI Runtime Layer）**
负责消息流、状态管理与模型交互。

该设计实现：

- 关注点分离
- 可替换模型后端
- 可扩展交互协议
- UI 与业务逻辑解耦

---

## 典型应用场景

### 智能客服系统

- 快速搭建对话界面
- 支持知识库问答
- 支持流式响应
- 支持多轮上下文

适用于企业服务门户与业务系统集成。

---

### AI 助手与办公工具

- 统一 AI 交互入口
- 工具调用展示
- 模板与快捷输入
- 可扩展插件体系

适用于企业内部 AI 平台。

---

### 开发辅助与代码助手

- Markdown 与代码块渲染
- 工具执行结果展示
- 多轮任务交互
- 文件输入支持

适用于研发效率工具。

---

## 5 分钟快速上手

安装组件库：

```bash
pnpm add @opentiny/tiny-robot
```

可选安装运行时工具：

```bash
pnpm add @opentiny/tiny-robot-kit
```

基础示例：

```vue
<tr-bubble-item role="ai" content="Hello! I'm TinyRobot." />
```

完整示例与 API 文档见官方文档中心。

---

## OpenTiny 生态中的位置

TinyRobot 是 OpenTiny 体系中的 AI 交互层，与其他产品形成分层协作：

- TinyRobot：AI 对话与交互框架
- TinyVue：企业级通用组件
- TinyEngine：低代码构建平台

该生态提供从 UI、AI 交互到应用构建的完整解决方案。

---

## 开始使用

访问资源：

- 官网：[https://opentiny.design](https://opentiny.design)
- 代码仓库：[https://github.com/opentiny/tiny-robot](https://github.com/opentiny/tiny-robot)
- 文档中心：[https://docs.opentiny.design/tiny-robot](https://docs.opentiny.design/tiny-robot)

欢迎参与社区共建。
