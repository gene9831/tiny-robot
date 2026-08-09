import { App } from 'vue'
import McpAddForm from './index.vue'

/**
 * @deprecated Use McpExtensionForm within the ExtensionManager composition API instead.
 * This entry point remains available for compatibility and will be removed in a future major release.
 */
McpAddForm.name = 'TrMcpAddForm'

const install = function <T>(app: App<T>) {
  app.component(McpAddForm.name!, McpAddForm)
}

McpAddForm.install = install

export default McpAddForm as typeof McpAddForm & { install: typeof install }
