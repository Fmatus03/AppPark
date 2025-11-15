import { computed, ref } from 'vue';

export type UserRole = 'admin' | 'user';

export type SessionUser = {
  id: string;
  name: string;
  role: UserRole;
};

const currentUser = ref<SessionUser | null>(null);

export function useSession() {
  const isAuthenticated = computed(() => currentUser.value !== null);
  const isAdmin = computed(() => currentUser.value?.role === 'admin');
  const isUser = computed(() => currentUser.value?.role === 'user');

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
    isUser,
    login,
    logout,
  };
}
