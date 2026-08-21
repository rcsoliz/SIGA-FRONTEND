import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import * as authApi from '@/api/auth'
import { EVENTO_NO_AUTORIZADO } from '@/api/client'
import { guardarSesion, leerSesion, limpiarSesion, type SesionActiva } from '@/utils/authStorage'
import type { LoginRequestDto } from '@/types/dto'
import type { RolUsuario } from '@/types/enums'

export const useAuthStore = defineStore('auth', () => {
  const sesion = ref<SesionActiva | null>(leerSesion())
  let temporizadorExpiracion: ReturnType<typeof setTimeout> | null = null

  const estaAutenticado = computed(() => sesion.value !== null)
  const rol = computed<RolUsuario | null>(() => sesion.value?.rol ?? null)
  const nombre = computed(() => sesion.value?.nombre ?? null)
  const usuarioId = computed(() => sesion.value?.usuarioId ?? null)

  function programarExpiracion(expiraEnUtc: string) {
    if (temporizadorExpiracion) clearTimeout(temporizadorExpiracion)
    const msRestantes = new Date(expiraEnUtc).getTime() - Date.now()
    if (msRestantes <= 0) {
      cerrarSesion()
      return
    }
    temporizadorExpiracion = setTimeout(cerrarSesion, msRestantes)
  }

  async function iniciarSesion(credenciales: LoginRequestDto): Promise<void> {
    const respuesta = await authApi.login(credenciales)
    const nuevaSesion: SesionActiva = {
      token: respuesta.token,
      expiraEnUtc: respuesta.expiraEnUtc,
      usuarioId: respuesta.usuarioId,
      nombre: respuesta.nombre,
      rol: respuesta.rol,
    }
    guardarSesion(nuevaSesion)
    sesion.value = nuevaSesion
    programarExpiracion(nuevaSesion.expiraEnUtc)
  }

  function cerrarSesion(): void {
    if (temporizadorExpiracion) clearTimeout(temporizadorExpiracion)
    limpiarSesion()
    sesion.value = null
  }

  // Si la sesión ya existía en localStorage (recarga de página), reprogramar
  // su expiración; si ya expiró mientras la app estaba cerrada, limpiarla.
  if (sesion.value) {
    programarExpiracion(sesion.value.expiraEnUtc)
  }

  window.addEventListener(EVENTO_NO_AUTORIZADO, () => {
    cerrarSesion()
  })

  return { sesion, estaAutenticado, rol, nombre, usuarioId, iniciarSesion, cerrarSesion }
})
