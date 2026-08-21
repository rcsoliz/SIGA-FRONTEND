import { apiClient } from './client'
import type { CreateMovimientoGanadoDto, MovimientoGanadoDto } from '@/types/dto'

export async function listarPorCaptacion(captacionId: string): Promise<MovimientoGanadoDto[]> {
  const { data } = await apiClient.get<MovimientoGanadoDto[]>('/movimientos', { params: { captacionId } })
  return data
}

export async function crear(payload: CreateMovimientoGanadoDto): Promise<MovimientoGanadoDto> {
  const { data } = await apiClient.post<MovimientoGanadoDto>('/movimientos', payload)
  return data
}
