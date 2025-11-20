<template>
	<ion-page>
		<ion-header :translucent="true">
			<ion-toolbar>
				<ion-buttons slot="start">
					<ion-back-button default-href="/myIncidents"></ion-back-button>
				</ion-buttons>
				<ion-title>Detalles incidente</ion-title>
			</ion-toolbar>
		</ion-header>

		<ion-content :fullscreen="true" class="incident-content">
			<div v-if="isLoading" class="state-card" role="status">
				<ion-spinner name="crescent" aria-hidden="true" />
				<p>Cargando incidente…</p>
			</div>

			<div v-else-if="loadError" class="state-card error" role="alert">
				<p>{{ loadError }}</p>
				<ion-button size="small" fill="clear" color="primary" @click="retryFetch">
					Reintentar
				</ion-button>
			</div>

			<div v-else-if="incident" class="incident-view">
				<section class="incident-summary">
					<ion-card class="incident-card">
						<ion-card-header>
							<ion-card-title>{{ incident.titulo }}</ion-card-title>
						</ion-card-header>
						<ion-card-content>
							<p>{{ incident.descripcion }}</p>
						</ion-card-content>
					</ion-card>
				</section>

				<section class="incident-details" aria-label="Detalles del incidente">
					<ion-card class="incident-card">
						<ion-card-header>
							<ion-card-title>Detalles del Incidente</ion-card-title>
						</ion-card-header>
						<ion-card-content>
							<ion-list lines="none">
								<ion-item v-for="detail in incidentDetails" :key="detail.id">
									<ion-icon slot="start" :icon="detail.icon" class="detail-icon" aria-hidden="true" />
									<ion-label>
										<h3>{{ detail.label }}</h3>
										<p>{{ detail.value }}</p>
									</ion-label>
								</ion-item>
							</ion-list>
						</ion-card-content>
					</ion-card>
				</section>

				<section class="incident-evidence" aria-label="Evidencia del incidente">
					<ion-card class="incident-card">
						<ion-card-header>
							<ion-card-title>Evidencia</ion-card-title>
						</ion-card-header>
						<ion-card-content class="evidence-content">
							<div class="evidence-gallery" v-if="evidenceImages.length">
								<h3>Imágenes</h3>
								<div class="image-grid">
									<ion-card v-for="(image, index) in evidenceImages" :key="`${image}-${index}`" class="image-card">
										<ion-img :src="image" :alt="`Evidencia fotográfica ${index + 1}`" loading="lazy" />
									</ion-card>
								</div>
							</div>
							<p v-else class="evidence-placeholder">Sin imágenes registradas.</p>

							<div class="evidence-audio" v-if="evidenceAudios.length">
								<h3>Audios</h3>
								<ion-list lines="none">
									<ion-item v-for="(audio, index) in evidenceAudios" :key="`${audio}-${index}`" class="audio-item">
										<audio controls preload="metadata" :src="audio"></audio>
									</ion-item>
								</ion-list>
							</div>
							<p v-else class="evidence-placeholder">Sin audios registrados.</p>
						</ion-card-content>
					</ion-card>

					<ion-chip class="safe-area-spacer" aria-hidden="true" disabled>
						Espacio reservado
					</ion-chip>
				</section>
			</div>
		</ion-content>
	</ion-page>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { HTTP } from '@awesome-cordova-plugins/http';
import { useSession } from '@/composables/useSession';
import {
	isAndroidNativeApp,
	parseFetchResponse,
	parseNativeResponse,
	throwFetchError,
} from '@/utils/httpHelpers';
import {
	IonBackButton,
	IonButton,
	IonButtons,
	IonCard,
	IonCardContent,
	IonCardHeader,
	IonCardTitle,
	IonContent,
	IonHeader,
	IonIcon,
	IonImg,
	IonItem,
	IonLabel,
	IonList,
	IonPage,
	IonSpinner,
	IonTitle,
	IonToolbar,
} from '@ionic/vue';
import {
	calendarOutline,
	locationOutline,
	pricetagOutline,
	timeOutline,
} from 'ionicons/icons';

type Nullable<T> = T | null | undefined;

interface IncidenteResponseDTO {
	id: number;
	titulo: string;
	descripcion: string;
	categoriaId?: Nullable<number>;
	categoriaNombre?: Nullable<string>;
	estado?: Nullable<string>;
	fechaReporte?: Nullable<string>;
	latitud?: Nullable<number>;
	longitud?: Nullable<number>;
	rutaId?: Nullable<number>;
	reportadoPorEmail?: Nullable<string>;
	fotos?: Nullable<string[]>;
	audios?: Nullable<string[]>;
}

