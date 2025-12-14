<template>
	<ion-page>
		<ion-header >
			<ion-toolbar>
				<ion-buttons slot="start">
					<ion-back-button default-href="/admin/home" text="Atrás"></ion-back-button>
				</ion-buttons>
				<ion-title>Detalle del Incidente</ion-title>
			</ion-toolbar>
		</ion-header>
		<ion-content fullscreen class="incident-detail-content">
			<div v-if="isLoading" class="loading-state">
				<ion-spinner name="lines" aria-label="Cargando incidente" />
				<p>Cargando incidente...</p>
			</div>
			<div v-else-if="loadError" class="error-state">
				<p>{{ loadError }}</p>
				<button type="button" class="btn ghost" @click="reloadIncident">Reintentar</button>
			</div>
			<div v-else-if="incident" class="incident-detail-aspage">
				<header class="detail-header" style="margin-left: 24px; margin-top:24px; margin-right:24px">
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

				<section class="card" style="margin-left:12px; max-width:98%">
					<header class="card-header">
						<h2>Detalles del Incidente</h2>
					</header>
					<form class="incident-form" @submit.prevent>
						<div class="content-row">
							<div class="left-column">
								<div class="field-group date-field-group">
									<label for="date">Fecha de reporte</label>
									<input id="date" v-model="form.date" type="date" readonly />
									<p class="field-hint">Solo lectura</p>
								</div>
								<div class="field-group map-group" v-if="incident?.latitude && incident?.longitude">
									<label>Ubicación</label>
									<div id="mini-map" class="mini-map"></div>
								</div>
							</div>
							<div class="status-column">
								<div class="field-group">
									<label for="route">Zona</label>
									<div class="pill-row">
										<span
											class="status-pill clickable-pill"
											:class="{ 'status-route': !hasRouteColor }"
											:style="selectedRouteColorStyle"
											@click="openPopover('route', $event)"
										>
											{{ selectedRouteName }}
											<ion-icon :icon="chevronDownOutline" class="dropdown-icon" />
										</span>
									</div>
								</div>
								<div class="field-group">
									<label for="category">Categoría</label>
									<div class="pill-row">
										<span
											class="status-pill status-category clickable-pill"
											@click="openPopover('category', $event)"
										>
											{{ selectedCategoryName }}
											<ion-icon :icon="chevronDownOutline" class="dropdown-icon" />
										</span>
									</div>
								</div>
								<div class="field-group">
									<label for="state">Estado</label>
									<div class="pill-row">
										<span
											class="status-pill clickable-pill"
											:class="stateClass"
											@click="openPopover('state', $event)"
										>
											{{ selectedStateLabel }}
											<ion-icon :icon="chevronDownOutline" class="dropdown-icon" />
										</span>
									</div>
								</div>
								<div class="field-group description-field">
									<label for="description">Descripción</label>
									<textarea id="description" v-model="form.description" rows="4" readonly></textarea>
								</div>
							</div>
						</div>
					</form>
				</section>

				<div class="media-row">
					<section class="card media-section" style="margin-left:12px" max-width="43%">
						<header class="card-header">
							<h2>Galería de Fotos</h2>
						</header>
						<div v-if="incident.photos.length" class="photo-grid">
							<div v-for="photo in incident.photos" :key="photo.id ?? photo.url" class="photo-card" @click="openImageModal(photo.url)">
								<img :src="photo.url" alt="Foto del incidente" />
								<button
									type="button"
									class="icon-btn danger photo-delete"
									@click.stop="deletePhoto(photo.id)"
								>
									<ion-icon :icon="trashOutline" />
								</button>
							</div>
						</div>
						<p v-else class="empty-state">Este incidente no tiene fotos asociadas.</p>
					</section>

					<section class="card media-section" style="margin-right:24px" max-width="43%">
						<header class="card-header">
							<h2>Archivos de Audio</h2>
						</header>
						<ul v-if="incident.audios.length" class="audio-list">
							<li v-for="audio in incident.audios" :key="audio.id ?? audio.url" class="audio-item">
								<audio :src="audio.url" controls preload="none"></audio>
								<button
									type="button"
									class="icon-btn danger"
									@click="deleteAudio(audio.id)"
								>
									<ion-icon :icon="trashOutline" />
								</button>
							</li>
						</ul>
						<p v-else class="empty-state">No hay registros de audio para este incidente.</p>
					</section>
				</div>
			</div>

			<div v-else class="empty-state standalone">Selecciona un incidente para ver los detalles.</div>

			<ion-popover
				:is-open="popoverState.category.show"
				:event="popoverState.category.event"
				@didDismiss="popoverState.category.show = false"
				class="selection-popover"
				:show-backdrop="false"
			>
				<ion-content class="selection-popover-content">
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
					<p v-else class="popover-empty">No hay categorías disponibles.</p>
				</ion-content>
			</ion-popover>

			<ion-popover
				:is-open="popoverState.state.show"
				:event="popoverState.state.event"
				@didDismiss="popoverState.state.show = false"
				class="selection-popover"
				:show-backdrop="false"
			>
				<ion-content class="selection-popover-content">
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
					<p v-else class="popover-empty">No hay estados disponibles.</p>
				</ion-content>
			</ion-popover>

			<ion-popover
				:is-open="popoverState.route.show"
				:event="popoverState.route.event"
				@didDismiss="popoverState.route.show = false"
				class="selection-popover"
				:show-backdrop="false"
			>
				<ion-content class="selection-popover-content">
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
					<p v-else class="popover-empty">No hay zonas disponibles.</p>
				</ion-content>
			</ion-popover>
			<ion-modal
				:is-open="isImageModalOpen"
				@didDismiss="closeImageModal"
				class="image-modal"
			>
				<ion-header>
					<ion-toolbar>
						<ion-buttons slot="end">
							<ion-button @click="closeImageModal">Cerrar</ion-button>
						</ion-buttons>
					</ion-toolbar>
				</ion-header>
				<ion-content class="image-modal-content">
					<div class="full-image-container">
						<ion-img :src="selectedImage" v-if="selectedImage" />
					</div>
				</ion-content>
			</ion-modal>
		</ion-content>
	</ion-page>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch, onBeforeUnmount, shallowRef } from 'vue';
