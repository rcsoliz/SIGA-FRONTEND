<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import AlertBanner from '@/components/ui/AlertBanner.vue'
import FormField from '@/components/ui/FormField.vue'
import EstadoUsuarioBadge from '@/components/ui/EstadoUsuarioBadge.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import { ApiError } from '@/api/client'
import * as usuariosApi from '@/api/usuarios'
import { EstadoUsuarioLabels, RolUsuarioLabels, TipoPermisoLabels, type EstadoUsuario, type TipoPermiso } from '@/types/enums'
import type { UsuarioDetalleDto } from '@/types/dto'

const route = useRoute()
const id = route.params.id as string

const usuario = ref<UsuarioDetalleDto | null>(null)
const cargando = ref(true)
const errorMensaje = ref<string | null>(null)

async function cargar() {
  cargando.value = true
  errorMensaje.value = null
  try {
    usuario.value = await usuariosApi.obtenerDetalle(id)
  } catch (error) {
    errorMensaje.value = error instanceof ApiError ? error.message : 'Ocurrió un error inesperado.'
  } finally {
    cargando.value = false
  }
}
onMounted(cargar)

function formatearFecha(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-BO', { year: 'numeric', month: 'short', day: 'numeric' })
}

// --- Editar cabecera ---
const editando = ref(false)
const formEdicion = reactive({ nombre: '', cargo: '' as string | null, estado: '' as EstadoUsuario | '' })
const guardandoEdicion = ref(false)
const errorEdicion = ref<string | null>(null)
const estadoOptions = (Object.keys(EstadoUsuarioLabels) as EstadoUsuario[]).map((value) => ({ value, label: EstadoUsuarioLabels[value] }))

function abrirEdicion() {
  if (!usuario.value) return
  formEdicion.nombre = usuario.value.nombre
  formEdicion.cargo = usuario.value.cargo
  formEdicion.estado = usuario.value.estado
  editando.value = true
}

async function guardarEdicion() {
  errorEdicion.value = null
  if (!formEdicion.nombre.trim() || !formEdicion.estado) {
    errorEdicion.value = 'Nombre y estado son obligatorios.'
    return
  }
  guardandoEdicion.value = true
  try {
    await usuariosApi.actualizar(id, { nombre: formEdicion.nombre, cargo: formEdicion.cargo || null, estado: formEdicion.estado as EstadoUsuario })
    editando.value = false
    await cargar()
  } catch (error) {
    errorEdicion.value = error instanceof ApiError ? error.message : 'Ocurrió un error inesperado.'
  } finally {
    guardandoEdicion.value = false
  }
}

// --- Sectores ---
const nuevoSector = reactive({ nombreSector: '', zona: '' as string | null })
const agregandoSector = ref(false)
const errorSector = ref<string | null>(null)
const sectorAEliminar = ref<{ id: string; nombreSector: string } | null>(null)
const eliminandoSector = ref(false)

async function agregarSector() {
  errorSector.value = null
  if (!nuevoSector.nombreSector.trim()) {
    errorSector.value = 'El nombre del sector es obligatorio.'
    return
  }
  agregandoSector.value = true
  try {
    await usuariosApi.asignarSector(id, { nombreSector: nuevoSector.nombreSector, zona: nuevoSector.zona || null })
    nuevoSector.nombreSector = ''
    nuevoSector.zona = ''
    await cargar()
  } catch (error) {
    errorSector.value = error instanceof ApiError ? error.message : 'Ocurrió un error inesperado.'
  } finally {
    agregandoSector.value = false
  }
}

async function confirmarQuitarSector() {
  if (!sectorAEliminar.value) return
  eliminandoSector.value = true
  try {
    await usuariosApi.quitarSector(id, sectorAEliminar.value.id)
    sectorAEliminar.value = null
    await cargar()
  } catch (error) {
    errorMensaje.value = error instanceof ApiError ? error.message : 'Ocurrió un error inesperado.'
  } finally {
    eliminandoSector.value = false
  }
}

// --- Dispositivos ---
const dispositivoARevocar = ref<{ id: string; identificadorDispositivo: string } | null>(null)
const revocando = ref(false)

async function confirmarRevocar() {
  if (!dispositivoARevocar.value) return
  revocando.value = true
  try {
    await usuariosApi.revocarDispositivo(id, dispositivoARevocar.value.id)
    dispositivoARevocar.value = null
    await cargar()
  } catch (error) {
    errorMensaje.value = error instanceof ApiError ? error.message : 'Ocurrió un error inesperado.'
  } finally {
    revocando.value = false
  }
}

