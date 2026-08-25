<script setup lang="ts">
// Captura real de coordenadas vía navigator.geolocation (API HTML5 de
// geolocalización, sección 1.5 del documento base de requisitos) — a
// diferencia del mockup, que simula la captura con un setTimeout.
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import type L from 'leaflet'
import AppIcon from './AppIcon.vue'
// SVG del pin (Lucide "map-pin") incrustado a mano: el marcador de Leaflet
// se arma como HTML plano fuera del árbol de Vue, así que no puede montar el
// componente AppIcon — se reutiliza el mismo trazo para no introducir un
// segundo lenguaje de íconos solo para este marcador.
const SVG_PIN =
  '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>'

const props = defineProps<{
  latitud: number | null
  longitud: number | null
  required?: boolean
}>()

const emit = defineEmits<{ 'update:coordenadas': [lat: number, lng: number] }>()

const estado = ref<'idle' | 'cargando' | 'error'>('idle')
const errorMensaje = ref<string | null>(null)
const capturado = computed(() => props.latitud !== null && props.longitud !== null)

// Vista previa del punto capturado: confirma visualmente que el GPS no
// arrojó coordenadas erróneas (ej. 0,0 o un país equivocado) antes de guardar.
const mapEl = ref<HTMLDivElement | null>(null)
let map: L.Map | null = null
let marker: L.Marker | null = null
let leafletMod: typeof import('leaflet') | null = null
let iconoPin: L.DivIcon | null = null

// Carga diferida: Leaflet pesa ~43kB gzip, con margen el chunk más pesado de
// toda la app — antes se importaba de forma estática, así que se descargaba
// apenas se abría el formulario de Estancia/Captación (incluso en modo
// edición, donde el mapa nunca llega a mostrarse). Ahora solo se pide la
// primera vez que hay coordenadas que dibujar — justo la conexión rural que
// este componente existe para servir no debería pagar ese costo sin usarlo.
async function obtenerLeaflet() {
  if (!leafletMod) {
    const [mod] = await Promise.all([import('leaflet'), import('leaflet/dist/leaflet.css')])
    leafletMod = mod
    iconoPin = mod.divIcon({
      className: '',
      html: `
        <div class="w-9 h-9 bg-primary border-2 rounded-full shadow-md flex items-center justify-center" style="border-color:#fff">
          ${SVG_PIN}
        </div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    })
  }
  return leafletMod
}

watch(
  [() => props.latitud, () => props.longitud],
  async ([lat, lng]) => {
    if (lat === null || lng === null) {
      map?.remove()
      map = null
      marker = null
      return
    }
    const L = await obtenerLeaflet()
    await nextTick()
    if (!mapEl.value) return
    if (!map) {
      map = L.map(mapEl.value, { zoomControl: false, dragging: true, scrollWheelZoom: false }).setView([lat, lng], 15)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(map)
      marker = L.marker([lat, lng], { icon: iconoPin! }).addTo(map)
    } else {
      map.setView([lat, lng], 15)
      marker?.setLatLng([lat, lng])
    }
  },
  { immediate: true },
)

onUnmounted(() => {
  map?.remove()
  map = null
  marker = null
})

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
    class="bg-surface-container-low rounded-lg border-2 border-dashed p-4 md:p-6 flex flex-col gap-4 transition-colors"
    :class="capturado ? 'border-primary/40' : 'border-outline-variant'"
  >
    <div class="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
      <div class="flex items-start gap-4 w-full md:w-auto">
        <div class="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
          <AppIcon name="location_on" :size="24" />
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
        <AppIcon v-if="estado === 'cargando'" name="sync" :size="20" class="animate-spin" />
        <AppIcon v-else :name="capturado ? 'check_circle' : 'my_location'" :size="20" />
        {{ estado === 'cargando' ? 'Obteniendo...' : capturado ? 'Ubicación Capturada' : 'Capturar Ubicación GPS' }}
      </button>
    </div>

    <div v-if="capturado" ref="mapEl" class="h-40 w-full rounded-lg overflow-hidden border border-outline-variant" />
  </div>
</template>
