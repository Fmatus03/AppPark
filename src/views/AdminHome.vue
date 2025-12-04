<template>
	<ion-page class="admin-home-page">
		<ion-header class="ion-no-border">
			<ion-toolbar>
				<ion-title>Mapa de incidentes</ion-title>
			</ion-toolbar>
		</ion-header>
		<ion-content :fullscreen="true">
			<div class="mapa-incidentes">
				<div class="date-range-info">
					<p>
						Últimos 7 días
						<span v-if="fechaInicio && fechaFin">({{ fechaInicio }} → {{ fechaFin }})</span>
					</p>
				</div>
				<div class="mapa-incidentes__actions">
					<button type="button" @click="onReload" :disabled="loading || !resolvedToken">
						{{ loading ? 'Actualizando…' : 'Recargar' }}
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
						<div class="spinner" aria-hidden="true"></div>
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
import { IonContent, IonPage } from '@ionic/vue';
import axios from 'axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { useSession } from '@/composables/useSession';
import router from '@/router';

/*
README — MapaIncidentes
- Token: pass it via the optional `token` prop or rely on the session store (`useSession`) that injects the current bearer token automatically.
- API base: configure VITE_PARK_APP_API_URL in your .env file (e.g. http://api.example.com/).
- Default map center/zoom: (-38.739, -72.598) with zoom 15 when no markers are available.
- Acceptance criteria covered: fetch list (7 days) on mount, fetch detail per incident, markers rely on detail lat/lon, popups show Title/Category/Status/Date/Description, skip markers without coordinates, always add Bearer token, clustering is omitted.
*/

type IncidentListItem = {
	id: number;
	titulo: string;
	categoriaNombre?: string;
	fechaReporte?: string;
	estado?: string;
};

type IncidentDetail = {
	id: number;
	titulo: string;
	descripcion?: string;
	fechaReporte?: string;
	estado?: string;
	latitud?: number;
	longitud?: number;
	categoriaNombre?: string;
};

type PaginatedResponse = {
	content?: IncidentListItem[];
};

const session = useSession();

