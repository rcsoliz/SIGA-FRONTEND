<script setup lang="ts">
// Solo cabecera: UpdateCaptacionGanadoDto no incluye detalles ni coordenadas
// (esos se gestionan en Registro/Etapa 4), pero sí permite editar Estado y
// EstadoSanitario, a diferencia del Create donde ambos los fija el backend.
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import AlertBanner from '@/components/ui/AlertBanner.vue'
import FormField from '@/components/ui/FormField.vue'
import SkeletonForm from '@/components/ui/SkeletonForm.vue'
import { ApiError } from '@/api/client'
import { useToast } from '@/composables/useToast'
import * as captacionesApi from '@/api/captaciones'
import { EstadoCaptacionLabels, EstadoSanitarioLabels, type EstadoCaptacion, type EstadoSanitario } from '@/types/enums'

const route = useRoute()
const router = useRouter()
const id = route.params.id as string
const { mostrar } = useToast()

const form = reactive({
  nombre: '',
  observaciones: '' as string | null,
  potrero: '' as string | null,
  estado: '' as EstadoCaptacion | '',
  estadoSanitario: '' as EstadoSanitario | '',
})

const estadoOptions = (Object.keys(EstadoCaptacionLabels) as EstadoCaptacion[]).map((value) => ({
  value,
  label: EstadoCaptacionLabels[value],
}))
const estadoSanitarioOptions = (Object.keys(EstadoSanitarioLabels) as EstadoSanitario[]).map((value) => ({
  value,
  label: EstadoSanitarioLabels[value],
}))

const cargando = ref(true)
const guardando = ref(false)
const errorMensaje = ref<string | null>(null)

async function cargar() {
  cargando.value = true
  errorMensaje.value = null
  try {
    const c = await captacionesApi.obtener(id)
    form.nombre = c.nombre
    form.observaciones = c.observaciones
    form.potrero = c.potrero
    form.estado = c.estado
    form.estadoSanitario = c.estadoSanitario
  } catch (error) {
    errorMensaje.value = error instanceof ApiError ? error.message : 'Ocurrió un error inesperado.'
  } finally {
    cargando.value = false
  }
}
onMounted(cargar)

async function guardar() {
  errorMensaje.value = null
  if (!form.nombre.trim()) {
    errorMensaje.value = 'El nombre es obligatorio.'
    return
  }
  guardando.value = true
  try {
    await captacionesApi.actualizar(id, {
      nombre: form.nombre,
      observaciones: form.observaciones || null,
      estado: form.estado as EstadoCaptacion,
      estadoSanitario: form.estadoSanitario as EstadoSanitario,
      potrero: form.potrero || null,
    })
    mostrar('Captación actualizada correctamente.')
    await router.push({ name: 'captaciones-reporte', params: { id } })
  } catch (error) {
    errorMensaje.value = error instanceof ApiError ? error.message : 'Ocurrió un error inesperado.'
  } finally {
    guardando.value = false
  }
}

function cancelar() {
  router.push({ name: 'captaciones-reporte', params: { id } })
}
</script>

<template>
  <AppShell>
    <div class="p-margin-mobile md:p-8 max-w-2xl mx-auto w-full flex flex-col gap-stack-lg">
      <h1 class="font-headline-lg text-headline-lg text-on-surface font-bold">Editar Captación</h1>

      <AlertBanner v-if="errorMensaje" variant="error">{{ errorMensaje }}</AlertBanner>

      <SkeletonForm v-if="cargando" :campos="5" />

      <form
        v-else
        class="flex flex-col gap-gutter-mobile md:gap-stack-lg md:bg-surface-container-lowest md:rounded-xl md:shadow-sm md:border md:border-outline-variant md:p-6"
        @submit.prevent="guardar"
      >
        <FormField v-model="form.nombre" label="Nombre de la captación" required />
        <FormField v-model="form.potrero" label="Potrero asignado" />
        <div class="grid grid-cols-1 md:grid-cols-2 gap-gutter-mobile md:gap-6">
          <FormField v-model="form.estado" type="select" label="Estado" required :options="estadoOptions" />
          <FormField v-model="form.estadoSanitario" type="select" label="Estado sanitario" required :options="estadoSanitarioOptions" />
        </div>
        <FormField v-model="form.observaciones" type="textarea" label="Observaciones generales" />

        <div class="flex flex-col-reverse md:flex-row md:justify-end gap-stack-sm md:gap-4 md:pt-4 md:border-t md:border-outline-variant">
          <BaseButton variant="secondary" type="button" class="md:w-auto" @click="cancelar">Cancelar</BaseButton>
          <BaseButton type="submit" :loading="guardando" class="md:w-auto">Guardar Cambios</BaseButton>
        </div>
      </form>
    </div>
  </AppShell>
</template>
