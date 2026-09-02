// Motor de sincronización del modo invitado: sube la cola local al backend
// real en 3 pasadas secuenciales (Estancias -> Captaciones -> Bitácoras)
// porque cada etapa necesita el id real que dejó la anterior. Se llama tanto
// justo después de un login real exitoso (LoginView.vue) como desde el pill
// de reintento manual en AppShell.vue — en ambos casos ya existe un Bearer
// token válido, así que no necesita lógica especial de autenticación.
import { useInvitadoStore } from '@/stores/invitado'
import { ApiError } from '@/api/client'
import * as estanciasApi from '@/api/estancias'
import * as captacionesApi from '@/api/captaciones'
import * as pesajeApi from '@/api/pesaje'
import * as sanitarioApi from '@/api/sanitario'
import * as movimientosApi from '@/api/movimientos'
import * as alimentacionApi from '@/api/alimentacion'
import type { BitacoraPendiente, CaptacionPendiente, EstanciaPendiente, ItemCola } from '@/types/invitado'

// Dispatch explícito (no un lookup por objeto indexado con `item.tipo`): con
// una unión de 4 tipos de payload distintos, TS infiere la intersección de
// las 4 firmas al indexar dinámicamente, lo que rechaza cualquier payload
// real. El cast a `any` en el payload es deliberado y sigue el mismo patrón
// que config/bitacoras.ts: item.payload ya es el DTO completo tal como lo
// arma construirPayload(), solo tipado como Record<string, any> en la cola
// para poder compartir un único tipo entre las 4 bitácoras.
async function crearBitacoraReal(item: BitacoraPendiente, captacionGanadoId: string): Promise<void> {
  const payload: any = { ...item.payload, captacionGanadoId }
  switch (item.tipo) {
    case 'Pesaje':
      await pesajeApi.crear(payload)
      return
    case 'Sanitario':
      await sanitarioApi.crear(payload)
      return
    case 'Movimiento':
      await movimientosApi.crear(payload)
      return
    case 'Alimentacion':
      await alimentacionApi.crear(payload)
      return
  }
}

export interface ResultadoSincronizacion {
  sincronizados: number
  pendientes: number
  errores: number
}

function esBitacora(item: ItemCola): item is BitacoraPendiente {
  return item.tipo !== 'Estancia' && item.tipo !== 'Captacion'
}

function mensajeDeError(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Ocurrió un error inesperado al sincronizar.'
}

export async function sincronizarCola(): Promise<ResultadoSincronizacion> {
  const invitado = useInvitadoStore()
  let sincronizados = 0

  const estanciasPendientes = invitado.cola.filter((i): i is EstanciaPendiente => i.tipo === 'Estancia')
  for (const item of estanciasPendientes) {
    invitado.marcarEstado(item.tempId, 'sincronizando')
    try {
      const real = await estanciasApi.crear(item.payload)
      invitado.registrarIdReal(item.tempId, real.id)
      invitado.quitarDeCola(item.tempId)
      sincronizados++
    } catch (error) {
      invitado.marcarEstado(item.tempId, 'error', mensajeDeError(error))
    }
  }

  const captacionesPendientes = invitado.cola.filter((i): i is CaptacionPendiente => i.tipo === 'Captacion')
  for (const item of captacionesPendientes) {
    const estanciaIdReal = invitado.idRealDe(item.payload.estanciaId)
    if (!estanciaIdReal) continue // su Estancia padre todavía no sincronizó; queda pendiente para el próximo intento
    invitado.marcarEstado(item.tempId, 'sincronizando')
    try {
      const real = await captacionesApi.crear({ ...item.payload, estanciaId: estanciaIdReal })
      invitado.registrarIdReal(item.tempId, real.id)
      invitado.quitarDeCola(item.tempId)
      sincronizados++
    } catch (error) {
      invitado.marcarEstado(item.tempId, 'error', mensajeDeError(error))
    }
  }

  const bitacorasPendientes = invitado.cola.filter(esBitacora)
  for (const item of bitacorasPendientes) {
    const captacionIdReal = invitado.idRealDe(item.payload.captacionGanadoId)
    if (!captacionIdReal) continue // su Captación padre todavía no sincronizó; queda pendiente para el próximo intento
    invitado.marcarEstado(item.tempId, 'sincronizando')
    try {
      await crearBitacoraReal(item, captacionIdReal)
      invitado.quitarDeCola(item.tempId)
      sincronizados++
    } catch (error) {
      invitado.marcarEstado(item.tempId, 'error', mensajeDeError(error))
    }
  }

  return {
    sincronizados,
    pendientes: invitado.cola.filter((i) => i.estado !== 'error').length,
    errores: invitado.cola.filter((i) => i.estado === 'error').length,
  }
}
