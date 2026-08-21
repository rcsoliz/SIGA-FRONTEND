<script setup lang="ts">
// Nota de alcance: el mockup de "Reporte de Captación" incluye una tabla
// combinada de "Bitácora Recurrente de Eventos" — eso requiere el endpoint
// unificado de Maestro de Registros (Etapa 5, 🔒 Administrador, no apto para
// Captador). Mientras tanto, se accede a cada bitácora por separado desde
// los 4 accesos directos de abajo.
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import AlertBanner from '@/components/ui/AlertBanner.vue'
import EstadoCaptacionBadge from '@/components/ui/EstadoCaptacionBadge.vue'
import EstadoSanitarioBadge from '@/components/ui/EstadoSanitarioBadge.vue'
import { ApiError } from '@/api/client'
import * as captacionesApi from '@/api/captaciones'
import { CategoriaGanadoLabels, TipoManejoAlimentarioLabels } from '@/types/enums'
import type { CaptacionGanadoDto } from '@/types/dto'

const route = useRoute()
const id = route.params.id as string

const captacion = ref<CaptacionGanadoDto | null>(null)
const cargando = ref(true)
const errorMensaje = ref<string | null>(null)

function formatearFecha(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-BO', { year: 'numeric', month: 'short', day: 'numeric' })
}

const bitacoraLinks = [
  { routeName: 'bitacora-pesaje', titulo: 'Pesaje', icono: 'scale' },
  { routeName: 'bitacora-sanitario', titulo: 'Sanitario', icono: 'vaccines' },
  { routeName: 'bitacora-movimiento', titulo: 'Movimiento', icono: 'local_shipping' },
  { routeName: 'bitacora-alimentacion', titulo: 'Alimentación', icono: 'grass' },
]

async function cargar() {
  cargando.value = true
  errorMensaje.value = null
  try {
    captacion.value = await captacionesApi.obtener(id)
  } catch (error) {
    errorMensaje.value = error instanceof ApiError ? error.message : 'Ocurrió un error inesperado.'
  } finally {
    cargando.value = false
  }
}
onMounted(cargar)

const metricas = computed(() => {
  if (!captacion.value) return null
  const c = captacion.value
  return [
    { icon: 'pets', label: 'Cabezas Totales', value: String(c.totalCabezas) },
    { icon: 'scale', label: 'Peso Estimado Total', value: `${c.pesoEstimadoTotal.toLocaleString('es-BO')} kg` },
    { icon: 'calendar_month', label: 'Días en Potrero', value: c.diasEnPotrero !== null ? String(c.diasEnPotrero) : '—' },
  ]
})
</script>

