<template>
  <ion-app :class="{ 'has-mobile-navbar': shouldShowNavBar }">
    <ion-router-outlet />
    <NavBar v-if="shouldShowNavBar" />
  </ion-app>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import { Capacitor } from '@capacitor/core';
import NavBar from './components/NavBar.vue';

const nativePlatforms = new Set(['ios', 'android']);
const shouldShowNavBar = ref(nativePlatforms.has(Capacitor.getPlatform()));
</script>

<style>
ion-app.has-mobile-navbar ion-content {
  --padding-bottom: env(safe-area-inset-bottom, 0px);
}
</style>
