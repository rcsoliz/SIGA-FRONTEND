<script setup lang="ts">
// Modal de confirmación genérico (no hay mockup de Stitch para esta
// interacción — el dropdown del listado de Estancias solo mostraba
// "Editar"/"Ver Captaciones", sin acción de eliminar). Diseñado con los
// mismos tokens del resto de la app para no introducir un lenguaje visual
// nuevo. Reutilizable para cualquier acción destructiva futura (revocar
// dispositivo, quitar sector, etc. en la Etapa 6).
import { nextTick, ref, watch } from 'vue'
import AppIcon from './AppIcon.vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    message: string
    confirmLabel?: string
    cancelLabel?: string
    loading?: boolean
    errorMessage?: string | null
  }>(),
  {
    confirmLabel: 'Eliminar',
    cancelLabel: 'Cancelar',
    loading: false,
    errorMessage: null,
  },
)

const emit = defineEmits<{ confirm: []; cancel: [] }>()

const cancelBtn = ref<HTMLButtonElement | null>(null)

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) nextTick(() => cancelBtn.value?.focus())
  },
)

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && !props.loading) emit('cancel')
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[100] flex items-center justify-center p-margin-mobile bg-inverse-surface/50 backdrop-blur-[1px]"
      @keydown="onKeydown"
      @click.self="!loading && emit('cancel')"
    >
      <div
        class="w-full max-w-sm bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant p-6 flex flex-col gap-stack-md"
        role="alertdialog"
        aria-modal="true"
      >
        <div class="flex items-start gap-3">
          <div class="h-10 w-10 rounded-full bg-error-container flex items-center justify-center shrink-0">
            <AppIcon name="warning" :size="20" />
          </div>
          <div>
            <h2 class="font-headline-md text-headline-md text-on-surface">{{ title }}</h2>
            <p class="font-body-md text-body-md text-on-surface-variant mt-1">{{ message }}</p>
          </div>
        </div>

        <p v-if="errorMessage" class="font-body-md text-body-md text-error">{{ errorMessage }}</p>

        <div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-stack-sm mt-2">
          <button
            ref="cancelBtn"
            type="button"
            :disabled="loading"
            class="h-touch-target-min px-6 rounded-lg font-button text-button text-on-surface-variant bg-transparent hover:bg-surface-container-high transition-colors disabled:opacity-50"
            @click="emit('cancel')"
          >
            {{ cancelLabel }}
          </button>
          <button
            type="button"
            :disabled="loading"
            class="h-touch-target-min px-6 rounded-lg font-button text-button bg-error text-on-error hover:bg-error/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
            @click="emit('confirm')"
          >
            <span v-if="loading" class="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
            {{ confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
