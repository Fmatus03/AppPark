<template>
	<ion-page class="admin-home-page">
		<ion-header class="ion-no-border">
			<ion-toolbar>
				<ion-title>Mapa de incidentes</ion-title>
			</ion-toolbar>
		</ion-header>
		<ion-content :fullscreen="true">
			<div class="mapa-incidentes">
				<div class="mapa-incidentes__controls">
					<!-- Date fields and button are now direct siblings for better flex alignment -->
					<div class="date-field">
						<label for="date-start">Desde</label>
						<input id="date-start" v-model="fechaInicio" type="date" />
					</div>
					<div class="date-field">
						<label for="date-end">Hasta</label>
						<input id="date-end" v-model="fechaFin" type="date" />
					</div>
					<button type="button" @click="onReload" :disabled="loading || !resolvedToken">
						{{ loading ? 'Actualizando…' : 'Aplicar' }}
					</button>
				</div>
				<section class="mapa-incidentes__status" v-if="!resolvedToken">
					<p>Inicia sesión para visualizar los incidentes.</p>
				</section>

				<section class="mapa-incidentes__status" v-else-if="error && !loading">
					<p class="error">{{ error }}</p>
				</section>

				<section class="mapa-incidentes__status" v-else-if="!loading && incidents.length === 0">
					<p>No se encontraron incidentes en los últimos 7 días.</p>
				</section>

				<div class="mapa-incidentes__map-wrapper">
					<div v-if="loading" class="mapa-incidentes__overlay">
						<ion-spinner name="lines-small" />
						<p>Cargando incidentes…</p>
					</div>
					<div ref="mapContainer" class="mapa-incidentes__map"></div>
				</div>
			</div>
		</ion-content>
	</ion-page>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { IonContent, IonPage, IonSpinner } from '@ionic/vue';
import axios from 'axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { useSession } from '@/composables/useSession';
import router from '@/router';


