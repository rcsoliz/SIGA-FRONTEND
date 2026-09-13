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
import autoTable from 'jspdf-autotable'
import AppShell from '@/components/layout/AppShell.vue'
import AlertBanner from '@/components/ui/AlertBanner.vue'
import SkeletonTable from '@/components/ui/SkeletonTable.vue'
import SkeletonCard from '@/components/ui/SkeletonCard.vue'
import Pagination from '@/components/ui/Pagination.vue'
import AppIcon, { type NombreIcono } from '@/components/ui/AppIcon.vue'
import DataTable from '@/components/ui/DataTable.vue'
import { Badge, type BadgeVariants } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { usePaginacion } from '@/composables/usePaginacion'
import { useOrdenable } from '@/composables/useOrdenable'
import { ApiError } from '@/api/client'
import * as estanciasApi from '@/api/estancias'
import * as captacionesApi from '@/api/captaciones'
import { crearDocumentoPdf, nombreArchivoPdf, ALTO_ENCABEZADO } from '@/utils/pdfReporte'
import { CategoriaGanadoLabels } from '@/types/enums'
import type { CategoriaGanado } from '@/types/enums'
import type { ColumnaTabla } from '@/types/dataTable'

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
  urgencia: Urgencia
}

const cargando = ref(true)
const errorMensaje = ref<string | null>(null)
const lotes = ref<LoteProximo[]>([])
const lotesSinFecha = ref(0)
const busqueda = ref('')

const columnas: ColumnaTabla<LoteProximo>[] = [
  { clave: 'estanciaNombre', etiqueta: 'Estancia', ordenable: true },
  { clave: 'captacionNombre', etiqueta: 'Captación', ordenable: true },
  { clave: 'categoriaRaza', etiqueta: 'Categoría / Raza', ocultarEnTablet: true },
  { clave: 'cantidadCabezas', etiqueta: 'Cabezas', alinear: 'derecha', ordenable: true, numerico: true },
  { clave: 'fechaEstimadaFaena', etiqueta: 'Fecha estimada', ordenable: true },
]

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
        const diasRestantes = diasRestantesDe(detalle.fechaEstimadaFaena)
        filas.push({
          estanciaId: captacion.estanciaId,
          estanciaNombre: nombreEstanciaPorId.get(captacion.estanciaId) ?? '—',
          captacionId: captacion.id,
          captacionNombre: captacion.nombre,
          categoria: detalle.categoria,
          raza: detalle.raza,
          cantidadCabezas: detalle.cantidadCabezas,
          fechaEstimadaFaena: detalle.fechaEstimadaFaena,
          diasRestantes,
          urgencia: urgenciaDe(diasRestantes),
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

const { ordenarPor, direccion, alternar, comparar } = useOrdenable()
// Sin orden elegido, se mantiene el orden por urgencia calculado en cargar() — no es el
// orden alfabético "por defecto" el que importa acá, sino el de menor diasRestantes primero.
const lotesOrdenados = computed(() => (ordenarPor.value ? [...lotesFiltrados.value].sort(comparar) : lotesFiltrados.value))

const { paginaActual, totalPaginas, itemsPagina, porPagina } = usePaginacion(lotesOrdenados, 8)

function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-BO', { year: 'numeric', month: 'short', day: 'numeric' })
}

type Urgencia = 'vencido' | 'proximo' | 'normal'

function urgenciaDe(dias: number): Urgencia {
  if (dias < 0) return 'vencido'
  if (dias <= 15) return 'proximo'
  return 'normal'
}

const variantesUrgencia: Record<Urgencia, NonNullable<BadgeVariants['variant']>> = {
  vencido: 'destructive',
  proximo: 'secondary',
  normal: 'primary',
}

// Ícono redundante por urgencia — mismo criterio que ya aplican SyncBadge,
// EstadoCaptacionBadge, EstadoSanitarioBadge y EstadoUsuarioBadge: el estado
// no debe distinguirse solo por color.
const iconosUrgencia: Record<Urgencia, NombreIcono> = {
  vencido: 'warning',
  proximo: 'calendar_month',
  normal: 'check_circle',
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
      <Card class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-stack-md">
        <div>
          <h1 class="font-headline-lg text-headline-lg text-on-surface font-bold">Planificación de Faena</h1>
          <p class="font-body-md text-body-md text-on-surface-variant mt-1">
            Lotes ordenados por cercanía a su fecha estimada de faena, para saber a qué Captador contactar y cuándo.
          </p>
        </div>
        <!-- h-11: el size="sm" del primitivo mide 32px (h-8), por debajo del
        mínimo de 44px que el resto de la app usa para acciones de menor
        prioridad (ver comentario de tamaños en BaseButton.vue) — se
        preserva ese piso de accesibilidad con un override. -->
        <Button
          v-if="!cargando && lotesFiltrados.length > 0"
          variant="secondary"
          size="sm"
          class="h-11 w-full sm:w-auto"
          @click="exportarPdf"
        >
          <AppIcon name="download" :size="16" />
          Exportar PDF
        </Button>
      </Card>

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

      <DataTable
        v-else
        :columnas="columnas"
        :items="itemsPagina"
        :clave-fila="(l: LoteProximo) => `${l.captacionId}-${l.categoria}-${l.raza}-${l.cantidadCabezas}-${l.fechaEstimadaFaena}`"
        :ordenar-por="ordenarPor"
        :direccion="direccion"
        :hacia="(l: LoteProximo) => ({ name: 'captaciones-reporte', params: { id: l.captacionId } })"
        :titulo-movil="(l: LoteProximo) => l.captacionNombre"
        :subtitulo-movil="(l: LoteProximo) => l.estanciaNombre"
        @ordenar="alternar"
      >
        <template #celda-captacionNombre="{ item }">
          <span class="font-body-lg text-body-lg font-semibold text-primary max-w-[24ch] truncate block" :title="item.captacionNombre">
            {{ item.captacionNombre }}
          </span>
        </template>
        <template #celda-categoriaRaza="{ item }">
          {{ CategoriaGanadoLabels[item.categoria] }}
          <span class="text-on-surface-variant">· {{ item.raza ?? 'Raza no especificada' }}</span>
        </template>
        <template #celda-fechaEstimadaFaena="{ item }">{{ formatearFecha(item.fechaEstimadaFaena) }}</template>

        <template #acciones="{ item }">
          <Badge :variant="variantesUrgencia[item.urgencia]">
            <AppIcon :name="iconosUrgencia[item.urgencia]" :size="14" />
            {{ textoUrgencia(item.diasRestantes) }}
          </Badge>
        </template>

        <template #extra-movil="{ item }">
          <div class="flex items-center gap-1 text-on-surface-variant font-body-md text-body-md">
            <AppIcon name="pets" :size="16" />
            {{ item.cantidadCabezas }} · {{ CategoriaGanadoLabels[item.categoria] }} · {{ item.raza ?? 'Raza no especificada' }}
          </div>
          <div class="flex items-center gap-1 text-on-surface-variant font-body-md text-body-md">
            <AppIcon name="calendar_month" :size="16" />
            Faena estimada: {{ formatearFecha(item.fechaEstimadaFaena) }}
          </div>
        </template>
      </DataTable>

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
