<template>
	<ion-page>
		<ion-content fullscreen class="incident-detail-content">
			<div v-if="isLoading" class="loading-state">
				<ion-spinner name="lines" aria-label="Cargando incidente" />
				<p>Cargando incidente...</p>
			</div>
			<div v-else-if="loadError" class="error-state">
				<p>{{ loadError }}</p>
				<button type="button" class="btn ghost" @click="reloadIncident">Reintentar</button>
			</div>
			<div v-else-if="incident" class="incident-detail-page">
				<header class="detail-header">
					<div>
						<h1>{{ incidentTitle }}</h1>
						<p class="subtitle">
							Actualiza la información del incidente reportado el {{ formattedReportDate }}.
						</p>
					</div>
					<div class="header-actions">
						<button
							type="button"
							class="btn danger"
							:disabled="isDeletingIncident"
							@click="onEliminar"
						>
							{{ isDeletingIncident ? 'Eliminando...' : 'Eliminar Incidente' }}
						</button>
						<button
							type="button"
							class="btn success"
							:disabled="isSaving"
							@click="onGuardar"
						>
							{{ isSaving ? 'Guardando...' : 'Guardar Cambios' }}
						</button>
					</div>
				</header>

				<section class="card">
					<header class="card-header">
						<h2>Detalles del Incidente</h2>
					</header>
					<form class="incident-form" @submit.prevent>
						<div class="form-row">
							<div class="field-group">
								<label for="route">Ruta</label>
								<div class="pill-row">
									<span class="status-pill status-route">{{ selectedRouteName }}</span>
									<button
										type="button"
										class="icon-btn"
										aria-label="Editar ruta"
										@click="routeModalOpen = true"
									>
										<ion-icon :icon="createOutline" />
									</button>
								</div>
							</div>
							<div class="field-group">
								<label for="date">Fecha de reporte</label>
								<input id="date" v-model="form.date" type="date" readonly />
								<p class="field-hint">Solo lectura</p>
							</div>
						</div>
						<div class="field-group">
							<label for="description">Descripción</label>
							<textarea id="description" v-model="form.description" rows="4" readonly></textarea>
							<p class="field-hint">La descripción se actualiza desde el reporte original.</p>
						</div>
						<div class="form-row">
							<div class="field-group">
								<label for="category">Categoría</label>
								<div class="pill-row">
									<span class="status-pill status-category">{{ selectedCategoryName }}</span>
									<button
										type="button"
										class="icon-btn"
										aria-label="Editar categoría"
										@click="categoryModalOpen = true"
									>
										<ion-icon :icon="createOutline" />
									</button>
								</div>
							</div>
							<div class="field-group">
								<label for="state">Estado</label>
								<div class="pill-row">
									<span class="status-pill status-state">{{ selectedStateLabel }}</span>
									<button
										type="button"
										class="icon-btn"
										aria-label="Editar estado"
										@click="stateModalOpen = true"
									>
										<ion-icon :icon="createOutline" />
									</button>
								</div>
							</div>
						</div>
					</form>
				</section>

				<section class="card">
					<header class="card-header">
						<h2>Galería de Fotos</h2>
					</header>
					<div v-if="incident.photos.length" class="photo-grid">
						<div v-for="photo in incident.photos" :key="photo.id ?? photo.url" class="photo-card">
							<img :src="photo.url" alt="Foto del incidente" />
							<button
								type="button"
								class="icon-btn danger photo-delete"
								:disabled="!photo.id || deletingPhotoId === photo.id"
								@click="deletePhoto(photo.id)"
							>
								<ion-icon :icon="trashOutline" />
							</button>
						</div>
					</div>
					<p v-else class="empty-state">Este incidente no tiene fotos asociadas.</p>
				</section>

				<section class="card">
					<header class="card-header">
						<h2>Archivos de Audio</h2>
					</header>
					<ul v-if="incident.audios.length" class="audio-list">
						<li v-for="audio in incident.audios" :key="audio.id ?? audio.url" class="audio-item">
							<audio :src="audio.url" controls preload="none"></audio>
							<button
								type="button"
								class="icon-btn danger"
								:disabled="!audio.id || deletingAudioId === audio.id"
								@click="deleteAudio(audio.id)"
							>
								<ion-icon :icon="trashOutline" />
							</button>
						</li>
					</ul>
					<p v-else class="empty-state">No hay registros de audio para este incidente.</p>
				</section>
			</div>

			<div v-else class="empty-state standalone">Selecciona un incidente para ver los detalles.</div>

			<ion-modal
				:is-open="categoryModalOpen"
				@didDismiss="categoryModalOpen = false"
				:css-class="['selection-modal']"
			>
				<ion-header>
					<ion-toolbar>
						<ion-title>Selecciona una categoría</ion-title>
					</ion-toolbar>
				</ion-header>
				<ion-content class="selection-modal-content">
					<ion-list v-if="categories.length">
						<ion-item
							v-for="category in categories"
							:key="category.id"
							button
							:detail="false"
							:class="{ 'option-active': Number(form.categoryId) === category.id }"
							@click="selectCategory(category)"
						>
							<ion-label>{{ category.nombre }}</ion-label>
						</ion-item>
					</ion-list>
					<p v-else class="modal-empty">No hay categorías disponibles.</p>
				</ion-content>
			</ion-modal>

			<ion-modal
				:is-open="stateModalOpen"
				@didDismiss="stateModalOpen = false"
				:css-class="['selection-modal']"
			>
				<ion-header>
					<ion-toolbar>
						<ion-title>Selecciona un estado</ion-title>
					</ion-toolbar>
				</ion-header>
				<ion-content class="selection-modal-content">
					<ion-list v-if="states.length">
						<ion-item
							v-for="state in states"
							:key="state"
							button
							:detail="false"
							:class="{ 'option-active': form.state === state }"
							@click="selectState(state)"
						>
							<ion-label>{{ formatStateLabel(state) }}</ion-label>
						</ion-item>
					</ion-list>
					<p v-else class="modal-empty">No hay estados disponibles.</p>
				</ion-content>
			</ion-modal>

			<ion-modal
				:is-open="routeModalOpen"
				@didDismiss="routeModalOpen = false"
				:css-class="['selection-modal']"
			>
				<ion-header>
					<ion-toolbar>
						<ion-title>Selecciona una ruta</ion-title>
					</ion-toolbar>
				</ion-header>
				<ion-content class="selection-modal-content">
					<ion-list v-if="routes.length">
						<ion-item
							v-for="route in routes"
							:key="route.id"
							button
							:detail="false"
							:class="{ 'option-active': Number(form.routeId) === route.id }"
							@click="selectRoute(route)"
						>
							<ion-label>{{ route.nombre }}</ion-label>
						</ion-item>
					</ion-list>
					<p v-else class="modal-empty">No hay rutas disponibles.</p>
				</ion-content>
			</ion-modal>
		</ion-content>
	</ion-page>
