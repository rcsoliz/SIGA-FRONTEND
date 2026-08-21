import { apiClient } from './client'
import type { CaptadorProductividadDto, CaptadorRankingDto, DashboardDto } from '@/types/dto'

export async function obtenerResumen(): Promise<DashboardDto> {
  const { data } = await apiClient.get<DashboardDto>('/dashboard')
  return data
}

export async function listarProductividadCaptadores(desde?: string, hasta?: string): Promise<CaptadorRankingDto[]> {
  const { data } = await apiClient.get<CaptadorRankingDto[]>('/dashboard/captadores', { params: { desde, hasta } })
  return data
}

export async function obtenerProductividadCaptador(
  id: string,
  desde?: string,
  hasta?: string,
): Promise<CaptadorProductividadDto> {
  const { data } = await apiClient.get<CaptadorProductividadDto>(`/dashboard/captadores/${id}`, {
    params: { desde, hasta },
  })
  return data
}
