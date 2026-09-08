<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import AlertBanner from '@/components/ui/AlertBanner.vue'
import EstadoUsuarioBadge from '@/components/ui/EstadoUsuarioBadge.vue'
import SkeletonTable from '@/components/ui/SkeletonTable.vue'
import SkeletonCard from '@/components/ui/SkeletonCard.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import DataTable from '@/components/ui/DataTable.vue'
import FilterChips from '@/components/ui/FilterChips.vue'
import { useOrdenable } from '@/composables/useOrdenable'
import { ApiError } from '@/api/client'
import * as usuariosApi from '@/api/usuarios'
import { RolUsuarioLabels, type EstadoUsuario } from '@/types/enums'
import type { UsuarioDto } from '@/types/dto'
import type { ColumnaTabla } from '@/types/dataTable'

const usuarios = ref<UsuarioDto[]>([])
const cargando = ref(true)
const errorMensaje = ref<string | null>(null)
const busqueda = ref('')
const filtroEstado = ref<'' | EstadoUsuario>('')

const OPCIONES_ESTADO: { valor: '' | EstadoUsuario; etiqueta: string }[] = [
  { valor: '', etiqueta: 'Todos' },
  { valor: 'Activo', etiqueta: 'Activo' },
  { valor: 'Pendiente', etiqueta: 'Pendiente' },
  { valor: 'Suspendido', etiqueta: 'Suspendido' },
]

const columnas: ColumnaTabla<UsuarioDto>[] = [
  { clave: 'nombre', etiqueta: 'Nombre', ordenable: true },
  { clave: 'email', etiqueta: 'Correo', ordenable: true },
  { clave: 'cargo', etiqueta: 'Cargo', ocultarEnTablet: true },
  { clave: 'rol', etiqueta: 'Rol', ordenable: true },
  { clave: 'estado', etiqueta: 'Estado', alinear: 'centro', ordenable: true },
  { clave: 'fechaCreacion', etiqueta: 'Creado', ordenable: true, ocultarEnTablet: true },
]

const filtrados = computed(() => {
  const t = busqueda.value.trim().toLowerCase()
  return usuarios.value.filter((u) => {
    const coincideTexto = !t || u.nombre.toLowerCase().includes(t) || u.email.toLowerCase().includes(t)
    const coincideEstado = !filtroEstado.value || u.estado === filtroEstado.value
    return coincideTexto && coincideEstado
  })
})

const { ordenarPor, direccion, alternar, comparar } = useOrdenable()
const usuariosOrdenados = computed(() => (ordenarPor.value ? [...filtrados.value].sort(comparar) : filtrados.value))

async function cargar() {
  cargando.value = true
  errorMensaje.value = null
  try {
    usuarios.value = await usuariosApi.listar()
  } catch (error) {
    errorMensaje.value = error instanceof ApiError ? error.message : 'Ocurrió un error inesperado.'
  } finally {
    cargando.value = false
  }
}
onMounted(cargar)

function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-BO', { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>

<template>
  <AppShell>
    <div class="p-stack-md md:p-stack-lg flex flex-col gap-stack-lg w-full">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-container-lowest p-stack-md rounded-xl shadow-sm border border-outline-variant">
        <div>
          <h1 class="font-headline-lg text-headline-lg text-on-surface font-bold">Seguridad y Usuarios</h1>
          <p class="font-body-md text-body-md text-on-surface-variant mt-1">Gestión de cuentas, roles y permisos del sistema.</p>
        </div>
        <RouterLink :to="{ name: 'usuarios-nuevo' }" class="w-full sm:w-auto">
          <BaseButton icon="person_add" size="sm" class="sm:w-auto">Nuevo Usuario</BaseButton>
        </RouterLink>
      </div>

      <div class="flex flex-col sm:flex-row sm:items-center gap-3">
        <div class="relative w-full sm:max-w-md">
          <span class="absolute left-4 top-1/2 -translate-y-1/2 text-outline flex"><AppIcon name="search" :size="20" /></span>
          <input
            v-model="busqueda"
            type="text"
            placeholder="Buscar por nombre o correo..."
            class="w-full h-[48px] pl-12 pr-4 bg-surface-container-lowest border border-outline-variant rounded-full focus:ring-2 focus:ring-primary focus:border-primary font-body-md text-body-md text-on-surface placeholder:text-outline-variant outline-none shadow-sm"
          />
        </div>
        <FilterChips v-model="filtroEstado" :opciones="OPCIONES_ESTADO" />
      </div>

      <AlertBanner v-if="errorMensaje" variant="error">{{ errorMensaje }}</AlertBanner>

      <template v-if="cargando">
        <SkeletonTable class="hidden md:block" :columnas="6" />
        <SkeletonCard class="md:hidden" :cantidad="4" />
      </template>

      <div v-else-if="filtrados.length === 0" class="flex flex-col items-center justify-center gap-stack-sm py-16 bg-surface-container-lowest rounded-xl border border-outline-variant">
        <AppIcon name="group_off" :size="44" class="text-outline-variant" />
        <p class="font-body-lg text-body-lg text-on-surface-variant">No se encontraron usuarios.</p>
      </div>

      <DataTable
        v-else
        :columnas="columnas"
        :items="usuariosOrdenados"
        :clave-fila="(u: UsuarioDto) => u.id"
        :ordenar-por="ordenarPor"
        :direccion="direccion"
        :hacia="(u: UsuarioDto) => ({ name: 'usuarios-detalle', params: { id: u.id } })"
        :titulo-movil="(u: UsuarioDto) => u.nombre"
        :subtitulo-movil="(u: UsuarioDto) => u.email"
        @ordenar="alternar"
      >
        <template #celda-nombre="{ item }">
          <span class="font-body-lg text-body-lg font-semibold text-on-surface block max-w-[24ch] truncate" :title="item.nombre">{{ item.nombre }}</span>
        </template>
        <template #celda-cargo="{ item }">{{ item.cargo ?? '—' }}</template>
        <template #celda-rol="{ item }">{{ RolUsuarioLabels[item.rol] }}</template>
        <template #celda-estado="{ item }"><EstadoUsuarioBadge :estado="item.estado" /></template>
        <template #celda-fechaCreacion="{ item }">{{ formatearFecha(item.fechaCreacion) }}</template>

        <template #extra-movil="{ item }">
          <div class="flex items-center justify-between gap-2">
            <p class="font-label-md text-label-md text-on-surface-variant">
              {{ RolUsuarioLabels[item.rol] }} · {{ item.cargo ?? 'Sin cargo' }}
            </p>
            <EstadoUsuarioBadge :estado="item.estado" />
          </div>
        </template>
      </DataTable>
    </div>
  </AppShell>
</template>
