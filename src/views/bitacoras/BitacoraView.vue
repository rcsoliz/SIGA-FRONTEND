<script setup lang="ts">
// Vista única para las 4 bitácoras (Pesaje/Sanitario/Movimiento/Alimentación),
// parametrizada por `tipo` — ver src/config/bitacoras.ts para el porqué.
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import AlertBanner from '@/components/ui/AlertBanner.vue'
import FormField from '@/components/ui/FormField.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { useAuthStore } from '@/stores/auth'
import { useInvitadoStore } from '@/stores/invitado'
import { useToast } from '@/composables/useToast'
import { ApiError } from '@/api/client'
import * as captacionesApi from '@/api/captaciones'
import * as invitadoApi from '@/services/invitadoApi'
import { BITACORAS, type TipoBitacora } from '@/config/bitacoras'
import type { CaptacionGanadoDto } from '@/types/dto'

const props = defineProps<{ tipo: TipoBitacora }>()
const config = computed(() => BITACORAS[props.tipo])

const route = useRoute()
const captacionId = computed(() => route.params.captacionId as string)

const auth = useAuthStore()
const invitado = useInvitadoStore()
const { mostrar } = useToast()
const puedeCrear = computed(() => (config.value.soloCaptador ? auth.rol === 'Captador' || invitado.activo : true))

const captacion = ref<CaptacionGanadoDto | null>(null)
const historial = ref<any[]>([])
const cargando = ref(true)
const errorMensaje = ref<string | null>(null)

const form = reactive<Record<string, any>>({})

function inicializarFormulario() {
  for (const key of Object.keys(form)) delete form[key]
  for (const campo of config.value.campos) {
    form[campo.key] = campo.key === 'fecha' ? new Date().toISOString().slice(0, 10) : campo.type === 'number' ? null : ''
  }
}

async function cargar() {
  cargando.value = true
  errorMensaje.value = null
  inicializarFormulario()
  try {
    const [c, lista] = invitado.activo
      ? await Promise.all([
          invitadoApi.obtenerCaptacionLocal(captacionId.value),
          invitadoApi.listarBitacoraLocalPorCaptacion(props.tipo, captacionId.value),
        ])
      : await Promise.all([captacionesApi.obtener(captacionId.value), config.value.listar(captacionId.value)])
    captacion.value = c
    historial.value = lista
  } catch (error) {
    errorMensaje.value = error instanceof ApiError ? error.message : 'Ocurrió un error inesperado.'
  } finally {
    cargando.value = false
  }
}

onMounted(cargar)

const guardando = ref(false)
const errorForm = ref<string | null>(null)

