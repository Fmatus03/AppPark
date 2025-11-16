<template>
  <ion-page>
    <ion-content class="login-content" fullscreen>
      <div class="login-wrapper">
        <div class="login-logo" aria-label="Logo de la aplicación">
          <div class="logo-mark">AP</div>
          <h1 class="logo-title">App Genérica</h1>
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
            <ion-button fill="clear" size="small" type="button" class="support-link">¿Olvidaste tu contraseña?</ion-button>
            <ion-button fill="clear" size="small" type="button" class="support-link">Crear cuenta</ion-button>
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
} from '@ionic/vue';
import { Capacitor } from '@capacitor/core';
import { ref } from 'vue';
import { closeCircle, eye, eyeOff, lockClosed, mailOutline } from 'ionicons/icons';
import axios from 'axios';
import { useRouter } from 'vue-router';
import { useSession, type UserRole } from '@/composables/useSession';

const router = useRouter();
const email = ref('');
const password = ref('');
const showPassword = ref(false);
const isSubmitting = ref(false);
const errorMessage = ref('');
const { login: setSessionUser } = useSession();
const apiBaseUrl = import.meta.env.VITE_PARK_APP_API_URL;

const clearEmail = () => {
  email.value = '';
};

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

const resolveRole = (): UserRole => {
  const platform = Capacitor.getPlatform();
  return platform === 'web' ? 'admin' : 'visitante';
};

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
  console.log('login-submit', payload);

  try {
    const response = await axios.post(
      `${apiBaseUrl}api/auth/login`,
      payload,
      { validateStatus: () => true },
    );

    const { data, status } = response;

    if (status === 200 && data?.token) {
      const correo = email.value;
      const token = data.token as string

      const role = resolveRole();
      const username = correo.split('@')[0] ?? 'Usuario';
      setSessionUser({
        id: correo,
        name: username,
        role,
        token,
      });

      console.log('login-success', { correo, role, token });
      const nextRoute = role === 'admin' ? { name: 'AdminHome' } : { name: 'Home' };
      router.push(nextRoute);
      return;
    }

    errorMessage.value = data?.error ?? 'Credenciales inválidas';
  } catch (error) {
    console.error('login-error', error);
    errorMessage.value = 'No fue posible iniciar sesión. Intenta nuevamente.';
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.login-content {
  --background: #f8f8f8;
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
  background: #2e7d32;
  color: #ffffff;
  font-weight: 700;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  letter-spacing: 0.08em;
}

.logo-title {
  font-size: 1.75rem;
  font-weight: 600;
  margin: 0;
  color: #1f1f1f;
}

.login-form {
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-list {
  border-radius: 18px;
  background: #ffffff;
  padding: 0 0.5rem;
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.08);
}

.login-button {
  --background: #2e7d32;
  --background-activated: #27682a;
  --border-radius: 16px;
  --padding-top: 16px;
  --padding-bottom: 16px;
  font-weight: 600;
}

.error-message {
  margin: 0;
  color: #b91c1c;
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
</style>