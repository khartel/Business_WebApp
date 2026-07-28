import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

const HEADER_FILL: [number, number, number] = [30, 41, 59] // slate-800, matches the receipt's table header
const HEADER_TEXT: [number, number, number] = [255, 255, 255]
const MUTED_TEXT: [number, number, number] = [100, 116, 139] // slate-500
const BODY_TEXT: [number, number, number] = [15, 23, 42] // slate-900
const FOOT_FILL: [number, number, number] = [241, 245, 249] // slate-100

export interface PdfSection {
  heading?: string
  head: string[]
  body: (string | number)[][]
  foot?: (string | number)[]
}

export interface PdfReportOptions {
  businessName: string
  businessLocation?: string | null
  title: string
  dateLine: string
  sections: PdfSection[]
  footerNote?: string
}

function getFinalY(doc: jsPDF): number {
  return (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 30
}

export function downloadPdfReport(filename: string, options: PdfReportOptions) {
  const doc = new jsPDF()
  const marginX = 14
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFont("helvetica", "bold")
  doc.setFontSize(13)
  doc.setTextColor(...BODY_TEXT)
  doc.text(options.businessName, marginX, 18)

  doc.setFontSize(15)
  doc.text(options.title, pageWidth - marginX, 18, { align: "right" })

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(...MUTED_TEXT)
  let leftY = 24
  if (options.businessLocation) {
    doc.text(options.businessLocation, marginX, leftY)
    leftY += 5
  }
  doc.text(options.dateLine, pageWidth - marginX, 24, { align: "right" })

  let cursorY = Math.max(leftY, 28) + 4

  for (const section of options.sections) {
    if (section.heading) {
      doc.setFont("helvetica", "bold")
      doc.setFontSize(10)
      doc.setTextColor(...BODY_TEXT)
      doc.text(section.heading, marginX, cursorY)
      cursorY += 5
    }
    autoTable(doc, {
      startY: cursorY,
      head: [section.head],
      body: section.body,
      foot: section.foot ? [section.foot] : undefined,
      margin: { left: marginX, right: marginX },
      styles: { fontSize: 9, textColor: BODY_TEXT, cellPadding: 3 },
      headStyles: { fillColor: HEADER_FILL, textColor: HEADER_TEXT, fontStyle: "bold" },
      footStyles: { fillColor: FOOT_FILL, textColor: BODY_TEXT, fontStyle: "bold" },
      theme: "grid",
    })
    cursorY = getFinalY(doc) + 10
  }

  if (options.footerNote) {
    doc.setFont("helvetica", "italic")
    doc.setFontSize(8)
    doc.setTextColor(...MUTED_TEXT)
    doc.text(options.footerNote, pageWidth / 2, cursorY, { align: "center" })
  }

  doc.save(filename)
}
