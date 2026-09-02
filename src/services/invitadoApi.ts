// Espejo local de api/estancias.ts, api/captaciones.ts y api/{pesaje,
// sanitario,movimientos,alimentacion}.ts para el modo invitado: misma firma
// de entrada/salida que las funciones reales, así cada punto de llamada en
// las vistas queda en un ternario de una línea sin reacomodar el payload.
// En vez de llamar al backend, cada crear* encola el payload completo (que
// ya trae el tempId del padre en su propio campo, ej. estanciaId) y devuelve
// sincrónicamente un DTO fabricado con estadoSync: 'Pendiente' — así
// SyncBadge y el resto de la UI funcionan sin ningún cambio.
import { useInvitadoStore } from '@/stores/invitado'
import type { TipoBitacora } from '@/config/bitacoras'
import type {
  CaptacionGanadoDto,
  CreateCaptacionGanadoDto,
  CreateEstanciaDto,
  DetalleLoteGanadoDto,
  EstanciaDto,
} from '@/types/dto'
import type { EstanciaPendiente, CaptacionPendiente, BitacoraPendiente } from '@/types/invitado'

function fabricarEstancia(tempId: string, payload: CreateEstanciaDto): EstanciaDto {
  return {
    id: tempId,
    nombre: payload.nombre,
    propietario: payload.propietario,
    representante: payload.representante ?? null,
    telefono: payload.telefono ?? null,
    latitud: payload.latitud,
    longitud: payload.longitud,
    renspa: payload.renspa ?? null,
    hectareasTotales: payload.hectareasTotales ?? null,
    departamento: payload.departamento ?? null,
    provincia: payload.provincia ?? null,
    municipio: payload.municipio ?? null,
    cantidadCaptaciones: 0,
    totalCabezas: 0,
    estadoSync: 'Pendiente',
  }
}

function fabricarCaptacion(tempId: string, payload: CreateCaptacionGanadoDto): CaptacionGanadoDto {
  const detalles: DetalleLoteGanadoDto[] = payload.detalles.map((d, indice) => ({
    id: `${tempId}-detalle-${indice}`,
    categoria: d.categoria,
    raza: d.raza ?? null,
    cantidadCabezas: d.cantidadCabezas,
    pesoPromedioEstimadoKg: d.pesoPromedioEstimadoKg ?? null,
    sistemaAlimentacion: d.sistemaAlimentacion,
    fechaEstimadaFaena: d.fechaEstimadaFaena ?? null,
    notasZootecnicas: d.notasZootecnicas ?? null,
    pesoLoteCalculado: d.cantidadCabezas * (d.pesoPromedioEstimadoKg ?? 0),
    diasRestantesFaena: null,
  }))
  const diasEnPotrero = Math.max(0, Math.floor((Date.now() - new Date(payload.fecha).getTime()) / 86_400_000))

  return {
    id: tempId,
    estanciaId: payload.estanciaId,
    nombre: payload.nombre,
    observaciones: payload.observaciones ?? null,
    estado: 'BorradorLocal',
    estadoSanitario: 'Optimo',
    potrero: payload.potrero ?? null,
    fecha: payload.fecha,
    latitud: payload.latitud ?? null,
    longitud: payload.longitud ?? null,
    estadoSync: 'Pendiente',
    totalCabezas: detalles.reduce((suma, d) => suma + d.cantidadCabezas, 0),
    pesoEstimadoTotal: detalles.reduce((suma, d) => suma + d.pesoLoteCalculado, 0),
    diasEnPotrero,
    detalles,
  }
}

function fabricarBitacora(tipo: TipoBitacora, tempId: string, payload: Record<string, any>): any {
  const base = { ...payload, id: tempId, estadoSync: 'Pendiente' as const }
  if (tipo === 'Sanitario') {
    return { ...base, registradoPorUsuarioId: 'invitado', registradoPorNombre: 'Invitado (pendiente de sincronizar)' }
  }
  return base
}

// --- Estancias ---

export async function crearEstanciaLocal(payload: CreateEstanciaDto): Promise<EstanciaDto> {
  const invitado = useInvitadoStore()
  const tempId = crypto.randomUUID()
  const item: EstanciaPendiente = { tempId, tipo: 'Estancia', estado: 'pendiente', creadoEn: new Date().toISOString(), payload }
  invitado.agregarACola(item)
  return fabricarEstancia(tempId, payload)
}

export async function listarEstanciasLocal(): Promise<EstanciaDto[]> {
  const invitado = useInvitadoStore()
  return invitado.cola
    .filter((item): item is EstanciaPendiente => item.tipo === 'Estancia')
    .map((item) => fabricarEstancia(item.tempId, item.payload))
}

export async function obtenerEstanciaLocal(tempId: string): Promise<EstanciaDto> {
  const lista = await listarEstanciasLocal()
  const encontrada = lista.find((e) => e.id === tempId)
  if (!encontrada) throw new Error('Estancia local no encontrada.')
  return encontrada
}

// --- Captaciones ---

export async function crearCaptacionLocal(payload: CreateCaptacionGanadoDto): Promise<CaptacionGanadoDto> {
  const invitado = useInvitadoStore()
  const tempId = crypto.randomUUID()
  const item: CaptacionPendiente = { tempId, tipo: 'Captacion', estado: 'pendiente', creadoEn: new Date().toISOString(), payload }
  invitado.agregarACola(item)
  return fabricarCaptacion(tempId, payload)
}

export async function listarCaptacionesLocalPorEstancia(estanciaTempId: string): Promise<CaptacionGanadoDto[]> {
  const invitado = useInvitadoStore()
  return invitado.cola
    .filter((item): item is CaptacionPendiente => item.tipo === 'Captacion' && item.payload.estanciaId === estanciaTempId)
    .map((item) => fabricarCaptacion(item.tempId, item.payload))
}

export async function obtenerCaptacionLocal(tempId: string): Promise<CaptacionGanadoDto> {
  const invitado = useInvitadoStore()
  const item = invitado.cola.find(
    (i): i is CaptacionPendiente => i.tipo === 'Captacion' && i.tempId === tempId,
  )
  if (!item) throw new Error('Captación local no encontrada.')
  return fabricarCaptacion(item.tempId, item.payload)
}

// --- Bitácoras ---

export async function crearBitacoraLocal(tipo: TipoBitacora, payload: Record<string, any>): Promise<any> {
  const invitado = useInvitadoStore()
  const tempId = crypto.randomUUID()
  const item: BitacoraPendiente = { tempId, tipo, estado: 'pendiente', creadoEn: new Date().toISOString(), payload }
  invitado.agregarACola(item)
  return fabricarBitacora(tipo, tempId, payload)
}

export async function listarBitacoraLocalPorCaptacion(tipo: TipoBitacora, captacionTempId: string): Promise<any[]> {
  const invitado = useInvitadoStore()
  return invitado.cola
    .filter((item): item is BitacoraPendiente => item.tipo === tipo && item.payload.captacionGanadoId === captacionTempId)
    .map((item) => fabricarBitacora(item.tipo, item.tempId, item.payload))
}
