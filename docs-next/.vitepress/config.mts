import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid(
  defineConfig({
    lang: 'zh-CN',
    title: 'Tiny Robot Next',
    description: 'Tiny Robot 下一代 Runtime 与 Provider 架构评审文档',
    srcDir: 'src',
    cleanUrls: true,
    lastUpdated: true,
    markdown: {
      lineNumbers: true,
    },
    themeConfig: {
      nav: [
        { text: '快速开始', link: '/guide/quick-start' },
        { text: '概念', link: '/concepts/runtime-overview' },
        { text: '示例', link: '/examples/completed-text-run' },
        { text: 'API', link: '/reference/runtime-api' },
        { text: '文档规范', link: '/contributing/documentation-standard' },
      ],
      sidebar: [
        {
          text: '开始',
          items: [
            { text: '文档首页', link: '/' },
            { text: '快速开始', link: '/guide/quick-start' },
          ],
        },
        {
          text: 'Task 1 · Runtime 边界',
          items: [
            { text: 'Runtime 总览', link: '/concepts/runtime-overview' },
            { text: 'Command 与 Runtime API', link: '/concepts/commands-and-runtime' },
            { text: '模型注册与安全边界', link: '/concepts/model-registration' },
          ],
        },
        {
          text: 'Task 2 · 领域状态',
          items: [
            { text: 'Snapshot 与领域模型', link: '/concepts/snapshot-and-domain-model' },
            { text: 'Domain Event 与 reducer', link: '/concepts/events-and-reducer' },
          ],
        },
        {
          text: '场景示例',
          items: [
            { text: '一次文本回答', link: '/examples/completed-text-run' },
            { text: '多个 Conversation', link: '/examples/multiple-conversations' },
          ],
        },
        {
          text: '参考',
          items: [
            { text: '命名来源与项目定义', link: '/reference/terminology-sources' },
            { text: 'Runtime API 与 TSDoc', link: '/reference/runtime-api' },
            { text: '文档完整性规范', link: '/contributing/documentation-standard' },
          ],
        },
        {
          text: '设计依据',
          items: [
            { text: '下一代架构总览', link: '/design/architecture-overview' },
            { text: 'ADR-0002 · Provider 边界', link: '/design/adr-0002-language-model-v4-provider-boundary' },
            { text: 'ADR-0004 · 状态分工', link: '/design/adr-0004-snapshot-command-event-runtime' },
            { text: 'Runtime 契约', link: '/design/runtime-contract' },
            { text: 'LanguageModelV4 Boundary v1', link: '/design/language-model-v4-runtime-boundary-v1' },
            { text: '临时 · 实施计划', link: '/design/implementation-plan' },
          ],
        },
      ],
      search: { provider: 'local' },
      outline: { level: [2, 3], label: '本页目录' },
      docFooter: { prev: '上一页', next: '下一页' },
      lastUpdated: { text: '最后更新' },
    },
  }),
)
