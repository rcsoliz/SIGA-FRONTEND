<script setup lang="ts">
// Composición del Hato (🔒 Administrador): cabezas agrupadas Raza -> Categoría
// -> Sistema de Alimentación, con filtro opcional por rango de Fecha Estimada
// de Faena. Mismo dato crudo que Planificación de Faena (CaptacionGanadoDto.
// detalles vía captacionesApi.listar(), sin filtro de Estancia) — el
// agrupado/subtotal es puro cálculo del frontend, no requiere nada nuevo del
// backend. Raza ya es una lista fija (CaptacionFormView.vue) así que agrupar
// por ese campo da grupos limpios, sin variantes de texto libre.
import { computed, onMounted, ref } from 'vue'
import autoTable from 'jspdf-autotable'
import AppShell from '@/components/layout/AppShell.vue'
import AlertBanner from '@/components/ui/AlertBanner.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import SkeletonTable from '@/components/ui/SkeletonTable.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { ApiError } from '@/api/client'
import * as captacionesApi from '@/api/captaciones'
import { crearDocumentoPdf, nombreArchivoPdf, ALTO_ENCABEZADO } from '@/utils/pdfReporte'
import { CategoriaGanadoLabels, TipoManejoAlimentarioLabels } from '@/types/enums'
import type { CategoriaGanado, TipoManejoAlimentario } from '@/types/enums'
import type { DetalleLoteGanadoDto } from '@/types/dto'

interface NodoAlimentacion {
  tipo: TipoManejoAlimentario
  cantidadCabezas: number
  pesoTotal: number
}
interface NodoCategoria {
  categoria: CategoriaGanado
  cantidadCabezas: number
  pesoTotal: number
  alimentaciones: NodoAlimentacion[]
}
interface NodoRaza {
  raza: string
  cantidadCabezas: number
  pesoTotal: number
  categorias: NodoCategoria[]
}

const cargando = ref(true)
const errorMensaje = ref<string | null>(null)
const detalles = ref<DetalleLoteGanadoDto[]>([])
const desde = ref('')
const hasta = ref('')

async function cargar() {
  cargando.value = true
  errorMensaje.value = null
  try {
    const captaciones = await captacionesApi.listar()
    detalles.value = captaciones.flatMap((c) => c.detalles)
  } catch (error) {
    errorMensaje.value = error instanceof ApiError ? error.message : 'Ocurrió un error inesperado.'
  } finally {
    cargando.value = false
  }
}
onMounted(cargar)

const detallesFiltrados = computed(() => {
  if (!desde.value && !hasta.value) return detalles.value
  const inicio = desde.value ? new Date(desde.value).getTime() : -Infinity
  const fin = hasta.value ? new Date(hasta.value).getTime() : Infinity
  return detalles.value.filter((d) => {
    if (!d.fechaEstimadaFaena) return false
    const t = new Date(d.fechaEstimadaFaena).getTime()
    return t >= inicio && t <= fin
  })
})

const filtroActivo = computed(() => Boolean(desde.value || hasta.value))
const sinFechaExcluidos = computed(() =>
  filtroActivo.value ? detalles.value.filter((d) => !d.fechaEstimadaFaena).length : 0,
)

