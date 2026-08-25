<script setup lang="ts">
// Maestro de Registros (🔒 Administrador): vista de solo lectura sobre
// GET /api/registros, ya filtrada y ordenada por el backend — no se
// reordena ni se recalcula nada en el frontend (sección 5.4 de la spec).
import { onMounted, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import AlertBanner from '@/components/ui/AlertBanner.vue'
import SyncBadge from '@/components/ui/SyncBadge.vue'
import SkeletonTable from '@/components/ui/SkeletonTable.vue'
import SkeletonCard from '@/components/ui/SkeletonCard.vue'
import Pagination from '@/components/ui/Pagination.vue'
import AppIcon, { type NombreIcono } from '@/components/ui/AppIcon.vue'
import { ApiError } from '@/api/client'
import * as registrosApi from '@/api/registros'
import { usePaginacion } from '@/composables/usePaginacion'
import type { RegistroCampoDto } from '@/types/dto'

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

      <!-- Desktop table -->
      <div v-else class="hidden md:block bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-surface-container-low border-b border-outline-variant">
                <th class="p-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">ID</th>
                <th class="p-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Fecha y Hora</th>
                <th class="p-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Tipo</th>
                <th class="p-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Captación</th>
                <th class="p-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Detalles / Métrica</th>
                <th class="p-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Registrado por</th>
                <th class="p-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant">
              <tr v-for="r in itemsPagina" :key="r.id" class="hover:bg-surface-container-low transition-colors">
                <td class="p-4 font-body-md text-on-surface font-medium">#{{ r.id.slice(0, 8) }}</td>
                <td class="p-4 font-body-md text-on-surface-variant whitespace-nowrap">{{ formatearFechaHora(r.fechaHora) }}</td>
                <td class="p-4">
                  <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-container text-on-surface-variant border border-outline-variant">
                    <AppIcon :name="TIPO_ICONOS[r.tipo]" :size="16" />
                    <span class="font-label-md text-label-md">{{ r.tipo === 'Alimentacion' ? 'Alimentación' : r.tipo }}</span>
                  </div>
                </td>
                <td class="p-4 font-body-md text-on-surface">
                  <RouterLink :to="{ name: 'captaciones-reporte', params: { id: r.captacionGanadoId } }" class="hover:underline text-primary">
                    {{ r.captacionNombre }}
                  </RouterLink>
                </td>
                <td class="p-4 font-body-md text-on-surface">{{ r.detalleMetrica }}</td>
                <td class="p-4 font-body-md text-on-surface-variant">{{ r.registradoPor }}</td>
                <td class="p-4"><SyncBadge :estado="r.estadoSync" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Mobile cards -->
      <div v-if="!cargando && registros.length > 0" class="md:hidden flex flex-col gap-gutter-mobile">
        <div
          v-for="r in itemsPagina"
          :key="r.id"
          class="bg-surface-container-lowest rounded-xl p-stack-md shadow-sm border border-outline-variant flex flex-col gap-stack-sm"
        >
          <div class="flex justify-between items-start">
            <div class="flex flex-col">
              <span class="font-label-md text-label-md text-on-surface-variant">#{{ r.id.slice(0, 8) }}</span>
              <span class="font-label-md text-label-md text-on-surface-variant mt-1">{{ formatearFechaHora(r.fechaHora) }}</span>
            </div>
            <div class="flex items-center gap-1 bg-surface-container px-2 py-1 rounded border border-outline-variant">
              <AppIcon :name="TIPO_ICONOS[r.tipo]" :size="16" class="text-primary" />
              <span class="font-label-md text-primary">{{ r.tipo === 'Alimentacion' ? 'Alimentación' : r.tipo }}</span>
            </div>
          </div>
          <RouterLink
            :to="{ name: 'captaciones-reporte', params: { id: r.captacionGanadoId } }"
            class="flex items-center gap-2 text-primary font-body-md font-semibold hover:underline w-fit"
          >
            <AppIcon name="location_on" :size="18" />
            {{ r.captacionNombre }}
          </RouterLink>
          <p class="font-body-md text-on-surface">{{ r.detalleMetrica }}</p>
          <p class="font-label-md text-label-md text-on-surface-variant">Registrado por: {{ r.registradoPor }}</p>
          <SyncBadge :estado="r.estadoSync" />
        </div>
      </div>

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
