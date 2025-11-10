import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import LoginPhone from '../views/LoginPhone.vue'
import HomePage from '../views/HomePage.vue';

const routes: Array<RouteRecordRaw> = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'Login', component: LoginPhone },
  { path: '/register', name: 'Register', component: HomePage },
  { path: '/home', name: 'Home', component: HomePage },
  { path: '/incidentLog', name: 'IncidentLog', component: HomePage },
  { path: '/myIncidents', name: 'MyIncidents', component: HomePage },
  { path: '/incidentDetail', name: 'IncidentDetail', component: HomePage },
  { path: '/profile', name: 'Profile', component: HomePage },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
