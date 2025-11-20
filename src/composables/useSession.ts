import { computed, ref } from 'vue';

export type UserRole = 'ADMIN' | 'VISITANTE' | 'ANALISTA';

export type SessionUser = {
  id: string;
  name: string;
  role: UserRole;
  token: string;
};

const STORAGE_KEY = 'apppark.session';
const currentUser = ref<SessionUser | null>(null);
const hasHydratedSession = ref(false);

const persistSession = (user: SessionUser | null, persist: boolean) => {
  if (typeof window === 'undefined') {
    return;
  }
  if (persist && user) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
};

const hydrateSessionFromStorage = () => {
  if (hasHydratedSession.value || typeof window === 'undefined') {
    return;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const storedUser = JSON.parse(raw) as SessionUser;
      currentUser.value = storedUser;
    }
  } catch (error) {
    console.warn('session-hydration-error', error);
    window.localStorage.removeItem(STORAGE_KEY);
  }
  hasHydratedSession.value = true;
};

hydrateSessionFromStorage();

export function useSession() {
  const isAuthenticated = computed(() => currentUser.value !== null);
  const isAdmin = computed(() => currentUser.value?.role === 'ADMIN');
  const isVisitante = computed(() => currentUser.value?.role === 'VISITANTE');
  const isAnalista = computed(() => currentUser.value?.role === 'ANALISTA');
  const authToken = computed(() => currentUser.value?.token ?? null);

  const login = (user: SessionUser, persist = false) => {
    currentUser.value = { ...user };
    persistSession(currentUser.value, persist);
  };

  const logout = () => {
    currentUser.value = null;
    persistSession(null, false);
  };

  return {
    currentUser,
    isAuthenticated,
    isAdmin,
    isVisitante,
    isAnalista,
    authToken,
    login,
    logout,
    hasHydratedSession: computed(() => hasHydratedSession.value),
    restoreSessionFromStorage: hydrateSessionFromStorage,
  };
}
