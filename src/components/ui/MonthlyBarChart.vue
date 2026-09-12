<script setup lang="ts">
// Gráfica mensual, una sola serie — puede dibujarse como columnas ("Peso
// Promedio") o como área/línea suave ("Consumo Promedio"), según Stitch SIGA
// V2 (projects/18430968925640713604): ese mockup usa dos lenguajes visuales
// distintos para las dos métricas del Dashboard, no el mismo gráfico de
// barras repetido dos veces. El Dashboard original combinaba ambas métricas
// en un solo gráfico con dos escalas muy distintas (kg/animal/día vs kg
// totales) — la skill de dataviz lo marca como antipatrón ("Never a
// dual-axis chart... two measures of different scale -> two charts, small
// multiples"), por eso siguen siendo dos instancias de este componente, cada
// una con su propio eje. Los meses sin dato (null) se muestran como hueco,
// no como barra/punto en cero (sección 2.6 de la especificación:
// "cortar/saltar el punto, no mostrar 0") — por eso el índice original de
// cada punto viaja con el dato (`idx`) y se filtran los nulos SOLO para los
// puntos dibujados, nunca para el eje X, que necesita las posiciones
// intactas para no correr el resto de los datos hacia el hueco.
import { computed, ref, useId } from 'vue'
import { VisArea, VisAxis, VisGroupedBar, VisScatter, VisXYContainer } from '@unovis/vue'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ChartContainer, ChartCrosshair, ChartTooltip, ChartTooltipContent, componentToString, type ChartConfig } from '@/components/ui/chart'

const props = withDefaults(defineProps<{
  titulo: string
  puntos: { mes: string; valor: number | null }[]
  color?: 'primary' | 'secondary'
  unidad?: string
  /** "columna" (por defecto) o "area" — Stitch usa área para Consumo
   * Promedio y columnas con degradado para Peso Promedio. */
  variante?: 'columna' | 'area'
}>(), {
  variante: 'columna',
})

interface PuntoIndexado { mes: string; valor: number | null; idx: number }

// Rango de tiempo (patrón del mockup de referencia en Stitch): recorta la
// serie mensual ya cargada, sin pedir nada nuevo al backend.
const rango = ref<'1M' | '3M'>('3M')
const puntosVisibles = computed<PuntoIndexado[]>(() =>
  props.puntos.slice(-(rango.value === '1M' ? 1 : 3)).map((p, idx) => ({ ...p, idx })),
)
const barras = computed(() => puntosVisibles.value.filter((p): p is PuntoIndexado & { valor: number } => p.valor !== null))
// Meses sin dato (valor: null): ver comentario de arriba — no dibujan
// barra/punto, pero conservan su título en el eje X. Sin este set no queda
// ningún rastro de que ese mes existe y no es un glitch del gráfico.
const mesesSinDato = computed(() => new Set(puntosVisibles.value.filter((p) => p.valor === null).map((p) => p.idx)))
const max = computed(() => Math.max(1, ...barras.value.map((p) => p.valor)))

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
const colorContainerCss = computed(() => (props.color === 'secondary' ? 'var(--color-secondary-container)' : 'var(--color-primary-container)'))

const idPrefix = `mchart-${useId().replace(/:/g, '')}`

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

