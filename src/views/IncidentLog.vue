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
							:key="category.id"
							class="category-chip"
							:class="{ active: selectedCategory?.id === category.id }"
							@click="selectCategory(category)"
						>
							{{ category.nombre }}
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
								<div
									v-for="(photo, index) in evidencePhotos"
									:key="photo.webPath ?? photo.path ?? index"
									class="photo-item"
								>
									<ion-img
										:src="photoSrc(photo)"
										alt="Evidencia del incidente"
										loading="lazy"
									/>
									<ion-button
										class="remove-photo-btn"
										fill="solid"
										color="danger"
										size="small"
										type="button"
										@click="removePhoto(index)"
										aria-label="Quitar imagen"
									>
										<ion-icon slot="icon-only" :icon="trashOutline" aria-hidden="true" />
									</ion-button>
								</div>
							</div>
						</div>

						<div class="evidence-block">
							<h3 class="evidence-subtitle">Audio</h3>
							<div class="audio-controls">
								<ion-button
									expand="block"
									:class="['record-button', { 'is-recording': isRecordingAudio }]"
									:color="isRecordingAudio ? 'danger' : 'primary'"
									:disabled="isProcessingAudio"
									:aria-pressed="isRecordingAudio"
									@mousedown.prevent="handleRecordButtonDown"
									@mouseup.prevent="handleRecordButtonUp"
									@mouseleave="handleRecordButtonCancel"
									@touchstart.prevent="handleRecordButtonDown"
									@touchend.prevent="handleRecordButtonUp"
									@touchcancel.prevent="handleRecordButtonCancel"
								>
									<ion-icon
										slot="start"
										:icon="isRecordingAudio ? stopCircleOutline : micOutline"
										aria-hidden="true"
									/>
									{{ isRecordingAudio ? 'Suelta para guardar' : 'Mantén presionado para grabar' }}
								</ion-button>
								<p class="recording-hint" role="status">
									{{ isRecordingAudio ? 'Grabando… suelta para finalizar.' : 'Mantén presionado para grabar audio.' }}
								</p>
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
					color="primary"
					size="large"
					:disabled="isSubmitting"
					@click="submitIncident"
				>
					<ion-spinner v-if="isSubmitting" name="lines-small" slot="start" />
					{{ isSubmitting ? 'Enviando...' : 'Enviar incidente' }}
				</ion-button>
				<ion-chip class="safe-area-spacer" aria-hidden="true" disabled>
					Espacio reservado
				</ion-chip>
			</div>
		</IonContent>
	</IonPage>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
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
	toastController,
	alertController,
	isPlatform
} from '@ionic/vue';
import { useCategories, type Category } from '@/composables/useCategories';
import { useSession } from '@/composables/useSession';
import { useIncidentService } from '@/composables/useIncidentService';
import { useOfflineIncidents } from '@/composables/useOfflineIncidents';
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
	cloudOfflineOutline
} from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource, type Photo } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { VoiceRecorder } from 'capacitor-voice-recorder';
import { useRouter } from 'vue-router';
import { Geolocation } from '@capacitor/geolocation';

type AudioEvidence = {
	id: number;
	dataUrl: string;
	createdAt: string;
	durationMs?: number;
	name: string;
	mimeType?: string | null;
	base64?: string | null;
	path?: string | null;
};

const incidentTitle = ref('');
const incidentDescription = ref('');
const selectedCategory = ref<Category | null>(null);
const evidencePhotos = ref<Photo[]>([]);
const isCapturing = ref(false);
const isSubmitting = ref(false);
const audioEvidence = ref<AudioEvidence[]>([]);
const isRecordingAudio = ref(false);
const isProcessingAudio = ref(false);
const isRecordGestureActive = ref(false);
const audioPermissionGranted = ref<boolean | null>(null);
const latitude = ref<number | null>(null);
const longitude = ref<number | null>(null);

const router = useRouter();
const { authToken } = useSession();
const { uploadIncident } = useIncidentService();
const { addToQueue } = useOfflineIncidents();
const { categories, loadCategories } = useCategories();
const apiBaseUrl = import.meta.env.VITE_PARK_APP_API_URL;

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

onMounted(async () => {
	await loadCategories();
});


const addEvidencePhoto = (photo: Photo) => {
	evidencePhotos.value = [...evidencePhotos.value, photo];
};

const removePhoto = (index: number) => {
	evidencePhotos.value = evidencePhotos.value.filter((_, idx) => idx !== index);
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
	if (photo.base64String) {
		return `data:image/${photo.format};base64,${photo.base64String}`;
	}

	if (photo.webPath) {
		return photo.webPath;
	}

	if (photo.path) {
		return Capacitor.convertFileSrc(photo.path);
	}

	return '';
};

