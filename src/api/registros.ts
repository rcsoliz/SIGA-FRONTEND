import { apiClient } from './client'
import type { BuscarRegistrosParams, RegistroCampoDto } from '@/types/dto'

export async function buscar(params: BuscarRegistrosParams): Promise<RegistroCampoDto[]> {
  const { data } = await apiClient.get<RegistroCampoDto[]>('/registros', { params })
  return data
}
