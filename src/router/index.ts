import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import HomePage from '../views/HomePage.vue'
import LoginUser from '../views/LoginUser.vue';
const routes: Array<RouteRecordRaw> = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'Login', component: LoginUser },
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
  { path: '/adminIncidentManagment', name: 'AdminIncidentManagment', component: HomePage },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
