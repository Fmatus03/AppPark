<template>
	<ion-page>
		<ion-content fullscreen class="incident-content">
			<div class="incident-page">
				<section class="page-header">
					<h1>Gestion de Incidentes</h1>
				</section>

				<section class="card filters-card">
					<h2>Filtrar Incidentes</h2>
					<form class="filters-form" @submit.prevent="applyFilters">
						<div class="field-group">
							<label for="filter-keyword">Buscar</label>
							<input
								id="filter-keyword"
								v-model="workingFilters.keyword"
								type="text"
								placeholder="Título o descripción"
							/>
						</div>
						<div class="field-group">
							<label for="filter-date">Fecha</label>
							<input id="filter-date" v-model="workingFilters.date" type="date" />
						</div>
						<div class="field-group">
							<label for="filter-route">Ruta</label>
							<select id="filter-route" v-model="workingFilters.routeId">
								<option value="all">Todas las rutas</option>
								<option v-for="route in routes" :key="route.id" :value="String(route.id)">
									{{ route.nombre }}
								</option>
							</select>
						</div>
						<div class="field-group">
							<label for="filter-state">Estado</label>
							<select id="filter-state" v-model="workingFilters.state">
								<option value="all">Todos los estados</option>
								<option v-for="state in states" :key="state" :value="state">
									{{ formatStateLabel(state) }}
								</option>
							</select>
						</div>
						<div class="field-group">
							<label for="filter-category">Categoría</label>
							<select id="filter-category" v-model="workingFilters.categoryId">
								<option value="all">Todas las categorías</option>
								<option
									v-for="category in categories"
									:key="category.id"
									:value="String(category.id)"
								>
									{{ category.nombre }}
								</option>
							</select>
						</div>

						<div class="filters-actions">
							<button type="button" class="btn ghost" @click="resetFilters">Restablecer Filtros</button>
							<button type="submit" class="btn primary" :disabled="isLoadingIncidents">
								Aplicar Filtros
							</button>
						</div>
					</form>
				</section>

					<section class="card incidents-card">
						<header class="incidents-header">
							<h2>Lista de Incidentes</h2>
							<p class="results-hint">{{ totalResults }} resultados</p>
						</header>
						<div class="table-wrapper">
							<table>
								<thead>
									<tr>
										<th>ID</th>
										<th>Título</th>
										<th>Categoría</th>
										<th>Fecha</th>
										<th>Estado</th>
										<th aria-label="Acciones"></th>
									</tr>
								</thead>
								<tbody>
									<template v-if="!isLoadingIncidents && !loadError">
										<tr v-for="incident in incidents" :key="incident.id">
											<td>{{ incident.id }}</td>
											<td>{{ incident.title }}</td>
											<td>{{ incident.category }}</td>
											<td>{{ formatDate(incident.reportedAt) }}</td>
											<td>
												<span class="status-pill" :class="statusClass(incident.state)">
													{{ formatStateLabel(incident.state) }}
												</span>
											</td>
											<td class="actions">
												<button
													type="button"
													class="icon-btn"
													aria-label="Editar incidente"
													@click="editIncident(incident.id)"
												>
													<ion-icon :icon="createOutline" />
												</button>
											</td>
										</tr>
										<tr v-if="incidents.length === 0">
											<td colspan="6" class="empty-state">
												No se encontraron incidentes con los filtros seleccionados.
											</td>
										</tr>
									</template>
									<tr v-else-if="isLoadingIncidents">
										<td colspan="6" class="table-message">
											<ion-spinner name="lines-small" />
											<span>Cargando incidentes...</span>
										</td>
									</tr>
									<tr v-else>
										<td colspan="6" class="table-message error-state">{{ loadError }}</td>
									</tr>
								</tbody>
							</table>
						</div>
						<div class="pagination-bar" v-if="pagination.totalPages > 0">
							<div class="page-info">
								Página {{ pagination.page + 1 }} de {{ pagination.totalPages }} ·
								{{ pagination.totalElements }} resultados
							</div>
							<div class="pagination-controls">
								<button class="page-btn" type="button" :disabled="isFirstPage" @click="goToPreviousPage">
									Anterior
								</button>
								<button
									type="button"
									class="page-btn"
									:class="{ active: pageNumber === pagination.page }"
									v-for="pageNumber in visiblePageNumbers"
									:key="pageNumber"
									@click="requestPage(pageNumber)"
								>
									{{ pageNumber + 1 }}
								</button>
								<button class="page-btn" type="button" :disabled="isLastPage" @click="goToNextPage">
									Siguiente
								</button>
							</div>
							<label class="page-size-selector">
								<span>Por página</span>
								<select :value="pagination.size" @change="handlePageSizeChange">
									<option v-for="size in pageSizeOptions" :key="size" :value="size">
										{{ size }}
									</option>
								</select>
							</label>
						</div>
					</section>
			</div>
		</ion-content>
	</ion-page>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { IonContent, IonIcon, IonPage, IonSpinner, onIonViewWillEnter, onIonViewWillLeave } from '@ionic/vue';
