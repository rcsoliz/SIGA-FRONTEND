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
// Pastilla translúcida + borde (referencia Stitch SIGA V2) en vez de relleno
// sólido — a toda fuerza en reposo (no solo en hover): en móvil no hay hover,
// y esta pastilla es la única señal de color por la que se distingue un KPI
// de otro a simple vista en la fila de 3 tarjetas.
const estilosIcono: Record<Tono, string> = {
  primary: 'bg-primary/10 border-primary/30 text-primary',
  secondary: 'bg-secondary/10 border-secondary/30 text-secondary',
  tertiary: 'bg-tertiary/10 border-tertiary/30 text-tertiary',
}
const estilosValor: Record<Tono, string> = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  tertiary: 'text-tertiary',
}
const estilosBordeHover: Record<Tono, string> = {
  primary: 'hover:border-primary/40',
  secondary: 'hover:border-secondary/40',
  tertiary: 'hover:border-tertiary/40',
}
const estilosPuntoHint: Record<Tono, string> = {
  primary: 'bg-primary shadow-[0_0_6px_var(--color-primary)]',
  secondary: 'bg-secondary shadow-[0_0_6px_var(--color-secondary)]',
  tertiary: 'bg-tertiary shadow-[0_0_6px_var(--color-tertiary)]',
}
</script>

<template>
  <Card
    class="h-36 rounded-2xl shadow-card transition-all duration-200"
    :class="estilosBordeHover[props.tono]"
  >
    <CardContent class="h-full flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <span class="font-body-md text-body-md text-on-surface-variant">{{ label }}</span>
        <span
          class="p-2 rounded-xl border flex transition-transform duration-200 group-hover/card:scale-105"
          :class="estilosIcono[props.tono]"
        >
          <AppIcon :name="icon" :size="20" />
        </span>
      </div>
      <div class="font-headline-xl text-headline-xl mt-2" :class="estilosValor[props.tono]">{{ value }}</div>
      <p v-if="hint" class="font-label-md text-label-md mt-auto flex items-center gap-1.5" :class="props.tono === 'secondary' ? 'text-secondary' : 'text-outline'">
        <span class="w-1.5 h-1.5 rounded-full inline-block" :class="estilosPuntoHint[props.tono]" />
        {{ hint }}
      </p>
    </CardContent>
  </Card>
</template>