</template>

type IncidentAudio = {
<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import {
	IonContent,
	IonHeader,
	IonIcon,
	IonItem,
	IonLabel,
	IonList,
	IonModal,
	IonPage,
	IonSpinner,
	IonTitle,
	IonToolbar,
	onIonViewWillEnter,
} from '@ionic/vue';
import { createOutline, trashOutline } from 'ionicons/icons';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { useSession } from '@/composables/useSession';

type EstadoIncidente = 'ABIERTO' | 'EN_REVISION' | 'CERRADO' | string;

type BackendMedia =
	| string
	| {
		id?: number;
		fotoId?: number;
		audioId?: number;
		url?: string;
		ruta?: string;
		rutaArchivo?: string;
		archivoUrl?: string;
		path?: string;
		descripcion?: string;
		descripcionFoto?: string;
		descripcionAudio?: string;
	};

type IncidentPhoto = {
	id: number | null;
	url: string;
	description?: string;
};

type IncidentAudio = {
	id: number | null;
	url: string;
	description?: string;
};

type IncidentDetail = {
	id: number;
	title: string;
	description: string;
	date: string;
	state: EstadoIncidente;
	categoryId: number | null;
	categoryName: string;
	routeId: number | null;
	routeName: string;
	photos: IncidentPhoto[];
	audios: IncidentAudio[];
};

type CategoryDTO = { id: number; nombre: string };
type RouteDTO = { id: number; nombre: string };

const router = useRouter();
const currentRoute = useRoute();
const { authToken } = useSession();

const apiBaseEnv = import.meta.env.VITE_PARK_APP_API_URL ?? '';
const apiBaseUrl = apiBaseEnv ? apiBaseEnv.replace(/\/$/, '') : '';

const incident = ref<IncidentDetail | null>(null);
const isLoading = ref(false);
const loadError = ref<string | null>(null);
const isSaving = ref(false);
const isDeletingIncident = ref(false);
const deletingPhotoId = ref<number | null>(null);
const deletingAudioId = ref<number | null>(null);

const defaultStates: EstadoIncidente[] = ['ABIERTO', 'EN_REVISION', 'CERRADO'];
const states = ref<EstadoIncidente[]>([...defaultStates]);
const categories = ref<CategoryDTO[]>([]);
const routes = ref<RouteDTO[]>([]);
const referenceDataLoaded = ref(false);

const form = reactive({
	routeId: '',
	categoryId: '',
	state: '',
	date: '',
	description: '',
});

const categoryModalOpen = ref(false);
const stateModalOpen = ref(false);
const routeModalOpen = ref(false);

const incidentId = computed(() => {
	const queryId = currentRoute.query.id ?? currentRoute.params.id;
	const raw = Array.isArray(queryId) ? queryId[0] : queryId;
	const parsed = Number(raw);
	return Number.isFinite(parsed) ? parsed : null;
});

const buildAuthHeaders = () => {
	const token = authToken.value;
	return {
		Accept: 'application/json',
		...(token ? { Authorization: `Bearer ${token}` } : {}),
	};
};

const extractErrorMessage = (error: unknown) => {
	if (axios.isAxiosError(error)) {
		const status = error.response?.status;
		if (status === 401) {
			return 'Tu sesión expiró. Inicia sesión nuevamente.';
		}
		return (
			(error.response?.data as { message?: string } | undefined)?.message ??
			'No fue posible completar la acción solicitada.'
		);
	}
	return 'No fue posible completar la acción solicitada.';
};

const normalizeDateInput = (value: string) => {
	if (!value) {
		return '';
	}
	if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
		return value;
	}
	const parsed = new Date(value);
	return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10);
};

