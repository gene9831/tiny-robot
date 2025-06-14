import { App } from 'vue'
import Tooltip from './index.vue'

Tooltip.name = 'TrTooltip'

const install = function <T>(app: App<T>) {
  app.component(Tooltip.name!, Tooltip)
}

Tooltip.install = install

export default Tooltip as typeof Tooltip & { install: typeof install }
