<script setup lang="ts">
// Badge de EstadoSync, reutilizado en Estancias y (Etapa 4) en las 4
// bitácoras — todas comparten este mismo enum (sección 5.2 de la
// especificación: reutilizar componentes entre pantallas con patrón común).
import { EstadoSyncLabels, type EstadoSync } from '@/types/enums'

defineProps<{ estado: EstadoSync }>()

const estilos: Record<EstadoSync, string> = {
  Sincronizado: 'bg-primary/10 text-primary border-primary/20',
  Pendiente: 'bg-secondary-container/50 text-secondary border-secondary/20',
  Error: 'bg-error-container text-on-error-container border-error/20',
}

const puntoEstilos: Record<EstadoSync, string> = {
  Sincronizado: 'bg-primary',
  Pendiente: 'bg-secondary',
  Error: 'bg-error',
}
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-label-md text-label-md border whitespace-nowrap"
    :class="estilos[estado]"
  >
    <span class="w-2 h-2 rounded-full" :class="puntoEstilos[estado]" />
    {{ EstadoSyncLabels[estado] }}
  </span>
</template>
