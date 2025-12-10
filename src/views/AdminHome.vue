<template>
	<ion-page class="admin-home-page">
		<ion-content :fullscreen="true">
			<div class="mapa-incidentes">
				<div class="mapa-incidentes__header">
					<div class="header-top">
						<h1>Mapa de Incidentes</h1>
						<div class="header-actions">
							<div class="date-inputs">
								<ion-item class="date-item" lines="none">
									<ion-label position="stacked">Desde</ion-label>
									<ion-input type="date" v-model="fechaInicio" @ionChange="onDateChange"></ion-input>
								</ion-item>
								<ion-item class="date-item" lines="none">
									<ion-label position="stacked">Hasta</ion-label>
									<ion-input type="date" v-model="fechaFin" @ionChange="onDateChange"></ion-input>
								</ion-item>
							</div>
							<ion-button @click="onReload" size="small" fill="outline">
								<ion-icon :icon="refreshOutline" slot="start"></ion-icon>
								Aplicar
							</ion-button>
						</div>
					</div>
					<p class="subtitle">Visualiza y analiza los reportes en terreno</p>
				</div>

				<div class="mapa-container-wrapper">
					<div ref="mapContainer" class="mapa-container"></div>
					
					<!-- Loading Badge -->
					<div v-if="loading" class="mapa-incidentes__overlay">
						<div class="spinner"></div>
						<span>Cargando datos...</span>
					</div>

					<!-- Error Message -->
					<div v-if="error" class="error-badge">
						{{ error }}
					</div>
				</div>
			</div>
		</ion-content>
	</ion-page>
</template>

<script lang="ts">
import { defineComponent, markRaw } from 'vue';
import {
	IonPage,
	IonContent,
	IonItem,
	IonLabel,
	IonInput,
	IonButton,
	IonIcon,
} from '@ionic/vue';
import { refreshOutline } from 'ionicons/icons';
import axios from 'axios';
import router from '@/router';
import { useSession } from '@/composables/useSession';
import { useAdminMapStore } from '@/composables/useAdminMapStore';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { FeatureCollection } from 'geojson';

// Interfaces match existing backend types
interface Coordinate {
	latitud: number;
	longitud: number;
}

interface IncidentMapItem {
	id: number;
	latitud: number;
	longitud: number;
	titulo: string;
	estado: string;
	fechaReporte: string;
	categoriaNombre: string;
}

interface RouteZone {
	id: number;
	nombre: string;
	coordenadas: Coordinate[];
}

// Zone Colors Palette
const ZONE_COLORS = [
	'#3b82f6', // blue-500
	'#ef4444', // red-500
	'#10b981', // emerald-500
	'#f59e0b', // amber-500
	'#8b5cf6', // violet-500
	'#ec4899', // pink-500
	'#06b6d4', // cyan-500
];