const formatHumanDate = (value: string) => {
	if (!value) {
		return '-';
	}
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) {
		return '-';
	}
	return parsed.toLocaleDateString('es-CL', {
		day: '2-digit',
		month: 'long',
		year: 'numeric',
	});
};

const resolveMediaUrl = (media: BackendMedia) => {
	if (!media) {
		return '';
	}
	if (typeof media === 'string') {
		return media;
	}
	return media.url ?? media.archivoUrl ?? media.rutaArchivo ?? media.ruta ?? media.path ?? '';
};

const resolveMediaId = (media: BackendMedia) => {
	if (!media || typeof media === 'string') {
		return null;
	}
	const candidate = media.id ?? media.fotoId ?? media.audioId;
	return typeof candidate === 'number' ? candidate : null;
};

const toMediaArray = (input: unknown): BackendMedia[] => (Array.isArray(input) ? (input as BackendMedia[]) : []);

const mapIncidentDetail = (data: any): IncidentDetail => {
	const photosPayload = toMediaArray(data?.fotos ?? data?.fotografias ?? data?.imagenes);
	const audioPayload = toMediaArray(data?.audios ?? data?.archivosAudio ?? data?.audio);
	return {
		id: Number(data?.id ?? 0),
		title: data?.titulo ?? 'Incidente sin título',
		description: data?.descripcion ?? '',
		date: data?.fechaReporte ?? data?.fecha ?? '',
		state: data?.estado ?? 'EN_REVISION',
		categoryId: typeof data?.categoriaId === 'number' ? data.categoriaId : null,
		categoryName: data?.categoriaNombre ?? 'Sin categoría',
		routeId: typeof data?.rutaId === 'number' ? data.rutaId : null,
		routeName: data?.rutaNombre ?? 'Sin ruta',
		photos: photosPayload
			.map((photo) => ({
				id: resolveMediaId(photo),
				url: resolveMediaUrl(photo),
				description: typeof photo === 'string' ? undefined : photo?.descripcion ?? photo?.descripcionFoto,
			}))
			.filter((photo) => photo.url),
		audios: audioPayload
			.map((audio) => ({
				id: resolveMediaId(audio),
				url: resolveMediaUrl(audio),
				description: typeof audio === 'string' ? undefined : audio?.descripcion ?? audio?.descripcionAudio,
			}))
			.filter((audio) => audio.url),
	};
};

