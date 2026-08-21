import { apiClient } from './client'
import type { LoginRequestDto, LoginResponseDto } from '@/types/dto'

export async function login(credenciales: LoginRequestDto): Promise<LoginResponseDto> {
  const { data } = await apiClient.post<LoginResponseDto>('/auth/login', credenciales)
  return data
}
