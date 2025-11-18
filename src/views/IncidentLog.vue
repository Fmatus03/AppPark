<template>
	<IonPage>
		<IonHeader translucent>
			<IonToolbar class="page-toolbar">
				<IonButtons slot="start">
					<ion-button class="header-back-button" fill="clear" @click="goToHome" aria-label="Volver a inicio">
						<ion-icon slot="icon-only" :icon="arrowBackOutline" aria-hidden="true" />
					</ion-button>
				</IonButtons>
				<IonTitle class="page-title">Nuevo Incidente</IonTitle>
				<div slot="end" class="toolbar-spacer"></div>
			</IonToolbar>
		</IonHeader>

		<IonContent fullscreen class="form-content">
			<div class="form-card">
				<!-- Información general -->
				<ion-input
					v-model="incidentTitle"
					label="Título del incidente"
					label-placement="stacked"
					placeholder="Ingresa un título"
					type="text"
					autocomplete="off"
					inputmode="text"
				>
					<ion-icon slot="start" :icon="documentTextOutline" aria-hidden="true" />
					<ion-button
						v-show="incidentTitle.length > 0"
						fill="clear"
						slot="end"
						type="button"
						@click="clearTitle"
						aria-label="Limpiar título"
					>
						<ion-icon slot="icon-only" :icon="closeCircle" aria-hidden="true" />
					</ion-button>
				</ion-input>

				<ion-input
					v-model="incidentDescription"
					label="Descripción del incidente"
					label-placement="stacked"
					placeholder="Describe lo sucedido"
					type="text"
					autocomplete="off"
					inputmode="text"
				>
					<ion-icon slot="start" :icon="chatboxEllipsesOutline" aria-hidden="true" />
					<ion-button
						v-show="incidentDescription.length > 0"
						fill="clear"
						slot="end"
						type="button"
						@click="clearDescription"
						aria-label="Limpiar descripción"
					>
						<ion-icon slot="icon-only" :icon="closeCircle" aria-hidden="true" />
					</ion-button>
				</ion-input>

				<section class="category-section">
					<h2 class="section-title">Categoría</h2>
					<div class="chip-row">
						<ion-chip
							v-for="category in categories"
							:key="category"
							class="category-chip"
							:class="{ active: selectedCategory === category }"
							@click="selectCategory(category)"
						>
							{{ category }}
						</ion-chip>
					</div>
				</section>

				<section class="evidence-section">
					<h2 class="section-title">Evidencia</h2>
					<div class="evidence-columns">
						<div class="evidence-block">
							<h3 class="evidence-subtitle">Imágenes</h3>
							<div class="evidence-actions">
								<ion-button expand="block" :disabled="isCapturing" @click="capturePhoto">
									<ion-icon slot="start" :icon="cameraOutline" aria-hidden="true" />
									Tomar foto
								</ion-button>
								<ion-button expand="block" fill="outline" :disabled="isCapturing" @click="pickFromGallery">
									<ion-icon slot="start" :icon="imageOutline" aria-hidden="true" />
									Elegir de la galería
								</ion-button>
							</div>

							<p v-if="!evidencePhotos.length" class="evidence-placeholder">
								Aún no has añadido evidencia fotográfica.
							</p>
							<div v-else class="photos-grid">
								<ion-img
									v-for="(photo, index) in evidencePhotos"
									:key="photo.webPath ?? photo.path ?? index"
									:src="photoSrc(photo)"
									alt="Evidencia del incidente"
									loading="lazy"
								/>
							</div>
						</div>

						<div class="evidence-block">
							<h3 class="evidence-subtitle">Audio</h3>
							<div class="audio-controls">
								<ion-button expand="block" :disabled="isRecordingAudio || isProcessingAudio" @click="startAudioRecording">
									<ion-icon slot="start" :icon="micOutline" aria-hidden="true" />
									Iniciar grabación
								</ion-button>
								<ion-button
									expand="block"
									color="danger"
									:disabled="!isRecordingAudio || isProcessingAudio"
									@click="stopAudioRecording"
								>
									<ion-icon slot="start" :icon="stopCircleOutline" aria-hidden="true" />
									Detener y guardar
								</ion-button>
							</div>

							<p v-if="!audioEvidence.length" class="evidence-placeholder">
								Aún no has añadido grabaciones de audio.
							</p>
							<ion-list v-else lines="none" class="audio-list">
								<ion-item v-for="audio in audioEvidence" :key="audio.id" class="audio-item">
									<audio :src="audio.dataUrl" controls preload="metadata"></audio>
									<ion-button slot="end" fill="clear" color="danger" @click="removeAudioEvidence(audio.id)">
										<ion-icon slot="icon-only" :icon="trashOutline" aria-hidden="true" />
									</ion-button>
								</ion-item>
							</ion-list>
						</div>
					</div>
				</section>

				<ion-button
					expand="block"
					class="submit-button"
					color="success"
					size="large"
					@click="submitIncident"
				>
					Enviar incidente
				</ion-button>
				<ion-chip class="safe-area-spacer" aria-hidden="true" disabled>
					Espacio reservado
				</ion-chip>
			</div>
		</IonContent>
	</IonPage>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
	IonButton,
	IonContent,
	IonHeader,
	IonIcon,
	IonInput,
	IonPage,
	IonTitle,
	IonToolbar,
	IonChip,
	IonImg,
	IonList,
	IonItem,
	IonButtons,
} from '@ionic/vue';
import {
	documentTextOutline,
	chatboxEllipsesOutline,
	closeCircle,
	cameraOutline,
	imageOutline,
	micOutline,
	stopCircleOutline,
	trashOutline,
	arrowBackOutline,
} from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource, type Photo } from '@capacitor/camera';
import { VoiceRecorder } from 'capacitor-voice-recorder';
import { useRouter } from 'vue-router';
import { Geolocation } from '@capacitor/geolocation';
import axios from 'axios';
import { useSession } from '@/composables/useSession';

