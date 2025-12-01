<template>
	<div class="overview-filter-bar">
		<div class="filter-group">
			<!-- Date Range -->
			<div class="filter-item" v-if="showDateRange">
				<ion-label position="stacked">Rango de Fechas</ion-label>
				<div class="date-inputs">
					<ion-datetime-button datetime="startDate"></ion-datetime-button>
					<span class="separator">-</span>
					<ion-datetime-button datetime="endDate"></ion-datetime-button>
				</div>
				
				<ion-modal :keep-contents-mounted="true">
					<template #default>
						<ion-datetime id="startDate" presentation="date-time" v-model="filters.dateRange.startDate"></ion-datetime>
					</template>
				</ion-modal>
				<ion-modal :keep-contents-mounted="true">
					<template #default>
						<ion-datetime id="endDate" presentation="date-time" v-model="filters.dateRange.endDate"></ion-datetime>
					</template>
				</ion-modal>
			</div>

			<!-- Annual Comparison -->
			<div class="filter-item" v-if="showYearly">
				<ion-label position="stacked">Comparación Anual</ion-label>
				<div class="row-inputs">
					<ion-select v-model="filters.year" interface="popover" class="year-select" placeholder="Año Actual">
						<ion-select-option v-for="year in availableYears" :key="year" :value="year">{{ year }}</ion-select-option>
					</ion-select>
					<span class="separator">vs</span>
					<ion-select v-model="filters.yearComparison" interface="popover" class="year-select" placeholder="Año Previo">
						<ion-select-option v-for="year in availableYears" :key="year" :value="year">{{ year }}</ion-select-option>
					</ion-select>
				</div>
			</div>

			<!-- Monthly Comparison -->
			<div class="filter-item" v-if="showMonthly">
				<ion-label position="stacked">Comparación Mensual</ion-label>
				<div class="date-inputs">
					<ion-datetime-button datetime="month1"></ion-datetime-button>
					<span class="separator">vs</span>
					<ion-datetime-button datetime="month2"></ion-datetime-button>
				</div>
				<ion-modal :keep-contents-mounted="true">
					<template #default>
						<ion-datetime id="month1" presentation="month-year" v-model="filters.month1"></ion-datetime>
					</template>
				</ion-modal>
				<ion-modal :keep-contents-mounted="true">
					<template #default>
						<ion-datetime id="month2" presentation="month-year" v-model="filters.month2"></ion-datetime>
					</template>
				</ion-modal>
			</div>

			<!-- Grouping -->
			<div class="filter-item" v-if="showGrouping">
				<ion-label position="stacked">Agrupación</ion-label>
				<ion-select v-model="filters.grouping" interface="popover" class="year-select">
					<ion-select-option value="DIARIO">Diario</ion-select-option>
					<ion-select-option value="SEMANAL">Semanal</ion-select-option>
					<ion-select-option value="MENSUAL">Mensual</ion-select-option>
					<ion-select-option value="ANUAL">Anual</ion-select-option>
				</ion-select>
			</div>
		</div>

		<!-- Advanced Params (Collapsible or just another row) -->
		<div class="filter-group secondary-group" v-if="showAdvanced">
			<div class="filter-item small" v-if="showTopRoutes">
				<ion-label position="stacked">Top Rutas</ion-label>
				<ion-input type="number" v-model.number="filters.topRoutes" class="number-input"></ion-input>
			</div>
			<div class="filter-item small" v-if="showRecurrence">
				<ion-label position="stacked">Umbral Recurrencia</ion-label>
				<ion-input type="number" v-model.number="filters.recurrenceThreshold" class="number-input"></ion-input>
			</div>
			<div class="filter-item small" v-if="showTopRanking">
				<ion-label position="stacked">Top Ranking</ion-label>
				<ion-input type="number" v-model.number="filters.topRanking" class="number-input"></ion-input>
			</div>
		</div>

		<div class="actions">
			<ion-button @click="$emit('refresh')" fill="solid" size="default">
				<ion-icon :icon="refreshOutline" slot="start" />
				Actualizar
			</ion-button>
		</div>
	</div>