import { createOutline } from 'ionicons/icons';
import { onBeforeRouteLeave, useRouter } from 'vue-router';
import axios from 'axios';
import { useSession } from '@/composables/useSession';

type EstadoIncidente = 'ABIERTO' | 'EN_REVISION' | 'CERRADO' | string;

type BackendIncident = {
	id: number | null;
	titulo: string | null;
	categoriaNombre: string | null;
	fechaReporte: string | null;
	estado: EstadoIncidente | null;
};

type BackendPage<T> = {
	content?: T[];
	totalElements?: number;
	totalPages?: number;
	number?: number;
	size?: number;
};

type RouteDTO = {
	id: number;
	nombre: string;
};

type CategoryDTO = {
	id: number;
	nombre: string;
	descripcion?: string;
};

type IncidentRow = {
	id: number;
	title: string;
	category: string;
	reportedAt: string;
	state: EstadoIncidente;
};

type FilterSet = {
	keyword: string;
	date: string;
	routeId: string;
	state: string;
	categoryId: string;
};

const router = useRouter();
const { authToken } = useSession();
const apiBaseEnv = import.meta.env.VITE_PARK_APP_API_URL ?? '';
const apiBaseUrl = apiBaseEnv ? apiBaseEnv.replace(/\/$/, '') : '';

const incidents = ref<IncidentRow[]>([]);
const totalResults = ref(0);
const isLoadingIncidents = ref(false);
const loadError = ref<string | null>(null);
const routes = ref<RouteDTO[]>([]);
const categories = ref<CategoryDTO[]>([]);
const states = ref<EstadoIncidente[]>([]);
const referenceDataLoaded = ref(false);

const defaultFilters: FilterSet = {
	keyword: '',
	date: '',
	routeId: 'all',
	state: 'all',
	categoryId: 'all',
};

const workingFilters = reactive<FilterSet>({ ...defaultFilters });
const activeFilters = ref<FilterSet>({ ...defaultFilters });

const DEFAULT_PAGE_SIZE = 25;
const pageSizeOptions = Object.freeze([10, 25, 50, 100]);
const pagination = reactive({
	page: 0,
	size: DEFAULT_PAGE_SIZE,
	totalPages: 1,
	totalElements: 0,
});

const MAX_PAGE_BUTTONS = 7;
const visiblePageNumbers = computed(() => {
	const total = Math.max(pagination.totalPages, 1);
	const current = Math.min(pagination.page, total - 1);
	const half = Math.floor(MAX_PAGE_BUTTONS / 2);
	let start = Math.max(current - half, 0);
	const maxEnd = Math.min(start + MAX_PAGE_BUTTONS - 1, total - 1);
	const end = maxEnd;
	if (end - start + 1 < MAX_PAGE_BUTTONS) {
		start = Math.max(end - MAX_PAGE_BUTTONS + 1, 0);
	}
	const pages: number[] = [];
	for (let i = start; i <= end; i += 1) {
		pages.push(i);
	}
	return pages;
});

