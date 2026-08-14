import { createRouter, createWebHashHistory } from 'vue-router'
import ExtensionCardDemo from './components/Card.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/extension-card' },
    { path: '/extension-card', name: 'extension-card', component: ExtensionCardDemo },
  ],
})
