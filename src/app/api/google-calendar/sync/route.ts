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

// POST - Sincronizzazione completa (evita duplicati controllando gcalEventId)
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
      return NextResponse.json({ error: 'Impossibile autenticarsi con Google. Prova a riconnettere il calendario.' }, { status: 401 })
    }

    const calendar = getCalendarService(authClient.oauth2Client)
    const calendarId = authClient.calendarId
    const synced = { eventi: 0, appuntamenti: 0, opzioni: 0, errori: 0, aggiornati: 0, skipped: 0 }

    // 1) Sincronizza tutti gli Eventi con dataConfermata
    const eventi = await prisma.evento.findMany({
      where: { dataConfermata: { not: null } }
    })

    for (const evento of eventi) {
      try {
        const calEvent = buildCalendarEvent('evento', evento)
        if (!calEvent) { synced.skipped++; continue }

        if (evento.gcalEventId) {
          // Ha gia' un ID GCal: aggiorna
          try {
            await calendar.events.update({
              calendarId,
              eventId: evento.gcalEventId,
              requestBody: calEvent
            })
            synced.aggiornati++
            continue
          } catch (e: any) {
            if (e.code === 404 || e.status === 404) {
              // L'evento e' stato eliminato su GCal, ricreiamo
              console.log(`[GCal Sync] Evento GCal ${evento.gcalEventId} non trovato, ricreo evento #${evento.id}`)
            } else {
              console.error(`[GCal Sync] Errore update evento #${evento.id}:`, e.message)
              synced.errori++
              continue
            }
          }
        }

        // Crea nuovo evento su Google Calendar
        const created = await calendar.events.insert({ calendarId, requestBody: calEvent })
        if (created.data.id) {
          await prisma.evento.update({ where: { id: evento.id }, data: { gcalEventId: created.data.id } })
        }
        synced.eventi++
      } catch (err: any) {
        console.error(`[GCal Sync] Errore evento #${evento.id}:`, err.message)
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
        if (!calEvent) { synced.skipped++; continue }

        if (app.gcalEventId) {
          try {
            await calendar.events.update({
              calendarId,
              eventId: app.gcalEventId,
              requestBody: calEvent
            })
            synced.aggiornati++
            continue
          } catch (e: any) {
            if (e.code === 404 || e.status === 404) {
              console.log(`[GCal Sync] Appuntamento GCal ${app.gcalEventId} non trovato, ricreo appuntamento #${app.id}`)
            } else {
              console.error(`[GCal Sync] Errore update appuntamento #${app.id}:`, e.message)
              synced.errori++
              continue
            }
          }
        }

        const created = await calendar.events.insert({ calendarId, requestBody: calEvent })
        if (created.data.id) {
          await prisma.appuntamento.update({ where: { id: app.id }, data: { gcalEventId: created.data.id } })
        }
        synced.appuntamenti++
      } catch (err: any) {
        console.error(`[GCal Sync] Errore appuntamento #${app.id}:`, err.message)
        synced.errori++
      }
    }

    // 3) Sincronizza date opzionate (solo se non gia' sincronizzate come parte dell'appuntamento)
    // Le opzioni non hanno tracking individuale, le skippiamo per evitare duplicati
    // Vengono gestite solo durante il primo sync manuale

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
