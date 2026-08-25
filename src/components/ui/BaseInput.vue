<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import AppIcon, { type NombreIcono } from './AppIcon.vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    label: string
    type?: 'text' | 'email' | 'password' | 'tel' | 'number' | 'date'
    icon?: NombreIcono
    placeholder?: string
    errorMessage?: string
    required?: boolean
    autocomplete?: string
  }>(),
  {
    type: 'text',
    icon: undefined,
    placeholder: undefined,
    errorMessage: undefined,
    required: false,
    autocomplete: undefined,
  },
)

defineEmits<{ 'update:modelValue': [value: string] }>()

const id = useId()
const passwordVisible = ref(false)
const esPassword = computed(() => props.type === 'password')
const tipoResuelto = computed(() => (esPassword.value && passwordVisible.value ? 'text' : props.type))
const tieneError = computed(() => Boolean(props.errorMessage))
</script>

<template>
  <div class="flex flex-col gap-base w-full">
    <label :for="id" class="font-label-md text-label-md text-on-surface">{{ label }}</label>
    <div
      class="relative flex items-center h-touch-target-min bg-surface-container-lowest border rounded-lg transition-colors focus-within:ring-1"
      :class="
        tieneError
          ? 'border-error focus-within:border-error focus-within:ring-error'
          : 'border-outline-variant focus-within:border-primary focus-within:ring-primary'
      "
    >
      <span v-if="icon" class="absolute left-4 text-on-surface-variant pointer-events-none flex">
        <AppIcon :name="icon" :size="20" />
      </span>
      <input
        :id="id"
        :type="tipoResuelto"
        :value="modelValue"
        :placeholder="placeholder"
        :required="required"
        :autocomplete="autocomplete"
        :aria-invalid="tieneError"
        class="w-full h-full bg-transparent border-none focus:ring-0 font-body-lg text-body-lg text-on-surface placeholder:text-outline-variant rounded-lg"
        :class="[icon ? 'pl-12' : 'pl-4', esPassword ? 'pr-12' : 'pr-4']"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
      <button
        v-if="esPassword"
        type="button"
        title="Mostrar u ocultar contraseña"
        aria-label="Mostrar u ocultar contraseña"
        class="absolute right-2 w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-on-surface focus:outline-none focus:ring-2 focus:ring-primary rounded-full transition-colors"
        @click="passwordVisible = !passwordVisible"
      >
        <AppIcon :name="passwordVisible ? 'visibility_off' : 'visibility'" :size="20" />
      </button>
    </div>
    <p v-if="tieneError" class="font-body-md text-body-md text-error">{{ errorMessage }}</p>
  </div>
</template>
