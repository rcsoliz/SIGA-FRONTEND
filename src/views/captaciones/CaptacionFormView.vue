<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import AlertBanner from '@/components/ui/AlertBanner.vue'
import FormField from '@/components/ui/FormField.vue'
import GpsCapture from '@/components/ui/GpsCapture.vue'
import IconOptionGroup from '@/components/ui/IconOptionGroup.vue'
import AppIcon, { type NombreIcono } from '@/components/ui/AppIcon.vue'
import { ApiError } from '@/api/client'
import { useToast } from '@/composables/useToast'
import * as captacionesApi from '@/api/captaciones'
import * as estanciasApi from '@/api/estancias'
import * as invitadoApi from '@/services/invitadoApi'
import { useInvitadoStore } from '@/stores/invitado'
import type { CategoriaGanado, TipoManejoAlimentario } from '@/types/enums'
import { CategoriaGanadoLabels, TipoManejoAlimentarioLabels } from '@/types/enums'
import type { CreateDetalleLoteGanadoDto, EstanciaDto } from '@/types/dto'

const route = useRoute()
const router = useRouter()
const { mostrar } = useToast()
const invitado = useInvitadoStore()
const estanciaId = computed(() => route.params.estanciaId as string)

const estancia = ref<EstanciaDto | null>(null)

const categoriaOptions: { value: CategoriaGanado; label: string; icon: NombreIcono }[] = [
  { value: 'Toro', label: CategoriaGanadoLabels.Toro, icon: 'male' },
  { value: 'Novillo', label: CategoriaGanadoLabels.Novillo, icon: 'cruelty_free' },
  { value: 'Vaquilla', label: CategoriaGanadoLabels.Vaquilla, icon: 'female' },
  { value: 'VacaDescarte', label: CategoriaGanadoLabels.VacaDescarte, icon: 'warning' },
  { value: 'Ternero', label: CategoriaGanadoLabels.Ternero, icon: 'child_care' },
]

const alimentacionOptions: { value: TipoManejoAlimentario; label: string; icon: NombreIcono }[] = [
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

// Raza / peso / fecha de faena / notas son opcionales (agregarGrupo() solo
// exige categoría, cantidad y alimentación) — se ocultan detrás de este
// toggle para que agregar un grupo muestre 3 decisiones, no 7 (hallazgo de
// carga cognitiva de /impeccable critique 2026-08-22: "one screen
// simultaneously handles... four distinct decision loops").
const mostrarDetallesOpcionales = ref(false)

// --- Borrador local (evita perder el trabajo de campo ante recarga, pérdida
// de señal o expiración de sesión — hallazgo P1 de /impeccable critique
// 2026-08-22: esta es la pantalla más sensible a interrupciones del producto
// y no tenía ninguna persistencia). Se guarda por estancia, se restaura al
// montar, y se borra solo al confirmar el registro con éxito. ---
interface BorradorCaptacion {
  cabecera: typeof cabecera
  grupos: GrupoLocal[]
  detalle: typeof detalle
}

function claveBorrador(): string {
  return `siga.captacion-borrador.${estanciaId.value}`
}

function hayCambiosSinGuardar(): boolean {
  return grupos.value.length > 0 || cabecera.nombre.trim().length > 0
}

function guardarBorrador() {
  if (!hayCambiosSinGuardar()) return
  const borrador: BorradorCaptacion = { cabecera: { ...cabecera }, grupos: grupos.value, detalle: { ...detalle } }
  localStorage.setItem(claveBorrador(), JSON.stringify(borrador))
}

function borrarBorrador() {
  localStorage.removeItem(claveBorrador())
}

function restaurarBorrador(): boolean {
  const guardado = localStorage.getItem(claveBorrador())
  if (!guardado) return false
  try {
    const borrador = JSON.parse(guardado) as BorradorCaptacion
    Object.assign(cabecera, borrador.cabecera)
    grupos.value = borrador.grupos ?? []
    Object.assign(detalle, borrador.detalle)
    // Si el borrador traía algún detalle opcional cargado, hay que abrir el
    // panel — si no, quedaría restaurado pero invisible detrás del toggle.
    if (detalle.raza || detalle.pesoPromedioEstimadoKg || detalle.fechaEstimadaFaena || detalle.notasZootecnicas) {
      mostrarDetallesOpcionales.value = true
    }
    return hayCambiosSinGuardar()
  } catch {
    borrarBorrador()
    return false
  }
}

const guardadoExitoso = ref(false)

function onBeforeUnloadHandler(e: BeforeUnloadEvent) {
  if (hayCambiosSinGuardar()) {
    e.preventDefault()
    e.returnValue = ''
  }
}

function resetDetalle() {
  detalle.categoria = null
  detalle.raza = ''
  detalle.cantidadCabezas = null
  detalle.pesoPromedioEstimadoKg = null
  detalle.sistemaAlimentacion = null
  detalle.fechaEstimadaFaena = ''
  detalle.notasZootecnicas = ''
  mostrarDetallesOpcionales.value = false
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
    estancia.value = invitado.activo
      ? await invitadoApi.obtenerEstanciaLocal(estanciaId.value)
      : await estanciasApi.obtener(estanciaId.value)
  } catch (error) {
    errorMensaje.value = error instanceof ApiError ? error.message : 'Ocurrió un error inesperado.'
  }
}

onMounted(() => {
  cargarEstancia()
  if (restaurarBorrador()) {
    mostrar('Se restauró un borrador guardado en este dispositivo.', 'info', 6000)
  }
  window.addEventListener('beforeunload', onBeforeUnloadHandler)
})
onBeforeUnmount(() => window.removeEventListener('beforeunload', onBeforeUnloadHandler))