const arbol = computed<NodoRaza[]>(() => {
  const porRaza = new Map<string, Map<CategoriaGanado, Map<TipoManejoAlimentario, { cabezas: number; peso: number }>>>()

  for (const d of detallesFiltrados.value) {
    const raza = d.raza ?? 'Sin especificar'
    if (!porRaza.has(raza)) porRaza.set(raza, new Map())
    const porCategoria = porRaza.get(raza)!

    if (!porCategoria.has(d.categoria)) porCategoria.set(d.categoria, new Map())
    const porAlimentacion = porCategoria.get(d.categoria)!

    const actual = porAlimentacion.get(d.sistemaAlimentacion) ?? { cabezas: 0, peso: 0 }
    actual.cabezas += d.cantidadCabezas
    actual.peso += d.pesoLoteCalculado
    porAlimentacion.set(d.sistemaAlimentacion, actual)
  }

  const razas: NodoRaza[] = []
  for (const [raza, porCategoria] of porRaza) {
    const categorias: NodoCategoria[] = []
    for (const [categoria, porAlimentacion] of porCategoria) {
      const alimentaciones: NodoAlimentacion[] = [...porAlimentacion.entries()].map(([tipo, v]) => ({
        tipo,
        cantidadCabezas: v.cabezas,
        pesoTotal: v.peso,
      }))
      alimentaciones.sort((a, b) => b.cantidadCabezas - a.cantidadCabezas)
      categorias.push({
        categoria,
        cantidadCabezas: alimentaciones.reduce((s, a) => s + a.cantidadCabezas, 0),
        pesoTotal: alimentaciones.reduce((s, a) => s + a.pesoTotal, 0),
        alimentaciones,
      })
    }
    categorias.sort((a, b) => b.cantidadCabezas - a.cantidadCabezas)
    razas.push({
      raza,
      cantidadCabezas: categorias.reduce((s, c) => s + c.cantidadCabezas, 0),
      pesoTotal: categorias.reduce((s, c) => s + c.pesoTotal, 0),
      categorias,
    })
  }
  razas.sort((a, b) => b.cantidadCabezas - a.cantidadCabezas)
  return razas
})

const totalCabezas = computed(() => arbol.value.reduce((s, r) => s + r.cantidadCabezas, 0))

function limpiarFiltro() {
  desde.value = ''
  hasta.value = ''
}

function exportarPdf() {
  const partesFiltro: string[] = []
  if (desde.value) partesFiltro.push(`faena desde ${desde.value}`)
  if (hasta.value) partesFiltro.push(`hasta ${hasta.value}`)
  const subtitulo = `${totalCabezas.value} cabezas${partesFiltro.length ? ` · ${partesFiltro.join(' · ')}` : ''}`

  const { doc, dibujarEncabezado, finalizarConPiePagina, guardar, opcionesTablaBase } = crearDocumentoPdf(
    'Composición del Hato',
    subtitulo,
  )
  dibujarEncabezado()

  const body: any[] = []
  for (const r of arbol.value) {
    body.push([
      { content: r.raza, styles: { fontStyle: 'bold' } },
      '',
      '',
      { content: String(r.cantidadCabezas), styles: { fontStyle: 'bold' } },
      { content: `${r.pesoTotal.toLocaleString('es-BO')} kg`, styles: { fontStyle: 'bold' } },
    ])
    for (const c of r.categorias) {
      for (const a of c.alimentaciones) {
        body.push([
          '',
          CategoriaGanadoLabels[c.categoria],
          TipoManejoAlimentarioLabels[a.tipo],
          String(a.cantidadCabezas),
          `${a.pesoTotal.toLocaleString('es-BO')} kg`,
        ])
      }
    }
  }

  autoTable(doc, {
    ...opcionesTablaBase,
    startY: ALTO_ENCABEZADO + 20,
    head: [['Raza', 'Categoría', 'Alimentación', 'Cabezas', 'Peso Total']],
    body,
  })

  finalizarConPiePagina()
  guardar(nombreArchivoPdf('composicion-del-hato'))
}
</script>

