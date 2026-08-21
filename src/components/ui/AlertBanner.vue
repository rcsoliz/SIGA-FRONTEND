<script setup lang="ts">
// Componente único de alerta para toda la app (sección 2.6 de la
// especificación de integración): mismo estilo para error de login, error de
// red/500 en cualquier pantalla, o validaciones de formulario.
withDefaults(defineProps<{ variant?: 'error' | 'info' }>(), { variant: 'error' })

const variantClasses = {
  error: { wrapper: 'bg-error-container border-error/20', icon: 'text-error', text: 'text-on-error-container' },
  info: {
    wrapper: 'bg-tertiary-container/20 border-tertiary/20',
    icon: 'text-tertiary',
    text: 'text-on-surface',
  },
} as const
</script>

<template>
  <div class="p-4 rounded-lg flex items-start gap-3 border" :class="variantClasses[variant].wrapper" role="alert">
    <span class="material-symbols-outlined mt-0.5 shrink-0" :class="variantClasses[variant].icon">
      {{ variant === 'error' ? 'error' : 'info' }}
    </span>
    <span class="font-body-md text-body-md" :class="variantClasses[variant].text">
      <slot />
    </span>
  </div>
</template>
