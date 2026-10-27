import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid(
  defineConfig({
    lang: 'zh-CN',
    title: 'Tiny Robot Next',
    description: 'Tiny Robot 下一代 Runtime 学习与技术文档',
    srcDir: 'src',
    cleanUrls: true,
    lastUpdated: true,
    markdown: {
      lineNumbers: true,
    },
    themeConfig: {
      nav: [
        { text: '快速开始', link: '/guide/quick-start' },
        { text: '学习路径', link: '/guide/quick-start' },
        { text: 'API', link: '/reference/runtime-api' },
        { text: '贡献与评审', link: '/contributing/documentation-standard' },
      ],
      sidebar: [
        {
          text: '开始',
          items: [
            { text: '文档首页', link: '/' },
            { text: '提交问题并读取回答', link: '/guide/quick-start' },
          ],
        },
        {
          text: '理解公共交互',
          items: [
            { text: '应用与模型之间的运行边界', link: '/concepts/runtime-overview' },
            { text: '请求 Runtime 执行业务动作', link: '/concepts/commands-and-runtime' },
          ],
        },
        {
          text: '理解领域状态',
          items: [
            { text: 'Runtime 保存的对话状态', link: '/concepts/snapshot-and-domain-model' },
            { text: '从状态中读取一段完整对话', link: '/concepts/domain-selectors' },
            { text: '同时管理多段对话', link: '/examples/multiple-conversations' },
            { text: '根据已确认事实更新状态', link: '/concepts/events-and-reducer' },
          ],
        },
        {
          text: '准备模型调用',
          items: [
            { text: '注册可用的模型接入', link: '/concepts/provider-registration' },
            { text: '准备一次模型调用', link: '/concepts/model-call-projection' },
            { text: '校验模型返回的文本流', link: '/concepts/model-step-ingress' },
            { text: '串联一次文本回答', link: '/examples/completed-text-run' },
            { text: '观察一次回答如何结束', link: '/examples/runtime-terminal-semantics/' },
            { text: '验证 DeepSeek 三种格式', link: '/examples/deepseek-runtime/' },
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
            { text: '生成和验证 Runtime API', link: '/contributing/runtime-api-docs-workflow' },
            { text: '文档完整性规范', link: '/contributing/documentation-standard' },
            { text: '学习文档评审指南', link: '/contributing/learning-document-review' },
            { text: '活动实施计划（临时）', link: '/design/implementation-plan' },
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
