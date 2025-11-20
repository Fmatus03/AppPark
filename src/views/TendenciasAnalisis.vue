<template>
	<ion-page class="tendencias-analisis">
		<ion-header translucent>
			<ion-toolbar>
				<ion-title>Analytics de Incidentes</ion-title>
			</ion-toolbar>
		</ion-header>
		<ion-content fullscreen>
			<section class="intro">
				<h1>Panel del Analista</h1>
				<p>
					Genera reportes objetivos sobre incidentes. Ajusta los filtros de cada módulo y presiona “Generar reporte” para
					consultar los datos en tiempo real.
				</p>
			</section>

			<ion-accordion-group expand="inset" class="report-accordion-group">
				<!-- 1. Tendencias por Categoría -->
				<ion-accordion value="tendencias-categorias">
					<ion-item slot="header">
						<ion-label>
							<h2>Tendencias por categoría</h2>
							<p>Participación porcentual por categoría</p>
						</ion-label>
					</ion-item>
					<div slot="content" class="section-content">
						<div class="controls">
							<div class="control-pair">
								<span>Fecha inicio</span>
								<ion-datetime v-model="tendenciasCategorias.payload.fechaInicio" presentation="date-time" />
							</div>
							<div class="control-pair">
								<span>Fecha fin</span>
								<ion-datetime v-model="tendenciasCategorias.payload.fechaFin" presentation="date-time" />
							</div>
						</div>
						<div class="actions">
							<ion-button @click="generateTendencias" :disabled="tendenciasCategorias.loading">
								<ion-icon :icon="refreshOutline" slot="start" />
								Generar reporte
							</ion-button>
							<ion-spinner v-if="tendenciasCategorias.loading" />
						</div>
						<ion-note color="danger" v-if="tendenciasCategorias.error">{{ tendenciasCategorias.error }}</ion-note>
						<div v-if="tendenciasCategorias.data" class="visualizations">
							<analytics-chart v-if="tendenciasPieData" type="pie" :data="tendenciasPieData" :options="pieOptions" :height="280" />
							<table class="data-table">
								<thead>
									<tr>
										<th>Categoría</th>
										<th>Incidentes</th>
										<th>%</th>
									</tr>
								</thead>
								<tbody>
									<tr v-for="categoria in tendenciasCategorias.data.categorias" :key="categoria.id">
										<td>{{ categoria.nombre }}</td>
										<td>{{ categoria.cantidadIncidentes }}</td>
										<td>{{ formatPercent(categoria.porcentaje) }}</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>
				</ion-accordion>

				<!-- 2. Evolución de Categorías -->
				<ion-accordion value="evolucion-categorias">
					<ion-item slot="header">
						<ion-label>
							<h2>Evolución de categorías</h2>
							<p>Comportamiento temporal por categoría</p>
						</ion-label>
					</ion-item>
					<div slot="content" class="section-content">
						<div class="controls">
							<div class="control-pair">
								<span>Fecha inicio</span>
								<ion-datetime v-model="evolucionCategorias.payload.fechaInicio" presentation="date" />
							</div>
							<div class="control-pair">
								<span>Fecha fin</span>
								<ion-datetime v-model="evolucionCategorias.payload.fechaFin" presentation="date" />
							</div>
							<div class="control-pair">
								<span>Agrupación</span>
								<ion-select v-model="evolucionCategorias.payload.agrupacion" interface="popover">
									<ion-select-option value="DIARIA">Diaria</ion-select-option>
									<ion-select-option value="SEMANAL">Semanal</ion-select-option>
									<ion-select-option value="MENSUAL">Mensual</ion-select-option>
									<ion-select-option value="TRIMESTRAL">Trimestral</ion-select-option>
									<ion-select-option value="ANUAL">Anual</ion-select-option>
								</ion-select>
							</div>
						</div>
						<div class="actions">
							<ion-button @click="generateEvolucion" :disabled="evolucionCategorias.loading">
								<ion-icon :icon="refreshOutline" slot="start" />
								Generar reporte
							</ion-button>
							<ion-spinner v-if="evolucionCategorias.loading" />
						</div>
						<ion-note color="danger" v-if="evolucionCategorias.error">{{ evolucionCategorias.error }}</ion-note>
						<div v-if="evolucionCategorias.data" class="visualizations">
							<analytics-chart v-if="evolucionLineData" type="line" :data="evolucionLineData" :options="lineOptions" :height="320" />
							<table class="data-table">
								<thead>
									<tr>
										<th>Categoría</th>
										<th>Total</th>
										<th>Promedio</th>
										<th>Máx</th>
										<th>Mín</th>
										<th>Tendencia</th>
									</tr>
								</thead>
								<tbody>
									<tr v-for="cat in evolucionCategorias.data.evolucionPorCategoria" :key="cat.categoriaId">
										<td>{{ cat.categoriaNombre }}</td>
										<td>{{ cat.estadisticas.total }}</td>
										<td>{{ cat.estadisticas.promedio.toFixed(1) }}</td>
										<td>{{ cat.estadisticas.maximo }}</td>
										<td>{{ cat.estadisticas.minimo }}</td>
										<td>{{ cat.estadisticas.tendencia }}</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>
				</ion-accordion>

				<!-- 3. Análisis Horario -->
				<ion-accordion value="analisis-horario">
					<ion-item slot="header">
						<ion-label>
							<h2>Análisis por horario</h2>
							<p>Frecuencia por cada hora del día</p>
						</ion-label>
					</ion-item>
					<div slot="content" class="section-content">
						<div class="controls">
							<div class="control-pair">
								<span>Fecha inicio</span>
								<ion-datetime v-model="analisisHorario.payload.fechaInicio" presentation="date-time" />
							</div>
							<div class="control-pair">
								<span>Fecha fin</span>
								<ion-datetime v-model="analisisHorario.payload.fechaFin" presentation="date-time" />
							</div>
						</div>
						<div class="actions">
							<ion-button @click="generateAnalisisHorario" :disabled="analisisHorario.loading">
								<ion-icon :icon="refreshOutline" slot="start" />
								Generar reporte
							</ion-button>
							<ion-spinner v-if="analisisHorario.loading" />
						</div>
						<ion-note color="danger" v-if="analisisHorario.error">{{ analisisHorario.error }}</ion-note>
						<div v-if="analisisHorario.data" class="visualizations">
							<analytics-chart v-if="horarioBarData" type="bar" :data="horarioBarData" :options="barOptions" />
							<div class="kpi-grid">
								<kpi-card label="Hora pico" :value="analisisHorario.data.estadisticas.horaPico" :description="`Incidentes: ${analisisHorario.data.estadisticas.cantidadEnHoraPico}`" accent="warning" />
								<kpi-card label="Hora mínima" :value="analisisHorario.data.estadisticas.horaMinima" :description="`Incidentes: ${analisisHorario.data.estadisticas.cantidadEnHoraMinima}`" accent="neutral" />
								<kpi-card label="Promedio/hora" :value="analisisHorario.data.estadisticas.promedioIncidentesPorHora.toFixed(1)" description="Promedio global" accent="primary" />
							</div>
						</div>
					</div>
				</ion-accordion>
			</ion-accordion-group>
		</ion-content>
	</ion-page>
