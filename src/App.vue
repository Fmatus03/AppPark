<template>
  <ion-app :class="appClasses">
    <SideBar v-if="shouldShowSidebar" />
    <ion-router-outlet />
    <NavBar v-if="shouldShowNavBar" />
  </ion-app>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import { Capacitor } from '@capacitor/core';
import NavBar from './components/NavBar.vue';
import SideBar from './components/SideBar.vue';
import { useSession } from './composables/useSession';

const nativePlatforms = new Set(['ios', 'android']);
const platform = Capacitor.getPlatform();
const isNativePlatform = nativePlatforms.has(platform);

const { isAuthenticated, isAdmin, isVisitante } = useSession();

const shouldShowNavBar = computed(() => isNativePlatform && isAuthenticated.value && isVisitante.value);
const shouldShowSidebar = computed(() => !isNativePlatform && isAuthenticated.value && isAdmin.value);
const appClasses = computed(() => ({
  'has-mobile-navbar': shouldShowNavBar.value,
  'has-sidebar': shouldShowSidebar.value,
}));
</script>

<style>
ion-app.has-mobile-navbar ion-content {
  --padding-bottom: env(safe-area-inset-bottom, 0px);
}

ion-app.has-sidebar {
  --sidebar-width: 240px;
  background: #f8fafc;
}

ion-app.has-sidebar ion-router-outlet {
  margin-left: var(--sidebar-width);
  display: block;
}

@media (max-width: 1024px) {
  ion-app.has-sidebar ion-router-outlet {
    margin-left: 0;
    margin-top: 88px;
  }
}
</style>
