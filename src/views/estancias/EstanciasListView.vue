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
import DataTable from '@/components/ui/DataTable.vue'
import RowActionsMenu from '@/components/ui/RowActionsMenu.vue'
import FilterChips from '@/components/ui/FilterChips.vue'
import { useAuthStore } from '@/stores/auth'
import { useInvitadoStore } from '@/stores/invitado'
import { useToast } from '@/composables/useToast'
import { usePaginacion } from '@/composables/usePaginacion'
import { useOrdenable } from '@/composables/useOrdenable'
import { ApiError } from '@/api/client'
import * as estanciasApi from '@/api/estancias'
import * as invitadoApi from '@/services/invitadoApi'
import type { EstanciaDto } from '@/types/dto'
import type { EstadoSync } from '@/types/enums'
import type { ColumnaTabla } from '@/types/dataTable'

const auth = useAuthStore()
const invitado = useInvitadoStore()
const { mostrar } = useToast()
const puedeCrear = computed(() => auth.rol === 'Captador' || invitado.activo)
// Eliminar: 🔒 Administrador (EstanciasController.cs — [Authorize(Roles = "Administrador")] en DELETE)
const puedeEliminar = computed(() => auth.rol === 'Administrador')
const puedeEditar = computed(() => !invitado.activo)
const mostrarAcciones = computed(() => puedeEliminar.value || puedeEditar.value)

const estancias = ref<EstanciaDto[]>([])
const cargando = ref(true)
const errorMensaje = ref<string | null>(null)
const busqueda = ref('')
const filtroEstado = ref<'' | EstadoSync>('')

const OPCIONES_ESTADO: { valor: '' | EstadoSync; etiqueta: string }[] = [
  { valor: '', etiqueta: 'Todos' },
  { valor: 'Sincronizado', etiqueta: 'Sincronizado' },
  { valor: 'Pendiente', etiqueta: 'Pendiente' },
  { valor: 'Error', etiqueta: 'Error' },
]

const columnas: ColumnaTabla<EstanciaDto>[] = [
  { clave: 'nombre', etiqueta: 'Nombre', ordenable: true },
  { clave: 'propietario', etiqueta: 'Propietario', ordenable: true },
  { clave: 'ubicacion', etiqueta: 'Ubicación' },
  { clave: 'cantidadCaptaciones', etiqueta: 'Captaciones', alinear: 'derecha', ordenable: true, numerico: true, ocultarEnTablet: true },
  { clave: 'totalCabezas', etiqueta: 'Total Cabezas', alinear: 'derecha', ordenable: true, numerico: true },
  { clave: 'estadoSync', etiqueta: 'Estado', alinear: 'centro', ordenable: true },
]

const estanciasFiltradas = computed(() => {
  const termino = busqueda.value.trim().toLowerCase()
  return estancias.value.filter((e) => {
    const coincideTexto = !termino || e.nombre.toLowerCase().includes(termino) || e.propietario.toLowerCase().includes(termino)
    const coincideEstado = !filtroEstado.value || e.estadoSync === filtroEstado.value
    return coincideTexto && coincideEstado
  })
})

const { ordenarPor, direccion, alternar, comparar } = useOrdenable()
const estanciasOrdenadas = computed(() =>
  ordenarPor.value ? [...estanciasFiltradas.value].sort(comparar) : estanciasFiltradas.value,
)

const { paginaActual, totalPaginas, itemsPagina, porPagina } = usePaginacion(estanciasOrdenadas, 8)

function ubicacion(e: EstanciaDto): string {
  return [e.departamento, e.provincia].filter(Boolean).join(' / ') || '—'
}

