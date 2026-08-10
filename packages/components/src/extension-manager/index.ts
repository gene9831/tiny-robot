import type { App } from 'vue'
import ExtensionManager from './index.vue'
import ExtensionManagerRoot from './ExtensionManagerRoot.vue'
import {
  ExtensionCard,
  ExtensionFilter,
  ExtensionList,
  ExtensionManagerContent,
  McpExtensionDetail,
  McpExtensionForm,
} from './components'

ExtensionManager.name = 'ExtensionManager'
ExtensionManagerRoot.name = 'ExtensionManagerRoot'
ExtensionManagerContent.name = 'ExtensionManagerContent'
ExtensionCard.name = 'ExtensionCard'
ExtensionFilter.name = 'ExtensionFilter'
ExtensionList.name = 'ExtensionList'
McpExtensionDetail.name = 'McpExtensionDetail'
McpExtensionForm.name = 'McpExtensionForm'

const install = function <T>(app: App<T>) {
  app.component(ExtensionManager.name!, ExtensionManager)
  app.component(ExtensionManagerRoot.name!, ExtensionManagerRoot)
  app.component(ExtensionManagerContent.name!, ExtensionManagerContent)
  app.component(ExtensionCard.name!, ExtensionCard)
  app.component(ExtensionFilter.name!, ExtensionFilter)
  app.component(ExtensionList.name!, ExtensionList)
  app.component(McpExtensionDetail.name!, McpExtensionDetail)
  app.component(McpExtensionForm.name!, McpExtensionForm)
}

const ExtensionManagerWithSubComponents = Object.assign(ExtensionManager, {
  install,
  Root: ExtensionManagerRoot,
  Content: ExtensionManagerContent,
  Card: ExtensionCard,
  Filter: ExtensionFilter,
  List: ExtensionList,
  McpExtensionDetail,
  McpExtensionForm,
})

export {
  ExtensionManager,
  ExtensionCard,
  ExtensionFilter,
  ExtensionList,
  ExtensionManagerContent,
  ExtensionManagerRoot,
  McpExtensionDetail,
  McpExtensionForm,
}
export * from './index.type'

export default ExtensionManagerWithSubComponents as typeof ExtensionManager & {
  install: typeof install
  Root: typeof ExtensionManagerRoot
  Content: typeof ExtensionManagerContent
  Card: typeof ExtensionCard
  Filter: typeof ExtensionFilter
  List: typeof ExtensionList
  McpExtensionDetail: typeof McpExtensionDetail
  McpExtensionForm: typeof McpExtensionForm
}
