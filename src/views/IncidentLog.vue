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
					color="success"
					size="large"
					@click="submitIncident"
				>
					Enviar incidente
				</ion-button>
				<ion-chip class="safe-area-spacer" aria-hidden="true" disabled>
					Espacio reservado
				</ion-chip>
				<ion-toast
					:is-open="isErrorToastOpen"
					:message="errorToastMessage"
					color="danger"
					position="bottom"
					:duration="5500"
					@didDismiss="isErrorToastOpen = false"
				/>
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
import { Capacitor } from '@capacitor/core';
import { VoiceRecorder } from 'capacitor-voice-recorder';
import { useRouter } from 'vue-router';
import { Geolocation } from '@capacitor/geolocation';
import { HTTP } from '@awesome-cordova-plugins/http';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { useSession } from '@/composables/useSession';
import { isAndroidNativeApp, parseFetchResponse, throwFetchError } from '@/utils/httpHelpers';

type Category = 'Seguridad' | 'Mantenimiento' | 'Servicios' | 'Otros';
type CachedPhoto = Photo & { cachedPath?: string };

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
const isRecordGestureActive = ref(false);
const audioPermissionGranted = ref<boolean | null>(null);
const router = useRouter();
const latitude = ref<number | null>(null);
const longitude = ref<number | null>(null);
const { authToken } = useSession();

const errorToastMessage = ref('');
const isErrorToastOpen = ref(false);

const showErrorOverlay = (message: string) => {
	errorToastMessage.value = message;
	isErrorToastOpen.value = true;
};

const stringifyErrorPayload = (payload: unknown) => {
	if (payload == null) {
		return 'Sin detalles adicionales.';
	}
	if (typeof payload === 'string') {
		return payload;
	}
	try {
		const serialized = JSON.stringify(payload);
		return serialized.length > 400 ? `${serialized.slice(0, 400)}…` : serialized;
	} catch (error) {
		console.error('error-stringify-payload', error);
		return 'Sin detalles adicionales.';
	}
};

const getCameraResultType = (source: CameraSource) =>
	isAndroidNativeApp() && source === CameraSource.Camera
		? CameraResultType.Base64
		: CameraResultType.Uri;

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

const removePhoto = (index: number) => {
	evidencePhotos.value = evidencePhotos.value.filter((_, idx) => idx !== index);
};

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
		return Capacitor.convertFileSrc(photo.path);
	}

	if (photo.base64String) {
		return `data:image/jpeg;base64,${photo.base64String}`;
	}

	return '';
};

const blobToBase64 = (blob: Blob) =>
	new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.onloadend = () => {
			const result = reader.result as string;
			const commaIndex = result.indexOf(',');
			resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
		};
		reader.onerror = () => reject(reader.error ?? new Error('No se pudo convertir el archivo.'));
		reader.readAsDataURL(blob);
	});

const getPhotoExtension = (photo: Photo) => {
	const format = photo.format?.toLowerCase();
	if (!format) {
		return 'jpeg';
	}
	return format.startsWith('image/') ? format.replace('image/', '') : format;
};

const getPhotoMimeType = (photo: Photo, fallback = 'image/jpeg') => {
	const format = photo.format?.toLowerCase();
	if (!format) {
		return fallback;
	}
	return format.startsWith('image/') ? format : `image/${format}`;
};

const persistNativeCameraPhoto = async (photo: Photo): Promise<CachedPhoto> => {
	if (!isAndroidNativeApp()) {
		return photo;
	}

	try {
		let base64Payload = photo.base64String?.trim() ?? '';
		let mimeType = getPhotoMimeType(photo);

		if (!base64Payload) {
			const accessiblePath = photo.webPath ?? ensureWebAccessiblePath(photo.path);
			if (accessiblePath) {
				const response = await fetch(accessiblePath);
				if (response.ok) {
					const blob = await response.blob();
					mimeType = blob.type || mimeType;
					base64Payload = await blobToBase64(blob);
				}
			}
		} else {
			// normalize mime type if Camera provided format but no MIME metadata.
			const blob = base64ToBlob(base64Payload, mimeType);
			mimeType = blob.type || mimeType;
		}

		if (!base64Payload) {
			showErrorOverlay('No se pudo guardar la foto capturada. Intenta nuevamente.');
			return photo;
		}

		const extension = (() => {
			const [, subtype] = mimeType.split('/');
			return subtype ?? getPhotoExtension(photo);
		})();
		const filename = `incident-photo-${Date.now()}-${Math.round(Math.random() * 1e6)}.${extension}`;
		await Filesystem.writeFile({
			path: filename,
			data: base64Payload,
			directory: Directory.Cache,
			recursive: true,
		});
		const { uri } = await Filesystem.getUri({ path: filename, directory: Directory.Cache });
		const cachedPhoto: CachedPhoto = {
			...photo,
			cachedPath: filename,
			path: uri,
			webPath: Capacitor.convertFileSrc(uri),
			base64String: base64Payload,
			format: extension,
		};
		return cachedPhoto;
	} catch (error) {
		console.error('persist-camera-photo-error', error);
		showErrorOverlay('No se pudo guardar la foto en el dispositivo. Intenta nuevamente.');
		return photo;
	}
};

