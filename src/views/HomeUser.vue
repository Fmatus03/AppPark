<template>
  <IonPage>
    <IonHeader translucent>
      <IonToolbar>
        <IonTitle class="header-title">Home</IonTitle>
      </IonToolbar>
    </IonHeader>
		<IonContent fullscreen class="map-content">
			<div class="map-container" v-if="!isOffline">
				<div ref="mapRef" class="leaflet-map"></div>
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
import { IonButton, IonContent, IonHeader, IonIcon, IonPage, IonTitle, IonToolbar } from '@ionic/vue';
import { Geolocation, type CallbackID } from '@capacitor/geolocation';
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { add, cloudOfflineOutline } from 'ionicons/icons';
import { Network } from '@capacitor/network';

const mapRef = ref<HTMLDivElement | null>(null);
let watchId: CallbackID | null = null;
let map: L.Map | null = null;
let marker: L.Marker | null = null;
const router = useRouter();
const isOffline = ref(false);

const goToIncidentLog = () => {
	router.push({ name: 'IncidentLog' });
};

const defaultIcon = L.icon({
	iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).toString(),
	iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).toString(),
	shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).toString(),
	iconSize: [25, 41],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
	shadowSize: [41, 41],
});

const ensureMap = (lat: number, lng: number) => {
	if (isOffline.value || !mapRef.value) {
		return;
	}

	if (!map) {
		try {
			map = L.map(mapRef.value).setView([lat, lng], 16);
			L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution: '&copy; OpenStreetMap contributors',
				maxZoom: 19,
			}).addTo(map);
			marker = L.marker([lat, lng], { icon: defaultIcon }).addTo(map);
		} catch (error) {
			console.error('Map init error', error);
		}
	} else {
		map.setView([lat, lng], map.getZoom());
		marker?.setLatLng([lat, lng]);
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

import { nextTick } from 'vue';

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
			if (map) {
				map.remove();
				map = null;
				marker = null;
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
	startTracking();
});

onBeforeUnmount(async () => {
	await stopTracking();
	map?.remove();
	map = null;
	marker = null;
	await Network.removeAllListeners();
});
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

.leaflet-map {
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