const isFirstPage = computed(() => pagination.page <= 0);
const isLastPage = computed(() => pagination.page + 1 >= pagination.totalPages);

const updatePaginationFromResponse = (pageData: BackendPage<unknown>) => {
	pagination.page = pageData.number ?? pagination.page;
	pagination.size = pageData.size ?? pagination.size;
	const totalPages = pageData.totalPages ?? pagination.totalPages;
	pagination.totalPages = Math.max(totalPages || 1, 1);
	pagination.totalElements = pageData.totalElements ?? pagination.totalElements;
};

const requestPage = (page: number) => {
	if (page < 0 || page >= pagination.totalPages || page === pagination.page) {
		return;
	}
	pagination.page = page;
	void fetchIncidents();
};

const goToPreviousPage = () => {
	if (isFirstPage.value) {
		return;
	}
	requestPage(pagination.page - 1);
};

const goToNextPage = () => {
	if (isLastPage.value) {
		return;
	}
	requestPage(pagination.page + 1);
};

const handlePageSizeChange = (event: Event) => {
	const nextSize = Number((event.target as HTMLSelectElement).value);
	if (!Number.isFinite(nextSize) || nextSize === pagination.size) {
		return;
	}
	pagination.size = nextSize;
	pagination.page = 0;
	void fetchIncidents();
};

const buildAuthHeaders = () => {
	const token = authToken.value;
	return {
		Accept: 'application/json',
		...(token ? { Authorization: `Bearer ${token}` } : {}),
	};
};

const formatDate = (value: string) => {
	if (!value) {
		return '-';
	}

	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) {
		return '-';
	}

	return parsed.toLocaleDateString('es-CL', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
	});
};

const statusLabels: Record<string, { label: string; css: string }> = {
	ABIERTO: { label: 'Abierto', css: 'status-open' },
	EN_REVISION: { label: 'En Revisión', css: 'status-review' },
	CERRADO: { label: 'Cerrado', css: 'status-closed' },
};

const formatStateLabel = (state: EstadoIncidente | null | undefined) => {
	if (!state) {
		return 'Sin estado';
	}

	const normalized = state.toUpperCase();
	if (statusLabels[normalized]) {
		return statusLabels[normalized].label;
	}

	return normalized
		.replace(/_/g, ' ')
		.toLowerCase()
		.replace(/(^|\s)\w/g, (match) => match.toUpperCase());
};

const statusClass = (state: EstadoIncidente | null | undefined) => {
	if (!state) {
		return 'status-review';
	}

	const normalized = state.toUpperCase();
	return statusLabels[normalized]?.css ?? 'status-review';
};

const editIncident = (incidentId: number) => {
	router.push({
		name: 'AdminIncidentDetail',
		query: { id: String(incidentId) },
	});
};

const extractErrorMessage = (error: unknown) => {
	if (axios.isAxiosError(error)) {
		const status = error.response?.status;
		if (status === 401) {
			return 'Tu sesión expiró. Inicia sesión nuevamente.';
		}
		return (
			(error.response?.data as { message?: string } | undefined)?.message ??
			'No fue posible cargar los incidentes. Intenta nuevamente.'
		);
	}

	return 'No fue posible cargar los incidentes. Intenta nuevamente.';
};

const mapIncident = (incident: BackendIncident): IncidentRow => {
	const parsedId = incident.id ?? Date.now();
	return {
		id: Number(parsedId),
		title: incident.titulo?.trim() || 'Incidente sin título',
		category: incident.categoriaNombre?.trim() || 'Sin categoría',
		reportedAt: incident.fechaReporte ?? '',
		state: incident.estado ?? 'EN_REVISION',
	};
};

