<script setup lang="ts">
defineProps<{ label: string; value: string; icon: string; hint?: string }>()
</script>

<template>
  <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm flex flex-col gap-2">
    <div class="flex items-center justify-between">
      <span class="font-body-md text-body-md text-on-surface-variant">{{ label }}</span>
      <span class="material-symbols-outlined text-primary p-2 bg-surface-container rounded-full">{{ icon }}</span>
    </div>
    <div class="font-headline-lg text-headline-lg text-on-background font-bold mt-2">{{ value }}</div>
    <p v-if="hint" class="font-label-md text-label-md text-outline mt-1">{{ hint }}</p>
  </div>
</template>
