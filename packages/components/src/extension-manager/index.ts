import type { App } from 'vue'
import ExtensionManager from './index.vue'
import ExtensionManagerRoot from './ExtensionManagerRoot.vue'
import { ExtensionCard, ExtensionFilter, ExtensionList, McpDetail, McpForm } from './components'
import ExtensionManagerContent from './components/ExtensionManagerContent.vue'

ExtensionManager.name = 'ExtensionManager'
ExtensionManagerRoot.name = 'ExtensionManagerRoot'
ExtensionManagerContent.name = 'ExtensionManagerContent'
ExtensionCard.name = 'ExtensionCard'
ExtensionFilter.name = 'ExtensionFilter'
ExtensionList.name = 'ExtensionList'
McpDetail.name = 'McpDetail'
McpForm.name = 'McpForm'

const install = function <T>(app: App<T>) {
  app.component(ExtensionManager.name!, ExtensionManager)
  app.component(ExtensionManagerRoot.name!, ExtensionManagerRoot)
  app.component(ExtensionManagerContent.name!, ExtensionManagerContent)
  app.component(ExtensionCard.name!, ExtensionCard)
  app.component(ExtensionFilter.name!, ExtensionFilter)
  app.component(ExtensionList.name!, ExtensionList)
  app.component(McpDetail.name!, McpDetail)
  app.component(McpForm.name!, McpForm)
}

const ExtensionManagerWithSubComponents = Object.assign(ExtensionManager, {
  install,
  Root: ExtensionManagerRoot,
  Card: ExtensionCard,
  Filter: ExtensionFilter,
  List: ExtensionList,
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
  Filter: typeof ExtensionFilter
  List: typeof ExtensionList
  McpDetail: typeof McpDetail
  McpForm: typeof McpForm
}
