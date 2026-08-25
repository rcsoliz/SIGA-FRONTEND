<script setup lang="ts">
import { EstadoSanitarioLabels, type EstadoSanitario } from '@/types/enums'
import AppIcon, { type NombreIcono } from './AppIcon.vue'

defineProps<{ estado: EstadoSanitario }>()

const estilos: Record<EstadoSanitario, string> = {
  Optimo: 'bg-primary/10 text-primary border-primary/20',
  EnObservacion: 'bg-secondary-container/50 text-secondary border-secondary/20',
  Critico: 'bg-error-container text-on-error-container border-error/20',
}

const iconos: Record<EstadoSanitario, NombreIcono> = {
  Optimo: 'check_circle',
  EnObservacion: 'visibility',
  Critico: 'warning',
}
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-label-md text-label-md border whitespace-nowrap"
    :class="estilos[estado]"
  >
    <AppIcon :name="iconos[estado]" :size="14" />
    {{ EstadoSanitarioLabels[estado] }}
  </span>
</template>