const buildQueryParams = () => {
	const params: Record<string, string | number> = {
		page: pagination.page,
		size: pagination.size,
		sortBy: 'fechaReporte',
		sortDirection: 'DESC',
	};

	const filters = activeFilters.value;

	if (filters.keyword.trim()) {
		params.keyword = filters.keyword.trim();
	}

	if (filters.date) {
		params.fechaInicio = filters.date;
		params.fechaFin = filters.date;
	}

	if (filters.routeId !== 'all') {
		const routeId = Number(filters.routeId);
		if (Number.isFinite(routeId)) {
			params.rutaId = routeId;
		}
	}

	if (filters.categoryId !== 'all') {
		const categoryId = Number(filters.categoryId);
		if (Number.isFinite(categoryId)) {
			params.categoriaId = categoryId;
		}
	}

	if (filters.state !== 'all') {
		params.estado = filters.state;
	}

	return params;
};

const fetchIncidents = async () => {
	if (!apiBaseUrl) {
		loadError.value = 'No hay configuración de API disponible.';
		return;
	}

	if (!authToken.value) {
		loadError.value = 'Debes iniciar sesión para ver los incidentes.';
		return;
	}

	isLoadingIncidents.value = true;
	loadError.value = null;

	try {
		const endpoint = `${apiBaseUrl}/api/admin/incidentes`;
		const params = buildQueryParams();
		const { data } = await axios.get<BackendPage<BackendIncident>>(endpoint, {
			headers: buildAuthHeaders(),
			params,
		});

		const rows = (data.content ?? []).map(mapIncident);
		incidents.value = rows;
		updatePaginationFromResponse(data);
		totalResults.value = pagination.totalElements || rows.length;
	} catch (error) {
		console.error('admin-incidents-fetch-error', error);
		loadError.value = extractErrorMessage(error);
		incidents.value = [];
		pagination.totalElements = 0;
		pagination.totalPages = 1;
		pagination.page = 0;
		totalResults.value = 0;
	} finally {
		isLoadingIncidents.value = false;
	}
};

const mapRoute = (route: RouteDTO): RouteDTO => ({
	id: Number(route.id),
	nombre: route.nombre || 'Ruta sin nombre',
});

const mapCategory = (category: CategoryDTO): CategoryDTO => ({
	id: Number(category.id),
	nombre: category.nombre || 'Categoría sin nombre',
	descripcion: category.descripcion,
});

const fetchRoutes = async () => {
	if (!apiBaseUrl || !authToken.value) {
		return;
	}

	try {
		const endpoint = `${apiBaseUrl}/api/admin/incidentes/rutas`;
		const { data } = await axios.get<RouteDTO[]>(endpoint, {
			headers: buildAuthHeaders(),
		});
		routes.value = Array.isArray(data) ? data.map(mapRoute) : [];
	} catch (error) {
		console.error('admin-routes-fetch-error', error);
	}
};

const fetchCategories = async () => {
	if (!apiBaseUrl || !authToken.value) {
		return;
	}

	try {
		const endpoint = `${apiBaseUrl}/api/admin/incidentes/categorias`;
		const { data } = await axios.get<CategoryDTO[]>(endpoint, {
			headers: buildAuthHeaders(),
		});
		categories.value = Array.isArray(data) ? data.map(mapCategory) : [];
	} catch (error) {
		console.error('admin-categories-fetch-error', error);
	}
};

const defaultStates: EstadoIncidente[] = ['ABIERTO', 'EN_REVISION', 'CERRADO'];

const fetchStates = async () => {
	if (!apiBaseUrl || !authToken.value) {
		states.value = states.value.length ? states.value : defaultStates;
		return;
	}

	try {
		const endpoint = `${apiBaseUrl}/api/admin/incidentes/estados`;
		const { data } = await axios.get<EstadoIncidente[]>(endpoint, {
			headers: buildAuthHeaders(),
		});
		if (Array.isArray(data) && data.length > 0) {
			states.value = data;
		} else if (!states.value.length) {
			states.value = defaultStates;
		}
	} catch (error) {
		console.error('admin-states-fetch-error', error);
		if (!states.value.length) {
			states.value = defaultStates;
		}
	}
};

