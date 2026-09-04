import { apiClient } from './client'
import type {
  CaptacionGanadoDto,
  CreateCaptacionGanadoDto,
  CreateDetalleLoteGanadoDto,
  DetalleLoteGanadoDto,
  UpdateCaptacionGanadoDto,
} from '@/types/dto'

export async function listarPorEstancia(estanciaId: string): Promise<CaptacionGanadoDto[]> {
  const { data } = await apiClient.get<CaptacionGanadoDto[]>('/captaciones', { params: { estanciaId } })
  return data
}

/** estanciaId es opcional en el backend: sin filtro devuelve las Captaciones
 * de todas las Estancias en una sola llamada — usado por los informes que
 * cruzan Estancias (ej. Planificación de Faena), evita el N+1 de pedir
 * estancia por estancia. */
export async function listar(): Promise<CaptacionGanadoDto[]> {
  const { data } = await apiClient.get<CaptacionGanadoDto[]>('/captaciones')
  return data
}

export async function obtener(id: string): Promise<CaptacionGanadoDto> {
  const { data } = await apiClient.get<CaptacionGanadoDto>(`/captaciones/${id}`)
  return data
}

export async function crear(payload: CreateCaptacionGanadoDto): Promise<CaptacionGanadoDto> {
  const { data } = await apiClient.post<CaptacionGanadoDto>('/captaciones', payload)
  return data
}

export async function actualizar(id: string, payload: UpdateCaptacionGanadoDto): Promise<CaptacionGanadoDto> {
  const { data } = await apiClient.put<CaptacionGanadoDto>(`/captaciones/${id}`, payload)
  return data
}

export async function eliminar(id: string): Promise<void> {
  await apiClient.delete(`/captaciones/${id}`)
}

export async function agregarDetalle(id: string, payload: CreateDetalleLoteGanadoDto): Promise<DetalleLoteGanadoDto> {
  const { data } = await apiClient.post<DetalleLoteGanadoDto>(`/captaciones/${id}/detalles`, payload)
  return data
}

export async function eliminarDetalle(id: string, detalleId: string): Promise<void> {
  await apiClient.delete(`/captaciones/${id}/detalles/${detalleId}`)
}
