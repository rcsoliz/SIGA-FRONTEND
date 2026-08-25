import { computed, ref, watch, type Ref } from 'vue'

/** Paginación client-side sobre una lista ya cargada (sección "mejora #12" de
 * docs/mejoras-frontend.md) — el backend no expone parámetros de página, así
 * que esto solo recorta lo que ya se trajo, no reduce el tráfico de red. */
export function usePaginacion<T>(items: Ref<T[]>, porPagina = 8) {
  const paginaActual = ref(1)

  watch(
    () => items.value.length,
    () => {
      paginaActual.value = 1
    },
  )

  const totalPaginas = computed(() => Math.max(1, Math.ceil(items.value.length / porPagina)))

  const itemsPagina = computed(() => {
    const inicio = (paginaActual.value - 1) * porPagina
    return items.value.slice(inicio, inicio + porPagina)
  })

  return { paginaActual, totalPaginas, itemsPagina, porPagina }
}
