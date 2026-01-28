export interface Asset {
  id: number;
  nombre: string;
  categoria: string;
  estado: string;
  ubicacion: string;

  descripcion?: string;
  observacion?: string;

  cantidad: number;

  fechaAdquisicion: string;
  fechaRegistro?: string;

  costoInicial?: number | string;
  depreciacionAnual?: number | string;

  // Nuevos campos de asignación
  assignedUserId?: string | null;
  assignedUserName?: string;
}