// Cabecera/pie estándar para los informes exportables a PDF (Reporte de
// Captación, Planificación de Faena, Maestro de Registros) — un solo lugar
// para el "look" del documento (colores de marca, franja de cabecera,
// numeración de página) en vez de repetirlo en cada vista. Usa jsPDF +
// jspdf-autotable en la API funcional (`autoTable(doc, opciones)`), no la de
// efecto lateral `doc.autoTable(...)`.
import { jsPDF } from 'jspdf'
import type { UserOptions } from 'jspdf-autotable'

// Mismos colores que tailwind.config.js/DESIGN.md — el PDF se siente parte
// del mismo sistema, no un genérico blanco y negro.
const COLOR_PRIMARIO: [number, number, number] = [15, 82, 56] // primary #0F5238
const COLOR_ON_PRIMARIO: [number, number, number] = [255, 255, 255]
const COLOR_TEXTO: [number, number, number] = [25, 28, 29] // on-surface
const COLOR_TEXTO_MUTED: [number, number, number] = [64, 73, 67] // on-surface-variant
const COLOR_BORDE: [number, number, number] = [191, 201, 193] // outline-variant
const COLOR_FILA_ALTERNA: [number, number, number] = [243, 244, 245] // surface-container-low

const MARGEN = 40
export const ALTO_ENCABEZADO = 70
const ALTO_PIE = 30

export interface DocumentoPdf {
  doc: jsPDF
  /** Se pasa como `didDrawPage` de autoTable para que el encabezado se
   * repita en cada página que el auto-paginado vaya generando. */
  dibujarEncabezado: () => void
  /** Escribe "Página X de Y" — se llama en una segunda pasada al final,
   * porque jsPDF no sabe el total de páginas hasta terminar de generar. */
  finalizarConPiePagina: () => void
  guardar: (nombreArchivo: string) => void
  /** Opciones base de autoTable ya con colores/márgenes/encabezado
   * repetido — cada vista solo agrega head/body/startY. */
  opcionesTablaBase: Partial<UserOptions>
}

export function crearDocumentoPdf(titulo: string, subtitulo?: string): DocumentoPdf {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const fechaGeneracion = new Date().toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' })

  function dibujarEncabezado() {
    const anchoPagina = doc.internal.pageSize.getWidth()
    doc.setFillColor(...COLOR_PRIMARIO)
    doc.rect(0, 0, anchoPagina, ALTO_ENCABEZADO, 'F')

    doc.setTextColor(...COLOR_ON_PRIMARIO)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text('SIGA', MARGEN, 30)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text('Sistema de Registro y Captación de Ganado', MARGEN, 46)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text(titulo, anchoPagina - MARGEN, 28, { align: 'right' })
    if (subtitulo) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.text(subtitulo, anchoPagina - MARGEN, 42, { align: 'right' })
    }
    doc.setFontSize(8)
    doc.text(`Generado: ${fechaGeneracion}`, anchoPagina - MARGEN, 56, { align: 'right' })

    doc.setTextColor(...COLOR_TEXTO)
  }

  function dibujarPie(numeroPagina: number, totalPaginas: number) {
    const anchoPagina = doc.internal.pageSize.getWidth()
    const altoPagina = doc.internal.pageSize.getHeight()
    doc.setDrawColor(...COLOR_BORDE)
    doc.line(MARGEN, altoPagina - ALTO_PIE, anchoPagina - MARGEN, altoPagina - ALTO_PIE)
    doc.setTextColor(...COLOR_TEXTO_MUTED)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text('SIGA — Sistema de Registro y Captación de Ganado', MARGEN, altoPagina - 14)
    doc.text(`Página ${numeroPagina} de ${totalPaginas}`, anchoPagina - MARGEN, altoPagina - 14, { align: 'right' })
  }

  function finalizarConPiePagina() {
    const totalPaginas = doc.getNumberOfPages()
    for (let pagina = 1; pagina <= totalPaginas; pagina++) {
      doc.setPage(pagina)
      dibujarPie(pagina, totalPaginas)
    }
  }

  function guardar(nombreArchivo: string) {
    doc.save(nombreArchivo)
  }

  const opcionesTablaBase: Partial<UserOptions> = {
    theme: 'grid',
    didDrawPage: dibujarEncabezado,
    margin: { top: ALTO_ENCABEZADO + 20, left: MARGEN, right: MARGEN, bottom: ALTO_PIE + 15 },
    headStyles: { fillColor: COLOR_PRIMARIO, textColor: COLOR_ON_PRIMARIO, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { textColor: COLOR_TEXTO, fontSize: 9 },
    alternateRowStyles: { fillColor: COLOR_FILA_ALTERNA },
    styles: { cellPadding: 6, lineColor: COLOR_BORDE, lineWidth: 0.5, overflow: 'linebreak' },
  }

  return { doc, dibujarEncabezado, finalizarConPiePagina, guardar, opcionesTablaBase }
}

/** Nombre de archivo seguro: sin tildes/símbolos que puedan romper la
 * descarga en algún sistema operativo. */
export function nombreArchivoPdf(base: string): string {
  const normalizado = base
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
  const fecha = new Date().toISOString().slice(0, 10)
  return `${normalizado}-${fecha}.pdf`
}
