<script setup lang="ts">
// Selector visual de tarjetas con ícono, fiel al patrón de "Categoría" y
// "Sistema de Alimentación" en el mockup de Registro de Captación — botones
// grandes y táctiles, en línea con el requisito base de "botones grandes
// para fácil uso en campo".
defineProps<{
  modelValue: string | null
  label: string
  options: { value: string; label: string; icon: string }[]
  columns?: string
}>()

defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <div class="flex flex-col gap-2">
    <label class="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">{{ label }}</label>
    <div class="grid gap-2 sm:gap-3" :class="columns ?? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5'">
      <button
        v-for="opt in options"
        :key="opt.value"
        type="button"
        class="relative border-2 rounded-lg p-3 flex flex-col items-center justify-center gap-1 h-24 transition-all active:scale-95"
        :class="
          modelValue === opt.value
            ? 'border-primary bg-primary-container/10 text-primary'
            : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
        "
        @click="$emit('update:modelValue', opt.value)"
      >
        <span v-if="modelValue === opt.value" class="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
          <span class="material-symbols-outlined text-on-primary text-[14px]">check</span>
        </span>
        <span class="material-symbols-outlined text-3xl">{{ opt.icon }}</span>
        <span class="font-label-md text-label-md text-center leading-tight">{{ opt.label }}</span>
      </button>
    </div>
  </div>
</template>