<template>
  <AppShell>
    <div class="p-stack-md md:p-stack-lg flex flex-col gap-stack-lg w-full">
      <div
        class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-container-lowest p-stack-md rounded-xl shadow-sm border border-outline-variant"
      >
        <div>
          <h1 class="font-headline-lg text-headline-lg text-on-surface font-bold">Composición del Hato</h1>
          <p class="font-body-md text-body-md text-on-surface-variant mt-1">
            Cabezas agrupadas por Raza, Categoría y Sistema de Alimentación.
          </p>
        </div>
        <BaseButton
          v-if="!cargando && arbol.length > 0"
          variant="secondary"
          size="sm"
          icon="download"
          :block="false"
          class="w-full sm:w-auto"
          @click="exportarPdf"
        >
          Exportar PDF
        </BaseButton>
      </div>

      <div class="flex flex-wrap items-center gap-2 bg-surface-container-lowest p-stack-md rounded-xl shadow-sm border border-outline-variant">
        <span class="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mr-1">
          Fecha estimada de faena
        </span>
        <input
          v-model="desde"
          type="date"
          class="h-10 px-3 rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface font-body-md text-body-md"
        />
        <span class="text-on-surface-variant font-body-md">—</span>
        <input
          v-model="hasta"
          type="date"
          class="h-10 px-3 rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface font-body-md text-body-md"
        />
        <button
          v-if="filtroActivo"
          type="button"
          class="text-primary font-label-md text-label-md hover:underline ml-1"
          @click="limpiarFiltro"
        >
          Limpiar Filtro
        </button>
      </div>

      <AlertBanner v-if="errorMensaje" variant="error">{{ errorMensaje }}</AlertBanner>
      <AlertBanner v-if="!cargando && filtroActivo && sinFechaExcluidos > 0" variant="info">
        {{ sinFechaExcluidos }} grupo{{ sinFechaExcluidos === 1 ? '' : 's' }} sin fecha estimada de faena quedaron
        fuera del filtro.
      </AlertBanner>

      <SkeletonTable v-if="cargando" :columnas="5" />

      <div
        v-else-if="arbol.length === 0"
        class="flex flex-col items-center justify-center gap-stack-sm py-16 bg-surface-container-lowest rounded-xl border border-outline-variant"
      >
        <AppIcon name="pie_chart" :size="44" class="text-outline-variant" />
        <p class="font-body-lg text-body-lg text-on-surface-variant">
          {{ filtroActivo ? 'No hay grupos con fecha estimada de faena en ese rango.' : 'No hay grupos animales registrados.' }}
        </p>
      </div>

      <div v-else class="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-surface-container-low border-b border-outline-variant">
                <th class="py-3 px-6 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Raza / Categoría / Alimentación</th>
                <th class="py-3 px-6 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-right">Cabezas</th>
                <th class="py-3 px-6 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-right">Peso Total</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant">
              <template v-for="r in arbol" :key="r.raza">
                <tr class="bg-primary-container/10">
                  <td class="py-3 px-6 font-body-lg text-body-lg font-bold text-on-surface">{{ r.raza }}</td>
                  <td class="py-3 px-6 font-body-lg text-body-lg font-bold text-on-surface text-right">{{ r.cantidadCabezas }}</td>
                  <td class="py-3 px-6 font-body-lg text-body-lg font-bold text-on-surface text-right">{{ r.pesoTotal.toLocaleString('es-BO') }} kg</td>
                </tr>
                <template v-for="c in r.categorias" :key="`${r.raza}-${c.categoria}`">
                  <tr
                    v-for="a in c.alimentaciones"
                    :key="`${r.raza}-${c.categoria}-${a.tipo}`"
                    class="hover:bg-surface-variant/50 transition-colors"
                  >
                    <td class="py-2.5 px-6 pl-12 font-body-md text-body-md text-on-surface-variant">
                      {{ CategoriaGanadoLabels[c.categoria] }} <span class="text-outline">·</span> {{ TipoManejoAlimentarioLabels[a.tipo] }}
                    </td>
                    <td class="py-2.5 px-6 font-body-md text-body-md text-on-surface text-right">{{ a.cantidadCabezas }}</td>
                    <td class="py-2.5 px-6 font-body-md text-body-md text-on-surface-variant text-right">{{ a.pesoTotal.toLocaleString('es-BO') }} kg</td>
                  </tr>
                </template>
              </template>
            </tbody>
            <tfoot>
              <tr class="bg-surface-container-low border-t-2 border-outline-variant">
                <td class="py-3 px-6 font-headline-md text-headline-md text-on-surface">Total</td>
                <td class="py-3 px-6 font-headline-md text-headline-md text-primary text-right">{{ totalCabezas }}</td>
                <td class="py-3 px-6"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  </AppShell>
</template>
