import type { App } from 'vue'
import ExtensionManager from './index.vue'
import ExtensionCard from './components/ExtensionCard.vue'
import ExtensionList from './components/ExtensionList.vue'
import ExtensionSection from './components/ExtensionSection.vue'

ExtensionManager.name = 'ExtensionManager'
ExtensionCard.name = 'ExtensionManagerCard'
ExtensionList.name = 'ExtensionManagerList'
ExtensionSection.name = 'ExtensionManagerSection'

const install = function <T>(app: App<T>) {
  app.component(ExtensionManager.name!, ExtensionManager)
  app.component(ExtensionCard.name!, ExtensionCard)
  app.component(ExtensionList.name!, ExtensionList)
  app.component(ExtensionSection.name!, ExtensionSection)
}

const ExtensionManagerWithSubComponents = Object.assign(ExtensionManager, {
  install,
  Card: ExtensionCard,
  List: ExtensionList,
  Section: ExtensionSection,
})

export { ExtensionCard, ExtensionList, ExtensionSection }

export default ExtensionManagerWithSubComponents as typeof ExtensionManager & {
  install: typeof install
  Card: typeof ExtensionCard
  List: typeof ExtensionList
  Section: typeof ExtensionSection
}
