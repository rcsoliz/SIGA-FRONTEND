<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import AlertBanner from '@/components/ui/AlertBanner.vue'
import FormField from '@/components/ui/FormField.vue'
import GpsCapture from '@/components/ui/GpsCapture.vue'
import IconOptionGroup from '@/components/ui/IconOptionGroup.vue'
import { ApiError } from '@/api/client'
import * as captacionesApi from '@/api/captaciones'
import * as estanciasApi from '@/api/estancias'
import type { CategoriaGanado, TipoManejoAlimentario } from '@/types/enums'
import { CategoriaGanadoLabels, TipoManejoAlimentarioLabels } from '@/types/enums'
import type { CreateDetalleLoteGanadoDto, EstanciaDto } from '@/types/dto'

const route = useRoute()
const router = useRouter()
const estanciaId = computed(() => route.params.estanciaId as string)

const estancia = ref<EstanciaDto | null>(null)

const categoriaOptions: { value: CategoriaGanado; label: string; icon: string }[] = [
  { value: 'Toro', label: CategoriaGanadoLabels.Toro, icon: 'male' },
  { value: 'Novillo', label: CategoriaGanadoLabels.Novillo, icon: 'cruelty_free' },
  { value: 'Vaquilla', label: CategoriaGanadoLabels.Vaquilla, icon: 'female' },
  { value: 'VacaDescarte', label: CategoriaGanadoLabels.VacaDescarte, icon: 'warning' },
  { value: 'Ternero', label: CategoriaGanadoLabels.Ternero, icon: 'child_care' },
]

const alimentacionOptions: { value: TipoManejoAlimentario; label: string; icon: string }[] = [
  { value: 'PastoreoLibre', label: TipoManejoAlimentarioLabels.PastoreoLibre, icon: 'grass' },
  { value: 'SemiConfinamiento', label: TipoManejoAlimentarioLabels.SemiConfinamiento, icon: 'fence' },
  { value: 'Confinamiento', label: TipoManejoAlimentarioLabels.Confinamiento, icon: 'warehouse' },
]

// --- Cabecera ---
const cabecera = reactive({
  nombre: '',
  observaciones: '' as string | null,
  potrero: '' as string | null,
  fecha: new Date().toISOString().slice(0, 10),
  latitud: null as number | null,
  longitud: null as number | null,
})

function onCoordenadas(lat: number, lng: number) {
  cabecera.latitud = lat
  cabecera.longitud = lng
}

// --- Detalle (grupo animal) en edición ---
interface GrupoLocal extends CreateDetalleLoteGanadoDto {
  tempId: string
}

const detalle = reactive({
  categoria: null as CategoriaGanado | null,
  raza: '' as string | null,
  cantidadCabezas: null as number | null,
  pesoPromedioEstimadoKg: null as number | null,
  sistemaAlimentacion: null as TipoManejoAlimentario | null,
  fechaEstimadaFaena: '' as string | null,
  notasZootecnicas: '' as string | null,
})

const grupos = ref<GrupoLocal[]>([])
const errorDetalle = ref<string | null>(null)

function resetDetalle() {
  detalle.categoria = null
  detalle.raza = ''
  detalle.cantidadCabezas = null
  detalle.pesoPromedioEstimadoKg = null
  detalle.sistemaAlimentacion = null
  detalle.fechaEstimadaFaena = ''
  detalle.notasZootecnicas = ''
}

function agregarGrupo() {
  errorDetalle.value = null
  if (!detalle.categoria) {
    errorDetalle.value = 'Seleccione una categoría.'
    return
  }
  if (!detalle.sistemaAlimentacion) {
    errorDetalle.value = 'Seleccione un sistema de alimentación.'
    return
  }
  if (!detalle.cantidadCabezas || detalle.cantidadCabezas <= 0) {
    errorDetalle.value = 'Ingrese una cantidad de cabezas válida.'
    return
  }

  grupos.value.push({
    tempId: crypto.randomUUID(),
    categoria: detalle.categoria,
    raza: detalle.raza || null,
    cantidadCabezas: detalle.cantidadCabezas,
    pesoPromedioEstimadoKg: detalle.pesoPromedioEstimadoKg,
    sistemaAlimentacion: detalle.sistemaAlimentacion,
    fechaEstimadaFaena: detalle.fechaEstimadaFaena ? new Date(detalle.fechaEstimadaFaena).toISOString() : null,
    notasZootecnicas: detalle.notasZootecnicas || null,
  })
  resetDetalle()
}

