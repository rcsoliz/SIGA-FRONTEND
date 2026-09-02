import type { ItemCola, MapaIdsReales } from '@/types/invitado'

// Persistencia del modo invitado en localStorage. Mismo patrón que
// authStorage.ts: fuera de Pinia para poder leerse/escribirse desde
// cualquier módulo (invitadoApi.ts, sincronizacion.ts) sin acoplar al store.

const CLAVE_ACTIVO = 'siga.invitado.activo'
const CLAVE_COLA = 'siga.invitado.cola'
const CLAVE_MAPA_IDS = 'siga.invitado.mapaIds'

export function leerActivo(): boolean {
  return localStorage.getItem(CLAVE_ACTIVO) === 'true'
}

export function guardarActivo(activo: boolean): void {
  if (activo) localStorage.setItem(CLAVE_ACTIVO, 'true')
  else localStorage.removeItem(CLAVE_ACTIVO)
}

export function leerCola(): ItemCola[] {
  const raw = localStorage.getItem(CLAVE_COLA)
  if (!raw) return []
  try {
    return JSON.parse(raw) as ItemCola[]
  } catch {
    localStorage.removeItem(CLAVE_COLA)
    return []
  }
}

export function guardarCola(cola: ItemCola[]): void {
  localStorage.setItem(CLAVE_COLA, JSON.stringify(cola))
}

export function leerMapaIds(): MapaIdsReales {
  const raw = localStorage.getItem(CLAVE_MAPA_IDS)
  if (!raw) return {}
  try {
    return JSON.parse(raw) as MapaIdsReales
  } catch {
    localStorage.removeItem(CLAVE_MAPA_IDS)
    return {}
  }
}

export function guardarMapaIds(mapa: MapaIdsReales): void {
  localStorage.setItem(CLAVE_MAPA_IDS, JSON.stringify(mapa))
}
