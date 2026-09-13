<script setup lang="ts">
// Shell de navegación post-login (sidebar en escritorio, barra inferior +
// drawer en móvil). Los mockups de Stitch traen un sidebar/bottom-nav
// decorativo con ítems distintos e inconsistentes entre pantallas ("Records/
// Map/Security" en un mockup, "Registrations/Maps/Settings" en otro, en
// inglés, sin corresponder a rutas reales). En vez de copiar ninguno, este
// componente deriva la navegación de las rutas reales de la app.
//
// Los ítems marcados `principal: true` van en la barra inferior móvil
// (máximo 3-4 para que quepan sin scroll); el resto vive en el drawer que se
// abre con "Más" — el rol Administrador acumula más ítems de los que caben
// en un ancho móvil fijo (mejora #1 de docs/mejoras-frontend.md).
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useInvitadoStore } from '@/stores/invitado'
import { sincronizarCola } from '@/services/sincronizacion'
import ThemeToggle from '@/components/ui/ThemeToggle.vue'
import AppIcon, { type NombreIcono } from '@/components/ui/AppIcon.vue'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { RolUsuario } from '@/types/enums'

interface NavItem {
  label: string
  icon: NombreIcono
  routeName: string
  roles: RolUsuario[]
  principal?: boolean
  /** Requiere datos reales del servidor — se oculta en modo invitado, que no
   * tiene forma de traerlos sin conexión. */
  soloConexion?: boolean
}

// Ícono canónico por concepto (mejora #8 de docs/mejoras-frontend.md) — si un
// concepto necesita ícono en una pantalla nueva, reusar el de esta lista en
// vez de elegir uno nuevo:
//   Estancia    -> home_work   Captación -> dataset     Usuario (lista) -> group
//   Pesaje      -> scale       Sanitario -> vaccines    Usuario (individual) -> person
//   Movimiento  -> local_shipping           Auditoría -> history
//   Alimentación -> grass      Registros/Maestro (bitácoras consolidadas) -> assignment
//   Cabezas de ganado (métrica) -> pets     Ubicación/dirección -> location_on
//   Fecha/planificación (faena) -> calendar_month
const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: 'monitoring', routeName: 'dashboard', roles: ['Administrador'], principal: true },
  { label: 'Estancias', icon: 'home_work', routeName: 'estancias', roles: ['Captador', 'Administrador'], principal: true },
  { label: 'Mapa', icon: 'map', routeName: 'mapa-operaciones', roles: ['Captador', 'Administrador'], principal: true, soloConexion: true },
  { label: 'Mi Productividad', icon: 'insights', routeName: 'mi-productividad', roles: ['Captador'], principal: true, soloConexion: true },
  { label: 'Registros', icon: 'assignment', routeName: 'maestro-registros', roles: ['Administrador'] },
  { label: 'Planificación de Faena', icon: 'calendar_month', routeName: 'planificacion-faena', roles: ['Administrador'] },
  { label: 'Composición del Hato', icon: 'pie_chart', routeName: 'composicion-hato', roles: ['Administrador'] },
  { label: 'Ranking', icon: 'leaderboard', routeName: 'ranking-productividad', roles: ['Administrador'] },
  { label: 'Usuarios', icon: 'group', routeName: 'usuarios', roles: ['Administrador'] },
  { label: 'Auditoría', icon: 'history', routeName: 'trazabilidad-auditoria', roles: ['Administrador'] },
]

const auth = useAuthStore()
const invitado = useInvitadoStore()
const route = useRoute()
const router = useRouter()

// El invitado nunca tiene auth.rol (no hay sesión real) — sin esto, un
// filtro basado solo en `!auth.rol` dejaría pasar TODO el menú (Dashboard,
// Usuarios, Auditoría) para un Captador sin conexión.
const rolEfectivo = computed<RolUsuario | null>(() => (invitado.activo ? 'Captador' : auth.rol))
const navItems = computed(() =>
  NAV_ITEMS.filter(
    (item) =>
      (!rolEfectivo.value || item.roles.includes(rolEfectivo.value)) && !(invitado.activo && item.soloConexion),
  ),
)
const itemsPrincipales = computed(() => navItems.value.filter((i) => i.principal))
const itemsSecundarios = computed(() => navItems.value.filter((i) => !i.principal))
const tituloSeccion = computed(() => navItems.value.find((i) => i.routeName === route.name)?.label ?? 'SIGA')

