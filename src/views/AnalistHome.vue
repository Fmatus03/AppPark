<template>
	<ion-page>
		<ion-header translucent>
			<ion-toolbar>
				<ion-title>Resumen Analista</ion-title>
			</ion-toolbar>
		</ion-header>
		<ion-content fullscreen>
			<div class="analist-home-container">
				<header class="page-header">
					<h1>Resumen Mensual</h1>
					<div class="controls">
						<div class="control-pair">
							<label>Mes</label>
							<select v-model="selectedMonth" class="native-select">
								<option v-for="m in 12" :key="m" :value="m">{{ getMonthName(m) }}</option>
							</select>
						</div>
						<div class="control-pair">
							<label>Año</label>
							<input type="number" v-model.number="selectedYear" class="native-input" />
						</div>
						<button class="refresh-btn" @click="fetchAllData" :disabled="loading">
							<ion-icon :icon="refreshOutline" />
							<span>Actualizar</span>
						</button>
					</div>
				</header>

				<div v-if="loading" class="loading-state">
					<ion-spinner />
					<p>Cargando resumenes...</p>
				</div>

				<div v-else class="dashboard-grid">
					<!-- Resumen por Estado -->
					<section class="dashboard-card">
						<div class="card-header">
							<h2>Por Estado</h2>
							<span class="badge">{{ totalEstado }} Total</span>
						</div>
						<div class="chart-container" v-if="estadoChartData">
							<analytics-chart type="doughnut" :data="estadoChartData" :options="donutOptions" :height="180" title="Resumen por Estado" />
						</div>
						<div class="table-container">
							<div class="table-actions">
								<button class="icon-btn" @click="downloadCsv('resumen-estado', ['Estado', 'Cantidad', '%'], resumenEstado?.map(d => [d.estado, d.cantidad, d.porcentaje.toFixed(1) + '%']) ?? [])" title="Descargar CSV">
									<ion-icon :icon="downloadOutline" />
								</button>
							</div>
							<table>
								<thead>
									<tr>
										<th>Estado</th>
										<th>Cant.</th>
										<th>%</th>
									</tr>
								</thead>
								<tbody>
									<tr v-for="item in resumenEstado ?? []" :key="item.estado">
										<td>
											<span class="status-dot" :style="{ backgroundColor: getStatusColor(item.estado) }"></span>
											{{ item.estado }}
										</td>
										<td>{{ item.cantidad }}</td>
										<td>{{ item.porcentaje.toFixed(1) }}%</td>
									</tr>
								</tbody>
							</table>
						</div>
					</section>

					<!-- Resumen por Categoria -->
					<section class="dashboard-card">
						<div class="card-header">
							<h2>Por Categoría</h2>
							<span class="badge">{{ totalCategoria }} Total</span>
						</div>
						<div class="chart-container" v-if="categoriaChartData">
							<analytics-chart type="bar" :data="categoriaChartData" :options="barOptions" :height="180" title="Resumen por Categoria" />
						</div>
						<div class="table-container">
							<div class="table-actions">
							<div class="table-actions">
								<button class="icon-btn" @click="downloadCsv('resumen-categoria', ['Categoría', 'Cantidad', '%'], resumenCategoria?.map(d => [d.categoriaNombre, d.cantidad, d.porcentaje.toFixed(1) + '%']) ?? [])" title="Descargar CSV">
									<ion-icon :icon="downloadOutline" />
								</button>
							</div>
							</div>
							<table>
								<thead>
									<tr>
										<th>Categoría</th>
										<th>Cant.</th>
										<th>%</th>
									</tr>
								</thead>
								<tbody>
									<tr v-for="item in resumenCategoria ?? []" :key="item.categoriaId">
										<td>{{ item.categoriaNombre }}</td>
										<td>{{ item.cantidad }}</td>
										<td>{{ item.porcentaje.toFixed(1) }}%</td>
									</tr>
								</tbody>
							</table>
						</div>
					</section>

					<!-- Resumen por Ruta -->
					<section class="dashboard-card">
						<div class="card-header">
							<h2>Por Zona</h2>
							<span class="badge">{{ totalRuta }} Total</span>
						</div>
						<div class="chart-container" v-if="rutaChartData">
							<analytics-chart type="bar" :data="rutaChartData" :options="barOptions" :height="250" title="Resumen por Zona" />
						</div>
						<div class="table-container">
							<div class="table-actions">
							<div class="table-actions">
								<button class="icon-btn" @click="downloadCsv('resumen-ruta', ['Zona', 'Cantidad', '%'], resumenRuta?.map(d => [d.rutaNombre, d.cantidad, d.porcentaje.toFixed(1) + '%']) ?? [])" title="Descargar CSV">
									<ion-icon :icon="downloadOutline" />
								</button>
							</div>
							</div>
							<table>
								<thead>
									<tr>
										<th>Zona</th>
										<th>Cant.</th>
										<th>%</th>
									</tr>
								</thead>
								<tbody>
									<tr v-for="item in resumenRuta ?? []" :key="item.rutaId">
										<td>{{ item.rutaNombre }}</td>
										<td>{{ item.cantidad }}</td>
										<td>{{ item.porcentaje.toFixed(1) }}%</td>
									</tr>
								</tbody>
							</table>
						</div>
					</section>
				</div>
			</div>
		</ion-content>
	</ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonSpinner, IonIcon, onIonViewWillEnter, onIonViewWillLeave } from '@ionic/vue';
