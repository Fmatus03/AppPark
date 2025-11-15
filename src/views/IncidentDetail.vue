<template>
	<ion-page>
		<ion-header :translucent="true">
			<ion-toolbar>
				<ion-buttons slot="start">
					<ion-back-button default-href="/myIncidents"></ion-back-button>
				</ion-buttons>
				<ion-title>Detalles incidente</ion-title>
			</ion-toolbar>
		</ion-header>

		<ion-content :fullscreen="true" class="incident-content">
			<section class="incident-summary">
				<ion-card class="incident-card">
					<ion-card-header>
						<ion-card-title>{{ incident.title }}</ion-card-title>
					</ion-card-header>
					<ion-card-content>
						<p>{{ incident.description }}</p>
					</ion-card-content>
				</ion-card>
			</section>

			<section class="incident-details">
				<ion-card class="incident-card">
					<ion-card-header>
						<ion-card-title>Detalles del Incidente</ion-card-title>
					</ion-card-header>
					<ion-card-content>
						<ion-list lines="none">
							<ion-item v-for="detail in incidentDetails" :key="detail.id">
								<ion-icon slot="start" :icon="detail.icon" class="detail-icon" aria-hidden="true" />
								<ion-label>
									<h3>{{ detail.label }}</h3>
									<p>{{ detail.value }}</p>
								</ion-label>
							</ion-item>
						</ion-list>
					</ion-card-content>
				</ion-card>
			</section>

			<section class="incident-evidence">
				<ion-card class="incident-card">
					<ion-card-header>
						<ion-card-title>Evidencia</ion-card-title>
					</ion-card-header>
					<ion-card-content class="evidence-content">
						<div class="evidence-gallery" v-if="incident.evidence.images.length">
							<h3>Imágenes</h3>
							<div class="image-grid">
								<ion-card v-for="image in incident.evidence.images" :key="image.id" class="image-card">
									<ion-img :src="image.src" :alt="image.alt" loading="lazy" />
								</ion-card>
							</div>
						</div>

						<div class="evidence-audio" v-if="incident.evidence.audios.length">
							<h3>Audio</h3>
							<ion-list lines="none">
								<ion-item v-for="audio in incident.evidence.audios" :key="audio.id" class="audio-item">
									<audio controls :src="audio.src"></audio>
								</ion-item>
							</ion-list>
						</div>
					</ion-card-content>
				</ion-card>

				<ion-chip class="safe-area-spacer" aria-hidden="true" disabled>
					Espacio reservado
				</ion-chip>
                <ion-chip class="safe-area-spacer" aria-hidden="true" disabled>
					Espacio reservado
				</ion-chip>
                <ion-chip class="safe-area-spacer" aria-hidden="true" disabled>
					Espacio reservado
				</ion-chip>
                <ion-chip class="safe-area-spacer" aria-hidden="true" disabled>
					Espacio reservado
				</ion-chip>
                <ion-chip class="safe-area-spacer" aria-hidden="true" disabled>
					Espacio reservado
				</ion-chip>
                <ion-chip class="safe-area-spacer" aria-hidden="true" disabled>
					Espacio reservado
				</ion-chip>
			</section>
		</ion-content>
	</ion-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import {
	IonBackButton,
	IonButtons,
	IonCard,
	IonCardContent,
	IonCardHeader,
	IonCardTitle,
	IonContent,
	IonHeader,
	IonImg,
	IonItem,
	IonLabel,
	IonList,
	IonPage,
	IonIcon,
	IonTitle,
	IonToolbar,
} from '@ionic/vue';
import {
	calendarOutline,
	locationOutline,
	pricetagOutline,
	timeOutline,
} from 'ionicons/icons';

interface IncidentMedia {
	readonly id: string;
	readonly src: string;
	readonly alt?: string;
	readonly caption?: string;
	readonly title?: string;
	readonly description?: string;
}

interface Incident {
	readonly id: string;
	readonly title: string;
	readonly description: string;
	readonly category: string;
	readonly location: string;
	readonly date: string;
	readonly time: string;
	readonly evidence: {
		readonly images: IncidentMedia[];
		readonly audios: IncidentMedia[];
	};
}

