<script setup lang="ts">
// Estilo de campo para formularios de captura de datos (Estancia, Captación,
// bitácoras, Usuario...) — distinto del BaseInput de Login a propósito: los
// mockups de "Registro de Estancia" (desktop y mobile) usan consistentemente
// un patrón de tarjeta con label arriba, sin ícono, mientras que Login usa
// inputs con ícono en píldora. En mobile el campo completo es una tarjeta
// con borde/sombra e input sin borde propio; en desktop (md+) el input
// lleva su propio borde y la tarjeta desaparece.
import { computed, ref, useId } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string | number | null
    label: string
    type?: 'text' | 'tel' | 'number' | 'email' | 'password' | 'date' | 'select' | 'textarea'
    required?: boolean
    placeholder?: string
    suffix?: string
    step?: string
    errorMessage?: string
    options?: { value: string; label: string }[]
  }>(),
  {
    type: 'text',
    required: false,
    placeholder: undefined,
    suffix: undefined,
    step: undefined,
    errorMessage: undefined,
    options: () => [],
  },
)

const emit = defineEmits<{ 'update:modelValue': [value: string | number | null] }>()

const id = useId()

// Validación al perder el foco (no solo al enviar el formulario — mejora #6
// de docs/mejoras-frontend.md): cubre el caso "obligatorio y vacío", que es
// la validación que ya existía en cada formulario al hacer submit. Un
// `errorMessage` externo (del padre) siempre tiene prioridad sobre este.
const tocado = ref(false)
const errorRequerido = computed(() => {
  if (!tocado.value || !props.required) return null
  const vacio = props.modelValue === null || props.modelValue === ''
  return vacio ? 'Este campo es obligatorio.' : null
})
const errorMostrado = computed(() => props.errorMessage ?? errorRequerido.value)

function onBlur() {
  tocado.value = true
}

function onInput(event: Event) {
  const target = event.target as HTMLInputElement | HTMLSelectElement
  if (props.type === 'number') {
    emit('update:modelValue', target.value === '' ? null : Number(target.value))
  } else {
    emit('update:modelValue', target.value === '' ? null : target.value)
  }
}

const fieldClasses =
  'w-full bg-transparent border-none p-0 focus:ring-0 text-body-lg font-body-lg text-on-surface ' +
  'placeholder:text-outline/50 h-6 md:h-12 md:px-4 md:rounded md:border md:border-outline-variant ' +
  'md:bg-surface-container-lowest md:hover:bg-surface-container-low md:focus:border-primary ' +
  'md:focus:ring-1 md:focus:ring-primary transition-all appearance-none'
</script>

<template>
  <div
    class="flex flex-col gap-1 md:gap-2 bg-surface-container-lowest md:bg-transparent p-4 md:p-0 rounded-xl md:rounded-none shadow-sm md:shadow-none border md:border-none transition-all focus-within:border-primary focus-within:ring-1 focus-within:ring-primary md:focus-within:ring-0"
    :class="errorMostrado ? 'border-error' : 'border-outline-variant/50'"
  >
    <label :for="id" class="text-label-md font-label-md text-on-surface-variant flex items-center gap-1">
      {{ label }}
      <span v-if="required" class="text-error text-body-lg leading-none">*</span>
    </label>

    <select v-if="type === 'select'" :id="id" :value="modelValue ?? ''" :class="fieldClasses" @change="onInput" @blur="onBlur">
      <option disabled value="">Seleccione</option>
      <option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
    </select>

    <textarea
      v-else-if="type === 'textarea'"
      :id="id"
      :value="modelValue ?? ''"
      :placeholder="placeholder"
      rows="3"
      :class="[fieldClasses, 'h-auto md:h-auto resize-none']"
      @input="onInput"
      @blur="onBlur"
    />

    <div v-else class="relative">
      <input
        :id="id"
        :type="type"
        :value="modelValue ?? ''"
        :placeholder="placeholder"
        :step="step"
        :inputmode="type === 'number' ? 'decimal' : undefined"
        :class="[fieldClasses, suffix ? 'md:pr-12' : '']"
        @input="onInput"
        @blur="onBlur"
      />
      <span v-if="suffix" class="hidden md:inline absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-body-md">
        {{ suffix }}
      </span>
    </div>

    <p v-if="errorMostrado" class="font-body-md text-body-md text-error">{{ errorMostrado }}</p>
  </div>
</template>
