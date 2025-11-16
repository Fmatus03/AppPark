<template>
	<ion-page>
		<ion-content fullscreen class="incident-detail-content">
			<div class="incident-detail-page">
				<header class="detail-header">
					<div>
						<h1>Incidente #{{ incident.id }} - {{ incident.title }}</h1>
						<p class="subtitle">Actualiza la informacion y guarda los cambios necesarios.</p>
					</div>
					<div class="header-actions">
						<button type="button" class="btn danger" @click="onEliminar">Eliminar Incidente</button>
						<button type="button" class="btn success" @click="onGuardar">Guardar Cambios</button>
					</div>
				</header>

				<section class="card">
					<header class="card-header">
						<h2>Detalles del Incidente</h2>
					</header>
					<form class="incident-form" @submit.prevent>
						<div class="form-row">
							<div class="field-group">
								<label for="route">Ruta</label>
								<input id="route" v-model="form.route" type="text" />
							</div>
							<div class="field-group">
								<label for="date">Fecha</label>
								<input id="date" v-model="form.date" type="date" />
							</div>
						</div>
						<div class="field-group">
							<label for="description">Descripcion</label>
							<textarea id="description" v-model="form.description" rows="4"></textarea>
						</div>
						<div class="form-row">
							<div class="field-group">
								<label for="category">Categoria</label>
								<div class="pill-row">
									<span class="status-pill status-category">{{ form.category }}</span>
									<button
										type="button"
										class="icon-btn"
										aria-label="Editar categoria"
										@click="categoryModalOpen = true"
									>
										<ion-icon :icon="createOutline" />
									</button>
								</div>
							</div>
							<div class="field-group">
								<label for="state">Estado</label>
								<div class="pill-row">
									<span class="status-pill status-state">{{ form.state }}</span>
									<button
										type="button"
										class="icon-btn"
										aria-label="Editar estado"
										@click="stateModalOpen = true"
									>
										<ion-icon :icon="createOutline" />
									</button>
								</div>
							</div>
						</div>
					</form>
				</section>

				<section class="card">
					<header class="card-header">
						<h2>Galeria de Fotos</h2>
					</header>
					<div class="photo-grid">
						<button
							v-for="photo in incident.photos"
							:key="photo"
							type="button"
							class="photo-card"
							aria-label="Ver foto"
						>
							<img :src="photo" alt="Foto del incidente" />
						</button>
					</div>
				</section>

				<section class="card">
					<header class="card-header">
						<h2>Archivos de Audio</h2>
					</header>
					<ul class="audio-list">
						<li v-for="audio in incident.audio" :key="audio.id" class="audio-item">
							<audio :src="audio.src" controls preload="none"></audio>
							<button type="button" class="icon-btn danger" aria-label="Eliminar audio">
								<ion-icon :icon="trashOutline" />
							</button>
						</li>
					</ul>
				</section>
			</div>

			<ion-modal
				:is-open="categoryModalOpen"
				@didDismiss="categoryModalOpen = false"
				:css-class="['selection-modal']"
			>
				<ion-header>
					<ion-toolbar>
						<ion-title>Selecciona una categoria</ion-title>
					</ion-toolbar>
				</ion-header>
				<ion-content class="selection-modal-content">
					<ion-list>
						<ion-item
							v-for="category in categories"
							:key="category"
							button
							:detail="false"
							:class="{ 'option-active': form.category === category }"
							@click="selectCategory(category)"
						>
							<ion-label>{{ category }}</ion-label>
						</ion-item>
					</ion-list>
				</ion-content>
			</ion-modal>

			<ion-modal
				:is-open="stateModalOpen"
				@didDismiss="stateModalOpen = false"
				:css-class="['selection-modal']"
			>
				<ion-header>
					<ion-toolbar>
						<ion-title>Selecciona un estado</ion-title>
					</ion-toolbar>
				</ion-header>
				<ion-content class="selection-modal-content">
					<ion-list>
						<ion-item
							v-for="state in states"
							:key="state"
							button
							:detail="false"
							:class="{ 'option-active': form.state === state }"
							@click="selectState(state)"
						>
							<ion-label>{{ state }}</ion-label>
						</ion-item>
					</ion-list>
				</ion-content>
			</ion-modal>
		</ion-content>
	</ion-page>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { IonContent, IonIcon, IonModal, IonPage, IonHeader, IonToolbar, IonTitle, IonList, IonItem, IonLabel } from '@ionic/vue';
import { createOutline, trashOutline } from 'ionicons/icons';