const capturePhoto = async () => {
	isCapturing.value = true;
	try {
		const result = await Camera.getPhoto({
			quality: 85,
			allowEditing: false,
			resultType: CameraResultType.Base64,
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
			resultType: CameraResultType.Base64,
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
						mimeType: value.mimeType ?? 'audio/aac',
						base64: value.recordDataBase64 ?? null,
						path: value.path ?? null,
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
		return Capacitor.convertFileSrc(path);
	}

	return null;
};

const removeAudioEvidence = (id: number) => {
	audioEvidence.value = audioEvidence.value.filter((entry) => entry.id !== id);
};

const handleRecordButtonDown = async () => {
	if (isRecordGestureActive.value || isProcessingAudio.value) {
		return;
	}

	isRecordGestureActive.value = true;

	try {
		await startAudioRecording();
	} finally {
		if (!isRecordingAudio.value) {
			isRecordGestureActive.value = false;
		}
	}
};

const finalizeRecordingGesture = async () => {
	if (!isRecordGestureActive.value) {
		return;
	}

	isRecordGestureActive.value = false;

	if (!isRecordingAudio.value || isProcessingAudio.value) {
		return;
	}

	await stopAudioRecording();
};

const handleRecordButtonUp = async () => {
	await finalizeRecordingGesture();
};

const handleRecordButtonCancel = async () => {
	await finalizeRecordingGesture();
};



import { Filesystem, Directory } from '@capacitor/filesystem';



const resetForm = () => {
	incidentTitle.value = '';
	incidentDescription.value = '';
	selectedCategory.value = null;
	evidencePhotos.value = [];
	audioEvidence.value = [];
	latitude.value = null;
	longitude.value = null;
	isCapturing.value = false;
	isRecordingAudio.value = false;
	isProcessingAudio.value = false;
	isRecordGestureActive.value = false;
};



const submitIncident = async () => {
	// 1. Validaciones básicas (rápidas)
	if (!selectedCategory.value) {
		const toast = await toastController.create({
			message: 'Por favor, selecciona una categoría.',
			duration: 2000,
			color: 'warning',
			position: 'bottom',
		});
		await toast.present();
		return;
	}

	if (!incidentTitle.value || !incidentDescription.value) {
		const toast = await toastController.create({
			message: 'Por favor, completa el título y la descripción.',
			duration: 2000,
			color: 'warning',
			position: 'bottom',
		});
		await toast.present();
		return;
	}

	// 2. Feedback inmediato (Activate spinner NOW)
	isSubmitting.value = true;

	try {
        // 3. Obtener ubicación (puede tardar, pero ya tenemos spinner)
		// Set a timeout for location to avoid hanging indefinitely
		let lat = 0;
		let lng = 0;
		try {
			// Race between location and a 3s timeout
			const locationPromise = Geolocation.getCurrentPosition({ enableHighAccuracy: true });
			const timeoutPromise = new Promise<{ coords: { latitude: number; longitude: number } }>((_, reject) => 
				setTimeout(() => reject(new Error('Location timeout')), 3000)
			);
			
			const { coords } = await Promise.race([locationPromise, timeoutPromise]);
			lat = coords.latitude;
			lng = coords.longitude;
		} catch (error) {
			console.warn('Ubicación no disponible o lenta, usando 0,0', error);
		}

		latitude.value = lat;
		longitude.value = lng;

		const incidentData = {
			titulo: incidentTitle.value.trim(),
			descripcion: incidentDescription.value.trim(),
			latitud: latitude.value,
			longitud: longitude.value,
			categoriaId: selectedCategory.value.id,
		};

		if (!apiBaseUrl || !authToken.value) {
			throw { status: -1, message: 'Falta configuración o sesión' }; // Treat as internal/networkish
		}

		// 4. Intentar envío
		await uploadIncident(incidentData, evidencePhotos.value, audioEvidence.value);

		console.info('incidente-submit-success');
		
		const toast = await toastController.create({
			message: '¡Incidente enviado correctamente!',
			duration: 3000,
			color: 'success',
			position: 'bottom',
		});
		await toast.present();

		resetForm();
		router.push({ name: 'Home' });

	} catch (error: any) {
		const status = error?.status;
		// Determine if it's a network/connection error
		// -1, -6 (Android native), 0 (Fetch), or undefined usually implies connectivity
		const isNetworkError = !status || status <= 0 || status === 504;

		if (isNetworkError) {
			// 5a. Fallback Offline Automático (Seamless)
			console.warn('Error de conexión detectado. Guardando offline...', error);
			try {
				const incidentData = {
					titulo: incidentTitle.value.trim(),
					descripcion: incidentDescription.value.trim(),
					latitud: latitude.value ?? 0,
					longitud: longitude.value ?? 0,
					categoriaId: selectedCategory.value!.id,
				};

				await addToQueue({
					data: incidentData,
					photos: evidencePhotos.value,
					audios: audioEvidence.value
				});
				
				const toast = await toastController.create({
					message: 'Sin conexión: Incidente guardado. Se enviará automáticamente.',
					duration: 4000,
					color: 'medium', // Less alarming/greenish
					icon: 'cloud-offline-outline',
					position: 'bottom'
				});
				await toast.present();
				
				resetForm();
				router.push({ name: 'Home' });
			} catch (saveError) {
				console.error('Fatal: Error guardando offline', saveError);
				const toast = await toastController.create({
					message: 'Error crítico al guardar. Intenta nuevamente.',
					duration: 3000,
					color: 'danger',
					position: 'bottom'
				});
				await toast.present();
			}
		} else {
			// 5b. Error de Servidor (400, 500 real) -> Mostrar mensaje real y NO limpiar
			const errorMsg = error?.data?.error || error?.data?.message || 'Error del servidor procesando el incidente.';
			console.error('Server error', error);

			const alert = await alertController.create({
				header: 'No se pudo enviar',
				message: errorMsg,
				buttons: ['OK']
			});
			await alert.present();
			// Stay in form so user can fix data
		}
	} finally {
		isSubmitting.value = false;
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
	--background: var(--ion-color-primary, #3880ff);
	--color: #ffffff;
	border-color: var(--ion-color-primary, #3880ff);
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

.record-button {
	--border-radius: 14px;
	font-weight: 600;
}

.record-button.is-recording {
	--background: var(--ion-color-danger, #eb445a);
}

.recording-hint {
	margin: 0;
	text-align: center;
	font-size: 0.85rem;
	color: var(--ion-color-medium, #6b7280);
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

.photo-item {
	position: relative;
}

.remove-photo-btn {
	position: absolute;
	top: 6px;
	right: 6px;
	z-index: 1;
	--border-radius: 999px;
	width: 28px;
	height: 28px;
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
	--color: #ffffff;
	color: #ffffff;
}

</style>
