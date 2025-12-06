import { computed, ref, onMounted } from 'vue';
import { Preferences } from '@capacitor/preferences';
import { isPlatform } from '@ionic/vue';

export type UserRole = 'ADMIN' | 'VISITANTE' | 'ANALISTA';

export type SessionUser = {
  id: string;
  name: string;
  role: UserRole;
  token: string;
};

const currentUser = ref<SessionUser | null>(null);
const isReady = ref(false); // To block router until we check storage
const USER_KEY = 'park_app_session_user';

export function useSession() {
  const isAuthenticated = computed(() => currentUser.value !== null);
  const isAdmin = computed(() => currentUser.value?.role === 'ADMIN');
  const isVisitante = computed(() => currentUser.value?.role === 'VISITANTE');
  const isAnalista = computed(() => currentUser.value?.role === 'ANALISTA');
  const authToken = computed(() => currentUser.value?.token ?? null);

  const loadUser = async () => {
    try {
      const { value } = await Preferences.get({ key: USER_KEY });
      if (value) {
        currentUser.value = JSON.parse(value);
      }
    } catch (e) {
      console.error('Error loading session from storage', e);
    } finally {
      isReady.value = true;
    }
  };

  const login = async (user: SessionUser, rememberMe = false) => {
    currentUser.value = { ...user };
    if (rememberMe) {
      await Preferences.set({ key: USER_KEY, value: JSON.stringify(user) });
    }
  };

  const logout = async () => {
    currentUser.value = null;
    if (isPlatform('hybrid')) {
      await Preferences.remove({ key: USER_KEY });
    }
  };

  // Initialize once
  onMounted(() => {
    if (!isReady.value) {
      loadUser();
    }
  });

  return {
    currentUser,
    isAuthenticated,
    isAdmin,
    isVisitante,
    isAnalista,
    authToken,
    login,
    logout,
    isReady,
    loadUser
  };
}
