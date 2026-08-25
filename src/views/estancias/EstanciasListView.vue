<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import AlertBanner from '@/components/ui/AlertBanner.vue'
import SyncBadge from '@/components/ui/SyncBadge.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import SkeletonTable from '@/components/ui/SkeletonTable.vue'
import SkeletonCard from '@/components/ui/SkeletonCard.vue'
import Pagination from '@/components/ui/Pagination.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { usePaginacion } from '@/composables/usePaginacion'
import { ApiError } from '@/api/client'
import * as estanciasApi from '@/api/estancias'
import type { EstanciaDto } from '@/types/dto'

const auth = useAuthStore()
const { mostrar } = useToast()
const puedeCrear = computed(() => auth.rol === 'Captador')
// Eliminar: 🔒 Administrador (EstanciasController.cs — [Authorize(Roles = "Administrador")] en DELETE)
const puedeEliminar = computed(() => auth.rol === 'Administrador')

const estancias = ref<EstanciaDto[]>([])
const cargando = ref(true)
const errorMensaje = ref<string | null>(null)
const busqueda = ref('')

const estanciasFiltradas = computed(() => {
  const termino = busqueda.value.trim().toLowerCase()
  if (!termino) return estancias.value
  return estancias.value.filter(
    (e) => e.nombre.toLowerCase().includes(termino) || e.propietario.toLowerCase().includes(termino),
  )
})

const { paginaActual, totalPaginas, itemsPagina, porPagina } = usePaginacion(estanciasFiltradas, 8)

function ubicacion(e: EstanciaDto): string {
  return [e.departamento, e.provincia].filter(Boolean).join(' / ') || '—'
}

async function cargar() {
  cargando.value = true
  errorMensaje.value = null
  try {
    estancias.value = await estanciasApi.listar()
  } catch (error) {
    errorMensaje.value = error instanceof ApiError ? error.message : 'Ocurrió un error inesperado.'
  } finally {
    cargando.value = false
  }
}

onMounted(cargar)

// --- Eliminar ---
const estanciaAEliminar = ref<EstanciaDto | null>(null)
const eliminando = ref(false)
const errorEliminar = ref<string | null>(null)

function pedirConfirmacion(e: EstanciaDto) {
  estanciaAEliminar.value = e
  errorEliminar.value = null
}

function cancelarEliminacion() {
  if (eliminando.value) return
  estanciaAEliminar.value = null
}

async function confirmarEliminacion() {
  if (!estanciaAEliminar.value) return
  eliminando.value = true
  errorEliminar.value = null
  try {
    await estanciasApi.eliminar(estanciaAEliminar.value.id)
    estancias.value = estancias.value.filter((e) => e.id !== estanciaAEliminar.value!.id)
    mostrar('Estancia eliminada correctamente.')
    estanciaAEliminar.value = null
  } catch (error) {
    errorEliminar.value = error instanceof ApiError ? error.message : 'Ocurrió un error inesperado.'
  } finally {
    eliminando.value = false
  }
}
</script>

