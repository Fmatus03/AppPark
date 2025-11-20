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
							<div class="visual-row">
								<div class="visual-card">
									<analytics-chart v-if="tendenciasPieData" type="pie" :data="tendenciasPieData" :options="pieOptions" :height="280" />
								</div>
								<div class="table-card">
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
							<div class="visual-card">
								<analytics-chart v-if="evolucionLineData" type="line" :data="evolucionLineData" :options="lineOptions" :height="320" />
							</div>
							<div class="table-card">
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

				<!-- 4. Rutas Críticas -->
				<ion-accordion value="rutas-criticas">
					<ion-item slot="header">
						<ion-label>
							<h2>Rutas críticas</h2>
							<p>Ranking de rutas con mayor número de incidentes</p>
						</ion-label>
					</ion-item>
					<div slot="content" class="section-content">
						<div class="controls">
							<div class="control-pair">
								<span>Fecha inicio</span>
								<ion-datetime v-model="rutasCriticas.payload.fechaInicio" presentation="date-time" />
							</div>
							<div class="control-pair">
								<span>Fecha fin</span>
								<ion-datetime v-model="rutasCriticas.payload.fechaFin" presentation="date-time" />
							</div>
							<div class="control-pair">
								<span>Top de rutas</span>
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
								<kpi-card label="Promedio por ruta" :value="rutasCriticas.data.estadisticas.promedioIncidentesPorRuta.toFixed(0)" description="Incidentes" accent="warning" />
								<kpi-card label="Ruta más crítica" :value="rutasCriticas.data.estadisticas.rutaMasCritica" description="Mayor carga" accent="danger" />
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
									<table class="data-table">
										<thead>
											<tr>
												<th>#</th>
												<th>Ruta</th>
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
				</ion-accordion>

				<!-- 5. Comparación mensual -->
				<ion-accordion value="comparacion-mensual">
					<ion-item slot="header">
						<ion-label>
							<h2>Comparación mensual</h2>
							<p>Contrasta dos meses para medir variaciones</p>
						</ion-label>
					</ion-item>
					<div slot="content" class="section-content">
						<div class="controls">
							<div class="control-pair">
								<span>Mes 1</span>
								<ion-datetime v-model="comparacionMensual.payload.mes1" presentation="month" />
							</div>
							<div class="control-pair">
								<span>Mes 2</span>
								<ion-datetime v-model="comparacionMensual.payload.mes2" presentation="month" />
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
				</ion-accordion>

				<!-- 6. Comparación anual -->
				<ion-accordion value="comparacion-anual">
					<ion-item slot="header">
						<ion-label>
							<h2>Comparación anual</h2>
							<p>Evalúa la evolución interanual por categoría</p>
						</ion-label>
					</ion-item>
					<div slot="content" class="section-content">
						<div class="controls">
							<div class="control-pair">
								<span>Año base</span>
								<ion-input type="number" v-model.number="comparacionAnual.payload.anio1" />
							</div>
							<div class="control-pair">
								<span>Año comparación</span>
								<ion-input type="number" v-model.number="comparacionAnual.payload.anio2" />
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
								<analytics-chart v-if="comparacionAnualLineData" type="line" :data="comparacionAnualLineData" :options="lineOptions" :height="320" />
							</div>
							<div class="table-card">
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
				</ion-accordion>

				<!-- 7. Análisis estacional -->
				<ion-accordion value="analisis-estacional">
					<ion-item slot="header">
						<ion-label>
							<h2>Análisis estacional</h2>
							<p>Comportamiento por estaciones del año</p>
						</ion-label>
					</ion-item>
					<div slot="content" class="section-content">
						<div class="controls">
							<div class="control-pair">
								<span>Año</span>
								<ion-input type="number" v-model.number="analisisEstacional.payload.anio" />
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
				</ion-accordion>

				<!-- 8. Patrones horarios -->
				<ion-accordion value="patrones-horarios">
					<ion-item slot="header">
						<ion-label>
							<h2>Patrones por segmento horario</h2>
							<p>Distribución por franjas y días</p>
						</ion-label>
					</ion-item>
					<div slot="content" class="section-content">
						<div class="controls">
							<div class="control-pair">
								<span>Fecha inicio</span>
								<ion-datetime v-model="patronesHorarios.payload.fechaInicio" presentation="date-time" />
							</div>
							<div class="control-pair">
								<span>Fecha fin</span>
								<ion-datetime v-model="patronesHorarios.payload.fechaFin" presentation="date-time" />
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
				</ion-accordion>

				<!-- 9. Incidentes recurrentes -->
				<ion-accordion value="incidentes-recurrentes">
					<ion-item slot="header">
						<ion-label>
							<h2>Incidentes recurrentes</h2>
							<p>Combinaciones ruta-categoría con recurrencia</p>
						</ion-label>
					</ion-item>
					<div slot="content" class="section-content">
						<div class="controls">
							<div class="control-pair">
								<span>Fecha inicio</span>
								<ion-datetime v-model="incidentesRecurrentes.payload.fechaInicio" presentation="date-time" />
							</div>
							<div class="control-pair">
								<span>Fecha fin</span>
								<ion-datetime v-model="incidentesRecurrentes.payload.fechaFin" presentation="date-time" />
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
								<table class="data-table">
									<thead>
										<tr>
											<th>Ruta</th>
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
				</ion-accordion>

				<!-- 10. Comparación por zonas -->
				<ion-accordion value="comparacion-zonas">
					<ion-item slot="header">
						<ion-label>
							<h2>Comparación por zonas</h2>
							<p>Distribución de incidentes por ruta</p>
						</ion-label>
					</ion-item>
					<div slot="content" class="section-content">
						<div class="controls">
							<div class="control-pair">
								<span>Fecha inicio</span>
								<ion-datetime v-model="comparacionZonas.payload.fechaInicio" presentation="date-time" />
							</div>
							<div class="control-pair">
								<span>Fecha fin</span>
								<ion-datetime v-model="comparacionZonas.payload.fechaFin" presentation="date-time" />
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
									<table class="data-table">
										<thead>
											<tr>
												<th>Ruta</th>
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
				</ion-accordion>

				<!-- 11. Tiempo de resolución -->
				<ion-accordion value="tiempo-resolucion">
					<ion-item slot="header">
						<ion-label>
							<h2>Tiempo de resolución</h2>
							<p>Promedios por categoría</p>
						</ion-label>
					</ion-item>
					<div slot="content" class="section-content">
						<div class="controls">
							<div class="control-pair">
								<span>Fecha inicio</span>
								<ion-datetime v-model="tiempoResolucion.payload.fechaInicio" presentation="date-time" />
							</div>
							<div class="control-pair">
								<span>Fecha fin</span>
								<ion-datetime v-model="tiempoResolucion.payload.fechaFin" presentation="date-time" />
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
				</ion-accordion>

				<!-- 12. Ranking de tendencia por ruta -->
				<ion-accordion value="ranking-rutas">
					<ion-item slot="header">
						<ion-label>
							<h2>Ranking de tendencia por ruta</h2>
							<p>Evolución temporal de las rutas principales</p>
						</ion-label>
					</ion-item>
					<div slot="content" class="section-content">
						<div class="controls">
							<div class="control-pair">
								<span>Fecha inicio</span>
								<ion-datetime v-model="rankingTendenciaRutas.payload.fechaInicio" presentation="date" />
							</div>
							<div class="control-pair">
								<span>Fecha fin</span>
								<ion-datetime v-model="rankingTendenciaRutas.payload.fechaFin" presentation="date" />
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
								<table class="data-table">
									<thead>
										<tr>
											<th>#</th>
											<th>Ruta</th>
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
				</ion-accordion>

				<!-- 13. Proporción de estados -->
				<ion-accordion value="proporcion-estados">
					<ion-item slot="header">
						<ion-label>
							<h2>Proporción de estados</h2>
							<p>Distribución resueltos / pendientes / en proceso</p>
						</ion-label>
					</ion-item>
					<div slot="content" class="section-content">
						<div class="controls">
							<div class="control-pair">
								<span>Fecha inicio</span>
								<ion-datetime v-model="proporcionEstados.payload.fechaInicio" presentation="date-time" />
							</div>
							<div class="control-pair">
								<span>Fecha fin</span>
								<ion-datetime v-model="proporcionEstados.payload.fechaFin" presentation="date-time" />
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
				</ion-accordion>

				<!-- 14. Eficiencia de cierre -->
				<ion-accordion value="eficiencia-cierre">
					<ion-item slot="header">
						<ion-label>
							<h2>Eficiencia de cierre</h2>
							<p>Tasa de cierre por categoría y ruta</p>
						</ion-label>
					</ion-item>
					<div slot="content" class="section-content">
						<div class="controls">
							<div class="control-pair">
								<span>Fecha inicio</span>
								<ion-datetime v-model="eficienciaCierre.payload.fechaInicio" presentation="date-time" />
							</div>
							<div class="control-pair">
								<span>Fecha fin</span>
								<ion-datetime v-model="eficienciaCierre.payload.fechaFin" presentation="date-time" />
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
								<table class="data-table">
									<thead>
										<tr>
											<th>Ruta</th>
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

