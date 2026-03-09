import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/clienti          → lista tutti
// GET /api/clienti?id=X     → dettaglio singolo
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (id) {
      const cliente = await prisma.cliente.findUnique({
        where: { id: Number(id) },
        include: {
          eventi: {
            include: { evento: true }
          }
        }
      })
      if (!cliente) return new NextResponse('Cliente non trovato', { status: 404 })
      return NextResponse.json(cliente)
    }

    const clienti = await prisma.cliente.findMany({
      include: { eventi: { select: { id: true } } },
      orderBy: { cognome: 'asc' }
    })
    return NextResponse.json(clienti)
  } catch (error) {
    console.error('Errore nel recupero clienti:', error)
    return new NextResponse('Errore database', { status: 500 })
  }
}

// POST /api/clienti → crea nuovo cliente
export async function POST(req: Request) {
  try {
    const body = await req.json()
    if (!body.nome?.trim()) {
      return new NextResponse('Nome obbligatorio', { status: 400 })
    }

    const cliente = await prisma.cliente.create({
      data: {
        nome:                    body.nome.trim(),
        cognome:                 body.cognome?.trim() || null,
        email:                   body.email?.trim() || null,
        telefono:                body.telefono?.trim() || null,
        telefonoAlt:             body.telefonoAlt?.trim() || null,
        indirizzo:               body.indirizzo?.trim() || null,
        cap:                     body.cap?.trim() || null,
        citta:                   body.citta?.trim() || null,
        dataNascita:             body.dataNascita ? new Date(body.dataNascita) : null,
        codiceFiscale:           body.codiceFiscale?.trim() || null,
        tipoCliente:             body.tipoCliente || null,
        canalePrimoContatto:     body.canalePrimoContatto || null,
        dataPrimoContatto:       body.dataPrimoContatto ? new Date(body.dataPrimoContatto) : null,
        secondoContattoNome:     body.secondoContattoNome?.trim() || null,
        secondoContattoTelefono: body.secondoContattoTelefono?.trim() || null,
        secondoContattoEmail:    body.secondoContattoEmail?.trim() || null,
        notaAnagrafica:          body.notaAnagrafica?.trim() || null,
      }
    })
    return NextResponse.json(cliente, { status: 201 })
  } catch (error) {
    console.error('Errore creazione cliente:', error)
    return new NextResponse('Errore nel salvataggio', { status: 500 })
  }
}

// PUT /api/clienti?id=X → aggiorna cliente
export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = Number(searchParams.get('id'))
    if (!id) return new NextResponse('ID mancante', { status: 400 })

    const body = await req.json()
    if (!body.nome?.trim()) {
      return new NextResponse('Nome obbligatorio', { status: 400 })
    }

    const cliente = await prisma.cliente.update({
      where: { id },
      data: {
        nome:                    body.nome.trim(),
        cognome:                 body.cognome?.trim() || null,
        email:                   body.email?.trim() || null,
        telefono:                body.telefono?.trim() || null,
        telefonoAlt:             body.telefonoAlt?.trim() || null,
        indirizzo:               body.indirizzo?.trim() || null,
        cap:                     body.cap?.trim() || null,
        citta:                   body.citta?.trim() || null,
        dataNascita:             body.dataNascita ? new Date(body.dataNascita) : null,
        codiceFiscale:           body.codiceFiscale?.trim() || null,
        tipoCliente:             body.tipoCliente || null,
        canalePrimoContatto:     body.canalePrimoContatto || null,
        dataPrimoContatto:       body.dataPrimoContatto ? new Date(body.dataPrimoContatto) : null,
        secondoContattoNome:     body.secondoContattoNome?.trim() || null,
        secondoContattoTelefono: body.secondoContattoTelefono?.trim() || null,
        secondoContattoEmail:    body.secondoContattoEmail?.trim() || null,
        notaAnagrafica:          body.notaAnagrafica?.trim() || null,
      }
    })
    return NextResponse.json(cliente)
  } catch (error) {
    console.error('Errore aggiornamento cliente:', error)
    return new NextResponse('Errore aggiornamento', { status: 500 })
  }
}

// DELETE /api/clienti?id=X → elimina cliente
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = Number(searchParams.get('id'))
    if (!id) return new NextResponse('ID mancante', { status: 400 })

    // Rimuovi prima le relazioni evento
    await prisma.eventoCliente.deleteMany({ where: { clienteId: id } })
    await prisma.cliente.delete({ where: { id } })
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Errore eliminazione cliente:', error)
    return new NextResponse('Errore eliminazione', { status: 500 })
  }
}
