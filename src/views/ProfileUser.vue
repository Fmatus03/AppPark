<template>
	<ion-page>
		<ion-header :translucent="true">
			<ion-toolbar>
				<ion-title class="ion-text-center">Perfil</ion-title>
			</ion-toolbar>
		</ion-header>

		<ion-content :fullscreen="true" class="profile-content">
			<section>
				<ion-card class="profile-card">
					<ion-card-content class="profile-header">
						<ion-avatar class="profile-avatar">
							<span>{{ profileInitials }}</span>
						</ion-avatar>
						<h2 class="profile-name">{{ profileName }}</h2>
						<p class="profile-role">{{ profileRole }}</p>
					</ion-card-content>
				</ion-card>
			</section>

			<section>
				<ion-card class="contact-card">
					<ion-card-header>
						<ion-card-title>Información de contacto</ion-card-title>
					</ion-card-header>
					<ion-card-content>
						<ion-list inset>
							<ion-item>
								<ion-icon slot="start" :icon="mailOutline" aria-hidden="true"></ion-icon>
								<ion-label>
									<h3>Correo</h3>
									<p>{{ currentUserProfile?.email ?? '—' }}</p>
								</ion-label>
							</ion-item>
							<ion-item>
								<ion-label>
									<h3>Rol</h3>
									<p class="text-uppercase">{{ currentUserProfile?.rol ?? '—' }}</p>
								</ion-label>
							</ion-item>
							<ion-item>
								<ion-label>
									<h3>ID de usuario</h3>
									<p>{{ currentUserProfile?.id ?? '—' }}</p>
								</ion-label>
							</ion-item>
						</ion-list>
						<div class="card-status" v-if="isLoading || errorMessage">
							<p v-if="isLoading">Cargando perfil…</p>
							<p v-else class="error-text">{{ errorMessage }}</p>
							<ion-button
								v-if="!isLoading && errorMessage"
								size="small"
								fill="outline"
								@click="loadProfile"
							>
								Reintentar
							</ion-button>
						</div>
					</ion-card-content>
				</ion-card>

				<div class="logout-wrapper">
					<ion-button class="logout-button" @click="redirectToLogin">
						Cerrar sesión
					</ion-button>
				</div>
			</section>
            <section>
                <ion-chip class="safe-area-spacer" aria-hidden="true" disabled>
					Espacio reservado
				</ion-chip>
            </section>
            <section>
                <ion-chip class="safe-area-spacer" aria-hidden="true" disabled>
					Espacio reservado
				</ion-chip>
            </section>
            <section>
                <ion-chip class="safe-area-spacer" aria-hidden="true" disabled>
					Espacio reservado
				</ion-chip>
            </section>
		</ion-content>
	</ion-page>
</template>

<script setup lang="ts">
import {
	IonAvatar,
	IonButton,
	IonCard,
	IonCardContent,
	IonCardHeader,
	IonCardTitle,
	IonChip,
	IonContent,
	IonHeader,
	IonIcon,
	IonItem,
	IonLabel,
	IonList,
	IonPage,
	IonTitle,
	IonToolbar,
} from '@ionic/vue';
import { mailOutline } from 'ionicons/icons';
import axios from 'axios';
import { HTTP } from '@awesome-cordova-plugins/http';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { isAndroidNativeApp, parseNativeResponse } from '@/utils/httpHelpers';
import { useSession } from '@/composables/useSession';

type UsuarioPerfilDTO = {
	id: number;
	nombre: string;
	email: string;
	rol: string;
};

const router = useRouter();
const { authToken, logout } = useSession();
const apiBaseUrl = import.meta.env.VITE_PARK_APP_API_URL ?? '';

const currentUserProfile = ref<UsuarioPerfilDTO | null>(null);
const isLoading = ref(false);
const errorMessage = ref('');

const resolveProfileEndpoint = () => {
	const trimmedBase = apiBaseUrl?.trim();
	if (trimmedBase) {
		const normalized = trimmedBase.endsWith('/') ? trimmedBase : `${trimmedBase}/`;
		return `${normalized}api/auth/me`;
	}
	if (typeof window !== 'undefined' && window.location?.origin) {
		return `${window.location.origin}/api/auth/me`;
	}
	return '/api/auth/me';
};

const profileEndpoint = resolveProfileEndpoint();

const buildAuthHeaders = (): Record<string, string> => {
	const token = authToken.value;
	if (token) {
		return {
			Authorization: `Bearer ${token}`,
		};
	}
	return {};
};

