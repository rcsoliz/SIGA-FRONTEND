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
    class="h-9 w-9 flex items-center justify-center text-secondary bg-secondary/10 border border-secondary/20 hover:bg-secondary/20 rounded-lg transition-colors"
    @click="alternar"
  >
    <AppIcon :name="tema === 'dark' ? 'light_mode' : 'dark_mode'" :size="20" />
  </button>
</template>