type RutaRef = { id: number; nombre: string };
type CategoriaRef = { id: number; nombre: string };
type CategoriaDistribucion = { nombre: string; cantidad: number; porcentaje: number };
type DistribucionCategoriaSimple = { categoria: string; cantidad: number; porcentaje: number };
type DistribucionEstado = { estado: string; cantidad: number; porcentaje: number };

type RutasCriticasResponse = {
	periodoConsulta: PeriodoConsulta;
	totalIncidentes: number;
	totalRutas: number;
	topRutasCriticas: Array<{
		ranking: number;
		ruta: RutaRef;
		cantidadIncidentes: number;
		porcentaje: number;
		categoriasPrincipales: CategoriaDistribucion[];
	}>;
	estadisticas: {
		promedioIncidentesPorRuta: number;
		rutaMasCritica: string;
		rutaMenosCritica: string;
	};
};

type PeriodoMensualResumen = {
	mes: string;
	totalIncidentes: number;
	porCategoria: DistribucionCategoriaSimple[];
	porEstado: DistribucionEstado[];
};

type ComparacionMensualResponse = {
	periodo1: PeriodoMensualResumen;
	periodo2: PeriodoMensualResumen;
	comparacion: {
		variacionTotal: number;
		variacionPorcentual: number;
		tendencia: string;
	};
};

