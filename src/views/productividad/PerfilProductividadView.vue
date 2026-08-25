<script setup lang="ts">
// Un Captador solo puede ver su propio perfil (validado también por el
// backend) — accesible sin :id vía la ruta "mi-productividad", que usa el
// usuarioId de la sesión. El Administrador llega aquí con :id explícito
// desde el Ranking.
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import AlertBanner from '@/components/ui/AlertBanner.vue'
import AppIcon, { type NombreIcono } from '@/components/ui/AppIcon.vue'
import { useAuthStore } from '@/stores/auth'
import { ApiError } from '@/api/client'
import * as dashboardApi from '@/api/dashboard'
import type { CaptadorProductividadDto } from '@/types/dto'

const route = useRoute()
const auth = useAuthStore()
const id = computed(() => (route.params.id as string | undefined) ?? auth.usuarioId!)

const perfil = ref<CaptadorProductividadDto | null>(null)
const cargando = ref(true)
const errorMensaje = ref<string | null>(null)

function formatearFecha(iso: string | null): string {
  if (!iso) return 'Sin actividad registrada'
  return new Date(iso).toLocaleString('es-BO', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

async function cargar() {
  cargando.value = true
  errorMensaje.value = null
  try {
    perfil.value = await dashboardApi.obtenerProductividadCaptador(id.value)
  } catch (error) {
    errorMensaje.value = error instanceof ApiError ? error.message : 'Ocurrió un error inesperado.'
  } finally {
    cargando.value = false
  }
}
onMounted(cargar)

const metricas = computed(() => {
  if (!perfil.value) return []
  const p = perfil.value
  const filas: { icon: NombreIcono; label: string; value: number }[] = [
    { icon: 'home_work', label: 'Estancias Registradas', value: p.estanciasRegistradas },
    { icon: 'dataset', label: 'Captaciones Registradas', value: p.captacionesRegistradas },
    { icon: 'task_alt', label: 'Captaciones Activas', value: p.captacionesActivas },
    { icon: 'pets', label: 'Total Cabezas Capturadas', value: p.totalCabezasCapturadas },
  ]
  return filas
})
</script>

<template>
  <AppShell>
    <div class="p-stack-md md:p-8 max-w-4xl mx-auto w-full flex flex-col gap-stack-lg">
      <AlertBanner v-if="errorMensaje" variant="error">{{ errorMensaje }}</AlertBanner>

      <div v-if="cargando" class="h-96 rounded-xl bg-surface-container-lowest border border-outline-variant animate-pulse" />

      <template v-else-if="perfil">
        <section class="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-6 flex items-center gap-4">
          <div class="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container shrink-0">
            <AppIcon name="person" :size="28" />
          </div>
          <div>
            <h1 class="font-headline-lg text-headline-lg text-on-surface">{{ perfil.nombre }}</h1>
            <p class="font-body-md text-body-md text-on-surface-variant">{{ perfil.cargo ?? 'Captador de Campo' }}</p>
            <p class="font-label-md text-label-md text-on-surface-variant mt-1">
              Última actividad: {{ formatearFecha(perfil.ultimaActividad) }}
            </p>
          </div>
        </section>

        <section v-if="perfil.sectoresAsignados.length > 0" class="flex flex-wrap gap-2">
          <span
            v-for="s in perfil.sectoresAsignados"
            :key="s"
            class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-tertiary-container/20 text-tertiary font-label-md text-label-md border border-tertiary/20"
          >
            <AppIcon name="map" :size="16" />
            {{ s }}
          </span>
        </section>

        <section class="grid grid-cols-2 md:grid-cols-4 gap-gutter-mobile md:gap-4">
          <div
            v-for="m in metricas"
            :key="m.label"
            class="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-sm"
          >
            <AppIcon :name="m.icon" :size="24" class="text-tertiary mb-2" />
            <span class="font-headline-lg text-headline-lg text-on-surface">{{ m.value }}</span>
            <span class="font-label-md text-label-md text-on-surface-variant mt-1 uppercase">{{ m.label }}</span>
          </div>
        </section>
      </template>
    </div>
  </AppShell>
</template>
