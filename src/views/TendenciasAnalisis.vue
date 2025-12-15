<template>
	<ion-page class="tendencias-analisis">
		<ion-header translucent>
			<ion-toolbar>
				<ion-title>Analiticas de Incidentes</ion-title>
			</ion-toolbar>
		</ion-header>
		<ion-content fullscreen>
			<div class="dashboard-container">
				<aside class="dashboard-sidebar">
					<div class="sidebar-header">
						<h2>Reportes</h2>
					</div>
					<nav class="sidebar-nav">
						<button
							v-for="report in reports"
							:key="report.id"
							class="nav-button"
							:class="{ active: activeReportId === report.id }"
							@click="activeReportId = report.id"
						>
							<ion-icon :icon="report.icon" slot="start" />
							<span>{{ report.label }}</span>
						</button>
					</nav>
				</aside>

				<main class="dashboard-content">
					<header class="content-header">
						<h1>{{ activeReport?.label }}</h1>
						<p class="subtitle">Reportes sobre incidentes</p>
					</header>

					<div class="report-container">
						<div v-if="activeReportId === 'overview'" class="report-section">
							<overview-filter-bar :filters="overviewState.filters" :active-reports="overviewSettings" @refresh="refreshOverview" />
							<div class="overview-header">
								<ion-button @click="showOverviewSettings = !showOverviewSettings" fill="outline" size="small">
									<ion-icon :icon="settingsOutline" slot="start" />
									{{ showOverviewSettings ? 'Ocultar Personalización' : 'Personalizar Vista' }}
								</ion-button>
							</div>

							<div v-if="showOverviewSettings" class="settings-panel">
								<h3>Seleccionar Reportes Visibles</h3>
								<div class="settings-grid">
									<div v-for="report in reports.filter(r => r.id !== 'overview')" :key="report.id" class="setting-item">
										<ion-checkbox v-model="overviewSettings[report.id]">{{ report.label }}</ion-checkbox>
									</div>
								</div>
							</div>

							<div class="overview-grid">
								<!-- Tendencias -->
								<div v-if="overviewSettings['tendencias-categorias'] && overviewState.reports.tendenciasCategorias.data" class="overview-card">
									<h4>Tendencias por Categoría</h4>
									<div class="chart-wrapper">
										<analytics-chart v-if="tendenciasPieData" type="pie" :data="tendenciasPieData" :options="pieOptions" :height="250" />
									</div>
								</div>

								<!-- Evolucion -->
								<div v-if="overviewSettings['evolucion-categorias'] && overviewState.reports.evolucionCategorias.data" class="overview-card wide">
									<h4>Evolución de Categorías</h4>
									<div class="chart-wrapper">
										<analytics-chart v-if="evolucionLineData" type="line" :data="evolucionLineData" :options="lineOptions" :height="300" />
									</div>
								</div>

								<!-- Analisis Horario -->
								<div v-if="overviewSettings['analisis-horario'] && overviewState.reports.analisisHorario.data" class="overview-card">
									<h4>Análisis por Horario</h4>
									<div class="kpi-mini-grid">
										<div class="kpi-mini">
											<span class="label">Pico</span>
											<span class="value">{{ overviewState.reports.analisisHorario.data.estadisticas.horaPico }}h</span>
										</div>
										<div class="kpi-mini">
											<span class="label">Promedio</span>
											<span class="value">{{ overviewState.reports.analisisHorario.data.estadisticas.promedioIncidentesPorHora.toFixed(1) }}</span>
										</div>
									</div>
									<div class="chart-wrapper">
										<analytics-chart v-if="horarioBarData" type="bar" :data="horarioBarData" :options="barOptions" :height="200" />
									</div>
								</div>

								<!-- Rutas Criticas -->
								<div v-if="overviewSettings['rutas-criticas'] && overviewState.reports.rutasCriticas.data" class="overview-card wide">
									<h4>Zonas Críticas</h4>
									<div class="chart-wrapper">
										<analytics-chart v-if="rutasCriticasStackedData" type="bar" :data="rutasCriticasStackedData" :options="stackedBarOptions" :height="300" />
									</div>
								</div>

								<!-- Comparacion Mensual -->
								<div v-if="overviewSettings['comparacion-mensual'] && overviewState.reports.comparacionMensual.data" class="overview-card wide">
									<h4>Comparación Mensual</h4>
									<div class="kpi-row">
										<span :class="overviewState.reports.comparacionMensual.data.comparacion.tendencia === 'ASCENDENTE' ? 'text-danger' : 'text-success'">
											{{ overviewState.reports.comparacionMensual.data.comparacion.variacionTotal > 0 ? '+' : ''}}{{ overviewState.reports.comparacionMensual.data.comparacion.variacionTotal }} ({{ formatPercent(overviewState.reports.comparacionMensual.data.comparacion.variacionPorcentual) }})
										</span>
									</div>
									<div class="dual-chart-row">
										<div class="half-chart" v-if="comparacionMensualCategoriaData">
											<small>{{ overviewState.reports.comparacionMensual.data.periodo1.mes }}</small>
											<analytics-chart type="doughnut" :data="comparacionMensualCategoriaData.periodo1" :options="donutOptions" :height="200" />
										</div>
										<div class="half-chart" v-if="comparacionMensualCategoriaData">
											<small>{{ overviewState.reports.comparacionMensual.data.periodo2.mes }}</small>
											<analytics-chart type="doughnut" :data="comparacionMensualCategoriaData.periodo2" :options="donutOptions" :height="200" />
										</div>
									</div>
								</div>

								<!-- Comparacion Anual -->
								<div v-if="overviewSettings['comparacion-anual'] && overviewState.reports.comparacionAnual.data" class="overview-card wide">
									<h4>Comparación Anual</h4>
									<div class="chart-wrapper">
										<analytics-chart v-if="comparacionAnualLineData" type="line" :data="comparacionAnualLineData" :options="lineOptions" :height="300" />
									</div>
								</div>

								<!-- Analisis Estacional -->
								<div v-if="overviewSettings['analisis-estacional'] && overviewState.reports.analisisEstacional.data" class="overview-card">
									<h4>Análisis Estacional</h4>
									<div class="chart-wrapper">
										<analytics-chart v-if="analisisEstacionalBarData" type="bar" :data="analisisEstacionalBarData" :options="dualAxisBarOptions" :height="250" />
									</div>
								</div>

								<!-- Patrones Horarios -->
								<div v-if="overviewSettings['patrones-horarios'] && overviewState.reports.patronesHorarios.data" class="overview-card wide">
									<h4>Patrones Horarios</h4>
									<div class="chart-wrapper">
										<analytics-chart v-if="patronesSegmentosChartData" type="bar" :data="patronesSegmentosChartData" :options="stackedBarOptions" :height="300" />
									</div>
								</div>

								<!-- Incidentes Recurrentes -->
								<div v-if="overviewSettings['incidentes-recurrentes'] && overviewState.reports.incidentesRecurrentes.data" class="overview-card">
									<h4>Incidentes Recurrentes (Top)</h4>
									<div class="chart-wrapper">
										<analytics-chart v-if="incidentesRecurrentesBarData" type="bar" :data="incidentesRecurrentesBarData" :options="horizontalBarOptions" :height="250" />
									</div>
								</div>

								<!-- Comparacion Zonas -->
								<div v-if="overviewSettings['comparacion-zonas'] && overviewState.reports.comparacionZonas.data" class="overview-card wide">
									<h4>Comparación por Zonas</h4>
									<div class="chart-wrapper">
										<analytics-chart v-if="comparacionZonasStackedData" type="bar" :data="comparacionZonasStackedData" :options="stackedBarOptions" :height="300" />
									</div>
								</div>

								<!-- Tiempo Resolucion -->
								<div v-if="overviewSettings['tiempo-resolucion'] && overviewState.reports.tiempoResolucion.data" class="overview-card">
									<h4>Tiempo de Resolución</h4>
									<div class="chart-wrapper">
										<analytics-chart v-if="tiempoResolucionBarData" type="bar" :data="tiempoResolucionBarData" :options="barOptions" :height="250" />
									</div>
								</div>

								<!-- Ranking Rutas -->
								<div v-if="overviewSettings['ranking-rutas'] && overviewState.reports.rankingTendenciaRutas.data" class="overview-card wide">
									<h4>Ranking de Tendencia (Zonas)</h4>
									<div class="chart-wrapper">
										<analytics-chart v-if="rankingRutasLineData" type="line" :data="rankingRutasLineData" :options="lineOptions" :height="300" />
									</div>
								</div>

								<!-- Proporcion Estados -->
								<div v-if="overviewSettings['proporcion-estados'] && overviewState.reports.proporcionEstados.data" class="overview-card">
									<h4>Proporción de Estados</h4>
									<div class="chart-wrapper">
										<analytics-chart v-if="proporcionEstadosDonut" type="doughnut" :data="proporcionEstadosDonut" :options="donutOptions" :height="250" />
									</div>
								</div>

								<!-- Eficiencia Cierre -->
								<div v-if="overviewSettings['eficiencia-cierre'] && overviewState.reports.eficienciaCierre.data" class="overview-card wide">
									<h4>Eficiencia de Cierre</h4>
									<div class="chart-wrapper">
										<analytics-chart v-if="eficienciaCierreLineData" type="line" :data="eficienciaCierreLineData" :options="lineOptions" :height="300" />
									</div>
								</div>
							</div>
						</div>
