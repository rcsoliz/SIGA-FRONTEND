import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  guardarActivo,
  guardarCola,
  guardarMapaIds,
  leerActivo,
  leerCola,
  leerMapaIds,
} from '@/utils/invitadoStorage'
import type { ItemCola, MapaIdsReales } from '@/types/invitado'

// Eje ortogonal a auth.ts: auth.estaAutenticado/auth.rol deben seguir
// significando "sesión real" sin excepciones (guard de rutas, inyección del
// Bearer token en api/client.ts, listener de 401). El invitado no es una
// sesión falsa, es un modo aparte que el router y AppShell consultan por
// separado.
export const useInvitadoStore = defineStore('invitado', () => {
  const activo = ref(leerActivo())
  const cola = ref<ItemCola[]>(leerCola())
  const mapaIds = ref<MapaIdsReales>(leerMapaIds())

  const pendientes = computed(() => cola.value.length)
  const tienePendientes = computed(() => cola.value.length > 0)
  const tieneErrores = computed(() => cola.value.some((item) => item.estado === 'error'))

  function iniciar() {
    activo.value = true
    guardarActivo(true)
  }

  /** No borra la cola — solo deja de estar en modo invitado (ej. al lograr un
   * login real). Lo pendiente se sigue mostrando ya autenticado. */
  function salir() {
    activo.value = false
    guardarActivo(false)
  }

  function agregarACola(item: ItemCola) {
    cola.value = [...cola.value, item]
    guardarCola(cola.value)
  }

  function quitarDeCola(tempId: string) {
    cola.value = cola.value.filter((item) => item.tempId !== tempId)
    guardarCola(cola.value)
  }

  function marcarEstado(tempId: string, estado: ItemCola['estado'], errorSync?: string) {
    cola.value = cola.value.map((item) => (item.tempId === tempId ? { ...item, estado, errorSync } : item))
    guardarCola(cola.value)
  }

  function registrarIdReal(tempId: string, idReal: string) {
    mapaIds.value = { ...mapaIds.value, [tempId]: idReal }
    guardarMapaIds(mapaIds.value)
  }

  function idRealDe(tempId: string): string | undefined {
    return mapaIds.value[tempId]
  }

  return {
    activo,
    cola,
    mapaIds,
    pendientes,
    tienePendientes,
    tieneErrores,
    iniciar,
    salir,
    agregarACola,
    quitarDeCola,
    marcarEstado,
    registrarIdReal,
    idRealDe,
  }
})
