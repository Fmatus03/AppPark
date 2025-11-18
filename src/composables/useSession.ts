import { computed, ref } from 'vue';

export type UserRole = 'admin' | 'visitante';

export type SessionUser = {
  id: string;
  name: string;
  role: UserRole;
  token: string;
};

const currentUser = ref<SessionUser | null>(null);

export function useSession() {
  const isAuthenticated = computed(() => currentUser.value !== null);
  const isAdmin = computed(() => currentUser.value?.role === 'admin');
  const isVisitante = computed(() => currentUser.value?.role === 'visitante');
  const authToken = computed(() => currentUser.value?.token ?? null);

  const login = (user: SessionUser) => {
    currentUser.value = { ...user };
  };

  const logout = () => {
    currentUser.value = null;
  };

  return {
    currentUser,
    isAuthenticated,
    isAdmin,
    isVisitante,
    authToken,
    login,
    logout,
  };
}