type PeriodoAnualResumen = {
	anio: number;
	totalIncidentes: number;
	promedioMensual: number;
	porCategoria: DistribucionCategoriaSimple[];
	evolucionMensual: Array<{ mes: string; total: number }>;
};

type ComparacionAnualResponse = {
	periodo1: PeriodoAnualResumen;
	periodo2: PeriodoAnualResumen;
	comparacion: {
		variacionTotal: number;
		variacionPorcentual: number;
		tendencia: string;
		categoriaConMayorCrecimiento?: string;
		categoriaConMayorDecrecimiento?: string;
	};
};

type AnalisisEstacionalResponse = {
	anio: number;
	totalIncidentes: number;
	analisisPorEstacion: Array<{
		estacion: string;
		periodo: string;
		cantidadIncidentes: number;
		porcentaje: number;
		promedioDiario: number;
		categoriasPrincipales: CategoriaDistribucion[];
	}>;
	estadisticas: {
		estacionConMasIncidentes: string;
		estacionConMenosIncidentes: string;
		diferenciaMaxima: number;
	};
};

type SegmentoClave = 'madrugada' | 'manana' | 'tarde' | 'noche';
type DayOfWeek = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';

type SegmentoDetalle = {
	rango: string;
	cantidadTotal: number;
	porcentaje: number;
	promedioDiario: number;
	categoriasPrincipales: CategoriaDistribucion[];
} | null;

type PatronesHorariosResponse = {
	periodoConsulta: PeriodoConsulta;
	totalIncidentes: number;
	patronesPorSegmento: Record<SegmentoClave, SegmentoDetalle>;
	distribucionPorDiaSemana: Record<SegmentoClave, Record<DayOfWeek, number>>;
};

type IncidenteRecurrenteDetalle = {
	ruta: RutaRef;
	categoria: CategoriaRef;
	cantidadIncidentes: number;
	porcentajeDelTotal: number;
	frecuenciaPromedioDias: number;
	ultimoIncidente: string;
};