import {
	IonContent,
	IonHeader,
	IonBackButton,
	IonIcon,
	IonImg,
	IonItem,
	IonLabel,
	IonList,
	IonModal,
	IonPopover,
	IonButtons,
	IonButton,
	IonPage,
	IonSpinner,
	IonTitle,
	IonToolbar,
	alertController,
	toastController,
	popoverController,
	onIonViewWillEnter,
} from '@ionic/vue';
import { createOutline, trashOutline, chevronDownOutline } from 'ionicons/icons';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { useSession } from '@/composables/useSession';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { FeatureCollection } from 'geojson';

const ZONE_COLORS = [
	'#3b82f6', // blue-500
	'#ef4444', // red-500
	'#10b981', // emerald-500
	'#f59e0b', // amber-500
	'#8b5cf6', // violet-500
	'#ec4899', // pink-500
	'#06b6d4', // cyan-500
	'#84cc16', // lime-500
];

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

type Coordinate = {
	latitud: number;
	longitud: number;
};

type RouteZone = {
	id: number;
	nombre: string;
	coordenadas: Coordinate[];
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
	latitude?: number;
	longitude?: number;
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
const deletedPhotoIds = ref<number[]>([]);
const deletedAudioIds = ref<number[]>([]);
const isImageModalOpen = ref(false);
const selectedImage = ref<string | null>(null);
const map = shallowRef<maplibregl.Map | null>(null);
const zones = ref<RouteZone[]>([]);

const openImageModal = (image: string) => {
	selectedImage.value = image;
	isImageModalOpen.value = true;
};

const closeImageModal = () => {
	isImageModalOpen.value = false;
	selectedImage.value = null;
};

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

const popoverState = reactive({
	category: { show: false, event: null as Event | null },
	state: { show: false, event: null as Event | null },
	route: { show: false, event: null as Event | null },
});

const openPopover = (type: keyof typeof popoverState, event: Event) => {
	popoverState[type].event = event;
	popoverState[type].show = true;
};



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

const showToast = async (message: string, color: 'success' | 'danger' | 'warning' = 'success') => {
	const toast = await toastController.create({
		message,
		duration: 3000,
		color,
		position: 'bottom',
		buttons: [
			{
				text: 'OK',
				role: 'cancel',
			},
		],
	});
	await toast.present();
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
		routeId: data?.rutaId ? Number(data.rutaId) : null,
		routeName: data?.rutaNombre ?? '',
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
		return incident.value?.routeName ?? '';
	}
	const routeId = Number(form.routeId);
	return (
		routes.value.find((route) => route.id === routeId)?.nombre ??
		incident.value?.routeName ??
		''
	);
});

