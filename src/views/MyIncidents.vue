<template>
	<ion-page>
		<ion-header>
			<ion-toolbar>
				<ion-title>Mis incidentes</ion-title>
			</ion-toolbar>
			<ion-toolbar>
				<ion-searchbar
					v-model="searchQuery"
					placeholder="Buscar por titulo"
					show-clear-button="always"
				></ion-searchbar>
			</ion-toolbar>
		</ion-header>

		<ion-content :fullscreen="true" class="ion-padding">
			<section class="incident-list" aria-live="polite">
				<ion-spinner
					v-if="isLoading"
					name="dots"
					class="loading-spinner"
					aria-label="Cargando incidentes"
				/>

				<p v-if="!isLoading && errorMessage" class="error-message" role="status">
					{{ errorMessage }}
				</p>

				<ion-card
					v-for="incident in filteredIncidents"
					:key="incident.id"
					class="incident-card"
					button
					@click="goToIncident(incident.id)"
				>
					<ion-card-header>
						<ion-card-title>{{ incident.title }}</ion-card-title>
					</ion-card-header>
					<ion-card-content>
						<div class="card-row">
							<div class="card-text">
								<p class="description">{{ truncateDescription(incident.description) }}</p>
								<div class="meta-row">
									<ion-icon :icon="calendarOutline" class="meta-icon" aria-hidden="true" />
									<span class="meta-date">{{ formatDate(incident.date) }}</span>
								</div>
							</div>
							<div class="card-actions">
								<ion-chip
									class="status-chip"
									:color="statusToColor(incident.status)"
									fill="outline"
									size="small"
								>
									<ion-label class="status-label">{{ incident.status }}</ion-label>
								</ion-chip>
								<ion-icon :icon="chevronForwardOutline" class="card-icon" aria-hidden="true" />
							</div>
						</div>
					</ion-card-content>
				</ion-card>

				<p
					v-if="!isLoading && !errorMessage && filteredIncidents.length === 0"
					class="empty-message"
				>
					No se encontraron incidentes.
				</p>

                <!-- Pagination Controls -->
                <div v-if="!isLoading && !errorMessage && incidents.length > 0" class="pagination-controls">
                    <ion-button 
                        fill="clear" 
                        :disabled="currentPage === 0" 
                        @click="changePage(currentPage - 1)"
                    >
                        <ion-icon slot="icon-only" :icon="chevronBackOutline" />
                    </ion-button>
                    
                    <span class="page-info">
                        Página {{ currentPage + 1 }} de {{ totalPages }}
                    </span>

                    <ion-button 
                        fill="clear" 
                        :disabled="isLastPage" 
                        @click="changePage(currentPage + 1)"
                    >
                        <ion-icon slot="icon-only" :icon="chevronForwardOutline" />
                    </ion-button>
                </div>

                <div class="safe-area-spacer" aria-hidden="true"></div>
			</section>
			<ion-chip class="safe-area-spacer" aria-hidden="true" disabled>
					Espacio reservado
			</ion-chip>
			<ion-chip class="safe-area-spacer" aria-hidden="true" disabled>
					Espacio reservado
			</ion-chip>
		</ion-content>
	</ion-page>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter, onBeforeRouteLeave } from 'vue-router';
import {
	IonButton,
	IonCard,
	IonCardContent,
	IonCardHeader,
	IonCardTitle,
	IonChip,
	IonContent,
	IonHeader,
	IonIcon,
	IonLabel,
	IonPage,
	IonSearchbar,
	IonSpinner,
	IonTitle,
	IonToolbar,
	onIonViewWillEnter,
	onIonViewWillLeave,
} from '@ionic/vue';
import { calendarOutline, chevronForwardOutline, chevronBackOutline } from 'ionicons/icons';
import { HTTP } from '@awesome-cordova-plugins/http';
import { useSession } from '@/composables/useSession';
import { parseFetchResponse, parseNativeResponse, throwFetchError, isAndroidNativeApp } from '@/utils/httpHelpers';