const capturePhoto = async () => {
	isCapturing.value = true;
	try {
		const rawPhoto = await Camera.getPhoto({
			quality: 85,
			allowEditing: false,
			resultType: getCameraResultType(CameraSource.Camera),
			source: CameraSource.Camera,
			saveToGallery: false,
		});
		const processedPhoto = isAndroidNativeApp()
			? await persistNativeCameraPhoto(rawPhoto)
			: rawPhoto;
		addEvidencePhoto(processedPhoto);
	} catch (error) {
		if ((error as Error)?.message !== 'User cancelled photos app') {
			console.error('No se pudo tomar la foto', error);
			showErrorOverlay('No se pudo tomar la foto. Intenta nuevamente.');
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
			resultType: getCameraResultType(CameraSource.Photos),
			source: CameraSource.Photos,
			saveToGallery: false,
		});
		addEvidencePhoto(result);
	} catch (error) {
		if ((error as Error)?.message !== 'User cancelled photos app') {
			console.error('No se pudo seleccionar la imagen', error);
			showErrorOverlay('No se pudo seleccionar la imagen. Intenta nuevamente.');
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

const getAudioExtension = (mime?: string | null) => {
	if (!mime) {
		return 'aac';
	}

	const [, subtype] = mime.split('/');
	return subtype ? subtype.replace('+', '') : 'aac';
};

const base64ToBlob = (base64: string, mimeType: string) => {
	const byteCharacters = atob(base64);
	const blobParts: BlobPart[] = [];

	for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
		const slice = byteCharacters.slice(offset, offset + 1024);
		const byteNumbers = new Array(slice.length);
		for (let i = 0; i < slice.length; i += 1) {
			byteNumbers[i] = slice.charCodeAt(i);
		}
		blobParts.push(new Uint8Array(byteNumbers));
	}

	return new Blob(blobParts, { type: mimeType });
};

const ensureWebAccessiblePath = (path?: string | null) => {
	if (!path) {
		return null;
	}

	if (path.startsWith('file://') || path.startsWith('content://')) {
		return Capacitor.convertFileSrc(path);
	}

	return path;
};

const readCachedPhotoBlob = async (photo: Photo) => {
	const cachedPath = (photo as CachedPhoto).cachedPath;
	if (!cachedPath) {
		return null;
	}
	try {
		const { data } = await Filesystem.readFile({
			path: cachedPath,
			directory: Directory.Cache,
		});
		const base64Payload = typeof data === 'string' ? data : await blobToBase64(data);
		return base64ToBlob(base64Payload, getPhotoMimeType(photo));
	} catch (error) {
		console.warn('read-cached-photo-failed', { cachedPath, error });
		return null;
	}
};

const photoToBlob = async (photo: Photo) => {
	const cached = await readCachedPhotoBlob(photo);
	if (cached) {
		return cached;
	}

	if (photo.base64String && photo.base64String.trim().length > 0) {
		return base64ToBlob(photo.base64String, getPhotoMimeType(photo));
	}

	const sourceUrl = photo.webPath ?? ensureWebAccessiblePath(photo.path);
	if (!sourceUrl) {
		throw new Error('No se encontró la ruta de la foto.');
	}

	const response = await fetch(sourceUrl);
	if (!response.ok) {
		throw new Error('No se pudo leer la foto seleccionada.');
	}

	return response.blob();
};

const audioToBlob = async (audio: AudioEvidence) => {
	if (audio.base64) {
		return base64ToBlob(audio.base64, audio.mimeType ?? 'audio/aac');
	}

	if (audio.dataUrl?.startsWith('data:')) {
		const [, payload] = audio.dataUrl.split(',');
		if (payload) {
			return base64ToBlob(payload, audio.mimeType ?? 'audio/aac');
		}
	}

	const webPath = ensureWebAccessiblePath(audio.path ?? undefined);
	if (!webPath) {
		throw new Error('No se encontró la ruta del audio.');
	}

	const response = await fetch(webPath);
	if (!response.ok) {
		throw new Error('No se pudo leer el archivo de audio.');
	}

	return response.blob();
};


const createFormData = (usePonyfill: boolean) => {
	if (usePonyfill) {
		const ponyfills = (HTTP as unknown as { ponyfills?: { FormData?: new () => FormData } }).ponyfills;
		if (ponyfills?.FormData) {
			// Ensure compatibility with older Android WebViews lacking FormData.entries support.
			return new ponyfills.FormData() as unknown as FormData;
		}
	}
	return new FormData();
};

const buildIncidentFormData = async (
	incidentData: Record<string, unknown>,
	usePonyfill = false
) => {
	const formData = createFormData(usePonyfill);
	formData.append(
		'incidente',
		new Blob([JSON.stringify(incidentData)], { type: 'application/json' })
	);

	await Promise.all(
		evidencePhotos.value.map(async (photo, index) => {
			const blob = await photoToBlob(photo);
			const mimeType = blob.type || 'image/jpeg';
			const [, subtype] = mimeType.split('/');
			const extension = subtype ? subtype.replace('+', '') : 'jpg';
			formData.append('fotos', blob, `foto-${index + 1}.${extension}`);
		})
	);

	await Promise.all(
		audioEvidence.value.map(async (audio, index) => {
			const blob = await audioToBlob(audio);
			formData.append('audios', blob, `audio-${index + 1}.${getAudioExtension(audio.mimeType)}`);
		})
	);

	return formData;
};

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

const uploadIncidentNative = async (
	endpoint: string,
	headers: Record<string, string>,
	incidentData: Record<string, unknown>
) => {
	const formData = await buildIncidentFormData(incidentData, true);
	const resp = await HTTP.sendRequest(endpoint, {
		method: 'post',
		serializer: 'multipart',
		headers,
		data: formData as unknown as Record<string, unknown>,
		responseType: 'text',
	});
	const status = resp?.status ?? -1;
	const data = resp?.data ?? resp?.error ?? null;
	if (status < 200 || status >= 300) {
		throw { status, data };
	}
};

const uploadIncidentWeb = async (
	endpoint: string,
	headers: Record<string, string>,
	incidentData: Record<string, unknown>
) => {
	const formData = await buildIncidentFormData(incidentData);

	const response = await fetch(endpoint, {
		method: 'POST',
		body: formData,
		headers,
	});

	if (!response.ok) {
		await throwFetchError(response);
	}

	await parseFetchResponse(response);
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
		showErrorOverlay('No se pudo obtener tu ubicación. Activa el GPS e inténtalo nuevamente.');
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
		showErrorOverlay('Falta configurar la URL del servidor. Intenta más tarde.');
		return;
	}

	const token = authToken.value;

	if (!token) {
		console.error('incidente-submit', { error: 'missing-auth-token' });
		showErrorOverlay('Tu sesión expiró. Ingresa nuevamente para continuar.');
		return;
	}

	const endpoint = `${apiBaseUrl.replace(/\/$/, '')}/api/incidentes`;
	const headers: Record<string, string> = {
		Accept: 'application/json',
		Authorization: `Bearer ${token}`,
	};

	console.info('incidente-submit', JSON.stringify(incidentData, null, 2));

	try {
		if (isAndroidNativeApp()) {
			await uploadIncidentNative(endpoint, headers, incidentData);
		} else {
			await uploadIncidentWeb(endpoint, headers, incidentData);
		}

		console.info('incidente-submit-success');
		// Clear form so inputs, images and audios are reset
		resetForm();
		router.push({ name: 'Home' });
	} catch (error) {
		const status = (error as { status?: number })?.status;
		const data = (error as { data?: unknown })?.data ?? (error as Error).message;
		console.error('incidente-submit-error', JSON.stringify({ status, data }, null, 2));
		const detail = stringifyErrorPayload(data);
		showErrorOverlay(`No se pudo enviar el incidente (${status ?? 'sin código'}). ${detail}`);
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
