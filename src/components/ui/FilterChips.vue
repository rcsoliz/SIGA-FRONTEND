<script setup lang="ts" generic="V extends string">
// Filtro rápido de un solo valor (Plan "AgroField Listas", Opción A/B) — un
// complemento liviano al buscador de texto para las vistas de listado que
// hoy no tienen ningún filtro por estado (Estancias, Usuarios). Las vistas
// que ya traen su propia barra de filtros (Registros, Auditoría, Ranking)
// no lo necesitan.
// Genérico en V (ej. '' | EstadoSync) para que el v-model del caller no
// pierda el tipo angosto del enum al pasar por este componente.
defineProps<{ opciones: { valor: V; etiqueta: string }[]; modelValue: V }>()
defineEmits<{ 'update:modelValue': [valor: V] }>()
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <button
      v-for="op in opciones"
      :key="op.valor"
      type="button"
      class="font-label-md text-label-md px-3 py-1.5 rounded-full border transition-colors"
      :class="
        modelValue === op.valor
          ? 'bg-primary-container/30 border-transparent text-primary'
          : 'bg-surface-container-lowest border-outline-variant text-on-surface-variant hover:bg-surface-container-low'
      "
      @click="$emit('update:modelValue', op.valor)"
    >
      {{ op.etiqueta }}
    </button>
  </div>
</template>