type IncidentStatus = 'abierto' | 'en revision' | 'cerrado';

interface Incident {
	id: number;
	title: string;
	date: string;
	description: string;
	status: IncidentStatus;
}

interface BackendIncidentResponse {
	id: number | string | null;
	titulo: string | null;
	descripcion: string | null;
	fechaCreacion: string | null;
	estado: string | null;
}

interface PageableResponse<T> {
	content: T[];
	totalPages: number;
	last: boolean;
	number: number;
	size: number;
	totalElements: number;
}

const searchQuery = ref('');
const router = useRouter();
const { authToken } = useSession();
const apiBaseUrl = import.meta.env.VITE_PARK_APP_API_URL;
const incidents = ref<Incident[]>([]);
const isLoading = ref(false);
const errorMessage = ref('');
const currentPage = ref(0);
const totalPages = ref(1);
const isLastPage = ref(false);

const resetIncidentsState = () => {
	incidents.value = [];
	searchQuery.value = '';
	isLoading.value = false;
	errorMessage.value = '';
	currentPage.value = 0;
    totalPages.value = 1;
	isLastPage.value = false;
};

const goToIncident = (incidentId: number) => {
	router.push({
		name: 'IncidentDetail',
		query: { id: String(incidentId) },
	});
};

const normalizedQuery = computed(() => searchQuery.value.trim().toLowerCase());

const filteredIncidents = computed(() => {
	const incidentsList = incidents.value;
	if (!normalizedQuery.value) {
		return incidentsList;
	}

	return incidentsList.filter((incident) =>
		incident.title.toLowerCase().includes(normalizedQuery.value)
	);
});

const statusColorMap: Record<IncidentStatus, string> = {
	abierto: 'success',
	'en revision': 'primary',
	cerrado: 'danger',
};

const statusToColor = (status: IncidentStatus) => statusColorMap[status] ?? 'medium';

const truncateDescription = (description: string, maxWords = 5) => {
	const words = description.trim().split(/\s+/);
	if (words.length <= maxWords) {
		return words.join(' ');
	}
	return `${words.slice(0, maxWords).join(' ')}...`;
};

const formatDate = (dateString: string) => {
	if (!dateString) {
		return '-';
	}

	const date = new Date(dateString);
	if (Number.isNaN(date.getTime())) {
		return '-';
	}

	return date.toLocaleDateString('es-ES', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	});
};

const normalizeStatus = (status: string | null | undefined): IncidentStatus => {
	if (!status) {
		return 'en revision';
	}

	const sanitized = status
		.toUpperCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[-_]/g, ' ')
		.trim();

	switch (sanitized) {
		case 'ABIERTO':
			return 'abierto';
		case 'CERRADO':
			return 'cerrado';
		case 'EN REVISION':
			return 'en revision';
		default:
			return 'en revision';
	}
};

const getSortableTime = (value: string) => {
	const timestamp = new Date(value).getTime();
	return Number.isNaN(timestamp) ? 0 : timestamp;
};

const mapBackendIncident = (incident: BackendIncidentResponse): Incident => {
	const parsedId = Number(incident.id);
	const safeId = Number.isFinite(parsedId) ? parsedId : Date.now();

	return {
		id: safeId,
		title: incident.titulo?.trim() || 'Incidente sin título',
		date: incident.fechaCreacion ?? '',
		description: incident.descripcion?.trim() || 'Sin descripción disponible.',
		status: normalizeStatus(incident.estado),
	};
};

