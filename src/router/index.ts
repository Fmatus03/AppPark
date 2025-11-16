import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import HomePage from '../views/HomePage.vue'
import LoginPhone from '../views/LoginPhone.vue'
const routes: Array<RouteRecordRaw> = [
  { path: '/', redirect: '/bar-test' },
  { path: '/login', name: 'Login', component: LoginPhone },
  { path: '/register', name: 'Register', component: HomePage },
  { path: '/home', name: 'Home', component: HomePage },
  { path: '/incidentLog', name: 'IncidentLog', component: HomePage },
  { path: '/myIncidents', name: 'MyIncidents', component: HomePage },
  { path: '/incidentDetail', name: 'IncidentDetail', component: HomePage },
  { path: '/profile', name: 'Profile', component: HomePage },
  { path: '/bar-test', name: 'BarTest', component: () => import('../views/BarTest.vue'), },
  { path: '/adminHome', name: 'AdminHome', component: HomePage },
  { path: '/adminIncidentDetail', name: 'AdminIncidentDetail', component: HomePage },
  { path: '/adminProfile', name: 'AdminProfile', component: HomePage },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