const incidentsMock: Incident[] = [
	{
		id: '1',
		title: 'Obstrucción en acceso principal',
		description:
			'Se reporta un vehículo mal estacionado que bloquea la entrada principal del estacionamiento. Se solicita retirar el vehículo para restablecer el flujo de ingreso.',
		category: 'Estacionamiento indebido',
		location: 'Acceso principal - Nivel 1',
		date: '15 de noviembre de 2025',
		time: '08:45 hrs',
		evidence: {
			images: [
				{
					id: 'img-1',
					src: 'https://images.unsplash.com/photo-1517512006864-7edc3b933137?auto=format&fit=crop&w=900&q=60',
					alt: 'Vehículo bloqueando el acceso',
					caption: 'Vehículo estacionado frente a la barrera principal.',
				},
				{
					id: 'img-2',
					src: 'https://images.unsplash.com/photo-1462396881884-de2c07cb95ed?auto=format&fit=crop&w=900&q=60',
					alt: 'Entrada congestionada',
					caption: 'Vista general de la congestión generada.',
				},
			],
			audios: [
				{
					id: 'aud-1',
					src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
					title: 'Testigo 1',
					description: 'Descripción del testigo sobre el incidente.',
				},
				{
					id: 'aud-2',
					src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
					title: 'Testigo 2',
					description: 'Complemento del relato original.',
				},
			],
		},
	},
	{
		id: '2',
		title: 'Fallo en barrera automática',
		description:
			'La barrera norte dejó de funcionar y permanece abierta. Se requiere revisión del sistema y activación manual temporal.',
		category: 'Falla técnica',
		location: 'Sector norte - Nivel 2',
		date: '14 de noviembre de 2025',
		time: '19:30 hrs',
		evidence: {
			images: [
				{
					id: 'img-3',
					src: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=60',
					alt: 'Barrera automática inactiva',
					caption: 'Detalle del panel de control sin actividad.',
				},
			],
			audios: [],
		},
	},
];

const route = useRoute();

const defaultIncident = incidentsMock[0];

const incident = computed(() => {
	const queryId = route.query.id?.toString();
	if (!queryId) {
		return defaultIncident;
	}
	return incidentsMock.find((item) => item.id === queryId) ?? defaultIncident;
});

const incidentDetails = computed(() => {
	const current = incident.value;
	return [
		{ id: 'category', label: 'Categoría', value: current.category, icon: pricetagOutline },
		{ id: 'location', label: 'Ubicación', value: current.location, icon: locationOutline },
		{ id: 'date', label: 'Fecha', value: current.date, icon: calendarOutline },
		{ id: 'time', label: 'Hora', value: current.time, icon: timeOutline },
	];
});
</script>

<style scoped>
.incident-content {
	--background: var(--ion-color-light, #f5f5f5);
	padding: 16px;
	display: flex;
	flex-direction: column;
	gap: 24px;
}

.incident-card {
	box-shadow: 0 12px 24px -12px rgba(15, 23, 42, 0.35);
	border-radius: 18px;
}

.incident-card ion-card-header {
	padding-bottom: 0;
}

.incident-card ion-card-title {
	font-size: 1.25rem;
	font-weight: 650;
}

.incident-summary .incident-card ion-card-header {
	padding-bottom: 20px;
}

.incident-summary ion-card p {
	margin: 0;
	color: #333;
	line-height: 1.4;
}

.incident-details ion-item {
	--inner-padding-end: 0;
	--inner-padding-start: 0;
}

.incident-details .detail-icon {
	font-size: 1.4rem;
	color: #2eae78;
}

.incident-details h3 {
	margin: 0 0 4px;
	font-size: 0.9rem;
	text-transform: uppercase;
	color: var(--ion-color-medium, #666);
}

.incident-details p {
	margin: 0;
	font-size: 1rem;
	color: #111;
}

.incident-evidence h2 {
	margin: 0 0 12px;
	font-size: 1.1rem;
}

.incident-evidence h3 {
	margin: 16px 0 8px;
	font-size: 1rem;
}

.evidence-content {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.image-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
	gap: 16px;
}

.image-card ion-img {
	width: 100%;
	height: 160px;
	object-fit: cover;
}

.evidence-audio .audio-item {
	align-items: center;
}

.evidence-audio audio {
	width: 100%;
	max-width: 320px;
}

.safe-area-spacer {
	opacity: 0;
	width: 100%;
	min-height: 0;
	margin: 0;
	padding: 0;
}

:global(.has-mobile-navbar) .safe-area-spacer {
	min-height: calc(env(safe-area-inset-bottom, 0) + 4.75rem);
}
@media (max-width: 480px) {
	.incident-content {
		padding: 12px;
		gap: 16px;
	}

	.image-card ion-img {
		height: 140px;
	}

	.evidence-audio audio {
		width: 140px;
	}
}
</style>

