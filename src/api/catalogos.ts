import { apiClient } from './client'
import type {
  DepartamentoDto,
  MunicipioDto,
  ProductoTratamientoDto,
  ProvinciaDto,
  RazaDto,
} from '@/types/dto'

export async function listarDepartamentos(): Promise<DepartamentoDto[]> {
  const { data } = await apiClient.get<DepartamentoDto[]>('/catalogos/departamentos')
  return data
}

export async function listarProvincias(departamentoId: string): Promise<ProvinciaDto[]> {
  const { data } = await apiClient.get<ProvinciaDto[]>(
    `/catalogos/departamentos/${departamentoId}/provincias`,
  )
  return data
}

export async function listarMunicipios(provinciaId: string): Promise<MunicipioDto[]> {
  const { data } = await apiClient.get<MunicipioDto[]>(
    `/catalogos/provincias/${provinciaId}/municipios`,
  )
  return data
}

export async function listarRazas(): Promise<RazaDto[]> {
  const { data } = await apiClient.get<RazaDto[]>('/catalogos/razas')
  return data
}

export async function listarProductosTratamiento(): Promise<ProductoTratamientoDto[]> {
  const { data } = await apiClient.get<ProductoTratamientoDto[]>(
    '/catalogos/productos-tratamiento',
  )
  return data
}
