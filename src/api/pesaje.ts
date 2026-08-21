import { apiClient } from './client'
import type { CreateRegistroPesajeDto, RegistroPesajeDto } from '@/types/dto'

export async function listarPorCaptacion(captacionId: string): Promise<RegistroPesajeDto[]> {
  const { data } = await apiClient.get<RegistroPesajeDto[]>('/registros-pesaje', { params: { captacionId } })
  return data
}

export async function crear(payload: CreateRegistroPesajeDto): Promise<RegistroPesajeDto> {
  const { data } = await apiClient.post<RegistroPesajeDto>('/registros-pesaje', payload)
  return data
}
