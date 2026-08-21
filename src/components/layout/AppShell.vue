<script setup lang="ts">
// Shell de navegación post-login (sidebar en escritorio, barra inferior en
// móvil). Los mockups de Stitch traen un sidebar/bottom-nav decorativo con
// ítems distintos e inconsistentes entre pantallas (en inglés, sin
// corresponder a rutas reales: "Records/Map/Security" en un mockup,
// "Registrations/Maps/Settings" en otro). En vez de copiar ninguno,
// este componente deriva la navegación de las rutas reales de la app —
// crece con cada etapa según se agregan pantallas.
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { RolUsuario } from '@/types/enums'

interface NavItem {
  label: string
  icon: string
  routeName: string
  roles: RolUsuario[]
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: 'monitoring', routeName: 'dashboard', roles: ['Administrador'] },
  { label: 'Estancias', icon: 'home_work', routeName: 'estancias', roles: ['Captador', 'Administrador'] },
  { label: 'Mapa', icon: 'map', routeName: 'mapa-operaciones', roles: ['Captador', 'Administrador'] },
  { label: 'Mi Productividad', icon: 'insights', routeName: 'mi-productividad', roles: ['Captador'] },
  { label: 'Registros', icon: 'assignment', routeName: 'maestro-registros', roles: ['Administrador'] },
  { label: 'Ranking', icon: 'leaderboard', routeName: 'ranking-productividad', roles: ['Administrador'] },
  { label: 'Usuarios', icon: 'group', routeName: 'usuarios', roles: ['Administrador'] },
  { label: 'Auditoría', icon: 'history', routeName: 'trazabilidad-auditoria', roles: ['Administrador'] },
]

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const navItems = computed(() => NAV_ITEMS.filter((item) => !auth.rol || item.roles.includes(auth.rol)))

async function salir() {
  auth.cerrarSesion()
  await router.push({ name: 'login' })
}
</script>

<template>
  <div class="min-h-screen bg-background flex">
    <!-- Sidebar (>=768px) -->
    <aside
      class="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 bg-surface-container-lowest border-r border-outline-variant shadow-sm z-40 py-stack-lg px-4"
    >
      <div class="flex items-center gap-3 mb-8 px-2">
        <div class="w-12 h-12 rounded-lg bg-primary-container flex items-center justify-center text-on-primary-container">
          <span class="material-symbols-outlined filled text-[28px]">agriculture</span>
        </div>
        <div>
          <h1 class="font-headline-md text-headline-md text-primary font-bold">SIGA</h1>
          <p class="font-label-md text-label-md text-on-surface-variant">Captación de Ganado</p>
        </div>
      </div>

      <nav class="flex-1 space-y-2">
        <RouterLink
          v-for="item in navItems"
          :key="item.routeName"
          :to="{ name: item.routeName }"
          class="flex items-center gap-3 px-4 h-[48px] rounded-lg font-label-md text-label-md transition-colors"
          :class="
            route.name === item.routeName
              ? 'bg-primary-container text-on-primary-container font-bold'
              : 'text-on-surface-variant hover:bg-surface-variant'
          "
        >
          <span class="material-symbols-outlined">{{ item.icon }}</span>
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="pt-4 border-t border-outline-variant">
        <div class="px-4 py-2">
          <p class="font-body-md text-body-md text-on-surface font-semibold truncate">{{ auth.nombre }}</p>
          <p class="font-label-md text-label-md text-on-surface-variant">{{ auth.rol }}</p>
        </div>
        <button
          class="w-full flex items-center gap-3 px-4 h-[48px] text-on-surface-variant hover:bg-surface-variant transition-colors rounded-lg font-label-md text-label-md"
          @click="salir"
        >
          <span class="material-symbols-outlined">logout</span>
          Salir
        </button>
      </div>
    </aside>

    <!-- Top AppBar (<768px) -->
    <header
      class="md:hidden fixed top-0 w-full z-50 bg-surface-container-lowest shadow-sm flex items-center justify-between px-margin-mobile h-touch-target-min"
    >
      <div class="flex items-center gap-2 text-primary">
        <span class="material-symbols-outlined filled">agriculture</span>
        <span class="font-headline-md text-headline-md">SIGA</span>
      </div>
      <button
        aria-label="Salir"
        class="h-10 w-10 flex items-center justify-center text-on-surface-variant hover:bg-surface-variant rounded-full transition-colors"
        @click="salir"
      >
        <span class="material-symbols-outlined">logout</span>
      </button>
    </header>

    <!-- Main content -->
    <div class="flex-1 md:ml-64 w-full">
      <main class="pt-touch-target-min md:pt-0 pb-[96px] md:pb-0 min-h-screen">
        <slot />
      </main>
    </div>

    <!-- Bottom Navigation (<768px) — desplazable horizontalmente: el rol
    Administrador acumula más ítems de los que caben en un ancho móvil fijo;
    esto es una solución provisional hasta el pase de refactor de diseño. -->
    <nav
      class="md:hidden fixed bottom-0 left-0 w-full z-50 flex items-center gap-1 h-[80px] px-gutter-mobile bg-surface-container rounded-t-xl shadow-lg overflow-x-auto"
    >
      <RouterLink
        v-for="item in navItems"
        :key="item.routeName"
        :to="{ name: item.routeName }"
        class="flex flex-col items-center justify-center rounded-full min-w-[64px] shrink-0 py-1 active:scale-90 transition-all duration-200"
        :class="route.name === item.routeName ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant'"
      >
        <span class="material-symbols-outlined mb-1">{{ item.icon }}</span>
        <span class="font-label-md text-label-md whitespace-nowrap">{{ item.label }}</span>
      </RouterLink>
    </nav>
  </div>
</template>