<div v-if="activeReportId === 'tendencias-categorias'" class="report-section">
						<div class="controls">
							<div class="control-pair">
								<span>Fecha inicio</span>
								<input type="date" v-model="tendenciasCategorias.payload.fechaInicio" class="date-input" />
							</div>
							<div class="control-pair">
								<span>Fecha fin</span>
								<input type="date" v-model="tendenciasCategorias.payload.fechaFin" class="date-input" />
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
							<div class="visual-row">
								<div class="visual-card">
									<analytics-chart v-if="tendenciasPieData" type="pie" :data="tendenciasPieData" :options="pieOptions" :height="280" />
								</div>
								<div class="table-card">
									<div class="table-header">
										<h4>Detalle</h4>
										<ion-button fill="clear" size="small" @click="exportToCSV('tendencias-categorias', ['Categoría', 'Incidentes', '%'], tendenciasCategorias.data?.categorias.map(c => [c.nombre, c.cantidadIncidentes, formatPercent(c.porcentaje)]) ?? [])" :disabled="!tendenciasCategorias.data">
											<ion-icon :icon="downloadOutline" slot="icon-only" />
										</ion-button>
									</div>
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
						</div>
					</div>
<div v-if="activeReportId === 'evolucion-categorias'" class="report-section">
						<div class="controls">
							<div class="control-pair">
								<span>Fecha inicio</span>
								<input type="date" v-model="evolucionCategorias.payload.fechaInicio" class="date-input" />
							</div>
							<div class="control-pair">
								<span>Fecha fin</span>
								<input type="date" v-model="evolucionCategorias.payload.fechaFin" class="date-input" />
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
							<div class="visual-card">
								<analytics-chart v-if="evolucionLineData" type="line" :data="evolucionLineData" :options="lineOptions" :height="320" />
							</div>
							<div class="table-card">
								<div class="table-header">
									<h4>Detalle</h4>
									<ion-button fill="clear" size="small" @click="exportToCSV('evolucion-categorias', ['Categoría', 'Total', 'Promedio', 'Máx', 'Mín', 'Tendencia'], evolucionCategorias.data?.evolucionPorCategoria.map(c => [c.categoriaNombre, c.estadisticas.total, c.estadisticas.promedio.toFixed(1), c.estadisticas.maximo, c.estadisticas.minimo, c.estadisticas.tendencia]) ?? [])" :disabled="!evolucionCategorias.data">
										<ion-icon :icon="downloadOutline" slot="icon-only" />
									</ion-button>
								</div>
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
					</div>
<div v-if="activeReportId === 'analisis-horario'" class="report-section">
						<div class="controls">
							<div class="control-pair">
								<span>Fecha inicio</span>
								<input type="date" v-model="analisisHorario.payload.fechaInicio" class="date-input" />
							</div>
							<div class="control-pair">
								<span>Fecha fin</span>
								<input type="date" v-model="analisisHorario.payload.fechaFin" class="date-input" />
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
<div v-if="activeReportId === 'rutas-criticas'" class="report-section">
						<div class="controls">
							<div class="control-pair">
								<span>Fecha inicio</span>
								<input type="date" v-model="rutasCriticas.payload.fechaInicio" class="date-input" />
							</div>
							<div class="control-pair">
								<span>Fecha fin</span>
								<input type="date" v-model="rutasCriticas.payload.fechaFin" class="date-input" />
							</div>
							<div class="control-pair">
								<span>Top de zonas</span>
								<ion-input type="number" min="1" max="10" v-model.number="rutasCriticas.payload.top" />
							</div>
						</div>
						<div class="actions">
							<ion-button @click="generateRutasCriticas" :disabled="rutasCriticas.loading">
								<ion-icon :icon="refreshOutline" slot="start" />
								Generar reporte
							</ion-button>
							<ion-spinner v-if="rutasCriticas.loading" />
						</div>
						<ion-note color="danger" v-if="rutasCriticas.error">{{ rutasCriticas.error }}</ion-note>
						<div v-if="rutasCriticas.data" class="visualizations">
							<div class="kpi-grid">
								<kpi-card label="Total incidentes" :value="rutasCriticas.data.totalIncidentes" description="Periodo seleccionado" accent="primary" />
								<kpi-card label="Promedio por zona" :value="rutasCriticas.data.estadisticas.promedioIncidentesPorRuta.toFixed(0)" description="Incidentes" accent="warning" />
								<kpi-card label="Zona más crítica" :value="rutasCriticas.data.estadisticas.rutaMasCritica" description="Mayor carga" accent="danger" />
							</div>
							<div class="visual-row">
								<div class="visual-card">
									<analytics-chart
										v-if="rutasCriticasStackedData"
										type="bar"
										:data="rutasCriticasStackedData"
										:options="stackedBarOptions"
										:height="320"
									/>
								</div>
								<div class="table-card">
									<div class="table-header">
										<h4>Detalle</h4>
										<ion-button fill="clear" size="small" @click="exportToCSV('rutas-criticas', ['Ranking', 'Zona', 'Incidentes', '%'], rutasCriticas.data?.topRutasCriticas.map(r => [r.ranking, r.ruta.nombre, r.cantidadIncidentes, formatPercent(r.porcentaje)]) ?? [])" :disabled="!rutasCriticas.data">
											<ion-icon :icon="downloadOutline" slot="icon-only" />
										</ion-button>
									</div>
									<table class="data-table">
										<thead>
											<tr>
												<th>#</th>
												<th>Zona</th>
												<th>Incidentes</th>
												<th>%</th>
											</tr>
										</thead>
										<tbody>
											<tr v-for="ruta in rutasCriticas.data.topRutasCriticas" :key="ruta.ranking">
												<td>{{ ruta.ranking }}</td>
												<td>{{ ruta.ruta.nombre }}</td>
												<td>{{ ruta.cantidadIncidentes }}</td>
												<td>{{ formatPercent(ruta.porcentaje) }}</td>
											</tr>
										</tbody>
									</table>
								</div>
							</div>
						</div>
					</div>
<div v-if="activeReportId === 'comparacion-mensual'" class="report-section">
						<div class="controls">
							<div class="control-pair">
								<span>Mes 1</span>
								<input type="month" v-model="comparacionMensual.payload.mes1" class="date-input" />
							</div>
							<div class="control-pair">
								<span>Mes 2</span>
								<input type="month" v-model="comparacionMensual.payload.mes2" class="date-input" />
							</div>
						</div>
						<div class="actions">
							<ion-button @click="generateComparacionMensual" :disabled="comparacionMensual.loading">
								<ion-icon :icon="refreshOutline" slot="start" />
								Generar reporte
							</ion-button>
							<ion-spinner v-if="comparacionMensual.loading" />
						</div>
						<ion-note color="danger" v-if="comparacionMensual.error">{{ comparacionMensual.error }}</ion-note>
						<div v-if="comparacionMensual.data" class="visualizations">
							<div class="kpi-grid">
								<kpi-card label="Mes 1" :value="comparacionMensual.data.periodo1.totalIncidentes" :description="comparacionMensual.data.periodo1.mes" accent="neutral" />
								<kpi-card label="Mes 2" :value="comparacionMensual.data.periodo2.totalIncidentes" :description="comparacionMensual.data.periodo2.mes" accent="neutral" />
								<kpi-card label="Variación" :value="comparacionMensual.data.comparacion.variacionTotal" :description="formatPercent(comparacionMensual.data.comparacion.variacionPorcentual)" :accent="comparacionMensual.data.comparacion.tendencia === 'ASCENDENTE' ? 'success' : 'danger'" />
							</div>
							<div class="charts-grid" v-if="comparacionMensualCategoriaData">
								<div class="chart-card">
									<h4>Categorías {{ comparacionMensual.data.periodo1.mes }}</h4>
									<analytics-chart type="doughnut" :data="comparacionMensualCategoriaData.periodo1" :options="donutOptions" :height="260" />
								</div>
								<div class="chart-card">
									<h4>Categorías {{ comparacionMensual.data.periodo2.mes }}</h4>
									<analytics-chart type="doughnut" :data="comparacionMensualCategoriaData.periodo2" :options="donutOptions" :height="260" />
								</div>
							</div>
							<div class="charts-grid" v-if="comparacionMensualEstadoData">
								<div class="chart-card">
									<h4>Estados {{ comparacionMensual.data.periodo1.mes }}</h4>
									<analytics-chart type="doughnut" :data="comparacionMensualEstadoData.periodo1" :options="donutOptions" :height="260" />
								</div>
								<div class="chart-card">
									<h4>Estados {{ comparacionMensual.data.periodo2.mes }}</h4>
									<analytics-chart type="doughnut" :data="comparacionMensualEstadoData.periodo2" :options="donutOptions" :height="260" />
								</div>
							</div>
						</div>
					</div>