export default defineComponent({
	name: 'MapaIncidentes',
	components: {
		IonContent,
		IonPage,
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
			incidents: [] as IncidentDetail[],
			fechaInicio: '',
			fechaFin: '',
			center: { lat: -38.739, lng: -72.598 },
			zoom: 15,
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
		},
		// Returns the HTTP headers including the Authorization bearer token.
		buildHeaders() {
			return {
				Authorization: `Bearer ${this.resolvedToken}`,
				Accept: 'application/json',
			};
		},
		// Fetches the paginated list of incidents for the selected date window.
		async fetchIncidentList(): Promise<IncidentListItem[]> {
			const response = await axios.get<PaginatedResponse>(`${this.baseUrl}/api/admin/incidentes`, {
				headers: this.buildHeaders(),
				params: {
					fechaInicio: this.fechaInicio,
					fechaFin: this.fechaFin,
					page: 0,
					size: 100,
					sortBy: 'fechaReporte',
					sortDirection: 'DESC',
				},
			});
			return response.data?.content ?? [];
		},
		// Fetches the detailed incident information required to obtain coordinates.
		async fetchIncidentDetail(id: number): Promise<IncidentDetail | null> {
			try {
				const response = await axios.get<IncidentDetail>(`${this.baseUrl}/api/admin/incidentes/${id}`, {
					headers: this.buildHeaders(),
				});
				return response.data;
			} catch (error) {
				console.error('incident-detail-error', id, error);
				return null;
			}
		},
		// Clears any previous leaflet markers from the map.
		clearMarkers() {
			this.markers.forEach((marker) => marker.remove());
			this.markers = [];
		},
		// Destroys the Leaflet map and resets DOM container.
		destroyMap() {
			try {
				this.clearMarkers();
				if (this.map) {
					try {
						this.map.off();
						this.map.remove();
					} catch (error) {
						console.warn('leaflet-destroy-error', error);
					}
					this.map = null;
				}
				const container = this.$refs.mapContainer as HTMLDivElement | undefined;
				if (container) {
					container.innerHTML = '';
				}
			} catch (error) {
				console.warn('map-destroy-error', error);
			}
		},
		// Creates a marker with a structured popup card and attaches it to the map.
		createMarker(incident: IncidentDetail) {
			if (!this.map || typeof incident.latitud !== 'number' || typeof incident.longitud !== 'number') {
				return;
			}
			const marker = L.marker([incident.latitud, incident.longitud]);

			// Description truncation with full text in title attribute
			const fullDesc = incident.descripcion || '';
			const descTruncated = fullDesc.length > 120 ? `${fullDesc.slice(0, 120)}…` : fullDesc;

			// Build popup HTML (plain HTML — do NOT mount Vue inside)
			const popupHtml = `
				<div class="leaflet-popup-card" role="alertdialog" aria-labelledby="inc-title-${incident.id}">
					<div class="card-row">
						<div class="card-body" style="width:100%">
							<h3 id="inc-title-${incident.id}" class="card-title">${this.escapeHtml(incident.titulo || 'Sin título')}</h3>
							<div class="meta"><span class="cat">${this.escapeHtml(incident.categoriaNombre || 'Sin categoría')}</span> <span class="status status-${(incident.estado || 'DESCONOCIDO').toString().toUpperCase()}">${this.escapeHtml(incident.estado || 'Desconocido')}</span></div>
							<div class="meta" style="margin-top:6px">${this.formatDate(incident.fechaReporte)}</div>
							<p class="desc" title="${this.escapeHtml(fullDesc)}">${this.escapeHtml(descTruncated) || 'Sin descripción'}</p>
							<div class="card-actions"><button class="btn-details" data-id="${incident.id}" tabindex="0" aria-label="Ver detalle incidente ${incident.id}">Ver detalle</button></div>
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

			marker.addTo(this.map as L.Map);
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
		// Loads incidents end-to-end: list + details + markers.
		async loadIncidents() {
			if (!this.resolvedToken || !this.baseUrl) {
				this.error = 'No pudimos autenticar la solicitud.';
				return;
			}
			this.loading = true;
			this.error = '';
			try {
				const list = await this.fetchIncidentList();
				if (!list.length) {
					this.incidents = [];
					this.clearMarkers();
					this.fitMapToMarkers();
					return;
				}
				const details = await Promise.all(
					list.map((item) => this.fetchIncidentDetail(item.id))
				);
				const validIncidents = details.filter((detail): detail is IncidentDetail => {
					return (
						detail !== null &&
						typeof detail.latitud === 'number' &&
						typeof detail.longitud === 'number'
					);
				});
				this.incidents = validIncidents;
				this.clearMarkers();
				validIncidents.forEach((incident) => this.createMarker(incident));
				this.fitMapToMarkers();
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

.mapa-incidentes__actions {
	display: flex;
	justify-content: flex-end;
}

.mapa-incidentes__actions button {
	border: none;
	border-radius: 999px;
	padding: 8px 20px;
	background: #2563eb;
	color: #fff;
	font-weight: 600;
	cursor: pointer;
	transition: background-color 0.2s, opacity 0.2s;
}

.mapa-incidentes__actions button:disabled {
	opacity: 0.6;
	cursor: not-allowed;
}

.mapa-incidentes__actions button:not(:disabled):hover {
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
	min-height: 420px;
	border-radius: 16px;
	overflow: hidden;
	border: 1px solid #e2e8f0;
}

.mapa-incidentes__map {
	height: 100%;
	min-height: 420px;
}

.mapa-incidentes__overlay {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(255, 255, 255, 0.85);
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	z-index: 10;
	gap: 12px;
}

.spinner {
	width: 36px;
	height: 36px;
	border: 4px solid #bfdbfe;
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