function quitarGrupo(tempId: string) {
  grupos.value = grupos.value.filter((g) => g.tempId !== tempId)
}

const totalCabezas = computed(() => grupos.value.reduce((sum, g) => sum + g.cantidadCabezas, 0))

// --- Guardar todo ---
const guardando = ref(false)
const errorMensaje = ref<string | null>(null)

async function cargarEstancia() {
  try {
    estancia.value = await estanciasApi.obtener(estanciaId.value)
  } catch (error) {
    errorMensaje.value = error instanceof ApiError ? error.message : 'Ocurrió un error inesperado.'
  }
}
onMounted(cargarEstancia)

async function guardarTodo() {
  errorMensaje.value = null

  if (!cabecera.nombre.trim()) {
    errorMensaje.value = 'El nombre de la captación es obligatorio.'
    return
  }
  if (grupos.value.length === 0) {
    errorMensaje.value = 'Agregue al menos un grupo animal antes de guardar.'
    return
  }

  guardando.value = true
  try {
    const creada = await captacionesApi.crear({
      estanciaId: estanciaId.value,
      nombre: cabecera.nombre,
      observaciones: cabecera.observaciones || null,
      potrero: cabecera.potrero || null,
      fecha: new Date(cabecera.fecha).toISOString(),
      latitud: cabecera.latitud,
      longitud: cabecera.longitud,
      fechaCreacionLocal: new Date().toISOString(),
      detalles: grupos.value.map(({ tempId, ...resto }) => resto),
    })
    await router.push({ name: 'captaciones-reporte', params: { id: creada.id } })
  } catch (error) {
    errorMensaje.value = error instanceof ApiError ? error.message : 'Ocurrió un error inesperado.'
  } finally {
    guardando.value = false
  }
}

function cancelar() {
  router.push({ name: 'captaciones', params: { estanciaId: estanciaId.value } })
}
</script>

