<script setup lang="ts">
// Skeleton "con forma" de tabla (mejora #7 de docs/mejoras-frontend.md) —
// insinúa columnas y filas reales en vez de un bloque gris genérico.
withDefaults(defineProps<{ filas?: number; columnas?: number }>(), { filas: 5, columnas: 5 })
</script>

<template>
  <div class="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
    <div class="flex items-center gap-6 p-4 bg-surface-container-low border-b border-outline-variant">
      <div v-for="c in columnas" :key="c" class="h-3 rounded bg-surface-container-highest animate-pulse" :style="{ width: c === 1 ? '30%' : '15%' }" />
    </div>
    <div v-for="f in filas" :key="f" class="flex items-center gap-6 p-4" :class="f < filas ? 'border-b border-outline-variant' : ''">
      <div class="flex items-center gap-3" style="width: 30%">
        <div class="w-9 h-9 rounded-lg bg-surface-container-high animate-pulse shrink-0" />
        <div class="h-3 rounded bg-surface-container-high animate-pulse w-full" />
      </div>
      <div v-for="c in columnas - 1" :key="c" class="h-3 rounded bg-surface-container-high animate-pulse" style="width: 15%" />
    </div>
  </div>
</template>
