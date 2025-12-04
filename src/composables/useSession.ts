import { computed, ref } from 'vue';

export type UserRole = 'ADMIN' | 'VISITANTE' | 'ANALISTA';

export type SessionUser = {
  id: string;
  name: string;
  role: UserRole;
  token: string;
};

const currentUser = ref<SessionUser | null>(null);

export function useSession() {
  const isAuthenticated = computed(() => currentUser.value !== null);
  const isAdmin = computed(() => currentUser.value?.role === 'ADMIN');
  const isVisitante = computed(() => currentUser.value?.role === 'VISITANTE');
  const isAnalista = computed(() => currentUser.value?.role === 'ANALISTA');
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
    isAnalista,
    authToken,
    login,
    logout,
  };
}
