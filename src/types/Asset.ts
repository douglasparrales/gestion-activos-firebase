export interface Asset {
  id: number;                    // ID numérico autoincremental
  
  nombre: string;
  categoria: string;
  estado: string;
  ubicacion: string;

  fechaAdquisicion: string;      // formato YYYY-MM-DD
  fechaRegistro?: string;

  costoInicial?: number;         // precio de compra
  depreciacionAnual?: number;     // valor en % o cantidad fija por año
}