<div v-if="activeReportId === 'comparacion-anual'" class="report-section">
						<div class="controls">
							<div class="control-pair">
								<span>Año base</span>
								<input type="number" v-model.number="comparacionAnual.payload.anio1" class="date-input" />
							</div>
							<div class="control-pair">
								<span>Año comparación</span>
								<input type="number" v-model.number="comparacionAnual.payload.anio2" class="date-input" />
							</div>
						</div>
						<div class="actions">
							<ion-button @click="generateComparacionAnual" :disabled="comparacionAnual.loading">
								<ion-icon :icon="refreshOutline" slot="start" />
								Generar reporte
							</ion-button>
							<ion-spinner v-if="comparacionAnual.loading" />
						</div>
						<ion-note color="danger" v-if="comparacionAnual.error">{{ comparacionAnual.error }}</ion-note>
						<div v-if="comparacionAnual.data" class="visualizations">
							<kpi-card
								label="Variación total"
								:value="comparacionAnual.data.comparacion.variacionTotal"
								:description="formatPercent(comparacionAnual.data.comparacion.variacionPorcentual)"
								:accent="comparacionAnual.data.comparacion.tendencia === 'ASCENDENTE' ? 'success' : 'danger'"
							/>
							<div class="visual-card">
								<analytics-chart v-if="comparacionAnualLineData" type="line" :data="comparacionAnualLineData" :options="lineOptions" :height="300" />
							</div>
							<div class="table-card">
								<div class="table-header">
									<h4>Detalle</h4>
									<ion-button fill="clear" size="small" @click="exportToCSV('comparacion-anual', ['Año', 'Total', 'Promedio Mensual'], [comparacionAnual.data?.periodo1, comparacionAnual.data?.periodo2].filter(Boolean).map(p => [p!.anio, p!.totalIncidentes, p!.promedioMensual.toFixed(1)]))" :disabled="!comparacionAnual.data">
										<ion-icon :icon="downloadOutline" slot="icon-only" />
									</ion-button>
								</div>
								<table class="data-table">
									<thead>
										<tr>
											<th>Año</th>
											<th>Total</th>
											<th>Promedio mensual</th>
											<th>Mayor crecimiento</th>
											<th>Mayor decrecimiento</th>
										</tr>
									</thead>
									<tbody>
										<tr>
											<td>{{ comparacionAnual.data.periodo1.anio }}</td>
											<td>{{ comparacionAnual.data.periodo1.totalIncidentes }}</td>
											<td>{{ comparacionAnual.data.periodo1.promedioMensual.toFixed(1) }}</td>
											<td>{{ comparacionAnual.data.comparacion.categoriaConMayorCrecimiento ?? '—' }}</td>
											<td>{{ comparacionAnual.data.comparacion.categoriaConMayorDecrecimiento ?? '—' }}</td>
										</tr>
										<tr>
											<td>{{ comparacionAnual.data.periodo2.anio }}</td>
											<td>{{ comparacionAnual.data.periodo2.totalIncidentes }}</td>
											<td>{{ comparacionAnual.data.periodo2.promedioMensual.toFixed(1) }}</td>
											<td>{{ comparacionAnual.data.comparacion.categoriaConMayorCrecimiento ?? '—' }}</td>
											<td>{{ comparacionAnual.data.comparacion.categoriaConMayorDecrecimiento ?? '—' }}</td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>
					</div>
<div v-if="activeReportId === 'analisis-estacional'" class="report-section">
						<div class="controls">
							<div class="control-pair">
								<span>Año</span>
								<input type="number" v-model.number="analisisEstacional.payload.anio" class="date-input" />
							</div>
						</div>
						<div class="actions">
							<ion-button @click="generateAnalisisEstacional" :disabled="analisisEstacional.loading">
								<ion-icon :icon="refreshOutline" slot="start" />
								Generar reporte
							</ion-button>
							<ion-spinner v-if="analisisEstacional.loading" />
						</div>
						<ion-note color="danger" v-if="analisisEstacional.error">{{ analisisEstacional.error }}</ion-note>
						<div v-if="analisisEstacional.data" class="visualizations">
							<div class="kpi-grid">
								<kpi-card label="Estación pico" :value="analisisEstacional.data.estadisticas.estacionConMasIncidentes" description="Mayor demanda" accent="danger" />
								<kpi-card label="Estación mínima" :value="analisisEstacional.data.estadisticas.estacionConMenosIncidentes" description="Menor demanda" accent="success" />
								<kpi-card label="Brecha" :value="analisisEstacional.data.estadisticas.diferenciaMaxima" description="Incidentes" accent="warning" />
							</div>
							<div class="visual-card">
								<analytics-chart
									v-if="analisisEstacionalBarData"
									type="bar"
									:data="analisisEstacionalBarData"
									:options="dualAxisBarOptions"
									:height="320"
								/>
							</div>
							<div class="table-card">
								<div class="table-header">
									<h4>Detalle</h4>
									<ion-button fill="clear" size="small" @click="exportToCSV('analisis-estacional', ['Estación', 'Periodo', 'Incidentes', '%', 'Promedio Diario'], analisisEstacional.data?.analisisPorEstacion.map(e => [e.estacion, e.periodo, e.cantidadIncidentes, formatPercent(e.porcentaje), e.promedioDiario.toFixed(1)]) ?? [])" :disabled="!analisisEstacional.data">
										<ion-icon :icon="downloadOutline" slot="icon-only" />
									</ion-button>
								</div>
								<table class="data-table">
									<thead>
										<tr>
											<th>Estación</th>
											<th>Periodo</th>
											<th>Incidentes</th>
											<th>%</th>
											<th>Promedio diario</th>
											</tr>
										</thead>
										<tbody>
											<tr v-for="estacion in analisisEstacional.data.analisisPorEstacion" :key="estacion.estacion">
												<td>{{ estacion.estacion }}</td>
												<td>{{ estacion.periodo }}</td>
												<td>{{ estacion.cantidadIncidentes }}</td>
												<td>{{ formatPercent(estacion.porcentaje) }}</td>
												<td>{{ estacion.promedioDiario.toFixed(1) }}</td>
											</tr>
										</tbody>
									</table>
							</div>
						</div>
					</div>
<div v-if="activeReportId === 'patrones-horarios'" class="report-section">
						<div class="controls">
							<div class="control-pair">
								<span>Fecha inicio</span>
								<input type="date" v-model="patronesHorarios.payload.fechaInicio" class="date-input" />
							</div>
							<div class="control-pair">
								<span>Fecha fin</span>
								<input type="date" v-model="patronesHorarios.payload.fechaFin" class="date-input" />
							</div>
						</div>
						<div class="actions">
							<ion-button @click="generatePatronesHorarios" :disabled="patronesHorarios.loading">
								<ion-icon :icon="refreshOutline" slot="start" />
								Generar reporte
							</ion-button>
							<ion-spinner v-if="patronesHorarios.loading" />
						</div>
						<ion-note color="danger" v-if="patronesHorarios.error">{{ patronesHorarios.error }}</ion-note>
						<div v-if="patronesHorarios.data" class="visualizations">
							<analytics-chart
								v-if="patronesSegmentosChartData"
								type="bar"
								:data="patronesSegmentosChartData"
								:options="stackedBarOptions"
								:height="320"
							/>
							<div class="segment-grid" v-if="patronesSegmentCards.length">
								<div class="segment-card" v-for="segment in patronesSegmentCards" :key="segment.key">
									<h4>{{ segment.label }}</h4>
									<p>Rango: {{ segment.detalle.rango }}</p>
									<p>Incidentes: {{ segment.detalle.cantidadTotal }}</p>
									<p>%: {{ formatPercent(segment.detalle.porcentaje) }}</p>
								</div>
							</div>
						</div>
					</div>
<div v-if="activeReportId === 'incidentes-recurrentes'" class="report-section">
						<div class="controls">
							<div class="control-pair">
								<span>Fecha inicio</span>
								<input type="date" v-model="incidentesRecurrentes.payload.fechaInicio" class="date-input" />
							</div>
							<div class="control-pair">
								<span>Fecha fin</span>
								<input type="date" v-model="incidentesRecurrentes.payload.fechaFin" class="date-input" />
							</div>
							<div class="control-pair">
								<span>Umbral recurrencia</span>
								<ion-input type="number" min="1" v-model.number="incidentesRecurrentes.payload.umbralRecurrencia" />
							</div>
						</div>
						<div class="actions">
							<ion-button @click="generateIncidentesRecurrentes" :disabled="incidentesRecurrentes.loading">
								<ion-icon :icon="refreshOutline" slot="start" />
								Generar reporte
							</ion-button>
							<ion-spinner v-if="incidentesRecurrentes.loading" />
						</div>
						<ion-note color="danger" v-if="incidentesRecurrentes.error">{{ incidentesRecurrentes.error }}</ion-note>
						<div v-if="incidentesRecurrentes.data" class="visualizations">
							<div class="visual-card">
								<analytics-chart v-if="incidentesRecurrentesBarData" type="bar" :data="incidentesRecurrentesBarData" :options="horizontalBarOptions" :height="320" />
							</div>
							<div class="table-card">
								<div class="table-header">
									<h4>Detalle</h4>
									<ion-button fill="clear" size="small" @click="exportToCSV('incidentes-recurrentes', ['Zona', 'Categoría', 'Incidentes', '% del total', 'Último incidente'], incidentesRecurrentes.data?.incidentesRecurrentes.map(i => [i.ruta.nombre, i.categoria.nombre, i.cantidadIncidentes, formatPercent(i.porcentajeDelTotal), new Date(i.ultimoIncidente).toLocaleString()]) ?? [])" :disabled="!incidentesRecurrentes.data">
										<ion-icon :icon="downloadOutline" slot="icon-only" />
									</ion-button>
								</div>
								<table class="data-table">
									<thead>
										<tr>
											<th>Zona</th>
											<th>Categoría</th>
											<th>Incidentes</th>
											<th>% del total</th>
											<th>Último incidente</th>
											</tr>
										</thead>
										<tbody>
											<tr v-for="item in incidentesRecurrentes.data.incidentesRecurrentes" :key="`${item.ruta.id}-${item.categoria.id}`">
												<td>{{ item.ruta.nombre }}</td>
												<td>{{ item.categoria.nombre }}</td>
												<td>{{ item.cantidadIncidentes }}</td>
												<td>{{ formatPercent(item.porcentajeDelTotal) }}</td>
												<td>{{ new Date(item.ultimoIncidente).toLocaleString() }}</td>
											</tr>
										</tbody>
									</table>
							</div>
						</div>
					</div>