type IncidentesRecurrentesResponse = {
	periodoConsulta: PeriodoConsulta;
	umbralRecurrencia: number;
	totalCombinacionesRecurrentes: number;
	incidentesRecurrentes: IncidenteRecurrenteDetalle[];
	estadisticas: {
		combinacionConMasIncidentes: string;
		rutaMasRecurrente: string;
		categoriaMasRecurrente: string;
		promedioFrecuenciaDias: number;
	};
};

type ComparacionZonasResponse = {
	periodoConsulta: PeriodoConsulta;
	totalIncidentes: number;
	comparacionPorZona: Array<{
		ruta: RutaRef;
		totalIncidentes: number;
		porcentaje: number;
		distribucionCategorias: CategoriaDistribucion[];
		categoriaDominante: string;
	}>;
	rankingPorCategoria: Record<string, Array<{ ruta: string; cantidad: number }>>;
};

type TiempoResolucionResponse = {
	periodoConsulta: PeriodoConsulta;
	totalIncidentesResueltos: number;
	promedioGeneralDias: number;
	promedioGeneralHoras: number;
	tiempoPorCategoria: Array<{
		categoria: CategoriaRef;
		cantidadResueltos: number;
		promedioDias: number;
		promedioHoras: number;
		minimoHoras: number;
		maximoHoras: number;
		medianaDias: number;
	}>;
};

type RankingTendenciaRutasResponse = {
	periodoConsulta: PeriodoConsulta;
	agrupacionTemporal: AgrupacionTemporal;
	rankingRutas: Array<{
		ranking: number;
		ruta: RutaRef;
		totalIncidentes: number;
		porcentaje: number;
		evolucionTemporal: Array<{ periodo: string; cantidad: number }>;
		tendencia: string;
		variacionPorcentual: number;
		prediccionProximoMes: number;
	}>;
	analisisGlobal: {
		rutaConTendenciaPositiva?: string;
		rutaConTendenciaNegativa?: string;
		rutaMasEstable?: string;
	};
};

type ProporcionEstadosResponse = {
	periodoConsulta: PeriodoConsulta;
	totalIncidentes: number;
	proporcionGlobal: {
		resueltos: number;
		porcentajeResueltos: number;
		pendientes: number;
		porcentajePendientes: number;
		enProceso: number;
		porcentajeEnProceso: number;
	};
	proporcionPorCategoria: Array<{
		categoria: CategoriaRef;
		totalIncidentes: number;
		resueltos: number;
		porcentajeResueltos: number;
		pendientes: number;
		porcentajePendientes: number;
		enProceso: number;
		porcentajeEnProceso: number;
		eficiencia: number;
	}>;
	proporcionPorRuta: Array<{
		ruta: RutaRef;
		totalIncidentes: number;
		resueltos: number;
		porcentajeResueltos: number;
		pendientes: number;
		porcentajePendientes: number;
		enProceso: number;
		porcentajeEnProceso: number;
		eficiencia: number;
	}>;
	metaEficiencia: {
		metaPorcentajeResueltos: number;
		cumplimientoGlobal: boolean;
		categoriasQueCumplen: string[];
		rutasQueCumplen: string[];
		brechaPromedio: number;
	};
};

type EficienciaCierreResponse = {
	periodoConsulta: PeriodoConsulta;
	totalIncidentes: number;
	totalResueltos: number;
	tasaCierreGlobal: number;
	eficienciaPorCategoria: Array<{
		categoria: CategoriaRef;
		totalIncidentes: number;
		resueltos: number;
		pendientes: number;
		enProceso: number;
		tasaCierre: number;
		tiempoPromedioResolucionDias: number;
	}>;
	eficienciaPorRuta: Array<{
		ruta: RutaRef;
		totalIncidentes: number;
		resueltos: number;
		pendientes: number;
		enProceso: number;
		tasaCierre: number;
		tiempoPromedioResolucionDias: number;
	}>;
	evolucionMensual: Array<{
		mes: string;
		totalIncidentes: number;
		resueltos: number;
		tasaCierre: number;
	}>;
};

