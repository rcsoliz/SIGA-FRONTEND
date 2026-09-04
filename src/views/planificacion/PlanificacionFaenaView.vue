<script setup lang="ts">
// "Cuándo estarán listas las reses para salir al mercado" (pedido directo del
// Administrador): fechaEstimadaFaena ya viaja en CaptacionGanadoDto.detalles,
// así que se arma la vista con dos llamadas en paralelo — todas las Estancias
// (para el nombre) y todas las Captaciones vía captacionesApi.listar(), que
// devuelve las de TODAS las Estancias en una sola llamada (estanciaId es
// opcional en el backend) — y aplanando los detalles con fecha estimada.
// "Días restantes" se calcula acá mismo con una resta de fechas — el backend
// ya lo manda como diasRestantesFaena pero recalcularlo es trivial y evita
// depender de un campo que cambia de valor cada día sin que el registro se
// haya tocado.
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import autoTable from 'jspdf-autotable'
import AppShell from '@/components/layout/AppShell.vue'
import AlertBanner from '@/components/ui/AlertBanner.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import SkeletonTable from '@/components/ui/SkeletonTable.vue'
import SkeletonCard from '@/components/ui/SkeletonCard.vue'
import Pagination from '@/components/ui/Pagination.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { usePaginacion } from '@/composables/usePaginacion'
import { ApiError } from '@/api/client'
import * as estanciasApi from '@/api/estancias'
import * as captacionesApi from '@/api/captaciones'
import { crearDocumentoPdf, nombreArchivoPdf, ALTO_ENCABEZADO } from '@/utils/pdfReporte'
import { CategoriaGanadoLabels } from '@/types/enums'
import type { CategoriaGanado } from '@/types/enums'

interface LoteProximo {
  estanciaId: string
  estanciaNombre: string
  captacionId: string
  captacionNombre: string
  categoria: CategoriaGanado
  raza: string | null
  cantidadCabezas: number
  fechaEstimadaFaena: string
  diasRestantes: number
}

const cargando = ref(true)
const errorMensaje = ref<string | null>(null)
const lotes = ref<LoteProximo[]>([])
const lotesSinFecha = ref(0)
const busqueda = ref('')

function diasRestantesDe(fechaIso: string): number {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const fecha = new Date(fechaIso)
  fecha.setHours(0, 0, 0, 0)
  return Math.round((fecha.getTime() - hoy.getTime()) / 86_400_000)
}

async function cargar() {
  cargando.value = true
  errorMensaje.value = null
  try {
    const [estancias, captaciones] = await Promise.all([estanciasApi.listar(), captacionesApi.listar()])
    const nombreEstanciaPorId = new Map(estancias.map((e) => [e.id, e.nombre]))

    const filas: LoteProximo[] = []
    let sinFecha = 0
    for (const captacion of captaciones) {
      for (const detalle of captacion.detalles) {
        if (!detalle.fechaEstimadaFaena) {
          sinFecha++
          continue
        }
        filas.push({
          estanciaId: captacion.estanciaId,
          estanciaNombre: nombreEstanciaPorId.get(captacion.estanciaId) ?? '—',
          captacionId: captacion.id,
          captacionNombre: captacion.nombre,
          categoria: detalle.categoria,
          raza: detalle.raza,
          cantidadCabezas: detalle.cantidadCabezas,
          fechaEstimadaFaena: detalle.fechaEstimadaFaena,
          diasRestantes: diasRestantesDe(detalle.fechaEstimadaFaena),
        })
      }
    }
    filas.sort((a, b) => a.diasRestantes - b.diasRestantes)
    lotes.value = filas
    lotesSinFecha.value = sinFecha
  } catch (error) {
    errorMensaje.value = error instanceof ApiError ? error.message : 'Ocurrió un error inesperado.'
  } finally {
    cargando.value = false
  }
}
onMounted(cargar)

const lotesFiltrados = computed(() => {
  const termino = busqueda.value.trim().toLowerCase()
  if (!termino) return lotes.value
  return lotes.value.filter(
    (l) =>
      l.estanciaNombre.toLowerCase().includes(termino) ||
      l.captacionNombre.toLowerCase().includes(termino) ||
      (l.raza ?? '').toLowerCase().includes(termino),
  )
})