</template>

<script setup lang="ts">
import {
	IonAccordion,
	IonAccordionGroup,
	IonButton,
	IonContent,
	IonDatetime,
	IonHeader,
	IonIcon,
	IonItem,
	IonLabel,
	IonNote,
	IonPage,
	IonSelect,
	IonSelectOption,
	IonSpinner,
	IonTitle,
	IonToolbar,
} from '@ionic/vue';
import { computed, reactive } from 'vue';
import { refreshOutline } from 'ionicons/icons';
import AnalyticsChart from '@/components/AnalyticsChart.vue';
import KpiCard from '@/components/KpiCard.vue';
import { useAnalyticsApi } from '@/composables/useAnalyticsApi';
import { useSession } from '@/composables/useSession';
import type { ChartData, ChartOptions } from 'chart.js';

type DateRangePayload = { fechaInicio: string; fechaFin: string };

type PeriodoConsulta = { fechaInicio: string; fechaFin: string };

type CategoriaTrend = { id: number; nombre: string; cantidadIncidentes: number; porcentaje: number };

type TendenciasCategoriasResponse = {
	periodoConsulta: PeriodoConsulta;
	totalIncidentes: number;
	categorias: CategoriaTrend[];
};

type AgrupacionTemporal = 'DIARIA' | 'SEMANAL' | 'MENSUAL' | 'TRIMESTRAL' | 'ANUAL';

type EvolucionCategoriasResponse = {
	periodoConsulta: PeriodoConsulta;
	agrupacionTemporal: AgrupacionTemporal;
	evolucionPorCategoria: Array<{
		categoriaId: number;
		categoriaNombre: string;
		datosTemporales: Array<{ periodo: string; cantidad: number; porcentajeDelPeriodo: number }>;
		estadisticas: { total: number; promedio: number; maximo: number; minimo: number; tendencia: string };
	}>;
	totalIncidentesPorPeriodo: Array<{ periodo: string; total: number }>;
};

type AnalisisHorarioResponse = {
	periodoConsulta: PeriodoConsulta;
	totalIncidentes: number;
	analisisPorHorario: Array<{ hora: number; cantidadIncidentes: number; porcentaje: number }>;
	estadisticas: {
		horaPico: number;
		cantidadEnHoraPico: number;
		horaMinima: number;
		cantidadEnHoraMinima: number;
		promedioIncidentesPorHora: number;
	};
};

const session = useSession();
const { postReport } = useAnalyticsApi({ getToken: () => session.authToken.value ?? undefined });

const colorPalette = ['#2563eb', '#22c55e', '#f97316', '#a855f7', '#0ea5e9', '#ef4444', '#14b8a6', '#f59e0b'];

