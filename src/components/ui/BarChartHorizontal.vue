<script setup lang="ts">
// Gráfica de barras horizontales, un solo hue secuencial (magnitud por
// categoría) — ver skill de dataviz: "Sequential = one hue, light→dark".
// Una sola serie -> sin leyenda, el título del panel ya nombra la medida.
import { computed } from 'vue'

const props = defineProps<{ items: { label: string; value: number }[] }>()

const max = computed(() => Math.max(1, ...props.items.map((i) => i.value)))
</script>

<template>
  <div class="flex flex-col gap-4">
    <div v-for="item in items" :key="item.label" class="flex flex-col gap-1.5">
      <div class="flex justify-between items-end">
        <span class="font-body-md text-body-md text-on-surface">{{ item.label }}</span>
        <span class="font-label-md text-label-md text-on-surface-variant">{{ item.value.toLocaleString('es-BO') }}</span>
      </div>
      <div class="w-full bg-surface-container-highest rounded-full h-2" :title="`${item.label}: ${item.value}`">
        <div
          class="bg-primary-container h-2 rounded-full transition-all duration-500"
          :style="{ width: `${(item.value / max) * 100}%` }"
        />
      </div>
    </div>
  </div>
</template>
