<script setup lang="ts">
// Captura real de coordenadas vía navigator.geolocation (API HTML5 de
// geolocalización, sección 1.5 del documento base de requisitos) — a
// diferencia del mockup, que simula la captura con un setTimeout.
import { computed, ref } from 'vue'

const props = defineProps<{
  latitud: number | null
  longitud: number | null
  required?: boolean
}>()

const emit = defineEmits<{ 'update:coordenadas': [lat: number, lng: number] }>()

const estado = ref<'idle' | 'cargando' | 'error'>('idle')
const errorMensaje = ref<string | null>(null)
const capturado = computed(() => props.latitud !== null && props.longitud !== null)

function capturar() {
  if (!navigator.geolocation) {
    errorMensaje.value = 'Este navegador no soporta geolocalización.'
    estado.value = 'error'
    return
  }
  estado.value = 'cargando'
  errorMensaje.value = null
  navigator.geolocation.getCurrentPosition(
    (posicion) => {
      emit('update:coordenadas', posicion.coords.latitude, posicion.coords.longitude)
      estado.value = 'idle'
    },
    (err) => {
      errorMensaje.value =
        err.code === err.PERMISSION_DENIED
          ? 'Permiso de ubicación denegado. Actívelo en la configuración del navegador.'
          : 'No se pudo obtener la ubicación. Intente nuevamente.'
      estado.value = 'error'
    },
    { enableHighAccuracy: true, timeout: 15000 },
  )
}
</script>

<template>
  <div
    class="bg-surface-container-low rounded-lg border-2 border-dashed p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 transition-colors"
    :class="capturado ? 'border-primary/40' : 'border-outline-variant'"
  >
    <div class="flex items-start gap-4 w-full md:w-auto">
      <div class="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
        <span class="material-symbols-outlined" style="font-size: 28px">location_on</span>
      </div>
      <div class="flex-1">
        <h4 class="font-headline-md text-headline-md text-on-surface flex items-center gap-1">
          Punto de Referencia GPS
          <span v-if="required" class="text-error text-body-lg leading-none">*</span>
        </h4>
        <p v-if="!capturado" class="font-body-md text-body-md text-on-surface-variant mt-1">
          No capturado. Se requiere ubicación para validación en terreno.
        </p>
        <p v-else class="font-body-md text-body-md text-primary font-semibold mt-1">
          Lat: {{ latitud!.toFixed(6) }} | Long: {{ longitud!.toFixed(6) }}
        </p>
        <p v-if="errorMensaje" class="font-body-md text-body-md text-error mt-1">{{ errorMensaje }}</p>
      </div>
    </div>
    <button
      type="button"
      :disabled="estado === 'cargando'"
      class="h-touch-target-min px-6 rounded-lg font-button text-button flex items-center justify-center gap-2 w-full md:w-auto whitespace-nowrap transition-colors disabled:opacity-70"
      :class="
        capturado
          ? 'bg-surface-container-highest text-on-surface border border-outline hover:bg-surface-variant'
          : 'bg-primary-container text-on-primary-container hover:bg-primary-container/80'
      "
      @click="capturar"
    >
      <span v-if="estado === 'cargando'" class="material-symbols-outlined animate-spin">sync</span>
      <span v-else class="material-symbols-outlined filled">{{ capturado ? 'check_circle' : 'my_location' }}</span>
      {{ estado === 'cargando' ? 'Obteniendo...' : capturado ? 'Ubicación Capturada' : 'Capturar Ubicación GPS' }}
    </button>
  </div>
</template>
