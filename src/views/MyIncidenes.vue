<template>
	<ion-page>
		<ion-header>
			<ion-toolbar>
				<ion-title>Mis incidentes</ion-title>
			</ion-toolbar>
			<ion-toolbar>
				<ion-searchbar
					v-model="searchQuery"
					placeholder="Buscar por titulo"
					show-clear-button="always"
				></ion-searchbar>
			</ion-toolbar>
		</ion-header>

		<ion-content :fullscreen="true" class="ion-padding">
			<section class="incident-list" aria-live="polite">
				<ion-card
					v-for="incident in filteredIncidents"
					:key="incident.id"
					class="incident-card"
					button
					@click="goToIncident(incident.id)"
				>
					<ion-card-header>
						<ion-card-title>{{ incident.title }}</ion-card-title>
					</ion-card-header>
					<ion-card-content>
						<div class="card-row">
							<div class="card-text">
								<p class="description">{{ truncateDescription(incident.description) }}</p>
								<div class="meta-row">
									<ion-icon :icon="calendarOutline" class="meta-icon" aria-hidden="true" />
									<span class="meta-date">{{ formatDate(incident.date) }}</span>
								</div>
							</div>
							<div class="card-actions">
								<ion-chip
									class="status-chip"
									:color="statusToColor(incident.status)"
									fill="outline"
									size="small"
								>
									<ion-label class="status-label">{{ incident.status }}</ion-label>
								</ion-chip>
								<ion-icon :icon="chevronForwardOutline" class="card-icon" aria-hidden="true" />
							</div>
						</div>
					</ion-card-content>
				</ion-card>

				<p v-if="filteredIncidents.length === 0" class="empty-message">
					No se encontraron incidentes.
				</p>
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
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
	IonCard,
	IonCardContent,
	IonCardHeader,
	IonCardTitle,
	IonChip,
	IonContent,
	IonHeader,
	IonIcon,
	IonLabel,
	IonPage,
	IonSearchbar,
	IonTitle,
	IonToolbar,
} from '@ionic/vue';
import { calendarOutline, chevronForwardOutline } from 'ionicons/icons';

type IncidentStatus = 'abierto' | 'en revision' | 'cerrado';

interface Incident {
	id: number;
	title: string;
	date: string;
	description: string;
	status: IncidentStatus;
}

const searchQuery = ref('');
const router = useRouter();

const goToIncident = (incidentId: number) => {
	router.push({
		name: 'IncidentDetail',
		query: { id: String(incidentId) },
	});
};

const incidents: Incident[] = [
	{
		id: 1,
		title: 'Fuga de agua en el estacionamiento',
		date: '2025-11-04T09:15:00Z',
		description: 'Se detecto una fuga a la altura del nivel -1 cerca de la rampa.',
		status: 'abierto',
	},
	{
		id: 2,
		title: 'Punto de luz danado',
		date: '2025-10-28T18:20:00Z',
		description: 'Luminaria sin funcionar en el pasillo central del tercer piso.',
		status: 'en revision',
	},
	{
		id: 3,
		title: 'Acceso bloqueado por vehiculo',
		date: '2025-10-15T07:45:00Z',
		description: 'Vehiculo estacionado en la salida de emergencia norte.',
		status: 'cerrado',
	},
    {
        id: 4,
        title: 'Elevador fuera de servicio',
        date: '2025-11-01T12:30:00Z',
        description: 'El elevador principal no responde a las llamadas.',
        status: 'abierto',
    },
    {
        id: 5,
        title: 'Problema con el sistema de seguridad',
        date: '2025-10-22T14:10:00Z',
        description: 'Alarmas que se activan sin motivo aparente en el segundo piso.',
        status: 'en revision',
    },
    {
        id: 6,
        title: 'Falta de señalizacion en escaleras',
        date: '2025-10-10T09:00:00Z',
        description: 'Señales de emergencia ausentes en las escaleras del edificio A.',
        status: 'cerrado',
    },
    {
        id: 7,
        title: 'Puerta de entrada principal dañada',
        date: '2025-11-03T11:25:00Z',
        description: 'La puerta no cierra correctamente y presenta daños visibles.',
        status: 'abierto',
    },
];

const normalizedQuery = computed(() => searchQuery.value.trim().toLowerCase());

const filteredIncidents = computed(() => {
	if (!normalizedQuery.value) {
		return incidents;
	}

	return incidents.filter((incident) =>
		incident.title.toLowerCase().includes(normalizedQuery.value)
	);
});

const statusColorMap: Record<IncidentStatus, string> = {
	abierto: 'success',
	'en revision': 'warning',
	cerrado: 'medium',
};

const statusToColor = (status: IncidentStatus) => statusColorMap[status] ?? 'medium';

const truncateDescription = (description: string, maxWords = 5) => {
	const words = description.trim().split(/\s+/);
	if (words.length <= maxWords) {
		return words.join(' ');
	}
	return `${words.slice(0, maxWords).join(' ')}...`;
};

const formatDate = (dateString: string) =>
	new Date(dateString).toLocaleDateString('es-ES', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	});
</script>

<style scoped>
.incident-list {
	display: flex;
	flex-direction: column;
	gap: 1rem;
}

.incident-card {
	cursor: pointer;
}

.card-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 1rem;
}

.card-text {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
}

.description {
	margin: 0;
	color: var(--ion-color-step-600, #5e5e5e);
	line-height: 1.4;
}

.meta-row {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	color: var(--ion-color-step-600, #5e5e5e);
	font-size: 0.9rem;
}

.meta-icon {
	color: var(--ion-color-step-600, #5e5e5e);
	font-size: 1rem;
}

.meta-date {
	line-height: 1;
}

.card-actions {
	display: flex;
	align-items: center;
	gap: 0.75rem;
}

.status-chip {
	display: inline-flex;
	align-items: center;
	--padding-start: 0.75rem;
	--padding-end: 0.75rem;
}

.status-label {
	text-transform: capitalize;
	font-size: 0.85rem;
	white-space: nowrap;
}

.card-icon {
	font-size: 1.5rem;
	color: var(--ion-color-medium, #92949c);
	display: flex;
	align-items: center;
	justify-content: center;
}

.empty-message {
	text-align: center;
	color: var(--ion-color-medium, #92949c);
	margin-top: 2rem;
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

</style>
