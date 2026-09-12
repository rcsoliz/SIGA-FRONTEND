import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'

export { default as Badge } from './Badge.vue'

// Variants = la regla de mapeo estado -> color que ya documenta DESIGN.md
// ("resolved/positive -> primary; pending -> secondary; critical -> error;
// terminal/neutral -> tertiary/neutral"), no una paleta nueva — cada badge de
// estado existente (Sync, Captación, Sanitario, Usuario, Urgencia) elige uno
// de estos 5 en vez de escribir sus propias clases de color.
export const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap rounded-full border px-2.5 py-1 font-label-md text-label-md transition-colors [&>svg]:pointer-events-none [&>svg]:size-3.5',
  {
    variants: {
      variant: {
        primary: 'bg-primary/10 text-primary border-primary/20',
        secondary: 'bg-secondary-container/50 text-secondary border-secondary/20',
        tertiary: 'bg-tertiary-container/40 text-tertiary border-tertiary/20',
        destructive: 'bg-error-container text-on-error-container border-error/20',
        neutral: 'bg-surface-container-highest text-on-surface-variant border-outline-variant',
      },
    },
    defaultVariants: {
      variant: 'primary',
    },
  },
)
export type BadgeVariants = VariantProps<typeof badgeVariants>
