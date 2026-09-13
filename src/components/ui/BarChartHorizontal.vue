<script setup lang="ts">
// Gráfica de barras horizontales. Cada fila es una categoría distinta (no una
// secuencia/magnitud continua), así que un color por categoría es más
// correcto que un solo hue — referencia: mockup "Dashboard - Optimizado
// Final" en Stitch, actualizado con la paleta y degradados reales de Stitch
// SIGA V2 (projects/18430968925640713604). Se cicla por posición (no por
// nombre de categoría) para que el componente siga siendo genérico y no
// dependa de CategoriaGanado.
import { computed, useId } from 'vue'
import { VisAxis, VisGroupedBar, VisXYContainer } from '@unovis/vue'
import { ChartContainer, ChartCrosshair, ChartTooltip, type ChartConfig } from '@/components/ui/chart'

const props = defineProps<{ items: { label: string; value: number }[] }>()

// `pos` = posición original en `items` (0 = primero) — de ahí sale el color,
// así el ciclo de colores no cambia aunque se reordene la fila visualmente.
// `idx` = posición en el eje Y de Unovis, que crece hacia abajo — se invierte
// para que el primer item quede arriba (orden de lectura natural). Invertir
// el `y-domain` en vez del índice rompe el filtro interno de datos visibles
// de Unovis, que espera un dominio [min, max] ascendente.
interface ItemIndexado { label: string; value: number; pos: number; idx: number }

const itemsIndexados = computed<ItemIndexado[]>(() =>
  props.items.map((i, pos) => ({ ...i, pos, idx: props.items.length - 1 - pos })),
)
const max = computed(() => Math.max(1, ...props.items.map((i) => i.value)))
// Con 1 sola categoría (o ninguna) [0, length - 1] degenera a [0, 0] o
// [0, -1], que Unovis no puede escalar — se centra el dominio en torno al
// único punto en vez de anclarlo en 0, para no dejarlo pegado a un borde.
const yDomain = computed<[number, number]>(() => {
  const n = itemsIndexados.value.length
  return n <= 1 ? [-0.5, 0.5] : [0, n - 1]
})

// Degradado de 2 tonos por posición (Stitch usa un degradado distinto por
// barra, no un color plano) — la última posición ("otros") queda sólida en
// outline, igual que el mockup deja su última categoría en slate plano.
const idPrefix = `hbar-${useId().replace(/:/g, '')}`
const PARES_DEGRADADO: ([string, string] | null)[] = [
  ['var(--color-primary)', 'var(--color-primary-container)'],
  ['var(--color-primary-container)', 'var(--color-primary)'],
  ['var(--color-secondary)', 'var(--color-secondary-container)'],
  ['var(--color-tertiary)', 'var(--color-tertiary-container)'],
  null,
]
function colorDe(posicion: number): string {
  const par = PARES_DEGRADADO[posicion % PARES_DEGRADADO.length]
  return par ? `url(#${idPrefix}-${posicion % PARES_DEGRADADO.length})` : 'var(--color-outline)'
}
// Color plano equivalente (para el punto del tooltip, donde un degradado no
// se puede aplicar a un círculo de 10px de forma legible).
const colorPlanoDe = (posicion: number) => PARES_DEGRADADO[posicion % PARES_DEGRADADO.length]?.[0] ?? 'var(--color-outline)'

function etiquetaDe(idx: number): string {
  return itemsIndexados.value.find((i) => i.idx === idx)?.label ?? ''
}

const chartConfig = computed<ChartConfig>(() =>
  Object.fromEntries(itemsIndexados.value.map((i) => [i.label, { label: i.label, color: colorPlanoDe(i.pos) }])),
)

const altoChart = computed(() => Math.max(160, props.items.length * 40))

// Tooltip a mano en vez de ChartTooltipContent: ese componente empareja el
// payload por nombre de serie (ideal para series múltiples tipo
// desktop/mobile), pero acá hay una sola serie con un color distinto por
// categoría — no encaja en ese modelo, así que se arma el HTML directamente.
function plantillaTooltip(d: ItemIndexado): string {
  return `
    <div class="border-outline-variant bg-popover text-popover-foreground flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs shadow-lg">
      <span class="h-2.5 w-2.5 shrink-0 rounded-full" style="background:${colorPlanoDe(d.pos)}"></span>
      <span class="text-on-surface-variant">${d.label}</span>
      <span class="ml-auto font-mono font-medium text-on-surface">${d.value.toLocaleString('es-BO')}</span>
    </div>
  `
}
</script>

<template>
  <div class="w-full flex gap-1" :style="{ height: `${altoChart}px` }">
    <!-- defs de degradado — SVG "hueco" (0x0), solo para declarar los
    linearGradient que referencian las barras por id, vía fill: url(#...). -->
    <svg width="0" height="0" class="absolute">
      <defs>
        <linearGradient v-for="(par, i) in PARES_DEGRADADO" :key="i" :id="`${idPrefix}-${i}`" x1="0" y1="0" x2="1" y2="0">
          <stop v-if="par" offset="0%" :stop-color="par[0]" />
          <stop v-if="par" offset="100%" :stop-color="par[1]" />
        </linearGradient>
      </defs>
    </svg>
    <ChartContainer :config="chartConfig" class="h-full min-w-0 flex-1">
      <VisXYContainer :data="itemsIndexados" :x-domain="[0, max]" :y-domain="yDomain">
        <VisGroupedBar
          orientation="horizontal"
          :x="(d: ItemIndexado) => d.idx"
          :y="(d: ItemIndexado) => d.value"
          :color="(d: ItemIndexado) => colorDe(d.pos)"
          :rounded-corners="6"
          group-padding="0.4"
        />
        <VisAxis
          type="y"
          :tick-line="false"
          :domain-line="false"
          :grid-line="false"
          :tick-values="itemsIndexados.map((i) => i.idx)"
          :tick-format="etiquetaDe"
          tick-text-color="var(--color-on-surface)"
        />
        <ChartTooltip />
        <ChartCrosshair
          :x="(d: ItemIndexado) => d.idx"
          :y="(d: ItemIndexado) => d.value"
          :template="plantillaTooltip"
          :color="itemsIndexados.map((i) => colorPlanoDe(i.pos))"
        />
      </VisXYContainer>
    </ChartContainer>
    <!-- Valor siempre visible (no solo en el tooltip) — columna fija a la
    derecha en vez de escribirlo dentro de la barra: así no depende de
    conocer el ancho exacto en píxeles que Unovis calculó para cada barra. -->
    <div class="grid shrink-0 w-10" :style="{ gridTemplateRows: `repeat(${itemsIndexados.length}, 1fr)` }">
      <div v-for="item in items" :key="item.label" class="flex items-center justify-end">
        <span class="font-label-md text-label-md text-on-surface tabular-nums">{{ item.value.toLocaleString('es-BO') }}</span>
      </div>
    </div>
  </div>
</template>
