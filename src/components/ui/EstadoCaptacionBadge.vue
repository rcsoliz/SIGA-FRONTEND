<script setup lang="ts">
import { Badge, type BadgeVariants } from '@/components/ui/badge'
import { EstadoCaptacionLabels, type EstadoCaptacion } from '@/types/enums'
import AppIcon, { type NombreIcono } from './AppIcon.vue'

defineProps<{ estado: EstadoCaptacion }>()

const variantes: Record<EstadoCaptacion, NonNullable<BadgeVariants['variant']>> = {
  BorradorLocal: 'neutral',
  Registrado: 'primary',
  EnPlanificacionFaena: 'secondary',
  Procesado: 'tertiary',
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
  <Badge :variant="variantes[estado]">
    <AppIcon :name="iconos[estado]" :size="14" />
    {{ EstadoCaptacionLabels[estado] }}
  </Badge>
</template>
