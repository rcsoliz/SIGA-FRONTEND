<script setup lang="ts">
// Ya viene ordenado descendente por totalCabezasCapturadas — no se reordena
// en el frontend (sección 5.4 de la especificación), por eso <DataTable> se
// usa acá sin columnas `ordenable`.
import { reactive, ref, onMounted } from 'vue'
import AppShell from '@/components/layout/AppShell.vue'
import AlertBanner from '@/components/ui/AlertBanner.vue'
import SkeletonTable from '@/components/ui/SkeletonTable.vue'
import SkeletonCard from '@/components/ui/SkeletonCard.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import DataTable from '@/components/ui/DataTable.vue'
import * as dashboardApi from '@/api/dashboard'
import { ApiError } from '@/api/client'
import type { CaptadorRankingDto } from '@/types/dto'
import type { ColumnaTabla } from '@/types/dataTable'

const filtros = reactive({ desde: '', hasta: '' })
const captadores = ref<CaptadorRankingDto[]>([])
const cargando = ref(true)
const errorMensaje = ref<string | null>(null)

const columnas: ColumnaTabla<CaptadorRankingDto>[] = [
  { clave: 'posicion', etiqueta: '#', ancho: 'w-16' },
  { clave: 'nombre', etiqueta: 'Captador' },
  { clave: 'estanciasRegistradas', etiqueta: 'Estancias', alinear: 'derecha', numerico: true, ocultarEnTablet: true },
  { clave: 'captacionesRegistradas', etiqueta: 'Captaciones', alinear: 'derecha', numerico: true, ocultarEnTablet: true },
  { clave: 'captacionesActivas', etiqueta: 'Activas', alinear: 'derecha', numerico: true },
  { clave: 'totalCabezasCapturadas', etiqueta: 'Total Cabezas', alinear: 'derecha', numerico: true },
]

async function cargar() {
  cargando.value = true
  errorMensaje.value = null
  try {
    captadores.value = await dashboardApi.listarProductividadCaptadores(
      filtros.desde ? new Date(filtros.desde).toISOString() : undefined,
      filtros.hasta ? new Date(filtros.hasta).toISOString() : undefined,
    )
  } catch (error) {
    errorMensaje.value = error instanceof ApiError ? error.message : 'Ocurrió un error inesperado.'
  } finally {
    cargando.value = false
  }
}
onMounted(cargar)

function medalla(pos: number): string | null {
  return pos === 0 ? '🥇' : pos === 1 ? '🥈' : pos === 2 ? '🥉' : null
}
</script>

<template>
  <AppShell>
    <div class="p-stack-md md:p-stack-lg flex flex-col gap-stack-md w-full">
      <div>
        <h1 class="font-headline-lg text-headline-lg text-on-surface">Ranking de Productividad</h1>
        <p class="font-body-md text-body-md text-on-surface-variant mt-1">Desempeño de los captadores de campo.</p>
      </div>

      <div class="flex items-center gap-2">
        <input v-model="filtros.desde" type="date" class="h-10 px-3 rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface font-body-md text-body-md" @change="cargar" />
        <span class="text-on-surface-variant font-body-md">—</span>
        <input v-model="filtros.hasta" type="date" class="h-10 px-3 rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface font-body-md text-body-md" @change="cargar" />
      </div>

      <AlertBanner v-if="errorMensaje" variant="error">{{ errorMensaje }}</AlertBanner>

      <template v-if="cargando">
        <SkeletonTable class="hidden md:block" :columnas="6" />
        <SkeletonCard class="md:hidden" :cantidad="4" />
      </template>

      <div
        v-else-if="captadores.length === 0"
        class="flex flex-col items-center justify-center gap-stack-sm py-16 bg-surface-container-lowest rounded-xl border border-outline-variant"
      >
        <AppIcon name="leaderboard" :size="44" class="text-outline-variant" />
        <p class="font-body-lg text-body-lg text-on-surface-variant">No hay datos de productividad para este rango.</p>
      </div>

      <DataTable
        v-else
        :columnas="columnas"
        :items="captadores"
        :clave-fila="(c: CaptadorRankingDto) => c.usuarioId"
        :hacia="(c: CaptadorRankingDto) => ({ name: 'perfil-productividad', params: { id: c.usuarioId } })"
        :titulo-movil="(c: CaptadorRankingDto, idx: number) => `${medalla(idx) ?? `#${idx + 1}`}  ${c.nombre}`"
        :subtitulo-movil="(c: CaptadorRankingDto) => c.cargo ?? '—'"
      >
        <template #celda-posicion="{ index }">
          <span class="font-body-lg text-body-lg">{{ medalla(index) ?? index + 1 }}</span>
        </template>
        <template #celda-nombre="{ item }">
          <span class="text-primary font-semibold block max-w-[24ch] truncate" :title="item.nombre">{{ item.nombre }}</span>
          <p class="font-label-md text-label-md text-on-surface-variant">{{ item.cargo ?? '—' }}</p>
        </template>
        <template #celda-totalCabezasCapturadas="{ item }">
          <span class="font-headline-md text-headline-md text-primary">{{ item.totalCabezasCapturadas }}</span>
        </template>

        <template #extra-movil="{ item }">
          <p class="font-label-md text-label-md text-on-surface-variant">{{ item.captacionesActivas }} captaciones activas</p>
          <div class="flex items-center justify-between">
            <span class="font-label-md text-label-md text-on-surface-variant">Total Cabezas</span>
            <span class="font-headline-md text-headline-md text-primary">{{ item.totalCabezasCapturadas }}</span>
          </div>
        </template>
      </DataTable>
    </div>
  </AppShell>
</template>