const route = useRoute();
const { authToken } = useSession();

const incident = ref<IncidenteResponseDTO | null>(null);
const isLoading = ref(true);
const loadError = ref<string | null>(null);

const sanitizeId = (value: unknown): string | null => {
	if (typeof value === 'string' && value.trim().length) {
		return value;
	}
	if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
		return value[0];
	}
	return null;
};

const incidentId = computed(() => {
	const paramId = sanitizeId(route.params?.id);
	const queryId = sanitizeId(route.query?.id);
	return paramId ?? queryId;
});

const normalizeIncidentDto = (dto: IncidenteResponseDTO): IncidenteResponseDTO => ({
	...dto,
	fotos: Array.isArray(dto.fotos) ? dto.fotos : [],
	audios: Array.isArray(dto.audios) ? dto.audios : [],
});

const formatDate = (isoDate?: Nullable<string>): string => {
	if (!isoDate) {
		return 'Sin fecha';
	}
	const date = new Date(isoDate);
	if (Number.isNaN(date.getTime())) {
		return 'Sin fecha';
	}
	return new Intl.DateTimeFormat('es-CL', { dateStyle: 'long' }).format(date);
};

const formatTime = (isoDate?: Nullable<string>): string => {
	if (!isoDate) {
		return 'Sin hora';
	}
	const date = new Date(isoDate);
	if (Number.isNaN(date.getTime())) {
		return 'Sin hora';
	}
	return new Intl.DateTimeFormat('es-CL', { hour: '2-digit', minute: '2-digit' }).format(date);
};

const formatLocation = (payload: IncidenteResponseDTO | null): string => {
	if (!payload) {
		return 'Sin ubicación';
	}
	if (typeof payload.latitud === 'number' && typeof payload.longitud === 'number') {
		return `${payload.latitud.toFixed(6)}, ${payload.longitud.toFixed(6)}`;
	}
	if (payload.rutaId) {
		return `Ruta ${payload.rutaId}`;
	}
	return 'Sin ubicación';
};

const buildEndpoint = (baseUrl: string, id: string): string => {
	const sanitizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
	const encodedId = encodeURIComponent(id);
	return `${sanitizedBase}/api/incidentes/mis-incidentes/${encodedId}`;
};

const extractErrorMessage = (payload: unknown): string | null => {
	if (!payload) {
		return null;
	}
	if (typeof payload === 'string') {
		const trimmed = payload.trim();
		return trimmed ? trimmed : null;
	}
	if (typeof payload === 'object' && 'message' in payload) {
		const message = (payload as Record<string, unknown>).message;
		return typeof message === 'string' ? message : null;
	}
	return null;
};

const createHttpError = (status: number, data?: unknown): Error => {
	const error = new Error(`Request failed with status ${status || 'desconocido'}`);
	(error as Error & { status?: number }).status = status;
	if (data !== undefined) {
		(error as Error & { data?: unknown }).data = data;
	}
	return error;
};

const fetchIncident = async (id: string): Promise<void> => {
	const baseUrl = import.meta.env.VITE_PARK_APP_API_URL as string | undefined;
	const token = authToken.value;
	if (!baseUrl) {
		loadError.value = 'No se configuró la URL base de la API.';
		isLoading.value = false;
		return;
	}
	if (!token) {
		loadError.value = 'No se encontró una sesión activa.';
		isLoading.value = false;
		return;
	}

	isLoading.value = true;
	loadError.value = null;

	const endpoint = buildEndpoint(baseUrl, id);
	const headers = {
		Accept: 'application/json',
		Authorization: `Bearer ${token}`,
	};

	try {
		let payload: IncidenteResponseDTO | null = null;
		if (isAndroidNativeApp()) {
			const response = await HTTP.sendRequest(endpoint, {
				method: 'get',
				headers,
				responseType: 'json',
			});
			if (!response || response.status < 200 || response.status >= 300) {
				throw createHttpError(response?.status ?? 0, response?.data);
			}
			payload = parseNativeResponse<IncidenteResponseDTO>(response.data) ?? null;
		} else {
			const response = await fetch(endpoint, { method: 'GET', headers });
			if (!response.ok) {
				await throwFetchError(response);
			}
			payload = (await parseFetchResponse<IncidenteResponseDTO>(response)) ?? null;
		}

		if (!payload) {
			loadError.value = 'El servidor no retornó datos del incidente.';
			incident.value = null;
			return;
		}

		incident.value = normalizeIncidentDto(payload);
	} catch (error) {
		console.error('Error loading incident detail', error);
		const status = (error as { status?: number })?.status;
		const data = (error as { error?: unknown; data?: unknown })?.error ??
			(error as { data?: unknown })?.data;
		const detailedMessage = extractErrorMessage(data);
		if (status === 404) {
			loadError.value = 'No encontramos este incidente.';
		} else if (status === 401) {
			loadError.value = 'Tu sesión expiró. Inicia sesión nuevamente.';
		} else if (detailedMessage) {
			loadError.value = detailedMessage;
		} else {
			loadError.value = 'No fue posible cargar el incidente. Inténtalo nuevamente.';
		}
	} finally {
		isLoading.value = false;
	}
};