const fetchReferenceData = async () => {
	if (referenceDataLoaded.value) {
		return;
	}

	await Promise.all([fetchRoutes(), fetchCategories(), fetchStates()]);
	referenceDataLoaded.value = true;
};

const applyFilters = () => {
	activeFilters.value = { ...workingFilters };
	pagination.page = 0;
	void fetchIncidents();
};

const applyDefaultFilters = () => {
	Object.assign(workingFilters, defaultFilters);
	activeFilters.value = { ...defaultFilters };
	pagination.page = 0;
};

const resetFilters = () => {
	applyDefaultFilters();
	void fetchIncidents();
};

const clearViewState = () => {
	applyDefaultFilters();
	incidents.value = [];
	totalResults.value = 0;
	loadError.value = null;
	pagination.totalElements = 0;
	pagination.totalPages = 1;
	pagination.size = DEFAULT_PAGE_SIZE;
	isLoadingIncidents.value = false;
	referenceDataLoaded.value = false;
	routes.value = [];
	categories.value = [];
	states.value = [];
};

const initializeView = async () => {
	if (!authToken.value) {
		loadError.value = 'Debes iniciar sesión para ver los incidentes.';
		return;
	}

	await fetchReferenceData();
	await fetchIncidents();
};

watch(
	authToken,
	(token) => {
		if (!token) {
			referenceDataLoaded.value = false;
			incidents.value = [];
			totalResults.value = 0;
			pagination.page = 0;
			pagination.totalElements = 0;
			loadError.value = 'Debes iniciar sesión para ver los incidentes.';
			return;
		}

		loadError.value = null;
		referenceDataLoaded.value = false;
		pagination.page = 0;
		void initializeView();
	},
	{ immediate: true }
);

onIonViewWillEnter(() => {
	if (!authToken.value) {
		return;
	}

	void initializeView();
});

onIonViewWillLeave(() => {
	clearViewState();
});

onBeforeRouteLeave((_to, _from, next) => {
	clearViewState();
	next();
});
</script>

<style scoped>
.incident-content {
	--background: #f8fafc;
}

.incident-page {
	background: #f8fafc;
	min-height: 100vh;
	padding: 32px;
}

.page-header {
	margin-bottom: 24px;
}

.page-header h1 {
	font-size: 2rem;
	font-weight: 700;
	color: #16213d;
	margin: 0;
}

.card {
	background: #ffffff;
	border-radius: 18px;
	box-shadow: 0 16px 40px rgba(15, 23, 42, 0.06);
	padding: 24px;
	margin-bottom: 28px;
	border: 1px solid rgba(15, 23, 42, 0.05);
}

.card h2 {
	font-size: 1.1rem;
	font-weight: 600;
	margin: 0 0 20px;
	color: #1e293b;
}

.filters-form {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 18px;
	align-items: end;
}

