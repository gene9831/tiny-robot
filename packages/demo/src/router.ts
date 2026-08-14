import { createRouter, createWebHashHistory } from 'vue-router'
import CardDemo from './components/Card.vue'
import CardGridPage from './components/CardGrid.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/card-grid' },
    { path: '/card-grid', name: 'card-grid', component: CardGridPage },
    { path: '/extension-card', name: 'extension-card', component: CardDemo },
  ],
})
