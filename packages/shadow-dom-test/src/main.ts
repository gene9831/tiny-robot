import { createApp, defineCustomElement } from 'vue'
import App from './App.vue'
import AppShadow from './AppShadow.ce.vue'
import './style.css'

customElements.define(
  'app-shadow',
  defineCustomElement(AppShadow, {
    styles: [
      `*,
*::before,
*::after {
  box-sizing: border-box;
}`,
      AppShadow.styles,
    ],
  }),
)

createApp(App).mount('#app')
