<template>
	<ion-page class="nav-test-page">
		<ion-header translucent>
			<ion-toolbar>
				<ion-title>NavBar Preview</ion-title>
			</ion-toolbar>
		</ion-header>

		<ion-content fullscreen>
			<section class="placeholder">
				<p>Contenido de prueba para revisar el NavBar fijo.</p>
				<p>Desplázate o cambia de ruta para validar el comportamiento.</p>
			</section>
		</ion-content>
	</ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/vue';
</script>

<style scoped>
.nav-test-page {
	background: #f8f9fb;
}

.placeholder {
	min-height: 60vh;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	color: #2f3640;
	gap: 12px;
	text-align: center;
}
</style>
