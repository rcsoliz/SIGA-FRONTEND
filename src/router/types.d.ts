import 'vue-router'
import type { RolUsuario } from '@/types/enums'

declare module 'vue-router' {
  interface RouteMeta {
    requiereAuth?: boolean
    soloInvitado?: boolean
    roles?: RolUsuario[]
  }
}
