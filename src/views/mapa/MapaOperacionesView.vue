<script setup lang="ts">
// Mapa de Operaciones: el mockup de Stitch usa una imagen satelital estática
// con pines posicionados por porcentaje (no coordenadas reales). Como sí
// tenemos latitud/longitud reales por Estancia (sección 4.9: consume
// GET /api/estancias, sin endpoint propio), se construyó un mapa interactivo
// real con Leaflet + OpenStreetMap en su lugar — más fiel a los datos y más
// útil que replicar pines decorativos.
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import AppShell from '@/components/layout/AppShell.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import AlertBanner from '@/components/ui/AlertBanner.vue'
import SyncBadge from '@/components/ui/SyncBadge.vue'
import { ApiError } from '@/api/client'
import * as estanciasApi from '@/api/estancias'
import type { EstanciaDto } from '@/types/dto'

const estancias = ref<EstanciaDto[]>([])
const cargando = ref(true)
const errorMensaje = ref<string | null>(null)
const seleccionada = ref<EstanciaDto | null>(null)
const busqueda = ref('')

const mapEl = ref<HTMLDivElement | null>(null)
let map: L.Map | null = null
const marcadores = new Map<string, L.Marker>()

function icono(estanciaId: string): L.DivIcon {
  const activa = seleccionada.value?.id === estanciaId
  return L.divIcon({
    className: '',
    html: `
      <div class="${activa ? 'w-12 h-12 bg-primary border-4' : 'w-10 h-10 bg-surface-container-lowest border-2'} rounded-full border-outline-variant shadow-md flex items-center justify-center transition-all" style="${activa ? 'border-color:#fff' : ''}">
        <span class="material-symbols-outlined ${activa ? 'filled' : ''}" style="font-size:${activa ? 24 : 20}px; color:${activa ? '#fff' : '#707973'}">location_on</span>
      </div>`,
    iconSize: activa ? [48, 48] : [40, 40],
    iconAnchor: activa ? [24, 24] : [20, 20],
  })
}

function refrescarIconos() {
  for (const [id, marker] of marcadores) marker.setIcon(icono(id))
}

function seleccionar(e: EstanciaDto) {
  seleccionada.value = e
  refrescarIconos()
  map?.panTo([e.latitud, e.longitud])
}

function cerrarPanel() {
  seleccionada.value = null
  refrescarIconos()
}

const estanciasFiltradas = computed(() => {
  const termino = busqueda.value.trim().toLowerCase()
  if (!termino) return estancias.value
  return estancias.value.filter((e) => e.nombre.toLowerCase().includes(termino))
})

function buscarYSeleccionar() {
  const primera = estanciasFiltradas.value[0]
  if (primera) seleccionar(primera)
}

async function cargar() {
  cargando.value = true
  errorMensaje.value = null
  try {
    estancias.value = await estanciasApi.listar()
    await nextTick()
    inicializarMapa()
  } catch (error) {
    errorMensaje.value = error instanceof ApiError ? error.message : 'Ocurrió un error inesperado.'
  } finally {
    cargando.value = false
  }
}

function inicializarMapa() {
  if (!mapEl.value || map) return

  map = L.map(mapEl.value, { zoomControl: false }).setView([-17.7833, -63.1821], 8)
  L.control.zoom({ position: 'bottomright' }).addTo(map)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map)

  const puntos: L.LatLngExpression[] = []
  for (const e of estancias.value) {
    const marker = L.marker([e.latitud, e.longitud], { icon: icono(e.id) }).addTo(map)
    marker.on('click', () => seleccionar(e))
    marcadores.set(e.id, marker)
    puntos.push([e.latitud, e.longitud])
  }

  if (puntos.length > 1) {
    map.fitBounds(L.latLngBounds(puntos), { padding: [60, 60] })
  } else if (puntos.length === 1) {
    map.setView(puntos[0], 12)
  }
}

onMounted(cargar)
onUnmounted(() => {
  map?.remove()
  map = null
})

function ubicacionCompleta(e: EstanciaDto): string {
  return [e.departamento, e.provincia, e.municipio].filter(Boolean).join(' / ') || 'Sin ubicación administrativa registrada'
}
</script>