import { refreshOutline, downloadOutline } from 'ionicons/icons';
import AnalyticsChart from '@/components/AnalyticsChart.vue';
import { useAnalyticsApi } from '@/composables/useAnalyticsApi';
import { useSession } from '@/composables/useSession';
import { useSidebar } from '@/composables/useSidebar';
import type { ChartData, ChartOptions } from 'chart.js';
import type { ResumenPorEstadoResponse, ResumenPorCategoriaResponse, ResumenPorRutaResponse } from '@/types/analist-home';

const session = useSession();
const { getReport } = useAnalyticsApi({ getToken: () => session.authToken.value ?? undefined, baseURL: import.meta.env.VITE_PARK_APP_API_URL }); // Ensure base URL is passed correctly if needed, though useAnalyticsApi handles it.
// Note: useAnalyticsApi appends /api/analista/reportes, but the requested endpoints are /api/analista/resumenes/...
// We need to be careful with the path.
// The user request says: /api/analista/resumenes/por-estado
// useAnalyticsApi logic:
// const hasAnalyticsPath = /\/api\/analista\/reportes\/?$/.test(sanitizedBase);
// const analyticsBase = hasAnalyticsPath ? sanitizedBase : `${sanitizedBase}/api/analista/reportes`;
// This helper might be too specific for "reportes".
// I will override the endpoint path by using `../resumenes` relative path hack or just creating a new instance if needed.
// Actually, let's look at useAnalyticsApi again. It appends /api/analista/reportes.
// If I pass `../resumenes/por-estado` it might work if it just appends.
// Let's try to use the `getReport` with a path that navigates up.

const { setMinimized } = useSidebar();

onIonViewWillEnter(() => {
	setMinimized(false);
});

const selectedMonth = ref(new Date().getMonth() + 1);
const selectedYear = ref(new Date().getFullYear());
const loading = ref(false);

const resumenEstado = ref<ResumenPorEstadoResponse | null>(null);
const resumenCategoria = ref<ResumenPorCategoriaResponse | null>(null);
const resumenRuta = ref<ResumenPorRutaResponse | null>(null);

const colorPalette = ['#2563eb', '#22c55e', '#f97316', '#a855f7', '#0ea5e9', '#ef4444', '#14b8a6', '#f59e0b'];

const donutOptions: ChartOptions<'doughnut'> = {
	responsive: true,
	maintainAspectRatio: false,
	plugins: {
		legend: { position: 'right' }
	}
};

const barOptions: ChartOptions<'bar'> = {
	responsive: true,
	maintainAspectRatio: false,
	plugins: {
		legend: { display: false }
	},
	scales: {
		y: { beginAtZero: true }
	}
};

const getMonthName = (m: number) => {
	const date = new Date();
	date.setMonth(m - 1);
	return date.toLocaleString('es-ES', { month: 'long' });
};

const getStatusColor = (status: string) => {
	const map: Record<string, string> = {
		'ABIERTO': '#ef4444',
		'EN_REVISION': '#f59e0b',
		'CERRADO': '#22c55e'
	};
	return map[status] || '#94a3b8';
};

const fetchAllData = async () => {
	loading.value = true;
	const params = { mes: selectedMonth.value, anio: selectedYear.value };
	
	// Hack to step out of /reportes and into /resumenes
	// Base is .../api/analista/reportes
	// We want .../api/analista/resumenes/por-estado
	const endpointPrefix = '../resumenes'; 

	try {
		const [estadoData, categoriaData, rutaData] = await Promise.all([
			getReport<ResumenPorEstadoResponse>(`${endpointPrefix}/por-estado`, params),
			getReport<ResumenPorCategoriaResponse>(`${endpointPrefix}/por-categoria`, params),
			getReport<ResumenPorRutaResponse>(`${endpointPrefix}/por-ruta`, params)
		]);

		resumenEstado.value = estadoData;
		resumenCategoria.value = categoriaData;
		resumenRuta.value = rutaData;
	} catch (error) {
		console.error('Error fetching summaries', error);
	} finally {
		loading.value = false;
	}
};

const totalEstado = computed(() => resumenEstado.value?.reduce((acc, curr) => acc + curr.cantidad, 0) ?? 0);
const totalCategoria = computed(() => resumenCategoria.value?.reduce((acc, curr) => acc + curr.cantidad, 0) ?? 0);
const totalRuta = computed(() => resumenRuta.value?.reduce((acc, curr) => acc + curr.cantidad, 0) ?? 0);

