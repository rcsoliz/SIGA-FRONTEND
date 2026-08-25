<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'
import AppIcon from './AppIcon.vue'

const { tema, alternar } = useTheme()
</script>

<template>
  <button
    type="button"
    :aria-label="tema === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
    :title="tema === 'dark' ? 'Modo claro' : 'Modo oscuro'"
    class="h-10 w-10 flex items-center justify-center text-on-surface-variant hover:bg-surface-variant rounded-full transition-colors"
    @click="alternar"
  >
    <AppIcon :name="tema === 'dark' ? 'light_mode' : 'dark_mode'" :size="20" />
  </button>
</template>
