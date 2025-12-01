import { reactive, computed, watch } from 'vue';
import { useAnalyticsApi } from '@/composables/useAnalyticsApi';
import { useSession } from '@/composables/useSession';
import type {
    DateRangePayload,
    TendenciasCategoriasResponse,
    EvolucionCategoriasResponse,
    AnalisisHorarioResponse,
    RutasCriticasResponse,
    ComparacionMensualResponse,
    ComparacionAnualResponse,
    AnalisisEstacionalResponse,
    PatronesHorariosResponse,
    IncidentesRecurrentesResponse,
    ComparacionZonasResponse,
    TiempoResolucionResponse,
    RankingTendenciaRutasResponse,
    ProporcionEstadosResponse,
    EficienciaCierreResponse,
    AgrupacionTemporal,
} from '@/types/analytics';

type SectionState<TPayload, TResponse> = { payload: TPayload; loading: boolean; error: string; data: TResponse | null };

const createSectionState = <TPayload, TResponse>(payload: TPayload): SectionState<TPayload, TResponse> =>
    reactive({ payload, loading: false, error: '', data: null as TResponse | null }) as SectionState<TPayload, TResponse>;

// Default helpers
const defaultRange = (days = 30): DateRangePayload => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    return { fechaInicio: start.toISOString(), fechaFin: end.toISOString() };
};

const defaultMonthRange = () => {
    const now = new Date();
    const prev = new Date(now);
    prev.setMonth(prev.getMonth() - 1);
    return { mes1: prev.toISOString().slice(0, 7), mes2: now.toISOString().slice(0, 7) };
};

const currentYear = new Date().getFullYear();

