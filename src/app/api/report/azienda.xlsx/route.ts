import { NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import prisma from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/report/azienda.xlsx
 * Genera report Excel multi-foglio (Eventi + Clienti)
 * Query params: from, to, tipo, luogo
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const tipo = searchParams.get('tipo')
    const luogo = searchParams.get('luogo')

    // Build query filters
    const where: any = {}
    if (from || to) {
      where.dataConfermata = {}
      if (from) where.dataConfermata.gte = new Date(from)
      if (to)   where.dataConfermata.lte = new Date(to)
    }
    if (tipo)  where.tipo = tipo
    if (luogo) where.luogo = luogo

    // Fetch eventi + clienti
    const eventi = await prisma.evento.findMany({
      where,
      include: {
        clienti: { include: { cliente: true } }
      },
      orderBy: { dataConfermata: 'asc' }
    })

    // Fetch tutti i clienti per il foglio anagrafica
    const clienti = await prisma.cliente.findMany({
      include: { eventi: { select: { eventoId: true } } },
      orderBy: { cognome: 'asc' }
    })

    // ──────────────────────────────────────────────────
    // WORKBOOK
    // ──────────────────────────────────────────────────
    const wb = new ExcelJS.Workbook()
    wb.creator = 'Villa Paris Gestionale'
    wb.created = new Date()

    // ──────────────────────────────────────────────────
    // FOGLIO 1: Report Aziendale
    // ──────────────────────────────────────────────────
    const sheetEventi = wb.addWorksheet('Report Aziendale', {
      properties: { tabColor: { argb: 'FFD700' } }
    })

    sheetEventi.columns = [
      { header: 'Data Evento',        key: 'data',       width: 14 },
      { header: 'Tipo',               key: 'tipo',       width: 15 },
      { header: 'Titolo / Evento',    key: 'titolo',     width: 28 },
      { header: 'Sposa / Festeggiato',key: 'sposa',      width: 22 },
      { header: 'Sposo',              key: 'sposo',      width: 22 },
      { header: 'Cliente (referente)',key: 'cliente',    width: 22 },
      { header: 'Telefono',           key: 'telefono',   width: 16 },
      { header: 'Email',              key: 'email',      width: 26 },
      { header: 'Menù Pasto',         key: 'menuPasto',  width: 30 },
      { header: 'Menù Buffet',        key: 'menuBuffet', width: 30 },
      { header: 'Luogo',              key: 'luogo',      width: 14 },
      { header: 'Pranzo/Cena',        key: 'fascia',     width: 12 },
      { header: 'N° Persone',         key: 'persone',    width: 12 },
      { header: 'Prezzo/pers.',       key: 'prezzo',     width: 13 },
      { header: 'Totale €',           key: 'totale',     width: 14 },
      { header: 'Stato',              key: 'stato',      width: 12 },
      { header: 'Data Registrazione', key: 'regData',    width: 18 },
      { header: 'Canale Contatto',    key: 'canale',     width: 18 },
    ]

    // Stile header
    const h1 = sheetEventi.getRow(1)
    h1.font = { bold: true, color: { argb: 'FFFFFF' }, size: 10 }
    h1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E3A5F' } }
    h1.alignment = { horizontal: 'center', vertical: 'middle' }
    h1.height = 22

    eventi.forEach((ev, idx) => {
      const rowNum = idx + 2
      const cp = ev.clienti[0]?.cliente
      const sposa  = ev.sposa || ''
      const sposo  = ev.sposo || ''
      const menuPasto   = ev.menuPasto  || ''
      const menuBuffet  = ev.menuBuffet || ''

      const row = sheetEventi.addRow({
        data:      ev.dataConfermata  ? new Date(ev.dataConfermata).toLocaleDateString('it-IT')  : '',
        tipo:      ev.tipo,
        titolo:    ev.titolo,
        sposa,
        sposo,
        cliente:   cp ? `${cp.nome} ${cp.cognome ?? ''}`.trim() : '',
        telefono:  cp?.telefono ?? '',
        email:     cp?.email ?? '',
        menuPasto,
        menuBuffet,
        luogo:     ev.luogo || 'Villa Paris',
        fascia:    ev.fascia === 'pranzo' ? 'Pranzo' : ev.fascia === 'cena' ? 'Cena' : ev.fascia,
        persone:   ev.personePreviste || 0,
        prezzo:    ev.prezzo || 0,
        totale:    { formula: `M${rowNum}*N${rowNum}` },
        stato:     ev.stato,
        regData:   ev.dataPrimoContatto ? new Date(ev.dataPrimoContatto).toLocaleDateString('it-IT') : '',
        canale:    cp?.canalePrimoContatto ?? '',
      })

      if (idx % 2 === 0) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F3F4F6' } }
      }
      row.getCell('prezzo').numFmt = '€#,##0.00'
      row.getCell('totale').numFmt = '€#,##0.00'
    })

    // Riga totali
    const lastData = eventi.length + 1
    const totRow = sheetEventi.addRow({
      data: '', tipo: '', titolo: 'TOTALE', sposa: '', sposo: '',
      cliente: '', telefono: '', email: '', menuPasto: '', menuBuffet: '',
      luogo: '', fascia: '',
      persone: { formula: `SUM(M2:M${lastData})` },
      prezzo: '',
      totale:  { formula: `SUM(O2:O${lastData})` },
      stato: '', regData: '', canale: ''
    })
    totRow.font = { bold: true }
    totRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D4AF37' } }
    totRow.getCell('totale').numFmt = '€#,##0.00'

    // Bordi
    for (let r = 1; r <= eventi.length + 2; r++) {
      for (let c = 1; c <= 18; c++) {
        sheetEventi.getCell(r, c).border = {
          top:    { style: 'thin', color: { argb: 'E5E7EB' } },
          left:   { style: 'thin', color: { argb: 'E5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'E5E7EB' } },
          right:  { style: 'thin', color: { argb: 'E5E7EB' } }
        }
      }
    }

    // ──────────────────────────────────────────────────
    // FOGLIO 2: Anagrafica Clienti
    // ──────────────────────────────────────────────────
    const sheetClienti = wb.addWorksheet('Anagrafica Clienti', {
      properties: { tabColor: { argb: '3B82F6' } }
    })

    sheetClienti.columns = [
      { header: 'Nome',               key: 'nome',       width: 18 },
      { header: 'Cognome',            key: 'cognome',    width: 18 },
      { header: 'Tipo',               key: 'tipo',       width: 14 },
      { header: 'Telefono',           key: 'tel',        width: 16 },
      { header: 'Tel. Alternativo',   key: 'telAlt',     width: 16 },
      { header: 'Email',              key: 'email',      width: 26 },
      { header: 'Indirizzo',          key: 'indirizzo',  width: 28 },
      { header: 'CAP',                key: 'cap',        width: 8  },
      { header: 'Città',              key: 'citta',      width: 16 },
      { header: 'Codice Fiscale',     key: 'cf',         width: 16 },
      { header: 'Secondo Contatto',   key: 'sec',        width: 22 },
      { header: 'Tel. 2° Contatto',   key: 'secTel',     width: 16 },
      { header: 'Email 2° Contatto',  key: 'secEmail',   width: 24 },
      { header: 'Canale Contatto',    key: 'canale',     width: 16 },
      { header: 'Data 1° Contatto',   key: 'primoContatto', width: 16 },
      { header: 'N° Eventi',          key: 'nEventi',    width: 10 },
      { header: 'Note',               key: 'note',       width: 30 },
    ]

    const h2 = sheetClienti.getRow(1)
    h2.font = { bold: true, color: { argb: 'FFFFFF' }, size: 10 }
    h2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E3A5F' } }
    h2.alignment = { horizontal: 'center', vertical: 'middle' }
    h2.height = 22

    clienti.forEach((c, idx) => {
      const row = sheetClienti.addRow({
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
        sec:           c.secondoContattoNome ?? '',
        secTel:        c.secondoContattoTelefono ?? '',
        secEmail:      c.secondoContattoEmail ?? '',
        canale:        c.canalePrimoContatto ?? '',
        primoContatto: c.dataPrimoContatto ? new Date(c.dataPrimoContatto).toLocaleDateString('it-IT') : '',
        nEventi:       c.eventi.length,
        note:          c.notaAnagrafica ?? '',
      })
      if (idx % 2 === 0) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'EFF6FF' } }
      }
    })

    for (let r = 1; r <= clienti.length + 1; r++) {
      for (let c = 1; c <= 17; c++) {
        sheetClienti.getCell(r, c).border = {
          top:    { style: 'thin', color: { argb: 'E5E7EB' } },
          left:   { style: 'thin', color: { argb: 'E5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'E5E7EB' } },
          right:  { style: 'thin', color: { argb: 'E5E7EB' } }
        }
      }
    }

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
