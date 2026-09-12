<script setup lang="ts">
// Badge de EstadoSync, reutilizado en Estancias y (Etapa 4) en las 4
// bitácoras — todas comparten este mismo enum (sección 5.2 de la
// especificación: reutilizar componentes entre pantallas con patrón común).
import { Badge, type BadgeVariants } from '@/components/ui/badge'
import { EstadoSyncLabels, type EstadoSync } from '@/types/enums'

defineProps<{ estado: EstadoSync }>()

const variantes: Record<EstadoSync, NonNullable<BadgeVariants['variant']>> = {
  Sincronizado: 'primary',
  Pendiente: 'secondary',
  Error: 'destructive',
}

const puntoEstilos: Record<EstadoSync, string> = {
  Sincronizado: 'bg-primary',
  Pendiente: 'bg-secondary',
  Error: 'bg-error',
}
</script>

<template>
  <Badge :variant="variantes[estado]">
    <span class="w-2 h-2 rounded-full" :class="puntoEstilos[estado]" />
    {{ EstadoSyncLabels[estado] }}
  </Badge>
</template>
