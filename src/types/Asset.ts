export interface Asset {
  id: number;
  nombre: string;
  categoria: string;
  estado: string;
  ubicacion: string;

  descripcion?: string;
  observacion?: string;

  fechaAdquisicion: string;
  fechaRegistro?: string;

  costoInicial?: number | string;        // ← FIX
  depreciacionAnual?: number | string;   // ← FIX
}
