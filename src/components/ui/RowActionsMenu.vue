<script setup lang="ts">
// Menú "⋮" para agrupar las acciones de una fila/tarjeta (Plan "AgroField
// Listas", Opción B) en vez de 2-3 íconos sueltos. Se teletransporta a <body>
// con posición fija calculada del botón disparador: la tabla vive dentro de
// un contenedor `overflow-x-auto` (necesario para el scroll horizontal en
// pantallas angostas) y ese mismo overflow recortaría un menú desplegable
// posicionado dentro de la tabla, sobre todo en las últimas filas.
import { ref, onBeforeUnmount } from 'vue'
import AppIcon from './AppIcon.vue'

const ANCHO_MENU = 176 // w-44

const abierto = ref(false)
const posicion = ref({ top: 0, left: 0 })
const disparador = ref<HTMLButtonElement | null>(null)

function alternar() {
  abierto.value ? cerrar() : abrir()
}

function abrir() {
  const rect = disparador.value!.getBoundingClientRect()
  posicion.value = { top: rect.bottom + 4, left: Math.max(8, rect.right - ANCHO_MENU) }
  abierto.value = true
  window.addEventListener('scroll', cerrar, true)
  window.addEventListener('resize', cerrar)
  document.addEventListener('keydown', onEscape)
}

function cerrar() {
  if (!abierto.value) return
  abierto.value = false
  window.removeEventListener('scroll', cerrar, true)
  window.removeEventListener('resize', cerrar)
  document.removeEventListener('keydown', onEscape)
}

function onEscape(e: KeyboardEvent) {
  if (e.key === 'Escape') cerrar()
}

onBeforeUnmount(cerrar)
</script>

<template>
  <div class="inline-block" @click.stop>
    <button
      ref="disparador"
      type="button"
      class="w-9 h-9 rounded-full inline-flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-colors"
      title="Más acciones"
      aria-label="Más acciones"
      aria-haspopup="true"
      :aria-expanded="abierto"
      @click="alternar"
    >
      <AppIcon name="more_horiz" :size="20" />
    </button>
    <Teleport to="body">
      <template v-if="abierto">
        <div class="fixed inset-0 z-40" @click="cerrar" />
        <div
          class="fixed z-50 w-44 py-1 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg overflow-hidden"
          :style="{ top: posicion.top + 'px', left: posicion.left + 'px' }"
          role="menu"
          @click="cerrar"
        >
          <slot />
        </div>
      </template>
    </Teleport>
  </div>
</template>
