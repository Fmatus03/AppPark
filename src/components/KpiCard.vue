<template>
	<ion-card class="kpi-card" :class="[`accent-${accent}`]">
		<ion-card-header>
			<ion-card-subtitle>{{ label }}</ion-card-subtitle>
			<ion-card-title>{{ value }}</ion-card-title>
		</ion-card-header>
		<ion-card-content v-if="description">
			<p>{{ description }}</p>
		</ion-card-content>
	</ion-card>
</template>

<script setup lang="ts">
import { IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle } from '@ionic/vue';

withDefaults(
	defineProps<{
		label: string;
		value: string | number;
		description?: string;
		accent?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
	}>(),
	{
		accent: 'neutral',
	}
);
</script>

<style scoped>
.kpi-card {
	--background: #ffffff;
	--color: #0f172a;
	color: #0f172a;
	margin: 0;
}

/* ... existing accent styles ... */
.kpi-card.accent-primary {
	border-top: 3px solid #2563eb;
}

.kpi-card.accent-success {
	border-top: 3px solid #16a34a;
}

.kpi-card.accent-warning {
	border-top: 3px solid #d97706;
}

.kpi-card.accent-danger {
	border-top: 3px solid #dc2626;
}

.kpi-card.accent-neutral {
	border-top: 3px solid #64748b;
}

.kpi-card p {
	margin: 0;
	color: #475569;
}

ion-card-subtitle {
	color: #64748b;
}

ion-card-title {
	color: #0f172a;
}
</style>