export default defineComponent({
	name: 'AdminHome',
	components: {
		IonPage,
		IonContent,
		IonItem,
		IonLabel,
		IonInput,
		IonButton,
		IonIcon,
	},
	setup() {
		const { authToken } = useSession();
		const adminStore = useAdminMapStore();
		return {
			refreshOutline,
			authToken,
			adminStore,
		};
	},
	data() {
		return {
			loading: false,
			error: '',
			map: null as any, // Cast to any or maplibregl.Map but handled with markRaw
			// We store data in GeoJSON format to feed the source
			incidentsGeoJson: {
				type: 'FeatureCollection',
				features: [],
			} as FeatureCollection,
			zones: [] as RouteZone[],
			fechaInicio: '',
			fechaFin: '',
			center: { lat: -38.739, lng: -72.598 }, // Temuco center
			zoom: 13,
			mapContainer: null as HTMLDivElement | null,
			// Base URL logic same as before
			baseUrl: (import.meta.env.VITE_PARK_APP_API_URL ?? '').replace(/\/$/, ''),
		};
	},
	computed: {
		resolvedToken(): string | null {
			// Access session context
			return this.authToken ?? null;
		},
	},
	watch: {
		resolvedToken(newToken: string | null) {
			if (newToken && this.map) {
				void this.loadOrFetchData();
			}
		},
	},
	mounted() {
		this.restoreOrCalculateDates();
		this.bootstrapMap();
	},
	beforeUnmount() {
		this.destroyMap();
	},
	methods: {
		ionViewDidEnter() {
			// If map is missing or context lost, rebuild
			if (!this.map) {
				this.bootstrapMap();
			}
		},
		ionViewDidLeave() {
			// Optional: destroy map to save GPU resources if caching allows
			// For now we keep it unless explicit destruction required
		},
		bootstrapMap() {
			this.$nextTick(() => {
				this.initializeMap();
			});
		},
		restoreOrCalculateDates() {
			if (this.adminStore.state.hasLoaded) {
				// Restore from cache
				this.fechaInicio = this.adminStore.state.fechaInicio;
				this.fechaFin = this.adminStore.state.fechaFin;
			} else {
				// Calculate defaults
				const today = new Date();
				const sevenDaysAgo = new Date();
				sevenDaysAgo.setDate(today.getDate() - 7);
				const format = (value: Date) => value.toISOString().slice(0, 10);
				this.fechaFin = format(today);
				this.fechaInicio = format(sevenDaysAgo);
			}
		},
		initializeMap() {
			const container = this.$refs.mapContainer as HTMLDivElement | undefined;
			if (!container) return;
			if (this.map) return; // Already inited

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

			this.map = markRaw(new maplibregl.Map({
				container: container,
				style: osmStyle as any,
				center: [this.center.lng, this.center.lat],
				zoom: this.zoom,
			}));

			this.map.on('load', () => {
				this.initializeLayers();
				if (this.resolvedToken) {
					void this.loadOrFetchData();
				}
			});

			this.map.addControl(new maplibregl.NavigationControl(), 'top-right');
		},
		initializeLayers() {
			if (!this.map) return;

			// --- ZONES SOURCE & LAYERS ---
			this.map.addSource('zones', {
				type: 'geojson',
				data: { type: 'FeatureCollection', features: [] },
			});
			// Fill layer for zones
			this.map.addLayer({
				id: 'zones-fill',
				type: 'fill',
				source: 'zones',
				paint: {
					'fill-color': ['get', 'color'],
					'fill-opacity': 0.2,
				},
			});
			// Outline layer for zones
			this.map.addLayer({
				id: 'zones-line',
				type: 'line',
				source: 'zones',
				paint: {
					'line-color': ['get', 'color'],
					'line-width': 2,
				},
			});
			// Zone Labels
			this.map.addLayer({
				id: 'zones-label',
				type: 'symbol',
				source: 'zones',
				layout: {
					'text-field': ['get', 'title'],
					'text-size': 12,
					'text-offset': [0, 0],
					'text-anchor': 'center',
				},
				paint: {
					'text-color': '#333333',
					'text-halo-color': '#ffffff',
					'text-halo-width': 1,
				},
			});

			// --- INCIDENTS SOURCE & CLUSTERS ---
			this.map.addSource('incidents', {
				type: 'geojson',
				data: { type: 'FeatureCollection', features: [] },
				cluster: true,
				clusterMaxZoom: 14, // Max zoom to cluster points on
				clusterRadius: 50, // Radius of each cluster when clustering points (defaults to 50)
			});

			// 1. Clusters Circles
			this.map.addLayer({
				id: 'clusters',
				type: 'circle',
				source: 'incidents',
				filter: ['has', 'point_count'],
				paint: {
					'circle-color': [
						'step',
						['get', 'point_count'],
						'#51bbd6', // Blue for small count
						100,
						'#f1f075', // Yellow for > 100
						750,
						'#f28cb1', // Pink for > 750
					],
					'circle-radius': [
						'step',
						['get', 'point_count'],
						20, // radius px
						100,
						30,
						750,
						40,
					],
				},
			});

			// 2. Cluster Counts
			this.map.addLayer({
				id: 'cluster-count',
				type: 'symbol',
				source: 'incidents',
				filter: ['has', 'point_count'],
				layout: {
					'text-field': '{point_count_abbreviated}',
					'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'], // Standard font or available stack
					'text-size': 12,
				},
			});

			// 3. Unclustered Points (Individual Incidents)
			this.map.addLayer({
				id: 'unclustered-point',
				type: 'circle',
				source: 'incidents',
				filter: ['!', ['has', 'point_count']],
				paint: {
					'circle-color': '#11b4da',
					'circle-radius': 8,
					'circle-stroke-width': 1,
					'circle-stroke-color': '#fff',
				},
			});

			// --- EVENTS ---
			
			// Click cluster to zoom
			this.map.on('click', 'clusters', async (e: any) => {
				const features = this.map?.queryRenderedFeatures(e.point, {
					layers: ['clusters'],
				});
				const clusterId = features?.[0].properties.cluster_id;
				const source = this.map?.getSource('incidents') as maplibregl.GeoJSONSource;
				
				const zoom = await source.getClusterExpansionZoom(clusterId);
				this.map?.easeTo({
					center: (features?.[0].geometry as any).coordinates,
					zoom: zoom,
				});
			});

			// Click individual point to show detail
			this.map.on('click', 'unclustered-point', (e: any) => {
				if (!e.features?.length) return;
				const feature = e.features[0];
				if (!feature.properties) return;
				const props = feature.properties;
				const coordinates = (feature.geometry as any).coordinates.slice();

				// Ensure popup appears over the point even if zoomed out
				while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
					coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
				}

				// Create popup HTML
				const description = `
					<div class="map-popup">
						<h3>${props.title}</h3>
						<p><strong>Estado:</strong> ${props.status}</p>
						<p><strong>Categoría:</strong> ${props.category}</p>
						<p class="date"><strong>Fecha:</strong>${props.date}</p>
						<button class="btn-detail" onclick="onClickDetail(${props.id})" style="margin-top:8px; padding:4px 8px; cursor:pointer;">Ver Detalle</button>
					</div>
				`;
				
				new maplibregl.Popup()
					.setLngLat(coordinates)
					.setHTML(description)
					.addTo(this.map!);
					
				// Add manual listener for router push button
				setTimeout(() => {
					const btn = document.querySelector('.btn-detail');
					btn?.addEventListener('click', (ev) => {
						ev.preventDefault();
						router.push({ name: 'AdminIncidentDetail', query: { id: String(props.id) } });
					});
				}, 100);
			});

			// Cursor pointer
			this.map.on('mouseenter', 'clusters', () => { if (this.map) this.map.getCanvas().style.cursor = 'pointer'; });
			this.map.on('mouseleave', 'clusters', () => { if (this.map) this.map.getCanvas().style.cursor = ''; });
			this.map.on('mouseenter', 'unclustered-point', () => { if (this.map) this.map.getCanvas().style.cursor = 'pointer'; });
			this.map.on('mouseleave', 'unclustered-point', () => { if (this.map) this.map.getCanvas().style.cursor = ''; });
		},

		onClickDetail(id: string) {
			router.push({ name: 'AdminIncidentDetail', query: { id } });
		},
		buildHeaders() {
			return {
				Authorization: `Bearer ${this.resolvedToken}`,
				Accept: 'application/json',
			};
		},
		fitMapToBounds() {
			if (!this.map) return;
			const bounds = new maplibregl.LngLatBounds();
			let hasPoints = false;

			// Add incidents to bounds
			const incidents = this.incidentsGeoJson.features; // Access local reactive copy or store? 
			// We should rely on what's in the store or local data structure.
			// incidentsGeoJson is updated in fetch/apply.
			if (this.incidentsGeoJson && this.incidentsGeoJson.features) {
				this.incidentsGeoJson.features.forEach((f: any) => {
					if (f.geometry && f.geometry.coordinates) {
						bounds.extend(f.geometry.coordinates as [number, number]);
						hasPoints = true;
					}
				});
			}

			// If no incidents, try zones
			if (!hasPoints) {
				// We need to iterate over zones. Local zones array or map source?
				// Local 'zones' array is RouteZone[], let's use that.
				this.zones.forEach(z => {
					if (z.coordenadas) {
						z.coordenadas.forEach(c => {
							bounds.extend([c.longitud, c.latitud]);
							hasPoints = true;
						});
					}
				});
			}

			if (hasPoints) {
				this.map.fitBounds(bounds, { padding: 50, maxZoom: 16 });
			}
		},
		async fetchZones() {
			if (!this.resolvedToken) return;
			try {
				const response = await axios.get<RouteZone[]>(`${this.baseUrl}/api/admin/incidentes/rutas-con-geometria`, {
					headers: this.buildHeaders(),
				});
				const zonesData = Array.isArray(response.data) ? response.data : [];
				
				this.updateMapWithZones(zonesData);
				// Cache raw zones
				this.adminStore.setZones(zonesData);

			} catch (e) {
				console.warn('error fetching zones', e);
			}
		},
		updateMapWithZones(zones: RouteZone[]) {
			if (!this.map) return;
			this.zones = zones; // Keep local ref for bounds
			const features = zones
				.filter(z => z.coordenadas && z.coordenadas.length >= 3)
				.map((z, idx) => {
					const ring = z.coordenadas.map(c => [c.longitud, c.latitud]);
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
			
			const source = this.map.getSource('zones') as maplibregl.GeoJSONSource;
			if (source) {
				source.setData({
					type: 'FeatureCollection',
					features: features as any,
				});
			}
		},
		async fetchIncidents() {
			if (!this.fechaInicio || !this.fechaFin) return;
			try {
				const response = await axios.get<IncidentMapItem[]>(`${this.baseUrl}/api/admin/incidentes/mapa`, {
					headers: this.buildHeaders(),
					params: { fechaInicio: this.fechaInicio, fechaFin: this.fechaFin },
				});
				const items = Array.isArray(response.data) ? response.data : [];
				
				// Transform to GeoJSON
				const features = items
					.filter(i => typeof i.latitud === 'number' && typeof i.longitud === 'number')
					.map(item => ({
						type: 'Feature',
						properties: {
							id: item.id,
							title: item.titulo || 'Sin Título',
							status: item.estado,
							category: item.categoriaNombre,
							date: this.formatDate(item.fechaReporte),
						},
						geometry: {
							type: 'Point',
							coordinates: [item.longitud, item.latitud],
						},
					}));
				
				const geoJson = {
					type: 'FeatureCollection',
					features: features as any,
				};
				
				// Update local
				this.incidentsGeoJson = geoJson as FeatureCollection;

				if (this.map) {
					const source = this.map.getSource('incidents') as maplibregl.GeoJSONSource;
					if (source) {
						source.setData(geoJson as any);
					}
				}
				// Cache it
				this.adminStore.setIncidents(geoJson);

			} catch (e) {
				console.warn('error fetching incidents', e);
				throw e;
			}
		},
		async loadAllData() { // Wrapper for fetchAllDataAndCache to keep method name if used
			await this.loadOrFetchData();
		},
		async loadOrFetchData() {
			if (!this.map) return;

			if (this.adminStore.state.hasLoaded) {
				this.applyCachedData();
			} else {
				await this.fetchAllDataAndCache();
			}
			// Fit bounds after data load
			this.fitMapToBounds();
		},
		async fetchAllDataAndCache() {
			this.loading = true;
			this.error = '';
			try {
				// Reset local data before fetching to ensure clean bounds calculation or rely on overwrite
				this.incidentsGeoJson = { type: 'FeatureCollection', features: [] } as FeatureCollection;
				this.zones = [];

				await Promise.all([
					this.fetchZones(),
					this.fetchIncidents(),
				]);
				this.adminStore.setDates(this.fechaInicio, this.fechaFin);
			} catch (err) {
				console.error(err);
				this.error = 'Error cargando datos';
			} finally {
				this.loading = false;
			}
		},
		applyCachedData() {
			const incidents = this.adminStore.state.incidents;
			const zones = this.adminStore.state.zones; // Assumes RouteZone[] stored
			
			if (incidents) {
				this.incidentsGeoJson = incidents;
				if (this.map) {
					const source = this.map.getSource('incidents') as maplibregl.GeoJSONSource;
					if (source) source.setData(incidents);
				}
			}

			if (zones && zones.length) {
				this.zones = zones;
				this.updateMapWithZones(zones);
			}
		},
		async onReload() {
			// Forced reload from UI
			await this.fetchAllDataAndCache();
			this.fitMapToBounds();
		},
		onDateChange() {
			// Do nothing -> wait for apply
		},
		destroyMap() {
			if (this.map) {
				this.map.remove();
				this.map = null;
			}
		},
		formatDate(value?: string) {
			if (!value) return '-';
			const date = new Date(value);
			return date.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
		},
	},
});
</script>