// --- Permisos ---
const nuevoPermiso = ref<TipoPermiso | ''>('')
const agregandoPermiso = ref(false)
const errorPermiso = ref<string | null>(null)
const permisoOptions = (Object.keys(TipoPermisoLabels) as TipoPermiso[]).map((value) => ({ value, label: TipoPermisoLabels[value] }))
const permisosDisponibles = computed(() => {
  const yaAsignados = new Set(usuario.value?.permisos.map((p) => p.tipoPermiso) ?? [])
  return permisoOptions.filter((o) => !yaAsignados.has(o.value))
})

async function agregarPermiso() {
  errorPermiso.value = null
  if (!nuevoPermiso.value) {
    errorPermiso.value = 'Seleccione un permiso.'
    return
  }
  agregandoPermiso.value = true
  try {
    await usuariosApi.asignarPermiso(id, { tipoPermiso: nuevoPermiso.value })
    nuevoPermiso.value = ''
    await cargar()
  } catch (error) {
    errorPermiso.value = error instanceof ApiError ? error.message : 'Ocurrió un error inesperado.'
  } finally {
    agregandoPermiso.value = false
  }
}
</script>

<template>
  <AppShell>
    <div class="p-stack-md md:p-8 max-w-4xl mx-auto w-full flex flex-col gap-stack-lg">
      <AlertBanner v-if="errorMensaje" variant="error">{{ errorMensaje }}</AlertBanner>

      <div v-if="cargando" class="h-96 rounded-xl bg-surface-container-lowest border border-outline-variant animate-pulse" />

      <template v-else-if="usuario">
        <!-- Cabecera -->
        <section class="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-6">
          <div v-if="!editando" class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div class="flex items-start gap-4">
              <div class="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container shrink-0">
                <span class="material-symbols-outlined text-[32px]">person</span>
              </div>
              <div>
                <h1 class="font-headline-lg text-headline-lg text-on-surface">{{ usuario.nombre }}</h1>
                <p class="font-body-md text-body-md text-on-surface-variant">{{ usuario.email }}</p>
                <p class="font-body-md text-body-md text-on-surface-variant">{{ usuario.cargo ?? 'Sin cargo asignado' }}</p>
                <div class="flex gap-2 mt-2 flex-wrap items-center">
                  <span class="font-label-md text-label-md px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant">
                    {{ RolUsuarioLabels[usuario.rol] }}
                  </span>
                  <EstadoUsuarioBadge :estado="usuario.estado" />
                  <span class="font-label-md text-label-md text-on-surface-variant">Desde {{ formatearFecha(usuario.fechaCreacion) }}</span>
                </div>
              </div>
            </div>
            <BaseButton variant="secondary" icon="edit" :block="false" class="shrink-0" @click="abrirEdicion">Editar</BaseButton>
          </div>

          <form v-else class="flex flex-col gap-stack-md" @submit.prevent="guardarEdicion">
            <AlertBanner v-if="errorEdicion" variant="error">{{ errorEdicion }}</AlertBanner>
            <FormField v-model="formEdicion.nombre" label="Nombre" required />
            <FormField v-model="formEdicion.cargo" label="Cargo" />
            <FormField v-model="formEdicion.estado" type="select" label="Estado" required :options="estadoOptions" />
            <div class="flex gap-stack-sm">
              <BaseButton variant="secondary" type="button" :block="false" @click="editando = false">Cancelar</BaseButton>
              <BaseButton type="submit" icon="save" :loading="guardandoEdicion" :block="false">Guardar</BaseButton>
            </div>
          </form>
        </section>

        <!-- Sectores Asignados -->
        <section class="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-6 flex flex-col gap-stack-md">
          <h2 class="font-headline-md text-headline-md text-on-surface">Sectores Asignados</h2>
          <div v-if="usuario.sectoresAsignados.length === 0" class="font-body-md text-body-md text-on-surface-variant">
            Sin sectores asignados.
          </div>
          <div v-else class="flex flex-wrap gap-2">
            <span
              v-for="s in usuario.sectoresAsignados"
              :key="s.id"
              class="inline-flex items-center gap-2 pl-3 pr-1.5 py-1.5 rounded-full bg-tertiary-container/20 text-tertiary font-label-md text-label-md border border-tertiary/20"
            >
              <span class="material-symbols-outlined text-[16px]">map</span>
              {{ s.nombreSector }}<span v-if="s.zona" class="text-tertiary/70">· {{ s.zona }}</span>
              <button
                type="button"
                class="w-5 h-5 rounded-full hover:bg-tertiary/20 flex items-center justify-center"
                aria-label="Quitar sector"
                @click="sectorAEliminar = { id: s.id, nombreSector: s.nombreSector }"
              >
                <span class="material-symbols-outlined text-[14px]">close</span>
              </button>
            </span>
          </div>
          <div class="flex flex-col sm:flex-row gap-stack-sm items-start sm:items-end pt-2 border-t border-outline-variant">
            <FormField v-model="nuevoSector.nombreSector" label="Nuevo Sector" placeholder="Ej. Sector Norte" class="flex-1 w-full" />
            <FormField v-model="nuevoSector.zona" label="Zona (opcional)" placeholder="Ej. Zona A" class="flex-1 w-full" />
            <BaseButton icon="add" :block="false" :loading="agregandoSector" class="w-full sm:w-auto" @click="agregarSector">Asignar</BaseButton>
          </div>
          <AlertBanner v-if="errorSector" variant="error">{{ errorSector }}</AlertBanner>
        </section>

        <!-- Dispositivos -->
        <section class="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-6 flex flex-col gap-stack-md">
          <h2 class="font-headline-md text-headline-md text-on-surface">Dispositivos Vinculados</h2>
          <div v-if="usuario.dispositivos.length === 0" class="font-body-md text-body-md text-on-surface-variant">
            Sin dispositivos vinculados.
          </div>
          <div v-for="d in usuario.dispositivos" :key="d.id" class="flex items-center justify-between gap-4 p-4 rounded-lg border border-outline-variant">
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-on-surface-variant">smartphone</span>
              <div>
                <p class="font-body-md text-body-md text-on-surface font-semibold">{{ d.identificadorDispositivo }}</p>
                <p class="font-label-md text-label-md text-on-surface-variant">
                  {{ d.ubicacionActual ?? 'Ubicación desconocida' }} · Última sync: {{ formatearFecha(d.ultimaSincronizacion) }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span
                class="font-label-md text-label-md px-2.5 py-1 rounded-full border"
                :class="d.estado === 'Activo' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-surface-container-high text-on-surface-variant border-outline-variant'"
              >
                {{ d.estado === 'Activo' ? 'Activo' : 'Revocado' }}
              </span>
              <button
                v-if="d.estado === 'Activo'"
                type="button"
                class="text-error font-label-md text-label-md hover:underline"
                @click="dispositivoARevocar = { id: d.id, identificadorDispositivo: d.identificadorDispositivo }"
              >
                Revocar
              </button>
            </div>
          </div>
        </section>

        <!-- Permisos -->
        <section class="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-6 flex flex-col gap-stack-md">
          <h2 class="font-headline-md text-headline-md text-on-surface">Permisos</h2>
          <div v-if="usuario.permisos.length === 0" class="font-body-md text-body-md text-on-surface-variant">Sin permisos asignados.</div>
          <div v-else class="flex flex-wrap gap-2">
            <span
              v-for="p in usuario.permisos"
              :key="p.id"
              class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary-container/50 text-secondary font-label-md text-label-md border border-secondary/20"
            >
              <span class="material-symbols-outlined text-[16px]">verified_user</span>
              {{ TipoPermisoLabels[p.tipoPermiso] }}
            </span>
          </div>
          <div v-if="permisosDisponibles.length > 0" class="flex flex-col sm:flex-row gap-stack-sm items-start sm:items-end pt-2 border-t border-outline-variant">
            <FormField v-model="nuevoPermiso" type="select" label="Nuevo Permiso" :options="permisosDisponibles" class="flex-1 w-full" />
            <BaseButton icon="add" :block="false" :loading="agregandoPermiso" class="w-full sm:w-auto" @click="agregarPermiso">Asignar</BaseButton>
          </div>
          <AlertBanner v-if="errorPermiso" variant="error">{{ errorPermiso }}</AlertBanner>
        </section>
      </template>
    </div>

    <ConfirmDialog
      :open="sectorAEliminar !== null"
      title="Quitar sector"
      :message="`¿Quitar el sector «${sectorAEliminar?.nombreSector}» de este usuario?`"
      confirm-label="Quitar"
      :loading="eliminandoSector"
      @confirm="confirmarQuitarSector"
      @cancel="sectorAEliminar = null"
    />
    <ConfirmDialog
      :open="dispositivoARevocar !== null"
      title="Revocar dispositivo"
      :message="`¿Revocar el acceso del dispositivo «${dispositivoARevocar?.identificadorDispositivo}»? Deberá vincularse nuevamente para sincronizar.`"
      confirm-label="Revocar"
      :loading="revocando"
      @confirm="confirmarRevocar"
      @cancel="dispositivoARevocar = null"
    />
  </AppShell>
</template>
