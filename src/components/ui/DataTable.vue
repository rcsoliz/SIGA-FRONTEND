<script setup lang="ts" generic="T extends Record<string, any>">
// Tabla/tarjeta genérica para las vistas de listado (Plan de mejoras "AgroField
// Listas", Opción B). Reemplaza la tabla-de-escritorio + tarjeta-de-móvil que
// cada vista reescribía a mano: acá se resuelve una sola vez el punto de
// quiebre de tablet (columnas `ocultarEnTablet` solo aparecen desde `lg`), el
// orden por columna (ver useOrdenable) y la fila/tarjeta clickeable.
//
// Las <tr> no pueden envolverse en <RouterLink> (un <a> ahí es HTML inválido),
// así que la navegación de fila es programática — mismo patrón que ya usaba
// SeguridadUsuariosView antes de este cambio — y el slot #acciones corta la
// propagación del click para no disparar la navegación de fila.
import { useRouter, type RouteLocationRaw } from 'vue-router'
import type { ColumnaTabla } from '@/types/dataTable'

const props = defineProps<{
  columnas: ColumnaTabla<T>[]
  items: T[]
  claveFila: (item: T) => string
  ordenarPor?: string | null
  direccion?: 'asc' | 'desc'
  hacia?: (item: T) => RouteLocationRaw
  tituloMovil: (item: T, index: number) => string
  subtituloMovil?: (item: T, index: number) => string | null | undefined
}>()

defineEmits<{ ordenar: [clave: string] }>()

const router = useRouter()

function alinearClase(col: ColumnaTabla<T>): string {
  if (col.alinear === 'derecha') return 'text-right'
  if (col.alinear === 'centro') return 'text-center'
  return 'text-left'
}

function irAFila(item: T) {
  if (props.hacia) router.push(props.hacia(item))
}
</script>

<template>
  <!-- Tabla: desde tablet (md). Las columnas `ocultarEnTablet` solo se suman desde escritorio (lg). -->
  <div class="hidden md:block bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-surface-container-low border-b border-outline-variant">
            <th
              v-for="col in columnas"
              :key="col.clave"
              class="py-4 px-6 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider"
              :class="[alinearClase(col), col.ocultarEnTablet ? 'hidden lg:table-cell' : '', col.ancho]"
            >
              <button
                v-if="col.ordenable"
                type="button"
                class="inline-flex items-center gap-1.5 uppercase tracking-wider hover:text-on-surface transition-colors"
                :class="col.alinear === 'derecha' ? 'flex-row-reverse' : ''"
                @click="$emit('ordenar', col.clave)"
              >
                {{ col.etiqueta }}
                <span class="dt-car">
                  <i class="dt-car-up" :class="{ activa: ordenarPor === col.clave && direccion === 'asc' }"></i>
                  <i class="dt-car-dn" :class="{ activa: ordenarPor === col.clave && direccion === 'desc' }"></i>
                </span>
              </button>
              <span v-else>{{ col.etiqueta }}</span>
            </th>
            <th v-if="$slots.acciones" class="py-4 px-6 w-14"><span class="sr-only">Acciones</span></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-outline-variant">
          <tr
            v-for="(item, index) in items"
            :key="claveFila(item)"
            class="hover:bg-surface-variant/50 transition-colors"
            :class="hacia ? 'cursor-pointer' : ''"
            :tabindex="hacia ? 0 : undefined"
            @click="irAFila(item)"
            @keydown.enter="irAFila(item)"
          >
            <td
              v-for="col in columnas"
              :key="col.clave"
              class="py-4 px-6 font-body-md text-body-md text-on-surface"
              :class="[alinearClase(col), col.numerico ? 'tabular-nums' : '', col.ocultarEnTablet ? 'hidden lg:table-cell' : '']"
            >
              <slot :name="`celda-${col.clave}`" :item="item" :index="index">{{ item[col.clave] }}</slot>
            </td>
            <td v-if="$slots.acciones" class="py-4 px-6" @click.stop>
              <div class="flex justify-end"><slot name="acciones" :item="item" :index="index" /></div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Tarjetas: solo bajo el punto de quiebre móvil (< md). -->
  <div class="md:hidden flex flex-col gap-gutter-mobile">
    <div
      v-for="(item, index) in items"
      :key="claveFila(item)"
      class="bg-surface-container-lowest rounded-xl p-margin-mobile shadow-sm border border-surface-variant flex flex-col gap-stack-sm"
      :class="hacia ? 'cursor-pointer active:scale-[0.99] transition-transform' : ''"
      :tabindex="hacia ? 0 : undefined"
      @click="irAFila(item)"
      @keydown.enter="irAFila(item)"
    >
      <div class="flex justify-between items-start gap-3">
        <div class="min-w-0">
          <h2 class="font-headline-md text-headline-md text-on-surface truncate">{{ tituloMovil(item, index) }}</h2>
          <p v-if="subtituloMovil?.(item, index)" class="font-body-md text-body-md text-on-surface-variant truncate">
            {{ subtituloMovil(item, index) }}
          </p>
        </div>
        <div v-if="$slots.acciones" class="flex-shrink-0" @click.stop><slot name="acciones" :item="item" :index="index" /></div>
      </div>
      <slot name="extra-movil" :item="item" :index="index" />
    </div>
  </div>
</template>

<style scoped>
.dt-car {
  display: inline-flex;
  flex-direction: column;
  gap: 2px;
}
.dt-car-up,
.dt-car-dn {
  display: block;
  width: 0;
  height: 0;
  border-left: 3px solid transparent;
  border-right: 3px solid transparent;
}
.dt-car-up {
  border-bottom: 4px solid rgb(var(--color-outline-variant));
}
.dt-car-dn {
  border-top: 4px solid rgb(var(--color-outline-variant));
}
.dt-car-up.activa {
  border-bottom-color: rgb(var(--color-primary));
}
.dt-car-dn.activa {
  border-top-color: rgb(var(--color-primary));
}
</style>
