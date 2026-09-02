<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useInvitadoStore } from '@/stores/invitado'
import { RUTA_INICIO_POR_ROL } from '@/router'
import { ApiError } from '@/api/client'
import { sincronizarCola, type ResultadoSincronizacion } from '@/services/sincronizacion'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import AlertBanner from '@/components/ui/AlertBanner.vue'
import ThemeToggle from '@/components/ui/ThemeToggle.vue'
import AppIcon from '@/components/ui/AppIcon.vue'

const router = useRouter()
const auth = useAuthStore()
const invitado = useInvitadoStore()

const email = ref('')
const password = ref('')
const cargando = ref(false)
const errorMensaje = ref<string | null>(null)

// Se lee una sola vez y se limpia en la store para no repetir el aviso en
// visitas futuras al Login (mejora #3 de docs/mejoras-frontend.md).
const avisoSesionExpirada = ref(auth.sesionExpirada)
auth.limpiarAvisoSesionExpirada()

function continuarComoInvitado() {
  invitado.iniciar()
  router.push({ name: 'estancias' })
}

// Se muestra reemplazando el formulario, in-place, mientras sube a la API lo
// que se registró sin conexión — es la única pantalla que necesita esta UI.
const sincronizando = ref(false)
const resultadoSync = ref<ResultadoSincronizacion | null>(null)

async function continuarTrasSincronizar() {
  await router.push(RUTA_INICIO_POR_ROL[auth.rol!])
}

async function enviar() {
  errorMensaje.value = null
  cargando.value = true
  try {
    await auth.iniciarSesion({ email: email.value, password: password.value })
    // El login real tuvo éxito: ya no estamos en modo invitado, sin importar
    // cómo termine la sincronización a continuación.
    invitado.salir()
    if (invitado.tienePendientes) {
      sincronizando.value = true
      resultadoSync.value = await sincronizarCola()
    } else {
      await router.push(RUTA_INICIO_POR_ROL[auth.rol!])
    }
  } catch (error) {
    errorMensaje.value = error instanceof ApiError ? error.message : 'Ocurrió un error inesperado.'
  } finally {
    cargando.value = false
    sincronizando.value = false
  }
}
</script>