<div v-if="activeReportId === 'comparacion-zonas'" class="report-section">
						<div class="controls">
							<div class="control-pair">
								<span>Fecha inicio</span>
								<input type="date" v-model="comparacionZonas.payload.fechaInicio" class="date-input" />
							</div>
							<div class="control-pair">
								<span>Fecha fin</span>
								<input type="date" v-model="comparacionZonas.payload.fechaFin" class="date-input" />
							</div>
						</div>
						<div class="actions">
							<ion-button @click="generateComparacionZonas" :disabled="comparacionZonas.loading">
								<ion-icon :icon="refreshOutline" slot="start" />
								Generar reporte
							</ion-button>
							<ion-spinner v-if="comparacionZonas.loading" />
						</div>
						<ion-note color="danger" v-if="comparacionZonas.error">{{ comparacionZonas.error }}</ion-note>
						<div v-if="comparacionZonas.data" class="visualizations">
							<div class="visual-row">
								<div class="visual-card">
									<analytics-chart
										v-if="comparacionZonasStackedData"
										type="bar"
										:data="comparacionZonasStackedData"
										:options="stackedBarOptions"
										:height="320"
									/>
								</div>
								<div class="table-card">
									<div class="table-header">
										<h4>Detalle</h4>
										<ion-button fill="clear" size="small" @click="exportToCSV('comparacion-zonas', ['Zona', 'Incidentes', '%', 'Dominante'], comparacionZonas.data?.comparacionPorZona.map(z => [z.ruta.nombre, z.totalIncidentes, formatPercent(z.porcentaje), z.categoriaDominante]) ?? [])" :disabled="!comparacionZonas.data">
											<ion-icon :icon="downloadOutline" slot="icon-only" />
										</ion-button>
									</div>
									<table class="data-table">
										<thead>
											<tr>
												<th>Zona</th>
												<th>Incidentes</th>
												<th>%</th>
												<th>Dominante</th>
											</tr>
										</thead>
										<tbody>
											<tr v-for="zona in comparacionZonas.data.comparacionPorZona" :key="zona.ruta.id">
												<td>{{ zona.ruta.nombre }}</td>
												<td>{{ zona.totalIncidentes }}</td>
												<td>{{ formatPercent(zona.porcentaje) }}</td>
												<td>{{ zona.categoriaDominante }}</td>
											</tr>
										</tbody>
									</table>
								</div>
							</div>
						</div>
					</div>
<div v-if="activeReportId === 'tiempo-resolucion'" class="report-section">
						<div class="controls">
							<div class="control-pair">
								<span>Fecha inicio</span>
								<input type="date" v-model="tiempoResolucion.payload.fechaInicio" class="date-input" />
							</div>
							<div class="control-pair">
								<span>Fecha fin</span>
								<input type="date" v-model="tiempoResolucion.payload.fechaFin" class="date-input" />
							</div>
						</div>
						<div class="actions">
							<ion-button @click="generateTiempoResolucion" :disabled="tiempoResolucion.loading">
								<ion-icon :icon="refreshOutline" slot="start" />
								Generar reporte
							</ion-button>
							<ion-spinner v-if="tiempoResolucion.loading" />
						</div>
						<ion-note color="danger" v-if="tiempoResolucion.error">{{ tiempoResolucion.error }}</ion-note>
						<div v-if="tiempoResolucion.data" class="visualizations">
							<div class="kpi-grid">
								<kpi-card label="Promedio general (días)" :value="tiempoResolucion.data.promedioGeneralDias.toFixed(1)" description="Sobre incidentes resueltos" accent="primary" />
								<kpi-card label="Promedio general (horas)" :value="tiempoResolucion.data.promedioGeneralHoras.toFixed(1)" description="Referencia" accent="neutral" />
							</div>
							<div class="visual-card">
								<analytics-chart v-if="tiempoResolucionBarData" type="bar" :data="tiempoResolucionBarData" :options="barOptions" :height="300" />
							</div>
							<div class="table-card">
								<div class="table-header">
									<h4>Detalle</h4>
									<ion-button fill="clear" size="small" @click="exportToCSV('tiempo-resolucion', ['Categoría', 'Resueltos', 'Promedio días', 'Mín horas', 'Máx horas', 'Mediana días'], tiempoResolucion.data?.tiempoPorCategoria.map(c => [c.categoria.nombre, c.cantidadResueltos, c.promedioDias.toFixed(1), c.minimoHoras, c.maximoHoras, c.medianaDias]) ?? [])" :disabled="!tiempoResolucion.data">
										<ion-icon :icon="downloadOutline" slot="icon-only" />
									</ion-button>
								</div>
								<table class="data-table">
									<thead>
										<tr>
											<th>Categoría</th>
											<th>Resueltos</th>
											<th>Promedio días</th>
											<th>Mín horas</th>
											<th>Máx horas</th>
											<th>Mediana días</th>
										</tr>
									</thead>
									<tbody>
										<tr v-for="cat in tiempoResolucion.data.tiempoPorCategoria" :key="cat.categoria.id">
											<td>{{ cat.categoria.nombre }}</td>
											<td>{{ cat.cantidadResueltos }}</td>
											<td>{{ cat.promedioDias.toFixed(1) }}</td>
											<td>{{ cat.minimoHoras }}</td>
											<td>{{ cat.maximoHoras }}</td>
											<td>{{ cat.medianaDias }}</td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>
					</div>
<div v-if="activeReportId === 'ranking-rutas'" class="report-section">
						<div class="controls">
							<div class="control-pair">
								<span>Fecha inicio</span>
								<input type="date" v-model="rankingTendenciaRutas.payload.fechaInicio" class="date-input" />
							</div>
							<div class="control-pair">
								<span>Fecha fin</span>
								<input type="date" v-model="rankingTendenciaRutas.payload.fechaFin" class="date-input" />
							</div>
							<div class="control-pair">
								<span>Agrupación</span>
								<ion-select v-model="rankingTendenciaRutas.payload.agrupacion" interface="popover">
									<ion-select-option value="DIARIA">Diaria</ion-select-option>
									<ion-select-option value="SEMANAL">Semanal</ion-select-option>
									<ion-select-option value="MENSUAL">Mensual</ion-select-option>
									<ion-select-option value="TRIMESTRAL">Trimestral</ion-select-option>
									<ion-select-option value="ANUAL">Anual</ion-select-option>
								</ion-select>
							</div>
							<div class="control-pair">
								<span>Top</span>
								<ion-input type="number" min="1" max="10" v-model.number="rankingTendenciaRutas.payload.top" />
							</div>
						</div>
						<div class="actions">
							<ion-button @click="generateRankingRutas" :disabled="rankingTendenciaRutas.loading">
								<ion-icon :icon="refreshOutline" slot="start" />
								Generar reporte
							</ion-button>
							<ion-spinner v-if="rankingTendenciaRutas.loading" />
						</div>
						<ion-note color="danger" v-if="rankingTendenciaRutas.error">{{ rankingTendenciaRutas.error }}</ion-note>
						<div v-if="rankingTendenciaRutas.data" class="visualizations">
							<div class="kpi-grid">
								<kpi-card label="Tendencia positiva" :value="rankingTendenciaRutas.data.analisisGlobal.rutaConTendenciaPositiva ?? '—'" description="Mayor crecimiento" accent="success" />
								<kpi-card label="Tendencia negativa" :value="rankingTendenciaRutas.data.analisisGlobal.rutaConTendenciaNegativa ?? '—'" description="Mayor caída" accent="danger" />
								<kpi-card label="Ruta estable" :value="rankingTendenciaRutas.data.analisisGlobal.rutaMasEstable ?? '—'" description="Variación mínima" accent="neutral" />
							</div>
							<div class="visual-card">
								<analytics-chart v-if="rankingRutasLineData" type="line" :data="rankingRutasLineData" :options="lineOptions" :height="320" />
							</div>
							<div class="table-card">
								<div class="table-header">
									<h4>Detalle</h4>
									<ion-button fill="clear" size="small" @click="exportToCSV('ranking-rutas', ['Ranking', 'Ruta', 'Total', '%', 'Tendencia', 'Predicción'], rankingTendenciaRutas.data?.rankingRutas.map(r => [r.ranking, r.ruta.nombre, r.totalIncidentes, formatPercent(r.porcentaje), r.tendencia, r.prediccionProximoMes]) ?? [])" :disabled="!rankingTendenciaRutas.data">
										<ion-icon :icon="downloadOutline" slot="icon-only" />
									</ion-button>
								</div>
								<table class="data-table">
									<thead>
										<tr>
											<th>#</th>
											<th>Zona</th>
											<th>Total</th>
											<th>%</th>
											<th>Tendencia</th>
											<th>Predicción</th>
										</tr>
									</thead>
									<tbody>
										<tr v-for="ruta in rankingTendenciaRutas.data.rankingRutas" :key="ruta.ranking">
											<td>{{ ruta.ranking }}</td>
											<td>{{ ruta.ruta.nombre }}</td>
											<td>{{ ruta.totalIncidentes }}</td>
											<td>{{ formatPercent(ruta.porcentaje) }}</td>
											<td>{{ ruta.tendencia }}</td>
											<td>{{ ruta.prediccionProximoMes }}</td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>
					</div>
