import { NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import prisma from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/report/azienda.xlsx
 * Genera report Excel multi-foglio:
 *   Foglio 1 "Report Aziendale": righe per evento (come da template fornito)
 *   Foglio 2 "Anagrafica Clienti": tutti i clienti con dati completi
 * Query params: from, to, tipo, luogo
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const from  = searchParams.get('from')
    const to    = searchParams.get('to')
    const tipo  = searchParams.get('tipo')
    const luogo = searchParams.get('luogo')

    const where: any = {}
    where.stato = { not: 'annullato' }
    where.tipo = { not: 'Appuntamento' }
    if (from || to) {
      where.dataConfermata = {}
      if (from) where.dataConfermata.gte = new Date(from)
      if (to)   where.dataConfermata.lte = new Date(to)
    }
    if (tipo)  where.tipo  = tipo
    if (luogo) where.luogo = luogo

    const eventi = await prisma.evento.findMany({
      where,
      include: { clienti: { include: { cliente: true } } },
      orderBy: { dataConfermata: 'asc' }
    })

    const clienti = await prisma.cliente.findMany({
      include: { eventi: { select: { eventoId: true } } },
      orderBy: [{ cognome: 'asc' }, { nome: 'asc' }]
    })

    // ──────────────────────────────────────────────────
    const wb = new ExcelJS.Workbook()
    wb.creator = 'Villa Paris Gestionale'
    wb.created = new Date()

    // Stile condiviso header
    const applyHeader = (row: ExcelJS.Row, ncols: number) => {
      row.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 }
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E3A5F' } }
      row.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
      row.height = 28
      for (let c = 1; c <= ncols; c++) {
        row.getCell(c).border = {
          top: { style: 'medium', color: { argb: 'D4AF37' } },
          bottom: { style: 'medium', color: { argb: 'D4AF37' } },
          left: { style: 'thin', color: { argb: '4A90A4' } },
          right: { style: 'thin', color: { argb: '4A90A4' } },
        }
      }
    }

    const applyRowBorder = (row: ExcelJS.Row, ncols: number, even: boolean) => {
      if (even) row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F0F4F8' } }
      for (let c = 1; c <= ncols; c++) {
        row.getCell(c).border = {
          top: { style: 'thin', color: { argb: 'DDE3EA' } },
          bottom: { style: 'thin', color: { argb: 'DDE3EA' } },
          left: { style: 'thin', color: { argb: 'DDE3EA' } },
          right: { style: 'thin', color: { argb: 'DDE3EA' } },
        }
      }
    }

    // ══════════════════════════════════════════════════
    // FOGLIO 1 – Report Aziendale (come da template)
    // ══════════════════════════════════════════════════
    const sheet1 = wb.addWorksheet('Report Aziendale', {
      properties: { tabColor: { argb: 'D4AF37' } },
      pageSetup: { orientation: 'landscape', fitToPage: true }
    })

    // Intestazione azienda
    sheet1.mergeCells('A1:K1')
    const titleCell = sheet1.getCell('A1')
    titleCell.value = 'VILLA PARIS – Report Aziendale'
    titleCell.font = { bold: true, size: 14, color: { argb: '1E3A5F' } }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    sheet1.getRow(1).height = 32

    sheet1.mergeCells('A2:K2')
    const periodCell = sheet1.getCell('A2')
    periodCell.value = from || to
      ? `Periodo: ${from ? new Date(from).toLocaleDateString('it-IT') : '—'} → ${to ? new Date(to).toLocaleDateString('it-IT') : '—'}`
      : `Generato il: ${new Date().toLocaleDateString('it-IT')}`
    periodCell.font = { italic: true, size: 10, color: { argb: '6B7280' } }
    periodCell.alignment = { horizontal: 'center' }
    sheet1.getRow(2).height = 18

    sheet1.addRow([]) // riga vuota

    // Colonne (come da template fornito dall'utente)
    sheet1.columns = [
      { key: 'data',       width: 26 },
      { key: 'tipo',       width: 16 },
      { key: 'sposa',      width: 26 },
      { key: 'sposo',      width: 26 },
      { key: 'menuPasto',  width: 34 },
      { key: 'menuBuffet', width: 34 },
      { key: 'luogo',      width: 14 },
      { key: 'fascia',     width: 12 },
      { key: 'persone',    width: 11 },
      { key: 'prezzoPersona', width: 14 },
      { key: 'totale',     width: 16 },
    ]

    const hRow = sheet1.addRow([
      'Data Evento', 'Tipo Evento', 'Sposa / Festeggiato', 'Sposo',
      'Menu Pasto', 'Menu Buffet', 'Luogo', 'Pranzo/Cena',
      'N. Persone', 'Prezzo/Persona', 'Prezzo Totale Evento'
    ])
    applyHeader(hRow, 11)

    let totalPersone = 0
    let totalRicavo = 0

    eventi.forEach((ev, idx) => {
      const cp = ev.clienti[0]?.cliente
      const struttura = typeof ev.struttura === 'string'
        ? (() => {
            try { return JSON.parse(ev.struttura || '{}') } catch { return {} }
          })()
        : (ev.struttura || {})
      const dataEvento = ev.dataConfermata
        ? (() => {
            const d = new Date(ev.dataConfermata!)
            const giorno = d.toLocaleDateString('it-IT', { weekday: 'long' })
            const data = d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })
            return `${giorno} ${data}`
          })()
        : 'Da definire'
      const persone  = ev.personePreviste || 0
      const prezzoDaMenu = Number(struttura?.prezzo)
      const prezzo = ev.prezzo ?? (Number.isFinite(prezzoDaMenu) ? prezzoDaMenu : 0)
      const totale   = persone * prezzo
      totalPersone  += persone
      totalRicavo   += totale

      const row = sheet1.addRow({
        data:       dataEvento,
        tipo:       ev.tipo,
        sposa:      ev.sposa || cp ? `${cp?.nome || ''} ${cp?.cognome || ''}`.trim() : '',
        sposo:      ev.sposo || '',
        menuPasto:  ev.menuPasto  || '',
        menuBuffet: ev.menuBuffet || '',
        luogo:      ev.luogo || 'Villa Paris',
        fascia:     ev.fascia === 'pranzo' ? 'Pranzo' : ev.fascia === 'cena' ? 'Cena' : (ev.fascia || ''),
        persone,
        prezzoPersona: prezzo,
        totale,
      })

      row.getCell('prezzoPersona').numFmt = '€#,##0.00'
      row.getCell('totale').numFmt = '€#,##0.00'
      row.alignment = { vertical: 'middle', wrapText: true }
      row.height = 22
      applyRowBorder(row, 11, idx % 2 === 0)
    })

    // Riga totali
    const dataRow = eventi.length + 4 // header(1) + azienda(2) + vuota(1) + header(1) = skip 4
    const firstDataRow = 5
    const lastDataRow  = firstDataRow + eventi.length - 1

    const totRow = sheet1.addRow({
      data: '', tipo: '', sposa: 'TOTALE', sposo: '',
      menuPasto: '', menuBuffet: '', luogo: '', fascia: '', prezzoPersona: '',
      persone: totalPersone,
      totale: totalRicavo,
    })
    totRow.font = { bold: true, size: 11 }
    totRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D4AF37' } }
    totRow.getCell('totale').numFmt = '€#,##0.00'
    totRow.getCell('persone').numFmt = '#,##0'
    totRow.height = 24

    // ══════════════════════════════════════════════════
    // FOGLIO 2 – Anagrafica Clienti
    // ══════════════════════════════════════════════════
    const sheet2 = wb.addWorksheet('Anagrafica Clienti', {
      properties: { tabColor: { argb: '3B82F6' } }
    })

    sheet2.mergeCells('A1:R1')
    const t2 = sheet2.getCell('A1')
    t2.value = 'VILLA PARIS – Anagrafica Clienti'
    t2.font = { bold: true, size: 14, color: { argb: '1E3A5F' } }
    t2.alignment = { horizontal: 'center', vertical: 'middle' }
    sheet2.getRow(1).height = 32

    sheet2.addRow([]) // riga vuota

    sheet2.columns = [
      { key: 'nome',          width: 16 },
      { key: 'cognome',       width: 16 },
      { key: 'tipo',          width: 14 },
      { key: 'tel',           width: 16 },
      { key: 'telAlt',        width: 16 },
      { key: 'email',         width: 28 },
      { key: 'indirizzo',     width: 28 },
      { key: 'cap',           width: 7  },
      { key: 'citta',         width: 16 },
      { key: 'cf',            width: 16 },
      { key: 'canale',        width: 16 },
      { key: 'primoContatto', width: 14 },
      { key: 'sec',           width: 22 },
      { key: 'secTel',        width: 16 },
      { key: 'secEmail',      width: 26 },
      { key: 'nEventi',       width: 9  },
      { key: 'dataNascita',   width: 14 },
      { key: 'note',          width: 32 },
    ]

    const h2Row = sheet2.addRow([
      'Nome', 'Cognome', 'Tipo', 'Telefono', 'Tel. Alt.', 'Email',
      'Indirizzo', 'CAP', 'Città', 'Codice Fiscale',
      'Canale Contatto', 'Data 1° Contatto',
      'Secondo Contatto', 'Tel. 2° Contatto', 'Email 2° Contatto',
      'N° Eventi', 'Data di Nascita', 'Note'
    ])
    applyHeader(h2Row, 18)

    clienti.forEach((c, idx) => {
      const row = sheet2.addRow({
        nome:          c.nome,
        cognome:       c.cognome ?? '',
        tipo:          c.tipoCliente ?? '',
        tel:           c.telefono ?? '',
        telAlt:        c.telefonoAlt ?? '',
        email:         c.email ?? '',
        indirizzo:     c.indirizzo ?? '',
        cap:           c.cap ?? '',
        citta:         c.citta ?? '',
        cf:            c.codiceFiscale ?? '',
        canale:        c.canalePrimoContatto ?? '',
        primoContatto: c.dataPrimoContatto
          ? new Date(c.dataPrimoContatto).toLocaleDateString('it-IT')
          : '',
        sec:      c.secondoContattoNome ?? '',
        secTel:   c.secondoContattoTelefono ?? '',
        secEmail: c.secondoContattoEmail ?? '',
        nEventi:  c.eventi.length,
        dataNascita: c.dataNascita
          ? new Date(c.dataNascita).toLocaleDateString('it-IT')
          : '',
        note: c.notaAnagrafica ?? '',
      })
      row.alignment = { vertical: 'middle', wrapText: false }
      row.height = 20
      applyRowBorder(row, 18, idx % 2 === 0)
    })

    // ──────────────────────────────────────────────────
    // OUTPUT
    // ──────────────────────────────────────────────────
    const buffer = await wb.xlsx.writeBuffer()
    const filename = `VillaParis_Report_${new Date().toISOString().split('T')[0]}.xlsx`

    return new NextResponse(buffer as ArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      }
    })
  } catch (error) {
    console.error('[Report Excel] Errore:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Errore nella generazione del report', detail: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
