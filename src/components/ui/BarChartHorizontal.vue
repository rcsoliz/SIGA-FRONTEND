<script setup lang="ts">
// Gráfica de barras horizontales. Cada fila es una categoría distinta (no una
// secuencia/magnitud continua), así que un color por categoría es más
// correcto que un solo hue — referencia: mockup "Dashboard - Optimizado
// Final" en Stitch. Se cicla por posición (no por nombre de categoría) para
// que el componente siga siendo genérico y no dependa de CategoriaGanado.
import { computed } from 'vue'

const props = defineProps<{ items: { label: string; value: number }[] }>()

const max = computed(() => Math.max(1, ...props.items.map((i) => i.value)))

const COLORES = ['bg-primary', 'bg-primary-container', 'bg-secondary', 'bg-tertiary', 'bg-outline']
function colorDe(indice: number): string {
  return COLORES[indice % COLORES.length]
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div v-for="(item, indice) in items" :key="item.label" class="flex flex-col gap-1.5">
      <div class="flex justify-between items-end">
        <span class="font-body-md text-body-md text-on-surface">{{ item.label }}</span>
        <span class="font-label-md text-label-md text-on-surface-variant">{{ item.value.toLocaleString('es-BO') }}</span>
      </div>
      <div class="w-full bg-surface-container-highest rounded-full h-3" :title="`${item.label}: ${item.value}`">
        <div
          class="h-3 rounded-full transition-all duration-500"
          :class="colorDe(indice)"
          :style="{ width: `${(item.value / max) * 100}%` }"
        />
      </div>
    </div>
  </div>
</template>
