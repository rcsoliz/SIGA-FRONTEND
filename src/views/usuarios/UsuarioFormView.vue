<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import AlertBanner from '@/components/ui/AlertBanner.vue'
import FormField from '@/components/ui/FormField.vue'
import { ApiError } from '@/api/client'
import { useToast } from '@/composables/useToast'
import * as usuariosApi from '@/api/usuarios'
import { RolUsuarioLabels, type RolUsuario } from '@/types/enums'

const router = useRouter()
const { mostrar } = useToast()

const form = reactive({
  nombre: '',
  email: '',
  password: '',
  cargo: '' as string | null,
  rol: '' as RolUsuario | '',
})

const rolOptions = (Object.keys(RolUsuarioLabels) as RolUsuario[]).map((value) => ({ value, label: RolUsuarioLabels[value] }))

const guardando = ref(false)
const errorMensaje = ref<string | null>(null)

async function guardar() {
  errorMensaje.value = null
  if (!form.nombre.trim() || !form.email.trim() || !form.password.trim() || !form.rol) {
    errorMensaje.value = 'Nombre, correo, contraseña y rol son obligatorios.'
    return
  }
  guardando.value = true
  try {
    await usuariosApi.crear({
      nombre: form.nombre,
      email: form.email,
      password: form.password,
      cargo: form.cargo || null,
      rol: form.rol,
    })
    mostrar('Usuario creado correctamente.')
    await router.push({ name: 'usuarios' })
  } catch (error) {
    errorMensaje.value = error instanceof ApiError ? error.message : 'Ocurrió un error inesperado.'
  } finally {
    guardando.value = false
  }
}

function cancelar() {
  router.push({ name: 'usuarios' })
}
</script>

<template>
  <AppShell>
    <div class="p-margin-mobile md:p-6 lg:p-8 md:max-w-2xl md:mx-auto w-full">
      <div class="mb-stack-lg">
        <h1 class="font-headline-lg text-headline-lg text-on-surface font-bold">Nuevo Usuario</h1>
        <p class="font-body-md text-body-md text-on-surface-variant mt-1">Cree una cuenta para un Captador o Administrador.</p>
      </div>

      <AlertBanner v-if="errorMensaje" variant="error" class="mb-stack-md">{{ errorMensaje }}</AlertBanner>

      <form
        class="flex flex-col gap-gutter-mobile md:gap-stack-lg md:bg-surface-container-lowest md:rounded-xl md:shadow-sm md:border md:border-outline-variant md:p-6"
        @submit.prevent="guardar"
      >
        <FormField v-model="form.nombre" label="Nombre Completo" required placeholder="Ej. María Quispe" />
        <FormField v-model="form.email" label="Correo Electrónico" type="text" required placeholder="usuario@siga.com" />
        <FormField v-model="form.password" label="Contraseña" type="password" required placeholder="Mínimo 8 caracteres" />
        <FormField v-model="form.cargo" label="Cargo" placeholder="Ej. Captador de Campo" />
        <FormField v-model="form.rol" type="select" label="Rol" required :options="rolOptions" />

        <div class="flex flex-col-reverse md:flex-row md:justify-end gap-stack-sm md:gap-4 md:pt-4 md:border-t md:border-outline-variant">
          <BaseButton variant="secondary" type="button" class="md:w-auto" @click="cancelar">Cancelar</BaseButton>
          <BaseButton type="submit" icon="save" :loading="guardando" class="md:w-auto">Crear Usuario</BaseButton>
        </div>
      </form>
    </div>
  </AppShell>
</template>
