<script setup lang="ts">
// Nota de alcance: el mockup de "Reporte de Captación" incluye una tabla
// combinada de "Bitácora Recurrente de Eventos" — eso requiere el endpoint
// unificado de Maestro de Registros (Etapa 5, 🔒 Administrador, no apto para
// Captador). Mientras tanto, se accede a cada bitácora por separado desde
// los 4 accesos directos de abajo.
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import AlertBanner from '@/components/ui/AlertBanner.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import EstadoCaptacionBadge from '@/components/ui/EstadoCaptacionBadge.vue'
import EstadoSanitarioBadge from '@/components/ui/EstadoSanitarioBadge.vue'
import AppIcon, { type NombreIcono } from '@/components/ui/AppIcon.vue'
import autoTable from 'jspdf-autotable'
import { useAuthStore } from '@/stores/auth'
import { useInvitadoStore } from '@/stores/invitado'
import { useToast } from '@/composables/useToast'
import { ApiError } from '@/api/client'
import * as captacionesApi from '@/api/captaciones'
import * as invitadoApi from '@/services/invitadoApi'
import { crearDocumentoPdf, nombreArchivoPdf, ALTO_ENCABEZADO } from '@/utils/pdfReporte'
import {
  CategoriaGanadoLabels,
  EstadoCaptacionLabels,
  EstadoSanitarioLabels,
  TipoManejoAlimentarioLabels,
} from '@/types/enums'
import type { CaptacionGanadoDto } from '@/types/dto'

const route = useRoute()
const router = useRouter()
const id = route.params.id as string
const auth = useAuthStore()
const invitado = useInvitadoStore()
const { mostrar } = useToast()
// Eliminar: 🔒 Administrador (CaptacionesController.cs — [Authorize(Roles = "Administrador")] en DELETE)
const puedeEliminar = computed(() => auth.rol === 'Administrador')

const captacion = ref<CaptacionGanadoDto | null>(null)
const cargando = ref(true)
const errorMensaje = ref<string | null>(null)

function formatearFecha(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-BO', { year: 'numeric', month: 'short', day: 'numeric' })
}

const bitacoraLinks: { routeName: string; titulo: string; icono: NombreIcono }[] = [
  { routeName: 'bitacora-pesaje', titulo: 'Pesaje', icono: 'scale' },
  { routeName: 'bitacora-sanitario', titulo: 'Sanitario', icono: 'vaccines' },
  { routeName: 'bitacora-movimiento', titulo: 'Movimiento', icono: 'local_shipping' },
  { routeName: 'bitacora-alimentacion', titulo: 'Alimentación', icono: 'grass' },
]

async function cargar() {
  cargando.value = true
  errorMensaje.value = null
  try {
    captacion.value = invitado.activo
      ? await invitadoApi.obtenerCaptacionLocal(id)
      : await captacionesApi.obtener(id)
  } catch (error) {
    errorMensaje.value = error instanceof ApiError ? error.message : 'Ocurrió un error inesperado.'
  } finally {
    cargando.value = false
  }
}
onMounted(cargar)

// --- Eliminar ---
const confirmandoEliminar = ref(false)
const eliminando = ref(false)
const errorEliminar = ref<string | null>(null)

function pedirConfirmacionEliminar() {
  confirmandoEliminar.value = true
  errorEliminar.value = null
}

function cancelarEliminacion() {
  if (eliminando.value) return
  confirmandoEliminar.value = false
}

async function confirmarEliminacion() {
  if (!captacion.value) return
  eliminando.value = true
  errorEliminar.value = null
  try {
    await captacionesApi.eliminar(captacion.value.id)
    mostrar('Captación eliminada correctamente.')
    await router.push({ name: 'captaciones', params: { estanciaId: captacion.value.estanciaId } })
  } catch (error) {
    errorEliminar.value = error instanceof ApiError ? error.message : 'Ocurrió un error inesperado.'
  } finally {
    eliminando.value = false
  }
}