<template>
  <!-- Mobile (<768px) — fiel a docs/stitch-html/01-login-mobile.html: tarjeta centrada -->
  <div
    class="md:hidden min-h-screen bg-background text-on-surface flex items-center justify-center font-body-md antialiased p-margin-mobile relative"
  >
    <div class="absolute top-4 right-4"><ThemeToggle /></div>
    <main
      class="w-full max-w-sm bg-surface-container-lowest rounded-xl shadow-sm border border-surface-variant p-stack-lg flex flex-col gap-stack-lg"
    >
      <header class="flex flex-col items-center text-center gap-base">
        <div
          class="h-16 w-16 bg-primary-container rounded-full flex items-center justify-center mb-stack-sm shadow-sm shadow-primary/5"
        >
          <AppIcon name="agriculture" :size="30" class="text-on-primary-container" />
        </div>
        <h1 class="font-headline-lg text-headline-lg text-primary">SIGA</h1>
        <p class="font-body-md text-body-md text-on-surface-variant">Sistema de Registro y Captación de Ganado</p>
      </header>

      <template v-if="sincronizando || resultadoSync">
        <div v-if="sincronizando" class="flex items-center gap-3 justify-center py-4">
          <AppIcon name="sync" :size="20" class="animate-spin text-primary" />
          <span class="font-body-md text-body-md text-on-surface-variant">Sincronizando registros del dispositivo…</span>
        </div>
        <template v-else-if="resultadoSync">
          <AlertBanner :variant="resultadoSync.errores > 0 ? 'error' : 'info'">
            {{ resultadoSync.sincronizados }} registro(s) sincronizado(s).
            <template v-if="resultadoSync.pendientes > 0"> {{ resultadoSync.pendientes }} quedaron pendientes y se reintentarán la próxima vez.</template>
            <template v-if="resultadoSync.errores > 0"> {{ resultadoSync.errores }} tuvieron un error y no se sincronizaron.</template>
          </AlertBanner>
          <BaseButton icon="task_alt" @click="continuarTrasSincronizar">Continuar</BaseButton>
        </template>
      </template>

      <template v-else>
        <AlertBanner v-if="avisoSesionExpirada && !errorMensaje" variant="info">
          Tu sesión expiró. Inicia sesión nuevamente.
        </AlertBanner>
        <AlertBanner v-if="invitado.activo" variant="info">
          Modo invitado activo — {{ invitado.pendientes }} elemento(s) pendiente(s) de sincronizar. Inicie sesión para sincronizarlos.
        </AlertBanner>

        <form class="flex flex-col gap-stack-md" @submit.prevent="enviar">
          <BaseInput
            v-model="email"
            type="email"
            label="Correo electrónico"
            icon="mail"
            placeholder="usuario@siga.com"
            autocomplete="username"
            required
          />
          <BaseInput
            v-model="password"
            type="password"
            label="Contraseña"
            icon="lock"
            placeholder="••••••••"
            autocomplete="current-password"
            required
          />

          <div class="flex flex-col gap-stack-sm mt-base">
            <BaseButton type="submit" icon="login" :loading="cargando">Iniciar Sesión</BaseButton>
            <BaseButton type="button" variant="text" size="sm" icon="person" @click="continuarComoInvitado">
              Acceder como invitado
            </BaseButton>
            <AlertBanner v-if="errorMensaje" variant="error">{{ errorMensaje }}</AlertBanner>
          </div>
        </form>
      </template>
    </main>
  </div>

  <!-- Desktop (>=768px) — fiel a docs/stitch-html/01-login-desktop.html: panel dividido -->
  <div class="hidden md:flex min-h-screen bg-background antialiased">
    <div class="w-1/2 relative bg-gradient-to-br from-tertiary via-tertiary-container to-primary flex-col justify-between">
      <div class="absolute inset-0 bg-black/30" />
      <div class="relative z-10 p-12 h-full flex flex-col justify-between">
        <h1 class="font-headline-lg text-headline-lg text-white tracking-tight flex items-center gap-2">
          <AppIcon name="agriculture" :size="30" />
          SIGA
        </h1>
        <div class="max-w-md">
          <h2 class="text-white font-headline-md text-headline-md mb-stack-sm">
            Sistema de Registro y Captación de Ganado
          </h2>
          <p class="text-white/80 font-body-lg text-body-lg">
            Plataforma profesional para la gestión de datos en campo, garantizando precisión y trazabilidad en
            entornos agrícolas.
          </p>
        </div>
      </div>
    </div>

    <div class="w-1/2 bg-surface flex flex-col justify-center items-center p-16 relative">
      <div class="absolute top-8 right-8"><ThemeToggle /></div>
      <div class="w-full max-w-[400px]">
        <div class="mb-stack-lg">
          <h2 class="font-headline-lg text-headline-lg text-on-surface mb-2">Iniciar Sesión</h2>
          <p class="font-body-md text-body-md text-on-surface-variant">
            Ingrese sus credenciales para acceder al sistema
          </p>
        </div>

        <template v-if="sincronizando || resultadoSync">
          <div v-if="sincronizando" class="flex items-center gap-3 py-4">
            <AppIcon name="sync" :size="20" class="animate-spin text-primary" />
            <span class="font-body-md text-body-md text-on-surface-variant">Sincronizando registros del dispositivo…</span>
          </div>
          <template v-else-if="resultadoSync">
            <AlertBanner :variant="resultadoSync.errores > 0 ? 'error' : 'info'" class="mb-stack-md">
              {{ resultadoSync.sincronizados }} registro(s) sincronizado(s).
              <template v-if="resultadoSync.pendientes > 0"> {{ resultadoSync.pendientes }} quedaron pendientes y se reintentarán la próxima vez.</template>
              <template v-if="resultadoSync.errores > 0"> {{ resultadoSync.errores }} tuvieron un error y no se sincronizaron.</template>
            </AlertBanner>
            <BaseButton icon="task_alt" pill @click="continuarTrasSincronizar">Continuar</BaseButton>
          </template>
        </template>

        <template v-else>
          <AlertBanner v-if="avisoSesionExpirada && !errorMensaje" variant="info" class="mb-stack-md">
            Tu sesión expiró. Inicia sesión nuevamente.
          </AlertBanner>
          <AlertBanner v-if="invitado.activo" variant="info" class="mb-stack-md">
            Modo invitado activo — {{ invitado.pendientes }} elemento(s) pendiente(s) de sincronizar. Inicie sesión para sincronizarlos.
          </AlertBanner>
          <AlertBanner v-if="errorMensaje" variant="error" class="mb-stack-md">{{ errorMensaje }}</AlertBanner>

          <form class="flex flex-col gap-stack-md" @submit.prevent="enviar">
            <BaseInput
              v-model="email"
              type="email"
              label="Correo electrónico"
              icon="mail"
              placeholder="ejemplo@correo.com"
              autocomplete="username"
              required
            />
            <BaseInput
              v-model="password"
              type="password"
              label="Contraseña"
              icon="lock"
              placeholder="Ingrese su contraseña"
              autocomplete="current-password"
              required
            />
            <div class="pt-stack-sm flex flex-col gap-stack-sm">
              <BaseButton type="submit" pill :loading="cargando">Iniciar Sesión</BaseButton>
              <BaseButton type="button" variant="text" size="sm" pill icon="person" @click="continuarComoInvitado">
                Acceder como invitado
              </BaseButton>
            </div>
          </form>
        </template>
      </div>

      <div class="absolute bottom-8 text-center w-full">
        <span class="font-label-md text-label-md text-on-surface-variant">v1.0.0</span>
      </div>
    </div>
  </div>
</template>
