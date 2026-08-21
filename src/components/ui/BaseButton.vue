<script setup lang="ts">
withDefaults(
  defineProps<{
    type?: 'button' | 'submit'
    variant?: 'primary' | 'secondary' | 'text'
    /** rounded-full (píldora) en vez de rounded-lg — solo para casos donde el
     * mockup lo pide explícitamente (ej. Login escritorio). Por defecto los
     * formularios usan rounded-lg, consistente con el resto de la app. */
    pill?: boolean
    icon?: string
    loading?: boolean
    disabled?: boolean
    block?: boolean
  }>(),
  {
    type: 'button',
    variant: 'primary',
    pill: false,
    icon: undefined,
    loading: false,
    disabled: false,
    block: true,
  },
)

defineEmits<{ click: [event: MouseEvent] }>()

const variantClasses = {
  primary: 'bg-primary text-on-primary hover:bg-on-primary-fixed-variant shadow-sm shadow-primary/10',
  // 2px de trazo, no 1px: así lo usan de forma consistente los botones
  // secundarios/outline en los mockups reales (Captación, Mapa, Seguridad,
  // Detalle de Usuario, Trazabilidad), y lo confirma el design system
  // formal de Stitch ("AgroField Precision": "Secondary buttons use an
  // outlined style with a 2px stroke").
  secondary:
    'bg-surface-container-lowest text-primary border-2 border-outline-variant hover:bg-surface-container-low',
  text: 'bg-transparent text-primary hover:bg-surface-container-low',
} as const
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="h-touch-target-min font-button text-button flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
    :class="[variantClasses[variant], pill ? 'rounded-full' : 'rounded-lg', block ? 'w-full' : 'px-6']"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
    <span v-else-if="icon" class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1">
      {{ icon }}
    </span>
    <slot />
  </button>
</template>