const selectedRouteColorStyle = computed(() => {
	if (!form.routeId || !zones.value.length) {
		return {};
	}
	const routeId = Number(form.routeId);
	const index = zones.value.findIndex((z) => z.id === routeId);
	if (index === -1) {
		return {};
	}
	const color = ZONE_COLORS[index % ZONE_COLORS.length];
	return {
		backgroundColor: `${color}29 !important`, // ~16% opacity
		color: `${color} !important`,
	};
});

const hasRouteColor = computed(() => {
	if (!form.routeId || !zones.value.length) return false;
	const routeId = Number(form.routeId);
	return zones.value.some((z) => z.id === routeId);
});

const selectedStateLabel = computed(() =>
	formatStateLabel(form.state || incident.value?.state || 'EN_REVISION')
);

const stateClass = computed(() => {
	const s = form.state || incident.value?.state || 'EN_REVISION';
	switch (s) {
		case 'ABIERTO': return 'status-abierto';
		case 'EN_REVISION': return 'status-en-revision';
		case 'CERRADO': return 'status-cerrado';
		default: return 'status-state';
	}
});

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
	if (!incident.value) {
		isLoading.value = true;
	}
	loadError.value = null;
	try {
		const endpoint = `${apiBaseUrl}/api/admin/incidentes/${incidentId.value}`;
		const { data } = await axios.get(endpoint, { headers: buildAuthHeaders() });
		const mapped = mapIncidentDetail(data);
		console.log(data);
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
	// Fetch zones in parallel or sequence, doesn't block main detail but needed for map
	await fetchZones();
	if (incidentId.value) {
		await fetchIncidentLocation(incidentId.value);
	}
};

const fetchIncidentLocation = async (id: number) => {
	if (!apiBaseUrl || !authToken.value) return;
	try {
		const endpoint = `${apiBaseUrl}/api/admin/incidentes/${id}/mapa`;
		const { data } = await axios.get(endpoint, { headers: buildAuthHeaders() });
		if (incident.value && data.latitud && data.longitud) {
			incident.value.latitude = data.latitud;
			incident.value.longitude = data.longitud;
			initMap();
		}
	} catch (error) {
		console.error('Failed to fetch location', error);
	}
};

const fetchZones = async () => {
	if (!authToken.value || !apiBaseUrl) return;
	try {
		const response = await axios.get<RouteZone[]>(`${apiBaseUrl}/api/admin/incidentes/rutas-con-geometria`, {
			headers: buildAuthHeaders(),
		});
		zones.value = Array.isArray(response.data) ? response.data : [];
		// Update map if it exists
		if (map.value && map.value.loaded()) {
			updateZonesSource();
		}
	} catch (error) {
		console.error('fetch-zones-error', error);
	}
};