type IncidentMapItem = {
	id: number;
	titulo: string;
	categoriaNombre?: string;
	fechaReporte?: string;
	estado?: string;
	latitud?: number;
	longitud?: number;
	// clustering properties if needed
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

const session = useSession();

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

export default defineComponent({
	name: 'MapaIncidentes',
	components: {
		IonContent,
		IonPage,
		IonSpinner,
	},
	props: {
		token: {
			type: String,
			default: '',
		},
	},
	data() {
		return {
			loading: false,
			error: '',
			map: null as L.Map | null,
			markers: [] as L.Marker[],
			markerCluster: null as L.MarkerClusterGroup | null,
			polygons: [] as L.Polygon[],
			incidents: [] as IncidentMapItem[],
			zones: [] as RouteZone[],
			fechaInicio: '',
			fechaFin: '',
			center: { lat: -38.739, lng: -72.598 },
			zoom: 15,
			currentZoom: 15,
			mapContainer: null as HTMLDivElement | null,
			baseUrl: (import.meta.env.VITE_PARK_APP_API_URL ?? '').replace(/\/$/, ''),
		};
	},
	computed: {
		resolvedToken(): string | null {
			if (this.token) {
				return this.token;
			}
			return session.authToken.value ?? null;
		},
	},
	watch: {
		resolvedToken(newToken: string | null, oldToken: string | null) {
			if (newToken && newToken !== oldToken) {
				void this.loadIncidents();
				void this.fetchZones();
			}
		},
	},
	mounted() {
		this.calculateDates();
		this.initializeIconFix();
		this.bootstrapMap();
	},

	beforeUnmount() {
		this.destroyMap();
	},
	methods: {
		// When the view becomes active again, rebuild the map from scratch.
		ionViewDidEnter() {
			this.bootstrapMap();
		},
		// Ionic lifecycle hook to ensure teardown even when view is cached.
		ionViewDidLeave() {
			this.destroyMap();
		},
		// Shared bootstrapper to init the map after DOM updates.
		bootstrapMap() {
			this.$nextTick(() => {
				this.initializeMap();
				if (this.resolvedToken) {
					void this.fetchZones();
					void this.loadIncidents();
				}
			});
		},
		// Ensures Leaflet default markers load correctly under Vite asset handling.
		initializeIconFix() {
			const proto = (L.Icon.Default.prototype as L.Icon.Default);
			delete (proto as { _getIconUrl?: unknown })._getIconUrl;
			L.Icon.Default.mergeOptions({
				iconRetinaUrl: markerIcon2x,
				iconUrl: markerIcon,
				shadowUrl: markerShadow,
			});
		},
		// Builds the ISO date range used by the backend (today and seven days ago).
		calculateDates() {
			const today = new Date();
			const sevenDaysAgo = new Date();
			sevenDaysAgo.setDate(today.getDate() - 7);
			const format = (value: Date) => value.toISOString().slice(0, 10);
			this.fechaFin = format(today);
			this.fechaInicio = format(sevenDaysAgo);
		},

		// Prepares the Leaflet map instance once the DOM node is available.
		initializeMap() {
			// Safety: if a map instance exists, remove it first to avoid double initialization
			if (this.map) {
				this.destroyMap();
			}
			const container = this.$refs.mapContainer as HTMLDivElement | undefined;
			if (!container) {
				return;
			}
			this.map = L.map(container).setView([this.center.lat, this.center.lng], this.zoom);
			const mapInstance = this.map as L.Map;
			L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution: '&copy; OpenStreetMap contributors',
			}).addTo(mapInstance);

			// Init MarkerClusterGroup
			this.markerCluster = L.markerClusterGroup({
				chunkedLoading: true, // Optimizes performance for large sets
			});
			this.map.addLayer(this.markerCluster as any);
		},
		// Returns the HTTP headers including the Authorization bearer token.
		buildHeaders() {
			return {
				Authorization: `Bearer ${this.resolvedToken}`,
				Accept: 'application/json',
			};
		},

		// Fetches the list of incidents for the map with coordinates.
		async fetchMapIncidents(): Promise<IncidentMapItem[]> {
			// Guard against uninitialized dates
			if (!this.fechaInicio || !this.fechaFin) {
				return [];
			}
			const response = await axios.get<IncidentMapItem[]>(`${this.baseUrl}/api/admin/incidentes/mapa`, {
				headers: this.buildHeaders(),
				params: {
					fechaInicio: this.fechaInicio,
					fechaFin: this.fechaFin,
				},
			});
			return Array.isArray(response.data) ? response.data : [];
		},
		// Fetches the route zones (polygons) from the backend.
		async fetchZones() {
			if (!this.resolvedToken || !this.baseUrl) return;
			try {
				const response = await axios.get<RouteZone[]>(`${this.baseUrl}/api/admin/incidentes/rutas-con-geometria`, {
					headers: this.buildHeaders(),
				});
				this.zones = Array.isArray(response.data) ? response.data : [];
				this.drawZones();
			} catch (error) {
				console.error('fetch-zones-error', error);
			}
		},
		// Draws the zone polygons on the map.
		drawZones() {
			if (!this.map || !this.zones.length) return;

			// Clear existing polygons
			this.polygons.forEach((polygon) => polygon.remove());
			this.polygons = [];

			this.zones.forEach((zone, index) => {
				if (!zone.coordenadas || zone.coordenadas.length < 3) return;

				const latLngs = zone.coordenadas.map((coord) => [coord.latitud, coord.longitud] as [number, number]);
				const color = ZONE_COLORS[index % ZONE_COLORS.length];

				const polygon = L.polygon(latLngs, {
					color: color,
					fillColor: color,
					fillOpacity: 0.2,
					weight: 2,
				});

				polygon.bindTooltip(zone.nombre, {
					permanent: false,
					direction: 'center',
					className: 'zone-tooltip',
				});

				polygon.addTo(this.map as L.Map);
				this.polygons.push(polygon);
			});
		},
        // Clears any previous leaflet markers from the map.
		clearMarkers() {
			if (this.markerCluster) {
				this.markerCluster.clearLayers();
			}
			// Fallback if needed, though we primarily use cluster now
			this.markers.forEach((marker) => marker.remove());
			this.markers = [];
		},
        // Destroys the Leaflet map and resets DOM container.
		destroyMap() {
			try {
				this.clearMarkers();
				this.polygons.forEach((polygon) => polygon.remove());
				this.polygons = [];
				if (this.map) {
					try {
						this.map.off(); // Remove all listeners
						if (this.markerCluster) {
							this.map.removeLayer(this.markerCluster as any);
						}
						this.map.remove();
					} catch (error) {
						console.warn('leaflet-destroy-error', error);
					}
					this.map = null;
					this.markerCluster = null;
				}
				const container = this.$refs.mapContainer as HTMLDivElement | undefined;
				if (container) {
					container.innerHTML = '';
				}
			} catch (error) {
				console.warn('map-destroy-error', error);
			}
		},

		// Helper to return the standard marker icon
		getMarkerIcon() {
			return L.icon({
				iconUrl: markerIcon,
				iconRetinaUrl: markerIcon2x,
				shadowUrl: markerShadow,
				iconSize: [25, 41],
				iconAnchor: [12, 41],
				popupAnchor: [1, -34],
				shadowSize: [41, 41],
			});
		},

		// Creates a marker with a structured popup card and attaches it to the map.
		createMarker(incident: IncidentMapItem) {
			if (!this.map || !this.markerCluster || typeof incident.latitud !== 'number' || typeof incident.longitud !== 'number') {
				return;
			}
			
			const icon = this.getMarkerIcon();
			const marker = L.marker([incident.latitud, incident.longitud], { icon: icon });

			// Build popup HTML (plain HTML — do NOT mount Vue inside)

			const popupHtml = `
				<div class="leaflet-popup-card" role="alertdialog" aria-labelledby="inc-title-${incident.id}">
					<div class="card-row">
						<div class="card-body" style="width:100%">
							<h3 id="inc-title-${incident.id}" class="card-title">${this.escapeHtml(incident.titulo || 'Sin título')}</h3>
							<div class="meta"><span class="cat">${this.escapeHtml(incident.categoriaNombre || 'Sin categoría')}</span> <span class="status status-${(incident.estado || 'DESCONOCIDO').toString().toUpperCase()}">${this.escapeHtml(incident.estado || 'Desconocido')}</span></div>
							<div class="meta" style="margin-top:6px">${this.formatDate(incident.fechaReporte)}</div>
							<div class="card-actions" style="margin-top:8px"><button class="btn-details" data-id="${incident.id}" tabindex="0" aria-label="Ver detalle incidente ${incident.id}">Ver detalle</button></div>
						</div>
					</div>
				</div>
			`;

			marker.bindPopup(popupHtml);

			// Event wiring: attach handler when popup opens, remove on close to avoid leaks
			const onDetailsClick = () => {
				router.push({ name: 'AdminIncidentDetail', query: { id: String(incident.id) } });
			};

			const onPopupOpen = (e: any) => {
				const node = (e.popup as any)._contentNode as HTMLElement | undefined;
				const btn = node?.querySelector('.btn-details') as HTMLButtonElement | null;
				if (btn) {
					btn.addEventListener('click', onDetailsClick);
					btn.addEventListener('keydown', (ev) => {
						if (ev.key === 'Enter' || ev.key === ' ') {
							ev.preventDefault();
							onDetailsClick();
						}
					});
				}
			};

			const onPopupClose = (e: any) => {
				const node = (e.popup as any)._contentNode as HTMLElement | undefined;
				const btn = node?.querySelector('.btn-details') as HTMLButtonElement | null;
				if (btn) {
					btn.removeEventListener('click', onDetailsClick);
					// keydown listener is anonymous; popup DOM is removed on close so leak risk is minimal here
				}
			};

			marker.on('popupopen', onPopupOpen);
			marker.on('popupclose', onPopupClose);

			// Add to CLUSTER instead of MAP directly
			this.markerCluster.addLayer(marker);
			// Keep track for scaling/updates
			this.markers.push(marker);
		},
		// Programmatic navigation helper (used by popup button)
		editIncident(incidentId: number) {
			router.push({ name: 'AdminIncidentDetail', query: { id: String(incidentId) } });
		},

		// Small helper to escape HTML in popup content
		escapeHtml(input: string) {
			return String(input)
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/"/g, '&quot;')
				.replace(/'/g, '&#039;');
		},

		// Adjusts the viewport depending on marker availability.
		fitMapToMarkers() {
			if (!this.map) {
				return;
			}
			if (!this.markers.length) {
				this.map.setView([this.center.lat, this.center.lng], this.zoom);
				return;
			}
			const bounds = L.latLngBounds(this.markers.map((marker) => marker.getLatLng()));
			this.map.fitBounds(bounds.pad(0.2));
		},
		// Formats backend timestamps into `dd MMM yyyy HH:mm` (e.g. "19 Nov 2025 10:20").
		formatDate(value?: string) {
			if (!value) return '—';
			const date = new Date(value);
			if (Number.isNaN(date.getTime())) return '—';
			const parts = new Intl.DateTimeFormat('es-CL', {
				day: '2-digit',
				month: 'short',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
				hour12: false,
			}).formatToParts(date);
			const day = parts.find((p: any) => p.type === 'day')?.value ?? '';
			const month = parts.find((p: any) => p.type === 'month')?.value ?? '';
			const year = parts.find((p: any) => p.type === 'year')?.value ?? '';
			const hour = parts.find((p: any) => p.type === 'hour')?.value ?? '';
			const minute = parts.find((p: any) => p.type === 'minute')?.value ?? '';
			return `${day} ${month} ${year} ${hour}:${minute}`;
		},
		// Loads incidents end-to-end: list + markers.
		async loadIncidents() {
			if (!this.resolvedToken || !this.baseUrl) {
				this.error = 'No pudimos autenticar la solicitud.';
				return;
			}
			this.loading = true;
			this.error = '';
			try {
				const list = await this.fetchMapIncidents();
				if (!list.length) {
					this.incidents = [];
					this.clearMarkers();
					// Swallow error if fitBounds fails for empty list
					try { this.fitMapToMarkers(); } catch (_) { /* ignore */ }
					return;
				}
				
				const validIncidents = list.filter((item: IncidentMapItem) => {
					return (
						item !== null &&
						typeof item.latitud === 'number' &&
						typeof item.longitud === 'number'
					);
				});
				this.incidents = validIncidents;
				this.clearMarkers();
				validIncidents.forEach((incident: IncidentMapItem) => this.createMarker(incident));
				try {
					this.fitMapToMarkers();
				} catch (err) {
					console.warn('fit-bounds-error', err);
				}
			} catch (error) {
				console.error('incident-map-load-error', error);
				this.error = 'No pudimos cargar los incidentes. Intenta nuevamente.';
			} finally {
				this.loading = false;
			}
		},
		// Handler for the manual reload button.
		onReload() {
			void this.loadIncidents();
			void this.fetchZones();
		},
	},
});
</script>