<template>
  <AppShell>
    <div class="p-margin-mobile md:p-8 max-w-7xl mx-auto w-full flex flex-col gap-stack-lg">
      <RouterLink
        v-if="captacion"
        :to="{ name: 'captaciones', params: { estanciaId: captacion.estanciaId } }"
        class="inline-flex items-center gap-1 text-primary font-label-md text-label-md w-fit"
      >
        <span class="material-symbols-outlined text-[18px]">arrow_back</span>
        Volver a Captaciones
      </RouterLink>

      <AlertBanner v-if="errorMensaje" variant="error">{{ errorMensaje }}</AlertBanner>

      <div v-if="cargando" class="h-96 rounded-xl bg-surface-container-lowest border border-outline-variant animate-pulse" />

      <template v-else-if="captacion">
        <!-- Encabezado -->
        <section class="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span class="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1 block">
              Identificador de Captación
            </span>
            <h1 class="font-headline-lg text-headline-lg text-on-surface">{{ captacion.nombre }}</h1>
            <div class="flex gap-2 mt-2 flex-wrap">
              <EstadoCaptacionBadge :estado="captacion.estado" />
              <EstadoSanitarioBadge :estado="captacion.estadoSanitario" />
            </div>
          </div>
          <RouterLink :to="{ name: 'captaciones-editar', params: { id: captacion.id } }" class="w-full md:w-auto">
            <BaseButton icon="edit" pill class="md:w-auto">Editar Captación</BaseButton>
          </RouterLink>
        </section>

        <!-- Métricas -->
        <section class="grid grid-cols-1 sm:grid-cols-3 gap-gutter-mobile md:gap-6">
          <div
            v-for="m in metricas"
            :key="m.label"
            class="bg-surface-container-low rounded-xl p-6 shadow-sm border border-outline-variant/30 flex flex-col justify-between"
          >
            <div class="flex items-center gap-3 mb-4 text-on-surface-variant">
              <span class="material-symbols-outlined text-primary">{{ m.icon }}</span>
              <span class="font-label-md text-label-md uppercase">{{ m.label }}</span>
            </div>
            <div class="font-headline-lg text-headline-lg text-on-surface">{{ m.value }}</div>
          </div>
        </section>

        <p class="font-body-md text-body-md text-on-surface-variant -mt-2">
          {{ captacion.potrero ?? 'Sin potrero asignado' }} · {{ formatearFecha(captacion.fecha) }}
          <span v-if="captacion.observaciones"> · {{ captacion.observaciones }}</span>
        </p>

        <!-- Bitácoras -->
        <section class="grid grid-cols-2 md:grid-cols-4 gap-gutter-mobile md:gap-4">
          <RouterLink
            v-for="b in bitacoraLinks"
            :key="b.routeName"
            :to="{ name: b.routeName, params: { captacionId: captacion.id } }"
            class="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/50 flex flex-col items-center gap-2 text-center hover:border-primary/40 transition-colors"
          >
            <span class="material-symbols-outlined text-primary text-2xl">{{ b.icono }}</span>
            <span class="font-label-md text-label-md text-on-surface">{{ b.titulo }}</span>
          </RouterLink>
        </section>

        <!-- Detalle por categoría -->
        <section class="bg-surface-container-low rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
          <div class="p-4 md:p-6 border-b border-outline-variant/30 bg-surface">
            <h2 class="font-headline-md text-headline-md text-on-surface">Detalle por Categoría</h2>
          </div>

          <div v-if="captacion.detalles.length === 0" class="p-8 text-center font-body-md text-body-md text-on-surface-variant">
            No hay grupos registrados en esta captación.
          </div>

          <div v-else class="hidden md:block overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-surface-variant/30 text-on-surface-variant font-label-md text-label-md uppercase">
                  <th class="p-4 font-semibold">Categoría</th>
                  <th class="p-4 font-semibold">Raza</th>
                  <th class="p-4 font-semibold text-right">Cabezas</th>
                  <th class="p-4 font-semibold text-right">Peso Prom.</th>
                  <th class="p-4 font-semibold">Alimentación</th>
                  <th class="p-4 font-semibold">Est. Faena</th>
                  <th class="p-4 font-semibold text-right">Peso Lote</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-outline-variant/20 font-body-md">
                <tr v-for="d in captacion.detalles" :key="d.id" class="hover:bg-surface-variant/20 transition-colors">
                  <td class="p-4 font-semibold">{{ CategoriaGanadoLabels[d.categoria] }}</td>
                  <td class="p-4 text-on-surface-variant">{{ d.raza ?? '—' }}</td>
                  <td class="p-4 text-right">{{ d.cantidadCabezas }}</td>
                  <td class="p-4 text-right">{{ d.pesoPromedioEstimadoKg ?? '—' }}</td>
                  <td class="p-4 text-on-surface-variant">{{ TipoManejoAlimentarioLabels[d.sistemaAlimentacion] }}</td>
                  <td class="p-4 text-on-surface-variant">{{ formatearFecha(d.fechaEstimadaFaena) }}</td>
                  <td class="p-4 text-right font-semibold">{{ d.pesoLoteCalculado.toLocaleString('es-BO') }} kg</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="captacion.detalles.length > 0" class="md:hidden flex flex-col gap-gutter-mobile p-4">
            <div v-for="d in captacion.detalles" :key="d.id" class="bg-surface-container-lowest rounded-lg border border-outline-variant p-4">
              <h4 class="font-body-lg text-body-lg font-bold text-on-surface">
                {{ d.cantidadCabezas }} {{ CategoriaGanadoLabels[d.categoria] }}
              </h4>
              <p class="font-label-md text-label-md text-on-surface-variant mt-1">
                {{ d.raza ?? 'Raza no especificada' }}
                <template v-if="d.pesoPromedioEstimadoKg"> • {{ d.pesoPromedioEstimadoKg }} kg (Prom)</template>
              </p>
              <div class="flex gap-2 mt-2 flex-wrap">
                <span class="text-[10px] bg-surface-container-high px-2 py-1 rounded text-on-surface-variant font-medium">
                  {{ TipoManejoAlimentarioLabels[d.sistemaAlimentacion] }}
                </span>
                <span class="text-[10px] bg-surface-container-high px-2 py-1 rounded text-on-surface-variant font-medium">
                  Faena: {{ formatearFecha(d.fechaEstimadaFaena) }}
                </span>
              </div>
            </div>
          </div>
        </section>
      </template>
    </div>
  </AppShell>
</template>
