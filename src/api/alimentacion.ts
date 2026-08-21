import { apiClient } from './client'
import type { CreateRegistroAlimentacionDto, RegistroAlimentacionDto } from '@/types/dto'

export async function listarPorCaptacion(captacionId: string): Promise<RegistroAlimentacionDto[]> {
  const { data } = await apiClient.get<RegistroAlimentacionDto[]>('/registros-alimentacion', { params: { captacionId } })
  return data
}

export async function crear(payload: CreateRegistroAlimentacionDto): Promise<RegistroAlimentacionDto> {
  const { data } = await apiClient.post<RegistroAlimentacionDto>('/registros-alimentacion', payload)
  return data
}
