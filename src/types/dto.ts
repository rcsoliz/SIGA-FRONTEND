import type {
  AccionAuditoria,
  CategoriaGanado,
  EstadoCaptacion,
  EstadoDispositivo,
  EstadoSanitario,
  EstadoSync,
  EstadoUsuario,
  ModuloAuditoria,
  RolUsuario,
  TipoEventoSanitario,
  TipoManejoAlimentario,
  TipoPermiso,
} from './enums'

// --- Auth (sección 2.2 / 4.1 de la especificación) ---

export interface LoginRequestDto {
  email: string
  password: string
}

export interface LoginResponseDto {
  token: string
  expiraEnUtc: string
  usuarioId: string
  nombre: string
  rol: RolUsuario
}

// --- Contrato de errores (sección 2.4) ---

export interface ProblemDetails {
  title: string
  status: number
  detail: string
}

// --- Estancias (sección 4.2 / EstanciasController.cs) ---

export interface EstanciaDto {
  id: string
  nombre: string
  propietario: string
  representante: string | null
  telefono: string | null
  latitud: number
  longitud: number
  renspa: string | null
  hectareasTotales: number | null
  departamento: string | null
  provincia: string | null
  municipio: string | null
  cantidadCaptaciones: number
  totalCabezas: number
  estadoSync: EstadoSync
}

/** Latitud/longitud son obligatorias al crear; el backend no las acepta al editar
 * (ver UpdateEstanciaDto.cs — la ubicación GPS queda fija tras el registro inicial). */
export interface CreateEstanciaDto {
  nombre: string
  propietario: string
  representante?: string | null
  telefono?: string | null
  latitud: number
  longitud: number
  renspa?: string | null
  hectareasTotales?: number | null
  departamento?: string | null
  provincia?: string | null
  municipio?: string | null
  fechaCreacionLocal: string
}

export interface UpdateEstanciaDto {
  nombre: string
  propietario: string
  representante?: string | null
  telefono?: string | null
  renspa?: string | null
  hectareasTotales?: number | null
  departamento?: string | null
  provincia?: string | null
  municipio?: string | null
}

// --- Captaciones (sección 4.3 / CaptacionesController.cs + Captaciones/*.cs) ---

export interface DetalleLoteGanadoDto {
  id: string
  categoria: CategoriaGanado
  raza: string | null
  cantidadCabezas: number
  pesoPromedioEstimadoKg: number | null
  sistemaAlimentacion: TipoManejoAlimentario
  fechaEstimadaFaena: string | null
  notasZootecnicas: string | null
  pesoLoteCalculado: number
  diasRestantesFaena: number | null
}

export interface CreateDetalleLoteGanadoDto {
  categoria: CategoriaGanado
  raza?: string | null
  cantidadCabezas: number
  pesoPromedioEstimadoKg?: number | null
  sistemaAlimentacion: TipoManejoAlimentario
  fechaEstimadaFaena?: string | null
  notasZootecnicas?: string | null
}

export interface CaptacionGanadoDto {
  id: string
  estanciaId: string
  nombre: string
  observaciones: string | null
  estado: EstadoCaptacion
  estadoSanitario: EstadoSanitario
  potrero: string | null
  fecha: string
  latitud: number | null
  longitud: number | null
  estadoSync: EstadoSync
  totalCabezas: number
  pesoEstimadoTotal: number
  diasEnPotrero: number | null
  detalles: DetalleLoteGanadoDto[]
}

/** Requiere al menos 1 elemento en `detalles` — el backend rechaza (400) un
 * Create con `detalles: []` (patrón "Confirmar y Guardar Todo" del mockup). */
export interface CreateCaptacionGanadoDto {
  estanciaId: string
  nombre: string
  observaciones?: string | null
  potrero?: string | null
  fecha: string
  latitud?: number | null
  longitud?: number | null
  fechaCreacionLocal: string
  detalles: CreateDetalleLoteGanadoDto[]
}

/** A diferencia del Create, aquí SÍ son editables estado/estadoSanitario; no
 * incluye detalles ni coordenadas (esas se gestionan por separado). */
export interface UpdateCaptacionGanadoDto {
  nombre: string
  observaciones?: string | null
  estado: EstadoCaptacion
  estadoSanitario: EstadoSanitario
  potrero?: string | null
}

// --- Bitácoras (sección 4.4-4.7 / Pesaje, Sanitario, Movimientos, Alimentacion) ---
// Las 4 comparten el patrón "formulario + historial" (sección 5.2 de la
// especificación) — se implementan con un único componente parametrizado,
// ver src/config/bitacoras.ts.

export interface RegistroPesajeDto {
  id: string
  captacionGanadoId: string
  fecha: string
  pesoPromedioKg: number
  cantidadCabezasPesadas: number | null
  observaciones: string | null
  estadoSync: EstadoSync
}

export interface CreateRegistroPesajeDto {
  captacionGanadoId: string
  fecha: string
  pesoPromedioKg: number
  cantidadCabezasPesadas?: number | null
  observaciones?: string | null
  fechaCreacionLocal: string
}

/** Crear NO tiene restricción de rol en el backend (a diferencia de las otras
 * 3 bitácoras, que son 🔒 Captador — verificado contra RegistrosSanitariosController.cs). */
export interface RegistroSanitarioDto {
  id: string
  captacionGanadoId: string
  fecha: string
  tipoEvento: TipoEventoSanitario
  productoTratamiento: string | null
  registradoPorUsuarioId: string
  registradoPorNombre: string
  observaciones: string | null
  estadoSync: EstadoSync
}