type IncidentAudio = {
	id: string;
	src: string;
};

type IncidentDetail = {
	id: number;
	title: string;
	photos: string[];
	audio: IncidentAudio[];
};

type IncidentForm = {
	route: string;
	date: string;
	description: string;
	category: string;
	state: string;
};

const incident: IncidentDetail = {
	id: 1,
	title: 'Fuga de Agua',
	photos: [
		'https://images.unsplash.com/photo-1529929355644-73321b4b4457?auto=format&fit=crop&w=600&q=80',
		'https://images.unsplash.com/photo-1551298370-9dbe0741a67b?auto=format&fit=crop&w=600&q=80',
		'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
	],
	audio: [
		{
			id: 'aud-1',
			src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
		},
		{
			id: 'aud-2',
			src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
		},
	],
};

const form = reactive<IncidentForm>({
	route: 'Ruta del Bosque',
	date: '2024-07-15',
	description:
		'Se ha detectado una fuga de agua en el sistema de refrigeracion del sotano. El agua esta goteando sobre el equipo de red. Se necesita intervencion urgente para evitar danos mayores.',
	category: 'Mantenimiento',
	state: 'Abierto',
});

const onEliminar = () => {
    alert(`Incidente #${incident.id} eliminado.`);
};
const onGuardar = () => {
    alert(`Cambios en el incidente #${incident.id} guardados.`);
};
const categories = ['Mantenimiento', 'Seguridad', 'Infraestructura', 'Emergencia'];
const states = ['Abierto', 'En revision', 'Cerrado'];

const categoryModalOpen = ref(false);
const stateModalOpen = ref(false);

const selectCategory = (category: string) => {
	form.category = category;
	categoryModalOpen.value = false;
};

const selectState = (state: string) => {
	form.state = state;
	stateModalOpen.value = false;
};
</script>

<style scoped>
.incident-detail-content {
	--background: linear-gradient(180deg, rgba(241, 245, 249, 0.9) 0%, rgba(248, 250, 252, 1) 100%);
}

.incident-detail-page {
	padding: 32px;
	display: flex;
	flex-direction: column;
	gap: 24px;
}

.detail-header {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 24px;
}

.detail-header h1 {
	margin: 0;
	font-size: 2rem;
	font-weight: 700;
	color: #111827;
}

.subtitle {
	margin: 6px 0 0;
	color: #64748b;
	font-size: 0.95rem;
}

.header-actions {
	display: flex;
	gap: 12px;
	flex-wrap: wrap;
}

.btn {
	border: none;
	border-radius: 12px;
	font-weight: 600;
	padding: 12px 20px;
	font-size: 0.95rem;
	cursor: pointer;
	transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.btn.danger {
	background: rgba(248, 113, 113, 0.12);
	color: #dc2626;
	box-shadow: 0 8px 16px rgba(220, 38, 38, 0.18);
}

.btn.danger:hover {
	transform: translateY(-1px);
	box-shadow: 0 12px 24px rgba(220, 38, 38, 0.22);
}

.btn.success {
	background: #22c55e;
	color: #ffffff;
	box-shadow: 0 8px 16px rgba(34, 197, 94, 0.22);
}

.btn.success:hover {
	transform: translateY(-1px);
	box-shadow: 0 12px 24px rgba(34, 197, 94, 0.3);
}

.card {
	background: #ffffff;
	border-radius: 20px;
	box-shadow: 0 18px 48px rgba(15, 23, 42, 0.08);
	border: 1px solid rgba(148, 163, 184, 0.18);
	padding: 24px;
	display: flex;
	flex-direction: column;
	gap: 20px;
}

.card-header h2 {
	margin: 0;
	font-size: 1.2rem;
	color: #1e293b;
	font-weight: 600;
}

.incident-form {
	display: flex;
	flex-direction: column;
	gap: 20px;
}

.form-row {
	display: flex;
	gap: 20px;
	flex-wrap: wrap;
}

.field-group {
	display: flex;
	flex-direction: column;
	flex: 1 1 260px;
	gap: 8px;
}

.field-group label {
	font-weight: 600;
	font-size: 0.85rem;
	color: #475569;
}

.field-group input,
.field-group textarea {
	border: 1px solid rgba(148, 163, 184, 0.6);
	border-radius: 14px;
	padding: 12px 16px;
	font-size: 0.95rem;
	color: #111827;
	background: #f8fafc;
}

.field-group textarea {
	resize: vertical;
	min-height: 120px;
}

.pill-row {
	display: flex;
	align-items: center;
	gap: 12px;
}

.status-pill {
	display: inline-flex;
	align-items: center;
	padding: 6px 14px;
	border-radius: 999px;
	font-weight: 600;
	font-size: 0.8rem;
}

.status-category {
	background: rgba(52, 211, 153, 0.16);
	color: #047857;
}

.status-state {
	background: rgba(248, 113, 113, 0.16);
	color: #b91c1c;
}

.icon-btn {
	border: none;
	background: transparent;
	padding: 6px;
	border-radius: 10px;
	color: #475569;
	cursor: pointer;
	transition: background-color 0.2s ease, color 0.2s ease;
}

.icon-btn:hover {
	background: rgba(148, 163, 184, 0.16);
	color: #2563eb;
}

.icon-btn.danger {
	color: #dc2626;
}

.icon-btn.danger:hover {
	background: rgba(248, 113, 113, 0.16);
}

.photo-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
	gap: 16px;
}

