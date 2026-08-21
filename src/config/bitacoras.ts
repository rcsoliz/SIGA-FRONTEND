// Config declarativa para las 4 bitácoras (Pesaje, Sanitario, Movimiento,
// Alimentación) — comparten un único componente de vista
// (src/views/bitacoras/BitacoraView.vue) parametrizado por esta config, tal
// como indica la sección 5.2 de la especificación ("conviene un único
// componente de bitácora parametrizado por tipo, no 4 implementaciones
// separadas"). El tipo `any` en los puntos de despacho es deliberado: es la
// frontera dinámica que permite reutilizar una sola vista para 4 DTOs con
// forma distinta; los módulos api/*.ts que llama sí están tipados.

import * as pesajeApi from '@/api/pesaje'
import * as sanitarioApi from '@/api/sanitario'
import * as movimientosApi from '@/api/movimientos'
import * as alimentacionApi from '@/api/alimentacion'
import {
  CategoriaGanadoLabels,
  TipoEventoSanitarioLabels,
  TipoManejoAlimentarioLabels,
} from '@/types/enums'

export type TipoBitacora = 'Pesaje' | 'Sanitario' | 'Movimiento' | 'Alimentacion'

export interface CampoBitacora {
  key: string
  label: string
  type: 'text' | 'number' | 'date' | 'select' | 'textarea'
  required?: boolean
  options?: { value: string; label: string }[]
  suffix?: string
  step?: string
}

export interface ColumnaBitacora {
  key: string
  label: string
  align?: 'left' | 'right' | 'center'
}

export interface BitacoraConfig {
  tipo: TipoBitacora
  titulo: string
  icono: string
  descripcion: string
  /** Crear registro Sanitario no exige rol Captador en el backend (a
   * diferencia de las otras 3) — ver RegistrosSanitariosController.cs. */
  soloCaptador: boolean
  campos: CampoBitacora[]
  columnas: ColumnaBitacora[]
  formatearCelda: (row: any, key: string) => string
  resumenPrincipal: (row: any) => string
  resumenSecundario: (row: any) => string
  listar: (captacionId: string) => Promise<any[]>
  construirPayload: (form: Record<string, any>, captacionId: string, fechaCreacionLocal: string) => any
  crear: (payload: any) => Promise<any>
}

