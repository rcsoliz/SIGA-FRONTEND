<script setup lang="ts">
// Gráfica de barras mensual, una sola serie. El Dashboard original combinaba
// "Consumo Promedio" y "Peso Promedio" en un solo gráfico con dos escalas muy
// distintas (kg/animal/día vs kg totales) — la skill de dataviz lo marca como
// antipatrón ("Never a dual-axis chart... two measures of different scale ->
// two charts, small multiples"). Se separaron en dos MonthlyBarChart, cada
// una con su propio eje. Los meses sin dato (null) se muestran como hueco,
// no como barra en cero (sección 2.6 de la especificación: "cortar/saltar el
// punto, no mostrar 0") — por eso el índice original de cada punto viaja con
// el dato (`idx`) y se filtran los nulos SOLO para las barras, nunca para el
// eje X, que necesita las posiciones intactas para no correr el resto de las
// barras hacia el hueco.
import { computed, ref } from 'vue'
import { VisAxis, VisGroupedBar, VisXYContainer } from '@unovis/vue'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ChartContainer, ChartCrosshair, ChartTooltip, ChartTooltipContent, componentToString, type ChartConfig } from '@/components/ui/chart'

const props = defineProps<{
  titulo: string
  puntos: { mes: string; valor: number | null }[]
  color?: 'primary' | 'secondary'
  unidad?: string
}>()

interface PuntoIndexado { mes: string; valor: number | null; idx: number }

// Rango de tiempo (patrón del mockup de referencia en Stitch): recorta la
// serie mensual ya cargada, sin pedir nada nuevo al backend.
const rango = ref<'1M' | '3M'>('3M')
const puntosVisibles = computed<PuntoIndexado[]>(() =>
  props.puntos.slice(-(rango.value === '1M' ? 1 : 3)).map((p, idx) => ({ ...p, idx })),
)
const barras = computed(() => puntosVisibles.value.filter((p): p is PuntoIndexado & { valor: number } => p.valor !== null))

function etiquetaMes(mes: string | undefined): string {
  if (!mes) return ''
  const [, m] = mes.split('-')
  const nombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  const idx = Number(m) - 1
  return nombres[idx] ?? mes
}

// Antes esta serie usaba bg-primary-container (un tinte diluido) mientras su
// gemela ("Peso Promedio") ya usaba bg-secondary a fuerza completa — misma
// jerarquía de dato, dos niveles de confianza de color distintos sin razón.
// Ambas usan ahora su color a fuerza completa (mejora #bolder Dashboard).
// rgb(var(--color-x)) en vez de una var --chart-* nueva: una sola fuente de
// verdad de color (theme.css), igual que el resto del sistema de tokens.
const colorCss = computed(() => (props.color === 'secondary' ? 'rgb(var(--color-secondary))' : 'rgb(var(--color-primary))'))

const chartConfig = computed<ChartConfig>(() => ({
  valor: { label: props.titulo, color: colorCss.value },
}))

function formatearValor(valor: number): string {
  return `${valor.toLocaleString('es-BO')}${props.unidad ?? ''}`
}
</script>

<template>
  <Card>
    <CardHeader class="flex flex-row items-center justify-between">
      <CardTitle class="font-headline-md text-headline-md text-on-background">{{ titulo }}</CardTitle>
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
    </CardHeader>
    <CardContent>
      <div class="w-full h-48 bg-surface-container-low rounded-lg border border-outline-variant pt-4 pb-2 px-2">
        <ChartContainer :config="chartConfig" class="h-full w-full">
          <VisXYContainer
            :data="barras"
            :x-domain="[0, Math.max(1, puntosVisibles.length - 1)]"
          >
            <VisGroupedBar
              :x="(d: PuntoIndexado) => d.idx"
              :y="(d: PuntoIndexado) => d.valor"
              :color="colorCss"
              :rounded-corners="4"
              group-padding="0.35"
            />
            <VisAxis
              type="x"
              :tick-line="false"
              :domain-line="false"
              :grid-line="false"
              :tick-values="puntosVisibles.map((p) => p.idx)"
              :tick-format="(i: number) => etiquetaMes(puntosVisibles[i]?.mes)"
              tick-text-color="rgb(var(--color-outline))"
            />
            <ChartTooltip />
            <ChartCrosshair
              :x="(d: PuntoIndexado) => d.idx"
              :y="(d: PuntoIndexado) => d.valor"
              :template="componentToString(chartConfig, ChartTooltipContent, {
                labelFormatter: (x: number | Date) => etiquetaMes(puntosVisibles[x as number]?.mes),
                nameKey: 'valor',
                indicator: 'line',
                valueFormatter: formatearValor,
              })"
              :color="[colorCss]"
            />
          </VisXYContainer>
        </ChartContainer>
      </div>
    </CardContent>
  </Card>
</template>