<template>
  <AppShell>
    <div class="p-stack-md md:p-stack-lg flex flex-col gap-stack-lg max-w-[1400px] mx-auto w-full">
      <!-- Header -->
      <div
        class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-container-lowest p-stack-md rounded-xl shadow-sm border border-outline-variant"
      >
        <div>
          <h1 class="font-headline-lg text-headline-lg text-on-surface font-bold">Listado de Estancias</h1>
          <p class="font-body-md text-body-md text-on-surface-variant mt-1">
            Gestión de propiedades y captaciones registradas
          </p>
        </div>
        <RouterLink v-if="puedeCrear" :to="{ name: 'estancias-nueva' }" class="w-full sm:w-auto">
          <BaseButton icon="add" class="sm:w-auto">Nueva Estancia</BaseButton>
        </RouterLink>
      </div>

      <!-- Search -->
      <div class="relative w-full sm:max-w-md">
        <span class="absolute left-4 top-1/2 -translate-y-1/2 text-outline flex"><AppIcon name="search" :size="20" /></span>
        <input
          v-model="busqueda"
          type="text"
          placeholder="Buscar por nombre o propietario..."
          class="w-full h-[48px] pl-12 pr-4 bg-surface-container-lowest border border-outline-variant rounded-full focus:ring-2 focus:ring-primary focus:border-primary font-body-md text-body-md text-on-surface placeholder:text-outline-variant outline-none transition-shadow shadow-sm"
        />
      </div>

      <AlertBanner v-if="errorMensaje" variant="error">{{ errorMensaje }}</AlertBanner>

      <!-- Loading skeleton -->
      <template v-if="cargando">
        <SkeletonTable class="hidden md:block" :columnas="7" />
        <SkeletonCard class="md:hidden" :cantidad="4" />
      </template>

      <!-- Empty state -->
      <div
        v-else-if="estanciasFiltradas.length === 0"
        class="flex flex-col items-center justify-center gap-stack-sm py-16 bg-surface-container-lowest rounded-xl border border-outline-variant"
      >
        <AppIcon name="home_work" :size="44" class="text-outline-variant" />
        <p class="font-body-lg text-body-lg text-on-surface-variant">
          {{ busqueda ? 'No se encontraron estancias con ese criterio.' : 'No hay estancias registradas.' }}
        </p>
      </div>

      <!-- Desktop table -->
      <div v-else class="hidden md:block bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-surface-container-low border-b border-outline-variant">
                <th class="py-4 px-6 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Nombre</th>
                <th class="py-4 px-6 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Propietario</th>
                <th class="py-4 px-6 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Ubicación</th>
                <th class="py-4 px-6 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-right">Captaciones</th>
                <th class="py-4 px-6 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-right">Total Cabezas</th>
                <th class="py-4 px-6 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-center">Estado</th>
                <th class="py-4 px-6 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-center w-16">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant">
              <tr v-for="e in itemsPagina" :key="e.id" class="hover:bg-surface-variant/50 transition-colors">
                <td class="py-4 px-6">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center text-on-primary-container flex-shrink-0">
                      <AppIcon name="location_city" :size="20" />
                    </div>
                    <span class="font-body-lg text-body-lg text-on-surface font-semibold">{{ e.nombre }}</span>
                  </div>
                </td>
                <td class="py-4 px-6 font-body-md text-body-md text-on-surface">{{ e.propietario }}</td>
                <td class="py-4 px-6 font-body-md text-body-md text-on-surface-variant">
                  <span class="flex items-center gap-1">
                    <AppIcon name="location_on" :size="16" />
                    {{ ubicacion(e) }}
                  </span>
                </td>
                <td class="py-4 px-6 font-body-md text-body-md text-on-surface text-right">{{ e.cantidadCaptaciones }}</td>
                <td class="py-4 px-6 font-body-md text-body-md text-on-surface text-right">{{ e.totalCabezas }}</td>
                <td class="py-4 px-6 text-center">
                  <SyncBadge :estado="e.estadoSync" />
                </td>
                <td class="py-4 px-6 text-center">
                  <div class="flex items-center justify-center gap-1">
                    <RouterLink
                      :to="{ name: 'captaciones', params: { estanciaId: e.id } }"
                      class="w-10 h-10 rounded-full inline-flex items-center justify-center text-on-surface-variant hover:bg-surface-variant transition-colors"
                      title="Ver captaciones"
                      aria-label="Ver captaciones"
                    >
                      <AppIcon name="dataset" :size="20" />
                    </RouterLink>
                    <RouterLink
                      :to="{ name: 'estancias-editar', params: { id: e.id } }"
                      class="w-10 h-10 rounded-full inline-flex items-center justify-center text-on-surface-variant hover:bg-surface-variant transition-colors"
                      title="Editar estancia"
                      aria-label="Editar estancia"
                    >
                      <AppIcon name="edit" :size="20" />
                    </RouterLink>
                    <button
                      v-if="puedeEliminar"
                      type="button"
                      class="w-10 h-10 rounded-full inline-flex items-center justify-center text-on-surface-variant hover:bg-error-container hover:text-error transition-colors"
                      title="Eliminar estancia"
                      aria-label="Eliminar estancia"
                      @click="pedirConfirmacion(e)"
                    >
                      <AppIcon name="delete" :size="20" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Mobile cards -->
      <div v-if="!cargando && estanciasFiltradas.length > 0" class="md:hidden flex flex-col gap-gutter-mobile">
        <div
          v-for="e in itemsPagina"
          :key="e.id"
          class="bg-surface-container-lowest rounded-xl p-margin-mobile shadow-sm border border-surface-variant flex flex-col gap-stack-sm"
        >
          <div class="flex justify-between items-start">
            <div class="flex flex-col">
              <h2 class="font-headline-md text-headline-md text-on-surface">{{ e.nombre }}</h2>
              <span class="font-body-md text-body-md text-on-surface-variant">Prop: {{ e.propietario }}</span>
            </div>
            <div class="flex items-center gap-1">
              <RouterLink
                :to="{ name: 'estancias-editar', params: { id: e.id } }"
                class="text-on-surface-variant h-8 w-8 flex items-center justify-center rounded-full hover:bg-surface-container-low"
                title="Editar estancia"
                aria-label="Editar estancia"
              >
                <AppIcon name="edit" :size="18" />
              </RouterLink>
              <button
                v-if="puedeEliminar"
                type="button"
                class="text-on-surface-variant h-8 w-8 flex items-center justify-center rounded-full hover:bg-error-container hover:text-error"
                title="Eliminar estancia"
                aria-label="Eliminar estancia"
                @click="pedirConfirmacion(e)"
              >
                <AppIcon name="delete" :size="18" />
              </button>
            </div>
          </div>
          <div class="flex items-center gap-1 text-on-surface-variant font-body-md text-body-md">
            <AppIcon name="location_on" :size="16" />
            {{ ubicacion(e) }}
          </div>
          <div class="flex gap-stack-sm mt-base flex-wrap">
            <RouterLink
              :to="{ name: 'captaciones', params: { estanciaId: e.id } }"
              class="flex items-center gap-1 bg-surface-container-low px-2 py-1 rounded-md font-label-md text-label-md text-primary"
            >
              <AppIcon name="dataset" :size="14" />
              {{ e.cantidadCaptaciones }} Captaciones
            </RouterLink>
            <div class="flex items-center gap-1 bg-surface-container-low px-2 py-1 rounded-md font-label-md text-label-md text-on-surface">
              <AppIcon name="pets" :size="14" />
              {{ e.totalCabezas }} Cabezas
            </div>
          </div>
          <div class="mt-base">
            <SyncBadge :estado="e.estadoSync" />
          </div>
        </div>
      </div>

      <Pagination
        v-if="!cargando && estanciasFiltradas.length > 0"
        v-model="paginaActual"
        :total-paginas="totalPaginas"
        :total="estanciasFiltradas.length"
        :por-pagina="porPagina"
      />
    </div>

    <ConfirmDialog
      :open="estanciaAEliminar !== null"
      title="Eliminar estancia"
      :message="`¿Está seguro de eliminar «${estanciaAEliminar?.nombre}»? Esta acción no se puede deshacer.`"
      confirm-label="Eliminar"
      :loading="eliminando"
      :error-message="errorEliminar"
      @confirm="confirmarEliminacion"
      @cancel="cancelarEliminacion"
    />
  </AppShell>
</template>
