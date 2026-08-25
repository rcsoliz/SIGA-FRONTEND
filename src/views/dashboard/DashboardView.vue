<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppShell from '@/components/layout/AppShell.vue'
import AlertBanner from '@/components/ui/AlertBanner.vue'
import KpiCard from '@/components/ui/KpiCard.vue'
import BarChartHorizontal from '@/components/ui/BarChartHorizontal.vue'
import MonthlyBarChart from '@/components/ui/MonthlyBarChart.vue'
import { ApiError } from '@/api/client'
import * as dashboardApi from '@/api/dashboard'
import { CategoriaGanadoLabels } from '@/types/enums'
import type { DashboardDto } from '@/types/dto'

const datos = ref<DashboardDto | null>(null)
const cargando = ref(true)
const errorMensaje = ref<string | null>(null)

async function cargar() {
  cargando.value = true
  errorMensaje.value = null
  try {
    datos.value = await dashboardApi.obtenerResumen()
  } catch (error) {
    errorMensaje.value = error instanceof ApiError ? error.message : 'Ocurrió un error inesperado.'
  } finally {
    cargando.value = false
  }
}
onMounted(cargar)

const categoriasChart = computed(
  () => datos.value?.cabezasPorCategoria.map((c) => ({ label: CategoriaGanadoLabels[c.categoria], value: c.cantidad })) ?? [],
)
const consumoChart = computed(() => datos.value?.serieMensual.map((s) => ({ mes: s.mes, valor: s.consumoPromedioKg })) ?? [])
const pesoChart = computed(() => datos.value?.serieMensual.map((s) => ({ mes: s.mes, valor: s.pesoPromedioKg })) ?? [])
</script>

<template>
  <AppShell>
    <div class="p-stack-md md:p-8 max-w-[1600px] mx-auto w-full flex flex-col gap-6">
      <h1 class="font-headline-lg text-headline-lg text-on-background">Dashboard de Gestión</h1>

      <AlertBanner v-if="errorMensaje" variant="error">{{ errorMensaje }}</AlertBanner>

      <div v-if="cargando" class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div v-for="n in 3" :key="n" class="h-36 rounded-2xl bg-surface-container-lowest border border-outline-variant animate-pulse" />
      </div>

      <template v-else-if="datos">
        <section class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KpiCard label="Total Cabezas Activas" :value="datos.totalCabezasActivas.toLocaleString('es-BO')" icon="pets" />
          <KpiCard label="Captaciones Activas" :value="String(datos.captacionesActivas)" icon="location_on" tono="tertiary" />
          <KpiCard
            label="Pendientes de Revisión"
            :value="String(datos.captacionesPendientesRevision)"
            icon="fact_check"
            :hint="datos.captacionesPendientesRevision > 0 ? 'Requieren atención' : 'Todo al día'"
            :tono="datos.captacionesPendientesRevision > 0 ? 'secondary' : 'primary'"
          />
        </section>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section class="lg:col-span-1 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-6">
            <h3 class="font-headline-md text-headline-md text-on-background mb-6">Cabezas por Categoría</h3>
            <BarChartHorizontal v-if="categoriasChart.length > 0" :items="categoriasChart" />
            <p v-else class="font-body-md text-body-md text-on-surface-variant">Sin cabezas activas registradas.</p>
          </section>

          <div class="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <MonthlyBarChart titulo="Consumo Promedio" :puntos="consumoChart" color="primary" unidad=" kg" />
            <MonthlyBarChart titulo="Peso Promedio" :puntos="pesoChart" color="secondary" unidad=" kg" />
          </div>
        </div>
      </template>
    </div>
  </AppShell>
</template>
