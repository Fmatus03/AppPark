
import { reactive } from 'vue';

type FeatureCollection = any; // Avoid complex imports in singleton, will use any or strict types if needed
type RouteZone = any;

interface AdminMapState {
    incidents: FeatureCollection | null;
    zones: RouteZone[];
    fechaInicio: string;
    fechaFin: string;
    hasLoaded: boolean;
}

const state = reactive<AdminMapState>({
    incidents: null,
    zones: [],
    fechaInicio: '',
    fechaFin: '',
    hasLoaded: false,
});

export function useAdminMapStore() {
    const setIncidents = (data: FeatureCollection) => {
        state.incidents = data;
        state.hasLoaded = true;
    };

    const setZones = (data: RouteZone[]) => {
        state.zones = data;
    };

    const setDates = (inicio: string, fin: string) => {
        state.fechaInicio = inicio;
        state.fechaFin = fin;
    };

    const reset = () => {
        state.incidents = null;
        state.zones = [];
        state.hasLoaded = false;
    };

    return {
        state,
        setIncidents,
        setZones,
        setDates,
        reset,
    };
}
