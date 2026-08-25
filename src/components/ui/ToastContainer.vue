<script setup lang="ts">
// Montado una sola vez en App.vue — renderiza cualquier toast disparado
// desde cualquier parte de la app vía useToast().mostrar(...).
import { useToast } from '@/composables/useToast'
import AppIcon from './AppIcon.vue'

const { toasts, quitar } = useToast()

const ICONOS = { success: 'check_circle', error: 'error', info: 'info' } as const
const ESTILOS = {
  success: 'bg-primary text-on-primary',
  error: 'bg-error text-on-error',
  info: 'bg-tertiary text-on-tertiary',
} as const
</script>

<template>
  <Teleport to="body">
    <div class="fixed z-[200] bottom-4 left-1/2 -translate-x-1/2 md:left-auto md:right-4 md:translate-x-0 flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm">
      <TransitionGroup name="toast">
        <div
          v-for="t in toasts"
          :key="t.id"
          class="flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg font-body-md text-body-md"
          :class="ESTILOS[t.variant]"
          role="status"
        >
          <span class="shrink-0 flex"><AppIcon :name="ICONOS[t.variant]" :size="20" /></span>
          <span class="flex-1">{{ t.mensaje }}</span>
          <button type="button" title="Cerrar" aria-label="Cerrar" class="shrink-0 opacity-80 hover:opacity-100" @click="quitar(t.id)">
            <AppIcon name="close" :size="18" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