<div v-if="activeReportId === 'proporcion-estados'" class="report-section">
						<div class="controls">
							<div class="control-pair">
								<span>Fecha inicio</span>
								<input type="date" v-model="proporcionEstados.payload.fechaInicio" class="date-input" />
							</div>
							<div class="control-pair">
								<span>Fecha fin</span>
								<input type="date" v-model="proporcionEstados.payload.fechaFin" class="date-input" />
							</div>
						</div>
						<div class="actions">
							<ion-button @click="generateProporcionEstados" :disabled="proporcionEstados.loading">
								<ion-icon :icon="refreshOutline" slot="start" />
								Generar reporte
							</ion-button>
							<ion-spinner v-if="proporcionEstados.loading" />
						</div>
						<ion-note color="danger" v-if="proporcionEstados.error">{{ proporcionEstados.error }}</ion-note>
						<div v-if="proporcionEstados.data" class="visualizations">
							<div class="charts-grid">
								<div class="chart-card" v-if="proporcionEstadosDonut">
									<h4>Proporción global</h4>
									<analytics-chart type="doughnut" :data="proporcionEstadosDonut" :options="donutOptions" :height="280" />
								</div>
								<div class="chart-card" v-if="proporcionEstadosCategoriaStacked">
									<h4>Por categoría</h4>
									<analytics-chart type="bar" :data="proporcionEstadosCategoriaStacked" :options="stackedBarOptions" :height="280" />
								</div>
							</div>
							<div class="meta-banner">
								<p>Meta de resolución: {{ proporcionEstados.data.metaEficiencia.metaPorcentajeResueltos }}%</p>
								<p>¿Cumple?: {{ proporcionEstados.data.metaEficiencia.cumplimientoGlobal ? 'Sí' : 'No' }}</p>
							</div>
						</div>
					</div>
<div v-if="activeReportId === 'eficiencia-cierre'" class="report-section">
						<div class="controls">
							<div class="control-pair">
								<span>Fecha inicio</span>
								<input type="date" v-model="eficienciaCierre.payload.fechaInicio" class="date-input" />
							</div>
							<div class="control-pair">
								<span>Fecha fin</span>
								<input type="date" v-model="eficienciaCierre.payload.fechaFin" class="date-input" />
							</div>
						</div>
						<div class="actions">
							<ion-button @click="generateEficienciaCierre" :disabled="eficienciaCierre.loading">
								<ion-icon :icon="refreshOutline" slot="start" />
								Generar reporte
							</ion-button>
							<ion-spinner v-if="eficienciaCierre.loading" />
						</div>
						<ion-note color="danger" v-if="eficienciaCierre.error">{{ eficienciaCierre.error }}</ion-note>
						<div v-if="eficienciaCierre.data" class="visualizations">
							<div class="kpi-grid">
								<kpi-card label="Tasa global" :value="formatPercent(eficienciaCierre.data.tasaCierreGlobal)" description="Sobre incidentes" accent="primary" />
								<kpi-card label="Total resueltos" :value="eficienciaCierre.data.totalResueltos" description="Periodo" accent="success" />
							</div>
							<div class="visual-card">
								<analytics-chart v-if="eficienciaCierreLineData" type="line" :data="eficienciaCierreLineData" :options="lineOptions" :height="320" />
								<analytics-chart v-if="eficienciaCategoriaBarData" type="bar" :data="eficienciaCategoriaBarData" :options="barOptions" :height="320" />
							</div>
							<div class="table-card">
								<div class="table-header">
									<h4>Detalle</h4>
									<ion-button fill="clear" size="small" @click="exportToCSV('eficiencia-cierre', ['Ruta', 'Incidentes', 'Resueltos', 'Tasa cierre', 'Tiempo prom. (días)'], eficienciaCierre.data?.eficienciaPorRuta.map(r => [r.ruta.nombre, r.totalIncidentes, r.resueltos, formatPercent(r.tasaCierre), r.tiempoPromedioResolucionDias]) ?? [])" :disabled="!eficienciaCierre.data">
										<ion-icon :icon="downloadOutline" slot="icon-only" />
									</ion-button>
								</div>
								<table class="data-table">
									<thead>
										<tr>
											<th>Zona</th>
											<th>Incidentes</th>
											<th>Resueltos</th>
											<th>Tasa de cierre</th>
											<th>Tiempo prom. (días)</th>
										</tr>
									</thead>
									<tbody>
										<tr v-for="ruta in eficienciaCierre.data.eficienciaPorRuta" :key="ruta.ruta.id">
											<td>{{ ruta.ruta.nombre }}</td>
											<td>{{ ruta.totalIncidentes }}</td>
											<td>{{ ruta.resueltos }}</td>
											<td>{{ formatPercent(ruta.tasaCierre) }}</td>
											<td>{{ ruta.tiempoPromedioResolucionDias }}</td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>
					</div>
					</div>
				</main>
			</div>
		</ion-content>
	</ion-page>
</template>

<script setup lang="ts">
import {
	IonButton,
	IonContent,
	IonDatetime,
	IonHeader,
	IonIcon,
	IonInput,
	IonItem,
	IonLabel,
	IonNote,
	IonPage,
	IonSelect,
	IonSelectOption,
	IonSpinner,
	IonTitle,
	IonToolbar,
	IonCheckbox,
	IonAccordion,
	IonAccordionGroup,
	IonGrid,
	IonRow,
	IonCol,
	onIonViewWillEnter,
	onIonViewWillLeave,
} from '@ionic/vue';
import { computed, reactive, ref, watch, onMounted } from 'vue';
import {
	refreshOutline,
	pieChartOutline,
	trendingUpOutline,
	timeOutline,
	alertCircleOutline,
	calendarOutline,
	calendarNumberOutline,
	leafOutline,
	gridOutline,
	repeatOutline,
	mapOutline,
	hourglassOutline,
	listOutline,
	checkmarkDoneCircleOutline,
	settingsOutline,
	downloadOutline,
} from 'ionicons/icons';
import AnalyticsChart from '@/components/AnalyticsChart.vue';
import KpiCard from '@/components/KpiCard.vue';
import OverviewFilterBar from '@/components/OverviewFilterBar.vue';
import { useAnalyticsApi } from '@/composables/useAnalyticsApi';
import { useSession } from '@/composables/useSession';
import { useOverviewState } from '@/composables/useOverviewState';
import { useSidebar } from '@/composables/useSidebar';
import type { ChartData, ChartOptions } from 'chart.js';
import type {
	DateRangePayload,
	TendenciasCategoriasResponse,
	EvolucionCategoriasResponse,
	AnalisisHorarioResponse,
	RutasCriticasResponse,
	ComparacionMensualResponse,
	ComparacionAnualResponse,
	AnalisisEstacionalResponse,
	PatronesHorariosResponse,
	IncidentesRecurrentesResponse,
	ComparacionZonasResponse,
	TiempoResolucionResponse,
	RankingTendenciaRutasResponse,
	ProporcionEstadosResponse,
	EficienciaCierreResponse,
	AgrupacionTemporal,
	SegmentoClave,
	DayOfWeek,
	SegmentoDetalle,
} from '@/types/analytics';

// --- TYPES IMPORTED FROM @/types/analytics ---

// --- STATE & API ---
const session = useSession();
const { postReport } = useAnalyticsApi({ getToken: () => session.authToken.value ?? undefined });
const { setMinimized } = useSidebar();

const getMonthName = (dateStr: string) => {
	const [year, month] = dateStr.split('-');
	const date = new Date(Number(year), Number(month) - 1, 1);
	return date.toLocaleDateString('es-ES', { month: 'long' });
};

onIonViewWillEnter(() => {
	setMinimized(true);
});

onIonViewWillLeave(() => {
	setMinimized(false);
});

const colorPalette = ['#2563eb', '#22c55e', '#f97316', '#a855f7', '#0ea5e9', '#ef4444', '#14b8a6', '#f59e0b'];
const extendedPalette = [...colorPalette, '#f472b6', '#10b981', '#f87171', '#2dd4bf', '#fbbf24', '#6366f1'];

const pieOptions: ChartOptions<'pie'> = { plugins: { legend: { position: 'bottom' } }, maintainAspectRatio: false };
const donutOptions: ChartOptions<'doughnut'> = { plugins: { legend: { position: 'bottom' } }, cutout: '60%', maintainAspectRatio: false };
const lineOptions: ChartOptions<'line'> = { maintainAspectRatio: false, interaction: { intersect: false, mode: 'index' }, plugins: { legend: { position: 'bottom' } } };
const barOptions: ChartOptions<'bar'> = { maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } };
const stackedBarOptions: ChartOptions<'bar'> = { maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } } };
const horizontalBarOptions: ChartOptions<'bar'> = { ...barOptions, indexAxis: 'y' };
const dualAxisBarOptions: ChartOptions<'bar'> = { maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true, position: 'left' }, y1: { beginAtZero: true, position: 'right', grid: { drawOnChartArea: false } } } };

type SectionState<TPayload, TResponse> = { payload: TPayload; loading: boolean; error: string; data: TResponse | null };
const createSectionState = <TPayload, TResponse>(payload: TPayload): SectionState<TPayload, TResponse> => reactive({ payload, loading: false, error: '', data: null as TResponse | null }) as SectionState<TPayload, TResponse>;

const defaultRange = (days = 30): DateRangePayload => {
	const end = new Date();
	const start = new Date();
	start.setDate(end.getDate() - days);
	return { fechaInicio: start.toISOString().split('T')[0], fechaFin: end.toISOString().split('T')[0] };
};
const formatMonth = (date: Date) => date.toISOString().slice(0, 7);
const defaultMonthRange = () => {
	const now = new Date();
	const prev = new Date(now);
	prev.setMonth(prev.getMonth() - 1);
	return { mes1: formatMonth(prev), mes2: formatMonth(now) };
};

const currentYear = new Date().getFullYear();

