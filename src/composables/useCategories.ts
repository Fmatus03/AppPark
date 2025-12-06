import { ref } from 'vue';
import { Preferences } from '@capacitor/preferences';
import { isPlatform } from '@ionic/vue';
import { isAndroidNativeApp, parseNativeResponse } from '@/utils/httpHelpers';
import { useSession } from './useSession';

const CATEGORIES_KEY = 'park_app_categories_cache';

export interface Category {
    id: number;
    nombre: string;
}

export const useCategories = () => {
    const categories = ref<Category[]>([]);
    const { authToken } = useSession();
    const apiBaseUrl = import.meta.env.VITE_PARK_APP_API_URL;

    const loadCategories = async () => {
        // 1. Try cache first (Offline-first strategy for display)
        if (isPlatform('hybrid')) {
            try {
                const { value } = await Preferences.get({ key: CATEGORIES_KEY });
                if (value) {
                    categories.value = JSON.parse(value);
                }
            } catch (e) {
                console.error('Error loading categories cache', e);
            }
        }

        // 2. If no token, we can't fetch fresh ones
        if (!authToken.value || !apiBaseUrl) return;

        // 3. Fetch fresh data
        const endpoint = `${apiBaseUrl.replace(/\/$/, '')}/api/incidentes/categorias`;
        const headers = {
            Accept: 'application/json',
            Authorization: `Bearer ${authToken.value}`,
        };

        try {
            let fetchedCategories: Category[] = [];

            if (isAndroidNativeApp()) {
                // We assume HTTP plugin is globally available or imported in utils logic, 
                // but here we might need dynamic import if strictly checking.
                // However, standard is usually import at top. Let's do dynamic for safety if keeping consistent with View logic
                const { HTTP } = await import('@awesome-cordova-plugins/http');
                const response = await HTTP.get(endpoint, {}, headers);
                if (response.status >= 200 && response.status < 300) {
                    fetchedCategories = parseNativeResponse<Category[]>(response.data) || [];
                }
            } else {
                const response = await fetch(endpoint, { headers });
                if (response.ok) {
                    fetchedCategories = await response.json();
                }
            }

            if (fetchedCategories.length > 0) {
                categories.value = fetchedCategories;
                if (isPlatform('hybrid')) {
                    await Preferences.set({ key: CATEGORIES_KEY, value: JSON.stringify(fetchedCategories) });
                }
            }
        } catch (error) {
            console.error('Error fetching categories (using cache if available)', error);
        }
    };

    return {
        categories,
        loadCategories
    };
};
