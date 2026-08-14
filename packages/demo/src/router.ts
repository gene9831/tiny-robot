import { createRouter, createWebHashHistory } from 'vue-router'
import CardGridPage from './components/Card.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/card-grid' },
    { path: '/card-grid', name: 'card-grid', component: CardGridPage },
  ],
})
