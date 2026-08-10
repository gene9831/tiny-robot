import { createRouter, createWebHashHistory } from 'vue-router'
import ExtensionCardDemo from './components/Card.vue'
import ExtensionListDemo from './components/List.vue'
import ExtensionManagerDemo from './components/Manager.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/extension-manager' },
    { path: '/extension-manager', name: 'extension-manager', component: ExtensionManagerDemo },
    { path: '/extension-list', name: 'extension-list', component: ExtensionListDemo },
    { path: '/extension-card', name: 'extension-card', component: ExtensionCardDemo },
  ],
})
