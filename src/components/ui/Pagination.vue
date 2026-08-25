<script setup lang="ts">
import AppIcon from './AppIcon.vue'

const props = defineProps<{
  modelValue: number
  totalPaginas: number
  total?: number
  porPagina?: number
}>()

const emit = defineEmits<{ 'update:modelValue': [pagina: number] }>()

function ir(pagina: number) {
  const clamped = Math.min(Math.max(1, pagina), props.totalPaginas)
  if (clamped !== props.modelValue) emit('update:modelValue', clamped)
}
</script>

<template>
  <div v-if="totalPaginas > 1" class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
    <p
      v-if="total !== undefined && porPagina"
      class="font-label-md text-label-md text-on-surface-variant order-2 sm:order-1"
    >
      Mostrando {{ (modelValue - 1) * porPagina + 1 }}–{{ Math.min(modelValue * porPagina, total) }} de {{ total }}
    </p>
    <div class="flex items-center gap-2 order-1 sm:order-2 ml-auto sm:ml-0">
      <button
        type="button"
        :disabled="modelValue === 1"
        class="h-9 px-3 rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface font-label-md text-label-md flex items-center gap-1 hover:bg-surface-container-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        title="Página anterior"
        aria-label="Página anterior"
        @click="ir(modelValue - 1)"
      >
        <AppIcon name="chevron_left" :size="18" />
        <span class="hidden sm:inline">Anterior</span>
      </button>
      <span class="font-label-md text-label-md text-on-surface-variant px-1 whitespace-nowrap">
        Página {{ modelValue }} de {{ totalPaginas }}
      </span>
      <button
        type="button"
        :disabled="modelValue === totalPaginas"
        class="h-9 px-3 rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface font-label-md text-label-md flex items-center gap-1 hover:bg-surface-container-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        title="Página siguiente"
        aria-label="Página siguiente"
        @click="ir(modelValue + 1)"
      >
        <span class="hidden sm:inline">Siguiente</span>
        <AppIcon name="chevron_right" :size="18" />
      </button>
    </div>
  </div>
</template>
