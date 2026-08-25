import { ref } from 'vue'

type Tema = 'light' | 'dark'

const STORAGE_KEY = 'siga.tema'
const tema = ref<Tema>('light')

function leerPreferencia(): Tema {
  const guardado = localStorage.getItem(STORAGE_KEY)
  if (guardado === 'light' || guardado === 'dark') return guardado
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function aplicar(t: Tema) {
  document.documentElement.classList.toggle('dark', t === 'dark')
  localStorage.setItem(STORAGE_KEY, t)
  tema.value = t
}

/** Se llama una vez desde main.ts, antes de montar la app, para evitar el
 * parpadeo de tema incorrecto en la primera pantalla (Login). */
export function inicializarTema(): void {
  aplicar(leerPreferencia())
}

export function useTheme() {
  function alternar() {
    aplicar(tema.value === 'dark' ? 'light' : 'dark')
  }
  return { tema, alternar }
}
