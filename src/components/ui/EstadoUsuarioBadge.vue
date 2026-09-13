<script setup lang="ts">
import { Badge, badgeVariantDotColor, type BadgeVariants } from '@/components/ui/badge'
import { EstadoUsuarioLabels, type EstadoUsuario } from '@/types/enums'

defineProps<{ estado: EstadoUsuario }>()

const variantes: Record<EstadoUsuario, NonNullable<BadgeVariants['variant']>> = {
  Activo: 'primary',
  Pendiente: 'secondary',
  Suspendido: 'destructive',
}
</script>

<template>
  <Badge :variant="variantes[estado]">
    <span class="w-2 h-2 rounded-full" :class="badgeVariantDotColor[variantes[estado]]" />
    {{ EstadoUsuarioLabels[estado] }}
  </Badge>
</template>
