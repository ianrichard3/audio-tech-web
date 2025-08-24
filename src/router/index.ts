import { createRouter, createWebHistory } from 'vue-router'
import Calculator from '../views/Calculator.vue'
import About from '../views/About.vue'
import MapView from '../views/MapView.vue'
import Home from '../views/Home.vue'

const routes = [
  { path: '/calculator', component: Calculator },
  { path: '/about', component: About },
  { path: '/map', component: MapView },
  { path: '/', component: Home }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
