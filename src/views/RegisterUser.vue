<template>
	<ion-page>
		<ion-content class="register-content" fullscreen>
			<div class="register-wrapper">
				<div class="register-logo" aria-label="Logo de la aplicación">
					<div class="logo-mark">AP</div>
					<h1 class="logo-title">App Park</h1>
					<p class="logo-subtitle">Crea tu cuenta</p>
				</div>

				<form class="register-form" @submit.prevent="onSubmit">
					<ion-list lines="none" class="form-list">
						<ion-item>
							<ion-input
								v-model="firstName"
								label="Nombre"
								label-placement="stacked"
								placeholder="Juan"
								autocomplete="given-name"
								inputmode="text"
							>
								<ion-icon slot="start" :icon="personOutline" aria-hidden="true"></ion-icon>
								<ion-button
									v-show="firstName.length > 0"
									fill="clear"
									slot="end"
									type="button"
									@click="clearFirstName"
									aria-label="Limpiar nombre"
								>
									<ion-icon slot="icon-only" :icon="closeCircle" aria-hidden="true"></ion-icon>
								</ion-button>
							</ion-input>
						</ion-item>

						<ion-item>
							<ion-input
								v-model="lastName"
								label="Apellido"
								label-placement="stacked"
								placeholder="Pérez"
								autocomplete="family-name"
								inputmode="text"
							>
								<ion-icon slot="start" :icon="personOutline" aria-hidden="true"></ion-icon>
								<ion-button
									v-show="lastName.length > 0"
									fill="clear"
									slot="end"
									type="button"
									@click="clearLastName"
									aria-label="Limpiar apellido"
								>
									<ion-icon slot="icon-only" :icon="closeCircle" aria-hidden="true"></ion-icon>
								</ion-button>
							</ion-input>
						</ion-item>

						<ion-item>
							<ion-input
								v-model="email"
								label="Correo"
								label-placement="stacked"
								placeholder="correo@dominio.com"
								type="email"
								autocomplete="email"
								inputmode="email"
							>
								<ion-icon slot="start" :icon="mailOutline" aria-hidden="true"></ion-icon>
								<ion-button
									v-show="email.length > 0"
									fill="clear"
									slot="end"
									type="button"
									@click="clearEmail"
									aria-label="Limpiar correo"
								>
									<ion-icon slot="icon-only" :icon="closeCircle" aria-hidden="true"></ion-icon>
								</ion-button>
							</ion-input>
						</ion-item>

						<ion-item>
							<ion-input
								v-model="password"
								label="Contraseña"
								label-placement="stacked"
								placeholder="••••••••"
								:type="showPassword ? 'text' : 'password'"
								autocomplete="new-password"
							>
								<ion-icon slot="start" :icon="lockClosed" aria-hidden="true"></ion-icon>
								<ion-button
									fill="clear"
									slot="end"
									type="button"
									@click="togglePasswordVisibility"
									:aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
								>
									<ion-icon slot="icon-only" :icon="showPassword ? eyeOff : eye" aria-hidden="true"></ion-icon>
								</ion-button>
							</ion-input>
						</ion-item>

						<ion-item>
							<ion-input
								v-model="confirmPassword"
								label="Confirmar contraseña"
								label-placement="stacked"
								placeholder="••••••••"
								:type="showPassword ? 'text' : 'password'"
								autocomplete="new-password"
							>
								<ion-icon slot="start" :icon="lockClosed" aria-hidden="true"></ion-icon>
								<ion-button
									fill="clear"
									slot="end"
									type="button"
									@click="togglePasswordVisibility"
									:aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
								>
									<ion-icon slot="icon-only" :icon="showPassword ? eyeOff : eye" aria-hidden="true"></ion-icon>
								</ion-button>
							</ion-input>
						</ion-item>
					</ion-list>

					<ion-button expand="block" type="submit" class="register-button" :disabled="isSubmitting">
						<span v-if="!isSubmitting">Crear cuenta</span>
                        <ion-spinner name="crescent" v-else></ion-spinner>
					</ion-button>

					<div class="support-links">
						<ion-button fill="clear" size="small" type="button" class="support-link" @click="goToLogin">¿Ya tienes cuenta? Inicia sesión</ion-button>
					</div>
				</form>
			</div>
		</ion-content>
	</ion-page>
</template>

<script setup lang="ts">
import {
	IonButton,
	IonContent,
	IonIcon,
	IonInput,
	IonItem,
	IonList,
	IonPage,
    IonSpinner,
    toastController,
	onIonViewWillLeave,
} from '@ionic/vue';
import { ref } from 'vue';
import {
	closeCircle,
	eye,
	eyeOff,
	lockClosed,
	mailOutline,
	personOutline,
} from 'ionicons/icons';
import { HTTP } from '@awesome-cordova-plugins/http';
import router from '@/router';
import { isAndroidNativeApp, parseFetchResponse, throwFetchError, parseNativeResponse } from '@/utils/httpHelpers';