const drawerAbierto = ref(false)

// --- Barra superior de escritorio (referencia: mockup "Maestro de Registros
// - Optimizado" en Stitch) ---
const nombreMostrado = computed(() => (invitado.activo ? 'Invitado' : auth.nombre))
const rolMostrado = computed(() => (invitado.activo ? 'Modo local' : auth.rol))
const inicialUsuario = computed(() => (invitado.activo ? 'I' : (auth.nombre?.trim().charAt(0) ?? '?').toUpperCase()))

// --- Sincronización de la cola de invitado: mismo pill sirve para "entrar a
// Login a sincronizar" (invitado.activo) y para "reintentar ahora" cuando ya
// hay sesión real y quedó algo pendiente de una sincronización parcial. ---
const sincronizando = ref(false)
async function clicPillSync() {
  if (invitado.activo) {
    await router.push({ name: 'login' })
    return
  }
  if (sincronizando.value) return
  sincronizando.value = true
  try {
    await sincronizarCola()
  } finally {
    sincronizando.value = false
  }
}

// "Sincronizar" recarga la página para traer datos frescos de la API — no
// hay un endpoint de "sync global"; una recarga real es honesta (no simula
// una sincronización que no ocurrió). El aviso de "cambios sin guardar" de
// CaptacionFormView sigue protegiendo al usuario aquí igual que en cualquier
// otra navegación.
function actualizarDatos() {
  window.location.reload()
}

// Estado de conexión real (referencia: mockup "Dashboard - Optimizado Final"
// en Stitch) — usa la API nativa navigator.onLine, no un valor decorativo:
// refleja si el navegador detecta red, no si el backend responde.
const enLinea = ref(navigator.onLine)
function actualizarEstadoConexion() {
  enLinea.value = navigator.onLine
}
onMounted(() => {
  window.addEventListener('online', actualizarEstadoConexion)
  window.addEventListener('offline', actualizarEstadoConexion)
})
onUnmounted(() => {
  window.removeEventListener('online', actualizarEstadoConexion)
  window.removeEventListener('offline', actualizarEstadoConexion)
})

async function salir() {
  if (invitado.activo) {
    if (
      invitado.tienePendientes &&
      !window.confirm(
        `Tiene ${invitado.pendientes} registro(s) sin sincronizar en este dispositivo. Se conservarán localmente, pero deberá iniciar sesión para sincronizarlos. ¿Desea salir del modo invitado de todas formas?`,
      )
    ) {
      return
    }
    invitado.salir()
    await router.push({ name: 'login' })
    return
  }
  auth.cerrarSesion()
  await router.push({ name: 'login' })
}

async function irA(routeName: string) {
  drawerAbierto.value = false
  await router.push({ name: routeName })
}
</script>

