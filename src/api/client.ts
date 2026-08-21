import axios, { AxiosError } from 'axios'
import { leerSesion, limpiarSesion } from '@/utils/authStorage'
import type { ProblemDetails } from '@/types/dto'

/** Se emite en window cuando una respuesta 401 invalida la sesión activa. */
export const EVENTO_NO_AUTORIZADO = 'siga:no-autorizado'

/** Error normalizado a partir del application/problem+json del backend (sección 2.4). */
export class ApiError extends Error {
  readonly status: number
  readonly title: string

  constructor(problem: ProblemDetails) {
    super(problem.detail)
    this.status = problem.status
    this.title = problem.title
  }
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const sesion = leerSesion()
  if (sesion?.token) {
    config.headers.Authorization = `Bearer ${sesion.token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ProblemDetails>) => {
    const problem = error.response?.data

    if (error.response?.status === 401) {
      limpiarSesion()
      window.dispatchEvent(new CustomEvent(EVENTO_NO_AUTORIZADO))
    }

    if (problem?.status && problem?.detail) {
      return Promise.reject(new ApiError(problem))
    }

    // Fallback para fallas de red o respuestas sin el contrato problem+json
    // (ej. backend caído, timeout).
    return Promise.reject(
      new ApiError({
        status: error.response?.status ?? 0,
        title: 'Error de conexión',
        detail: 'No se pudo conectar con el servidor. Verifique su conexión e intente nuevamente.',
      }),
    )
  },
)
