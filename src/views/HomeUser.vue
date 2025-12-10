<template>
  <IonPage>
    <IonHeader translucent>
      <IonToolbar>
        <IonTitle class="header-title">Home</IonTitle>
      </IonToolbar>
    </IonHeader>
		<IonContent fullscreen class="map-content">
			<div class="map-container" v-if="!isOffline">
				<div ref="mapRef" class="map-element"></div>
			</div>
			
			<div class="offline-container" v-else>
				<IonIcon :icon="cloudOfflineOutline" class="offline-icon" />
				<h3>Sin conexión a internet</h3>
				<p>El mapa no está disponible, pero puedes registrar incidentes y se enviarán cuando recuperes la conexión.</p>
			</div>
			<div slot="fixed" class="incident-button-wrapper">
				<IonButton class="incident-button" shape="round" color="primary" @click="goToIncidentLog">
					<IonIcon slot="start" :icon="add" />
					Registrar Incidente
				</IonButton>
			</div>
    </IonContent>
  </IonPage>
</template>

<script setup lang="ts">
import { IonButton, IonContent, IonHeader, IonIcon, IonPage, IonTitle, IonToolbar, onIonViewWillLeave } from '@ionic/vue';
import { Geolocation, type CallbackID } from '@capacitor/geolocation';
import { onBeforeUnmount, onMounted, ref, markRaw, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { add, cloudOfflineOutline } from 'ionicons/icons';
import { Network } from '@capacitor/network';

const mapRef = ref<HTMLDivElement | null>(null);
let watchId: CallbackID | null = null;
const map = ref<maplibregl.Map | null>(null);
const marker = ref<maplibregl.Marker | null>(null);
const router = useRouter();
const isOffline = ref(false);

const goToIncidentLog = () => {
	router.push({ name: 'IncidentLog' });
};

const ensureMap = (lat: number, lng: number) => {
	if (isOffline.value || !mapRef.value) {
		return;
	}

	if (!map.value) {
		try {
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

			const newMap = new maplibregl.Map({
				container: mapRef.value,
				style: osmStyle as any,
				center: [lng, lat],
				zoom: 15,
			});
			map.value = markRaw(newMap);

			const newMarker = new maplibregl.Marker({ color: '#2563eb' })
				.setLngLat([lng, lat])
				.addTo(newMap);
			marker.value = markRaw(newMarker);
			
			newMap.addControl(new maplibregl.NavigationControl(), 'bottom-right');

		} catch (error) {
			console.error('Map init error', error);
		}
	} else {
		// Only fly if distance is significant to avoid jitter
		const current = map.value.getCenter();
		const dist = Math.sqrt(Math.pow(current.lng - lng, 2) + Math.pow(current.lat - lat, 2));
		if (dist > 0.0001) {
			map.value.flyTo({ center: [lng, lat], zoom: 16 });
			marker.value?.setLngLat([lng, lat]);
		}
	}
};

const startTracking = async () => {
	try {
		const permission = await Geolocation.checkPermissions();
		if (permission.location !== 'granted') {
			const request = await Geolocation.requestPermissions();
			if (request.location !== 'granted') {
				return;
			}
		}

		watchId = await Geolocation.watchPosition(
			{ enableHighAccuracy: true, timeout: 10_000 },
			(pos, error) => {
				if (error) {
					return;
				}

				if (pos) {
					ensureMap(pos.coords.latitude, pos.coords.longitude);
				}
			}
		);
	} catch (error) {
		console.error('Error iniciando geolocalización', error);
	}
};

const stopTracking = async () => {
	if (watchId) {
		await Geolocation.clearWatch({ id: watchId });
		watchId = null;
	}
};

const checkNetwork = async () => {
	const status = await Network.getStatus();
	isOffline.value = !status.connected;
	
	Network.addListener('networkStatusChange', async (status) => {
		const wasOffline = isOffline.value;
		isOffline.value = !status.connected;

		if (wasOffline && !isOffline.value) {
			// Recovering connection
			console.log('Connection recovered, re-initializing map...');
			
			// Clean up old map instance if needed
			if (map.value) {
				map.value.remove();
				map.value = null;
				marker.value = null;
			}

			// Wait for v-if to render the map div
			await nextTick();
			
			// If we are already tracking, the next position update will init the map.
			// But to be sure, we can try to get current position now
			try {
				const pos = await Geolocation.getCurrentPosition();
				ensureMap(pos.coords.latitude, pos.coords.longitude);
			} catch (e) {
				console.warn('Could not get immediate pos on reconnect', e);
			}
		}
	});
};

onMounted(async () => {
	await checkNetwork();
	// Init map immediately with default center (Temuco)
	// This ensures map is visible even if GPS is slow
	ensureMap(-38.739, -72.598);
	startTracking();
});

const cleanup = async () => {
	await stopTracking();
	if (map.value) {
		map.value.remove();
		map.value = null;
	}
	marker.value = null;
	await Network.removeAllListeners();
};

onBeforeUnmount(cleanup);
onIonViewWillLeave(cleanup); 

</script>

<style scoped>
.header-title {
	width: auto;
	text-align: left;
	padding-left: 12px;
}

.map-content {
	position: relative;
	--background: transparent;
}

.map-container {
	height: 100%;
	width: 100%;
}

.map-element {
	height: 100%;
	width: 100%;
}


.incident-button-wrapper {
	position: fixed;
	right: 1rem;
	bottom: calc(env(safe-area-inset-bottom, 0) + 5rem);
	z-index: 1300;
}

:global(.has-mobile-navbar) .incident-button-wrapper {
	bottom: calc(env(safe-area-inset-bottom, 0) + 5.5rem);
}

.incident-button {
	font-weight: 600;
	letter-spacing: 0.01em;
	--box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.offline-container {
	height: 100%;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 2rem;
	text-align: center;
	color: var(--ion-color-medium);
}

.offline-icon {
	font-size: 64px;
	margin-bottom: 1rem;
	color: var(--ion-color-medium);
}

.offline-container h3 {
	font-size: 1.25rem;
	font-weight: 600;
	margin: 0 0 0.5rem 0;
	color: var(--text-color);
}

.offline-container p {
	font-size: 0.9rem;
	margin: 0;
	max-width: 280px;
}
</style>