const populateForm = (detail: IncidentDetail) => {
	form.routeId = detail.routeId ? String(detail.routeId) : '';
	form.categoryId = detail.categoryId ? String(detail.categoryId) : '';
	form.state = detail.state ?? 'EN_REVISION';
	form.date = normalizeDateInput(detail.date);
	form.description = detail.description ?? '';
};

const formatStateLabel = (state: EstadoIncidente | null | undefined) => {
	if (!state) {
		return 'Sin estado';
	}
	const normalized = state.toUpperCase();
	switch (normalized) {
		case 'ABIERTO':
			return 'Abierto';
		case 'EN_REVISION':
			return 'En Revisión';
		case 'CERRADO':
			return 'Cerrado';
		default:
			return normalized
				.replace(/_/g, ' ')
				.toLowerCase()
				.replace(/(^|\s)\w/g, (match) => match.toUpperCase());
	}
};

const incidentTitle = computed(() => {
	if (!incident.value) {
		return 'Detalles del incidente';
	}
	return `Incidente #${incident.value.id} - ${incident.value.title}`;
});

const formattedReportDate = computed(() => formatHumanDate(incident.value?.date ?? ''));

const selectedCategoryName = computed(() => {
	if (!form.categoryId) {
		return incident.value?.categoryName ?? 'Sin categoría';
	}
	const categoryId = Number(form.categoryId);
	return (
		categories.value.find((category) => category.id === categoryId)?.nombre ??
		incident.value?.categoryName ??
		'Categoría sin asignar'
	);
});

const selectedRouteName = computed(() => {
	if (!form.routeId) {
		return incident.value?.routeName ?? 'Sin ruta asignada';
	}
	const routeId = Number(form.routeId);
	return (
		routes.value.find((route) => route.id === routeId)?.nombre ??
		incident.value?.routeName ??
		'Ruta sin asignar'
	);
});

const selectedStateLabel = computed(() =>
	formatStateLabel(form.state || incident.value?.state || 'EN_REVISION')
);

const fetchRoutes = async () => {
	if (!apiBaseUrl || !authToken.value) {
		routes.value = [];
		return;
	}
	try {
		const endpoint = `${apiBaseUrl}/api/admin/incidentes/rutas`;
		const { data } = await axios.get<RouteDTO[]>(endpoint, { headers: buildAuthHeaders() });
		routes.value = Array.isArray(data) ? data : [];
	} catch (error) {
		console.error('admin-routes-fetch-error', error);
		routes.value = [];
	}
};

const fetchCategories = async () => {
	if (!apiBaseUrl || !authToken.value) {
		categories.value = [];
		return;
	}
	try {
		const endpoint = `${apiBaseUrl}/api/admin/incidentes/categorias`;
		const { data } = await axios.get<CategoryDTO[]>(endpoint, { headers: buildAuthHeaders() });
		categories.value = Array.isArray(data) ? data : [];
	} catch (error) {
		console.error('admin-categories-fetch-error', error);
		categories.value = [];
	}
};

