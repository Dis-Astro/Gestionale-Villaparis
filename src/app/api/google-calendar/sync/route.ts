import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getActiveConfig, getAuthenticatedClient, getCalendarService, buildCalendarEvent } from '@/lib/google-calendar'
import { dbJsonParse } from '@/lib/db-json'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET - Status della connessione + lista cambiamenti pendenti
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['ADMIN'])
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const config = await getActiveConfig()
    const pendingChanges = await prisma.googleCalendarChange.findMany({
      where: { stato: 'pending' },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    return NextResponse.json({
      connected: !!config,
      config: config ? {
        connectedAt: config.connectedAt,
        lastSyncAt: config.lastSyncAt,
        calendarId: config.calendarId,
        userEmail: config.user?.email
      } : null,
      pendingChanges
    })
  } catch (error: any) {
    console.error('Errore status GCal:', error)
    return NextResponse.json({ error: 'Errore nel recupero stato' }, { status: 500 })
  }
}

// POST - Sincronizzazione completa
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['ADMIN'])
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const config = await getActiveConfig()
    if (!config) {
      return NextResponse.json({ error: 'Google Calendar non connesso' }, { status: 400 })
    }

    const authClient = await getAuthenticatedClient(config.userId)
    if (!authClient) {
      return NextResponse.json({ error: 'Impossibile autenticarsi con Google' }, { status: 401 })
    }

    const calendar = getCalendarService(authClient.oauth2Client)
    const calendarId = authClient.calendarId

    let synced = { eventi: 0, appuntamenti: 0, opzioni: 0, errori: 0 }

    // 1) Sincronizza tutti gli Eventi con dataConfermata
    const eventi = await prisma.evento.findMany({
      where: { dataConfermata: { not: null } }
    })

    for (const evento of eventi) {
      try {
        const calEvent = buildCalendarEvent('evento', evento)
        if (!calEvent) continue

        if (evento.gcalEventId) {
          // Aggiorna evento esistente
          try {
            await calendar.events.update({
              calendarId,
              eventId: evento.gcalEventId,
              requestBody: calEvent
            })
          } catch (e: any) {
            if (e.code === 404) {
              // Evento cancellato su Google, ricrealo
              const created = await calendar.events.insert({ calendarId, requestBody: calEvent })
              await prisma.evento.update({ where: { id: evento.id }, data: { gcalEventId: created.data.id } })
            } else throw e
          }
        } else {
          // Crea nuovo evento su Google Calendar
          const created = await calendar.events.insert({ calendarId, requestBody: calEvent })
          await prisma.evento.update({ where: { id: evento.id }, data: { gcalEventId: created.data.id } })
        }
        synced.eventi++
      } catch (err: any) {
        console.error(`Errore sync evento #${evento.id}:`, err.message)
        synced.errori++
      }
    }

    // 2) Sincronizza tutti gli Appuntamenti
    const appuntamenti = await prisma.appuntamento.findMany({
      include: { clientePrincipale: { select: { nome: true, cognome: true } } }
    })

    for (const app of appuntamenti) {
      try {
        const calEvent = buildCalendarEvent('appuntamento', app)
        if (!calEvent) continue

        if (app.gcalEventId) {
          try {
            await calendar.events.update({
              calendarId,
              eventId: app.gcalEventId,
              requestBody: calEvent
            })
          } catch (e: any) {
            if (e.code === 404) {
              const created = await calendar.events.insert({ calendarId, requestBody: calEvent })
              await prisma.appuntamento.update({ where: { id: app.id }, data: { gcalEventId: created.data.id } })
            } else throw e
          }
        } else {
          const created = await calendar.events.insert({ calendarId, requestBody: calEvent })
          await prisma.appuntamento.update({ where: { id: app.id }, data: { gcalEventId: created.data.id } })
        }
        synced.appuntamenti++
      } catch (err: any) {
        console.error(`Errore sync appuntamento #${app.id}:`, err.message)
        synced.errori++
      }
    }

    // 3) Sincronizza date opzionate
    const appConOpzioni = await prisma.appuntamento.findMany({
      where: { dateOpzionate: { not: null } },
      include: { clientePrincipale: { select: { nome: true, cognome: true } } }
    })

    for (const app of appConOpzioni) {
      try {
        const dateOpz = dbJsonParse(app.dateOpzionate, [])
        if (!Array.isArray(dateOpz)) continue
        for (const dataStr of dateOpz) {
          if (!dataStr) continue
          const clienteNome = `${app.clientePrincipale?.nome || ''} ${app.clientePrincipale?.cognome || ''}`.trim()
          const calEvent = buildCalendarEvent('opzione', {
            dataOpzionata: dataStr,
            clienteNome,
            dataScadenza: app.dataScadenzaOpzione ? new Date(app.dataScadenzaOpzione).toLocaleDateString('it-IT') : 'N/D'
          })
          if (!calEvent) continue
          // Per le opzioni, creiamo sempre (non tracked individualmente)
          await calendar.events.insert({ calendarId, requestBody: calEvent })
          synced.opzioni++
        }
      } catch (err: any) {
        console.error(`Errore sync opzioni appuntamento #${app.id}:`, err.message)
        synced.errori++
      }
    }

    // Aggiorna lastSyncAt
    await prisma.googleCalendarConfig.update({
      where: { id: config.id },
      data: { lastSyncAt: new Date() }
    })

    return NextResponse.json({ success: true, synced })
  } catch (error: any) {
    console.error('Errore sincronizzazione GCal:', error)
    return NextResponse.json({ error: error.message || 'Errore durante la sincronizzazione' }, { status: 500 })
  }
}

// DELETE - Disconnetti Google Calendar
export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req, ['ADMIN'])
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const config = await getActiveConfig()
    if (config) {
      await prisma.googleCalendarConfig.update({
        where: { id: config.id },
        data: { isActive: false }
      })
    }
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Errore disconnessione GCal:', error)
    return NextResponse.json({ error: 'Errore durante la disconnessione' }, { status: 500 })
  }
}
