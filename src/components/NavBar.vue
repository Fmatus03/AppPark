<template>
	<div class="nav-shell">
		<nav class="nav-bar">
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
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { IonIcon } from '@ionic/vue';
import { homeOutline, listOutline, personCircleOutline } from 'ionicons/icons';

type NavItem = {
	label: string;
	to: string;
	icon: string;
	match?: RegExp;
};

const navItems: NavItem[] = [
	{ label: 'Home', to: '/home', icon: homeOutline, match: /^\/home/ },
	{ label: 'Mis Incidentes', to: '/myIncidents', icon: listOutline, match: /^\/myIncidents/ },
	{ label: 'Perfil', to: '/profile', icon: personCircleOutline, match: /^\/profile/ },
];

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
.nav-shell {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 1100;
	background: #ffffff;
	padding: 12px 18px env(safe-area-inset-bottom, 0px);
	box-shadow: 0 -4px 16px rgba(25, 33, 61, 0.08);
	border-top: 1px solid rgba(18, 22, 44, 0.08);
}

:global(.has-mobile-navbar) .nav-shell {
	bottom: calc(env(safe-area-inset-bottom, 0) + 14px);
}

.nav-bar {
	display: flex;
	justify-content: space-between;
	align-items: center;
	max-width: 480px;
	margin: 0 auto;
	gap: 12px;
}

.nav-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	text-decoration: none;
	color: var(--ion-color-medium-shade, #62636c);
	font-size: 0.75rem;
	font-weight: 500;
	gap: 4px;
	min-width: 80px;
}

.nav-item:focus-visible {
	outline: 2px solid var(--ion-color-success, #2dd36f);
	outline-offset: 4px;
	border-radius: 8px;
}

.nav-icon {
	font-size: 1.6rem;
	color: currentColor;
}

.nav-item.active {
	color: var(--ion-color-success, #2dd36f);
}

.nav-item.active .nav-label {
	font-weight: 600;
}
</style>
