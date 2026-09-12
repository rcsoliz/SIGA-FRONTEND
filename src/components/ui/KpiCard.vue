<script setup lang="ts">
import { Card, CardContent } from '@/components/ui/card'
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
// A toda fuerza en reposo (no solo en hover): en móvil no hay hover, y esta
// pastilla es la única señal de color por la que se distingue un KPI de otro
// a simple vista en la fila de 3 tarjetas.
const estilosIcono: Record<Tono, string> = {
  primary: 'bg-primary-container text-on-primary-container',
  secondary: 'bg-secondary-container text-on-secondary-container',
  tertiary: 'bg-tertiary-container text-on-tertiary-container',
}
const estilosValor: Record<Tono, string> = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  tertiary: 'text-tertiary',
}
</script>

<template>
  <Card class="h-36 hover:shadow-md transition-shadow">
    <CardContent class="h-full flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <span class="font-body-md text-body-md text-on-surface-variant">{{ label }}</span>
        <span class="p-2 rounded-full flex" :class="estilosIcono[props.tono]">
          <AppIcon :name="icon" :size="20" />
        </span>
      </div>
      <div class="font-headline-xl text-headline-xl mt-2" :class="estilosValor[props.tono]">{{ value }}</div>
      <p v-if="hint" class="font-label-md text-label-md mt-auto" :class="props.tono === 'secondary' ? 'text-secondary' : 'text-outline'">
        {{ hint }}
      </p>
    </CardContent>
  </Card>
</template>