// --- REPORTS STATE ---
const tendenciasCategorias = createSectionState<DateRangePayload, TendenciasCategoriasResponse>(defaultRange());
const evolucionCategorias = createSectionState<DateRangePayload & { agrupacion: AgrupacionTemporal }, EvolucionCategoriasResponse>({ ...defaultRange(90), agrupacion: 'MENSUAL' });
const analisisHorario = createSectionState<DateRangePayload, AnalisisHorarioResponse>(defaultRange());
const rutasCriticas = createSectionState<DateRangePayload & { top: number }, RutasCriticasResponse>({ ...defaultRange(120), top: 5 });
const comparacionMensual = createSectionState<{ mes1: string; mes2: string }, ComparacionMensualResponse>(defaultMonthRange());
const comparacionAnual = createSectionState<{ anio1: number; anio2: number }, ComparacionAnualResponse>({ anio1: currentYear - 1, anio2: currentYear });
const analisisEstacional = createSectionState<{ anio: number }, AnalisisEstacionalResponse>({ anio: currentYear });
const patronesHorarios = createSectionState<DateRangePayload, PatronesHorariosResponse>(defaultRange(60));
const incidentesRecurrentes = createSectionState<DateRangePayload & { umbralRecurrencia: number }, IncidentesRecurrentesResponse>({ ...defaultRange(180), umbralRecurrencia: 10 });
const comparacionZonas = createSectionState<DateRangePayload, ComparacionZonasResponse>(defaultRange(120));
const tiempoResolucion = createSectionState<DateRangePayload, TiempoResolucionResponse>({ fechaInicio: '2020-01-01', fechaFin: new Date().toISOString().split('T')[0] });
const rankingTendenciaRutas = createSectionState<DateRangePayload & { agrupacion: AgrupacionTemporal; top: number }, RankingTendenciaRutasResponse>({ ...defaultRange(365), agrupacion: 'MENSUAL', top: 5 });
const proporcionEstados = createSectionState<DateRangePayload, ProporcionEstadosResponse>(defaultRange(180));
const eficienciaCierre = createSectionState<DateRangePayload, EficienciaCierreResponse>(defaultRange(365));

