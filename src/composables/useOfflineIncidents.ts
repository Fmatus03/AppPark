import { ref, watch } from 'vue';
import { Preferences } from '@capacitor/preferences';
import { useIncidentService } from './useIncidentService';
import { Network } from '@capacitor/network';
import { toastController } from '@ionic/vue';
import { useSession } from './useSession';

const STORAGE_KEY = 'offline_incidents_queue';

export interface OfflineIncident {
    id: string;
    timestamp: number;
    data: Record<string, unknown>;
    photos: any[];
    audios: any[];
    retryCount?: number;
}

export const useOfflineIncidents = () => {
    const queue = ref<OfflineIncident[]>([]);
    const { uploadIncident } = useIncidentService();
    const isSyncing = ref(false);
    const { isAuthenticated } = useSession();

    const loadQueue = async () => {
        const result = await Preferences.get({ key: STORAGE_KEY });
        if (result.value) {
            try {
                queue.value = JSON.parse(result.value);
            } catch (e) {
                console.error('Error parsing offline incidents', e);
                queue.value = [];
            }
        }
    };

    const saveQueue = async () => {
        await Preferences.set({
            key: STORAGE_KEY,
            value: JSON.stringify(queue.value),
        });
    };

    const addToQueue = async (incident: Omit<OfflineIncident, 'id' | 'timestamp' | 'retryCount'>) => {
        await loadQueue();
        const newIncident: OfflineIncident = {
            ...incident,
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            retryCount: 0,
        };
        queue.value.push(newIncident);
        await saveQueue();
        return newIncident.id;
    };

    const removeFromQueue = async (id: string) => {
        queue.value = queue.value.filter((i) => i.id !== id);
        await saveQueue();
    };

    const processQueue = async () => {
        // AUTH CHECK: Do not attempt to sync if user is not logged in.
        if (!isAuthenticated.value) {
            console.log('[Offline Sync] User not authenticated. Skipping sync.');
            return;
        }

        if (isSyncing.value) return;

        const status = await Network.getStatus();
        if (!status.connected) return;

        await loadQueue();
        if (queue.value.length === 0) return;

        isSyncing.value = true;

        // Notify user sync is starting
        const startToast = await toastController.create({
            message: 'Conexión detectada. Sincronizando incidentes guardados...',
            duration: 2000,
            position: 'bottom',
            color: 'medium'
        });
        await startToast.present();

        console.log(`[Offline Sync] Starting sync for ${queue.value.length} items`);
        let successCount = 0;
        let failCount = 0;

        // We iterate on a copy, but we modify the REAL queue via helpers
        const itemsToProcess = [...queue.value];

        for (const item of itemsToProcess) {
            try {
                console.log(`[Offline Sync] Uploading incident ${item.id} (Attempt ${item.retryCount || 0 + 1}/3)...`);
                await uploadIncident(item.data, item.photos, item.audios);
                await removeFromQueue(item.id);
                successCount++;
                console.log(`[Offline Sync] Incident ${item.id} uploaded successfully`);
            } catch (error) {
                console.error(`[Offline Sync] Failed to sync incident ${item.id}`, error);

                // Increment retry count
                const currentRetries = (item.retryCount || 0) + 1;

                if (currentRetries >= 3) {
                    // Max retries reached: Delete and Notify
                    console.warn(`[Offline Sync] Max retries reached for ${item.id}. Deleting.`);
                    await removeFromQueue(item.id);
                    failCount++;

                    const errorToast = await toastController.create({
                        message: `No se pudo enviar el incidente "${item.data.titulo}" tras 3 intentos. Se ha eliminado.`,
                        duration: 5000,
                        color: 'danger',
                        position: 'bottom',
                        buttons: ['OK']
                    });
                    await errorToast.present();
                } else {
                    // Update item with new retry count
                    const updatedQueue = queue.value.map(i =>
                        i.id === item.id ? { ...i, retryCount: currentRetries } : i
                    );
                    queue.value = updatedQueue;
                    await saveQueue();
                }
            }
        }

        isSyncing.value = false;

        if (successCount > 0) {
            const toast = await toastController.create({
                message: `${successCount} incidente(s) sincronizado(s) exitosamente.`,
                duration: 3000,
                color: 'success',
                position: 'bottom',
            });
            await toast.present();
        }
    };

    const initNetworkListener = async () => {
        // Initial check
        await processQueue();

        // Listen for changes
        await Network.addListener('networkStatusChange', async (status) => {
            if (status.connected) {
                console.log('Online detected. Waiting 3s for stability before processing offline queue...');
                // Wait a bit for connection to stabilize
                setTimeout(async () => {
                    await processQueue();
                }, 3000);
            }
        });

        // Watch for authentication changes (e.g., login)
        watch(isAuthenticated, async (newValue) => {
            if (newValue) {
                console.log('[Offline Sync] User logged in. Checking for pending items...');
                await processQueue();
            }
        });
    };

    return {
        queue,
        addToQueue,
        removeFromQueue,
        processQueue,
        loadQueue,
        isSyncing,
        initNetworkListener
    };
};
