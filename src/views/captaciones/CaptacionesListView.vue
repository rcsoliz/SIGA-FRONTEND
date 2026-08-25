<script setup lang="ts">
// No existe un mockup dedicado de "Listado de Captaciones" en Stitch (solo
// Registro y Reporte) — el dropdown de "Listado de Estancias" sí referenciaba
// una acción "Ver Captaciones", así que esta pantalla se diseñó reutilizando
// los mismos patrones ya establecidos (tarjetas/tabla, loading/empty/error)
// para no introducir un lenguaje visual nuevo.
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import AlertBanner from '@/components/ui/AlertBanner.vue'
import EstadoCaptacionBadge from '@/components/ui/EstadoCaptacionBadge.vue'
import EstadoSanitarioBadge from '@/components/ui/EstadoSanitarioBadge.vue'
import SkeletonCard from '@/components/ui/SkeletonCard.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { useAuthStore } from '@/stores/auth'
import { ApiError } from '@/api/client'
import * as captacionesApi from '@/api/captaciones'
import * as estanciasApi from '@/api/estancias'
import type { CaptacionGanadoDto, EstanciaDto } from '@/types/dto'

const route = useRoute()
const estanciaId = computed(() => route.params.estanciaId as string)

const auth = useAuthStore()
const puedeCrear = computed(() => auth.rol === 'Captador')

const estancia = ref<EstanciaDto | null>(null)
const captaciones = ref<CaptacionGanadoDto[]>([])
const cargando = ref(true)
const errorMensaje = ref<string | null>(null)

function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-BO', { year: 'numeric', month: 'short', day: 'numeric' })
}

async function cargar() {
  cargando.value = true
  errorMensaje.value = null
  try {
    const [e, lista] = await Promise.all([
      estanciasApi.obtener(estanciaId.value),
      captacionesApi.listarPorEstancia(estanciaId.value),
    ])
    estancia.value = e
    captaciones.value = lista
  } catch (error) {
    errorMensaje.value = error instanceof ApiError ? error.message : 'Ocurrió un error inesperado.'
  } finally {
    cargando.value = false
  }
}

onMounted(cargar)
</script>

<template>
  <AppShell>
    <div class="p-stack-md md:p-stack-lg flex flex-col gap-stack-lg max-w-[1400px] mx-auto w-full">
      <RouterLink :to="{ name: 'estancias' }" class="inline-flex items-center gap-1 text-primary font-label-md text-label-md w-fit">
        <AppIcon name="arrow_back" :size="18" />
        Volver a Estancias
      </RouterLink>

      <div
        class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-container-lowest p-stack-md rounded-xl shadow-sm border border-outline-variant"
      >
        <div>
          <h1 class="font-headline-lg text-headline-lg text-on-surface font-bold">Captaciones</h1>
          <p class="font-body-md text-body-md text-on-surface-variant mt-1">
            {{ estancia ? estancia.nombre : 'Cargando estancia…' }}
          </p>
        </div>
        <RouterLink v-if="puedeCrear" :to="{ name: 'captaciones-nueva', params: { estanciaId } }" class="w-full sm:w-auto">
          <BaseButton icon="add" class="sm:w-auto">Nueva Captación</BaseButton>
        </RouterLink>
      </div>

      <AlertBanner v-if="errorMensaje" variant="error">{{ errorMensaje }}</AlertBanner>

      <SkeletonCard v-if="cargando" :cantidad="3" />

      <div
        v-else-if="captaciones.length === 0"
        class="flex flex-col items-center justify-center gap-stack-sm py-16 bg-surface-container-lowest rounded-xl border border-outline-variant"
      >
        <AppIcon name="dataset" :size="44" class="text-outline-variant" />
        <p class="font-body-lg text-body-lg text-on-surface-variant">No hay captaciones registradas para esta estancia.</p>
      </div>

      <div v-else class="flex flex-col gap-gutter-mobile">
        <RouterLink
          v-for="c in captaciones"
          :key="c.id"
          :to="{ name: 'captaciones-reporte', params: { id: c.id } }"
          class="bg-surface-container-lowest rounded-xl p-margin-mobile shadow-sm border border-surface-variant flex flex-col sm:flex-row sm:items-center sm:justify-between gap-stack-sm hover:border-primary/40 transition-colors"
        >
          <div>
            <h2 class="font-headline-md text-headline-md text-on-surface">{{ c.nombre }}</h2>
            <p class="font-body-md text-body-md text-on-surface-variant mt-1">
              {{ formatearFecha(c.fecha) }} · {{ c.potrero ?? 'Sin potrero asignado' }}
            </p>
            <div class="flex gap-2 mt-2 flex-wrap">
              <EstadoCaptacionBadge :estado="c.estado" />
              <EstadoSanitarioBadge :estado="c.estadoSanitario" />
            </div>
          </div>
          <div class="flex sm:flex-col items-center sm:items-end gap-4 sm:gap-1">
            <div class="text-right">
              <span class="block font-headline-md text-headline-md text-primary">{{ c.totalCabezas }}</span>
              <span class="font-label-md text-label-md text-on-surface-variant">cabezas</span>
            </div>
          </div>
        </RouterLink>
      </div>
    </div>
  </AppShell>
</template>
