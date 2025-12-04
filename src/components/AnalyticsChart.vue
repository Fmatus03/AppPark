<template>
	<div class="analytics-chart" :style="{ height: `${height}px` }" @mouseenter="showDownload = true" @mouseleave="showDownload = false">
		<canvas ref="canvasRef"></canvas>
		<button v-if="showDownload" class="download-btn" @click="downloadChart" title="Descargar gráfico">
			<ion-icon :icon="downloadOutline" />
		</button>
	</div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { Chart, ChartConfiguration, ChartData, ChartOptions, ChartType } from 'chart.js/auto';
import { IonIcon } from '@ionic/vue';
import { downloadOutline } from 'ionicons/icons';

const props = withDefaults(
	defineProps<{
		type: ChartType;
		data: ChartData;
		options?: ChartOptions;
		height?: number;
		title?: string;
	}>(),
	{
		height: 280,
		title: 'grafico',
	}
);

const canvasRef = ref<HTMLCanvasElement | null>(null);
const showDownload = ref(false);
let chartInstance: Chart | null = null;

const renderChart = () => {
	if (!canvasRef.value) return;
	chartInstance?.destroy();
	const config: ChartConfiguration = {
		type: props.type,
		data: props.data,
		options: props.options,
	};
	chartInstance = new Chart(canvasRef.value, config);
};

const downloadChart = () => {
	if (!chartInstance) return;
	const link = document.createElement('a');
	link.download = `${props.title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.png`;
	link.href = chartInstance.toBase64Image();
	link.click();
};

onMounted(renderChart);

watch(
	() => ({ data: props.data, options: props.options, type: props.type }),
	() => {
		renderChart();
	},
	{ deep: true }
);

onBeforeUnmount(() => {
	chartInstance?.destroy();
});
</script>

<style scoped>
.analytics-chart {
	position: relative;
	width: 100%;
}

canvas {
	width: 100% !important;
	height: 100% !important;
}

.download-btn {
	position: absolute;
	top: 8px;
	right: 8px;
	background: rgba(255, 255, 255, 0.9);
	border: 1px solid #e2e8f0;
	border-radius: 6px;
	width: 32px;
	height: 32px;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	color: #64748b;
	transition: all 0.2s;
	z-index: 10;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.download-btn:hover {
	background: #fff;
	color: #0f172a;
	transform: translateY(-1px);
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
</style>
