<template>
	<div class="analytics-chart" :style="{ height: `${height}px` }">
		<canvas ref="canvasRef"></canvas>
	</div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { Chart, ChartConfiguration, ChartData, ChartOptions, ChartType } from 'chart.js/auto';

const props = withDefaults(
	defineProps<{
		type: ChartType;
		data: ChartData;
		options?: ChartOptions;
		height?: number;
	}>(),
	{
		height: 280,
	}
);

const canvasRef = ref<HTMLCanvasElement | null>(null);
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
</style>