</template>

<script setup lang="ts">
import {
	IonLabel,
	IonDatetime,
	IonDatetimeButton,
	IonModal,
	IonSelect,
	IonSelectOption,
	IonButton,
	IonIcon,
	IonInput,
} from '@ionic/vue';
import { refreshOutline } from 'ionicons/icons';
import { computed } from 'vue';

const props = defineProps<{
	filters: {
		dateRange: { startDate: string; endDate: string };
		year: number;
		yearComparison: number;
		month1: string;
		month2: string;
		grouping: string;
		topRoutes: number;
		recurrenceThreshold: number;
		topRanking: number;
	};
	activeReports: Record<string, boolean>;
}>();

defineEmits(['refresh']);

const currentYear = new Date().getFullYear();
const availableYears = computed(() => {
	const years = [];
	for (let i = 0; i < 5; i++) {
		years.push(currentYear - i);
	}
	return years;
});

// Visibility Logic
const showDateRange = computed(() => {
	const r = props.activeReports;
	return (
		r['tendencias-categorias'] ||
		r['evolucion-categorias'] ||
		r['analisis-horario'] ||
		r['rutas-criticas'] ||
		r['patrones-horarios'] ||
		r['incidentes-recurrentes'] ||
		r['comparacion-zonas'] ||
		r['tiempo-resolucion'] ||
		r['ranking-rutas'] ||
		r['proporcion-estados'] ||
		r['eficiencia-cierre']
	);
});

const showYearly = computed(() => props.activeReports['comparacion-anual'] || props.activeReports['analisis-estacional']);
const showMonthly = computed(() => props.activeReports['comparacion-mensual']);
const showGrouping = computed(() => props.activeReports['evolucion-categorias'] || props.activeReports['ranking-rutas']);
const showTopRoutes = computed(() => props.activeReports['rutas-criticas']);
const showRecurrence = computed(() => props.activeReports['incidentes-recurrentes']);
const showTopRanking = computed(() => props.activeReports['ranking-rutas']);

const showAdvanced = computed(() => showTopRoutes.value || showRecurrence.value || showTopRanking.value);
</script>

<style scoped>
.overview-filter-bar {
	background: #ffffff;
	padding: 16px;
	border-radius: 12px;
	margin-bottom: 20px;
	display: flex;
	flex-direction: column;
	gap: 20px;
	box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
	border: 1px solid #e2e8f0;
}

.filter-group {
	display: flex;
	flex-wrap: wrap;
	gap: 24px;
	align-items: flex-end;
}

.secondary-group {
	padding-top: 16px;
	border-top: 1px solid #e2e8f0;
}

.filter-item {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.filter-item.small {
	width: 120px;
}

.date-inputs, .row-inputs {
	display: flex;
	align-items: center;
	gap: 8px;
	background: #f8fafc;
	padding: 4px 8px;
	border-radius: 8px;
	border: 1px solid #e2e8f0;
}

.separator {
	color: #64748b;
	font-weight: bold;
}

.year-select {
	min-width: 100px;
	background: transparent;
	border: none;
	color: #0f172a;
	--padding-start: 4px;
	--padding-end: 4px;
	--placeholder-color: #64748b;
	--color: #0f172a;
}

.number-input {
	background: #f8fafc;
	border-radius: 8px;
	border: 1px solid #e2e8f0;
	--padding-start: 12px;
	--padding-end: 12px;
	--color: #0f172a;
	height: 44px;
}

ion-label {
	font-size: 0.85rem;
	font-weight: 600;
	color: #475569;
	margin-bottom: 4px;
}

.actions {
	align-self: flex-end;
}

/* Force light mode for Ionic components inside */
ion-datetime-button {
	--background: transparent;
	--color: #0f172a;
}

@media (max-width: 768px) {
	.filter-group {
		flex-direction: column;
		align-items: stretch;
	}

	.actions {
		align-self: stretch;
		margin-top: 16px;
	}
	
	.filter-item.small {
		width: 100%;
	}
}
</style>
