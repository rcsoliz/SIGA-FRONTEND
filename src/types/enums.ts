// Enums del backend SIGA — valores exactos en PascalCase tal cual llegan del
// JSON (ver sección 2.5 de docs/especificacion-integracion-frontend.md).
// Cada mapa de etiquetas es la traducción a español ya usada en los mockups
// de Stitch. NO derivar la etiqueta con reglas genéricas (ej. insertar
// espacio antes de mayúscula): casos como VacaDescarte -> "Vaca Descarte" y
// SemiConfinamiento -> "Semi-Confinamiento" no siguen un patrón regular.

export type RolUsuario = 'Administrador' | 'Captador'
export const RolUsuarioLabels: Record<RolUsuario, string> = {
  Administrador: 'Administrador',
  Captador: 'Captador',
}

export type CategoriaGanado = 'Toro' | 'Novillo' | 'Vaquilla' | 'VacaDescarte' | 'Ternero'
export const CategoriaGanadoLabels: Record<CategoriaGanado, string> = {
  Toro: 'Toro',
  Novillo: 'Novillo',
  Vaquilla: 'Vaquilla',
  VacaDescarte: 'Vaca Descarte',
  Ternero: 'Ternero',
}

export type TipoManejoAlimentario = 'PastoreoLibre' | 'SemiConfinamiento' | 'Confinamiento'
export const TipoManejoAlimentarioLabels: Record<TipoManejoAlimentario, string> = {
  PastoreoLibre: 'Pastoreo Libre',
  SemiConfinamiento: 'Semi-Confinamiento',
  Confinamiento: 'Confinamiento',
}

export type EstadoCaptacion = 'BorradorLocal' | 'Registrado' | 'EnPlanificacionFaena' | 'Procesado'
export const EstadoCaptacionLabels: Record<EstadoCaptacion, string> = {
  BorradorLocal: 'Borrador Local',
  Registrado: 'Registrado',
  EnPlanificacionFaena: 'En Planificación de Faena',
  Procesado: 'Procesado',
}

export type EstadoSanitario = 'Optimo' | 'EnObservacion' | 'Critico'
export const EstadoSanitarioLabels: Record<EstadoSanitario, string> = {
  Optimo: 'Óptimo',
  EnObservacion: 'En Observación',
  Critico: 'Crítico',
}

export type EstadoSync = 'Pendiente' | 'Sincronizado' | 'Error'
export const EstadoSyncLabels: Record<EstadoSync, string> = {
  Pendiente: 'Pendiente',
  Sincronizado: 'Sincronizado',
  Error: 'Error',
}

export type EstadoUsuario = 'Activo' | 'Pendiente' | 'Suspendido'
export const EstadoUsuarioLabels: Record<EstadoUsuario, string> = {
  Activo: 'Activo',
  Pendiente: 'Pendiente',
  Suspendido: 'Suspendido',
}

export type TipoEventoSanitario = 'Vacunacion' | 'Antiparasitario' | 'ControlRutina' | 'Tratamiento'
export const TipoEventoSanitarioLabels: Record<TipoEventoSanitario, string> = {
  Vacunacion: 'Vacunación',
  Antiparasitario: 'Antiparasitario',
  ControlRutina: 'Control de Rutina',
  Tratamiento: 'Tratamiento',
}

export type AccionAuditoria = 'Creacion' | 'Modificacion' | 'Eliminacion'
export const AccionAuditoriaLabels: Record<AccionAuditoria, string> = {
  Creacion: 'Creación',
  Modificacion: 'Modificación',
  Eliminacion: 'Eliminación',
}

export type TipoPermiso = 'EntradaDatos' | 'RegistrosHistoricos' | 'ConfiguracionSistema'
export const TipoPermisoLabels: Record<TipoPermiso, string> = {
  EntradaDatos: 'Entrada de Datos',
  RegistrosHistoricos: 'Registros Históricos',
  ConfiguracionSistema: 'Configuración del Sistema',
}

export type EstadoDispositivo = 'Activo' | 'Revocado'
export const EstadoDispositivoLabels: Record<EstadoDispositivo, string> = {
  Activo: 'Activo',
  Revocado: 'Revocado',
}

/** Módulos de auditoría: string libre del backend, no un enum — se muestran tal cual. */
export type ModuloAuditoria =
  | 'Usuario'
  | 'Estancia'
  | 'CaptacionGanado'
  | 'Pesaje'
  | 'Sanitario'
  | 'Movimiento'
  | 'Alimentacion'