// --- API ACTIONS ---
const runReport = async <TPayload, TResponse>(endpoint: string, state: SectionState<TPayload, TResponse>) => {
	state.loading = true;
	state.error = '';
	try {
		// Clone payload to modify date strings without affecting state
		const payload: any = { ...(state.payload as any) };

		// Append default times if dates are simple YYYY-MM-DD
		if (payload.fechaInicio && typeof payload.fechaInicio === 'string' && payload.fechaInicio.length === 10) {
			payload.fechaInicio = `${payload.fechaInicio}T00:00:00`;
		}
		if (payload.fechaFin && typeof payload.fechaFin === 'string' && payload.fechaFin.length === 10) {
			payload.fechaFin = `${payload.fechaFin}T23:59:59`;
		}

		state.data = await postReport<TResponse>(endpoint, payload);
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
const generateRutasCriticas = () => runReport('rutas-criticas', rutasCriticas);
const generateComparacionMensual = () => runReport('comparacion-mensual', comparacionMensual);
const generateComparacionAnual = () => runReport('comparacion-anual', comparacionAnual);
const generateAnalisisEstacional = () => runReport('analisis-estacional', analisisEstacional);
const generatePatronesHorarios = () => runReport('patrones-horarios', patronesHorarios);
const generateIncidentesRecurrentes = () => runReport('incidentes-recurrentes', incidentesRecurrentes);
const generateComparacionZonas = () => runReport('comparacion-zonas', comparacionZonas);
const generateTiempoResolucion = () => runReport('tiempo-resolucion', tiempoResolucion);
const generateRankingRutas = () => runReport('ranking-tendencia-rutas', rankingTendenciaRutas);
const generateProporcionEstados = () => runReport('proporcion-estados', proporcionEstados);
const generateEficienciaCierre = () => runReport('eficiencia-cierre', eficienciaCierre);

const formatPercent = (value: number, digits = 1) => `${value.toFixed(digits)}%`;

const exportToCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
	const csvContent = [
		headers.join(','),
		...rows.map(row => row.map(cell => `"${cell}"`).join(','))
	].join('\n');

	const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
	const link = document.createElement('a');
	if (link.download !== undefined) {
		const url = URL.createObjectURL(blob);
		link.setAttribute('href', url);
		link.setAttribute('download', `${filename}.csv`);
		link.style.visibility = 'hidden';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}
};



// --- CHARTS DATA COMPUTED ---
const buildDonutDataset = (entries: Array<{ label: string; value: number }>): ChartData<'doughnut'> => ({
	labels: entries.map((entry) => entry.label),
	datasets: [{ data: entries.map((entry) => entry.value), backgroundColor: entries.map((_, idx) => extendedPalette[idx % extendedPalette.length]) }],
});

const tendenciasPieData = computed<ChartData<'pie'> | null>(() => {
	const data = activeReportId.value === 'overview' ? overviewState.reports.tendenciasCategorias.data : tendenciasCategorias.data;
	if (!data) return null;
	return {
		labels: data.categorias.map((cat) => cat.nombre),
		datasets: [{ data: data.categorias.map((cat) => cat.porcentaje), backgroundColor: data.categorias.map((_, idx) => colorPalette[idx % colorPalette.length]) }],
	};
});

const evolucionLineData = computed<ChartData<'line'> | null>(() => {
	const data = activeReportId.value === 'overview' ? overviewState.reports.evolucionCategorias.data : evolucionCategorias.data;
	if (!data) return null;
	const labels = data.totalIncidentesPorPeriodo?.map((per) => per.periodo) ?? [];
	return {
		labels,
		datasets: data.evolucionPorCategoria.map((cat, idx) => ({
			label: cat.categoriaNombre,
			data: labels.map((label) => cat.datosTemporales.find((p) => p.periodo === label)?.cantidad ?? 0),
			borderColor: colorPalette[idx % colorPalette.length],
			fill: false,
			borderWidth: 2,
		})),
	};
});

const horarioBarData = computed<ChartData<'bar'> | null>(() => {
	const data = activeReportId.value === 'overview' ? overviewState.reports.analisisHorario.data : analisisHorario.data;
	if (!data) return null;
	return {
		labels: data.analisisPorHorario.map((item) => `${item.hora} h`),
		datasets: [{ label: 'Incidentes', backgroundColor: '#3b82f6', data: data.analisisPorHorario.map((item) => item.cantidadIncidentes) }],
	};
});

const rutasCriticasStackedData = computed<ChartData<'bar'> | null>(() => {
	const data = activeReportId.value === 'overview' ? overviewState.reports.rutasCriticas.data : rutasCriticas.data;
	if (!data) return null;
	const labels = data.topRutasCriticas.map((ruta) => ruta.ruta.nombre);
	const categoriaSet = new Set<string>();
	data.topRutasCriticas.forEach((ruta) => ruta.categoriasPrincipales.forEach((cat) => categoriaSet.add(cat.nombre)));
	const categorias = Array.from(categoriaSet);
	return {
		labels,
		datasets: categorias.map((cat, idx) => ({
			label: cat,
			data: data.topRutasCriticas.map((ruta) => ruta.categoriasPrincipales.find((c) => c.nombre === cat)?.cantidad ?? 0),
			backgroundColor: extendedPalette[idx % extendedPalette.length],
			stack: 'categorias',
		})),
	};
});

const comparacionMensualCategoriaData = computed(() => {
	const data = activeReportId.value === 'overview' ? overviewState.reports.comparacionMensual.data : comparacionMensual.data;
	if (!data) return null;
	return {
		periodo1: buildDonutDataset(data.periodo1.porCategoria.map((cat) => ({ label: cat.categoria, value: cat.porcentaje }))),
		periodo2: buildDonutDataset(data.periodo2.porCategoria.map((cat) => ({ label: cat.categoria, value: cat.porcentaje }))),
	};
});

const comparacionMensualEstadoData = computed(() => {
	const data = activeReportId.value === 'overview' ? overviewState.reports.comparacionMensual.data : comparacionMensual.data;
	if (!data) return null;
	return {
		periodo1: buildDonutDataset(data.periodo1.porEstado.map((estado) => ({ label: estado.estado, value: estado.porcentaje }))),
		periodo2: buildDonutDataset(data.periodo2.porEstado.map((estado) => ({ label: estado.estado, value: estado.porcentaje }))),
	};
});

const comparacionAnualLineData = computed<ChartData<'line'> | null>(() => {
	const data = activeReportId.value === 'overview' ? overviewState.reports.comparacionAnual.data : comparacionAnual.data;
	if (!data || !data.periodo1 || !data.periodo2) return null;

	const allMonths = [
		'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
		'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
	];

	// Helper to extract data for each month (0-11) from the YYYY-MM response
	const buildSeries = (evolucion: Array<{ mes: string; total: number }>) => {
		// Initialize array with 0s for 12 months
		const series = new Array(12).fill(0);
		if (!Array.isArray(evolucion)) return series;
		
		evolucion.forEach((item: any) => {
			const mesStr = item.mes || item.periodo; // Handle potential 'periodo' prop
			const totalVal = item.total ?? item.cantidad ?? 0; // Handle potential 'cantidad' prop

			if (mesStr && mesStr.length >= 7) {
				const monthIndex = parseInt(mesStr.slice(5, 7), 10) - 1;
				if (monthIndex >= 0 && monthIndex < 12) {
					series[monthIndex] = totalVal;
				}
			}
		});
		return series;
	};

	return {
		labels: allMonths,
		datasets: [
			{ label: `${data.periodo1.anio ?? 'Año 1'}`, data: buildSeries(data.periodo1.evolucionMensual), borderColor: colorPalette[0], fill: false, borderWidth: 2 },
			{ label: `${data.periodo2.anio ?? 'Año 2'}`, data: buildSeries(data.periodo2.evolucionMensual), borderColor: colorPalette[1], fill: false, borderWidth: 2 },
		],
	};
});

const analisisEstacionalBarData = computed<ChartData<'bar'> | null>(() => {
	const data = activeReportId.value === 'overview' ? overviewState.reports.analisisEstacional.data : analisisEstacional.data;
	if (!data) return null;
	return {
		labels: data.analisisPorEstacion.map((item) => item.estacion),
		datasets: [
			{ label: 'Incidentes', data: data.analisisPorEstacion.map((item) => item.cantidadIncidentes), backgroundColor: '#2563eb', yAxisID: 'y' },
			{ label: '% participación', data: data.analisisPorEstacion.map((item) => item.porcentaje), backgroundColor: '#f97316', yAxisID: 'y1' },
		],
	};
});

const segmentOrder: SegmentoClave[] = ['madrugada', 'manana', 'tarde', 'noche'];
const segmentLabels: Record<SegmentoClave, string> = { madrugada: 'Madrugada', manana: 'Mañana', tarde: 'Tarde', noche: 'Noche' };
const dayOrder: DayOfWeek[] = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
const dayLabels: Record<DayOfWeek, string> = { lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles', jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sábado', domingo: 'Domingo' };

const patronesSegmentosChartData = computed<ChartData<'bar'> | null>(() => {
	const data = activeReportId.value === 'overview' ? overviewState.reports.patronesHorarios.data : patronesHorarios.data;
	if (!data) return null;
	const labels = dayOrder.map((day) => dayLabels[day]);
	const datasets = segmentOrder
		.map((segment, idx) => {
			const dayValues = data.distribucionPorDiaSemana?.[segment];
			const values = dayOrder.map((day) => (dayValues ? dayValues[day] ?? 0 : 0));
			return { label: segmentLabels[segment], data: values, backgroundColor: extendedPalette[idx % extendedPalette.length] };
		})
		.filter((dataset) => dataset.data.some((value) => value > 0));
	if (!datasets.length) return null;
	return { labels, datasets };
});

type SegmentCard = { key: SegmentoClave; label: string; detalle: Exclude<SegmentoDetalle, null> };
const patronesSegmentCards = computed<SegmentCard[]>(() => {
	const data = activeReportId.value === 'overview' ? overviewState.reports.patronesHorarios.data : patronesHorarios.data;
	if (!data) return [];
	return segmentOrder.map((segment) => ({ key: segment, label: segmentLabels[segment], detalle: data.patronesPorSegmento[segment] })).filter((segmento): segmento is SegmentCard => Boolean(segmento.detalle));
});

const incidentesRecurrentesBarData = computed<ChartData<'bar'> | null>(() => {
	const data = activeReportId.value === 'overview' ? overviewState.reports.incidentesRecurrentes.data : incidentesRecurrentes.data;
	if (!data || !data.incidentesRecurrentes.length) return null;
	const top = data.incidentesRecurrentes.slice(0, 6);
	return {
		labels: top.map((item) => `${item.ruta.nombre} - ${item.categoria.nombre}`),
		datasets: [{ label: 'Incidentes', data: top.map((item) => item.cantidadIncidentes), backgroundColor: '#f97316' }],
	};
});

const comparacionZonasStackedData = computed<ChartData<'bar'> | null>(() => {
	const data = activeReportId.value === 'overview' ? overviewState.reports.comparacionZonas.data : comparacionZonas.data;
	if (!data) return null;
	const labels = data.comparacionPorZona.map((zona) => zona.ruta.nombre);
	const categoriaSet = new Set<string>();
	// Backend returns 'categoria' property, not 'nombre', checking multiple possibilities
	data.comparacionPorZona.forEach((zona) => 
		zona.distribucionCategorias.forEach((cat: any) => 
			categoriaSet.add(cat.categoriaNombre || cat.categoria || cat.nombre || 'Sin Categoría')
		)
	);
	const categorias = Array.from(categoriaSet);
	return {
		labels,
		datasets: categorias.map((cat, idx) => ({
			label: cat,
			data: data.comparacionPorZona.map((zona) => {
				// Match loose type
				const categoryData = zona.distribucionCategorias.find((c: any) => (c.categoriaNombre || c.categoria || c.nombre || 'Sin Categoría') === cat);
				return categoryData?.cantidad ?? 0;
			}),
			backgroundColor: extendedPalette[idx % extendedPalette.length],
			stack: 'zonas',
		})),
	};
});

const tiempoResolucionBarData = computed<ChartData<'bar'> | null>(() => {
	const data = activeReportId.value === 'overview' ? overviewState.reports.tiempoResolucion.data : tiempoResolucion.data;
	if (!data) return null;
	return {
		labels: data.tiempoPorCategoria.map((item) => item.categoria.nombre),
		datasets: [{ label: 'Promedio días', data: data.tiempoPorCategoria.map((item) => item.promedioDias), backgroundColor: '#0ea5e9' }],
	};
});

const rankingRutasLineData = computed<ChartData<'line'> | null>(() => {
	const data = activeReportId.value === 'overview' ? overviewState.reports.rankingTendenciaRutas.data : rankingTendenciaRutas.data;
	if (!data) return null;
	const labelsSet = new Set<string>();
	data.rankingRutas.forEach((ruta) => ruta.evolucionTemporal.forEach((punto) => labelsSet.add(punto.periodo)));
	const labels = Array.from(labelsSet).sort();
	return {
		labels,
		datasets: data.rankingRutas.map((ruta, idx) => ({
			label: ruta.ruta.nombre,
			data: labels.map((label) => ruta.evolucionTemporal.find((p) => p.periodo === label)?.cantidad ?? 0),
			borderColor: extendedPalette[idx % extendedPalette.length],
			fill: false,
			borderWidth: 2,
		})),
	};
});

const proporcionEstadosDonut = computed<ChartData<'doughnut'> | null>(() => {
	const data = activeReportId.value === 'overview' ? overviewState.reports.proporcionEstados.data : proporcionEstados.data;
	if (!data) return null;
	return buildDonutDataset([
		{ label: 'Resueltos', value: data.proporcionGlobal.porcentajeResueltos },
		{ label: 'Pendientes', value: data.proporcionGlobal.porcentajePendientes },
		{ label: 'En proceso', value: data.proporcionGlobal.porcentajeEnProceso },
	]);
});

const proporcionEstadosCategoriaStacked = computed<ChartData<'bar'> | null>(() => {
	const data = activeReportId.value === 'overview' ? overviewState.reports.proporcionEstados.data : proporcionEstados.data;
	if (!data) return null;
	const labels = data.proporcionPorCategoria.map((item) => item.categoria.nombre);
	return {
		labels,
		datasets: [
			{ label: 'Resueltos', data: data.proporcionPorCategoria.map((item) => item.porcentajeResueltos), backgroundColor: '#22c55e', stack: 'estado' },
			{ label: 'Pendientes', data: data.proporcionPorCategoria.map((item) => item.porcentajePendientes), backgroundColor: '#ef4444', stack: 'estado' },
			{ label: 'En proceso', data: data.proporcionPorCategoria.map((item) => item.porcentajeEnProceso), backgroundColor: '#f59e0b', stack: 'estado' },
		],
	};
});

const eficienciaCierreLineData = computed<ChartData<'line'> | null>(() => {
	const data = activeReportId.value === 'overview' ? overviewState.reports.eficienciaCierre.data : eficienciaCierre.data;
	if (!data) return null;
	return {
		labels: data.evolucionMensual.map((item) => item.mes),
		datasets: [{ label: 'Tasa de cierre (%)', data: data.evolucionMensual.map((item) => item.tasaCierre), borderColor: '#16a34a', fill: false, borderWidth: 2 }],
	};
});

const eficienciaCategoriaBarData = computed<ChartData<'bar'> | null>(() => {
	const data = activeReportId.value === 'overview' ? overviewState.reports.eficienciaCierre.data : eficienciaCierre.data;
	if (!data) return null;
	return {
		labels: data.eficienciaPorCategoria.map((item) => item.categoria.nombre),
		datasets: [{ label: 'Tasa de cierre (%)', data: data.eficienciaPorCategoria.map((item) => item.tasaCierre), backgroundColor: '#9333ea' }],
	};
});

// --- NAVIGATION ---
const reports = [
	{ id: 'overview', label: 'Vista General', icon: gridOutline },
	{ id: 'tendencias-categorias', label: 'Tendencias por categoría', icon: pieChartOutline },
	{ id: 'evolucion-categorias', label: 'Evolución de categorías', icon: trendingUpOutline },
	{ id: 'analisis-horario', label: 'Análisis por horario', icon: timeOutline },
	{ id: 'rutas-criticas', label: 'Zonas críticas', icon: alertCircleOutline },
	{ id: 'comparacion-mensual', label: 'Comparación mensual', icon: calendarOutline },
	{ id: 'comparacion-anual', label: 'Comparación anual', icon: calendarNumberOutline },
	{ id: 'analisis-estacional', label: 'Análisis estacional', icon: leafOutline },
	{ id: 'patrones-horarios', label: 'Patrones horarios', icon: gridOutline },
	{ id: 'incidentes-recurrentes', label: 'Incidentes recurrentes', icon: repeatOutline },
	{ id: 'comparacion-zonas', label: 'Comparación por zonas', icon: mapOutline },
	{ id: 'tiempo-resolucion', label: 'Tiempo de resolución', icon: hourglassOutline },
	{ id: 'ranking-rutas', label: 'Ranking de tendencia', icon: listOutline },
	{ id: 'proporcion-estados', label: 'Proporción de estados', icon: pieChartOutline },
	{ id: 'eficiencia-cierre', label: 'Eficiencia de cierre', icon: checkmarkDoneCircleOutline },
];

const activeReportId = ref(reports[0].id);
const activeReport = computed(() => reports.find((r) => r.id === activeReportId.value));

// --- OVERVIEW STATE ---
const overviewState = useOverviewState();
const showOverviewSettings = ref(false);
const overviewSettings = reactive<Record<string, boolean>>({});

const loadOverviewSettings = () => {
	const saved = localStorage.getItem('analytics_overview_settings');
	if (saved) {
		try {
			const parsed = JSON.parse(saved);
			Object.assign(overviewSettings, parsed);
		} catch (e) {
			console.error('Error loading overview settings', e);
		}
	}
	// Ensure all reports have a default value if not present
	reports.filter(r => r.id !== 'overview').forEach(r => {
		if (overviewSettings[r.id] === undefined) {
			overviewSettings[r.id] = false; // Default to hidden
		}
	});
};

const saveOverviewSettings = () => {
	localStorage.setItem('analytics_overview_settings', JSON.stringify(overviewSettings));
};

watch(overviewSettings, () => {
	saveOverviewSettings();
}, { deep: true });

const loadOverviewData = async () => {
	await overviewState.fetchOverviewData(overviewSettings);
};

const refreshOverview = () => {
	loadOverviewData();
};

// Load settings on mount
onMounted(() => {
	loadOverviewSettings();
	if (activeReportId.value === 'overview') {
		loadOverviewData();
	}
});

// Watch for tab change to overview to load data
watch(activeReportId, (newId) => {
	if (newId === 'overview') {
		loadOverviewData();
	}
});
</script>

<style scoped>


.dashboard-container {
	display: flex;
	height: 100%;
	background: var(--page-bg);
	font-family: inherit;
}

.dashboard-sidebar {
	width: 280px;
	background: var(--card-bg);
	border-right: 1px solid var(--border-color);
	display: flex;
	flex-direction: column;
	overflow-y: auto;
	flex-shrink: 0;
}

.sidebar-header {
	padding: 24px 20px;
	border-bottom: 1px solid var(--border-color);
}

.sidebar-header h2 {
	margin: 0;
	font-size: 1.25rem;
	font-weight: 700;
	color: #0f172a; /* Slate 900 */
	letter-spacing: -0.025em;
}

.sidebar-nav {
	padding: 16px 12px;
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.nav-button {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 12px 16px;
	border: none;
	background: transparent;
	border-radius: var(--radius-sm);
	cursor: pointer;
	color: var(--ion-text-secondary);
	font-size: 0.95rem;
	font-weight: 500;
	text-align: left;
	transition: all 0.2s ease;
	font-family: inherit;
}

.nav-button:hover {
	background: #f1f5f9;
	color: var(--ion-text-color);
}

.nav-button.active {
	background: #eff6ff;
	color: var(--ion-color-primary);
	font-weight: 600;
}

.nav-button ion-icon {
	font-size: 1.25rem;
}

.dashboard-content {
	flex: 1;
	display: flex;
	flex-direction: column;
	overflow-y: auto;
	padding: 32px;
	gap: 24px;
	/* Ensure content can grow */
	min-height: 0;
}

.content-header h1 {
	margin: 0 0 8px;
	font-size: 1.8rem;
	font-weight: 700;
	color: #0f172a; /* Slate 900 */
	letter-spacing: -0.025em;
}

.subtitle {
	margin: 0;
	color: #64748b; /* Slate 500 */
	font-size: 1rem;
}

.report-container {
	background: var(--card-bg);
	border-radius: var(--radius-lg);
	padding: 24px;
	box-shadow: var(--shadow-md);
	/* Use auto to ensure it grows with content */
	height: auto;
	min-height: 400px;
	display: flex;
	flex-direction: column;
	flex-shrink: 0;
	border: 1px solid var(--border-color);
}

.report-section {
	display: flex;
	flex-direction: column;
	gap: 24px;
	width: 100%;
}

/* Reused styles from original with improvements */
.controls {
	display: flex;
	flex-wrap: wrap;
	gap: 16px;
	margin-bottom: 24px;
	padding: 20px;
	background: #f8fafc;
	border-radius: var(--radius-md);
	border: 1px solid var(--border-color);
}

.control-pair {
	display: flex;
	flex-direction: column;
	gap: 8px;
	min-width: 200px;
}

.control-pair span {
	font-size: 0.75rem;
	font-weight: 700;
	color: var(--ion-text-secondary);
	text-transform: uppercase;
	letter-spacing: 0.05em;
}

.actions {
	display: flex;
	align-items: center;
	gap: 16px;
	margin-bottom: 24px;
}

.visualizations {
	display: flex;
	flex-direction: column;
	gap: 24px;
}

.visual-row {
	display: flex;
	gap: 24px;
}

.date-input {
	height: 44px;
	border-radius: 12px;
	border: 1px solid rgba(148, 163, 184, 0.6);
	padding: 0 12px;
	font-size: 0.95rem;
	color: #1f2937;
	background: #ffffff;
	font-family: inherit;
	width: 100%;
}

.visual-card, .table-card {
	flex: 1;
	min-width: 350px;
	background: var(--card-bg);
	border: 1px solid var(--border-color);
	border-radius: var(--radius-md);
	padding: 20px;
	box-shadow: var(--shadow-sm);
}

.table-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 12px;
	padding-bottom: 8px;
	border-bottom: 1px solid var(--border-color);
}

.table-header h4 {
	margin: 0;
	font-size: 0.95rem;
	font-weight: 600;
	color: #0f172a;
}

.kpi-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
	gap: 16px;
	margin-bottom: 24px;
}

