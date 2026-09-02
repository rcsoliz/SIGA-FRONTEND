<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import AlertBanner from '@/components/ui/AlertBanner.vue'
import FormField from '@/components/ui/FormField.vue'
import GpsCapture from '@/components/ui/GpsCapture.vue'
import SkeletonForm from '@/components/ui/SkeletonForm.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { ApiError } from '@/api/client'
import * as estanciasApi from '@/api/estancias'
import * as invitadoApi from '@/services/invitadoApi'
import { useInvitadoStore } from '@/stores/invitado'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const { mostrar } = useToast()
const invitado = useInvitadoStore()

const id = computed(() => route.params.id as string | undefined)
const esEdicion = computed(() => Boolean(id.value))

const form = reactive({
  nombre: '',
  propietario: '',
  representante: '' as string | null,
  telefono: '' as string | null,
  renspa: '' as string | null,
  hectareasTotales: null as number | null,
  departamento: '' as string | null,
  provincia: '' as string | null,
  municipio: '' as string | null,
  latitud: null as number | null,
  longitud: null as number | null,
})

const cargandoDetalle = ref(esEdicion.value)
const guardando = ref(false)
const errorMensaje = ref<string | null>(null)

function onCoordenadas(lat: number, lng: number) {
  form.latitud = lat
  form.longitud = lng
}

async function cargarDetalle() {
  if (!id.value) return
  cargandoDetalle.value = true
  errorMensaje.value = null
  try {
    const e = await estanciasApi.obtener(id.value)
    form.nombre = e.nombre
    form.propietario = e.propietario
    form.representante = e.representante
    form.telefono = e.telefono
    form.renspa = e.renspa
    form.hectareasTotales = e.hectareasTotales
    form.departamento = e.departamento
    form.provincia = e.provincia
    form.municipio = e.municipio
    form.latitud = e.latitud
    form.longitud = e.longitud
  } catch (error) {
    errorMensaje.value = error instanceof ApiError ? error.message : 'Ocurrió un error inesperado.'
  } finally {
    cargandoDetalle.value = false
  }
}

onMounted(cargarDetalle)

async function guardar() {
  errorMensaje.value = null

  if (!form.nombre.trim() || !form.propietario.trim()) {
    errorMensaje.value = 'Nombre y Propietario son obligatorios.'
    return
  }
  if (!esEdicion.value && (form.latitud === null || form.longitud === null)) {
    errorMensaje.value = 'Debe capturar la ubicación GPS antes de guardar.'
    return
  }

  guardando.value = true
  try {
    if (esEdicion.value) {
      await estanciasApi.actualizar(id.value!, {
        nombre: form.nombre,
        propietario: form.propietario,
        representante: form.representante,
        telefono: form.telefono,
        renspa: form.renspa,
        hectareasTotales: form.hectareasTotales,
        departamento: form.departamento,
        provincia: form.provincia,
        municipio: form.municipio,
      })
    } else {
      const payload = {
        nombre: form.nombre,
        propietario: form.propietario,
        representante: form.representante,
        telefono: form.telefono,
        latitud: form.latitud!,
        longitud: form.longitud!,
        renspa: form.renspa,
        hectareasTotales: form.hectareasTotales,
        departamento: form.departamento,
        provincia: form.provincia,
        municipio: form.municipio,
        fechaCreacionLocal: new Date().toISOString(),
      }
      if (invitado.activo) await invitadoApi.crearEstanciaLocal(payload)
      else await estanciasApi.crear(payload)
    }
    mostrar(esEdicion.value ? 'Estancia actualizada correctamente.' : 'Estancia creada correctamente.')
    await router.push({ name: 'estancias' })
  } catch (error) {
    errorMensaje.value = error instanceof ApiError ? error.message : 'Ocurrió un error inesperado.'
  } finally {
    guardando.value = false
  }
}

function cancelar() {
  router.push({ name: 'estancias' })
}
</script>

<template>
  <AppShell>
    <div class="p-margin-mobile md:p-6 lg:p-8 pb-stack-lg md:max-w-5xl md:mx-auto w-full">
      <div class="mb-stack-lg md:mb-8">
        <div class="flex items-center gap-2 text-primary md:hidden mb-1">
          <AppIcon name="home_work" :size="18" />
          <span class="text-label-md font-label-md tracking-widest uppercase">
            {{ esEdicion ? 'Editar Registro' : 'Nuevo Registro' }}
          </span>
        </div>
        <h1 class="font-headline-lg text-headline-lg text-on-surface font-bold">
          {{ esEdicion ? 'Editar Estancia' : 'Registro de Estancia' }}
        </h1>
        <p class="font-body-md text-body-md text-on-surface-variant mt-1">
          Complete los datos generales del establecimiento agropecuario.
        </p>
      </div>

      <AlertBanner v-if="errorMensaje" variant="error" class="mb-stack-md">{{ errorMensaje }}</AlertBanner>

      <SkeletonForm v-if="cargandoDetalle" :campos="9" />

      <form
        v-else
        class="flex flex-col gap-gutter-mobile md:gap-stack-lg md:bg-surface-container-lowest md:rounded-xl md:shadow-sm md:border md:border-outline-variant md:p-6 lg:p-8"
        @submit.prevent="guardar"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-gutter-mobile md:gap-y-6">
          <FormField v-model="form.nombre" label="Nombre de la estancia" required placeholder="Ej. La Candelaria" />
          <FormField v-model="form.propietario" label="Propietario" required placeholder="Nombre o Razón Social" />
          <FormField v-model="form.representante" label="Representante" placeholder="Nombre del encargado o apoderado" />
          <FormField v-model="form.telefono" label="Teléfono" type="tel" placeholder="Ej. 70112233" />
          <FormField v-model="form.renspa" label="RENSPA" placeholder="Número de registro oficial" />
          <FormField
            v-model="form.hectareasTotales"
            label="Hectáreas totales"
            type="number"
            step="0.01"
            suffix="ha"
            placeholder="0.00"
          />
        </div>

        <hr class="border-outline-variant hidden md:block" />

        <div>
          <h3 class="font-headline-md text-headline-md text-on-surface mb-stack-sm md:mb-4 hidden md:block">
            Ubicación Territorial
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-gutter-mobile md:gap-y-6">
            <FormField v-model="form.departamento" label="Departamento" placeholder="Ej. Santa Cruz" />
            <FormField v-model="form.provincia" label="Provincia" placeholder="Ej. Andrés Ibáñez" />
            <FormField v-model="form.municipio" label="Municipio" placeholder="Ej. Santa Cruz de la Sierra" />
          </div>
        </div>

        <GpsCapture
          v-if="!esEdicion"
          :latitud="form.latitud"
          :longitud="form.longitud"
          required
          @update:coordenadas="onCoordenadas"
        />
        <AlertBanner v-else variant="info">
          La ubicación GPS se define solo al crear la estancia y no puede modificarse aquí.
        </AlertBanner>

        <div class="flex flex-col-reverse md:flex-row md:justify-end gap-stack-sm md:gap-4 md:pt-6 md:border-t md:border-outline-variant mt-2">
          <BaseButton variant="secondary" type="button" class="md:w-auto" @click="cancelar">Cancelar</BaseButton>
          <BaseButton type="submit" :loading="guardando" class="md:w-auto">
            {{ esEdicion ? 'Guardar Cambios' : 'Guardar Estancia' }}
          </BaseButton>
        </div>
      </form>
    </div>
  </AppShell>
</template>
