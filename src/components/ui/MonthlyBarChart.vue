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
// Meses sin dato (valor: null): ver comentario de arriba — no dibujan barra,
// pero conservan su título en el eje X. Sin este set no queda ningún rastro
// de que ese mes existe y no es un glitch del gráfico.
const mesesSinDato = computed(() => new Set(puntosVisibles.value.filter((p) => p.valor === null).map((p) => p.idx)))

// Con 1 solo punto visible (rango "1M") [0, length - 1] degenera a [0, 0],
// que ya no colapsa el eje (a diferencia de BarChartHorizontal, acá el punto
// SÍ tiene ancho > 0 así que Unovis no truena) pero deja la barra pegada al
// borde izquierdo en vez de centrada — se centra el dominio en el único
// punto en ese caso.
const xDomain = computed<[number, number]>(() => {
  const n = puntosVisibles.value.length
  return n <= 1 ? [-0.5, 0.5] : [0, n - 1]
})

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
// var(--color-x) en vez de una var --chart-* nueva: una sola fuente de
// verdad de color (theme.css), igual que el resto del sistema de tokens.
// Sin el rgb() extra que usaba v3 — en v4 theme.css ya guarda cada
// --color-x como rgb(...) completo, y volver a envolverlo produce
// rgb(rgb(...)), un color inválido que Unovis resuelve a negro.
const colorCss = computed(() => (props.color === 'secondary' ? 'var(--color-secondary)' : 'var(--color-primary)'))

const chartConfig = computed<ChartConfig>(() => ({
  valor: { label: props.titulo, color: colorCss.value },
}))

function formatearValor(valor: number): string {
  return `${valor.toLocaleString('es-BO')}${props.unidad ?? ''}`
}

// componentToString() llama a useId() internamente y arma una key de caché a
// partir de ese id — si se invoca directo en el :template (cada render, p.
// ej. al tocar 1M/3M) genera un id nuevo cada vez y el Map de caché del
// módulo (chart/utils.ts) crece sin límite porque ninguna entrada vieja
// vuelve a pedirse. Envuelto en computed(), solo se re-evalúa cuando
// chartConfig cambia de verdad (prácticamente nunca tras el montaje), así
// que el id — y la caché — quedan estables para la vida del componente.
const plantillaTooltip = computed(() => componentToString(chartConfig.value, ChartTooltipContent, {
  labelFormatter: (x: number | Date) => etiquetaMes(puntosVisibles.value[x as number]?.mes),
  nameKey: 'valor',
  indicator: 'line',
  valueFormatter: formatearValor,
}))
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
      <div class="relative w-full h-48 bg-surface-container-low rounded-lg border border-outline-variant pt-4 pb-2 px-2">
        <ChartContainer :config="chartConfig" class="h-full w-full">
          <VisXYContainer
            :data="barras"
            :x-domain="xDomain"
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
              :template="plantillaTooltip"
              :color="[colorCss]"
            />
          </VisXYContainer>
        </ChartContainer>
        <!-- Meses sin dato: no dibujan barra (ver comentario en el script),
             pero dejan una marca en el eje para no verse como un glitch. -->
        <div class="pointer-events-none absolute inset-x-2 bottom-2 grid" :style="{ gridTemplateColumns: `repeat(${puntosVisibles.length}, 1fr)` }">
          <div v-for="p in puntosVisibles" :key="p.idx" class="flex justify-center">
            <div
              v-if="mesesSinDato.has(p.idx)"
              class="pointer-events-auto w-6 h-[2px] bg-outline-variant/60 rounded-full"
              title="Sin datos este mes"
            />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
