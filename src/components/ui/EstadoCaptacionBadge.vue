<script setup lang="ts">
import { EstadoCaptacionLabels, type EstadoCaptacion } from '@/types/enums'
import AppIcon, { type NombreIcono } from './AppIcon.vue'

defineProps<{ estado: EstadoCaptacion }>()

const estilos: Record<EstadoCaptacion, string> = {
  BorradorLocal: 'bg-surface-container-highest text-on-surface-variant border-outline-variant',
  Registrado: 'bg-primary/10 text-primary border-primary/20',
  EnPlanificacionFaena: 'bg-secondary-container/50 text-secondary border-secondary/20',
  Procesado: 'bg-tertiary-container/40 text-tertiary border-tertiary/20',
}

// Ícono redundante por estado — sin esto, el estado solo se distinguía por
// color (hallazgo P1 de /impeccable critique 2026-08-22: la única de las 4
// familias de badge que no pareaba color con ícono/punto).
const iconos: Record<EstadoCaptacion, NombreIcono> = {
  BorradorLocal: 'edit',
  Registrado: 'check_circle',
  EnPlanificacionFaena: 'calendar_month',
  Procesado: 'task_alt',
}
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-label-md text-label-md border whitespace-nowrap"
    :class="estilos[estado]"
  >
    <AppIcon :name="iconos[estado]" :size="14" />
    {{ EstadoCaptacionLabels[estado] }}
  </span>
</template>
