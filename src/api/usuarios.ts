import { apiClient } from './client'
import type {
  AsignarPermisoDto,
  CreateSectorAsignadoDto,
  CreateUsuarioDto,
  PermisoUsuarioDto,
  SectorAsignadoDto,
  UpdateUsuarioDto,
  UsuarioDetalleDto,
  UsuarioDto,
} from '@/types/dto'

export async function listar(): Promise<UsuarioDto[]> {
  const { data } = await apiClient.get<UsuarioDto[]>('/usuarios')
  return data
}

export async function obtenerDetalle(id: string): Promise<UsuarioDetalleDto> {
  const { data } = await apiClient.get<UsuarioDetalleDto>(`/usuarios/${id}`)
  return data
}

export async function crear(payload: CreateUsuarioDto): Promise<UsuarioDto> {
  const { data } = await apiClient.post<UsuarioDto>('/usuarios', payload)
  return data
}

export async function actualizar(id: string, payload: UpdateUsuarioDto): Promise<UsuarioDto> {
  const { data } = await apiClient.put<UsuarioDto>(`/usuarios/${id}`, payload)
  return data
}

export async function asignarSector(id: string, payload: CreateSectorAsignadoDto): Promise<SectorAsignadoDto> {
  const { data } = await apiClient.post<SectorAsignadoDto>(`/usuarios/${id}/sectores`, payload)
  return data
}

export async function quitarSector(id: string, sectorId: string): Promise<void> {
  await apiClient.delete(`/usuarios/${id}/sectores/${sectorId}`)
}

export async function revocarDispositivo(id: string, dispositivoId: string): Promise<void> {
  await apiClient.post(`/usuarios/${id}/dispositivos/${dispositivoId}/revocar`)
}

export async function asignarPermiso(id: string, payload: AsignarPermisoDto): Promise<PermisoUsuarioDto> {
  const { data } = await apiClient.post<PermisoUsuarioDto>(`/usuarios/${id}/permisos`, payload)
  return data
}