const fetchStates = async () => {
	if (!apiBaseUrl || !authToken.value) {
		if (!states.value.length) {
			states.value = [...defaultStates];
		}
		return;
	}
	try {
		const endpoint = `${apiBaseUrl}/api/admin/incidentes/estados`;
		const { data } = await axios.get<EstadoIncidente[]>(endpoint, { headers: buildAuthHeaders() });
		states.value = Array.isArray(data) && data.length ? data : [...defaultStates];
	} catch (error) {
		console.error('admin-states-fetch-error', error);
		if (!states.value.length) {
			states.value = [...defaultStates];
		}
	}
};

const fetchReferenceData = async () => {
	if (referenceDataLoaded.value || !authToken.value || !apiBaseUrl) {
		return;
	}
	await Promise.all([fetchRoutes(), fetchCategories(), fetchStates()]);
	referenceDataLoaded.value = true;
};

const fetchIncidentDetail = async () => {
	if (!apiBaseUrl) {
		loadError.value = 'No hay configuración de API disponible.';
		return;
	}
	if (!authToken.value) {
		loadError.value = 'Debes iniciar sesión para ver el detalle del incidente.';
		return;
	}
	if (!incidentId.value) {
		loadError.value = 'No se proporcionó un ID de incidente válido.';
		return;
	}
	isLoading.value = true;
	loadError.value = null;
	try {
		const endpoint = `${apiBaseUrl}/api/admin/incidentes/${incidentId.value}`;
		const { data } = await axios.get(endpoint, { headers: buildAuthHeaders() });
		const mapped = mapIncidentDetail(data);
		incident.value = mapped;
		populateForm(mapped);
	} catch (error) {
		console.error('admin-incident-detail-fetch-error', error);
		loadError.value = extractErrorMessage(error);
		incident.value = null;
	} finally {
		isLoading.value = false;
	}
};

const loadIncidentData = async () => {
	if (!incidentId.value) {
		loadError.value = 'No se proporcionó un ID de incidente válido.';
		return;
	}
	await fetchReferenceData();
	await fetchIncidentDetail();
};

const reloadIncident = () => {
	if (!isLoading.value) {
		void loadIncidentData();
	}
};

watch(
	[authToken, () => incidentId.value],
	([token, id]) => {
		if (!token) {
			incident.value = null;
			loadError.value = 'Debes iniciar sesión para ver el detalle del incidente.';
			referenceDataLoaded.value = false;
			return;
		}
		if (!id) {
			loadError.value = 'No se proporcionó un ID de incidente válido.';
			incident.value = null;
			return;
		}
		loadError.value = null;
		void loadIncidentData();
	},
	{ immediate: true }
);

onIonViewWillEnter(() => {
	if (authToken.value && incidentId.value) {
		void loadIncidentData();
	}
});

const selectCategory = (category: CategoryDTO) => {
	form.categoryId = String(category.id);
	categoryModalOpen.value = false;
};

const selectState = (state: EstadoIncidente) => {
	form.state = state;
	stateModalOpen.value = false;
};

const selectRoute = (route: RouteDTO) => {
	form.routeId = String(route.id);
	routeModalOpen.value = false;
};

const updateState = async (state: EstadoIncidente) => {
	if (!incidentId.value) {
		return;
	}
	const endpoint = `${apiBaseUrl}/api/admin/incidentes/${incidentId.value}/estado`;
	await axios.put(endpoint, { estado: state }, { headers: buildAuthHeaders() });
};

const updateCategory = async (categoryId: number) => {
	if (!incidentId.value) {
		return;
	}
	const endpoint = `${apiBaseUrl}/api/admin/incidentes/${incidentId.value}/categoria`;
	await axios.put(endpoint, { categoriaId: categoryId }, { headers: buildAuthHeaders() });
};

const updateRoute = async (routeId: number) => {
	if (!incidentId.value) {
		return;
	}
	const endpoint = `${apiBaseUrl}/api/admin/incidentes/${incidentId.value}/ruta`;
	await axios.put(endpoint, { rutaId: routeId }, { headers: buildAuthHeaders() });
};