const estadoChartData = computed<ChartData<'doughnut'> | null>(() => {
	if (!resumenEstado.value) return null;
	return {
		labels: resumenEstado.value.map(d => d.estado),
		datasets: [{
			data: resumenEstado.value.map(d => d.cantidad),
			backgroundColor: resumenEstado.value.map(d => getStatusColor(d.estado))
		}]
	};
});

const categoriaChartData = computed<ChartData<'bar'> | null>(() => {
	if (!resumenCategoria.value) return null;
	return {
		labels: resumenCategoria.value.map(d => d.categoriaNombre),
		datasets: [{
			label: 'Incidentes',
			data: resumenCategoria.value.map(d => d.cantidad),
			backgroundColor: colorPalette
		}]
	};
});

const rutaChartData = computed<ChartData<'bar'> | null>(() => {
	if (!resumenRuta.value) return null;
	return {
		labels: resumenRuta.value.map(d => d.rutaNombre),
		datasets: [{
			label: 'Incidentes',
			data: resumenRuta.value.map(d => d.cantidad),
			backgroundColor: '#3b82f6'
		}]
	};
});

const downloadCsv = (filename: string, headers: string[], rows: (string | number)[][]) => {
	const csvContent = [
		headers.join(','),
		...rows.map(row => row.map(cell => `"${cell}"`).join(','))
	].join('\n');

	const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
	const link = document.createElement('a');
	const url = URL.createObjectURL(blob);
	link.setAttribute('href', url);
	link.setAttribute('download', `${filename}.csv`);
	link.style.visibility = 'hidden';
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
};

onMounted(() => {
	fetchAllData();
});
</script>

<style scoped>
.analist-home-container {
	padding: 16px;
	background: var(--page-bg);
	min-height: 100%;
}

.page-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 32px;
	flex-wrap: wrap;
	gap: 16px;
}

.page-header h1 {
	margin: 0;
	font-size: 1.8rem;
	font-weight: 700;
	color: #0f172a;
}

.controls {
	display: flex;
	gap: 16px;
	align-items: center;
}

.control-pair {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.control-pair label {
	font-size: 0.75rem;
	font-weight: 600;
	color: #64748b;
	text-transform: uppercase;
}

.native-select, .native-input {
	height: 40px;
	padding: 0 12px;
	border: 1px solid #cbd5e1;
	border-radius: 8px;
	background: white;
	font-size: 0.95rem;
	min-width: 140px;
}

.refresh-btn {
	height: 40px;
	padding: 0 20px;
	background: #2563eb;
	color: white;
	border: none;
	border-radius: 8px;
	font-weight: 600;
	display: flex;
	align-items: center;
	gap: 8px;
	cursor: pointer;
	transition: background 0.2s;
	margin-top: 18px; /* Align with inputs */
}

.refresh-btn:hover {
	background: #1d4ed8;
}

.refresh-btn:disabled {
	background: #94a3b8;
	cursor: not-allowed;
}

.dashboard-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 16px;
}

.dashboard-card {
	background: white;
	border-radius: 16px;
	padding: 16px;
	box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.dashboard-card.full-width {
	grid-column: 1 / -1;
}

.card-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.card-header h2 {
	margin: 0;
	font-size: 1.2rem;
	font-weight: 600;
	color: #1e293b;
}

.badge {
	background: #f1f5f9;
	color: #475569;
	padding: 4px 12px;
	border-radius: 999px;
	font-size: 0.85rem;
	font-weight: 600;
}

.chart-container {
	position: relative;
	width: 100%;
}

.table-container {
	border-top: 1px solid #e2e8f0;
	padding-top: 16px;
}

.table-actions {
	display: flex;
	justify-content: flex-end;
	margin-bottom: 8px;
}

.icon-btn {
	background: transparent;
	border: none;
	color: #64748b;
	cursor: pointer;
	padding: 4px;
	border-radius: 4px;
	transition: color 0.2s;
}

.icon-btn:hover {
	color: #2563eb;
	background: #eff6ff;
}

table {
	width: 100%;
	border-collapse: collapse;
	font-size: 0.9rem;
}

th {
	text-align: left;
	padding: 8px;
	color: #64748b;
	font-weight: 600;
	border-bottom: 1px solid #e2e8f0;
}

td {
	padding: 8px 8px;
	border-bottom: 1px solid #f1f5f9;
	color: #334155;
}

.status-dot {
	display: inline-block;
	width: 8px;
	height: 8px;
	border-radius: 50%;
	margin-right: 8px;
}

.loading-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 64px;
	color: #64748b;
	gap: 16px;
}

@media (max-width: 768px) {
	.dashboard-grid {
		grid-template-columns: 1fr;
	}
	
	.page-header {
		flex-direction: column;
		align-items: stretch;
	}
	
	.controls {
		flex-direction: column;
		align-items: stretch;
	}
	
	.refresh-btn {
		margin-top: 0;
	}
}
</style>
