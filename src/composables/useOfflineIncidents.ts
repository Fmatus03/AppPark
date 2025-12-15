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

// SINGLETON STATE
// Defined outside the function so they are shared across the app
const queue = ref<OfflineIncident[]>([]);
const isSyncing = ref(false);

export const useOfflineIncidents = () => {
    const { uploadIncident } = useIncidentService();
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
        // Ensure we have latest data
        if (queue.value.length === 0) {
            await loadQueue();
        }

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
        console.log('[Offline Sync] processQueue triggered');

        // AUTH CHECK: Do not attempt to sync if user is not logged in.
        if (!isAuthenticated.value) {
            console.log('[Offline Sync] User not authenticated. Skipping sync.');
            return;
        }

        if (isSyncing.value) {
            console.log('[Offline Sync] Already syncing. Skipping duplicate request.');
            return;
        }

        const status = await Network.getStatus();
        console.log('[Offline Sync] Network status:', status);
        if (!status.connected) {
            console.log('[Offline Sync] Not connected. Aborting.');
            return;
        }

        // Ensure queue is loaded
        if (queue.value.length === 0) {
            console.log('[Offline Sync] Queue empty in memory, checking storage...');
            await loadQueue();
        }

        console.log('[Offline Sync] Queue length:', queue.value.length);
        if (queue.value.length === 0) {
            console.log('[Offline Sync] No items to sync.');
            return;
        }

        isSyncing.value = true;
        console.log('[Offline Sync] Acquiring sync lock.');

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
        console.log('[Offline Sync] Sync finished. Lock released.');

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
        console.log('[Offline Sync] Initializing network listener...');
        // Initial check
        await processQueue();

        // Listen for changes
        await Network.addListener('networkStatusChange', async (status) => {
            console.log('[Offline Sync] Network status changed:', status);
            if (status.connected) {
                console.log('Online detected. Waiting 3s for stability before processing offline queue...');
                // Wait a bit for connection to stabilize
                setTimeout(async () => {
                    console.log('[Offline Sync] 3s timeout reached. processing queue...');
                    await processQueue();
                }, 3000);
            }
        });

        // Watch for authentication changes (e.g., login)
        watch(isAuthenticated, async (newValue) => {
            console.log('[Offline Sync] Auth state changed:', newValue);
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
