<script setup lang="ts">
import AppIcon, { type NombreIcono } from './AppIcon.vue'

type Tono = 'primary' | 'secondary' | 'tertiary'

const props = withDefaults(defineProps<{ label: string; value: string; icon: NombreIcono; hint?: string; tono?: Tono }>(), {
  tono: 'primary',
})

// Mismo par contenedor/on-contenedor que ya usan los badges de estado
// (EstadoCaptacionBadge, SyncBadge, …) — el KPI que necesita atención
// (tono="secondary") toma el mismo significado "pendiente" que esos badges
// ya le dan al color secundario en el resto de la app. "tertiary" solo aporta
// variedad visual entre KPIs informativos (sin significado de estado propio),
// tal como lo hace el mockup de referencia en Stitch.
// Reposo: tinte suave (contenedor al 20%). Hover: se intensifica al
// contenedor completo — mismo patrón que el mockup "Dashboard - Optimizado
// Final" de Stitch, activado por el `group` del div raíz.
const estilosIcono: Record<Tono, string> = {
  primary: 'bg-primary-container/20 text-primary group-hover:bg-primary-container group-hover:text-on-primary-container',
  secondary: 'bg-secondary-container/20 text-secondary group-hover:bg-secondary-container group-hover:text-on-secondary-container',
  tertiary: 'bg-tertiary-container/20 text-tertiary group-hover:bg-tertiary-container group-hover:text-on-tertiary-container',
}
const estilosValor: Record<Tono, string> = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  tertiary: 'text-tertiary',
}
</script>

<template>
  <div class="group bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow h-36 flex flex-col gap-2">
    <div class="flex items-center justify-between">
      <span class="font-body-md text-body-md text-on-surface-variant">{{ label }}</span>
      <span class="p-2 rounded-full flex transition-colors" :class="estilosIcono[props.tono]">
        <AppIcon :name="icon" :size="20" />
      </span>
    </div>
    <div class="font-headline-xl text-headline-xl mt-2" :class="estilosValor[props.tono]">{{ value }}</div>
    <p v-if="hint" class="font-label-md text-label-md mt-auto" :class="props.tono === 'secondary' ? 'text-secondary' : 'text-outline'">
      {{ hint }}
    </p>
  </div>
</template>
