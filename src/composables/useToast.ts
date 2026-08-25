import { reactive } from 'vue'

export interface ToastItem {
  id: number
  mensaje: string
  variant: 'success' | 'error' | 'info'
}

// Estado module-level compartido a propósito (no un store de Pinia): así
// puede dispararse desde cualquier parte, incluyendo composables/stores que
// no son componentes (ej. el aviso de sesión expirada podría usarlo a
// futuro). ToastContainer.vue es el único lugar que lo renderiza.
const toasts = reactive<ToastItem[]>([])
let contador = 0

export function useToast() {
  function mostrar(mensaje: string, variant: ToastItem['variant'] = 'success', duracionMs = 3500) {
    const id = ++contador
    toasts.push({ id, mensaje, variant })
    setTimeout(() => quitar(id), duracionMs)
  }

  function quitar(id: number) {
    const idx = toasts.findIndex((t) => t.id === id)
    if (idx !== -1) toasts.splice(idx, 1)
  }

  return { toasts, mostrar, quitar }
}