const firstName = ref('');
const lastName = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const isSubmitting = ref(false);
const clearFirstName = () => {
	firstName.value = '';
};
const resetForm = () => {
	firstName.value = '';
	lastName.value = '';
	email.value = '';
	password.value = '';
	confirmPassword.value = '';
	showPassword.value = false;
	isSubmitting.value = false;
};

const goToLogin = () => {
	resetForm();
	router.push({ name: 'Login' });
};
const clearLastName = () => {
	lastName.value = '';
};

const clearEmail = () => {
	email.value = '';
};

const togglePasswordVisibility = () => {
	showPassword.value = !showPassword.value;
};

const buildNombre = () => {
	return [firstName.value.trim(), lastName.value.trim()].filter(Boolean).join(' ');
};

const goToHelp = () => {
	resetForm();
	router.push({ name: 'Register' });
};

onIonViewWillLeave(() => {
	resetForm();
});

const onSubmit = async () => {
	if (password.value !== confirmPassword.value) {
		console.warn('register-submit', { error: 'password-mismatch' });
		return;
	}

	const payload = {
		nombre: buildNombre(),
		email: email.value.trim(),
		password: password.value,
	};

	if (!payload.nombre || !payload.email || !payload.password) {
		console.warn('register-submit', { error: 'missing-fields' });
		return;
	}

	const apiBaseUrl = import.meta.env.VITE_PARK_APP_API_URL;

	if (!apiBaseUrl) {
		console.error('register-submit', { error: 'missing-api-base-url' });
		return;
	}

	const endpoint = apiBaseUrl + `api/auth/register`;

	console.log('register-submit', {
		endpoint,
		nombre: payload.nombre,
		email: payload.email,
	});

	try {
		isSubmitting.value = true;
		const headers: Record<string, string> = {
			Accept: 'application/json',
			'Content-Type': 'application/json',
		};

		if (isAndroidNativeApp()) {
			await HTTP.setDataSerializer('json');
			const response = await HTTP.post(endpoint, payload, headers);
			const data = parseNativeResponse(response.data);
			console.info('register-success', data);
		} else {
			const response = await fetch(endpoint, {
				method: 'POST',
				headers,
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				await throwFetchError(response);
			}

			const data = await parseFetchResponse(response);
			console.info('register-success', data);
		}

        const toast = await toastController.create({
            message: 'Cuenta creada exitosamente',
            duration: 2000,
            color: 'success',
            position: 'bottom'
        });
        await toast.present();

		resetForm();
		router.push({ name: 'Login' });
	} catch (error) {
		const status = (error as { status?: number })?.status;
		const data = (error as { data?: unknown })?.data ?? (error as Error).message;
		console.error('register-error', JSON.stringify(error, null, 2));
        console.error('register-error-details', { status, data });

        const toast = await toastController.create({
            message: 'No se pudo crear la cuenta. Intente nuevamente.',
            duration: 3000,
            color: 'danger',
            position: 'bottom'
        });
        await toast.present();
	} finally {
		isSubmitting.value = false;
	}
};
</script>

<style scoped>
.register-content {
	--background: var(--page-bg);
	--color: var(--ion-text-color);
	color: var(--ion-text-color);
}

.register-wrapper {
	min-height: 100%;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	padding: 3rem 1.5rem;
	gap: 2rem;
}

.register-logo {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.75rem;
	text-align: center;
}

.logo-mark {
	width: 88px;
	height: 88px;
	border-radius: 24px;
	background: var(--ion-color-primary);
	color: var(--ion-color-primary-contrast);
	font-weight: 700;
	font-size: 1.5rem;
	display: flex;
	align-items: center;
	justify-content: center;
	letter-spacing: 0.08em;
	box-shadow: var(--shadow-md);
}

.logo-title {
	font-size: 1.75rem;
	font-weight: 600;
	margin: 0;
	color: #0f172a; /* Force dark color */
}

.logo-subtitle {
	margin: 0;
	color: var(--ion-text-secondary);
	font-size: 1rem;
}

.register-form {
	width: 100%;
	max-width: 420px;
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
}

.form-list {
	border-radius: var(--radius-lg);
	background: var(--card-bg);
	padding: 0 0.5rem;
	box-shadow: var(--shadow-md);
}

.form-list ion-item {
	--background: var(--card-bg);
	--color: #0f172a; /* Force dark color */
	--border-color: var(--border-color);
}

.form-list ion-input {
	--color: #0f172a; /* Force dark color */
	--placeholder-color: #64748b;
	color: #0f172a;
}

.register-button {
	--background: var(--ion-color-primary);
	--background-activated: var(--ion-color-primary-shade);
	--border-radius: var(--radius-lg);
	--padding-top: 16px;
	--padding-bottom: 16px;
	font-weight: 600;
}

.support-links {
	display: flex;
	justify-content: space-between;
	gap: 0.75rem;
}

.support-link {
	font-weight: 500;
	text-transform: none;
	color: var(--ion-text-secondary);
}

@media (max-width: 480px) {
	.register-wrapper {
		padding-top: 2rem;
		padding-bottom: 2rem;
	}

	.form-list {
		box-shadow: none;
	}

	.support-links {
		flex-direction: column;
		align-items: stretch;
	}
}
</style>
