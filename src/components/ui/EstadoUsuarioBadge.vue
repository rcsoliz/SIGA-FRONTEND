<script setup lang="ts">
import { EstadoUsuarioLabels, type EstadoUsuario } from '@/types/enums'

defineProps<{ estado: EstadoUsuario }>()

const estilos: Record<EstadoUsuario, string> = {
  Activo: 'bg-primary/10 text-primary border-primary/20',
  Pendiente: 'bg-secondary-container/50 text-secondary border-secondary/20',
  Suspendido: 'bg-error-container text-on-error-container border-error/20',
}
</script>

<template>
  <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-label-md text-label-md border whitespace-nowrap" :class="estilos[estado]">
    <span class="w-2 h-2 rounded-full" :class="estado === 'Activo' ? 'bg-primary' : estado === 'Pendiente' ? 'bg-secondary' : 'bg-error'" />
    {{ EstadoUsuarioLabels[estado] }}
  </span>
</template>
