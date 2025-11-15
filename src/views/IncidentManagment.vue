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
							<label for="filter-date">Fecha</label>
							<input id="filter-date" v-model="workingFilters.date" type="date" />
						</div>
						<div class="field-group">
							<label for="filter-route">Ruta</label>
							<select id="filter-route" v-model="workingFilters.route">
								<option value="all">Todas las Rutas</option>
								<option v-for="route in routes" :key="route" :value="route">
									{{ route }}
								</option>
							</select>
						</div>
						<div class="field-group">
							<label for="filter-state">Estado</label>
							<select id="filter-state" v-model="workingFilters.state">
								<option value="all">Todos los Estados</option>
								<option v-for="state in states" :key="state" :value="state">
									{{ state }}
								</option>
							</select>
						</div>
						<div class="field-group">
							<label for="filter-category">Categoria</label>
							<select id="filter-category" v-model="workingFilters.category">
								<option value="all">Todas las Categorias</option>
								<option v-for="category in categories" :key="category" :value="category">
									{{ category }}
								</option>
							</select>
						</div>

						<div class="filters-actions">
							<button type="button" class="btn ghost" @click="resetFilters">Restablecer Filtros</button>
							<button type="submit" class="btn primary">Aplicar Filtros</button>
						</div>
					</form>
				</section>

					<section class="card incidents-card">
						<header class="incidents-header">
							<h2>Lista de Incidentes</h2>
							<p class="results-hint">{{ filteredIncidents.length }} resultados</p>
						</header>
						<div class="table-wrapper">
							<table>
								<thead>
									<tr>
										<th>ID</th>
										<th>Ruta</th>
										<th>Categoria</th>
										<th>Fecha</th>
										<th>Estado</th>
										<th aria-label="Acciones"></th>
									</tr>
								</thead>
								<tbody>
									<tr v-for="incident in filteredIncidents" :key="incident.id">
										<td>{{ incident.id }}</td>
										<td>{{ incident.route }}</td>
										<td>{{ incident.category }}</td>
										<td>{{ incident.date }}</td>
										<td>
											<span class="status-pill" :class="statusClass(incident.state)">
												{{ incident.state }}
											</span>
										</td>
										<td class="actions">
											<button type="button" class="icon-btn" aria-label="Editar incidente" @click="editIncident(incident.id)">
												<ion-icon :icon="createOutline" />
											</button>
										</td>
									</tr>
									<tr v-if="filteredIncidents.length === 0">
										<td colspan="6" class="empty-state">No se encontraron incidentes con los filtros seleccionados.</td>
									</tr>
								</tbody>
							</table>
						</div>
					</section>
			</div>
		</ion-content>
	</ion-page>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { IonContent, IonIcon, IonPage } from '@ionic/vue';
import { createOutline } from 'ionicons/icons';
import { useRouter } from 'vue-router';
type IncidentState = 'Abierto' | 'En Revision' | 'Cerrado';

type Incident = {
	id: number;
	route: string;
	category: string;
	date: string;
	state: IncidentState;
};

const routes = ['Ruta del Bosque', 'Ruta del Rio', 'Pico del Aguila', 'Valle de las Flores', 'Sendero de la Cascada'];
const states: IncidentState[] = ['Abierto', 'En Revision', 'Cerrado'];
const categories = ['Mantenimiento', 'Seguridad', 'Infraestructura', 'Medioambiente'];

const incidents = ref<Incident[]>([
	{ id: 1, route: 'Ruta del Bosque', category: 'Mantenimiento', date: '2023-10-26', state: 'Abierto' },
	{ id: 2, route: 'Ruta del Rio', category: 'Seguridad', date: '2023-10-25', state: 'En Revision' },
	{ id: 3, route: 'Pico del Aguila', category: 'Infraestructura', date: '2023-10-24', state: 'Cerrado' },
	{ id: 4, route: 'Valle de las Flores', category: 'Medioambiente', date: '2023-10-23', state: 'Abierto' },
	{ id: 5, route: 'Sendero de la Cascada', category: 'Mantenimiento', date: '2023-10-22', state: 'Cerrado' },
	{ id: 6, route: 'Mirador del Condor', category: 'Infraestructura', date: '2023-10-21', state: 'Abierto' },
]);

type FilterSet = {
	date: string;
	route: string;
	state: string;
	category: string;
};

const defaultFilters: FilterSet = {
	date: '',
	route: 'all',
	state: 'all',
	category: 'all',
};

const workingFilters = reactive<FilterSet>({ ...defaultFilters });
const activeFilters = ref<FilterSet>({ ...defaultFilters });

const router = useRouter();
const editIncident = (incidentId: number) => {
	router.push({
		name: 'AdminIncidentDetail',
		query: { id: String(incidentId) },
	});
};
const applyFilters = () => {
	activeFilters.value = { ...workingFilters };
};

const resetFilters = () => {
	Object.assign(workingFilters, defaultFilters);
	activeFilters.value = { ...defaultFilters };
};

const filteredIncidents = computed(() => {
	return incidents.value.filter((incident) => {
		const matchesDate = activeFilters.value.date ? incident.date === activeFilters.value.date : true;
		const matchesRoute = activeFilters.value.route === 'all' ? true : incident.route === activeFilters.value.route;
		const matchesState = activeFilters.value.state === 'all' ? true : incident.state === activeFilters.value.state;
		const matchesCategory = activeFilters.value.category === 'all' ? true : incident.category === activeFilters.value.category;
		return matchesDate && matchesRoute && matchesState && matchesCategory;
	});
});

const statusClass = (state: IncidentState) => {
	switch (state) {
		case 'Abierto':
			return 'status-open';
		case 'En Revision':
			return 'status-review';
		case 'Cerrado':
			return 'status-closed';
		default:
			return '';
	}
};
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
	grid-template-columns: repeat(4, minmax(0, 1fr));
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
}
</style>
