import type { App } from 'vue'
import ExtensionManager from './index.vue'
import ExtensionManagerRoot from './ExtensionManagerRoot.vue'
import ExtensionCard from './components/ExtensionCard.vue'
import ExtensionFilter from './components/ExtensionFilter.vue'
import ExtensionList from './components/ExtensionList.vue'
import ExtensionManagerContent from './components/ExtensionManagerContent.vue'
import McpExtensionDetail from './components/McpExtensionDetail.vue'
import McpExtensionForm from './components/McpExtensionForm.vue'

ExtensionManager.name = 'ExtensionManager'
ExtensionManagerRoot.name = 'ExtensionManagerRoot'
ExtensionManagerContent.name = 'ExtensionManagerContent'
ExtensionCard.name = 'ExtensionManagerCard'
ExtensionFilter.name = 'ExtensionManagerFilter'
ExtensionList.name = 'ExtensionManagerList'
McpExtensionDetail.name = 'ExtensionManagerMcpDetail'
McpExtensionForm.name = 'ExtensionManagerMcpForm'

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
})

export {
  ExtensionCard,
  ExtensionFilter,
  ExtensionList,
  ExtensionManagerContent,
  ExtensionManagerRoot,
  McpExtensionDetail,
  McpExtensionForm,
}
export { useExtensionManager, useExtensionManagerContext } from './composables'

export default ExtensionManagerWithSubComponents as typeof ExtensionManager & {
  install: typeof install
  Root: typeof ExtensionManagerRoot
  Content: typeof ExtensionManagerContent
  Card: typeof ExtensionCard
  Filter: typeof ExtensionFilter
  List: typeof ExtensionList
}