type Category = 'Seguridad' | 'Mantenimiento' | 'Servicios' | 'Otros';

const incidentTitle = ref('');
const incidentDescription = ref('');
const selectedCategory = ref<Category | null>(null);
const categories: Category[] = ['Seguridad', 'Mantenimiento', 'Servicios', 'Otros'];
const categoryIds: Record<Category, number> = {
	Seguridad: 1,
	Mantenimiento: 2,
	Servicios: 3,
	Otros: 4,
};
const evidencePhotos = ref<Photo[]>([]);
const isCapturing = ref(false);
const audioEvidence = ref<AudioEvidence[]>([]);
const isRecordingAudio = ref(false);
const isProcessingAudio = ref(false);
const audioPermissionGranted = ref<boolean | null>(null);
const router = useRouter();
const latitude = ref<number | null>(null);
const longitude = ref<number | null>(null);
const { authToken } = useSession();

const clearTitle = () => {
	incidentTitle.value = '';
};

const clearDescription = () => {
	incidentDescription.value = '';
};

const selectCategory = (category: Category) => {
	selectedCategory.value = category;
};

const goToHome = () => {
	router.push('/home');
};

const addEvidencePhoto = (photo: Photo) => {
	evidencePhotos.value = [...evidencePhotos.value, photo];
};

type AudioEvidence = {
	id: number;
	dataUrl: string;
	createdAt: string;
	durationMs?: number;
	name: string;
};

const ensureAudioPermission = async () => {
	if (audioPermissionGranted.value) {
		return true;
	}

	try {
		const hasPermission = await VoiceRecorder.hasAudioRecordingPermission();
		audioPermissionGranted.value = hasPermission.value;
		if (hasPermission.value) {
			return true;
		}

		const request = await VoiceRecorder.requestAudioRecordingPermission();
		audioPermissionGranted.value = request.value;
		return request.value;
	} catch (error) {
		console.error('No se pudo verificar el permiso de audio', error);
		return false;
	}
};

const photoSrc = (photo: Photo) => {
	if (photo.webPath) {
		return photo.webPath;
	}

	if (photo.path) {
		return photo.path;
	}

	if (photo.base64String) {
		return `data:image/jpeg;base64,${photo.base64String}`;
	}

	return '';
};