const pieOptions: ChartOptions<'pie'> = {
	plugins: {
		legend: { position: 'bottom' },
	},
	maintainAspectRatio: false,
};

const lineOptions: ChartOptions<'line'> = {
	maintainAspectRatio: false,
	interaction: { intersect: false, mode: 'index' },
	plugins: { legend: { position: 'bottom' } },
};

const barOptions: ChartOptions<'bar'> = {
	maintainAspectRatio: false,
	plugins: { legend: { display: false } },
	scales: {
		y: { beginAtZero: true },
	},
};

type SectionState<TPayload, TResponse> = {
	payload: TPayload;
	loading: boolean;
	error: string;
	data: TResponse | null;
};

const createSectionState = <TPayload, TResponse>(payload: TPayload): SectionState<TPayload, TResponse> =>
	reactive({
		payload,
		loading: false,
		error: '',
		data: null as TResponse | null,
	}) as SectionState<TPayload, TResponse>;

const defaultRange = (days = 30): DateRangePayload => {
	const end = new Date();
	const start = new Date();
	start.setDate(end.getDate() - days);
	return {
		fechaInicio: start.toISOString(),
		fechaFin: end.toISOString(),
	};
};

const tendenciasCategorias = createSectionState<DateRangePayload, TendenciasCategoriasResponse>(defaultRange());
const evolucionCategorias = createSectionState<DateRangePayload & { agrupacion: AgrupacionTemporal }, EvolucionCategoriasResponse>({
	...defaultRange(90),
	agrupacion: 'MENSUAL',
});
const analisisHorario = createSectionState<DateRangePayload, AnalisisHorarioResponse>(defaultRange());

const runReport = async <TPayload, TResponse>(endpoint: string, state: SectionState<TPayload, TResponse>) => {
	state.loading = true;
	state.error = '';
	try {
		state.data = await postReport<TResponse>(endpoint, { ...(state.payload as Record<string, unknown>) });
	} catch (error) {
		console.error(endpoint, error);
		state.error = (error as Error).message ?? 'No pudimos generar el reporte.';
	} finally {
		state.loading = false;
	}
};

const generateTendencias = () => runReport('tendencias-categorias', tendenciasCategorias);
const generateEvolucion = () => runReport('evolucion-categorias', evolucionCategorias);
const generateAnalisisHorario = () => runReport('analisis-horario', analisisHorario);

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

const tendenciasPieData = computed<ChartData<'pie'> | null>(() => {
	if (!tendenciasCategorias.data) return null;
	return {
		labels: tendenciasCategorias.data.categorias.map((cat) => cat.nombre),
		datasets: [
			{
				data: tendenciasCategorias.data.categorias.map((cat) => cat.porcentaje),
				backgroundColor: tendenciasCategorias.data.categorias.map((_, idx) => colorPalette[idx % colorPalette.length]),
			},
		],
	};
});

const evolucionLineData = computed<ChartData<'line'> | null>(() => {
	const data = evolucionCategorias.data;
	if (!data) return null;
	const labels = data.totalIncidentesPorPeriodo?.map((per) => per.periodo) ?? [];
	return {
		labels,
		datasets: data.evolucionPorCategoria.map((cat, idx) => ({
			label: cat.categoriaNombre,
			data: labels.map((label) => {
				const punto = cat.datosTemporales.find((p) => p.periodo === label);
				return punto ? punto.cantidad : 0;
			}),
			borderColor: colorPalette[idx % colorPalette.length],
			fill: false,
			borderWidth: 2,
		})),
	};
});

const horarioBarData = computed<ChartData<'bar'> | null>(() => {
	if (!analisisHorario.data) return null;
	return {
		labels: analisisHorario.data.analisisPorHorario.map((item) => `${item.hora} h`),
		datasets: [
			{
				label: 'Incidentes',
				backgroundColor: '#3b82f6',
				data: analisisHorario.data.analisisPorHorario.map((item) => item.cantidadIncidentes),
			},
		],
	};
});
</script>

<style scoped>
.tendencias-analisis {
	--page-padding: 16px;
}

.intro {
	padding: var(--page-padding);
}

.report-accordion-group {
	margin: 0 16px 32px;
}

.section-content {
	padding: 16px;
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.controls {
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
}

.control-pair {
	display: flex;
	flex-direction: column;
	gap: 4px;
	min-width: 180px;
	font-size: 0.9rem;
}

.actions {
	display: flex;
	align-items: center;
	gap: 12px;
}

.visualizations {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.data-table {
	width: 100%;
	border-collapse: collapse;
	font-size: 0.9rem;
}

.data-table th,
.data-table td {
	padding: 8px;
	border-bottom: 1px solid var(--ion-color-step-150, #e2e8f0);
}

.kpi-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 12px;
}

@media (prefers-color-scheme: dark) {
	.section-content {
		background: rgba(15, 23, 42, 0.2);
		border-radius: 12px;
	}

	.data-table th,
	.data-table td {
		border-color: rgba(148, 163, 184, 0.2);
	}
}
</style>