<template>
  <AppShell>
    <div class="relative w-full h-[calc(100vh-160px)] md:h-screen overflow-hidden">
      <AlertBanner v-if="errorMensaje" variant="error" class="absolute top-4 left-4 right-4 z-[1000]">
        {{ errorMensaje }}
      </AlertBanner>

      <!-- Floating search -->
      <div class="absolute top-4 left-4 z-[1000] w-[calc(100%-2rem)] md:w-96">
        <div class="flex items-center bg-surface-container-lowest shadow-md rounded-full px-4 h-touch-target-min border border-outline-variant focus-within:border-primary transition-colors">
          <span class="material-symbols-outlined text-on-surface-variant mr-3">search</span>
          <input
            v-model="busqueda"
            type="text"
            placeholder="Buscar estancia..."
            class="flex-1 bg-transparent border-none focus:ring-0 text-body-lg text-on-surface placeholder:text-on-surface-variant p-0 outline-none"
            @keyup.enter="buscarYSeleccionar"
          />
        </div>
      </div>

      <div ref="mapEl" class="w-full h-full z-0" />

      <!-- Detail panel: sidebar (desktop) / bottom sheet (mobile) -->
      <Transition name="fade">
        <aside
          v-if="seleccionada"
          class="absolute z-[1000] bg-surface-container-lowest shadow-lg border-outline-variant overflow-y-auto
                 bottom-0 left-0 w-full max-h-[70vh] rounded-t-xl border-t
                 md:top-0 md:right-0 md:left-auto md:bottom-auto md:w-96 md:h-full md:max-h-full md:rounded-none md:border-t-0 md:border-l"
        >
          <div class="p-6 border-b border-outline-variant relative">
            <button
              class="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-full p-2 transition-colors"
              aria-label="Cerrar"
              @click="cerrarPanel"
            >
              <span class="material-symbols-outlined">close</span>
            </button>
            <div class="mt-4 flex items-start gap-4">
              <div class="w-14 h-14 rounded-xl bg-primary-container flex items-center justify-center text-on-primary-container shrink-0">
                <span class="material-symbols-outlined text-[32px]">home_work</span>
              </div>
              <div>
                <h3 class="font-headline-lg text-headline-lg text-on-surface">{{ seleccionada.nombre }}</h3>
                <div class="flex items-center gap-1.5 mt-1 text-on-surface-variant font-body-md text-body-md">
                  <span class="material-symbols-outlined text-[16px]">person</span>
                  <span>{{ seleccionada.propietario }}</span>
                </div>
              </div>
            </div>
            <div class="mt-6"><SyncBadge :estado="seleccionada.estadoSync" /></div>
          </div>

          <div class="p-6 flex flex-col gap-6">
            <div class="bg-surface-container rounded-xl p-4 border border-outline-variant">
              <h4 class="font-label-md text-label-md text-on-surface-variant uppercase mb-3">Ubicación Registrada</h4>
              <p class="font-body-md text-body-md text-on-surface flex items-start gap-3">
                <span class="material-symbols-outlined text-outline text-[20px]">map</span>
                {{ ubicacionCompleta(seleccionada) }}
              </p>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-sm">
                <span class="material-symbols-outlined text-tertiary text-[28px] mb-2">assignment</span>
                <span class="font-headline-lg text-headline-lg text-on-surface">{{ seleccionada.cantidadCaptaciones }}</span>
                <span class="font-label-md text-label-md text-on-surface-variant mt-1">CAPTACIONES</span>
              </div>
              <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-sm">
                <span class="material-symbols-outlined text-tertiary text-[28px] mb-2">pets</span>
                <span class="font-headline-lg text-headline-lg text-on-surface">{{ seleccionada.totalCabezas }}</span>
                <span class="font-label-md text-label-md text-on-surface-variant mt-1">TOTAL CABEZAS</span>
              </div>
            </div>
          </div>

          <div class="p-6 border-t border-outline-variant">
            <RouterLink :to="{ name: 'captaciones', params: { estanciaId: seleccionada.id } }">
              <BaseButton icon="visibility">Ver Captaciones de esta Estancia</BaseButton>
            </RouterLink>
          </div>
        </aside>
      </Transition>
    </div>
  </AppShell>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
