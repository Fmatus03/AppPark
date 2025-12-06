export type ResumenPorEstadoItem = {
    estado: string;
    cantidad: number;
    porcentaje: number;
};

export type ResumenPorCategoriaItem = {
    categoriaId: number;
    categoriaNombre: string;
    cantidad: number;
    porcentaje: number;
};

export type ResumenPorRutaItem = {
    rutaId: number;
    rutaNombre: string;
    cantidad: number;
    porcentaje: number;
};

export type ResumenPorEstadoResponse = ResumenPorEstadoItem[];
export type ResumenPorCategoriaResponse = ResumenPorCategoriaItem[];
export type ResumenPorRutaResponse = ResumenPorRutaItem[];