async function cargar() {
  cargando.value = true
  errorMensaje.value = null
  try {
    estancias.value = invitado.activo ? await invitadoApi.listarEstanciasLocal() : await estanciasApi.listar()
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
    <div class="p-stack-md md:p-stack-lg flex flex-col gap-stack-lg w-full">
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
          <BaseButton icon="add" size="sm" class="sm:w-auto">Nueva Estancia</BaseButton>
        </RouterLink>
      </div>

      <!-- Search + filtro rápido -->
      <div class="flex flex-col sm:flex-row sm:items-center gap-3">
        <div class="relative w-full sm:max-w-md">
          <span class="absolute left-4 top-1/2 -translate-y-1/2 text-outline flex"><AppIcon name="search" :size="20" /></span>
          <input
            v-model="busqueda"
            type="text"
            placeholder="Buscar por nombre o propietario..."
            class="w-full h-[48px] pl-12 pr-4 bg-surface-container-lowest border border-outline-variant rounded-full focus:ring-2 focus:ring-primary focus:border-primary font-body-md text-body-md text-on-surface placeholder:text-outline-variant outline-none transition-shadow shadow-sm"
          />
        </div>
        <FilterChips v-model="filtroEstado" :opciones="OPCIONES_ESTADO" />
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
          {{ busqueda || filtroEstado ? 'No se encontraron estancias con ese criterio.' : 'No hay estancias registradas.' }}
        </p>
      </div>

      <DataTable
        v-else
        :columnas="columnas"
        :items="itemsPagina"
        :clave-fila="(e: EstanciaDto) => e.id"
        :ordenar-por="ordenarPor"
        :direccion="direccion"
        :hacia="(e: EstanciaDto) => ({ name: 'captaciones', params: { estanciaId: e.id } })"
        :titulo-movil="(e: EstanciaDto) => e.nombre"
        :subtitulo-movil="(e: EstanciaDto) => `Prop: ${e.propietario}`"
        @ordenar="alternar"
      >
        <template #celda-nombre="{ item }">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center text-on-primary-container flex-shrink-0">
              <AppIcon name="location_city" :size="20" />
            </div>
            <span class="font-body-lg text-body-lg text-on-surface font-semibold max-w-[28ch] truncate" :title="item.nombre">{{ item.nombre }}</span>
          </div>
        </template>
        <template #celda-ubicacion="{ item }">
          <span class="flex items-center gap-1 max-w-[22ch] truncate" :title="ubicacion(item)">
            <AppIcon name="location_on" :size="16" class="flex-shrink-0" />
            {{ ubicacion(item) }}
          </span>
        </template>
        <template #celda-estadoSync="{ item }">
          <SyncBadge :estado="item.estadoSync" />
        </template>

        <template #acciones="{ item }">
          <RowActionsMenu v-if="mostrarAcciones">
            <RouterLink
              v-if="puedeEditar"
              :to="{ name: 'estancias-editar', params: { id: item.id } }"
              class="flex items-center gap-2 px-3 py-2 font-body-md text-body-md text-on-surface hover:bg-surface-container-low transition-colors"
            >
              <AppIcon name="edit" :size="16" /> Editar
            </RouterLink>
            <button
              v-if="puedeEliminar"
              type="button"
              class="w-full flex items-center gap-2 px-3 py-2 font-body-md text-body-md text-on-surface hover:bg-error-container hover:text-error transition-colors"
              @click="pedirConfirmacion(item)"
            >
              <AppIcon name="delete" :size="16" /> Eliminar
            </button>
          </RowActionsMenu>
        </template>

        <template #extra-movil="{ item }">
          <div class="flex items-center gap-1 text-on-surface-variant font-body-md text-body-md">
            <AppIcon name="location_on" :size="16" />
            {{ ubicacion(item) }}
          </div>
          <div class="flex gap-stack-sm mt-base flex-wrap">
            <span class="flex items-center gap-1 bg-surface-container-low px-2 py-1 rounded-md font-label-md text-label-md text-primary">
              <AppIcon name="dataset" :size="14" />
              {{ item.cantidadCaptaciones }} Captaciones
            </span>
            <div class="flex items-center gap-1 bg-surface-container-low px-2 py-1 rounded-md font-label-md text-label-md text-on-surface">
              <AppIcon name="pets" :size="14" />
              {{ item.totalCabezas }} Cabezas
            </div>
          </div>
          <div class="mt-base">
            <SyncBadge :estado="item.estadoSync" />
          </div>
        </template>
      </DataTable>

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