<style scoped>
.admin-home-page ion-content {
	--background: #f8fafc;
	--color: #0f172a;
	color: #0f172a;
}

.mapa-incidentes {
	display: flex;
	flex-direction: column;
	gap: 16px;
	padding: 16px;
	min-height: 100%;
}

.mapa-incidentes__header {
	display: flex;
	flex-wrap: wrap;
	justify-content: space-between;
	align-items: center;
	gap: 12px;
}

.mapa-incidentes__header h1 {
	margin: 0;
	font-size: 1.3rem;
}

.mapa-incidentes__header p {
	margin: 0;
	color: #475569;
}

.mapa-incidentes__controls {
	display: flex;
	justify-content: flex-start;
	align-items: flex-end;
	gap: 12px;
	flex-wrap: wrap;
}

.date-field {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.date-field label {
	font-size: 0.75rem;
	font-weight: 600;
	color: #64748b;
}

.date-field input {
	border: 1px solid #cbd5e1;
	border-radius: 8px;
	padding: 6px 10px;
	font-size: 0.9rem;
	color: #334155;
	background: white;
}

.mapa-incidentes__controls button {
	border: none;
	border-radius: 999px;
	padding: 8px 20px;
	background: #2563eb;
	color: #fff;
	font-weight: 600;
	cursor: pointer;
	transition: background-color 0.2s, opacity 0.2s;
	height: 38px;
}

.mapa-incidentes__controls button:disabled {
	opacity: 0.6;
	cursor: not-allowed;
}

.mapa-incidentes__controls button:not(:disabled):hover {
	background: #1d4ed8;
}

.mapa-incidentes__status {
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 12px;
	padding: 12px 16px;
}

.mapa-incidentes__status p {
	margin: 0;
}

.mapa-incidentes__status .error {
	color: #b91c1c;
}

.mapa-incidentes__map-wrapper {
	position: relative;
	min-height: 80vh;
	max-height: 80vh;
	min-width: 95%;
	aspect-ratio: 1 / 1;
	border-radius: 16px;
	overflow: hidden;
	border: 1px solid #e2e8f0;
	margin: 0 auto;
	max-width: 100%;
}

.mapa-incidentes__map {
	height: 100%;
	width: 100%;
}

.mapa-incidentes__overlay {
	position: absolute;
	top: 12px;
	right: 12px;
	/* Removed full coverage */
	background: rgba(255, 255, 255, 0.9);
	padding: 8px 16px;
	border-radius: 999px;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	display: flex;
	flex-direction: row; /* Horizontal layout */
	align-items: center;
	justify-content: center;
	z-index: 1000; /* Ensure it's above map controls */
	gap: 8px;
	pointer-events: none; /* Let clicks pass through if needed, though usually it's small enough */
}

.spinner {
	width: 20px;
	height: 20px;
	border: 2px solid #bfdbfe;
	border-top-color: #2563eb;
	border-radius: 50%;
	animation: spin 1s linear infinite;
}

@keyframes spin {
	to {
		transform: rotate(360deg);
	}
}

.popup {
	font-size: 0.85rem;
	line-height: 1.4;
}

@media (max-width: 640px) {
	.mapa-incidentes {
		padding: 12px;
	}
	.mapa-incidentes__header {
		flex-direction: column;
		align-items: flex-start;
	}
}

/* Popup card styles for Leaflet popups (scoped to this component) */
.leaflet-popup-card{font-family:Inter,system-ui;max-width:320px}
.leaflet-popup-card .card-row{display:flex;gap:8px}
.leaflet-popup-card .card-body{min-width:0}
.leaflet-popup-card .card-title{margin:0;font-size:14px;font-weight:700}
.leaflet-popup-card .meta{display:flex;gap:8px;align-items:center;font-size:12px;color:#64748b}
.leaflet-popup-card .status{padding:4px 8px;border-radius:999px;font-weight:600}
.leaflet-popup-card .status-CERRADO{background:#fee2e2;color:#b91c1c}
.leaflet-popup-card .status-ABIERTO{background:#dcfce7;color:#166534}
.leaflet-popup-card .desc{margin:8px 0;font-size:13px;color:#0f1724}
.leaflet-popup-card .btn-details{background:#2563eb;color:#fff;padding:6px 10px;border-radius:8px;border:0;cursor:pointer}
@media (max-width:420px){.leaflet-popup-card{max-width:90vw}}
</style>
