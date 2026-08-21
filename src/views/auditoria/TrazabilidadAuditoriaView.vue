<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import AppShell from '@/components/layout/AppShell.vue'
import AlertBanner from '@/components/ui/AlertBanner.vue'
import { ApiError } from '@/api/client'
import * as auditoriaApi from '@/api/auditoria'
import * as usuariosApi from '@/api/usuarios'
import { AccionAuditoriaLabels } from '@/types/enums'
import type { ModuloAuditoria } from '@/types/enums'
import type { LogAuditoriaDto, UsuarioDto } from '@/types/dto'

const MODULOS: ModuloAuditoria[] = ['Usuario', 'Estancia', 'CaptacionGanado', 'Pesaje', 'Sanitario', 'Movimiento', 'Alimentacion']

const ACCION_ICONOS: Record<string, string> = { Creacion: 'add_circle', Modificacion: 'edit', Eliminacion: 'delete' }
const ACCION_ESTILOS: Record<string, string> = {
  Creacion: 'bg-primary/10 text-primary border-primary/20',
  Modificacion: 'bg-secondary-container/50 text-secondary border-secondary/20',
  Eliminacion: 'bg-error-container text-on-error-container border-error/20',
}

const filtros = reactive({ desde: '', hasta: '', usuarioId: '', modulo: '' })
const usuarios = ref<UsuarioDto[]>([])
const logs = ref<LogAuditoriaDto[]>([])
const cargando = ref(true)
const errorMensaje = ref<string | null>(null)

function formatearFechaHora(iso: string): string {
  return new Date(iso).toLocaleString('es-BO', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

async function cargar() {
  cargando.value = true
  errorMensaje.value = null
  try {
    logs.value = await auditoriaApi.buscar({
      desde: filtros.desde ? new Date(filtros.desde).toISOString() : undefined,
      hasta: filtros.hasta ? new Date(filtros.hasta).toISOString() : undefined,
      usuarioId: filtros.usuarioId || undefined,
      modulo: filtros.modulo || undefined,
    })
  } catch (error) {
    errorMensaje.value = error instanceof ApiError ? error.message : 'Ocurrió un error inesperado.'
  } finally {
    cargando.value = false
  }
}

function limpiarFiltros() {
  filtros.desde = ''
  filtros.hasta = ''
  filtros.usuarioId = ''
  filtros.modulo = ''
  cargar()
}

onMounted(async () => {
  cargar()
  try {
    usuarios.value = await usuariosApi.listar()
  } catch {
    // El filtro por usuario es un extra opcional; si falla, el resto de la pantalla sigue funcionando.
  }
})
</script>

<template>
  <AppShell>
    <div class="p-stack-md md:p-stack-lg flex flex-col gap-stack-md max-w-7xl mx-auto w-full">
      <div>
        <h1 class="font-headline-lg text-headline-lg text-on-surface">Trazabilidad y Auditoría</h1>
        <p class="font-body-md text-body-md text-on-surface-variant mt-1">Registro de acciones realizadas en el sistema.</p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <select v-model="filtros.usuarioId" class="h-10 px-3 rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface font-body-md text-body-md" @change="cargar">
          <option value="">Todos los usuarios</option>
          <option v-for="u in usuarios" :key="u.id" :value="u.id">{{ u.nombre }}</option>
        </select>
        <select v-model="filtros.modulo" class="h-10 px-3 rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface font-body-md text-body-md" @change="cargar">
          <option value="">Todos los módulos</option>
          <option v-for="m in MODULOS" :key="m" :value="m">{{ m }}</option>
        </select>
        <input v-model="filtros.desde" type="date" class="h-10 px-3 rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface font-body-md text-body-md" @change="cargar" />
        <span class="text-on-surface-variant font-body-md">—</span>
        <input v-model="filtros.hasta" type="date" class="h-10 px-3 rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface font-body-md text-body-md" @change="cargar" />
        <button
          v-if="filtros.desde || filtros.hasta || filtros.usuarioId || filtros.modulo"
          type="button"
          class="text-primary font-label-md text-label-md hover:underline ml-1"
          @click="limpiarFiltros"
        >
          Limpiar Filtros
        </button>
      </div>

      <AlertBanner v-if="errorMensaje" variant="error">{{ errorMensaje }}</AlertBanner>

      <div v-if="cargando" class="flex flex-col gap-gutter-mobile">
        <div v-for="n in 5" :key="n" class="h-16 rounded-xl bg-surface-container-lowest border border-outline-variant animate-pulse" />
      </div>

      <div v-else-if="logs.length === 0" class="flex flex-col items-center justify-center gap-stack-sm py-16 bg-surface-container-lowest rounded-xl border border-outline-variant">
        <span class="material-symbols-outlined text-[48px] text-outline-variant">history_toggle_off</span>
        <p class="font-body-lg text-body-lg text-on-surface-variant">No hay eventos de auditoría con estos filtros.</p>
      </div>

      <div v-else class="hidden md:block bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-surface-container-low border-b border-outline-variant">
              <th class="p-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Fecha y Hora</th>
              <th class="p-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Usuario</th>
              <th class="p-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Acción</th>
              <th class="p-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Módulo</th>
              <th class="p-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Detalle</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-outline-variant">
            <tr v-for="log in logs" :key="log.id" class="hover:bg-surface-container-low transition-colors">
              <td class="p-4 font-body-md text-on-surface-variant whitespace-nowrap">{{ formatearFechaHora(log.fechaHora) }}</td>
              <td class="p-4 font-body-md text-on-surface">{{ log.usuarioNombre }}</td>
              <td class="p-4">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-label-md text-label-md border" :class="ACCION_ESTILOS[log.accion]">
                  <span class="material-symbols-outlined text-[16px]">{{ ACCION_ICONOS[log.accion] }}</span>
                  {{ AccionAuditoriaLabels[log.accion] }}
                </span>
              </td>
              <td class="p-4 font-body-md text-on-surface-variant">{{ log.modulo }}</td>
              <td class="p-4 font-body-md text-on-surface">{{ log.detalle ?? '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="!cargando && logs.length > 0" class="md:hidden flex flex-col gap-gutter-mobile">
        <div v-for="log in logs" :key="log.id" class="bg-surface-container-lowest rounded-xl p-margin-mobile shadow-sm border border-outline-variant flex flex-col gap-stack-sm">
          <div class="flex justify-between items-start">
            <span class="font-label-md text-label-md text-on-surface-variant">{{ formatearFechaHora(log.fechaHora) }}</span>
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-label-md text-label-md border" :class="ACCION_ESTILOS[log.accion]">
              <span class="material-symbols-outlined text-[14px]">{{ ACCION_ICONOS[log.accion] }}</span>
              {{ AccionAuditoriaLabels[log.accion] }}
            </span>
          </div>
          <p class="font-body-md text-body-md text-on-surface font-semibold">{{ log.usuarioNombre }} · {{ log.modulo }}</p>
          <p v-if="log.detalle" class="font-body-md text-body-md text-on-surface-variant">{{ log.detalle }}</p>
        </div>
      </div>
    </div>
  </AppShell>
</template>