<template>
  <AppShell>
    <div class="p-margin-mobile md:p-8 max-w-7xl mx-auto w-full flex flex-col gap-stack-lg">
      <div>
        <h1 class="font-headline-lg text-headline-lg text-primary font-bold">Registro de Captación</h1>
        <p class="font-body-md text-body-md text-on-surface-variant mt-1">
          {{ estancia ? estancia.nombre : 'Cargando estancia…' }} — ingrese los datos de la nueva captación de ganado.
        </p>
      </div>

      <AlertBanner v-if="errorMensaje" variant="error">{{ errorMensaje }}</AlertBanner>

      <!-- Sección 1: Datos Generales -->
      <section class="bg-surface-container-low rounded-xl p-4 md:p-6 border border-outline-variant/50 flex flex-col gap-gutter-mobile md:gap-6">
        <h3 class="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
          <span class="material-symbols-outlined text-primary">location_on</span>
          Datos Generales
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-gutter-mobile md:gap-y-6">
          <FormField v-model="cabecera.nombre" label="Nombre de la Captación" required placeholder="Ej. Lote Norte 2026" />
          <FormField v-model="cabecera.potrero" label="Potrero Asignado" placeholder="Ej. Potrero 1 - Alfalfa" />
          <FormField v-model="cabecera.fecha" label="Fecha de Captación" type="date" required />
          <FormField v-model="cabecera.observaciones" label="Observaciones Generales" type="textarea" placeholder="Notas sobre el estado general del lote..." />
        </div>
        <GpsCapture :latitud="cabecera.latitud" :longitud="cabecera.longitud" @update:coordenadas="onCoordenadas" />
      </section>

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-stack-lg">
        <!-- Sección 2: Agregar Grupo -->
        <section class="xl:col-span-2 bg-surface-container-low rounded-xl p-4 md:p-6 border border-outline-variant/50 flex flex-col gap-gutter-mobile">
          <h3 class="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
            <span class="material-symbols-outlined text-primary">add_circle</span>
            Agregar Grupo Animal
          </h3>

          <IconOptionGroup v-model="detalle.categoria" label="Categoría" :options="categoriaOptions" />

          <div class="grid grid-cols-1 md:grid-cols-2 gap-gutter-mobile">
            <FormField v-model="detalle.raza" label="Raza" placeholder="Ej. Brangus" />
            <FormField v-model="detalle.cantidadCabezas" type="number" label="Cantidad de Cabezas" placeholder="0" />
            <FormField v-model="detalle.pesoPromedioEstimadoKg" type="number" step="0.1" suffix="kg" label="Peso Promedio Estimado" placeholder="0.0" />
            <FormField v-model="detalle.fechaEstimadaFaena" type="date" label="Fecha Estimada de Faena" />
          </div>

          <IconOptionGroup
            v-model="detalle.sistemaAlimentacion"
            label="Sistema de Alimentación"
            :options="alimentacionOptions"
            columns="grid-cols-1 sm:grid-cols-3"
          />

          <FormField v-model="detalle.notasZootecnicas" type="textarea" label="Notas Zootécnicas" placeholder="Condición corporal, marcas específicas..." />

          <AlertBanner v-if="errorDetalle" variant="error">{{ errorDetalle }}</AlertBanner>

          <BaseButton type="button" variant="secondary" icon="add" class="md:w-auto" @click="agregarGrupo">
            Agregar a Lista
          </BaseButton>
        </section>

        <!-- Sección 3: Grupos Agregados -->
        <section class="xl:col-span-1 bg-surface-container-lowest rounded-xl border border-outline-variant/50 flex flex-col overflow-hidden">
          <div class="p-4 bg-surface-container-low border-b border-outline-variant/50">
            <h3 class="font-headline-md text-headline-md text-on-surface flex items-center justify-between">
              Grupos Agregados
              <span class="bg-primary-container text-on-primary-container text-sm px-2 py-1 rounded-full font-bold">
                {{ grupos.length }}
              </span>
            </h3>
          </div>

          <div class="flex-1 p-4 space-y-3 min-h-[160px]">
            <p v-if="grupos.length === 0" class="font-body-md text-body-md text-on-surface-variant text-center py-8">
              Aún no agregó ningún grupo.
            </p>
            <div v-for="g in grupos" :key="g.tempId" class="bg-surface p-4 rounded-lg border border-outline-variant shadow-sm relative">
              <button
                type="button"
                class="absolute top-2 right-2 text-on-surface-variant hover:text-error transition-colors"
                aria-label="Quitar grupo"
                @click="quitarGrupo(g.tempId)"
              >
                <span class="material-symbols-outlined">delete</span>
              </button>
              <h4 class="font-body-lg text-body-lg font-bold text-on-surface pr-8">
                {{ g.cantidadCabezas }} {{ CategoriaGanadoLabels[g.categoria] }}
              </h4>
              <p class="font-label-md text-label-md text-on-surface-variant mt-1">
                {{ g.raza || 'Raza no especificada' }}
                <template v-if="g.pesoPromedioEstimadoKg"> • {{ g.pesoPromedioEstimadoKg }} kg (Prom)</template>
              </p>
              <span class="inline-block mt-2 text-[10px] bg-surface-container-high px-2 py-1 rounded text-on-surface-variant font-medium">
                {{ TipoManejoAlimentarioLabels[g.sistemaAlimentacion] }}
              </span>
            </div>
          </div>

          <div class="p-4 bg-surface-container-low border-t border-outline-variant/50 flex flex-col gap-stack-sm">
            <div class="flex justify-between items-center">
              <span class="font-body-lg text-on-surface-variant">Total Cabezas:</span>
              <span class="font-headline-lg text-headline-lg text-primary font-bold">{{ totalCabezas }}</span>
            </div>
            <BaseButton type="button" icon="save" :loading="guardando" @click="guardarTodo">
              Confirmar y Guardar Todo
            </BaseButton>
            <BaseButton type="button" variant="text" @click="cancelar">Cancelar</BaseButton>
          </div>
        </section>
      </div>
    </div>
  </AppShell>
</template>