<template>
  <div class="min-h-screen bg-background flex">
    <!-- Sidebar (>=768px) -->
    <aside
      class="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 bg-surface-dim border-r border-outline-variant z-40 py-stack-lg px-4"
    >
      <div class="flex items-center gap-3 mb-8 px-2">
        <div class="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-primary-container shadow-lg shadow-primary/30 ring-1 ring-primary/30 flex items-center justify-center text-on-primary-container">
          <AppIcon name="agriculture" :size="24" />
        </div>
        <div>
          <h1 class="font-headline-md text-headline-md text-primary font-bold">SIGA</h1>
          <p class="font-label-md text-label-md text-primary/90 uppercase">Captación de Ganado</p>
        </div>
      </div>

      <nav class="flex-1 space-y-1">
        <RouterLink
          v-for="item in navItems"
          :key="item.routeName"
          :to="{ name: item.routeName }"
          :title="item.label"
          class="flex items-center gap-3 px-4 h-[48px] rounded-xl font-body-md text-body-md transition-all duration-150"
          :class="
            route.name === item.routeName
              ? 'bg-primary-container text-on-primary-container font-semibold shadow-md shadow-primary/30 border border-primary/40'
              : 'text-on-surface-variant hover:bg-surface-variant border border-transparent'
          "
        >
          <span :class="route.name === item.routeName ? '' : 'text-outline'"><AppIcon :name="item.icon" :size="20" /></span>
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="-mx-4 -mb-stack-lg px-4 pb-stack-lg pt-4 border-t border-outline-variant bg-background/80">
        <div class="px-4 py-2 flex items-center justify-between">
          <div class="min-w-0">
            <p class="font-body-md text-body-md text-on-surface font-semibold truncate">{{ nombreMostrado }}</p>
            <p class="font-label-md text-label-md text-on-surface-variant tracking-normal">{{ rolMostrado }}</p>
          </div>
          <ThemeToggle />
        </div>
        <button
          title="Cerrar sesión"
          class="w-full flex items-center gap-3 px-4 h-[48px] text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors rounded-lg font-body-md text-body-md"
          @click="salir"
        >
          <AppIcon name="logout" :size="20" />
          Salir
        </button>
      </div>
    </aside>

    <!-- Top AppBar (<768px) -->
    <header
      class="md:hidden fixed top-0 w-full z-50 bg-surface-container-lowest shadow-sm flex items-center justify-between px-margin-mobile h-touch-target-min"
    >
      <div class="flex items-center gap-2 text-primary">
        <AppIcon name="agriculture" :size="22" />
        <span class="font-headline-md text-headline-md">SIGA</span>
      </div>
      <div class="flex items-center gap-1">
        <button
          v-if="invitado.activo || (auth.estaAutenticado && invitado.tienePendientes)"
          type="button"
          title="Sincronizar registros pendientes"
          aria-label="Sincronizar registros pendientes"
          class="relative h-10 w-10 flex items-center justify-center text-on-surface-variant hover:bg-surface-variant rounded-full transition-colors"
          @click="clicPillSync"
        >
          <AppIcon name="sync" :size="20" />
          <span
            class="absolute top-0 right-0 min-w-[16px] h-4 px-1 rounded-full bg-error text-on-error font-label-md text-label-md leading-4 text-center"
          >
            {{ invitado.pendientes }}
          </span>
        </button>
        <ThemeToggle />
        <button
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
          class="h-10 w-10 flex items-center justify-center text-on-surface-variant hover:bg-surface-variant rounded-full transition-colors"
          @click="salir"
        >
          <AppIcon name="logout" :size="20" />
        </button>
      </div>
    </header>

    <!-- Main content -->
    <div class="flex-1 md:ml-64 w-full">
      <!-- Top AppBar (>=768px): persistente en todas las pantallas de
      escritorio (sincronizar/notificaciones/perfil) — el móvil conserva su
      propio header simple, sin cambios. -->
      <header
        class="hidden md:flex items-center justify-between h-16 px-8 bg-surface-container/90 backdrop-blur border-b border-outline-variant sticky top-0 z-30"
      >
        <p class="font-headline-md text-headline-md text-on-surface">{{ tituloSeccion }}</p>
        <div class="flex items-center gap-2">
          <div
            class="flex items-center gap-2 px-3 py-1 rounded-full border shadow-sm"
            :class="enLinea ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-error/10 border-error/40 text-error'"
            :title="enLinea ? 'Conectado a internet' : 'Sin conexión a internet'"
          >
            <span
              class="w-2 h-2 rounded-full animate-pulse"
              :class="enLinea ? 'bg-primary shadow-[0_0_8px_var(--color-primary)]' : 'bg-error shadow-[0_0_8px_var(--color-error)]'"
            />
            <span class="font-label-md text-label-md">{{ enLinea ? 'En línea' : 'Sin conexión' }}</span>
          </div>
          <button
            v-if="invitado.activo || (auth.estaAutenticado && invitado.tienePendientes)"
            type="button"
            class="flex items-center gap-2 px-3 py-1 rounded-full border border-secondary/40 bg-secondary/10 text-secondary shadow-sm hover:bg-secondary/20 transition-colors"
            :title="invitado.activo ? 'Inicie sesión para sincronizar lo registrado en este dispositivo' : 'Sincronizar registros pendientes'"
            @click="clicPillSync"
          >
            <AppIcon name="sync" :size="16" :class="sincronizando ? 'animate-spin' : ''" />
            <span class="font-label-md text-label-md">
              {{ invitado.activo ? `Invitado · ${invitado.pendientes} pend.` : `${invitado.pendientes} sin sincronizar` }}
            </span>
          </button>
          <!-- size-10 (40px): coherente con el resto de los botones-icono
          circulares de esta barra — size="icon" del primitivo mide 36px. -->
          <Button
            variant="ghost"
            size="icon"
            class="size-10 rounded-xl border border-outline text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
            title="Actualizar datos"
            aria-label="Actualizar datos"
            @click="actualizarDatos"
          >
            <AppIcon name="sync" :size="20" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button
                variant="ghost"
                size="icon"
                class="size-10 rounded-xl border border-outline text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                title="Notificaciones"
                aria-label="Notificaciones"
              >
                <AppIcon name="notifications" :size="20" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" :side-offset="8" class="w-72 p-4">
              <p class="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-2">Notificaciones</p>
              <p class="font-body-md text-body-md text-on-surface-variant text-center py-4">No hay notificaciones nuevas.</p>
            </DropdownMenuContent>
          </DropdownMenu>
          <div class="h-6 w-px bg-outline-variant" />
          <div class="flex items-center gap-2">
            <div
              class="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary-container ring-2 ring-primary/20 shadow-sm flex items-center justify-center text-body-md font-bold shrink-0"
            >
              {{ inicialUsuario }}
            </div>
            <div class="hidden lg:block min-w-0">
              <p class="font-label-md text-label-md text-on-surface truncate max-w-[140px]">{{ nombreMostrado }}</p>
              <p class="font-label-md text-label-md text-on-surface-variant normal-case tracking-normal">{{ rolMostrado }}</p>
            </div>
          </div>
        </div>
      </header>
      <main class="pt-touch-target-min md:pt-0 pb-[96px] md:pb-0 min-h-screen">
        <slot />
      </main>
    </div>

    <!-- Bottom Navigation (<768px): solo ítems "principales" + "Más" si hay
    ítems secundarios para el rol actual (Administrador). Captador no tiene
    ítems secundarios, así que no ve el botón "Más". -->
    <nav
      class="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-[80px] px-gutter-mobile bg-surface-container rounded-t-xl shadow-lg"
    >
      <RouterLink
        v-for="item in itemsPrincipales"
        :key="item.routeName"
        :to="{ name: item.routeName }"
        :title="item.label"
        class="flex flex-col items-center justify-center rounded-full min-w-[64px] py-1 active:scale-90 transition-all duration-200"
        :class="route.name === item.routeName ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant'"
      >
        <AppIcon :name="item.icon" :size="22" class="mb-1" />
        <span class="font-label-md text-label-md text-center leading-4 line-clamp-2 min-h-[2rem]">{{ item.label }}</span>
      </RouterLink>
      <button
        v-if="itemsSecundarios.length > 0"
        type="button"
        title="Más opciones"
        class="flex flex-col items-center justify-center rounded-full min-w-[64px] py-1 active:scale-90 transition-all duration-200"
        :class="itemsSecundarios.some((i) => i.routeName === route.name) ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant'"
        @click="drawerAbierto = true"
      >
        <AppIcon name="more_horiz" :size="22" class="mb-1" />
        <span class="font-label-md text-label-md text-center leading-4 min-h-[2rem]">Más</span>
      </button>
    </nav>

    <!-- Drawer "Más" (<768px) -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="drawerAbierto"
          class="md:hidden fixed inset-0 z-[100] bg-inverse-surface/50"
          @click.self="drawerAbierto = false"
        >
          <Transition name="slide-up">
            <div
              v-if="drawerAbierto"
              class="absolute bottom-0 left-0 w-full bg-surface-container-lowest rounded-t-xl shadow-lg p-stack-md flex flex-col gap-1 max-h-[75vh] overflow-y-auto"
            >
              <div class="w-12 h-1.5 bg-outline-variant/50 rounded-full mx-auto mb-2" />
              <button
                v-for="item in itemsSecundarios"
                :key="item.routeName"
                type="button"
                class="flex items-center gap-3 px-4 h-[48px] rounded-lg font-label-md text-label-md text-left transition-colors"
                :class="route.name === item.routeName ? 'bg-primary-container text-on-primary-container font-bold' : 'text-on-surface-variant hover:bg-surface-variant'"
                @click="irA(item.routeName)"
              >
                <AppIcon :name="item.icon" :size="20" />
                {{ item.label }}
              </button>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.25s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}
</style>