const session = useSession();
const { postReport } = useAnalyticsApi({ getToken: () => session.authToken.value ?? undefined });

const colorPalette = ['#2563eb', '#22c55e', '#f97316', '#a855f7', '#0ea5e9', '#ef4444', '#14b8a6', '#f59e0b'];
const extendedPalette = [...colorPalette, '#f472b6', '#10b981', '#f87171', '#2dd4bf', '#fbbf24', '#6366f1'];

const pieOptions: ChartOptions<'pie'> = {
	plugins: {
		legend: { position: 'bottom' },
	},
	maintainAspectRatio: false,
};

const donutOptions: ChartOptions<'doughnut'> = {
	plugins: {
		legend: { position: 'bottom' },
	},
	cutout: '60%',
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

const stackedBarOptions: ChartOptions<'bar'> = {
	maintainAspectRatio: false,
	plugins: { legend: { position: 'bottom' } },
	scales: {
		x: { stacked: true },
		y: { stacked: true, beginAtZero: true },
	},
};

const horizontalBarOptions: ChartOptions<'bar'> = {
	...barOptions,
	indexAxis: 'y',
};

const dualAxisBarOptions: ChartOptions<'bar'> = {
	maintainAspectRatio: false,
	plugins: { legend: { position: 'bottom' } },
	scales: {
		y: { beginAtZero: true, position: 'left' },
		y1: { beginAtZero: true, position: 'right', grid: { drawOnChartArea: false } },
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

const formatMonth = (date: Date) => date.toISOString().slice(0, 7);
const defaultMonthRange = () => {
	const now = new Date();
	const prev = new Date(now);
	prev.setMonth(prev.getMonth() - 1);
	return { mes1: formatMonth(prev), mes2: formatMonth(now) };
};
const currentYear = new Date().getFullYear();

const tendenciasCategorias = createSectionState<DateRangePayload, TendenciasCategoriasResponse>(defaultRange());
const evolucionCategorias = createSectionState<DateRangePayload & { agrupacion: AgrupacionTemporal }, EvolucionCategoriasResponse>({
	...defaultRange(90),
	agrupacion: 'MENSUAL',
});
const analisisHorario = createSectionState<DateRangePayload, AnalisisHorarioResponse>(defaultRange());

const rutasCriticas = createSectionState<DateRangePayload & { top: number }, RutasCriticasResponse>({
	...defaultRange(120),
	top: 5,
});
const comparacionMensual = createSectionState<{ mes1: string; mes2: string }, ComparacionMensualResponse>(defaultMonthRange());
const comparacionAnual = createSectionState<{ anio1: number; anio2: number }, ComparacionAnualResponse>({
	anio1: currentYear - 1,
	anio2: currentYear,
});
const analisisEstacional = createSectionState<{ anio: number }, AnalisisEstacionalResponse>({ anio: currentYear });
const patronesHorarios = createSectionState<DateRangePayload, PatronesHorariosResponse>(defaultRange(60));
const incidentesRecurrentes = createSectionState<DateRangePayload & { umbralRecurrencia: number }, IncidentesRecurrentesResponse>({
	...defaultRange(180),
	umbralRecurrencia: 10,
});
const comparacionZonas = createSectionState<DateRangePayload, ComparacionZonasResponse>(defaultRange(120));
const tiempoResolucion = createSectionState<DateRangePayload, TiempoResolucionResponse>({
	fechaInicio: '2020-01-01T00:00:00',
	fechaFin: new Date().toISOString(),
});
const rankingTendenciaRutas = createSectionState<DateRangePayload & { agrupacion: AgrupacionTemporal; top: number }, RankingTendenciaRutasResponse>({
	...defaultRange(365),
	agrupacion: 'MENSUAL',
	top: 5,
});
const proporcionEstados = createSectionState<DateRangePayload, ProporcionEstadosResponse>(defaultRange(180));
const eficienciaCierre = createSectionState<DateRangePayload, EficienciaCierreResponse>(defaultRange(365));

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

const buildDonutDataset = (entries: Array<{ label: string; value: number }>): ChartData<'doughnut'> => ({
	labels: entries.map((entry) => entry.label),
	datasets: [
		{
			data: entries.map((entry) => entry.value),
			backgroundColor: entries.map((_, idx) => extendedPalette[idx % extendedPalette.length]),
		},
	],
});

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

const rutasCriticasStackedData = computed<ChartData<'bar'> | null>(() => {
	const data = rutasCriticas.data;
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

const comparacionMensualCategoriaData = computed<{
	periodo1: ChartData<'doughnut'>;
	periodo2: ChartData<'doughnut'>;
} | null>(() => {
	const data = comparacionMensual.data;
	if (!data) return null;
	return {
		periodo1: buildDonutDataset(
			data.periodo1.porCategoria.map((cat) => ({ label: cat.categoria, value: cat.porcentaje })),
		),
		periodo2: buildDonutDataset(
			data.periodo2.porCategoria.map((cat) => ({ label: cat.categoria, value: cat.porcentaje })),
		),
	};
});

const comparacionMensualEstadoData = computed<{
	periodo1: ChartData<'doughnut'>;
	periodo2: ChartData<'doughnut'>;
} | null>(() => {
	const data = comparacionMensual.data;
	if (!data) return null;
	return {
		periodo1: buildDonutDataset(data.periodo1.porEstado.map((estado) => ({ label: estado.estado, value: estado.porcentaje }))),
		periodo2: buildDonutDataset(data.periodo2.porEstado.map((estado) => ({ label: estado.estado, value: estado.porcentaje }))),
	};
});

const comparacionAnualLineData = computed<ChartData<'line'> | null>(() => {
	const data = comparacionAnual.data;
	if (!data) return null;
	const labelsSet = new Set([
		...data.periodo1.evolucionMensual.map((item) => item.mes),
		...data.periodo2.evolucionMensual.map((item) => item.mes),
	]);
	const labels = Array.from(labelsSet).sort();
	const buildSeries = (evolucion: Array<{ mes: string; total: number }>) =>
		labels.map((label) => evolucion.find((item) => item.mes === label)?.total ?? 0);
	return {
		labels,
		datasets: [
			{
				label: `${data.periodo1.anio}`,
				data: buildSeries(data.periodo1.evolucionMensual),
				borderColor: colorPalette[0],
				fill: false,
				borderWidth: 2,
			},
			{
				label: `${data.periodo2.anio}`,
				data: buildSeries(data.periodo2.evolucionMensual),
				borderColor: colorPalette[1],
				fill: false,
				borderWidth: 2,
			},
		],
	};
});

const analisisEstacionalBarData = computed<ChartData<'bar'> | null>(() => {
	const data = analisisEstacional.data;
	if (!data) return null;
	return {
		labels: data.analisisPorEstacion.map((item) => item.estacion),
		datasets: [
			{
				label: 'Incidentes',
				data: data.analisisPorEstacion.map((item) => item.cantidadIncidentes),
				backgroundColor: '#2563eb',
				yAxisID: 'y',
			},
			{
				label: '% participación',
				data: data.analisisPorEstacion.map((item) => item.porcentaje),
				backgroundColor: '#f97316',
				yAxisID: 'y1',
			},
		],
	};
});

const segmentOrder: SegmentoClave[] = ['madrugada', 'manana', 'tarde', 'noche'];
const segmentLabels: Record<SegmentoClave, string> = {
	madrugada: 'Madrugada',
	manana: 'Mañana',
	tarde: 'Tarde',
	noche: 'Noche',
};
const dayOrder: DayOfWeek[] = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
const dayLabels: Record<DayOfWeek, string> = {
	lunes: 'Lunes',
	martes: 'Martes',
	miercoles: 'Miércoles',
	jueves: 'Jueves',
	viernes: 'Viernes',
	sabado: 'Sábado',
	domingo: 'Domingo',
};

const patronesSegmentosChartData = computed<ChartData<'bar'> | null>(() => {
	const data = patronesHorarios.data;
	if (!data) return null;
	const labels = dayOrder.map((day) => dayLabels[day]);
	const datasets = segmentOrder
		.map((segment, idx) => {
			const dayValues = data.distribucionPorDiaSemana?.[segment];
			const values = dayOrder.map((day) => (dayValues ? dayValues[day] ?? 0 : 0));
			return {
				label: segmentLabels[segment],
				data: values,
				backgroundColor: extendedPalette[idx % extendedPalette.length],
			};
		})
		.filter((dataset) => dataset.data.some((value) => value > 0));
	if (!datasets.length) return null;
	return { labels, datasets };
});

type SegmentCard = { key: SegmentoClave; label: string; detalle: Exclude<SegmentoDetalle, null> };

const patronesSegmentCards = computed<SegmentCard[]>(() => {
	const data = patronesHorarios.data;
	if (!data) return [];
	return segmentOrder
		.map((segment) => ({
			key: segment,
			label: segmentLabels[segment],
			detalle: data.patronesPorSegmento[segment],
		}))
		.filter((segmento): segmento is SegmentCard => Boolean(segmento.detalle));
});

const incidentesRecurrentesBarData = computed<ChartData<'bar'> | null>(() => {
	const data = incidentesRecurrentes.data;
	if (!data || !data.incidentesRecurrentes.length) return null;
	const top = data.incidentesRecurrentes.slice(0, 6);
	return {
		labels: top.map((item) => `${item.ruta.nombre} - ${item.categoria.nombre}`),
		datasets: [
			{
				label: 'Incidentes',
				data: top.map((item) => item.cantidadIncidentes),
				backgroundColor: '#f97316',
			},
		],
	};
});

const comparacionZonasStackedData = computed<ChartData<'bar'> | null>(() => {
	const data = comparacionZonas.data;
	if (!data) return null;
	const labels = data.comparacionPorZona.map((zona) => zona.ruta.nombre);
	const categoriaSet = new Set<string>();
	data.comparacionPorZona.forEach((zona) => zona.distribucionCategorias.forEach((cat) => categoriaSet.add(cat.nombre)));
	const categorias = Array.from(categoriaSet);
	return {
		labels,
		datasets: categorias.map((cat, idx) => ({
			label: cat,
			data: data.comparacionPorZona.map((zona) => zona.distribucionCategorias.find((c) => c.nombre === cat)?.cantidad ?? 0),
			backgroundColor: extendedPalette[idx % extendedPalette.length],
			stack: 'zonas',
		})),
	};
});

const tiempoResolucionBarData = computed<ChartData<'bar'> | null>(() => {
	const data = tiempoResolucion.data;
	if (!data) return null;
	return {
		labels: data.tiempoPorCategoria.map((item) => item.categoria.nombre),
		datasets: [
			{
				label: 'Promedio días',
				data: data.tiempoPorCategoria.map((item) => item.promedioDias),
				backgroundColor: '#0ea5e9',
			},
		],
	};
});

const rankingRutasLineData = computed<ChartData<'line'> | null>(() => {
	const data = rankingTendenciaRutas.data;
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
	const data = proporcionEstados.data;
	if (!data) return null;
	return buildDonutDataset([
		{ label: 'Resueltos', value: data.proporcionGlobal.porcentajeResueltos },
		{ label: 'Pendientes', value: data.proporcionGlobal.porcentajePendientes },
		{ label: 'En proceso', value: data.proporcionGlobal.porcentajeEnProceso },
	]);
});

const proporcionEstadosCategoriaStacked = computed<ChartData<'bar'> | null>(() => {
	const data = proporcionEstados.data;
	if (!data) return null;
	const labels = data.proporcionPorCategoria.map((item) => item.categoria.nombre);
	return {
		labels,
		datasets: [
			{
				label: 'Resueltos',
				data: data.proporcionPorCategoria.map((item) => item.porcentajeResueltos),
				backgroundColor: '#22c55e',
				stack: 'estado',
			},
			{
				label: 'Pendientes',
				data: data.proporcionPorCategoria.map((item) => item.porcentajePendientes),
				backgroundColor: '#ef4444',
				stack: 'estado',
			},
			{
				label: 'En proceso',
				data: data.proporcionPorCategoria.map((item) => item.porcentajeEnProceso),
				backgroundColor: '#f59e0b',
				stack: 'estado',
			},
		],
	};
});

const eficienciaCierreLineData = computed<ChartData<'line'> | null>(() => {
	const data = eficienciaCierre.data;
	if (!data) return null;
	return {
		labels: data.evolucionMensual.map((item) => item.mes),
		datasets: [
			{
				label: 'Tasa de cierre (%)',
				data: data.evolucionMensual.map((item) => item.tasaCierre),
				borderColor: '#16a34a',
				fill: false,
				borderWidth: 2,
			},
		],
	};
});

const eficienciaCategoriaBarData = computed<ChartData<'bar'> | null>(() => {
	const data = eficienciaCierre.data;
	if (!data) return null;
	return {
		labels: data.eficienciaPorCategoria.map((item) => item.categoria.nombre),
		datasets: [
			{
				label: 'Tasa de cierre (%)',
				data: data.eficienciaPorCategoria.map((item) => item.tasaCierre),
				backgroundColor: '#9333ea',
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

	/* Layout helpers for side-by-side visuals and rectangular table cards */
	.visual-row {
		display: flex;
		gap: 16px;
		align-items: flex-start;
		/* Keep chart and table always side-by-side; allow horizontal scroll on small screens */
		flex-wrap: nowrap;
		overflow-x: auto;
		padding-bottom: 6px;
	}

	.visual-card {
		flex: 1 1 auto;
		min-width: 360px;
		background: var(--ion-color-step-100, #ffffff);
		border-radius: 12px;
		padding: 12px;
		box-shadow: 0 1px 4px rgba(2, 6, 23, 0.06);
		/* Charts should shrink but remain usable */
	}

	.table-card {
		flex: 0 0 420px; /* fixed side width so tables are visible */
		min-width: 320px;
		min-height: 0;
		max-height: 720px;
		background: var(--ion-color-step-100, #ffffff);
		border: 1px solid var(--ion-color-step-150, #e6eef9);
		border-radius: 10px;
		padding: 8px 10px;
		overflow: auto;
		display: block;
	}

	.table-card .data-table {
		width: 100%;
		table-layout: auto;
		white-space: nowrap; /* prevent cell wrap so columns remain intact */
	}

	/* Ensure th/td don't wrap and keep table readable; rely on horizontal scroll when needed */
	.data-table th,
	.data-table td {
		white-space: nowrap;
	}

	
	.visualizations > .table-card {
		width: fit-content;
		max-width: calc(100% - 48px);
		min-width: 260px;
		margin: 0 auto 8px auto;
		padding: 6px 10px;
		height: auto;
		min-height: 0;
		/* remove max-height to allow table to size naturally by content */
		max-height: none;
		/* let the card grow to content height; avoid forcing vertical scroll */
		overflow-y: visible;
		/* When stacked (column direction), override flex so height follows content */
		flex: none;
		box-shadow: none;
		border-color: var(--ion-color-step-140, #dbe7fb);
	}

	/* Reduce cell padding for compact stacked tables */
	.visualizations > .table-card .data-table th,
	.visualizations > .table-card .data-table td {
		padding: 6px 8px;
	}

	/* For stacked (compact) table-cards, let the table size to its content height and width; parent .table-card will handle overflow if necessary */
	.visualizations > .table-card .data-table {
		width: auto;
		display: inline-table;
		border-collapse: collapse;
	}

.charts-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
	gap: 16px;
}

.chart-card {
	background: var(--ion-color-step-100, #f8fafc);
	border-radius: 12px;
	padding: 12px;
	box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
}

.segment-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 12px;
}

.segment-card {
	background: var(--ion-color-step-100, #f1f5f9);
	border-radius: 10px;
	padding: 12px;
	border: 1px solid var(--ion-color-step-150, #e2e8f0);
}

.meta-banner {
	background: var(--ion-color-step-100, #f8fafc);
	border: 1px dashed var(--ion-color-medium, #94a3b8);
	border-radius: 10px;
	padding: 12px;
	display: flex;
	gap: 12px;
	flex-wrap: wrap;
	justify-content: space-between;
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

	.chart-card,
	.segment-card,
	.meta-banner {
		background: rgba(15, 23, 42, 0.4);
		border-color: rgba(148, 163, 184, 0.3);
		box-shadow: none;
	}

	.data-table th,
	.data-table td {
		border-color: rgba(148, 163, 184, 0.2);
	}
}
</style>
