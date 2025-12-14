<template>
  <ion-page>
    <ion-content class="login-content" fullscreen>
      <div class="login-wrapper">
        <div class="login-logo" aria-label="Logo de la aplicación">
          <div class="logo-mark">AP</div>
          <h1 class="logo-title">App Park</h1>
        </div>

        <form class="login-form" @submit.prevent="onSubmit">
          <ion-list lines="none" class="form-list">
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
                autocomplete="current-password"
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

          <div class="remember-me" v-if="runningOnAndroidApp">
            <ion-checkbox :checked="rememberMe" @ionChange="onRememberChange" label-placement="end" justify="start">
              Mantener sesión iniciada
            </ion-checkbox>
          </div>



          <ion-button
            expand="block"
            type="submit"
            class="login-button"
            :disabled="isSubmitting"
          >
            {{ isSubmitting ? 'Ingresando…' : 'Iniciar sesión' }}
          </ion-button>

          <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

          <div class="support-links">
            <ion-button
              v-if="runningOnAndroidApp"
              fill="clear"
              size="small"
              type="button"
              class="support-link"
              @click="goToRegister"
            >
              Crear cuenta
            </ion-button>
          </div>
        </form>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonButton,
  IonCheckbox,
  IonContent,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  onIonViewWillLeave,
  type CheckboxCustomEvent
} from '@ionic/vue';
import { ref, onMounted } from 'vue';
import { closeCircle, eye, eyeOff, lockClosed, mailOutline } from 'ionicons/icons';
import axios from 'axios';
import { useRouter } from 'vue-router';
import { UserRole, useSession } from '@/composables/useSession';
import { useCategories } from '@/composables/useCategories';
import { HTTP } from '@awesome-cordova-plugins/http';
import { isAndroidNativeApp, parseNativeResponse } from '@/utils/httpHelpers';

type LoginResponse = {
  token?: string;
  rol?: string;
  error?: string;
};

const router = useRouter();
const email = ref('');
const password = ref('');
const showPassword = ref(false);
const isSubmitting = ref(false);
const errorMessage = ref('');
const runningOnAndroidApp = ref(isAndroidNativeApp());
const rememberMe = ref(false);

const { login: setSessionUser, currentUser } = useSession();
const { loadCategories } = useCategories();
const apiBaseUrl = import.meta.env.VITE_PARK_APP_API_URL;

// Auto-redirect if session becomes available (e.g. loaded from storage)
import { watch } from 'vue';

const handleAutoLogin = async () => {
    console.log('handleAutoLogin: Checking session...', currentUser.value);
    if (currentUser.value) {
        try {
            console.log('handleAutoLogin: Session found. Loading categories...');
            // Ensure categories are loaded for offline use
            await loadCategories();
            console.log('handleAutoLogin: Categories loaded (or failed gracefully). Redirecting...');
            
            const role = currentUser.value.role;
            const nextRoute = role === 'ADMIN' ? { name: 'AdminHome' } : role === 'ANALISTA' ? { name: 'AnalistaHome' } : { name: 'Home' };
            console.log('handleAutoLogin: Navigating to', nextRoute);
            router.replace(nextRoute);
        } catch (error) {
            console.error('handleAutoLogin: Error during auto-login sequence', error);
            // Even if something fails (e.g. categories), we should probably still try to redirect or let them stay on login?
            // If session exists but categories fail, maybe we should still let them in?
            const role = currentUser.value.role;
             const nextRoute = role === 'ADMIN' ? { name: 'AdminHome' } : role === 'ANALISTA' ? { name: 'AnalistaHome' } : { name: 'Home' };
             router.replace(nextRoute);
        }
    } else {
        console.log('handleAutoLogin: No session found.');
    }
};

watch(currentUser, () => {
    handleAutoLogin();
});

// Also check on mount in case it loaded fast
onMounted(() => {
    handleAutoLogin();
});

const normalizeRole = (value: unknown): UserRole => {
  if (typeof value === 'string') {
    const upperValue = value.toUpperCase();
    if (upperValue === 'ADMIN' || upperValue === 'VISITANTE' || upperValue === 'ANALISTA') {
      return upperValue as UserRole;
    }
  }
  return 'VISITANTE';
};