export interface CreateRegistroSanitarioDto {
  captacionGanadoId: string
  fecha: string
  tipoEvento: TipoEventoSanitario
  productoTratamiento?: string | null
  observaciones?: string | null
  fechaCreacionLocal: string
}

export interface MovimientoGanadoDto {
  id: string
  captacionGanadoId: string
  fecha: string
  tipoGanado: CategoriaGanado
  cantidadCabezas: number
  origen: string
  destino: string
  estadoSync: EstadoSync
}

export interface CreateMovimientoGanadoDto {
  captacionGanadoId: string
  fecha: string
  tipoGanado: CategoriaGanado
  cantidadCabezas: number
  origen: string
  destino: string
  fechaCreacionLocal: string
}

export interface RegistroAlimentacionDto {
  id: string
  captacionGanadoId: string
  fecha: string
  tipoAlimentacion: TipoManejoAlimentario
  racionBaseKgAnimal: number | null
  suplementoProteicoKgAnimal: number | null
  observaciones: string | null
  estadoSync: EstadoSync
}

export interface CreateRegistroAlimentacionDto {
  captacionGanadoId: string
  fecha: string
  tipoAlimentacion: TipoManejoAlimentario
  racionBaseKgAnimal?: number | null
  suplementoProteicoKgAnimal?: number | null
  observaciones?: string | null
  fechaCreacionLocal: string
}

// --- Maestro de Registros (sección 4.8 / RegistrosController.cs) ---
// Vista unificada de las 4 bitácoras — solo lectura, 🔒 Administrador.
// Los tipos de bitácora coinciden con ModuloAuditoria salvo por convención de
// nombre ("Alimentacion" sin distinguir de otros módulos de auditoría).

export interface RegistroCampoDto {
  id: string
  fechaHora: string
  tipo: 'Movimiento' | 'Alimentacion' | 'Sanitario' | 'Pesaje'
  captacionGanadoId: string
  captacionNombre: string
  detalleMetrica: string
  productoTratamiento: string | null
  registradoPor: string
  estadoSync: EstadoSync
}

export interface BuscarRegistrosParams {
  desde?: string
  hasta?: string
  tipo?: RegistroCampoDto['tipo']
  captacionId?: string
  texto?: string
}

// --- Dashboard (sección 4.10-4.12 / DashboardController.cs) — 🔒 Administrador,
// salvo el perfil individual (cualquiera puede ver el suyo propio) ---

export interface CabezasPorCategoriaDto {
  categoria: CategoriaGanado
  cantidad: number
}

export interface DashboardSerieMensualDto {
  mes: string
  consumoPromedioKg: number | null
  pesoPromedioKg: number | null
}

export interface DashboardDto {
  totalCabezasActivas: number
  captacionesActivas: number
  captacionesPendientesRevision: number
  cabezasPorCategoria: CabezasPorCategoriaDto[]
  serieMensual: DashboardSerieMensualDto[]
}

export interface CaptadorRankingDto {
  usuarioId: string
  nombre: string
  cargo: string | null
  estanciasRegistradas: number
  captacionesRegistradas: number
  captacionesActivas: number
  totalCabezasCapturadas: number
}

export interface CaptadorProductividadDto {
  usuarioId: string
  nombre: string
  cargo: string | null
  estado: EstadoUsuario
  sectoresAsignados: string[]
  estanciasRegistradas: number
  captacionesRegistradas: number
  captacionesActivas: number
  totalCabezasCapturadas: number
  ultimaActividad: string | null
}

// --- Seguridad y Usuarios (sección 4.13 / UsuariosController.cs) — 🔒 Administrador (toda la clase) ---

export interface UsuarioDto {
  id: string
  nombre: string
  email: string
  cargo: string | null
  rol: RolUsuario
  estado: EstadoUsuario
  fechaCreacion: string
}

export interface SectorAsignadoDto {
  id: string
  nombreSector: string
  zona: string | null
}

export interface DispositivoDto {
  id: string
  identificadorDispositivo: string
  ultimaSincronizacion: string | null
  ubicacionActual: string | null
  estado: EstadoDispositivo
}

export interface PermisoUsuarioDto {
  id: string
  tipoPermiso: TipoPermiso
}

export interface UsuarioDetalleDto {
  id: string
  nombre: string
  email: string
  cargo: string | null
  rol: RolUsuario
  estado: EstadoUsuario
  fechaCreacion: string
  sectoresAsignados: SectorAsignadoDto[]
  dispositivos: DispositivoDto[]
  permisos: PermisoUsuarioDto[]
}

export interface CreateUsuarioDto {
  nombre: string
  email: string
  password: string
  cargo?: string | null
  rol: RolUsuario
}

export interface UpdateUsuarioDto {
  nombre: string
  cargo?: string | null
  estado: EstadoUsuario
}

export interface CreateSectorAsignadoDto {
  nombreSector: string
  zona?: string | null
}

export interface AsignarPermisoDto {
  tipoPermiso: TipoPermiso
}

// --- Trazabilidad y Auditoría (sección 4.14 / AuditoriaController.cs) — 🔒 Administrador ---

export interface LogAuditoriaDto {
  id: string
  usuarioId: string
  usuarioNombre: string
  accion: AccionAuditoria
  modulo: ModuloAuditoria
  idRegistroAfectado: string
  fechaHora: string
  detalle: string | null
}

export interface BuscarAuditoriaParams {
  desde?: string
  hasta?: string
  usuarioId?: string
  modulo?: string
}
