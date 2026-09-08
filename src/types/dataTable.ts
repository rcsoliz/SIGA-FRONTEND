/** Configuración de columna para <DataTable> (src/components/ui/DataTable.vue) —
 * compartida por las vistas de listado (Estancias, Usuarios, Registros, Ranking,
 * Auditoría) para que la tabla/tarjeta/orden/breakpoint de tablet se resuelvan
 * en un solo componente en vez de reescribirse por vista. */
export interface ColumnaTabla<T = any> {
  /** Nombre de un campo real de T (autocompletado) o una clave sintética
   * (ej. 'ubicacion') para columnas que solo existen vía slot `celda-<clave>`. */
  clave: Extract<keyof T, string> | (string & {})
  etiqueta: string
  alinear?: 'izquierda' | 'derecha' | 'centro'
  ordenable?: boolean
  numerico?: boolean
  /** Oculta la columna entre el punto de quiebre móvil y el de escritorio
   * (768–1023px) para que la tabla de tablet quede condensada en vez de
   * mostrar todas las columnas de escritorio apretadas. */
  ocultarEnTablet?: boolean
  /** Clase Tailwind opcional para el ancho de la columna, ej. 'w-16'. */
  ancho?: string
}