const updateZonesSource = () => {
	if (!map.value || !zones.value.length) return;
	
	const features = zones.value
		.filter(z => z.coordenadas && z.coordenadas.length >= 3)
		.map((z, idx) => {
			const ring = z.coordenadas.map(c => [c.longitud, c.latitud]);
			// Ensure ring is closed
			if (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1]) {
				ring.push(ring[0]);
			}
			return {
				type: 'Feature',
				properties: {
					title: z.nombre,
					color: ZONE_COLORS[idx % ZONE_COLORS.length],
				},
				geometry: {
					type: 'Polygon',
					coordinates: [ring],
				},
			};
		});

	const source = map.value.getSource('zones') as maplibregl.GeoJSONSource;
	if (source) {
		source.setData({
			type: 'FeatureCollection',
			features: features as any,
		});
	}
};

const initMap = () => {
	if (!incident.value?.latitude || !incident.value?.longitude) return;
	if (map.value) {
		// Just update center and marker
		map.value.setCenter([incident.value.longitude, incident.value.latitude]);
		map.value.setZoom(15);
		// Update marker
		const source = map.value.getSource('incident-point') as maplibregl.GeoJSONSource;
		if (source) {
			source.setData({
				type: 'FeatureCollection',
				features: [{
					type: 'Feature',
					properties: {},
					geometry: {
						type: 'Point',
						coordinates: [incident.value.longitude, incident.value.latitude],
					},
				}],
			});
		}
		return;
	}

	setTimeout(() => {
		const el = document.getElementById('mini-map');
		if (!el) return;

		const lat = incident.value!.latitude!;
		const lng = incident.value!.longitude!;

		const osmStyle = {
			version: 8,
			sources: {
				osm: {
					type: 'raster',
					tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
					tileSize: 256,
					attribution: '&copy; OpenStreetMap Contributors',
					maxzoom: 19,
				},
			},
			layers: [
				{
					id: 'osm',
					type: 'raster',
					source: 'osm',
				},
			],
		};

		map.value = new maplibregl.Map({
			container: 'mini-map',
			style: osmStyle as any,
			center: [lng, lat],
			zoom: 15,
		});

		map.value.on('load', () => {
			if (!map.value) return;
			// 1. Add Zone Source and Layers
			map.value.addSource('zones', {
				type: 'geojson',
				data: { type: 'FeatureCollection', features: [] },
			});
			map.value.addLayer({
				id: 'zones-fill',
				type: 'fill',
				source: 'zones',
				paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.2 },
			});
			map.value.addLayer({
				id: 'zones-line',
				type: 'line',
				source: 'zones',
				paint: { 'line-color': ['get', 'color'], 'line-width': 2 },
			});

			if (zones.value.length) {
				updateZonesSource();
			}

			// 2. Add Incident Point Source and Layer
			map.value.addSource('incident-point', {
				type: 'geojson',
				data: {
					type: 'FeatureCollection',
					features: [{
						type: 'Feature',
						properties: {},
						geometry: {
							type: 'Point',
							coordinates: [lng, lat],
						},
					}],
				},
			});

			map.value.addLayer({
				id: 'incident-marker-halo',
				type: 'circle',
				source: 'incident-point',
				paint: {
					'circle-radius': 12,
					'circle-color': '#3b82f6',
					'circle-opacity': 0.3,
				},
			});

			map.value.addLayer({
				id: 'incident-marker-core',
				type: 'circle',
				source: 'incident-point',
				paint: {
					'circle-radius': 6,
					'circle-color': '#2563eb',
					'circle-stroke-width': 2,
					'circle-stroke-color': '#ffffff',
				},
			});
		});
	}, 200);
};

onBeforeUnmount(() => {
	if (map.value) {
		map.value.remove();
		map.value = null;
	}
});

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
	popoverState.category.show = false;
};

const selectState = (state: EstadoIncidente) => {
	form.state = state;
	popoverState.state.show = false;
};