// Autoguardado: cualquier cambio en cabecera/grupos/detalle se refleja en el
// borrador local de inmediato — así una recarga o pérdida de sesión a mitad
// de un grupo no borra nada.
watch([cabecera, grupos, detalle], guardarBorrador, { deep: true })

onBeforeRouteLeave(() => {
  if (guardadoExitoso.value || !hayCambiosSinGuardar()) return true
  return window.confirm(
    'Tiene datos de esta captación sin registrar. Se conservaron como borrador en este dispositivo y podrá continuarlos la próxima vez, pero aún no se guardaron en el sistema. ¿Desea salir de todas formas?',
  )
})

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
    const payload = {
      estanciaId: estanciaId.value,
      nombre: cabecera.nombre,
      observaciones: cabecera.observaciones || null,
      potrero: cabecera.potrero || null,
      fecha: new Date(cabecera.fecha).toISOString(),
      latitud: cabecera.latitud,
      longitud: cabecera.longitud,
      fechaCreacionLocal: new Date().toISOString(),
      detalles: grupos.value.map(({ tempId, ...resto }) => resto),
    }
    const creada = invitado.activo
      ? await invitadoApi.crearCaptacionLocal(payload)
      : await captacionesApi.crear(payload)
    borrarBorrador()
    guardadoExitoso.value = true
    mostrar('Captación registrada correctamente.')
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
          <AppIcon name="location_on" :size="20" class="text-primary" />
          Datos Generales
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-gutter-mobile md:gap-y-6">
          <FormField v-model="cabecera.nombre" label="Nombre de la captación" required placeholder="Ej. Lote Norte 2026" />
          <FormField v-model="cabecera.potrero" label="Potrero asignado" placeholder="Ej. Potrero 1 - Alfalfa" />
          <FormField v-model="cabecera.fecha" label="Fecha de captación" type="date" required />
          <FormField v-model="cabecera.observaciones" label="Observaciones generales" type="textarea" placeholder="Notas sobre el estado general del lote..." />
        </div>
        <GpsCapture :latitud="cabecera.latitud" :longitud="cabecera.longitud" @update:coordenadas="onCoordenadas" />
      </section>

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-stack-lg">
        <!-- Sección 2: Agregar Grupo -->
        <section class="xl:col-span-2 bg-surface-container-low rounded-xl p-4 md:p-6 border border-outline-variant/50 flex flex-col gap-gutter-mobile">
          <h3 class="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
            <AppIcon name="add_circle" :size="20" class="text-primary" />
            Agregar Grupo Animal
          </h3>

          <IconOptionGroup v-model="detalle.categoria" label="Categoría" :options="categoriaOptions" />

          <FormField v-model="detalle.cantidadCabezas" type="number" label="Cantidad de cabezas" placeholder="0" required />

          <IconOptionGroup
            v-model="detalle.sistemaAlimentacion"
            label="Sistema de alimentación"
            :options="alimentacionOptions"
            columns="grid-cols-1 sm:grid-cols-3"
          />

          <button
            type="button"
            class="inline-flex items-center gap-1 text-primary font-label-md text-label-md hover:underline w-fit"
            @click="mostrarDetallesOpcionales = !mostrarDetallesOpcionales"
          >
            <AppIcon :name="mostrarDetallesOpcionales ? 'expand_less' : 'expand_more'" :size="16" />
            {{ mostrarDetallesOpcionales ? 'Ocultar detalles opcionales' : 'Agregar detalles opcionales (raza, peso, fecha de faena, notas)' }}
          </button>

          <div v-if="mostrarDetallesOpcionales" class="flex flex-col gap-gutter-mobile">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-gutter-mobile">
              <FormField v-model="detalle.raza" label="Raza" placeholder="Ej. Brangus" />
              <FormField v-model="detalle.pesoPromedioEstimadoKg" type="number" step="0.1" suffix="kg" label="Peso promedio estimado" placeholder="0.0" />
              <FormField v-model="detalle.fechaEstimadaFaena" type="date" label="Fecha estimada de faena" />
            </div>
            <FormField v-model="detalle.notasZootecnicas" type="textarea" label="Notas zootécnicas" placeholder="Condición corporal, marcas específicas..." />
          </div>

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
                title="Quitar grupo"
                aria-label="Quitar grupo"
                @click="quitarGrupo(g.tempId)"
              >
                <AppIcon name="delete" :size="18" />
              </button>
              <h4 class="font-body-lg text-body-lg font-bold text-on-surface pr-8">
                {{ g.cantidadCabezas }} {{ CategoriaGanadoLabels[g.categoria] }}
              </h4>
              <p class="font-label-md text-label-md text-on-surface-variant mt-1">
                {{ g.raza || 'Raza no especificada' }}
                <template v-if="g.pesoPromedioEstimadoKg"> • {{ g.pesoPromedioEstimadoKg }} kg (Prom)</template>
              </p>
              <span class="inline-block mt-2 font-label-md text-label-md bg-surface-container-high px-2 py-1 rounded text-on-surface-variant">
                {{ TipoManejoAlimentarioLabels[g.sistemaAlimentacion] }}
              </span>
            </div>
          </div>

          <div class="p-4 bg-surface-container-low border-t border-outline-variant/50 flex flex-col gap-stack-sm">
            <div class="flex justify-between items-center">
              <span class="font-body-lg text-on-surface-variant">Total Cabezas:</span>
              <span class="font-headline-lg text-headline-lg text-primary font-bold">{{ totalCabezas }}</span>
            </div>
            <BaseButton type="button" :loading="guardando" @click="guardarTodo">
              Confirmar y Guardar Todo
            </BaseButton>
            <BaseButton type="button" variant="secondary" @click="cancelar">Cancelar</BaseButton>
          </div>
        </section>
      </div>
    </div>
  </AppShell>
</template>
