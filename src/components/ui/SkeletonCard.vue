<script setup lang="ts">
// Skeleton "con forma" de tarjeta de listado (mejora #7) — mismo alto/bordes
// que las tarjetas reales de Estancias/Captaciones/Registros, insinuando
// dónde va el título, los chips y el badge de estado.
withDefaults(defineProps<{ cantidad?: number }>(), { cantidad: 3 })
</script>

<template>
  <div class="flex flex-col gap-gutter-mobile">
    <div
      v-for="n in cantidad"
      :key="n"
      class="bg-surface-container-lowest rounded-xl p-margin-mobile shadow-sm border border-surface-variant flex flex-col gap-stack-sm"
    >
      <div class="flex justify-between items-start">
        <div class="flex flex-col gap-2 flex-1">
          <div class="h-4 w-2/3 rounded bg-surface-container-high animate-pulse" />
          <div class="h-3 w-1/3 rounded bg-surface-container-high animate-pulse" />
        </div>
        <div class="h-6 w-16 rounded-full bg-surface-container-high animate-pulse" />
      </div>
      <div class="flex gap-2">
        <div class="h-5 w-20 rounded-md bg-surface-container-high animate-pulse" />
        <div class="h-5 w-20 rounded-md bg-surface-container-high animate-pulse" />
      </div>
    </div>
  </div>
</template>
