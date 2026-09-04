import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useInvitadoStore } from '@/stores/invitado'
import type { RolUsuario } from '@/types/enums'

/** Ruta de aterrizaje por rol tras iniciar sesión (Etapa 1). Se reemplaza por
 * las vistas reales de cada rol conforme avanzan las siguientes etapas. */
export const RUTA_INICIO_POR_ROL: Record<RolUsuario, string> = {
  Captador: '/estancias',
  Administrador: '/dashboard',
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { soloInvitado: true },
    },
    {
      path: '/estancias',
      name: 'estancias',
      component: () => import('@/views/estancias/EstanciasListView.vue'),
      meta: { requiereAuth: true, roles: ['Captador', 'Administrador'] as RolUsuario[], permiteInvitado: true },
    },
    {
      // Crear: 🔒 Captador (EstanciasController.cs — [Authorize(Roles = "Captador")] en POST)
      path: '/estancias/nueva',
      name: 'estancias-nueva',
      component: () => import('@/views/estancias/EstanciaFormView.vue'),
      meta: { requiereAuth: true, roles: ['Captador'] as RolUsuario[], permiteInvitado: true },
    },
    {
      // Editar: cualquier usuario autenticado (PUT sin restricción de rol en el backend)
      path: '/estancias/:id/editar',
      name: 'estancias-editar',
      component: () => import('@/views/estancias/EstanciaFormView.vue'),
      meta: { requiereAuth: true, roles: ['Captador', 'Administrador'] as RolUsuario[] },
    },
    {
      path: '/estancias/:estanciaId/captaciones',
      name: 'captaciones',
      component: () => import('@/views/captaciones/CaptacionesListView.vue'),
      meta: { requiereAuth: true, roles: ['Captador', 'Administrador'] as RolUsuario[], permiteInvitado: true },
    },
    {
      // Crear: 🔒 Captador (CaptacionesController.cs — [Authorize(Roles = "Captador")] en POST)
      path: '/estancias/:estanciaId/captaciones/nueva',
      name: 'captaciones-nueva',
      component: () => import('@/views/captaciones/CaptacionFormView.vue'),
      meta: { requiereAuth: true, roles: ['Captador'] as RolUsuario[], permiteInvitado: true },
    },
    {
      path: '/captaciones/:id',
      name: 'captaciones-reporte',
      component: () => import('@/views/captaciones/CaptacionReporteView.vue'),
      meta: { requiereAuth: true, roles: ['Captador', 'Administrador'] as RolUsuario[], permiteInvitado: true },
    },
    {
      // Editar cabecera: cualquier usuario autenticado (PUT sin restricción de rol)
      path: '/captaciones/:id/editar',
      name: 'captaciones-editar',
      component: () => import('@/views/captaciones/CaptacionEditView.vue'),
      meta: { requiereAuth: true, roles: ['Captador', 'Administrador'] as RolUsuario[] },
    },
    {
      // Ver historial: cualquier autenticado. Crear: 🔒 Captador, salvo
      // Sanitario (sin restricción — ver src/config/bitacoras.ts).
      path: '/captaciones/:captacionId/pesaje',
      name: 'bitacora-pesaje',
      component: () => import('@/views/bitacoras/BitacoraView.vue'),
      props: { tipo: 'Pesaje' },
      meta: { requiereAuth: true, roles: ['Captador', 'Administrador'] as RolUsuario[], permiteInvitado: true },
    },
    {
      path: '/captaciones/:captacionId/sanitario',
      name: 'bitacora-sanitario',
      component: () => import('@/views/bitacoras/BitacoraView.vue'),
      props: { tipo: 'Sanitario' },
      meta: { requiereAuth: true, roles: ['Captador', 'Administrador'] as RolUsuario[], permiteInvitado: true },
    },
    {
      path: '/captaciones/:captacionId/movimiento',
      name: 'bitacora-movimiento',
      component: () => import('@/views/bitacoras/BitacoraView.vue'),
      props: { tipo: 'Movimiento' },
      meta: { requiereAuth: true, roles: ['Captador', 'Administrador'] as RolUsuario[], permiteInvitado: true },
    },
    {
      path: '/captaciones/:captacionId/alimentacion',
      name: 'bitacora-alimentacion',
      component: () => import('@/views/bitacoras/BitacoraView.vue'),
      props: { tipo: 'Alimentacion' },
      meta: { requiereAuth: true, roles: ['Captador', 'Administrador'] as RolUsuario[], permiteInvitado: true },
    },
    {
      path: '/mapa',
      name: 'mapa-operaciones',
      component: () => import('@/views/mapa/MapaOperacionesView.vue'),
      meta: { requiereAuth: true, roles: ['Captador', 'Administrador'] as RolUsuario[] },
    },
    {
      // 🔒 Administrador (RegistrosController.cs — [Authorize(Roles = "Administrador")] a nivel de clase)
      path: '/registros',
      name: 'maestro-registros',
      component: () => import('@/views/registros/MaestroRegistrosView.vue'),
      meta: { requiereAuth: true, roles: ['Administrador'] as RolUsuario[] },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/dashboard/DashboardView.vue'),
      meta: { requiereAuth: true, roles: ['Administrador'] as RolUsuario[] },
    },
    {
      path: '/planificacion-faena',
      name: 'planificacion-faena',
      component: () => import('@/views/planificacion/PlanificacionFaenaView.vue'),
      meta: { requiereAuth: true, roles: ['Administrador'] as RolUsuario[] },
    },
    {
      path: '/composicion-hato',
      name: 'composicion-hato',
      component: () => import('@/views/planificacion/ComposicionHatoView.vue'),
      meta: { requiereAuth: true, roles: ['Administrador'] as RolUsuario[] },
    },
    {
      path: '/ranking-productividad',
      name: 'ranking-productividad',
      component: () => import('@/views/productividad/RankingProductividadView.vue'),
      meta: { requiereAuth: true, roles: ['Administrador'] as RolUsuario[] },
    },
    {
      // Sin :id — resuelve el usuarioId de la sesión (Captador viendo su propio perfil)
      path: '/mi-productividad',
      name: 'mi-productividad',
      component: () => import('@/views/productividad/PerfilProductividadView.vue'),
      meta: { requiereAuth: true, roles: ['Captador'] as RolUsuario[] },
    },
    {
      // Con :id explícito — llegada desde el Ranking (solo Administrador enlaza aquí)
      path: '/productividad/:id',
      name: 'perfil-productividad',
      component: () => import('@/views/productividad/PerfilProductividadView.vue'),
      meta: { requiereAuth: true, roles: ['Administrador'] as RolUsuario[] },
    },
    {
      path: '/usuarios',
      name: 'usuarios',
      component: () => import('@/views/usuarios/SeguridadUsuariosView.vue'),
      meta: { requiereAuth: true, roles: ['Administrador'] as RolUsuario[] },
    },
    {
      path: '/usuarios/nuevo',
      name: 'usuarios-nuevo',
      component: () => import('@/views/usuarios/UsuarioFormView.vue'),
      meta: { requiereAuth: true, roles: ['Administrador'] as RolUsuario[] },
    },
    {
      path: '/usuarios/:id',
      name: 'usuarios-detalle',
      component: () => import('@/views/usuarios/DetalleUsuarioView.vue'),
      meta: { requiereAuth: true, roles: ['Administrador'] as RolUsuario[] },
    },
    {
      path: '/auditoria',
      name: 'trazabilidad-auditoria',
      component: () => import('@/views/auditoria/TrazabilidadAuditoriaView.vue'),
      meta: { requiereAuth: true, roles: ['Administrador'] as RolUsuario[] },
    },
    {
      path: '/',
      redirect: '/login',
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/login',
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  const invitado = useInvitadoStore()

  if (to.meta.soloInvitado && auth.estaAutenticado) {
    return RUTA_INICIO_POR_ROL[auth.rol!]
  }

  if (to.meta.requiereAuth && !auth.estaAutenticado) {
    if (invitado.activo && to.meta.permiteInvitado) return true
    return { name: 'login' }
  }

  const rolesPermitidos = to.meta.roles as RolUsuario[] | undefined
  if (rolesPermitidos && auth.rol && !rolesPermitidos.includes(auth.rol)) {
    return RUTA_INICIO_POR_ROL[auth.rol]
  }

  return true
})

export default router
