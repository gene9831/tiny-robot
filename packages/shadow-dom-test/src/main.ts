import { createApp, defineCustomElement } from 'vue'
import App from './App.vue'
import AppShadow from './AppShadow.ce.vue'
import '../../components/dist/style.css'
import './style.css'
import styles from './style.css?raw'

customElements.define(
  'app-shadow',
  defineCustomElement(AppShadow, {
    styles: [styles, AppShadow.styles],
  }),
)

createApp(App).mount('#app')
