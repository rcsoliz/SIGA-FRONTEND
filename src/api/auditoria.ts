import { apiClient } from './client'
import type { BuscarAuditoriaParams, LogAuditoriaDto } from '@/types/dto'

export async function buscar(params: BuscarAuditoriaParams): Promise<LogAuditoriaDto[]> {
  const { data } = await apiClient.get<LogAuditoriaDto[]>('/auditoria', { params })
  return data
}
