import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import HomePage from '../views/HomePage.vue'
import LoginUser from '../views/LoginUser.vue';
import RegisterUser from '@/views/RegisterUser.vue';
import HomeUser from '@/views/HomeUser.vue';
import IncidentLog from '@/views/IncidentLog.vue';
import MyIncidents from '@/views/MyIncidents.vue';
import IncidentManagment from '@/views/IncidentManagment.vue';
import AdminIncidentDetail from '@/views/AdminIncidentDetail.vue';
import { useSession } from '@/composables/useSession';
import IncidentDetail from '@/views/IncidentDetail.vue';
import AdminHome from '@/views/AdminHome.vue';
import TendenciasAnalisis from '../views/TendenciasAnalisis.vue';
import ProfileUser from '@/views/ProfileUser.vue';

const routes: Array<RouteRecordRaw> = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'Login', component: LoginUser },
  { path: '/register', name: 'Register', component: RegisterUser },
  { path: '/home', name: 'Home', component: HomeUser, meta: { requiresAuth: true } },
  { path: '/incidentLog', name: 'IncidentLog', component: IncidentLog, meta: { requiresAuth: true } },
  { path: '/myIncidents', name: 'MyIncidents', component: MyIncidents, meta: { requiresAuth: true } },
  { path: '/incidentDetail', name: 'IncidentDetail', component: IncidentDetail , meta: { requiresAuth: true } },
  { path: '/profile', name: 'Profile', component: ProfileUser, meta: { requiresAuth: true } },
  { path: '/bar-test', name: 'BarTest', component: () => import('../views/BarTest.vue'), meta: { requiresAuth: true } },
  { path: '/adminHome', name: 'AdminHome', component: AdminHome, meta: { requiresAuth: true } },
  { path: '/adminIncidentDetail', name: 'AdminIncidentDetail', component: AdminIncidentDetail, meta: { requiresAuth: true } },
  { path: '/adminIncidentManagment', name: 'AdminIncidentManagment', component: IncidentManagment, meta: { requiresAuth: true } },
  { path: '/tendenciasAnalisis', name: 'TendenciasAnalisis', component: TendenciasAnalisis, meta: { requiresAuth: true } },
  { path: '/analistaHome', name: 'AnalistaHome', component: HomePage, meta: { requiresAuth: true } },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach((to, from, next) => {
	const session = useSession();
	const user = session.currentUser.value;

	if (user && to.name === 'Login') {
		const defaultRoute = user.role === 'VISITANTE' ? 'Home' : 'AdminHome';
    return next({ name: defaultRoute });
	}

	if (to.meta?.requiresAuth && !user) {
		return next({ name: 'Login' });
	}

	return next();
});

export default router