const resetForm = () => {
  email.value = '';
  password.value = '';
  showPassword.value = false;
  isSubmitting.value = false;
  errorMessage.value = '';
  // Don't reset rememberMe ideally, or default to false
};

const forgotPassword = () => {
  resetForm();
  router.push({ name: 'ForgotPassword' });
};

const goToRegister = () => {
  resetForm();
  router.push({ name: 'Register' });
};
const clearEmail = () => {
  email.value = '';
};

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

const onRememberChange = (e: CheckboxCustomEvent) => {
  rememberMe.value = e.detail.checked;
};

onIonViewWillLeave(() => {
  resetForm();
});

const onSubmit = async () => {
  if (isSubmitting.value) {
    return;
  }

  errorMessage.value = '';
  isSubmitting.value = true;

  const payload = {
    email: email.value,
    password: password.value,
  };

  try {
    const endpoint = `${apiBaseUrl}api/auth/login`;
    const baseHeaders = {
		Accept: 'application/json',
		'Content-Type': 'application/json',
	};

    let status: number | undefined;
    let data: LoginResponse | undefined;

    if (isAndroidNativeApp()) {
		await HTTP.setDataSerializer('json');
		const response = await HTTP.post(endpoint, payload, baseHeaders);
		status = response.status;
		data = parseNativeResponse<LoginResponse>(response.data);
	} else {
		const response = await axios.post<LoginResponse>(
			endpoint,
			payload,
			{ validateStatus: () => true },
		);
		status = response.status;
		data = response.data;
	}

    if (status === 200 && data?.token) {
      const correo = email.value;
      const token = data.token as string;
      const role = normalizeRole(data.rol);

      if (runningOnAndroidApp.value) {
        if (role !== 'VISITANTE') {
          errorMessage.value = 'Acceso denegado';
          isSubmitting.value = false;
          return;
        }
      } else {
        if (role !== 'ADMIN' && role !== 'ANALISTA') {
          errorMessage.value = 'Acceso denegado';
          isSubmitting.value = false;
          return;
        }
      }

      const username = correo.split('@')[0] ?? 'Usuario';
      
      // Save session with rememberMe preference
      await setSessionUser({
        id: correo,
        name: username,
        role,
        token,
      }, rememberMe.value);
      
      // Load categories immediately to cache them
      await loadCategories();
      
      const nextRoute = role === 'ADMIN' ? { name: 'AdminHome' } : role === 'ANALISTA' ? { name: 'AnalistaHome' } : { name: 'Home' };
      resetForm();
      router.push(nextRoute);
      return;
    }

    errorMessage.value = data?.error ?? 'Credenciales inválidas';
  } catch (error) {
    console.error('login-error', JSON.stringify(error, null, 2));
    if (typeof error === 'object' && error !== null) {
        console.error('login-error-details', {
            status: (error as any).status,
            error: (error as any).error,
            headers: (error as any).headers
        });
    }
    errorMessage.value = 'No fue posible iniciar sesión. Intenta nuevamente.';
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.login-content {
  --background: var(--page-bg);
  --color: var(--ion-text-color);
  color: var(--ion-text-color);
}

.login-wrapper {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 3rem 1.5rem;
  gap: 2rem;
}

.login-logo {
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

.login-form {
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



.login-button {
  --background: var(--ion-color-primary);
  --background-activated: var(--ion-color-primary-shade);
  --border-radius: var(--radius-lg);
  --padding-top: 16px;
  --padding-bottom: 16px;
  font-weight: 600;
}

.error-message {
  margin: 0;
  color: #ef4444;
  font-weight: 500;
  text-align: center;
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
  .login-wrapper {
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

.remember-me {
  margin-top: -0.5rem;
  padding-left: 0.5rem;
}

.remember-me ion-checkbox {
  --size: 18px;
  font-size: 0.9rem;
  --label-color: var(--ion-text-color);
}
</style>