const { paginaActual, totalPaginas, itemsPagina, porPagina } = usePaginacion(lotesFiltrados, 8)

function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-BO', { year: 'numeric', month: 'short', day: 'numeric' })
}

type Urgencia = 'vencido' | 'proximo' | 'normal'

function urgenciaDe(dias: number): Urgencia {
  if (dias < 0) return 'vencido'
  if (dias <= 15) return 'proximo'
  return 'normal'
}

const estilosUrgencia: Record<Urgencia, string> = {
  vencido: 'bg-error-container text-on-error-container border-error/20',
  proximo: 'bg-secondary-container/50 text-secondary border-secondary/20',
  normal: 'bg-primary/10 text-primary border-primary/20',
}

function textoUrgencia(dias: number): string {
  if (dias < 0) return `Vencido hace ${Math.abs(dias)} día${Math.abs(dias) === 1 ? '' : 's'}`
  if (dias === 0) return 'Hoy'
  return `En ${dias} día${dias === 1 ? '' : 's'}`
}

function exportarPdf() {
  const filas = lotesFiltrados.value
  const subtitulo = `${filas.length} lote${filas.length === 1 ? '' : 's'}${busqueda.value ? ` · filtro: "${busqueda.value}"` : ''}`
  const { doc, dibujarEncabezado, finalizarConPiePagina, guardar, opcionesTablaBase } = crearDocumentoPdf(
    'Planificación de Faena',
    subtitulo,
  )
  dibujarEncabezado()

  autoTable(doc, {
    ...opcionesTablaBase,
    startY: ALTO_ENCABEZADO + 20,
    head: [['Estancia', 'Captación', 'Categoría', 'Raza', 'Cabezas', 'Fecha Estimada', 'Estado']],
    body: filas.map((l) => [
      l.estanciaNombre,
      l.captacionNombre,
      CategoriaGanadoLabels[l.categoria],
      l.raza ?? '—',
      String(l.cantidadCabezas),
      formatearFecha(l.fechaEstimadaFaena),
      textoUrgencia(l.diasRestantes),
    ]),
  })

  finalizarConPiePagina()
  guardar(nombreArchivoPdf('planificacion-de-faena'))
}
</script>

