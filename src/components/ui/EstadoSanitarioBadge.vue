<script setup lang="ts">
import { Badge, type BadgeVariants } from '@/components/ui/badge'
import { EstadoSanitarioLabels, type EstadoSanitario } from '@/types/enums'
import AppIcon, { type NombreIcono } from './AppIcon.vue'

defineProps<{ estado: EstadoSanitario }>()

const variantes: Record<EstadoSanitario, NonNullable<BadgeVariants['variant']>> = {
  Optimo: 'primary',
  EnObservacion: 'secondary',
  Critico: 'destructive',
}

const iconos: Record<EstadoSanitario, NombreIcono> = {
  Optimo: 'check_circle',
  EnObservacion: 'visibility',
  Critico: 'warning',
}
</script>

<template>
  <Badge :variant="variantes[estado]">
    <AppIcon :name="iconos[estado]" :size="14" />
    {{ EstadoSanitarioLabels[estado] }}
  </Badge>
</template>