<style scoped>
/* Keep existing layout styles */
.admin-home-page ion-content {
	--background: #f8fafc;
}
.mapa-incidentes {
	display: flex;
	flex-direction: column;
	gap: 16px;
	padding: 16px;
	height: 100%;
}
.mapa-incidentes__header {
	background: white;
	padding: 16px;
	border-radius: 12px;
	box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
.header-top {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 8px;
}
.header-actions {
	display: flex;
	gap: 12px;
	align-items: center;
}
.date-inputs {
	display: flex;
	gap: 8px;
}
.mapa-container-wrapper {
	flex: 1;
	min-height: 400px; /* Minimum height ensures viability */
	position: relative;
	border-radius: 12px;
	overflow: hidden;
	box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
}
.mapa-container {
	width: 100%;
	height: 100%;
}
.mapa-incidentes__overlay {
	position: absolute;
	top: 12px;
	right: 12px;
	background: rgba(255,255,255,0.9);
	padding: 8px 12px;
	border-radius: 99px;
	font-size: 0.85rem;
	display: flex;
	align-items: center;
	gap: 8px;
	box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.spinner {
	width: 16px;
	height: 16px;
	border: 2px solid #ccc;
	border-top-color: #333;
	border-radius: 50%;
	animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.error-badge {
	position: absolute;
	bottom: 12px;
	left: 50%;
	transform: translateX(-50%);
	background: #fecaca;
	color: #991b1b;
	padding: 8px 16px;
	border-radius: 99px;
	font-size: 0.85rem;
	font-weight: 500;
}
h1 { margin: 0; font-size: 1.25rem; font-weight: 700; color: #1e293b; }
.subtitle { margin: 0; color: #64748b; font-size: 0.9rem; }
</style>
