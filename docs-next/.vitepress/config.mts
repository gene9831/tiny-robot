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
        { text: '学习路径', link: '/concepts/runtime-overview' },
        { text: 'API', link: '/reference/runtime-api' },
        { text: '贡献与评审', link: '/contributing/documentation-standard' },
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
          text: '理解公共交互',
          items: [
            { text: 'Runtime 总览', link: '/concepts/runtime-overview' },
            { text: 'Command 与 Runtime API', link: '/concepts/commands-and-runtime' },
          ],
        },
        {
          text: '理解领域状态',
          items: [
            { text: 'Snapshot 与领域模型', link: '/concepts/snapshot-and-domain-model' },
            { text: '场景：多个 Conversation', link: '/examples/multiple-conversations' },
            { text: 'Domain Event 与 reducer', link: '/concepts/events-and-reducer' },
            { text: '场景：一次文本回答', link: '/examples/completed-text-run' },
          ],
        },
        {
          text: '准备模型调用',
          items: [
            { text: 'Provider 注册与安全边界', link: '/concepts/provider-registration' },
            { text: '能力检查与参数投影', link: '/concepts/model-call-projection' },
          ],
        },
        {
          text: '参考',
          items: [
            { text: '命名来源与项目定义', link: '/reference/terminology-sources' },
            { text: 'Runtime API 与 TSDoc', link: '/reference/runtime-api' },
          ],
        },
        {
          text: '贡献与评审',
          items: [
            { text: '文档完整性规范', link: '/contributing/documentation-standard' },
            { text: '学习文档评审指南', link: '/contributing/learning-document-review' },
            { text: '临时实施计划', link: '/design/implementation-plan' },
          ],
        },
        {
          text: '设计依据',
          items: [
            { text: '下一代架构总览', link: '/design/architecture-overview' },
            { text: 'ADR-0002 · Provider 边界', link: '/design/adr-0002-language-model-v4-provider-boundary' },
            { text: 'ADR-0004 · 状态分工', link: '/design/adr-0004-snapshot-command-event-runtime' },
            {
              text: 'ADR-0005 · Provider 注册与解析',
              link: '/design/adr-0005-provider-registration-and-runtime-resolution',
            },
            { text: 'Runtime 契约', link: '/design/runtime-contract' },
            { text: 'LanguageModelV4 Boundary v1', link: '/design/language-model-v4-runtime-boundary-v1' },
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