const fetchIncidents = async (page = 0) => {
	if (!authToken.value) {
		return;
	}

	isLoading.value = true;
	errorMessage.value = '';

	try {
        // Construir URL con parámetros de paginación
        const queryParams = new URLSearchParams({
            page: page.toString(),
            size: '10',
        });
		const endpoint = `${apiBaseUrl}api/incidentes/mis-incidentes?${queryParams.toString()}`;
		
		const headers = {
			Accept: 'application/json',
			Authorization: `Bearer ${authToken.value}`,
		};

		let pageData: PageableResponse<BackendIncidentResponse> | null = null;

		if (isAndroidNativeApp()) {
			const response = await HTTP.get(endpoint, {}, headers);
			pageData = parseNativeResponse<PageableResponse<BackendIncidentResponse>>(response.data);
		} else {
			const fetchResponse = await fetch(endpoint, {
				method: 'GET',
				headers,
			});
			if (!fetchResponse.ok) {
				await throwFetchError(fetchResponse);
			}
			pageData = await parseFetchResponse<PageableResponse<BackendIncidentResponse>>(fetchResponse);
		}

		if (pageData && Array.isArray(pageData.content)) {
            const mappedNewIncidents = pageData.content.map(mapBackendIncident);
            incidents.value = mappedNewIncidents;
            
            isLastPage.value = pageData.last;
            currentPage.value = pageData.number;
            totalPages.value = pageData.totalPages;
        } else {
             incidents.value = [];
             isLastPage.value = true;
             totalPages.value = 1;
        }

	} catch (error) {
		console.error('incidents-fetch-error', error);
		const status = (error as { status?: number })?.status;
		if (status === 401) {
			errorMessage.value = 'Tu sesión expiró. Inicia sesión nuevamente.';
		} else {
			errorMessage.value = 'No fue posible cargar tus incidentes. Inténtalo nuevamente más tarde.';
		}
	} finally {
		isLoading.value = false;
	}
};

const changePage = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages.value) {
        fetchIncidents(newPage);
    }
};

watch(
	authToken,
	(token) => {
		if (!token) {
			resetIncidentsState();
			errorMessage.value = 'Inicia sesión para ver tus incidentes.';

			router.push({ name: 'Login' });
			return;

		}

		errorMessage.value = '';
		void fetchIncidents(0);
	},
	{ immediate: true }
);

onIonViewWillEnter(() => {
	if (!authToken.value) {
		return;
	}
    // Recargar la primera página al entrar para refrescar datos
	void fetchIncidents(0);
});

onIonViewWillLeave(() => {
	resetIncidentsState();
});

onBeforeRouteLeave(() => {
	resetIncidentsState();
});
</script>

<style scoped>
.incident-list {
	display: flex;
	flex-direction: column;
	gap: 1rem;
}

.loading-spinner {
	display: block;
	margin: 2rem auto 0;
}

.incident-card {
	cursor: pointer;
}

.card-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 1rem;
}

.card-text {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
}

.description {
	margin: 0;
	color: var(--ion-color-step-600, #5e5e5e);
	line-height: 1.4;
}

.meta-row {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	color: var(--ion-color-step-600, #5e5e5e);
	font-size: 0.9rem;
}

.meta-icon {
	color: var(--ion-color-step-600, #5e5e5e);
	font-size: 1rem;
}

.pagination-controls {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    margin-top: 1rem;
    padding-bottom: 1rem;
}

.page-info {
    color: var(--ion-color-medium);
    font-size: 0.9rem;
}

.meta-date {
	line-height: 1;
}

.card-actions {
	display: flex;
	align-items: center;
	gap: 0.75rem;
}

.status-chip {
	display: inline-flex;
	align-items: center;
	--padding-start: 0.75rem;
	--padding-end: 0.75rem;
}

.status-label {
	text-transform: capitalize;
	font-size: 0.85rem;
	white-space: nowrap;
}

.card-icon {
	font-size: 1.5rem;
	color: var(--ion-color-medium, #92949c);
	display: flex;
	align-items: center;
	justify-content: center;
}

.empty-message {
	text-align: center;
	color: var(--ion-color-medium, #92949c);
	margin-top: 2rem;
}

.error-message {
	text-align: center;
	color: var(--ion-color-danger, #d32f2f);
	margin-top: 1.5rem;
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

</style>
