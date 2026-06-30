import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { router } from './router'
import '@opentiny/tiny-robot/dist/style.css'

createApp(App).use(router).mount('#app')