const capturePhoto = async () => {
	isCapturing.value = true;
	try {
		const result = await Camera.getPhoto({
			quality: 85,
			allowEditing: false,
			resultType: CameraResultType.Uri,
			source: CameraSource.Camera,
			saveToGallery: false,
		});
		addEvidencePhoto(result);
	} catch (error) {
		if ((error as Error)?.message !== 'User cancelled photos app') {
			console.error('No se pudo tomar la foto', error);
		}
	} finally {
		isCapturing.value = false;
	}
};

const pickFromGallery = async () => {
	try {
		const result = await Camera.getPhoto({
			quality: 85,
			allowEditing: false,
			resultType: CameraResultType.Uri,
			source: CameraSource.Photos,
			saveToGallery: false,
		});
		addEvidencePhoto(result);
	} catch (error) {
		if ((error as Error)?.message !== 'User cancelled photos app') {
			console.error('No se pudo seleccionar la imagen', error);
		}
	}
};

const startAudioRecording = async () => {
	if (isRecordingAudio.value || isProcessingAudio.value) {
		return;
	}

	const hasPermission = await ensureAudioPermission();
	if (!hasPermission) {
		console.warn('Permiso de micrófono rechazado');
		return;
	}

	try {
		isProcessingAudio.value = true;
		const response = await VoiceRecorder.startRecording();
		if (response.value) {
			isRecordingAudio.value = true;
		}
	} catch (error) {
		console.error('No se pudo iniciar la grabación de audio', error);
	} finally {
		isProcessingAudio.value = false;
	}
};

const stopAudioRecording = async () => {
	if (!isRecordingAudio.value) {
		return;
	}

	try {
		isProcessingAudio.value = true;
		const { value } = await VoiceRecorder.stopRecording();
		if (value) {
			const dataUrl = buildAudioDataUrl(value.recordDataBase64, value.mimeType, value.path);
			if (dataUrl) {
				audioEvidence.value = [
					...audioEvidence.value,
					{
						id: Date.now(),
						dataUrl,
						createdAt: new Date().toLocaleString(),
						durationMs: value.msDuration,
						name: `Audio ${audioEvidence.value.length + 1}`,
					},
				];
			}
		}
	} catch (error) {
		console.error('No se pudo detener la grabación de audio', error);
	} finally {
		isRecordingAudio.value = false;
		isProcessingAudio.value = false;
	}
};

const buildAudioDataUrl = (base64?: string | null, mimeType?: string | null, path?: string | null) => {
	if (base64 && base64.trim().length > 0) {
		const type = mimeType || 'audio/aac';
		return `data:${type};base64,${base64}`;
	}

	if (path) {
		return path;
	}

	return null;
};

const removeAudioEvidence = (id: number) => {
	audioEvidence.value = audioEvidence.value.filter((entry) => entry.id !== id);
};

const submitIncident = async () => {
	if (!selectedCategory.value) {
		console.warn('incidente-submit', { error: 'missing-category' });
		return;
	}

	if (!incidentTitle.value || !incidentDescription.value) {
		console.warn('incidente-submit', { error: 'missing-fields' });
		return;
	}

	try {
		const { coords } = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
		latitude.value = coords.latitude;
		longitude.value = coords.longitude;
	} catch (error) {
		console.error('No se pudo obtener la ubicación del dispositivo', error);
		return;
	}

	const categoryId = categoryIds[selectedCategory.value];

	if (!categoryId) {
		console.warn('incidente-submit', { error: 'unknown-category', category: selectedCategory.value });
		return;
	}

	const incidentData = {
		titulo: incidentTitle.value.trim(),
		descripcion: incidentDescription.value.trim(),
		latitud: latitude.value ?? 0,
		longitud: longitude.value ?? 0,
		categoriaId: categoryId,
	};

	const apiBaseUrl = import.meta.env.VITE_PARK_APP_API_URL;

	if (!apiBaseUrl) {
		console.error('incidente-submit', { error: 'missing-api-base-url' });
		return;
	}

	const token = authToken.value;

	if (!token) {
		console.error('incidente-submit', { error: 'missing-auth-token' });
		return;
	}

	const endpoint = `${apiBaseUrl.replace(/\/$/, '')}/api/incidentes`;
	const formData = new FormData();
	formData.append(
		'incidente',
		new Blob([JSON.stringify(incidentData)], { type: 'application/json' })
	);

	console.info('incidente-submit', JSON.stringify(incidentData, null, 2));

	try {
		const response = await axios.post(endpoint, formData, {
			headers: {
				Accept: 'application/json',
				Authorization: `Bearer ${token}`,
			},
		});

		console.info('incidente-submit-success', JSON.stringify(response.data, null, 2));
		router.push({ name: 'Home' });
	} catch (error) {
		if (axios.isAxiosError(error)) {
			console.error(
				'incidente-submit-error',
				JSON.stringify(
					{
						status: error.response?.status,
						data: error.response?.data,
						message: error.message,
					},
					null,
					2
				)
			);
		} else {
			console.error('incidente-submit-error', error);
		}
	}
};
</script>