const retryFetch = (): void => {
	if (!incidentId.value) {
		loadError.value = 'No se encontró el identificador del incidente.';
		return;
	}
	void fetchIncident(incidentId.value);
};

watch(
	() => incidentId.value,
	(newId) => {
		if (!newId) {
			isLoading.value = false;
			loadError.value = 'No se encontró el identificador del incidente.';
			return;
		}
		void fetchIncident(newId);
	},
	{ immediate: true }
);

const incidentDetails = computed(() => {
	const current = incident.value;
	if (!current) {
		return [];
	}
	return [
		{
			id: 'category',
			label: 'Categoría',
			value: current.categoriaNombre ?? 'Sin categoría',
			icon: pricetagOutline,
		},
		{
			id: 'location',
			label: 'Ubicación',
			value: formatLocation(current),
			icon: locationOutline,
		},
		{
			id: 'date',
			label: 'Fecha',
			value: formatDate(current.fechaReporte),
			icon: calendarOutline,
		},
		{
			id: 'time',
			label: 'Hora',
			value: formatTime(current.fechaReporte),
			icon: timeOutline,
		},
	];
});

const evidenceImages = computed(() => incident.value?.fotos ?? []);
const evidenceAudios = computed(() => incident.value?.audios ?? []);
</script>

<style scoped>
.incident-content {
	--background: var(--ion-color-light, #f5f5f5);
	padding: 16px;
	display: flex;
	flex-direction: column;
	gap: 24px;
}

.incident-view {
	display: flex;
	flex-direction: column;
	gap: 24px;
}

.state-card {
	background: #fff;
	border-radius: 18px;
	padding: 32px 24px;
	text-align: center;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 12px;
	color: #111;
	box-shadow: 0 12px 24px -12px rgba(15, 23, 42, 0.35);
}

.state-card.error {
	color: #c0392b;
}

.incident-card {
	box-shadow: 0 12px 24px -12px rgba(15, 23, 42, 0.35);
	border-radius: 18px;
}

.incident-card ion-card-header {
	padding-bottom: 0;
}

.incident-card ion-card-title {
	font-size: 1.25rem;
	font-weight: 650;
}

.incident-summary .incident-card ion-card-header {
	padding-bottom: 20px;
}

.incident-summary ion-card p {
	margin: 0;
	color: #333;
	line-height: 1.4;
}

.incident-details ion-item {
	--inner-padding-end: 0;
	--inner-padding-start: 0;
}

.incident-details .detail-icon {
	font-size: 1.4rem;
	color: #2eae78;
}

.incident-details h3 {
	margin: 0 0 4px;
	font-size: 0.9rem;
	text-transform: uppercase;
	color: var(--ion-color-medium, #666);
}

.incident-details p {
	margin: 0;
	font-size: 1rem;
	color: #111;
}

.incident-evidence h2 {
	margin: 0 0 12px;
	font-size: 1.1rem;
}

.incident-evidence h3 {
	margin: 16px 0 8px;
	font-size: 1rem;
}

.evidence-content {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.image-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
	gap: 16px;
}

.image-card ion-img {
	width: 100%;
	height: 160px;
	object-fit: cover;
}

.evidence-audio .audio-item {
	align-items: center;
}

.evidence-audio audio {
	width: 100%;
	max-width: 320px;
}

.safe-area-spacer {
	opacity: 0;
	width: 100%;
	min-height: 0;
	margin: 0;
	padding: 0;
}

:global(.has-mobile-navbar) .safe-area-spacer {
	min-height: calc(env(safe-area-inset-bottom, 0) + 4.75rem);
}
@media (max-width: 480px) {
	.incident-content {
		padding: 12px;
		gap: 16px;
	}

	.state-card {
		padding: 24px 16px;
	}

	.image-card ion-img {
		height: 140px;
	}

	.evidence-audio audio {
		width: 140px;
	}
}
</style>

