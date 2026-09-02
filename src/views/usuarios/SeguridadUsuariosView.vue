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
import { ApiError } from '@/api/client'
import * as usuariosApi from '@/api/usuarios'
import { RolUsuarioLabels } from '@/types/enums'
import type { UsuarioDto } from '@/types/dto'

const usuarios = ref<UsuarioDto[]>([])
const cargando = ref(true)
const errorMensaje = ref<string | null>(null)
const busqueda = ref('')

const filtrados = computed(() => {
  const t = busqueda.value.trim().toLowerCase()
  if (!t) return usuarios.value
  return usuarios.value.filter((u) => u.nombre.toLowerCase().includes(t) || u.email.toLowerCase().includes(t))
})

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

      <div class="relative w-full sm:max-w-md">
        <span class="absolute left-4 top-1/2 -translate-y-1/2 text-outline flex"><AppIcon name="search" :size="20" /></span>
        <input
          v-model="busqueda"
          type="text"
          placeholder="Buscar por nombre o correo..."
          class="w-full h-[48px] pl-12 pr-4 bg-surface-container-lowest border border-outline-variant rounded-full focus:ring-2 focus:ring-primary focus:border-primary font-body-md text-body-md text-on-surface placeholder:text-outline-variant outline-none shadow-sm"
        />
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

      <div v-else class="hidden md:block bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-surface-container-low border-b border-outline-variant">
              <th class="p-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Nombre</th>
              <th class="p-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Correo</th>
              <th class="p-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Cargo</th>
              <th class="p-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Rol</th>
              <th class="p-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Estado</th>
              <th class="p-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Creado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-outline-variant">
            <tr v-for="u in filtrados" :key="u.id" class="hover:bg-surface-container-low transition-colors cursor-pointer" @click="$router.push({ name: 'usuarios-detalle', params: { id: u.id } })">
              <td class="p-4 font-body-lg text-body-lg font-semibold text-on-surface">{{ u.nombre }}</td>
              <td class="p-4 font-body-md text-on-surface-variant">{{ u.email }}</td>
              <td class="p-4 font-body-md text-on-surface-variant">{{ u.cargo ?? '—' }}</td>
              <td class="p-4 font-body-md text-on-surface">{{ RolUsuarioLabels[u.rol] }}</td>
              <td class="p-4"><EstadoUsuarioBadge :estado="u.estado" /></td>
              <td class="p-4 font-body-md text-on-surface-variant">{{ formatearFecha(u.fechaCreacion) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="!cargando && filtrados.length > 0" class="md:hidden flex flex-col gap-gutter-mobile">
        <RouterLink
          v-for="u in filtrados"
          :key="u.id"
          :to="{ name: 'usuarios-detalle', params: { id: u.id } }"
          class="bg-surface-container-lowest rounded-xl p-margin-mobile shadow-sm border border-surface-variant flex flex-col gap-stack-sm"
        >
          <div class="flex justify-between items-start">
            <div>
              <h2 class="font-headline-md text-headline-md text-on-surface">{{ u.nombre }}</h2>
              <p class="font-body-md text-body-md text-on-surface-variant">{{ u.email }}</p>
            </div>
            <EstadoUsuarioBadge :estado="u.estado" />
          </div>
          <p class="font-label-md text-label-md text-on-surface-variant">{{ RolUsuarioLabels[u.rol] }} · {{ u.cargo ?? 'Sin cargo' }}</p>
        </RouterLink>
      </div>
    </div>
  </AppShell>
</template>
