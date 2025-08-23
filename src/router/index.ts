import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import About from '../views/About.vue'
import Map from '../components/Map.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/about', component: About },
  { path: '/map', component: Map }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
