<script setup lang="ts">
// Gráfica de barras mensual, una sola serie. El Dashboard original combinaba
// "Consumo Promedio" y "Peso Promedio" en un solo gráfico con dos escalas muy
// distintas (kg/animal/día vs kg totales) — la skill de dataviz lo marca como
// antipatrón ("Never a dual-axis chart... two measures of different scale ->
// two charts, small multiples"). Se separaron en dos MonthlyBarChart, cada
// una con su propio eje. Los meses sin dato (null) se muestran como hueco,
// no como barra en cero (sección 2.6 de la especificación: "cortar/saltar el
// punto, no mostrar 0").
import { computed, ref } from 'vue'

const props = defineProps<{
  titulo: string
  puntos: { mes: string; valor: number | null }[]
  color?: 'primary' | 'secondary'
  unidad?: string
}>()

// Rango de tiempo (patrón del mockup de referencia en Stitch): recorta la
// serie mensual ya cargada, sin pedir nada nuevo al backend.
const rango = ref<'1M' | '3M'>('3M')
const puntosVisibles = computed(() => props.puntos.slice(-(rango.value === '1M' ? 1 : 3)))

const max = computed(() => Math.max(1, ...puntosVisibles.value.map((p) => p.valor ?? 0)))

function etiquetaMes(mes: string): string {
  const [, m] = mes.split('-')
  const nombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  const idx = Number(m) - 1
  return nombres[idx] ?? mes
}

// Antes esta serie usaba bg-primary-container (un tinte diluido) mientras su
// gemela ("Peso Promedio") ya usaba bg-secondary a fuerza completa — misma
// jerarquía de dato, dos niveles de confianza de color distintos sin razón.
// Ambas usan ahora su color a fuerza completa (mejora #bolder Dashboard).
const barColor = computed(() => (props.color === 'secondary' ? 'bg-secondary' : 'bg-primary'))
</script>

<template>
  <div class="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-6">
    <div class="flex justify-between items-center mb-6">
      <h3 class="font-headline-md text-headline-md text-on-background">{{ titulo }}</h3>
      <div class="flex gap-2">
        <button
          type="button"
          title="Mostrar el último mes"
          class="px-3 py-1 rounded-full border font-body-md text-body-md transition-colors"
          :class="rango === '1M' ? 'bg-primary-container text-on-primary-container border-transparent' : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'"
          @click="rango = '1M'"
        >
          1M
        </button>
        <button
          type="button"
          title="Mostrar los últimos 3 meses"
          class="px-3 py-1 rounded-full border font-body-md text-body-md transition-colors"
          :class="rango === '3M' ? 'bg-primary-container text-on-primary-container border-transparent' : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'"
          @click="rango = '3M'"
        >
          3M
        </button>
      </div>
    </div>
    <div class="w-full h-48 bg-surface-container-low rounded-lg border border-outline-variant flex items-end px-4 pt-4 pb-8 gap-3 relative">
      <div v-for="p in puntosVisibles" :key="p.mes" class="flex-1 h-full flex flex-col items-center justify-end relative group">
        <template v-if="p.valor !== null">
          <div
            class="w-full max-w-[28px] rounded-t-sm transition-all duration-500"
            :class="barColor"
            :style="{ height: `${(p.valor / max) * 100}%` }"
          />
          <div
            class="absolute -top-8 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface font-label-md text-label-md px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10"
          >
            {{ p.valor.toLocaleString('es-BO') }}{{ unidad ?? '' }}
          </div>
        </template>
        <div v-else class="w-full max-w-[28px] h-[2px] bg-outline-variant/60 rounded-full mb-0" title="Sin datos este mes" />
        <span class="font-label-md text-label-md text-outline absolute -bottom-6">{{ etiquetaMes(p.mes) }}</span>
      </div>
    </div>
  </div>
</template>