const onGuardar = async () => {
	if (!incident.value || isSaving.value) {
		return;
	}
	const updates: Array<() => Promise<void>> = [];
	const nextState = form.state || incident.value.state;
	if (nextState && nextState !== incident.value.state) {
		updates.push(() => updateState(nextState));
	}
	const nextCategoryId = Number(form.categoryId);
	if (Number.isFinite(nextCategoryId) && nextCategoryId !== incident.value.categoryId) {
		updates.push(() => updateCategory(nextCategoryId));
	}
	const nextRouteId = Number(form.routeId);
	if (Number.isFinite(nextRouteId) && nextRouteId !== incident.value.routeId) {
		updates.push(() => updateRoute(nextRouteId));
	}
	if (!updates.length) {
		window.alert('No hay cambios pendientes por guardar.');
		return;
	}
	isSaving.value = true;
	try {
		for (const action of updates) {
			await action();
		}
		await fetchIncidentDetail();
		window.alert('Cambios guardados correctamente.');
	} catch (error) {
		console.error('admin-incident-update-error', error);
		window.alert(extractErrorMessage(error));
	} finally {
		isSaving.value = false;
	}
};

const onEliminar = async () => {
	if (!incident.value || isDeletingIncident.value) {
		return;
	}
	const confirmed = window.confirm('¿Estás seguro de eliminar este incidente? Esta acción es irreversible.');
	if (!confirmed) {
		return;
	}
	isDeletingIncident.value = true;
	try {
		const endpoint = `${apiBaseUrl}/api/admin/incidentes/${incident.value.id}`;
		await axios.delete(endpoint, { headers: buildAuthHeaders() });
		window.alert('Incidente eliminado correctamente.');
		if (router.hasRoute && router.hasRoute('AdminIncidentManagment')) {
			router.replace({ name: 'AdminIncidentManagment' });
		} else {
			router.replace('/');
		}
	} catch (error) {
		console.error('admin-incident-delete-error', error);
		window.alert(extractErrorMessage(error));
	} finally {
		isDeletingIncident.value = false;
	}
};

const deletePhoto = async (photoId: number | null) => {
	if (!photoId || deletingPhotoId.value === photoId) {
		return;
	}
	deletingPhotoId.value = photoId;
	try {
		const endpoint = `${apiBaseUrl}/api/admin/incidentes/fotos/${photoId}`;
		await axios.delete(endpoint, { headers: buildAuthHeaders() });
		if (incident.value) {
			incident.value.photos = incident.value.photos.filter((photo) => photo.id !== photoId);
		}
	} catch (error) {
		console.error('admin-photo-delete-error', error);
		window.alert(extractErrorMessage(error));
	} finally {
		deletingPhotoId.value = null;
	}
};

const deleteAudio = async (audioId: number | null) => {
	if (!audioId || deletingAudioId.value === audioId) {
		return;
	}
	deletingAudioId.value = audioId;
	try {
		const endpoint = `${apiBaseUrl}/api/admin/incidentes/audios/${audioId}`;
		await axios.delete(endpoint, { headers: buildAuthHeaders() });
		if (incident.value) {
			incident.value.audios = incident.value.audios.filter((audio) => audio.id !== audioId);
		}
	} catch (error) {
		console.error('admin-audio-delete-error', error);
		window.alert(extractErrorMessage(error));
	} finally {
		deletingAudioId.value = null;
	}
};
</script>

<style scoped>
.incident-detail-content {
	--background: linear-gradient(180deg, rgba(241, 245, 249, 0.9) 0%, rgba(248, 250, 252, 1) 100%);
}

.incident-detail-page {
	padding: 32px;
	display: flex;
	flex-direction: column;
	gap: 24px;
}

.loading-state,
.error-state {
	min-height: calc(100vh - 120px);
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	gap: 16px;
	text-align: center;
	color: #0f172a;
}

.loading-state ion-spinner {
	width: 54px;
	height: 54px;
}

.error-state {
	color: #dc2626;
}

.standalone {
	padding: 48px;
}

