import { ref } from 'vue'

/** Estado de orden por columna para <DataTable> — un click ordena ascendente,
 * un segundo click en la misma columna invierte, y click en otra columna
 * reinicia a ascendente. Aplicar el orden real sobre los datos (antes de
 * paginar con usePaginacion) queda del lado de cada vista, vía `comparar`. */
export function useOrdenable(inicial: string | null = null) {
  const ordenarPor = ref<string | null>(inicial)
  const direccion = ref<'asc' | 'desc'>('asc')

  function alternar(clave: string) {
    if (ordenarPor.value === clave) {
      direccion.value = direccion.value === 'asc' ? 'desc' : 'asc'
    } else {
      ordenarPor.value = clave
      direccion.value = 'asc'
    }
  }

  function comparar<T>(a: T, b: T): number {
    if (!ordenarPor.value) return 0
    const clave = ordenarPor.value as keyof T
    const va = a[clave]
    const vb = b[clave]
    const signo = direccion.value === 'asc' ? 1 : -1
    if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * signo
    return String(va ?? '').localeCompare(String(vb ?? ''), 'es') * signo
  }

  return { ordenarPor, direccion, alternar, comparar }
}
