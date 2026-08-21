<script setup lang="ts">
import { EstadoSanitarioLabels, type EstadoSanitario } from '@/types/enums'

defineProps<{ estado: EstadoSanitario }>()

const estilos: Record<EstadoSanitario, string> = {
  Optimo: 'bg-primary/10 text-primary border-primary/20',
  EnObservacion: 'bg-secondary-container/50 text-secondary border-secondary/20',
  Critico: 'bg-error-container text-on-error-container border-error/20',
}

const iconos: Record<EstadoSanitario, string> = {
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
    <span class="material-symbols-outlined text-[16px] filled">{{ iconos[estado] }}</span>
    {{ EstadoSanitarioLabels[estado] }}
  </span>
</template>
