<script setup lang="ts">
// Maestro de Registros (🔒 Administrador): vista de solo lectura sobre
// GET /api/registros, ya filtrada y ordenada por el backend — no se
// reordena ni se recalcula nada en el frontend (sección 5.4 de la spec).
// Por eso <DataTable> se usa acá sin columnas `ordenable`: el punto de la
// migración es compartir el layout de tabla/tarjeta/tablet, no sumar orden.
import { onMounted, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import autoTable from 'jspdf-autotable'
import AppShell from '@/components/layout/AppShell.vue'
import AlertBanner from '@/components/ui/AlertBanner.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import SyncBadge from '@/components/ui/SyncBadge.vue'
import SkeletonTable from '@/components/ui/SkeletonTable.vue'
import SkeletonCard from '@/components/ui/SkeletonCard.vue'
import Pagination from '@/components/ui/Pagination.vue'
import AppIcon, { type NombreIcono } from '@/components/ui/AppIcon.vue'
import DataTable from '@/components/ui/DataTable.vue'
import { ApiError } from '@/api/client'
import * as registrosApi from '@/api/registros'
import { usePaginacion } from '@/composables/usePaginacion'
import { crearDocumentoPdf, nombreArchivoPdf, ALTO_ENCABEZADO } from '@/utils/pdfReporte'
import { EstadoSyncLabels } from '@/types/enums'
import type { RegistroCampoDto } from '@/types/dto'
import type { ColumnaTabla } from '@/types/dataTable'

const TIPO_ICONOS: Record<RegistroCampoDto['tipo'], NombreIcono> = {
  Pesaje: 'scale',
  Sanitario: 'vaccines',
  Movimiento: 'local_shipping',
  Alimentacion: 'grass',
}

const TIPO_OPCIONES: { value: RegistroCampoDto['tipo'] | ''; label: string }[] = [
  { value: '', label: 'Todos los tipos' },
  { value: 'Pesaje', label: 'Pesaje' },
  { value: 'Sanitario', label: 'Sanitario' },
  { value: 'Movimiento', label: 'Movimiento' },
  { value: 'Alimentacion', label: 'Alimentación' },
]

const columnas: ColumnaTabla<RegistroCampoDto>[] = [
  { clave: 'id', etiqueta: 'ID', ocultarEnTablet: true },
  { clave: 'fechaHora', etiqueta: 'Fecha y Hora' },
  { clave: 'tipo', etiqueta: 'Tipo' },
  { clave: 'captacionNombre', etiqueta: 'Captación' },
  { clave: 'detalleMetrica', etiqueta: 'Detalle / Métrica', ocultarEnTablet: true },
  { clave: 'registradoPor', etiqueta: 'Registrado por', ocultarEnTablet: true },
  { clave: 'estadoSync', etiqueta: 'Estado', alinear: 'centro' },
]

const filtros = reactive({
  texto: '',
  tipo: '' as RegistroCampoDto['tipo'] | '',
  desde: '',
  hasta: '',
})

const registros = ref<RegistroCampoDto[]>([])
const cargando = ref(true)
const errorMensaje = ref<string | null>(null)
let debounceTimer: ReturnType<typeof setTimeout> | null = null

const { paginaActual, totalPaginas, itemsPagina, porPagina } = usePaginacion(registros, 8)

function tipoLabel(tipo: RegistroCampoDto['tipo']): string {
  return tipo === 'Alimentacion' ? 'Alimentación' : tipo
}

function formatearFechaHora(iso: string): string {
  return new Date(iso).toLocaleString('es-BO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function cargar() {
  cargando.value = true
  errorMensaje.value = null
  try {
    registros.value = await registrosApi.buscar({
      texto: filtros.texto || undefined,
      tipo: filtros.tipo || undefined,
      desde: filtros.desde ? new Date(filtros.desde).toISOString() : undefined,
      hasta: filtros.hasta ? new Date(filtros.hasta).toISOString() : undefined,
    })
  } catch (error) {
    errorMensaje.value = error instanceof ApiError ? error.message : 'Ocurrió un error inesperado.'
  } finally {
    cargando.value = false
  }
}

function onFiltroCambio() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(cargar, 400)
}

function limpiarFiltros() {
  filtros.texto = ''
  filtros.tipo = ''
  filtros.desde = ''
  filtros.hasta = ''
  cargar()
}

function exportarPdf() {
  const partesFiltro: string[] = []
  if (filtros.tipo) partesFiltro.push(TIPO_OPCIONES.find((o) => o.value === filtros.tipo)?.label ?? filtros.tipo)
  if (filtros.desde) partesFiltro.push(`desde ${filtros.desde}`)
  if (filtros.hasta) partesFiltro.push(`hasta ${filtros.hasta}`)
  if (filtros.texto) partesFiltro.push(`texto "${filtros.texto}"`)
  const subtitulo = `${registros.value.length} registro${registros.value.length === 1 ? '' : 's'}${partesFiltro.length ? ` · ${partesFiltro.join(' · ')}` : ''}`

  const { doc, dibujarEncabezado, finalizarConPiePagina, guardar, opcionesTablaBase } = crearDocumentoPdf(
    'Maestro de Registros',
    subtitulo,
  )
  dibujarEncabezado()

  autoTable(doc, {
    ...opcionesTablaBase,
    startY: ALTO_ENCABEZADO + 20,
    head: [['ID', 'Fecha y Hora', 'Tipo', 'Captación', 'Detalle / Métrica', 'Registrado por', 'Estado']],
    body: registros.value.map((r) => [
      `#${r.id.slice(0, 8)}`,
      formatearFechaHora(r.fechaHora),
      tipoLabel(r.tipo),
      r.captacionNombre,
      r.detalleMetrica,
      r.registradoPor,
      EstadoSyncLabels[r.estadoSync],
    ]),
  })

  finalizarConPiePagina()
  guardar(nombreArchivoPdf('maestro-de-registros'))
}

onMounted(cargar)
</script>

<template>
  <AppShell>
    <div class="p-stack-md md:p-stack-lg flex flex-col gap-stack-md w-full">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="font-headline-lg text-headline-lg text-on-surface">Maestro de Registros</h1>
          <p class="font-body-md text-body-md text-on-surface-variant mt-1">
            Vista consolidada de las 4 bitácoras del sistema.
          </p>
        </div>
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
          <BaseButton
            v-if="!cargando && registros.length > 0"
            variant="secondary"
            size="sm"
            icon="download"
            :block="false"
            class="w-full sm:w-auto"
            @click="exportarPdf"
          >
            Exportar PDF
          </BaseButton>
          <div class="relative w-full md:w-80">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-outline flex"><AppIcon name="search" :size="20" /></span>
            <input
              v-model="filtros.texto"
              type="text"
              placeholder="Buscar por ID, Captación o Detalles..."
              class="w-full h-12 pl-10 pr-4 rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow"
              @input="onFiltroCambio"
            />
          </div>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <div class="relative">
          <select
            v-model="filtros.tipo"
            class="h-10 pl-3 pr-8 rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface font-body-md text-body-md appearance-none"
            @change="cargar"
          >
            <option v-for="opt in TIPO_OPCIONES" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
          <AppIcon name="expand_more" :size="16" class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline" />
        </div>
        <input
          v-model="filtros.desde"
          type="date"
          class="h-10 px-3 rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface font-body-md text-body-md"
          @change="cargar"
        />
        <span class="text-on-surface-variant font-body-md">—</span>
        <input
          v-model="filtros.hasta"
          type="date"
          class="h-10 px-3 rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface font-body-md text-body-md"
          @change="cargar"
        />
        <button
          v-if="filtros.texto || filtros.tipo || filtros.desde || filtros.hasta"
          type="button"
          class="text-primary font-label-md text-label-md hover:underline ml-1"
          @click="limpiarFiltros"
        >
          Limpiar Filtros
        </button>
      </div>

      <AlertBanner v-if="errorMensaje" variant="error">{{ errorMensaje }}</AlertBanner>

      <template v-if="cargando">
        <SkeletonTable class="hidden md:block" :columnas="7" :filas="5" />
        <SkeletonCard class="md:hidden" :cantidad="5" />
      </template>

      <div
        v-else-if="registros.length === 0"
        class="flex flex-col items-center justify-center gap-stack-sm py-16 bg-surface-container-lowest rounded-xl border border-outline-variant"
      >
        <AppIcon name="search_off" :size="44" class="text-outline-variant" />
        <p class="font-body-lg text-body-lg text-on-surface-variant">No se encontraron registros con estos filtros.</p>
      </div>

      <DataTable
        v-else
        :columnas="columnas"
        :items="itemsPagina"
        :clave-fila="(r: RegistroCampoDto) => r.id"
        :titulo-movil="(r: RegistroCampoDto) => `#${r.id.slice(0, 8)}`"
        :subtitulo-movil="(r: RegistroCampoDto) => formatearFechaHora(r.fechaHora)"
      >
        <template #celda-id="{ item }">
          <span class="font-body-md text-on-surface font-medium">#{{ item.id.slice(0, 8) }}</span>
        </template>
        <template #celda-fechaHora="{ item }">
          <span class="whitespace-nowrap">{{ formatearFechaHora(item.fechaHora) }}</span>
        </template>
        <template #celda-tipo="{ item }">
          <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-container text-on-surface-variant border border-outline-variant">
            <AppIcon :name="TIPO_ICONOS[item.tipo]" :size="16" />
            <span class="font-label-md text-label-md">{{ tipoLabel(item.tipo) }}</span>
          </div>
        </template>
        <template #celda-captacionNombre="{ item }">
          <RouterLink
            :to="{ name: 'captaciones-reporte', params: { id: item.captacionGanadoId } }"
            class="hover:underline text-primary block max-w-[22ch] truncate"
            :title="item.captacionNombre"
          >
            {{ item.captacionNombre }}
          </RouterLink>
        </template>
        <template #celda-estadoSync="{ item }"><SyncBadge :estado="item.estadoSync" /></template>

        <template #extra-movil="{ item }">
          <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-container text-on-surface-variant border border-outline-variant w-fit">
            <AppIcon :name="TIPO_ICONOS[item.tipo]" :size="16" />
            <span class="font-label-md text-label-md">{{ tipoLabel(item.tipo) }}</span>
          </div>
          <RouterLink
            :to="{ name: 'captaciones-reporte', params: { id: item.captacionGanadoId } }"
            class="flex items-center gap-2 text-primary font-body-md font-semibold hover:underline w-fit"
          >
            <AppIcon name="location_on" :size="18" />
            {{ item.captacionNombre }}
          </RouterLink>
          <p class="font-body-md text-on-surface">{{ item.detalleMetrica }}</p>
          <p class="font-label-md text-label-md text-on-surface-variant">Registrado por: {{ item.registradoPor }}</p>
          <SyncBadge :estado="item.estadoSync" />
        </template>
      </DataTable>

      <Pagination
        v-if="!cargando && registros.length > 0"
        v-model="paginaActual"
        :total-paginas="totalPaginas"
        :total="registros.length"
        :por-pagina="porPagina"
      />
    </div>
  </AppShell>
</template>