export const useOverviewState = () => {
    const session = useSession();
    const { postReport } = useAnalyticsApi({ getToken: () => session.authToken.value ?? undefined });

    // --- GLOBAL FILTERS ---
    const filters = reactive({
        dateRange: {
            startDate: defaultRange(30).fechaInicio,
            endDate: defaultRange(30).fechaFin,
        },
        year: currentYear,
        yearComparison: currentYear - 1,
        month1: defaultMonthRange().mes1,
        month2: defaultMonthRange().mes2,
        grouping: 'MENSUAL' as AgrupacionTemporal,
        topRoutes: 5,
        recurrenceThreshold: 10,
        topRanking: 5,
    });

    // --- ISOLATED REPORT STATES ---
    const reports = {
        tendenciasCategorias: createSectionState<DateRangePayload, TendenciasCategoriasResponse>(defaultRange()),
        evolucionCategorias: createSectionState<DateRangePayload & { agrupacion: AgrupacionTemporal }, EvolucionCategoriasResponse>({ ...defaultRange(90), agrupacion: 'MENSUAL' }),
        analisisHorario: createSectionState<DateRangePayload, AnalisisHorarioResponse>(defaultRange()),
        rutasCriticas: createSectionState<DateRangePayload & { top: number }, RutasCriticasResponse>({ ...defaultRange(120), top: 5 }),
        comparacionMensual: createSectionState<{ mes1: string; mes2: string }, ComparacionMensualResponse>({ mes1: '', mes2: '' }),
        comparacionAnual: createSectionState<{ anio1: number; anio2: number }, ComparacionAnualResponse>({ anio1: currentYear - 1, anio2: currentYear }),
        analisisEstacional: createSectionState<{ anio: number }, AnalisisEstacionalResponse>({ anio: currentYear }),
        patronesHorarios: createSectionState<DateRangePayload, PatronesHorariosResponse>(defaultRange(60)),
        incidentesRecurrentes: createSectionState<DateRangePayload & { umbralRecurrencia: number }, IncidentesRecurrentesResponse>({ ...defaultRange(180), umbralRecurrencia: 10 }),
        comparacionZonas: createSectionState<DateRangePayload, ComparacionZonasResponse>(defaultRange(120)),
        tiempoResolucion: createSectionState<DateRangePayload, TiempoResolucionResponse>({ fechaInicio: '2020-01-01T00:00:00', fechaFin: new Date().toISOString() }),
        rankingTendenciaRutas: createSectionState<DateRangePayload & { agrupacion: AgrupacionTemporal; top: number }, RankingTendenciaRutasResponse>({ ...defaultRange(365), agrupacion: 'MENSUAL', top: 5 }),
        proporcionEstados: createSectionState<DateRangePayload, ProporcionEstadosResponse>(defaultRange(180)),
        eficienciaCierre: createSectionState<DateRangePayload, EficienciaCierreResponse>(defaultRange(365)),
    };

    // --- PAYLOAD SYNC ---
    watch(
        () => [filters.dateRange, filters.grouping, filters.topRoutes, filters.recurrenceThreshold, filters.topRanking],
        () => {
            const rangePayload = { fechaInicio: filters.dateRange.startDate, fechaFin: filters.dateRange.endDate };

            // Update standard range reports
            reports.tendenciasCategorias.payload = rangePayload;
            reports.analisisHorario.payload = rangePayload;
            reports.patronesHorarios.payload = rangePayload;
            reports.comparacionZonas.payload = rangePayload;
            reports.tiempoResolucion.payload = rangePayload;
            reports.proporcionEstados.payload = rangePayload;
            reports.eficienciaCierre.payload = rangePayload;

            // Update reports with extra params
            reports.evolucionCategorias.payload = { ...rangePayload, agrupacion: filters.grouping };
            reports.rutasCriticas.payload = { ...rangePayload, top: filters.topRoutes };
            reports.incidentesRecurrentes.payload = { ...rangePayload, umbralRecurrencia: filters.recurrenceThreshold };
            reports.rankingTendenciaRutas.payload = { ...rangePayload, agrupacion: filters.grouping, top: filters.topRanking };
        },
        { deep: true, immediate: true }
    );

    watch(
        () => [filters.year, filters.yearComparison],
        () => {
            reports.comparacionAnual.payload = { anio1: filters.yearComparison, anio2: filters.year };
            reports.analisisEstacional.payload = { anio: filters.year };
        },
        { immediate: true }
    );

    watch(
        () => [filters.month1, filters.month2],
        () => {
            reports.comparacionMensual.payload = { mes1: filters.month1, mes2: filters.month2 };
        },
        { immediate: true }
    );

    // --- ACTIONS ---
    const runReport = async <TPayload, TResponse>(endpoint: string, state: SectionState<TPayload, TResponse>) => {
        state.loading = true;
        state.error = '';
        try {
            state.data = await postReport<TResponse>(endpoint, { ...(state.payload as Record<string, unknown>) });
        } catch (error) {
            console.error(endpoint, error);
            state.error = (error as Error).message ?? 'Error al cargar reporte.';
        } finally {
            state.loading = false;
        }
    };

    const fetchOverviewData = async (enabledReports: Record<string, boolean>) => {
        const promises = [];

        if (enabledReports['tendencias-categorias']) promises.push(runReport('tendencias-categorias', reports.tendenciasCategorias));
        if (enabledReports['evolucion-categorias']) promises.push(runReport('evolucion-categorias', reports.evolucionCategorias));
        if (enabledReports['analisis-horario']) promises.push(runReport('analisis-horario', reports.analisisHorario));
        if (enabledReports['rutas-criticas']) promises.push(runReport('rutas-criticas', reports.rutasCriticas));
        if (enabledReports['comparacion-mensual']) promises.push(runReport('comparacion-mensual', reports.comparacionMensual));
        if (enabledReports['comparacion-anual']) promises.push(runReport('comparacion-anual', reports.comparacionAnual));
        if (enabledReports['analisis-estacional']) promises.push(runReport('analisis-estacional', reports.analisisEstacional));
        if (enabledReports['patrones-horarios']) promises.push(runReport('patrones-horarios', reports.patronesHorarios));
        if (enabledReports['incidentes-recurrentes']) promises.push(runReport('incidentes-recurrentes', reports.incidentesRecurrentes));
        if (enabledReports['comparacion-zonas']) promises.push(runReport('comparacion-zonas', reports.comparacionZonas));
        if (enabledReports['tiempo-resolucion']) promises.push(runReport('tiempo-resolucion', reports.tiempoResolucion));
        if (enabledReports['ranking-rutas']) promises.push(runReport('ranking-tendencia-rutas', reports.rankingTendenciaRutas));
        if (enabledReports['proporcion-estados']) promises.push(runReport('proporcion-estados', reports.proporcionEstados));
        if (enabledReports['eficiencia-cierre']) promises.push(runReport('eficiencia-cierre', reports.eficienciaCierre));

        await Promise.all(promises);
    };

    return {
        filters,
        reports,
        fetchOverviewData,
    };
};