<style scoped>
.page-title {
	width: 100%;
	text-align: center;
}

.page-toolbar {
	--padding-start: 0.75rem;
	--padding-end: 0.75rem;
}

.toolbar-spacer {
	width: 44px;
	height: 44px;
}

.form-content {
	--background: var(--ion-color-light, #f4f6fb);
	display: flex;
	justify-content: center;
}

.form-card {
	width: min(480px, 100%);
	padding: 1.5rem 1.25rem;
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
}

.section-title {
	margin: 0 0 0.75rem;
	font-size: 1rem;
	font-weight: 600;
	color: var(--ion-color-dark, #1f2933);
}

.header-back-button {
	--padding-start: 0.25rem;
	--padding-end: 0.25rem;
	--border-radius: 999px;
	--color: var(--ion-color-dark, #1f2933);
}

.header-back-button ion-icon {
	font-size: 1.35rem;
}

.chip-row {
	display: flex;
	flex-wrap: wrap;
	gap: 0.75rem;
}

ion-input::part(label) {
	font-weight: 600;
}

.category-chip {
	--background: transparent;
	--color: var(--ion-color-medium, #6b7280);
	border: 1px solid rgba(107, 114, 128, 0.35);
	border-radius: 999px;
	padding-inline: 0.75rem;
	transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.category-chip.active {
	--background: var(--ion-color-success, #2dd36f);
	--color: #ffffff;
	border-color: rgba(45, 211, 111, 0.65);
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


.evidence-section {
	display: flex;
	flex-direction: column;
	gap: 1rem;
}


.evidence-columns {
	display: grid;
	grid-template-columns: 1fr;
	gap: 1.5rem;
}

.evidence-block {
	display: flex;
	flex-direction: column;
	gap: 1rem;
	background: #fff;
	border-radius: 16px;
	box-shadow: 0 6px 18px rgba(31, 41, 51, 0.12);
	padding: 1rem 1.1rem;
}

.evidence-subtitle {
	margin: 0;
	font-size: 0.95rem;
	font-weight: 600;
	color: var(--ion-color-dark, #1f2933);
}

.evidence-actions,
.audio-controls {
	display: grid;
	gap: 0.75rem;
}

.evidence-placeholder {
	margin: 0;
	color: var(--ion-color-medium, #6b7280);
	font-size: 0.9rem;
}

.photos-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
	gap: 0.75rem;
}

.photos-grid ion-img {
	border-radius: 12px;
	box-shadow: 0 4px 12px rgba(31, 41, 51, 0.12);
	background: #fff;
}

.audio-list {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	background: transparent;
}

.audio-item {
	--background: #fff;
	border-radius: 12px;
	box-shadow: 0 4px 12px rgba(31, 41, 51, 0.08);
	padding: 0.5rem 0.75rem;
	gap: 0.75rem;
	align-items: center;
}

.audio-item audio {
	width: 160px;
	max-width: 100%;
	margin-inline: 0.75rem;
}

@media (min-width: 768px) {
	.evidence-columns {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	.audio-item audio {
		width: 200px;
	}
}

.submit-button {
	margin-top: 0.5rem;
	--border-radius: 16px;
	font-weight: 600;
}

</style>
