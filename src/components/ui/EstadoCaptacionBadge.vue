<script setup lang="ts">
import { EstadoCaptacionLabels, type EstadoCaptacion } from '@/types/enums'

defineProps<{ estado: EstadoCaptacion }>()

const estilos: Record<EstadoCaptacion, string> = {
  BorradorLocal: 'bg-surface-container-highest text-on-surface-variant border-outline-variant',
  Registrado: 'bg-primary/10 text-primary border-primary/20',
  EnPlanificacionFaena: 'bg-secondary-container/50 text-secondary border-secondary/20',
  Procesado: 'bg-tertiary-container/40 text-tertiary border-tertiary/20',
}
</script>

<template>
  <span
    class="inline-flex items-center px-3 py-1 rounded-full font-label-md text-label-md border whitespace-nowrap"
    :class="estilos[estado]"
  >
    {{ EstadoCaptacionLabels[estado] }}
  </span>
</template>
