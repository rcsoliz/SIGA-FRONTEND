import { apiClient } from './client'
import type { CreateRegistroSanitarioDto, RegistroSanitarioDto } from '@/types/dto'

export async function listarPorCaptacion(captacionId: string): Promise<RegistroSanitarioDto[]> {
  const { data } = await apiClient.get<RegistroSanitarioDto[]>('/registros-sanitarios', { params: { captacionId } })
  return data
}

export async function crear(payload: CreateRegistroSanitarioDto): Promise<RegistroSanitarioDto> {
  const { data } = await apiClient.post<RegistroSanitarioDto>('/registros-sanitarios', payload)
  return data
}
