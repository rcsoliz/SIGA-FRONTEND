<script setup lang="ts">
// Ya viene ordenado descendente por totalCabezasCapturadas — no se reordena
// en el frontend (sección 5.4 de la especificación).
import { reactive, ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import AlertBanner from '@/components/ui/AlertBanner.vue'
import SkeletonTable from '@/components/ui/SkeletonTable.vue'
import SkeletonCard from '@/components/ui/SkeletonCard.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import * as dashboardApi from '@/api/dashboard'
import { ApiError } from '@/api/client'
import type { CaptadorRankingDto } from '@/types/dto'

const filtros = reactive({ desde: '', hasta: '' })
const captadores = ref<CaptadorRankingDto[]>([])
const cargando = ref(true)
const errorMensaje = ref<string | null>(null)

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

      <div v-else class="hidden md:block bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-surface-container-low border-b border-outline-variant">
              <th class="p-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider w-16">#</th>
              <th class="p-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Captador</th>
              <th class="p-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-right">Estancias</th>
              <th class="p-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-right">Captaciones</th>
              <th class="p-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-right">Activas</th>
              <th class="p-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-right">Total Cabezas</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-outline-variant">
            <tr v-for="(c, idx) in captadores" :key="c.usuarioId" class="hover:bg-surface-container-low transition-colors">
              <td class="p-4 font-body-lg text-body-lg">{{ medalla(idx) ?? idx + 1 }}</td>
              <td class="p-4">
                <RouterLink :to="{ name: 'perfil-productividad', params: { id: c.usuarioId } }" class="text-primary font-semibold hover:underline">
                  {{ c.nombre }}
                </RouterLink>
                <p class="font-label-md text-label-md text-on-surface-variant">{{ c.cargo ?? '—' }}</p>
              </td>
              <td class="p-4 text-right font-body-md text-on-surface">{{ c.estanciasRegistradas }}</td>
              <td class="p-4 text-right font-body-md text-on-surface">{{ c.captacionesRegistradas }}</td>
              <td class="p-4 text-right font-body-md text-on-surface">{{ c.captacionesActivas }}</td>
              <td class="p-4 text-right font-headline-md text-headline-md text-primary">{{ c.totalCabezasCapturadas }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="!cargando && captadores.length > 0" class="md:hidden flex flex-col gap-gutter-mobile">
        <RouterLink
          v-for="(c, idx) in captadores"
          :key="c.usuarioId"
          :to="{ name: 'perfil-productividad', params: { id: c.usuarioId } }"
          class="bg-surface-container-lowest rounded-xl p-margin-mobile shadow-sm border border-surface-variant flex items-center gap-4"
        >
          <span class="font-headline-md text-headline-md text-on-surface-variant w-8 text-center">{{ medalla(idx) ?? idx + 1 }}</span>
          <div class="flex-1">
            <h2 class="font-body-lg text-body-lg font-semibold text-on-surface">{{ c.nombre }}</h2>
            <p class="font-label-md text-label-md text-on-surface-variant">{{ c.cargo ?? '—' }} · {{ c.captacionesActivas }} captaciones activas</p>
          </div>
          <div class="text-right">
            <span class="block font-headline-md text-headline-md text-primary">{{ c.totalCabezasCapturadas }}</span>
            <span class="font-label-md text-label-md text-on-surface-variant">cabezas</span>
          </div>
        </RouterLink>
      </div>
    </div>
  </AppShell>
</template>