async function registrar() {
  errorForm.value = null
  for (const campo of config.value.campos) {
    if (campo.required && !form[campo.key] && form[campo.key] !== 0) {
      errorForm.value = `El campo "${campo.label}" es obligatorio.`
      return
    }
  }

  guardando.value = true
  try {
    const payload = config.value.construirPayload(form, captacionId.value, new Date().toISOString())
    const creado = invitado.activo
      ? await invitadoApi.crearBitacoraLocal(props.tipo, payload)
      : await config.value.crear(payload)
    historial.value = [creado, ...historial.value]
    mostrar('Registro guardado correctamente.')
    inicializarFormulario()
  } catch (error) {
    errorForm.value = error instanceof ApiError ? error.message : 'Ocurrió un error inesperado.'
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <AppShell>
    <div class="p-margin-mobile md:p-stack-lg max-w-7xl mx-auto w-full flex flex-col gap-stack-md">
      <RouterLink
        v-if="captacion"
        :to="{ name: 'captaciones-reporte', params: { id: captacion.id } }"
        class="inline-flex items-center gap-1 text-primary font-label-md text-label-md w-fit"
      >
        <AppIcon name="arrow_back" :size="18" />
        Volver al Reporte
      </RouterLink>

      <div>
        <h1 class="font-headline-lg text-headline-lg text-on-background mb-1">{{ config.titulo }}</h1>
        <p class="font-body-md text-body-md text-on-surface-variant">
          {{ captacion ? captacion.nombre : 'Cargando captación…' }} — {{ config.descripcion }}
        </p>
      </div>

      <AlertBanner v-if="errorMensaje" variant="error">{{ errorMensaje }}</AlertBanner>

      <div v-if="cargando" class="h-96 rounded-xl bg-surface-container-lowest border border-outline-variant animate-pulse" />

      <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-stack-lg">
        <!-- Formulario -->
        <div class="lg:col-span-4 flex flex-col gap-stack-md">
          <div v-if="puedeCrear" class="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 p-stack-md">
            <h3 class="font-headline-md text-headline-md mb-stack-md flex items-center gap-2 text-primary">
              <AppIcon name="add_circle" :size="20" />
              Nuevo Registro
            </h3>
            <form class="flex flex-col gap-gutter-mobile" @submit.prevent="registrar">
              <FormField
                v-for="campo in config.campos"
                :key="campo.key"
                v-model="form[campo.key]"
                :label="campo.label"
                :type="campo.type"
                :required="campo.required"
                :options="campo.options"
                :suffix="campo.suffix"
                :step="campo.step"
              />
              <AlertBanner v-if="errorForm" variant="error">{{ errorForm }}</AlertBanner>
              <BaseButton type="submit" :loading="guardando">Registrar</BaseButton>
            </form>
          </div>
          <AlertBanner v-else variant="info">
            Solo el rol Captador puede crear registros de {{ config.titulo.toLowerCase() }}.
          </AlertBanner>
        </div>

        <!-- Historial -->
        <div class="lg:col-span-8 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
          <div class="p-stack-md border-b border-outline-variant/30 flex items-center gap-2">
            <AppIcon name="history" :size="20" class="text-primary" />
            <h3 class="font-headline-md text-headline-md text-on-background">Historial</h3>
          </div>

          <div v-if="historial.length === 0" class="p-8 text-center font-body-md text-body-md text-on-surface-variant">
            No hay registros aún.
          </div>

          <!-- Desktop table -->
          <div v-else class="hidden md:block overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-surface-container border-b border-outline-variant/50">
                  <th
                    v-for="col in config.columnas"
                    :key="col.key"
                    class="p-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider"
                    :class="col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'"
                  >
                    {{ col.label }}
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-outline-variant/20">
                <tr v-for="row in historial" :key="row.id" class="hover:bg-surface-variant/30 transition-colors">
                  <td
                    v-for="col in config.columnas"
                    :key="col.key"
                    class="p-4 font-body-md text-body-md text-on-background"
                    :class="col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'"
                  >
                    {{ config.formatearCelda(row, col.key) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Mobile cards -->
          <div v-if="historial.length > 0" class="md:hidden flex flex-col gap-gutter-mobile p-margin-mobile">
            <div
              v-for="(row, idx) in historial"
              :key="row.id"
              class="bg-surface p-margin-mobile rounded-lg border border-outline-variant shadow-sm flex flex-col gap-2 relative overflow-hidden"
            >
              <div class="absolute top-0 left-0 w-1 h-full" :class="idx === 0 ? 'bg-primary' : 'bg-outline-variant'" />
              <div class="flex justify-between items-start">
                <span class="font-label-md text-label-md text-on-surface-variant">{{ config.formatearCelda(row, 'fecha') }}</span>
                <span class="font-headline-md text-headline-md" :class="idx === 0 ? 'text-primary' : 'text-on-surface'">
                  {{ config.resumenPrincipal(row) }}
                </span>
              </div>
              <span class="text-body-md text-on-surface-variant">{{ config.resumenSecundario(row) }}</span>
              <p v-if="row.observaciones" class="font-body-md text-body-md text-on-surface-variant italic mt-1 border-t border-surface-variant/50 pt-2">
                "{{ row.observaciones }}"
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppShell>
</template>
