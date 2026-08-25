<script setup lang="ts">
// Skeleton "con forma" de formulario (mejora #7) — insinúa pares label+campo
// en vez de un bloque gris sin estructura.
withDefaults(defineProps<{ campos?: number }>(), { campos: 4 })
</script>

<template>
  <div class="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-6 flex flex-col gap-stack-md">
    <div v-for="n in campos" :key="n" class="flex flex-col gap-2">
      <div class="h-2.5 w-24 rounded bg-surface-container-highest animate-pulse" />
      <div class="h-12 w-full rounded-lg bg-surface-container-high animate-pulse" />
    </div>
    <div class="h-12 w-full sm:w-40 rounded-lg bg-surface-container-highest animate-pulse mt-2" />
  </div>
</template>