const selectRoute = (route: RouteDTO) => {
	form.routeId = String(route.id);
	popoverState.route.show = false;
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
	const nextRouteId = form.routeId ? Number(form.routeId) : null;
	if (nextRouteId !== null && nextRouteId !== incident.value.routeId) {
		updates.push(() => updateRoute(nextRouteId));
	}
	if (!updates.length && !deletedPhotoIds.value.length && !deletedAudioIds.value.length) {
		await showToast('No hay cambios pendientes por guardar.', 'warning');
		return;
	}
	isSaving.value = true;
	try {
		// Process media deletions individually
		const photoIdsToDelete = [...deletedPhotoIds.value];
		for (const photoId of photoIdsToDelete) {
			try {
				const endpoint = `${apiBaseUrl}/api/admin/incidentes/fotos/${photoId}`;
				await axios.delete(endpoint, { headers: buildAuthHeaders() });
				// Remove from list on success
				deletedPhotoIds.value = deletedPhotoIds.value.filter(id => id !== photoId);
			} catch (error) {
				console.error(`Failed to delete photo ${photoId}`, error);
				// Continue with other deletions even if one fails
			}
		}

		const audioIdsToDelete = [...deletedAudioIds.value];
		for (const audioId of audioIdsToDelete) {
			try {
				const endpoint = `${apiBaseUrl}/api/admin/incidentes/audios/${audioId}`;
				await axios.delete(endpoint, { headers: buildAuthHeaders() });
				// Remove from list on success
				deletedAudioIds.value = deletedAudioIds.value.filter(id => id !== audioId);
			} catch (error) {
				console.error(`Failed to delete audio ${audioId}`, error);
				// Continue with other deletions even if one fails
			}
		}

		// Process other updates
		for (const action of updates) {
			await action();
		}

		// Force map recreation to ensure it attaches to the correct DOM element
		if (map.value) {
			map.value.remove();
			map.value = null;
		}

		await loadIncidentData();
		await showToast('Cambios guardados correctamente.');
	} catch (error) {
		console.error('admin-incident-update-error', error);
		await showToast(extractErrorMessage(error), 'danger');
	} finally {
		isSaving.value = false;
	}
};

const onEliminar = async () => {
	if (!incident.value || isDeletingIncident.value) {
		return;
	}

	const alert = await alertController.create({
		header: 'Confirmar eliminación',
		message: '¿Estás seguro de eliminar este incidente? Esta acción es irreversible.',
		buttons: [
			{
				text: 'Cancelar',
				role: 'cancel',
			},
			{
				text: 'Eliminar',
				role: 'confirm',
				handler: async () => {
					isDeletingIncident.value = true;
					try {
						const endpoint = `${apiBaseUrl}/api/admin/incidentes/${incident.value!.id}`;
						await axios.delete(endpoint, { headers: buildAuthHeaders() });
						await showToast('Incidente eliminado correctamente.');
						if (router.hasRoute && router.hasRoute('AdminIncidentManagment')) {
							router.replace({ name: 'AdminIncidentManagment' });
						} else {
							router.replace('/');
						}
					} catch (error) {
						console.error('admin-incident-delete-error', error);
						await showToast(extractErrorMessage(error), 'danger');
					} finally {
						isDeletingIncident.value = false;
					}
				},
			},
		],
	});

	await alert.present();
};

const deletePhoto = (photoId: number | null) => {
	if (!photoId) {
		void showToast('No se puede eliminar la foto.', 'warning');
		return;
	}
	if (incident.value) {
		incident.value.photos = incident.value.photos.filter((photo) => photo.id !== photoId);
		deletedPhotoIds.value.push(photoId);
		void showToast('Foto marcada para eliminación. Guarda cambios para confirmar.', 'warning');
	}
};

