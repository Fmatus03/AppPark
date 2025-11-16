<template>
  <IonPage>
    <IonHeader translucent>
      <IonToolbar>
        <IonTitle class="header-title">Home</IonTitle>
      </IonToolbar>
    </IonHeader>
		<IonContent fullscreen class="map-content">
			<div class="map-container">
				<div ref="mapRef" class="leaflet-map"></div>
			</div>
			<div slot="fixed" class="incident-button-wrapper">
				<IonButton class="incident-button" shape="round" @click="goToIncidentLog">
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
import { add } from 'ionicons/icons';

const mapRef = ref<HTMLDivElement | null>(null);
let watchId: CallbackID | null = null;
let map: L.Map | null = null;
let marker: L.Marker | null = null;
const router = useRouter();

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
	if (!mapRef.value) {
		return;
	}

	if (!map) {
		map = L.map(mapRef.value).setView([lat, lng], 16);
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '&copy; OpenStreetMap contributors',
			maxZoom: 19,
		}).addTo(map);
		marker = L.marker([lat, lng], { icon: defaultIcon }).addTo(map);
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

onMounted(() => {
	startTracking();
});

onBeforeUnmount(async () => {
	await stopTracking();
	map?.remove();
	map = null;
	marker = null;
});
</script>

<style scoped>
.header-title {
	width: 100%;
	text-align: center;
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
	--background: #24b34b;
	--background-hover: #1f9a3f;
	--box-shadow: 0 6px 16px rgba(36, 179, 75, 0.35);
	font-weight: 600;
	letter-spacing: 0.01em;
}

</style>