.detail-header {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 24px;
}

.detail-header h1 {
	margin: 0;
	font-size: 2rem;
	font-weight: 700;
	color: #111827;
}

.subtitle {
	margin: 6px 0 0;
	color: #64748b;
	font-size: 0.95rem;
}

.header-actions {
	display: flex;
	gap: 12px;
	flex-wrap: wrap;
}

.btn {
	border: none;
	border-radius: 12px;
	font-weight: 600;
	padding: 12px 20px;
	font-size: 0.95rem;
	cursor: pointer;
	transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.btn:disabled {
	opacity: 0.65;
	cursor: not-allowed;
	box-shadow: none;
}

.btn.danger {
	background: rgba(248, 113, 113, 0.12);
	color: #dc2626;
	box-shadow: 0 8px 16px rgba(220, 38, 38, 0.18);
}

.btn.danger:hover {
	transform: translateY(-1px);
	box-shadow: 0 12px 24px rgba(220, 38, 38, 0.22);
}

.btn.success {
	background: #22c55e;
	color: #ffffff;
	box-shadow: 0 8px 16px rgba(34, 197, 94, 0.22);
}

.btn.success:hover {
	transform: translateY(-1px);
	box-shadow: 0 12px 24px rgba(34, 197, 94, 0.3);
}

.btn.ghost {
	background: transparent;
	border: 1px solid rgba(15, 23, 42, 0.2);
	color: #0f172a;
}

.btn.ghost:hover {
	background: rgba(15, 23, 42, 0.08);
}

.card {
	background: #ffffff;
	border-radius: 20px;
	box-shadow: 0 18px 48px rgba(15, 23, 42, 0.08);
	border: 1px solid rgba(148, 163, 184, 0.18);
	padding: 24px;
	display: flex;
	flex-direction: column;
	gap: 20px;
}

.card-header h2 {
	margin: 0;
	font-size: 1.2rem;
	color: #1e293b;
	font-weight: 600;
}

.incident-form {
	display: flex;
	flex-direction: column;
	gap: 20px;
}

.form-row {
	display: flex;
	gap: 20px;
	flex-wrap: wrap;
}

.field-group {
	display: flex;
	flex-direction: column;
	flex: 1 1 260px;
	gap: 8px;
}

.field-group label {
	font-weight: 600;
	font-size: 0.85rem;
	color: #475569;
}

.field-group input,
.field-group textarea {
	border: 1px solid rgba(148, 163, 184, 0.6);
	border-radius: 14px;
	padding: 12px 16px;
	font-size: 0.95rem;
	color: #111827;
	background: #f8fafc;
}

.field-group textarea[readonly],
.field-group input[readonly] {
	background: #eef2ff;
	cursor: not-allowed;
}

.field-group textarea {
	resize: vertical;
	min-height: 120px;
}

.field-hint {
	margin: 4px 0 0;
	font-size: 0.75rem;
	color: #94a3b8;
}

.pill-row {
	display: flex;
	align-items: center;
	gap: 12px;
}

.status-pill {
	display: inline-flex;
	align-items: center;
	padding: 6px 14px;
	border-radius: 999px;
	font-weight: 600;
	font-size: 0.8rem;
}

.status-category {
	background: rgba(52, 211, 153, 0.16);
	color: #047857;
}

.status-state {
	background: rgba(248, 113, 113, 0.16);
	color: #b91c1c;
}

.status-route {
	background: rgba(96, 165, 250, 0.18);
	color: #1d4ed8;
}

.icon-btn {
	border: none;
	background: transparent;
	padding: 6px;
	border-radius: 10px;
	color: #475569;
	cursor: pointer;
	transition: background-color 0.2s ease, color 0.2s ease;
}

.icon-btn:hover {
	background: rgba(148, 163, 184, 0.16);
	color: #2563eb;
}

.icon-btn:disabled {
	opacity: 0.5;
	cursor: not-allowed;
	background: transparent;
}

.icon-btn.danger {
	color: #dc2626;
}

.icon-btn.danger:hover {
	background: rgba(248, 113, 113, 0.16);
}

.photo-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
	gap: 16px;
}

