import { createRouter, createWebHashHistory } from 'vue-router'
import ExtensionCardDemo from './components/Card.vue'
import ExtensionListDemo from './components/List.vue'
import ExtensionManagerDemo from './components/Manager.vue'
import ExtensionSectionDemo from './components/Section.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/extension-manager' },
    { path: '/extension-manager', name: 'extension-manager', component: ExtensionManagerDemo },
    { path: '/extension-section', name: 'extension-section', component: ExtensionSectionDemo },
    { path: '/extension-list', name: 'extension-list', component: ExtensionListDemo },
    { path: '/extension-card', name: 'extension-card', component: ExtensionCardDemo },
  ],
})
