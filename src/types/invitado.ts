// Cola de sincronización del modo invitado (Captador sin conexión). Cada
// ítem guarda el payload de creación completo (incluyendo el/los campos que
// referencian al padre, ej. estanciaId) porque en modo invitado esos campos
// ya contienen el tempId del padre — así invitadoApi no necesita reacomodar
// el payload, y sincronizacion.ts solo reemplaza esa referencia por el id
// real antes de reenviarlo al backend.
import type {
  CreateCaptacionGanadoDto,
  CreateEstanciaDto,
} from './dto'
import type { TipoBitacora } from '@/config/bitacoras'

export type EstadoItemCola = 'pendiente' | 'sincronizando' | 'error'

interface ItemColaBase {
  tempId: string
  estado: EstadoItemCola
  errorSync?: string
  creadoEn: string
}

export interface EstanciaPendiente extends ItemColaBase {
  tipo: 'Estancia'
  payload: CreateEstanciaDto
}

export interface CaptacionPendiente extends ItemColaBase {
  tipo: 'Captacion'
  /** payload.estanciaId es el tempId de la Estancia padre hasta que sincroniza. */
  payload: CreateCaptacionGanadoDto
}

export interface BitacoraPendiente extends ItemColaBase {
  tipo: TipoBitacora
  /** payload.captacionGanadoId es el tempId de la Captación padre hasta que sincroniza. */
  payload: Record<string, any>
}

export type ItemCola = EstanciaPendiente | CaptacionPendiente | BitacoraPendiente

/** tempId -> id real asignado por el backend. Solo crece; nunca se borra una
 * entrada, para que una sincronización parcial sea reintentable sin perder
 * la referencia al id real ya obtenido. */
export type MapaIdsReales = Record<string, string>
