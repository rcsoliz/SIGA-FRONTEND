import type { RolUsuario } from '@/types/enums'

// Persistencia de sesión en localStorage. Vive fuera de stores/auth.ts para
// que src/api/client.ts pueda leer el token sin importar el store de Pinia
// (evita el ciclo client -> store -> client que se daría si el store llamara
// a la API a través del mismo cliente que necesita su token).

export interface SesionActiva {
  token: string
  expiraEnUtc: string
  usuarioId: string
  nombre: string
  rol: RolUsuario
}

const STORAGE_KEY = 'siga.sesion'

export function guardarSesion(sesion: SesionActiva): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sesion))
}

export function leerSesion(): SesionActiva | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as SesionActiva
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export function limpiarSesion(): void {
  localStorage.removeItem(STORAGE_KEY)
}