const requestProfileWithAxios = async (): Promise<UsuarioPerfilDTO> => {
	const response = await axios.get<UsuarioPerfilDTO>(profileEndpoint, {
		withCredentials: true,
		headers: {
			Accept: 'application/json',
			...buildAuthHeaders(),
		},
	});
	return response.data;
};

const requestProfileWithCordova = async (): Promise<UsuarioPerfilDTO> => {
	const headers = {
		Accept: 'application/json',
		...buildAuthHeaders(),
	};
	const response = await HTTP.get(profileEndpoint, {}, headers);
	return parseNativeResponse<UsuarioPerfilDTO>(response.data);
};

const handleUnauthorized = () => {
	logout();
	router.replace({ name: 'Login' });
};

const loadProfile = async () => {
	isLoading.value = true;
	errorMessage.value = '';
	try {
		const payload = isAndroidNativeApp()
			? await requestProfileWithCordova()
			: await requestProfileWithAxios();
		currentUserProfile.value = payload;
	} catch (error: any) {
		console.error('profile-fetch-error', error);
		const status = error?.status ?? error?.response?.status;
		if (status === 401) {
			handleUnauthorized();
			return;
		}
		errorMessage.value = 'No pudimos cargar tu perfil. Intenta nuevamente en unos segundos.';
	} finally {
		isLoading.value = false;
	}
};

onMounted(loadProfile);

const normalizeInitials = (name?: string) => {
	if (!name) {
		return 'US';
	}
	const parts = name
		.trim()
		.split(/\s+/)
		.filter(Boolean);
	if (!parts.length) {
		return 'US';
	}
	if (parts.length === 1) {
		return parts[0]!.slice(0, 2).toUpperCase();
	}
	return `${(parts[0]![0] ?? '').toUpperCase()}${(parts[parts.length - 1]![0] ?? '').toUpperCase()}`;
};

const profileInitials = computed(() => normalizeInitials(currentUserProfile.value?.nombre));
const profileName = computed(() => currentUserProfile.value?.nombre ?? 'Usuario');
const profileRole = computed(() => currentUserProfile.value?.rol ?? 'Rol no disponible');

const redirectToLogin = () => {
	logout();
	router.push({ name: 'Login' });
};

</script>

<style scoped>
.profile-content {
	--background: var(--ion-color-light, #f5f5f5);
	padding: 20px 16px 32px;
	display: flex;
	flex-direction: column;
	gap: 24px;
}

.profile-card,
.contact-card {
	border-radius: 18px;
	box-shadow: 0 12px 24px -12px rgba(15, 23, 42, 0.35);
}

.profile-header {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 16px;
	text-align: center;
}

.profile-avatar {
	width: 96px;
	height: 96px;
	background: var(--ion-color-primary, #2eae78);
	color: #fff;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 2.1rem;
	font-weight: 600;
	text-transform: uppercase;
}

.profile-name {
	margin: 0;
	font-size: 1.4rem;
	font-weight: 650;
}

.profile-role {
	margin: 0;
	font-size: 0.9rem;
	text-transform: uppercase;
	letter-spacing: 0.12em;
	color: var(--ion-color-medium, #6b7280);
}

.contact-card ion-card-title {
	font-size: 1.1rem;
	font-weight: 600;
}

.contact-card ion-item h3 {
	margin: 0;
	font-size: 0.9rem;
	text-transform: uppercase;
	color: var(--ion-color-medium, #6b7280);
}

.contact-card ion-item p {
	margin: 4px 0 0;
	font-size: 1rem;
	color: #0f172a;
}

.contact-card ion-icon {
	font-size: 1.4rem;
	color: var(--ion-color-primary, #2eae78);
}

.card-status {
	margin-top: 12px;
	text-align: center;
}

.card-status p {
	margin: 0 0 8px;
	color: var(--ion-color-medium, #6b7280);
}

.card-status .error-text {
	color: #b91c1c;
}

.logout-button {
	margin-top: 12px;
	border-radius: 12px;
	width: 100%;
	--background: #f84857;
	--background-focused: #e53c4a;
	--background-activated: #d43343;
	--color: #ffffff;
	box-shadow: 0 10px 24px -12px rgba(248, 72, 87, 0.65);
}

.logout-wrapper {
	max-width: 385px;
	margin: 0 auto;
}

.safe-area-spacer {
	opacity: 0;
	width: 100%;
	min-height: 0;
	margin: 0;
	padding: 0;
}

:global(.has-mobile-navbar) .safe-area-spacer {
	min-height: calc(env(safe-area-inset-bottom, 0) + 5rem);
}

@media (max-width: 480px) {
	.profile-avatar {
		width: 120px;
		height: 120px;
		font-size: 2.25rem;
	}

	.profile-name {
		font-size: 1.25rem;
	}
}
</style>
