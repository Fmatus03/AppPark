<template>
	<aside class="sidebar">
		<nav class="nav-bar" aria-label="Navegacion principal">
			<RouterLink
				v-for="item in navItems"
				:key="item.to"
				:to="item.to"
				class="nav-item"
				:class="{ active: navItemIsActive(item) }"
			>
				<ion-icon :icon="item.icon" class="nav-icon" aria-hidden="true" />
				<span class="nav-label">{{ item.label }}</span>
			</RouterLink>
		</nav>
	</aside>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { IonIcon } from '@ionic/vue';
import { homeOutline, clipboardOutline, personCircleOutline } from 'ionicons/icons';

type NavItem = {
	label: string;
	to: string;
	icon: string;
	match?: RegExp;
};

import { useSession } from '@/composables/useSession';

const { isAdmin, isAnalista } = useSession();

// Compute the three nav items based on user role. Always return exactly 3 items.
const navItems = computed<NavItem[]>(() => {
	const perfil: NavItem = { label: 'Perfil', to: '/profile', icon: personCircleOutline, match: /^\/profile/ };

	if (isAnalista.value) {
		// Analista: show Tendencias y analisis (no Gestion de incidentes)
		const tendencias: NavItem = { label: 'Tendencias y analisis', to: '/tendenciasAnalisis', icon: clipboardOutline, match: /^\/tendenciasAnalisis/ };
		const home: NavItem = { label: 'Home', to: '/analistaHome', icon: homeOutline, match: /^\/analistaHome/ };
		return [home, tendencias, perfil];
	}

	if (isAdmin.value) {
		// Admin: show Gestion de incidentes instead of Tendencias
		const gestion: NavItem = { label: 'Gestion de incidentes', to: '/adminIncidentManagment', icon: clipboardOutline, match: /^\/adminIncidentManagment/ };
		const home: NavItem = { label: 'Home', to: '/adminHome', icon: homeOutline, match: /^\/adminHome/ };
		return [home, gestion, perfil];
	}

	// Default (visitante or unauthenticated): show Tendencias by default
	const home: NavItem = { label: 'Home', to: '/adminHome', icon: homeOutline, match: /^\/adminHome/ };
	const tendenciasDefault: NavItem = { label: 'Tendencias y analisis', to: '/tendenciasAnalisis', icon: clipboardOutline, match: /^\/tendenciasAnalisis/ };
	return [home, tendenciasDefault, perfil];
});

const route = useRoute();
const activePath = computed(() => route.path);

const navItemIsActive = (item: NavItem) => {
	if (item.match) {
		return item.match.test(activePath.value);
	}

	return activePath.value === item.to;
};
</script>

<style scoped>

.sidebar {
	position: fixed;
	top: 0;
	left: 0;
	bottom: 0;
	width: 240px;
	background: var(--card-bg);
	border-right: 1px solid var(--border-color);
	box-shadow: var(--shadow-md);
	display: flex;
	flex-direction: column;
	align-items: stretch;
	padding: 24px;
	gap: 24px;
}

.nav-bar {
	display: flex;
	flex-direction: column;
	width: 100%;
	gap: 12px;
}

.nav-item {
	display: flex;
	align-items: center;
	gap: 12px;
	text-decoration: none;
	color: var(--ion-text-secondary);
	font-size: 0.95rem;
	font-weight: 500;
	padding: 12px 16px;
	border-radius: var(--radius-md);
	transition: color 0.2s ease, background-color 0.2s ease;
}

.nav-item:focus-visible {
	outline: 2px solid var(--ion-color-primary);
	outline-offset: 4px;
}

.nav-item:hover {
	background: #f1f5f9;
	color: #243064;
}

.nav-item.active {
	color: #2563eb;
	background: #eff6ff;
	font-weight: 700;
}

.nav-icon {
	font-size: 1.6rem;
	color: currentColor;
}

.nav-item.active .nav-label {
	font-weight: 600;
}

@media (max-width: 1024px) {
	.sidebar {
		width: 100%;
		height: auto;
		position: sticky;
		top: 0;
		padding: 16px;
		justify-content: center;
		box-shadow: var(--shadow-sm);
	}

	.nav-bar {
		flex-direction: row;
		justify-content: space-between;
		max-width: 480px;
	}

	.nav-item {
		justify-content: center;
		min-width: 120px;
	}
}
</style>