// Posición del valor "siempre visible" sobre cada columna (variante
// "columna" únicamente) — mismo porcentaje que usa la escala Y real
// (y-domain fijado a [0, max] más abajo), así el label queda pegado al
// extremo de la barra sin depender de leer coordenadas internas de Unovis.
function porcentajeDesdeArriba(valor: number): number {
  return 100 - (valor / max.value) * 100
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
      <div class="relative w-full h-48 bg-surface-container-low rounded-lg border border-outline-variant pt-4 pb-2 px-2">
        <!-- Líneas de grilla punteadas: en el HTML real de Stitch esto tampoco
        es nativo de la librería de gráficos, son 3 divs con borde punteado
        distribuidos con flex — se replica igual acá, sin pelear con la API
        de ejes de Unovis para lograr un guionado que no expone. -->
        <div class="pointer-events-none absolute inset-x-2 top-4 bottom-8 flex flex-col justify-between opacity-40">
          <div class="h-0 w-full border-b border-dashed border-outline-variant" />
          <div class="h-0 w-full border-b border-dashed border-outline-variant" />
          <div class="h-0 w-full border-b border-dashed border-outline-variant" />
        </div>

        <!-- Degradados: uno para el relleno del área, otro para las columnas
        (de abajo hacia arriba, tono contenedor -> tono a toda fuerza, igual
        que el "from-amber-700 to-amber-500" del mockup). -->
        <svg width="0" height="0" class="absolute">
          <defs>
            <linearGradient :id="`${idPrefix}-area`" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" :stop-color="colorCss" stop-opacity="0.55" />
              <stop offset="60%" :stop-color="colorContainerCss" stop-opacity="0.25" />
              <stop offset="100%" :stop-color="colorContainerCss" stop-opacity="0" />
            </linearGradient>
            <linearGradient :id="`${idPrefix}-bar`" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" :stop-color="colorContainerCss" />
              <stop offset="100%" :stop-color="colorCss" />
            </linearGradient>
          </defs>
        </svg>

        <ChartContainer :config="chartConfig" class="relative h-full w-full">
          <VisXYContainer :data="barras" :x-domain="xDomain" :y-domain="[0, max]">
            <template v-if="variante === 'area'">
              <VisArea
                :x="(d: PuntoIndexado) => d.idx"
                :y="(d: PuntoIndexado) => d.valor"
                :color="() => `url(#${idPrefix}-area)`"
                :line="true"
                :line-color="() => colorCss"
                :line-width="3"
              />
              <VisScatter
                :x="(d: PuntoIndexado) => d.idx"
                :y="(d: PuntoIndexado) => d.valor"
                :color="colorCss"
                stroke-color="var(--color-surface-container-low)"
                :stroke-width="2.5"
                :size="9"
              />
            </template>
            <VisGroupedBar
              v-else
              :x="(d: PuntoIndexado) => d.idx"
              :y="(d: PuntoIndexado) => d.valor"
              :color="() => `url(#${idPrefix}-bar)`"
              :rounded-corners="8"
              group-padding="0.35"
            />
            <VisAxis
              type="x"
              :tick-line="false"
              :domain-line="false"
              :grid-line="false"
              :tick-values="puntosVisibles.map((p) => p.idx)"
              :tick-format="(i: number) => etiquetaMes(puntosVisibles[i]?.mes)"
              tick-text-color="var(--color-outline)"
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

        <!-- Valor siempre visible sobre cada columna (no solo en el tooltip) —
        solo en la variante de columnas; el área usa los puntos + tooltip. -->
        <div
          v-if="variante === 'columna'"
          class="pointer-events-none absolute inset-x-2 top-4 bottom-8 grid"
          :style="{ gridTemplateColumns: `repeat(${puntosVisibles.length}, 1fr)` }"
        >
          <div v-for="p in puntosVisibles" :key="p.idx" class="relative">
            <span
              v-if="p.valor !== null"
              class="absolute left-1/2 -translate-x-1/2 font-label-md text-label-md whitespace-nowrap"
              :class="props.color === 'secondary' ? 'text-secondary' : 'text-primary'"
              :style="{ top: `calc(${porcentajeDesdeArriba(p.valor)}% - 20px)` }"
            >
              {{ formatearValor(p.valor) }}
            </span>
          </div>
        </div>

        <!-- Meses sin dato: no dibujan barra/punto (ver comentario en el
        script). En columnas se marca con una cajita punteada (placeholder de
        "proyección/futuro", igual que Stitch); en área, una rayita en el eje
        basta porque la curva ya salta visualmente ese mes. -->
        <div
          v-if="variante === 'columna'"
          class="pointer-events-none absolute inset-x-2 top-4 bottom-8 grid items-end"
          :style="{ gridTemplateColumns: `repeat(${puntosVisibles.length}, 1fr)` }"
        >
          <div v-for="p in puntosVisibles" :key="p.idx" class="flex justify-center">
            <div
              v-if="mesesSinDato.has(p.idx)"
              class="h-[12%] w-full max-w-[28px] rounded-t-lg border-2 border-dashed border-outline-variant bg-surface-container-highest/40"
              title="Sin datos este mes"
            />
          </div>
        </div>
        <div class="pointer-events-none absolute inset-x-2 bottom-2 grid" :style="{ gridTemplateColumns: `repeat(${puntosVisibles.length}, 1fr)` }">
          <div v-for="p in puntosVisibles" :key="p.idx" class="flex justify-center">
            <div
              v-if="mesesSinDato.has(p.idx) && variante === 'area'"
              class="pointer-events-auto w-6 h-[2px] bg-outline-variant/60 rounded-full"
              title="Sin datos este mes"
            />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