.photo-card {
	border: none;
	padding: 0;
	border-radius: 16px;
	overflow: hidden;
	cursor: pointer;
	box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12);
	transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.photo-card:hover {
	transform: translateY(-2px);
	box-shadow: 0 20px 44px rgba(15, 23, 42, 0.16);
}

.photo-card img {
	width: 100%;
	height: 120px;
	object-fit: cover;
}

.audio-list {
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
	gap: 14px;
}

.audio-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	background: rgba(248, 250, 252, 0.88);
	border-radius: 16px;
	padding: 14px 16px;
	box-shadow: inset 0 1px 0 rgba(148, 163, 184, 0.18);
}

.audio-item audio {
	flex: 1 1 auto;
	max-width: 360px;
	min-width: 200px;
}

@media (max-width: 900px) {
	.incident-detail-page {
		padding: 24px;
	}

	.detail-header {
		flex-direction: column;
		align-items: stretch;
	}

	.header-actions {
		justify-content: flex-start;
	}
}

@media (max-width: 600px) {
	.incident-detail-page {
		padding: 20px 16px;
	}

	.card {
		padding: 20px;
	}

	.btn {
		width: 100%;
	}

	.header-actions {
		flex-direction: column;
	}
}
</style>

<style>
.selection-modal {
	--width: min(420px, 92vw);
	--max-height: 420px;
	--border-radius: 22px;
	--box-shadow: 0 24px 60px rgba(15, 23, 42, 0.18);
	--backdrop-opacity: 0.45;
}

.selection-modal::part(content) {
	background: linear-gradient(180deg, #bbf7d0 0%, #ffffff 100%);
	border: 1px solid rgba(134, 239, 172, 0.24);
}

.selection-modal ion-toolbar {
	--background: linear-gradient(135deg, rgba(34, 197, 94, 0.24), rgba(22, 163, 74, 0.24));
	--color: #065f46;
	--border-width: 0;
	border-bottom: 1px solid rgba(134, 239, 172, 0.26);
}

.selection-modal ion-title {
	font-weight: 700;
	font-size: 1rem;
	letter-spacing: 0.01em;
}

.selection-modal .selection-modal-content {
	--background: transparent;
	padding: 18px 20px 12px;
}

.selection-modal ion-list {
	background: transparent;
	display: flex;
	flex-direction: column;
	gap: 12px;
	padding: 0;
	margin-top: 12px;
	margin-bottom: 0;
}

.selection-modal ion-item {
	--padding-start: 18px;
	--inner-padding-end: 18px;
	--min-height: 58px;
	--background: rgba(255, 255, 255, 0.94);
	--border-radius: 16px;
	--border-color: rgba(134, 239, 172, 0.32);
	--border-style: solid;
	--border-width: 1px;
	--detail-icon-opacity: 0;
	color: #065f46;
	font-weight: 600;
	box-shadow: 0 12px 26px rgba(52, 211, 153, 0.12);
	transition: transform 0.16s ease, box-shadow 0.16s ease, background-color 0.16s ease;
}

.selection-modal ion-item:hover {
	transform: translateY(-1px);
	box-shadow: 0 16px 34px rgba(34, 197, 94, 0.2);
	--background: rgba(187, 247, 208, 0.45);
}

.selection-modal ion-item.option-active {
	--background: rgba(34, 197, 94, 0.3);
	--border-color: rgba(52, 211, 153, 0.48);
	box-shadow: 0 18px 36px rgba(34, 197, 94, 0.22);
	color: #065f46;
}

.selection-modal ion-item.option-active ion-label {
	font-weight: 700;
}

.selection-modal ion-label {
	color: inherit;
}
</style>