export function formatearFechaCorta(iso: string): string {
  return new Date(iso).toLocaleDateString('es-BO', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

const opcionesTipoEvento = (Object.keys(TipoEventoSanitarioLabels) as (keyof typeof TipoEventoSanitarioLabels)[]).map(
  (value) => ({ value, label: TipoEventoSanitarioLabels[value] }),
)
const opcionesCategoria = (Object.keys(CategoriaGanadoLabels) as (keyof typeof CategoriaGanadoLabels)[]).map((value) => ({
  value,
  label: CategoriaGanadoLabels[value],
}))
const opcionesAlimentacion = (
  Object.keys(TipoManejoAlimentarioLabels) as (keyof typeof TipoManejoAlimentarioLabels)[]
).map((value) => ({ value, label: TipoManejoAlimentarioLabels[value] }))

export const BITACORAS: Record<TipoBitacora, BitacoraConfig> = {
  Pesaje: {
    tipo: 'Pesaje',
    titulo: 'Registro de Pesaje',
    icono: 'scale',
    descripcion: 'Ingrese los datos de peso para el grupo seleccionado.',
    soloCaptador: true,
    campos: [
      { key: 'fecha', label: 'Fecha del Pesaje', type: 'date', required: true },
      { key: 'pesoPromedioKg', label: 'Peso Promedio', type: 'number', step: '0.1', suffix: 'kg', required: true },
      { key: 'cantidadCabezasPesadas', label: 'Cantidad de Cabezas Pesadas', type: 'number' },
      { key: 'observaciones', label: 'Observaciones', type: 'textarea' },
    ],
    columnas: [
      { key: 'fecha', label: 'Fecha' },
      { key: 'pesoPromedioKg', label: 'Peso Promedio (Kg)', align: 'right' },
      { key: 'cantidadCabezasPesadas', label: 'Cabezas Pesadas', align: 'center' },
      { key: 'observaciones', label: 'Observaciones' },
    ],
    formatearCelda: (row, key) => {
      if (key === 'fecha') return formatearFechaCorta(row.fecha)
      if (key === 'cantidadCabezasPesadas') return row.cantidadCabezasPesadas ?? '—'
      if (key === 'observaciones') return row.observaciones ?? '—'
      return String(row[key])
    },
    resumenPrincipal: (row) => `${row.pesoPromedioKg} Kg`,
    resumenSecundario: (row) => (row.cantidadCabezasPesadas ? `${row.cantidadCabezasPesadas} cab.` : '—'),
    listar: pesajeApi.listarPorCaptacion,
    construirPayload: (form, captacionGanadoId, fechaCreacionLocal) => ({
      captacionGanadoId,
      fecha: new Date(form.fecha).toISOString(),
      pesoPromedioKg: form.pesoPromedioKg,
      cantidadCabezasPesadas: form.cantidadCabezasPesadas || null,
      observaciones: form.observaciones || null,
      fechaCreacionLocal,
    }),
    crear: pesajeApi.crear,
  },

  Sanitario: {
    tipo: 'Sanitario',
    titulo: 'Registro Sanitario',
    icono: 'vaccines',
    descripcion: 'Registre eventos de salud, tratamientos o controles del grupo.',
    soloCaptador: false,
    campos: [
      { key: 'fecha', label: 'Fecha del Evento', type: 'date', required: true },
      { key: 'tipoEvento', label: 'Tipo de Evento', type: 'select', required: true, options: opcionesTipoEvento },
      { key: 'productoTratamiento', label: 'Producto / Tratamiento', type: 'text' },
      { key: 'observaciones', label: 'Observaciones', type: 'textarea' },
    ],
    columnas: [
      { key: 'fecha', label: 'Fecha' },
      { key: 'tipoEvento', label: 'Tipo de Evento' },
      { key: 'productoTratamiento', label: 'Producto/Tratamiento' },
      { key: 'registradoPorNombre', label: 'Registrado por' },
      { key: 'observaciones', label: 'Observaciones' },
    ],
    formatearCelda: (row, key) => {
      if (key === 'fecha') return formatearFechaCorta(row.fecha)
      if (key === 'tipoEvento') return TipoEventoSanitarioLabels[row.tipoEvento as keyof typeof TipoEventoSanitarioLabels]
      if (key === 'productoTratamiento') return row.productoTratamiento ?? '—'
      if (key === 'observaciones') return row.observaciones ?? '—'
      return String(row[key])
    },
    resumenPrincipal: (row) => TipoEventoSanitarioLabels[row.tipoEvento as keyof typeof TipoEventoSanitarioLabels],
    resumenSecundario: (row) => row.productoTratamiento ?? row.registradoPorNombre,
    listar: sanitarioApi.listarPorCaptacion,
    construirPayload: (form, captacionGanadoId, fechaCreacionLocal) => ({
      captacionGanadoId,
      fecha: new Date(form.fecha).toISOString(),
      tipoEvento: form.tipoEvento,
      productoTratamiento: form.productoTratamiento || null,
      observaciones: form.observaciones || null,
      fechaCreacionLocal,
    }),
    crear: sanitarioApi.crear,
  },

  Movimiento: {
    tipo: 'Movimiento',
    titulo: 'Registro de Movimiento',
    icono: 'local_shipping',
    descripcion: 'Registre traslados de ganado entre potreros o corrales.',
    soloCaptador: true,
    campos: [
      { key: 'fecha', label: 'Fecha del Movimiento', type: 'date', required: true },
      { key: 'tipoGanado', label: 'Tipo de Ganado', type: 'select', required: true, options: opcionesCategoria },
      { key: 'cantidadCabezas', label: 'Cantidad de Cabezas', type: 'number', required: true },
      { key: 'origen', label: 'Origen', type: 'text', required: true, },
      { key: 'destino', label: 'Destino', type: 'text', required: true },
    ],
    columnas: [
      { key: 'fecha', label: 'Fecha' },
      { key: 'tipoGanado', label: 'Tipo de Ganado' },
      { key: 'cantidadCabezas', label: 'Cabezas', align: 'right' },
      { key: 'origen', label: 'Origen' },
      { key: 'destino', label: 'Destino' },
    ],
    formatearCelda: (row, key) => {
      if (key === 'fecha') return formatearFechaCorta(row.fecha)
      if (key === 'tipoGanado') return CategoriaGanadoLabels[row.tipoGanado as keyof typeof CategoriaGanadoLabels]
      return String(row[key])
    },
    resumenPrincipal: (row) => `${row.cantidadCabezas} cab.`,
    resumenSecundario: (row) => `${row.origen} → ${row.destino}`,
    listar: movimientosApi.listarPorCaptacion,
    construirPayload: (form, captacionGanadoId, fechaCreacionLocal) => ({
      captacionGanadoId,
      fecha: new Date(form.fecha).toISOString(),
      tipoGanado: form.tipoGanado,
      cantidadCabezas: form.cantidadCabezas,
      origen: form.origen,
      destino: form.destino,
      fechaCreacionLocal,
    }),
    crear: movimientosApi.crear,
  },

  Alimentacion: {
    tipo: 'Alimentacion',
    titulo: 'Registro de Alimentación',
    icono: 'grass',
    descripcion: 'Registre la ración y suplementación aplicada al grupo.',
    soloCaptador: true,
    campos: [
      { key: 'fecha', label: 'Fecha', type: 'date', required: true },
      { key: 'tipoAlimentacion', label: 'Tipo de Alimentación', type: 'select', required: true, options: opcionesAlimentacion },
      { key: 'racionBaseKgAnimal', label: 'Ración Base', type: 'number', step: '0.1', suffix: 'kg/animal' },
      { key: 'suplementoProteicoKgAnimal', label: 'Suplemento Proteico', type: 'number', step: '0.1', suffix: 'kg/animal' },
      { key: 'observaciones', label: 'Observaciones', type: 'textarea' },
    ],
    columnas: [
      { key: 'fecha', label: 'Fecha' },
      { key: 'tipoAlimentacion', label: 'Tipo' },
      { key: 'racionBaseKgAnimal', label: 'Ración Base (kg/animal)', align: 'right' },
      { key: 'suplementoProteicoKgAnimal', label: 'Suplemento (kg/animal)', align: 'right' },
      { key: 'observaciones', label: 'Observaciones' },
    ],
    formatearCelda: (row, key) => {
      if (key === 'fecha') return formatearFechaCorta(row.fecha)
      if (key === 'tipoAlimentacion')
        return TipoManejoAlimentarioLabels[row.tipoAlimentacion as keyof typeof TipoManejoAlimentarioLabels]
      if (key === 'racionBaseKgAnimal') return row.racionBaseKgAnimal ?? '—'
      if (key === 'suplementoProteicoKgAnimal') return row.suplementoProteicoKgAnimal ?? '—'
      if (key === 'observaciones') return row.observaciones ?? '—'
      return String(row[key])
    },
    resumenPrincipal: (row) =>
      TipoManejoAlimentarioLabels[row.tipoAlimentacion as keyof typeof TipoManejoAlimentarioLabels],
    resumenSecundario: (row) => (row.racionBaseKgAnimal ? `${row.racionBaseKgAnimal} kg/animal` : '—'),
    listar: alimentacionApi.listarPorCaptacion,
    construirPayload: (form, captacionGanadoId, fechaCreacionLocal) => ({
      captacionGanadoId,
      fecha: new Date(form.fecha).toISOString(),
      tipoAlimentacion: form.tipoAlimentacion,
      racionBaseKgAnimal: form.racionBaseKgAnimal || null,
      suplementoProteicoKgAnimal: form.suplementoProteicoKgAnimal || null,
      observaciones: form.observaciones || null,
      fechaCreacionLocal,
    }),
    crear: alimentacionApi.crear,
  },
}
