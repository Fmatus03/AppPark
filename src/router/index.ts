import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import HomePage from '../views/HomePage.vue';
import IncidentDetail from '@/views/IncidentDetail.vue';

const routes: Array<RouteRecordRaw> = [
  { path: '/', redirect: '/incidentDetail?id=1' },
  { path: '/login', name: 'Login', component: HomePage },
  { path: '/register', name: 'Register', component: HomePage },
  { path: '/home', name: 'Home', component: HomePage },
  { path: '/incidentLog', name: 'IncidentLog', component: HomePage },
  { path: '/myIncidents', name: 'MyIncidents', component: HomePage },
  { path: '/incidentDetail', name: 'IncidentDetail', component: IncidentDetail },
  { path: '/profile', name: 'Profile', component: HomePage },
  { path: '/navBar-test', name: 'NavBarTest', component: () => import('../views/NavBarTest.vue'), },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