<template>
  <AppShell>
    <div class="p-stack-md md:p-stack-lg flex flex-col gap-stack-lg w-full">
      <div
        class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-container-lowest p-stack-md rounded-xl shadow-sm border border-outline-variant"
      >
        <div>
          <h1 class="font-headline-lg text-headline-lg text-on-surface font-bold">Planificación de Faena</h1>
          <p class="font-body-md text-body-md text-on-surface-variant mt-1">
            Lotes ordenados por cercanía a su fecha estimada de faena, para saber a qué Captador contactar y cuándo.
          </p>
        </div>
        <BaseButton
          v-if="!cargando && lotesFiltrados.length > 0"
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

      <div class="relative w-full sm:max-w-md">
        <span class="absolute left-4 top-1/2 -translate-y-1/2 text-outline flex"><AppIcon name="search" :size="20" /></span>
        <input
          v-model="busqueda"
          type="text"
          placeholder="Buscar por estancia, captación o raza..."
          class="w-full h-[48px] pl-12 pr-4 bg-surface-container-lowest border border-outline-variant rounded-full focus:ring-2 focus:ring-primary focus:border-primary font-body-md text-body-md text-on-surface placeholder:text-outline-variant outline-none transition-shadow shadow-sm"
        />
      </div>

      <AlertBanner v-if="errorMensaje" variant="error">{{ errorMensaje }}</AlertBanner>
      <AlertBanner v-if="!cargando && lotesSinFecha > 0" variant="info">
        {{ lotesSinFecha }} lote{{ lotesSinFecha === 1 ? '' : 's' }} sin fecha estimada de faena registrada — no
        {{ lotesSinFecha === 1 ? 'aparece' : 'aparecen' }} en esta lista. Se completa desde el formulario de Captación.
      </AlertBanner>

      <template v-if="cargando">
        <SkeletonTable class="hidden md:block" :columnas="6" />
        <SkeletonCard class="md:hidden" :cantidad="4" />
      </template>

      <div
        v-else-if="lotesFiltrados.length === 0"
        class="flex flex-col items-center justify-center gap-stack-sm py-16 bg-surface-container-lowest rounded-xl border border-outline-variant"
      >
        <AppIcon name="calendar_month" :size="44" class="text-outline-variant" />
        <p class="font-body-lg text-body-lg text-on-surface-variant">
          {{ busqueda ? 'No se encontraron lotes con ese criterio.' : 'No hay lotes con fecha estimada de faena registrada.' }}
        </p>
      </div>

      <!-- Desktop table -->
      <div v-else class="hidden md:block bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-surface-container-low border-b border-outline-variant">
                <th class="py-4 px-6 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Estancia</th>
                <th class="py-4 px-6 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Captación</th>
                <th class="py-4 px-6 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Categoría / Raza</th>
                <th class="py-4 px-6 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-right">Cabezas</th>
                <th class="py-4 px-6 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Fecha estimada</th>
                <th class="py-4 px-6 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant">
              <tr v-for="(l, indice) in itemsPagina" :key="`${l.captacionId}-${indice}`" class="hover:bg-surface-variant/50 transition-colors">
                <td class="py-4 px-6 font-body-md text-body-md text-on-surface-variant">{{ l.estanciaNombre }}</td>
                <td class="py-4 px-6">
                  <RouterLink
                    :to="{ name: 'captaciones-reporte', params: { id: l.captacionId } }"
                    class="font-body-lg text-body-lg font-semibold text-primary hover:underline"
                  >
                    {{ l.captacionNombre }}
                  </RouterLink>
                </td>
                <td class="py-4 px-6 font-body-md text-body-md text-on-surface">
                  {{ CategoriaGanadoLabels[l.categoria] }}
                  <span class="text-on-surface-variant">· {{ l.raza ?? 'Raza no especificada' }}</span>
                </td>
                <td class="py-4 px-6 font-body-md text-body-md text-on-surface text-right">{{ l.cantidadCabezas }}</td>
                <td class="py-4 px-6 font-body-md text-body-md text-on-surface-variant">{{ formatearFecha(l.fechaEstimadaFaena) }}</td>
                <td class="py-4 px-6">
                  <span
                    class="inline-flex items-center px-3 py-1 rounded-full font-label-md text-label-md border whitespace-nowrap"
                    :class="estilosUrgencia[urgenciaDe(l.diasRestantes)]"
                  >
                    {{ textoUrgencia(l.diasRestantes) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Mobile cards -->
      <div v-if="!cargando && lotesFiltrados.length > 0" class="md:hidden flex flex-col gap-gutter-mobile">
        <RouterLink
          v-for="(l, indice) in itemsPagina"
          :key="`${l.captacionId}-${indice}`"
          :to="{ name: 'captaciones-reporte', params: { id: l.captacionId } }"
          class="bg-surface-container-lowest rounded-xl p-margin-mobile shadow-sm border border-surface-variant flex flex-col gap-stack-sm"
        >
          <div class="flex justify-between items-start gap-2">
            <div>
              <h2 class="font-headline-md text-headline-md text-on-surface">{{ l.captacionNombre }}</h2>
              <span class="font-body-md text-body-md text-on-surface-variant">{{ l.estanciaNombre }}</span>
            </div>
            <span
              class="inline-flex items-center px-3 py-1 rounded-full font-label-md text-label-md border whitespace-nowrap shrink-0"
              :class="estilosUrgencia[urgenciaDe(l.diasRestantes)]"
            >
              {{ textoUrgencia(l.diasRestantes) }}
            </span>
          </div>
          <div class="flex items-center gap-1 text-on-surface-variant font-body-md text-body-md">
            <AppIcon name="pets" :size="16" />
            {{ l.cantidadCabezas }} · {{ CategoriaGanadoLabels[l.categoria] }} · {{ l.raza ?? 'Raza no especificada' }}
          </div>
          <div class="flex items-center gap-1 text-on-surface-variant font-body-md text-body-md">
            <AppIcon name="calendar_month" :size="16" />
            Faena estimada: {{ formatearFecha(l.fechaEstimadaFaena) }}
          </div>
        </RouterLink>
      </div>

      <Pagination
        v-if="!cargando && lotesFiltrados.length > 0"
        v-model="paginaActual"
        :total-paginas="totalPaginas"
        :total="lotesFiltrados.length"
        :por-pagina="porPagina"
      />
    </div>
  </AppShell>
</template>