.photo-card {
	position: relative;
	border-radius: 16px;
	overflow: hidden;
	box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12);
	transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.photo-card:hover {
	transform: translateY(-2px);
	box-shadow: 0 20px 44px rgba(15, 23, 42, 0.16);
}

.photo-card img {
	width: 100%;
	height: 140px;
	object-fit: cover;
}

.photo-delete {
	position: absolute;
	top: 8px;
	right: 8px;
	background: rgba(255, 255, 255, 0.9);
	box-shadow: 0 8px 16px rgba(15, 23, 42, 0.15);
}

.audio-list {
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
	gap: 14px;
}

.audio-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	background: rgba(248, 250, 252, 0.88);
	border-radius: 16px;
	padding: 14px 16px;
	box-shadow: inset 0 1px 0 rgba(148, 163, 184, 0.18);
}

.audio-item audio {
	flex: 1 1 auto;
	max-width: 360px;
	min-width: 200px;
}

.modal-empty {
	text-align: center;
	color: #475569;
	padding: 16px 12px;
}

@media (max-width: 900px) {
	.incident-detail-page {
		padding: 24px;
	}

	.detail-header {
		flex-direction: column;
		align-items: stretch;
	}

	.header-actions {
		justify-content: flex-start;
	}
}

@media (max-width: 600px) {
	.incident-detail-page {
		padding: 20px 16px;
	}

	.card {
		padding: 20px;
	}

	.btn {
		width: 100%;
	}

	.header-actions {
		flex-direction: column;
	}
}
</style>

<style>
.selection-modal {
	--width: min(420px, 92vw);
	--max-height: 420px;
	--border-radius: 22px;
	--box-shadow: 0 24px 60px rgba(15, 23, 42, 0.18);
	--backdrop-opacity: 0.45;
}

.selection-modal::part(content) {
	background: linear-gradient(180deg, #bbf7d0 0%, #ffffff 100%);
	border: 1px solid rgba(134, 239, 172, 0.24);
}

.selection-modal ion-toolbar {
	--background: linear-gradient(135deg, rgba(34, 197, 94, 0.24), rgba(22, 163, 74, 0.24));
	--color: #065f46;
	--border-width: 0;
	border-bottom: 1px solid rgba(134, 239, 172, 0.26);
}

.selection-modal ion-title {
	font-weight: 700;
	font-size: 1rem;
	letter-spacing: 0.01em;
}

.selection-modal .selection-modal-content {
	--background: transparent;
	padding: 18px 20px 12px;
}

.selection-modal ion-list {
	background: transparent;
	display: flex;
	flex-direction: column;
	gap: 12px;
	padding: 0;
	margin-top: 12px;
	margin-bottom: 0;
}

.selection-modal ion-item {
	--padding-start: 18px;
	--inner-padding-end: 18px;
	--min-height: 58px;
	--background: rgba(255, 255, 255, 0.94);
	--border-radius: 16px;
	--border-color: rgba(134, 239, 172, 0.32);
	--border-style: solid;
	--border-width: 1px;
	--detail-icon-opacity: 0;
	color: #065f46;
	font-weight: 600;
	box-shadow: 0 12px 26px rgba(52, 211, 153, 0.12);
	transition: transform 0.16s ease, box-shadow 0.16s ease, background-color 0.16s ease;
}

.selection-modal ion-item:hover {
	transform: translateY(-1px);
	box-shadow: 0 16px 34px rgba(34, 197, 94, 0.2);
	--background: rgba(187, 247, 208, 0.45);
}

.selection-modal ion-item.option-active {
	--background: rgba(34, 197, 94, 0.3);
	--border-color: rgba(52, 211, 153, 0.48);
	box-shadow: 0 18px 36px rgba(34, 197, 94, 0.22);
	color: #065f46;
}

.selection-modal ion-item.option-active ion-label {
	font-weight: 700;
}

.selection-modal ion-label {
	color: inherit;
}
</style>
