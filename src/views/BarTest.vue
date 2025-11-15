<template>
	<ion-page class="sidebar-test-page">
		<ion-header translucent>
			<ion-toolbar>
				<ion-title>SideBar & NavBar Preview</ion-title>
			</ion-toolbar>
		</ion-header>

		<ion-content fullscreen>
			<section class="actions">
				<ion-card>
					<ion-card-header>
						<ion-card-title>Simular estado de sesion</ion-card-title>
						<ion-card-subtitle>Usa las acciones para ver como reacciona la UI</ion-card-subtitle>
					</ion-card-header>
					<ion-card-content class="buttons">
						<ion-button color="success" @click="loginAsAdmin">Login admin</ion-button>
						<ion-button color="primary" @click="loginAsUser">Login usuario</ion-button>
						<ion-button color="medium" fill="outline" @click="logout">Logout</ion-button>
					</ion-card-content>
				</ion-card>
			</section>

			<section class="status">
				<ion-card>
					<ion-card-header>
						<ion-card-title>Estado actual</ion-card-title>
					</ion-card-header>
					<ion-card-content>
						<ul class="status-list">
							<li><strong>Plataforma:</strong> {{ platformLabel }}</li>
							<li><strong>Autenticado:</strong> {{ isAuthenticated ? 'Si' : 'No' }}</li>
							<li><strong>Rol:</strong> {{ currentUser?.role ?? 'Sin usuario' }}</li>
						</ul>
						<p class="hint">
							El SideBar solo aparece en web cuando el rol es admin. El NavBar aparece en plataformas nativas cuando hay sesion activa.
						</p>
					</ion-card-content>
				</ion-card>
			</section>
		</ion-content>
	</ion-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
	IonButton,
	IonCard,
	IonCardContent,
	IonCardHeader,
	IonCardSubtitle,
	IonCardTitle,
	IonContent,
	IonHeader,
	IonPage,
	IonTitle,
	IonToolbar,
} from '@ionic/vue';
import { Capacitor } from '@capacitor/core';
import { useSession } from '../composables/useSession';

const { login, logout, currentUser, isAuthenticated} = useSession();

const nativePlatforms = new Set(['ios', 'android']);
const platform = Capacitor.getPlatform();
const isNativePlatform = nativePlatforms.has(platform);

const platformLabel = computed(() => (isNativePlatform ? `${platform} (nativo)` : `${platform} (web)`));

const loginAsAdmin = () => {
	login({ id: 'admin-1', name: 'Admin Test', role: 'admin' });
};

const loginAsUser = () => {
	login({ id: 'user-1', name: 'Usuario Test', role: 'user' });
};
</script>

<style scoped>
.sidebar-test-page {
	background: #f1f5f9;
	color: #0f172a;
}

.actions,
.status {
	max-width: 640px;
	margin: 24px auto;
	padding: 0 16px;
}

.buttons {
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
}

.status-list {
	list-style: none;
	padding: 0;
	margin: 0 0 16px;
	display: grid;
	gap: 8px;
}

.status-list strong {
	font-weight: 600;
}

.hint {
	font-size: 0.85rem;
	color: #475569;
}
</style>