.field-group {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.field-group label {
	font-size: 0.85rem;
	font-weight: 600;
	color: #475569;
}

.field-group input,
.field-group select {
	height: 44px;
	border-radius: 12px;
	border: 1px solid rgba(148, 163, 184, 0.6);
	padding: 0 12px;
	font-size: 0.95rem;
	color: #1f2937;
	background: #ffffff;
}

.filters-actions {
	display: flex;
	gap: 12px;
	justify-content: flex-end;
	grid-column: 1 / -1;
}

.btn {
	border-radius: 12px;
	border: none;
	font-size: 0.95rem;
	font-weight: 600;
	padding: 12px 18px;
	cursor: pointer;
	transition: background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}

.btn.primary {
	background: #22c55e;
	color: #ffffff;
	box-shadow: 0 10px 20px rgba(34, 197, 94, 0.22);
}

.btn.primary:hover {
	background: #18a34a;
}

.btn.ghost {
	background: #ffffff;
	color: #1f2937;
	border: 1px solid rgba(148, 163, 184, 0.6);
}

.btn.ghost:hover {
	background: rgba(148, 163, 184, 0.12);
}

.incidents-header {
	display: flex;
	justify-content: space-between;
	align-items: baseline;
	gap: 16px;
	margin-bottom: 16px;
}

.incidents-header h2 {
	margin: 0;
}

.results-hint {
	margin: 0;
	font-size: 0.85rem;
	color: #64748b;
}

.table-wrapper {
	overflow-x: auto;
}

table {
	width: 100%;
	border-collapse: collapse;
	font-size: 0.95rem;
}

thead {
	background: #f1f5f9;
}

th {
	text-align: left;
	padding: 14px 16px;
	font-weight: 600;
	color: #475569;
	font-size: 0.85rem;
	text-transform: uppercase;
	letter-spacing: 0.04em;
}

td {
	padding: 16px;
	border-top: 1px solid rgba(148, 163, 184, 0.2);
	color: #1f2937;
}

tbody tr:hover {
	background: rgba(241, 245, 249, 0.5);
}

.status-pill {
	display: inline-flex;
	align-items: center;
	padding: 6px 12px;
	border-radius: 999px;
	font-size: 0.8rem;
	font-weight: 600;
}

.status-open {
	background: rgba(248, 113, 113, 0.16);
	color: #dc2626;
}

.status-review {
	background: rgba(129, 140, 248, 0.16);
	color: #4338ca;
}

.status-closed {
	background: rgba(74, 222, 128, 0.16);
	color: #15803d;
}

.actions {
	text-align: right;
}

.icon-btn {
	border: none;
	background: transparent;
	padding: 6px;
	border-radius: 8px;
	color: #1f2937;
	cursor: pointer;
	transition: background-color 0.2s ease, color 0.2s ease;
}

.icon-btn:hover {
	background: rgba(148, 163, 184, 0.12);
	color: #2563eb;
}

.icon-btn ion-icon {
	font-size: 1.2rem;
}

.empty-state {
	text-align: center;
	color: #64748b;
	font-style: italic;
}

.table-message {
	text-align: center;
	color: #475569;
	font-weight: 600;
	padding: 32px 16px;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 12px;
}

.table-message.error-state {
	color: #dc2626;
}

.pagination-bar {
	margin-top: 20px;
	padding-top: 16px;
	border-top: 1px solid rgba(148, 163, 184, 0.3);
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
	align-items: center;
	justify-content: space-between;
}

.page-info {
	font-size: 0.9rem;
	color: #475569;
}

.pagination-controls {
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
}

.page-btn {
	border: 1px solid rgba(148, 163, 184, 0.6);
	background: #ffffff;
	color: #1f2937;
	border-radius: 10px;
	padding: 8px 12px;
	font-weight: 600;
	cursor: pointer;
	transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.page-btn:hover:not(:disabled) {
	background: rgba(148, 163, 184, 0.12);
}

.page-btn:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

.page-btn.active {
	background: #22c55e;
	border-color: #22c55e;
	color: #ffffff;
	box-shadow: 0 8px 16px rgba(34, 197, 94, 0.2);
}

.page-size-selector {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 0.9rem;
	color: #475569;
}

.page-size-selector select {
	height: 40px;
	border-radius: 10px;
	border: 1px solid rgba(148, 163, 184, 0.6);
	padding: 0 12px;
	background: #ffffff;
	color: #1f2937;
}

@media (max-width: 1024px) {
	.incident-page {
		padding: 24px;
	}

	.filters-form {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
}

@media (max-width: 640px) {
	.incident-page {
		padding: 20px 16px;
	}

	.filters-form {
		grid-template-columns: 1fr;
	}

	.filters-actions {
		justify-content: stretch;
		flex-direction: column;
	}

	.btn {
		width: 100%;
	}

	.pagination-bar {
		flex-direction: column;
		align-items: flex-start;
	}
}
</style>