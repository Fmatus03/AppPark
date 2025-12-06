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
import NavBar from './components/NavBar.vue';
import SideBar from './components/SideBar.vue';
import { useSession } from './composables/useSession';
import { useSidebar } from './composables/useSidebar';

const { isAuthenticated, isAdmin, isVisitante, isAnalista } = useSession();
const { isMinimized } = useSidebar();

const shouldShowNavBar = computed(() => isAuthenticated.value && isVisitante.value);
const shouldShowSidebar = computed(() => isAuthenticated.value && (isAdmin.value || isAnalista.value));

const appClasses = computed(() => ({
  'has-mobile-navbar': shouldShowNavBar.value,
  'has-sidebar': shouldShowSidebar.value,
  'sidebar-minimized': isMinimized.value,
}));
</script>

<style>
ion-app.has-mobile-navbar ion-content {
  --padding-bottom: env(safe-area-inset-bottom, 0px);
}

ion-app.has-sidebar {
  --sidebar-width: 240px;
  background: var(--page-bg);
}

ion-app.has-sidebar.sidebar-minimized {
  --sidebar-width: 70px;
}

ion-app.has-sidebar ion-router-outlet {
  margin-left: var(--sidebar-width);
  display: block;
  transition: margin-left 0.3s ease;
}

@media (max-width: 1024px) {
  ion-app.has-sidebar ion-router-outlet {
    margin-left: 0;
    margin-top: 88px;
  }
}
</style>