const deleteAudio = (audioId: number | null) => {
	if (!audioId) {
		void showToast('No se puede eliminar el audio.', 'warning');
		return;
	}
	if (incident.value) {
		incident.value.audios = incident.value.audios.filter((audio) => audio.id !== audioId);
		deletedAudioIds.value.push(audioId);
		void showToast('Audio marcado para eliminación. Guarda cambios para confirmar.', 'warning');
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

.image-modal {
	--height: 100%;
	--width: 100%;
}

.image-modal-content {
	--background: #000;
	display: flex;
	align-items: center;
	justify-content: center;
}

.full-image-container {
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
}

.full-image-container ion-img {
	width: 100%;
	height: 100%;
	object-fit: contain;
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
	flex: 1 1 300px;
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
	min-height: 220px;
	max-width: 500px;
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
	padding: 10px 20px;
	border-radius: 999px;
	font-weight: 600;
	font-size: 1rem;
}

.status-category {
	background: rgba(245, 158, 11, 0.16);
	color: #b45309;
}

.status-state {
	background: rgba(148, 163, 184, 0.16);
	color: #475569;
}

.status-abierto {
	background: rgba(34, 197, 94, 0.16);
	color: #15803d;
}

.status-en-revision {
	background: rgba(59, 130, 246, 0.16);
	color: #2563eb;
}

.status-cerrado {
	background: rgba(239, 68, 68, 0.16);
	color: #b91c1c;
}

.status-route {
	background: rgba(148, 163, 184, 0.16);
	color: #475569;
}

.icon-btn {
	border: none;
	background: transparent;
	padding: 10px;
	border-radius: 12px;
	color: #475569;
	cursor: pointer;
	transition: background-color 0.2s ease, color 0.2s ease;
}

.icon-btn ion-icon {
	font-size: 1.4rem;
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
	grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
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
	aspect-ratio: 1 / 1;
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

	.media-row {
		flex-direction: column;
	}
}

.media-row {
	display: flex;
	gap: 24px;
	align-items: flex-start;
}

.media-section {
	flex: 1;
	min-width: 0; /* Prevents flex item from overflowing */
}

.content-row {
	display: flex;
	gap: 24px;
	flex-wrap: wrap;
	align-items: flex-start;
}

.left-column {
	display: flex;
	flex-direction: column;
	gap: 12px;
	flex: 1 1 400px;
}

.date-field-group {
	max-width: 200px;
}

.description-field {
	width: 100%;
}

.status-column {
	display: flex;
	flex-direction: column;
	gap: 8px;
	flex: 1 1 300px;
}

.status-column .field-group,
.left-column .field-group {
	flex: 0 0 auto;
}

@media (max-width: 768px) {
	.content-row {
		flex-direction: column;
	}

	.left-column,
	.status-column {
		flex: 1 1 auto;
		width: 100%;
		max-width: none;
	}

	.field-group textarea {
		max-width: none;
	}
}


/* Map */
.mini-map {
	height: 300px;
	width: 85%;
	border-radius: 16px;
	margin-top: 16px;
	z-index: 1;
	border: 1px solid rgba(0, 0, 0, 0.05);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

/* Popovers - Dropdown Style */
.selection-popover {
	--width: 250px;
	--max-height: 300px;
	--box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
	--backdrop-opacity: 0;
}

.selection-popover-content {
	--background: #ffffff;
}

.selection-popover ion-list {
	padding: 4px;
	background: transparent;
	margin: 0;
}

.selection-popover ion-item {
	--padding-start: 12px;
	--inner-padding-end: 12px;
	--min-height: 44px;
	--background: #ffffff;
	border-radius: 6px;
	margin-bottom: 2px;
	font-size: 0.95rem;
	border: 1px solid transparent;
	box-shadow: none;
	transition: background-color 0.2s ease;
}

.selection-popover ion-item:hover {
	--background: #f1f5f9;
}

.selection-popover ion-item.option-active {
	--background: #e2e8f0;
	color: var(--ion-color-primary-shade);
	font-weight: 600;
}

.selection-popover ion-item.option-active ion-label {
	color: inherit;
}

.selection-popover ion-label {
	color: #334155;
	margin: 0;
}

.popover-empty {
	text-align: center;
	color: #94a3b8;
	padding: 16px;
	font-size: 0.9rem;
	margin: 0;
}

.clickable-pill {
	cursor: pointer;
	transition: opacity 0.2s ease, transform 0.2s ease;
	display: inline-flex;
	align-items: center;
	gap: 8px;
}

.clickable-pill:hover {
	opacity: 0.85;
	transform: translateY(-1px);
}

.clickable-pill:active {
	opacity: 0.6;
	transform: translateY(0);
}

.dropdown-icon {
	font-size: 1.1rem;
	opacity: 0.7;
}
</style>