.data-table {
	width: 100%;
	border-collapse: separate;
	border-spacing: 0;
	font-size: 0.9rem;
}

.data-table th {
	background: #f8fafc;
	font-weight: 600;
	color: var(--ion-text-secondary);
	padding: 12px 16px;
	text-align: left;
	border-bottom: 1px solid var(--border-color);
	text-transform: uppercase;
	font-size: 0.75rem;
	letter-spacing: 0.05em;
}

.data-table td {
	padding: 14px 16px;
	border-bottom: 1px solid var(--border-color);
	color: var(--ion-text-color);
}

.data-table tr:last-child td {
	border-bottom: none;
}

.charts-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 24px;
}

.chart-card {
	background: var(--card-bg);
	border-radius: var(--radius-md);
	padding: 20px;
	border: 1px solid var(--border-color);
	display: flex;
	flex-direction: column;
	gap: 16px;
	box-shadow: var(--shadow-sm);
}

.chart-card h4 {
	margin: 0;
	font-size: 0.95rem;
	font-weight: 600;
	color: #0f172a; /* Slate 900 */
	text-align: center;
}

@media (max-width: 1024px) {
	.dashboard-container {
		flex-direction: column;
	}
	.dashboard-sidebar {
		width: 100%;
		height: auto;
		max-height: 200px;
		border-right: none;
		border-bottom: 1px solid var(--border-color);
	}
	.dashboard-content {
		padding: 16px;
	}
}

.tendencias-analisis {
	--background: var(--page-bg);
	--color: var(--ion-text-color);
	color: var(--ion-text-color);
}

.tendencias-analisis ion-content {
	--background: var(--page-bg);
	--color: var(--ion-text-color);
}

/* Force dark text for tables and inputs specifically */
.data-table th,
.data-table td {
	color: #0f172a !important;
}

.tendencias-analisis ion-input,
.tendencias-analisis ion-select,
.tendencias-analisis ion-datetime {
	color: #0f172a !important;
	--color: #0f172a !important;
	--placeholder-color: #64748b !important;
}

.overview-header {
	display: flex;
	justify-content: flex-end;
	margin-bottom: 16px;
}

.settings-panel {
	background: #f8fafc;
	padding: 16px;
	border-radius: var(--radius-md);
	border: 1px solid var(--border-color);
	margin-bottom: 24px;
}

.settings-panel h3 {
	margin: 0 0 16px;
	font-size: 1rem;
	font-weight: 600;
	color: #0f172a; /* Slate 900 */
}

.setting-item ion-checkbox {
	--label-color: #0f172a; /* Slate 900 */
	color: #0f172a;
	font-size: 0.95rem;
}

.settings-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
	gap: 12px;
}

.overview-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
	gap: 24px;
}

.overview-card {
	background: var(--card-bg);
	border: 1px solid var(--border-color);
	border-radius: var(--radius-md);
	padding: 16px;
	box-shadow: var(--shadow-sm);
	display: flex;
	flex-direction: column;
	gap: 12px;
	color: #0f172a; /* Slate 900 */
}

.overview-card.wide {
	grid-column: span 2;
}

@media (max-width: 768px) {
	.overview-card.wide {
		grid-column: span 1;
	}
}

.overview-card h4 {
	margin: 0;
	font-size: 1rem;
	font-weight: 600;
	color: #0f172a; /* Slate 900 */
	border-bottom: 1px solid var(--border-color);
	padding-bottom: 8px;
}

.chart-wrapper {
	flex: 1;
	min-height: 200px;
	position: relative;
}

.kpi-mini-grid {
	display: flex;
	gap: 16px;
	margin-bottom: 8px;
}

.kpi-mini {
	display: flex;
	flex-direction: column;
}

.kpi-mini .label {
	font-size: 0.75rem;
	color: #64748b; /* Slate 500 */
	text-transform: uppercase;
	font-weight: 700;
}

.kpi-mini .value {
	font-size: 1.1rem;
	font-weight: 700;
	color: #0f172a; /* Slate 900 */
}

.dual-chart-row {
	display: flex;
	gap: 16px;
}

.half-chart {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	color: #0f172a;
}

.half-chart small {
	color: #64748b;
	font-weight: 600;
	margin-bottom: 8px;
}

.text-success { color: var(--ion-color-success); }
.text-danger { color: var(--ion-color-danger); }

.segment-card h4 {
	margin: 0 0 8px;
	font-size: 0.95rem;
	font-weight: 600;
	color: #0f172a; /* Slate 900 */
}

.segment-card p {
	margin: 4px 0;
	font-size: 0.85rem;
	color: #64748b; /* Slate 500 */
}
</style>
