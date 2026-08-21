import { apiClient } from './client'
import type { CreateEstanciaDto, EstanciaDto, UpdateEstanciaDto } from '@/types/dto'

export async function listar(): Promise<EstanciaDto[]> {
  const { data } = await apiClient.get<EstanciaDto[]>('/estancias')
  return data
}

export async function obtener(id: string): Promise<EstanciaDto> {
  const { data } = await apiClient.get<EstanciaDto>(`/estancias/${id}`)
  return data
}

export async function crear(payload: CreateEstanciaDto): Promise<EstanciaDto> {
  const { data } = await apiClient.post<EstanciaDto>('/estancias', payload)
  return data
}

export async function actualizar(id: string, payload: UpdateEstanciaDto): Promise<EstanciaDto> {
  const { data } = await apiClient.put<EstanciaDto>(`/estancias/${id}`, payload)
  return data
}

export async function eliminar(id: string): Promise<void> {
  await apiClient.delete(`/estancias/${id}`)
}
