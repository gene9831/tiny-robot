import { App } from 'vue'
import MCPServerPicker from './index.vue'

MCPServerPicker.name = 'McpServerPicker'

const install = function <T>(app: App<T>) {
  app.component(MCPServerPicker.name!, MCPServerPicker)
}

MCPServerPicker.install = install

/**
 * @deprecated Use ExtensionManager with ExtensionFilter, ExtensionList, and ExtensionCard instead.
 * This entry point remains available for compatibility and will be removed in a future major release.
 */
export default MCPServerPicker as typeof MCPServerPicker & { install: typeof install }
