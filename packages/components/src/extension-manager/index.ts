import type { App } from 'vue'
import ExtensionManager from './index.vue'
import ExtensionManagerRoot from './ExtensionManagerRoot.vue'
import { ExtensionCard, ExtensionCardGrid, ExtensionFilter, McpDetail, McpForm } from './components'

ExtensionManager.name = 'ExtensionManager'
ExtensionManagerRoot.name = 'ExtensionManagerRoot'
ExtensionCard.name = 'ExtensionCard'
ExtensionCardGrid.name = 'ExtensionCardGrid'
ExtensionFilter.name = 'ExtensionFilter'
McpDetail.name = 'McpDetail'
McpForm.name = 'McpForm'

const install = function <T>(app: App<T>) {
  app.component(ExtensionManager.name!, ExtensionManager)
  app.component(ExtensionManagerRoot.name!, ExtensionManagerRoot)
  app.component(ExtensionCard.name!, ExtensionCard)
  app.component(ExtensionCardGrid.name!, ExtensionCardGrid)
  app.component(ExtensionFilter.name!, ExtensionFilter)
  app.component(McpDetail.name!, McpDetail)
  app.component(McpForm.name!, McpForm)
}

const ExtensionManagerWithSubComponents = Object.assign(ExtensionManager, {
  install,
  Root: ExtensionManagerRoot,
  Card: ExtensionCard,
  CardGrid: ExtensionCardGrid,
  Filter: ExtensionFilter,
  McpDetail,
  McpForm,
})

export { ExtensionManager }
export { useExtensionContext } from './composables'
export * from './index.type'

export default ExtensionManagerWithSubComponents as typeof ExtensionManager & {
  install: typeof install
  Root: typeof ExtensionManagerRoot
  Card: typeof ExtensionCard
  CardGrid: typeof ExtensionCardGrid
  Filter: typeof ExtensionFilter
  McpDetail: typeof McpDetail
  McpForm: typeof McpForm
}