function exportarPdf() {
  const c = captacion.value
  if (!c) return

  const { doc, dibujarEncabezado, finalizarConPiePagina, guardar, opcionesTablaBase } = crearDocumentoPdf(
    c.nombre,
    `${formatearFecha(c.fecha)} · ${c.potrero ?? 'Sin potrero asignado'}`,
  )
  dibujarEncabezado()

  let y = ALTO_ENCABEZADO + 34
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(25, 28, 29)
  doc.text('Resumen', 40, y)
  y += 18

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(64, 73, 67)
  doc.text(`Estado: ${EstadoCaptacionLabels[c.estado]}   ·   Estado Sanitario: ${EstadoSanitarioLabels[c.estadoSanitario]}`, 40, y)
  y += 16
  doc.text(
    `Cabezas Totales: ${c.totalCabezas}   ·   Peso Estimado Total: ${c.pesoEstimadoTotal.toLocaleString('es-BO')} kg   ·   Días en Potrero: ${c.diasEnPotrero ?? '—'}`,
    40,
    y,
  )
  y += 16
  if (c.observaciones) {
    doc.text(`Observaciones: ${c.observaciones}`, 40, y)
    y += 16
  }
  y += 10

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(25, 28, 29)
  doc.text('Detalle por Categoría', 40, y)
  y += 10

  autoTable(doc, {
    ...opcionesTablaBase,
    startY: y,
    head: [['Categoría', 'Raza', 'Cabezas', 'Peso Prom. (kg)', 'Alimentación', 'Est. Faena', 'Peso Lote (kg)']],
    body: c.detalles.map((d) => [
      CategoriaGanadoLabels[d.categoria],
      d.raza ?? '—',
      String(d.cantidadCabezas),
      d.pesoPromedioEstimadoKg !== null ? String(d.pesoPromedioEstimadoKg) : '—',
      TipoManejoAlimentarioLabels[d.sistemaAlimentacion],
      formatearFecha(d.fechaEstimadaFaena),
      d.pesoLoteCalculado.toLocaleString('es-BO'),
    ]),
  })

  finalizarConPiePagina()
  guardar(nombreArchivoPdf(`captacion-${c.nombre}`))
}

const metricas = computed(() => {
  if (!captacion.value) return null
  const c = captacion.value
  const filas: { icon: NombreIcono; label: string; value: string }[] = [
    { icon: 'pets', label: 'Cabezas Totales', value: String(c.totalCabezas) },
    { icon: 'scale', label: 'Peso Estimado Total', value: `${c.pesoEstimadoTotal.toLocaleString('es-BO')} kg` },
    { icon: 'calendar_month', label: 'Días en Potrero', value: c.diasEnPotrero !== null ? String(c.diasEnPotrero) : '—' },
  ]
  return filas
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
        <AppIcon name="arrow_back" :size="18" />
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
          <div class="flex items-center gap-2 w-full md:w-auto">
            <BaseButton variant="secondary" size="sm" icon="download" pill :block="false" @click="exportarPdf">
              Exportar PDF
            </BaseButton>
            <RouterLink
              v-if="!invitado.activo"
              :to="{ name: 'captaciones-editar', params: { id: captacion.id } }"
              class="flex-1 md:flex-none"
            >
              <BaseButton icon="edit" pill class="md:w-auto">Editar Captación</BaseButton>
            </RouterLink>
            <button
              v-if="puedeEliminar && !invitado.activo"
              type="button"
              class="w-touch-target-min h-touch-target-min shrink-0 rounded-full inline-flex items-center justify-center text-on-surface-variant border-2 border-outline-variant hover:bg-error-container hover:text-error hover:border-error/20 transition-colors"
              title="Eliminar captación"
              aria-label="Eliminar captación"
              @click="pedirConfirmacionEliminar"
            >
              <AppIcon name="delete" :size="20" />
            </button>
          </div>
        </section>

        <!-- Métricas -->
        <section class="grid grid-cols-1 sm:grid-cols-3 gap-gutter-mobile md:gap-6">
          <div
            v-for="m in metricas"
            :key="m.label"
            class="bg-surface-container-low rounded-xl p-6 shadow-sm border border-outline-variant/30 flex flex-col justify-between"
          >
            <div class="flex items-center gap-3 mb-4 text-on-surface-variant">
              <AppIcon :name="m.icon" :size="20" class="text-primary" />
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
            <AppIcon :name="b.icono" :size="24" class="text-primary" />
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
                <span class="font-label-md text-label-md bg-surface-container-high px-2 py-1 rounded text-on-surface-variant">
                  {{ TipoManejoAlimentarioLabels[d.sistemaAlimentacion] }}
                </span>
                <span class="font-label-md text-label-md bg-surface-container-high px-2 py-1 rounded text-on-surface-variant">
                  Faena: {{ formatearFecha(d.fechaEstimadaFaena) }}
                </span>
              </div>
            </div>
          </div>
        </section>
      </template>
    </div>

    <ConfirmDialog
      :open="confirmandoEliminar"
      title="Eliminar captación"
      :message="`¿Está seguro de eliminar «${captacion?.nombre}»? Esta acción no se puede deshacer.`"
      confirm-label="Eliminar"
      :loading="eliminando"
      :error-message="errorEliminar"
      @confirm="confirmarEliminacion"
      @cancel="cancelarEliminacion"
    />
  </AppShell>
</template>
