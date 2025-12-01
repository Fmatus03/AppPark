export type DateRangePayload = { fechaInicio: string; fechaFin: string };
export type PeriodoConsulta = { fechaInicio: string; fechaFin: string };
export type CategoriaTrend = { id: number; nombre: string; cantidadIncidentes: number; porcentaje: number };
export type TendenciasCategoriasResponse = {
    periodoConsulta: PeriodoConsulta;
    totalIncidentes: number;
    categorias: CategoriaTrend[];
};
export type AgrupacionTemporal = 'DIARIA' | 'SEMANAL' | 'MENSUAL' | 'TRIMESTRAL' | 'ANUAL';
export type EvolucionCategoriasResponse = {
    periodoConsulta: PeriodoConsulta;
    agrupacionTemporal: AgrupacionTemporal;
    evolucionPorCategoria: Array<{
        categoriaId: number;
        categoriaNombre: string;
        datosTemporales: Array<{ periodo: string; cantidad: number; porcentajeDelPeriodo: number }>;
        estadisticas: { total: number; promedio: number; maximo: number; minimo: number; tendencia: string };
    }>;
    totalIncidentesPorPeriodo: Array<{ periodo: string; total: number }>;
};
export type AnalisisHorarioResponse = {
    periodoConsulta: PeriodoConsulta;
    totalIncidentes: number;
    analisisPorHorario: Array<{ hora: number; cantidadIncidentes: number; porcentaje: number }>;
    estadisticas: {
        horaPico: number;
        cantidadEnHoraPico: number;
        horaMinima: number;
        cantidadEnHoraMinima: number;
        promedioIncidentesPorHora: number;
    };
};
export type RutaRef = { id: number; nombre: string };
export type CategoriaRef = { id: number; nombre: string };
export type CategoriaDistribucion = { nombre: string; cantidad: number; porcentaje: number };
export type DistribucionCategoriaSimple = { categoria: string; cantidad: number; porcentaje: number };
export type DistribucionEstado = { estado: string; cantidad: number; porcentaje: number };
export type RutasCriticasResponse = {
    periodoConsulta: PeriodoConsulta;
    totalIncidentes: number;
    totalRutas: number;
    topRutasCriticas: Array<{
        ranking: number;
        ruta: RutaRef;
        cantidadIncidentes: number;
        porcentaje: number;
        categoriasPrincipales: CategoriaDistribucion[];
    }>;
    estadisticas: {
        promedioIncidentesPorRuta: number;
        rutaMasCritica: string;
        rutaMenosCritica: string;
    };
};
export type PeriodoMensualResumen = {
    mes: string;
    totalIncidentes: number;
    porCategoria: DistribucionCategoriaSimple[];
    porEstado: DistribucionEstado[];
};
export type ComparacionMensualResponse = {
    periodo1: PeriodoMensualResumen;
    periodo2: PeriodoMensualResumen;
    comparacion: {
        variacionTotal: number;
        variacionPorcentual: number;
        tendencia: string;
    };
};
export type PeriodoAnualResumen = {
    anio: number;
    totalIncidentes: number;
    promedioMensual: number;
    porCategoria: DistribucionCategoriaSimple[];
    evolucionMensual: Array<{ mes: string; total: number }>;
};
export type ComparacionAnualResponse = {
    periodo1: PeriodoAnualResumen;
    periodo2: PeriodoAnualResumen;
    comparacion: {
        variacionTotal: number;
        variacionPorcentual: number;
        tendencia: string;
        categoriaConMayorCrecimiento?: string;
        categoriaConMayorDecrecimiento?: string;
    };
};
export type AnalisisEstacionalResponse = {
    anio: number;
    totalIncidentes: number;
    analisisPorEstacion: Array<{
        estacion: string;
        periodo: string;
        cantidadIncidentes: number;
        porcentaje: number;
        promedioDiario: number;
        categoriasPrincipales: CategoriaDistribucion[];
    }>;
    estadisticas: {
        estacionConMasIncidentes: string;
        estacionConMenosIncidentes: string;
        diferenciaMaxima: number;
    };
};
export type SegmentoClave = 'madrugada' | 'manana' | 'tarde' | 'noche';
export type DayOfWeek = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';
export type SegmentoDetalle = {
    rango: string;
    cantidadTotal: number;
    porcentaje: number;
    promedioDiario: number;
    categoriasPrincipales: CategoriaDistribucion[];
} | null;
export type PatronesHorariosResponse = {
    periodoConsulta: PeriodoConsulta;
    totalIncidentes: number;
    patronesPorSegmento: Record<SegmentoClave, SegmentoDetalle>;
    distribucionPorDiaSemana: Record<SegmentoClave, Record<DayOfWeek, number>>;
};
export type IncidenteRecurrenteDetalle = {
    ruta: RutaRef;
    categoria: CategoriaRef;
    cantidadIncidentes: number;
    porcentajeDelTotal: number;
    frecuenciaPromedioDias: number;
    ultimoIncidente: string;
};
export type IncidentesRecurrentesResponse = {
    periodoConsulta: PeriodoConsulta;
    umbralRecurrencia: number;
    totalCombinacionesRecurrentes: number;
    incidentesRecurrentes: IncidenteRecurrenteDetalle[];
    estadisticas: {
        combinacionConMasIncidentes: string;
        rutaMasRecurrente: string;
        categoriaMasRecurrente: string;
        promedioFrecuenciaDias: number;
    };
};
export type ComparacionZonasResponse = {
    periodoConsulta: PeriodoConsulta;
    totalIncidentes: number;
    comparacionPorZona: Array<{
        ruta: RutaRef;
        totalIncidentes: number;
        porcentaje: number;
        distribucionCategorias: CategoriaDistribucion[];
        categoriaDominante: string;
    }>;
    rankingPorCategoria: Record<string, Array<{ ruta: string; cantidad: number }>>;
};
export type TiempoResolucionResponse = {
    periodoConsulta: PeriodoConsulta;
    totalIncidentesResueltos: number;
    promedioGeneralDias: number;
    promedioGeneralHoras: number;
    tiempoPorCategoria: Array<{
        categoria: CategoriaRef;
        cantidadResueltos: number;
        promedioDias: number;
        promedioHoras: number;
        minimoHoras: number;
        maximoHoras: number;
        medianaDias: number;
    }>;
};
export type RankingTendenciaRutasResponse = {
    periodoConsulta: PeriodoConsulta;
    agrupacionTemporal: AgrupacionTemporal;
    rankingRutas: Array<{
        ranking: number;
        ruta: RutaRef;
        totalIncidentes: number;
        porcentaje: number;
        evolucionTemporal: Array<{ periodo: string; cantidad: number }>;
        tendencia: string;
        variacionPorcentual: number;
        prediccionProximoMes: number;
    }>;
    analisisGlobal: {
        rutaConTendenciaPositiva?: string;
        rutaConTendenciaNegativa?: string;
        rutaMasEstable?: string;
    };
};
export type ProporcionEstadosResponse = {
    periodoConsulta: PeriodoConsulta;
    totalIncidentes: number;
    proporcionGlobal: {
        resueltos: number;
        porcentajeResueltos: number;
        pendientes: number;
        porcentajePendientes: number;
        enProceso: number;
        porcentajeEnProceso: number;
    };
    proporcionPorCategoria: Array<{
        categoria: CategoriaRef;
        totalIncidentes: number;
        resueltos: number;
        porcentajeResueltos: number;
        pendientes: number;
        porcentajePendientes: number;
        enProceso: number;
        porcentajeEnProceso: number;
        eficiencia: number;
    }>;
    proporcionPorRuta: Array<{
        ruta: RutaRef;
        totalIncidentes: number;
        resueltos: number;
        porcentajeResueltos: number;
        pendientes: number;
        porcentajePendientes: number;
        enProceso: number;
        porcentajeEnProceso: number;
        eficiencia: number;
    }>;
    metaEficiencia: {
        metaPorcentajeResueltos: number;
        cumplimientoGlobal: boolean;
        categoriasQueCumplen: string[];
        rutasQueCumplen: string[];
        brechaPromedio: number;
    };
};
export type EficienciaCierreResponse = {
    periodoConsulta: PeriodoConsulta;
    totalIncidentes: number;
    totalResueltos: number;
    tasaCierreGlobal: number;
    eficienciaPorCategoria: Array<{
        categoria: CategoriaRef;
        totalIncidentes: number;
        resueltos: number;
        pendientes: number;
        enProceso: number;
        tasaCierre: number;
        tiempoPromedioResolucionDias: number;
    }>;
    eficienciaPorRuta: Array<{
        ruta: RutaRef;
        totalIncidentes: number;
        resueltos: number;
        pendientes: number;
        enProceso: number;
        tasaCierre: number;
        tiempoPromedioResolucionDias: number;
    }>;
    evolucionMensual: Array<{
        mes: string;
        totalIncidentes: number;
        resueltos: number;
        tasaCierre: number;
    }>;
};
