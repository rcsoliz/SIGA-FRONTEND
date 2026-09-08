<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import AppShell from '@/components/layout/AppShell.vue'
import AlertBanner from '@/components/ui/AlertBanner.vue'
import SkeletonTable from '@/components/ui/SkeletonTable.vue'
import SkeletonCard from '@/components/ui/SkeletonCard.vue'
import Pagination from '@/components/ui/Pagination.vue'
import AppIcon, { type NombreIcono } from '@/components/ui/AppIcon.vue'
import DataTable from '@/components/ui/DataTable.vue'
import { ApiError } from '@/api/client'
import * as auditoriaApi from '@/api/auditoria'
import * as usuariosApi from '@/api/usuarios'
import { usePaginacion } from '@/composables/usePaginacion'
import { AccionAuditoriaLabels } from '@/types/enums'
import type { ModuloAuditoria } from '@/types/enums'
import type { LogAuditoriaDto, UsuarioDto } from '@/types/dto'
import type { ColumnaTabla } from '@/types/dataTable'

const MODULOS: ModuloAuditoria[] = ['Usuario', 'Estancia', 'CaptacionGanado', 'Pesaje', 'Sanitario', 'Movimiento', 'Alimentacion']

const ACCION_ICONOS: Record<string, NombreIcono> = { Creacion: 'add_circle', Modificacion: 'edit', Eliminacion: 'delete' }
const ACCION_ESTILOS: Record<string, string> = {
  Creacion: 'bg-primary/10 text-primary border-primary/20',
  Modificacion: 'bg-secondary-container/50 text-secondary border-secondary/20',
  Eliminacion: 'bg-error-container text-on-error-container border-error/20',
}

const columnas: ColumnaTabla<LogAuditoriaDto>[] = [
  { clave: 'fechaHora', etiqueta: 'Fecha y Hora' },
  { clave: 'usuarioNombre', etiqueta: 'Usuario' },
  { clave: 'accion', etiqueta: 'Acción' },
  { clave: 'modulo', etiqueta: 'Módulo', ocultarEnTablet: true },
  { clave: 'detalle', etiqueta: 'Detalle', ocultarEnTablet: true },
]

const filtros = reactive({ desde: '', hasta: '', usuarioId: '', modulo: '' })
const usuarios = ref<UsuarioDto[]>([])
const logs = ref<LogAuditoriaDto[]>([])
const cargando = ref(true)
const errorMensaje = ref<string | null>(null)

const { paginaActual, totalPaginas, itemsPagina, porPagina } = usePaginacion(logs, 8)

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
    <div class="p-stack-md md:p-stack-lg flex flex-col gap-stack-md w-full">
      <div>
        <h1 class="font-headline-lg text-headline-lg text-on-surface">Trazabilidad y Auditoría</h1>
        <p class="font-body-md text-body-md text-on-surface-variant mt-1">Registro de acciones realizadas en el sistema.</p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <div class="relative">
          <select
            v-model="filtros.usuarioId"
            class="h-10 pl-3 pr-8 rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface font-body-md text-body-md appearance-none"
            @change="cargar"
          >
            <option value="">Todos los usuarios</option>
            <option v-for="u in usuarios" :key="u.id" :value="u.id">{{ u.nombre }}</option>
          </select>
          <AppIcon name="expand_more" :size="16" class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline" />
        </div>
        <div class="relative">
          <select
            v-model="filtros.modulo"
            class="h-10 pl-3 pr-8 rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface font-body-md text-body-md appearance-none"
            @change="cargar"
          >
            <option value="">Todos los módulos</option>
            <option v-for="m in MODULOS" :key="m" :value="m">{{ m }}</option>
          </select>
          <AppIcon name="expand_more" :size="16" class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline" />
        </div>
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

      <template v-if="cargando">
        <SkeletonTable class="hidden md:block" :columnas="5" :filas="5" />
        <SkeletonCard class="md:hidden" :cantidad="5" />
      </template>

      <div v-else-if="logs.length === 0" class="flex flex-col items-center justify-center gap-stack-sm py-16 bg-surface-container-lowest rounded-xl border border-outline-variant">
        <AppIcon name="history_toggle_off" :size="44" class="text-outline-variant" />
        <p class="font-body-lg text-body-lg text-on-surface-variant">No hay eventos de auditoría con estos filtros.</p>
      </div>

      <DataTable
        v-else
        :columnas="columnas"
        :items="itemsPagina"
        :clave-fila="(log: LogAuditoriaDto) => log.id"
        :titulo-movil="(log: LogAuditoriaDto) => `${log.usuarioNombre} · ${log.modulo}`"
        :subtitulo-movil="(log: LogAuditoriaDto) => formatearFechaHora(log.fechaHora)"
      >
        <template #celda-fechaHora="{ item }">
          <span class="whitespace-nowrap">{{ formatearFechaHora(item.fechaHora) }}</span>
        </template>
        <template #celda-accion="{ item }">
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-label-md text-label-md border" :class="ACCION_ESTILOS[item.accion]">
            <AppIcon :name="ACCION_ICONOS[item.accion]" :size="16" />
            {{ AccionAuditoriaLabels[item.accion] }}
          </span>
        </template>
        <template #celda-detalle="{ item }">{{ item.detalle ?? '—' }}</template>

        <template #extra-movil="{ item }">
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-label-md text-label-md border w-fit" :class="ACCION_ESTILOS[item.accion]">
            <AppIcon :name="ACCION_ICONOS[item.accion]" :size="14" />
            {{ AccionAuditoriaLabels[item.accion] }}
          </span>
          <p v-if="item.detalle" class="font-body-md text-body-md text-on-surface-variant">{{ item.detalle }}</p>
        </template>
      </DataTable>

      <Pagination
        v-if="!cargando && logs.length > 0"
        v-model="paginaActual"
        :total-paginas="totalPaginas"
        :total="logs.length"
        :por-pagina="porPagina"
      />
    </div>
  </AppShell>
</template>
