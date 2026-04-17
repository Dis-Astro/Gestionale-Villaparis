import { getActiveConfig, getAuthenticatedClient, getCalendarService, buildCalendarEvent } from '@/lib/google-calendar'
import prisma from '@/lib/prisma'

// Sincronizza un singolo evento con Google Calendar (se connesso)
export async function syncEventoToGcal(eventoId: number) {
  try {
    const config = await getActiveConfig()
    if (!config) return

    const authClient = await getAuthenticatedClient(config.userId)
    if (!authClient) return

    const evento = await prisma.evento.findUnique({ where: { id: eventoId } })
    if (!evento) return

    const calendar = getCalendarService(authClient.oauth2Client)
    const calendarId = authClient.calendarId
    const calEvent = buildCalendarEvent('evento', evento)

    if (!calEvent) {
      // Se non ha data confermata, eventualmente rimuovi da GCal
      if (evento.gcalEventId) {
        try {
          await calendar.events.delete({ calendarId, eventId: evento.gcalEventId })
        } catch { /* ignore if already deleted */ }
        await prisma.evento.update({ where: { id: eventoId }, data: { gcalEventId: null } })
      }
      return
    }

    if (evento.gcalEventId) {
      try {
        await calendar.events.update({ calendarId, eventId: evento.gcalEventId, requestBody: calEvent })
      } catch (e: any) {
        if (e.code === 404) {
          const created = await calendar.events.insert({ calendarId, requestBody: calEvent })
          await prisma.evento.update({ where: { id: eventoId }, data: { gcalEventId: created.data.id } })
        }
      }
    } else {
      const created = await calendar.events.insert({ calendarId, requestBody: calEvent })
      await prisma.evento.update({ where: { id: eventoId }, data: { gcalEventId: created.data.id } })
    }
  } catch (err) {
    console.error(`[GCal Auto-Sync] Errore sync evento #${eventoId}:`, err)
  }
}

// Sincronizza un singolo appuntamento
export async function syncAppuntamentoToGcal(appuntamentoId: number) {
  try {
    const config = await getActiveConfig()
    if (!config) return

    const authClient = await getAuthenticatedClient(config.userId)
    if (!authClient) return

    const app = await prisma.appuntamento.findUnique({
      where: { id: appuntamentoId },
      include: { clientePrincipale: { select: { nome: true, cognome: true } } }
    })
    if (!app) return

    const calendar = getCalendarService(authClient.oauth2Client)
    const calendarId = authClient.calendarId
    const calEvent = buildCalendarEvent('appuntamento', app)
    if (!calEvent) return

    if (app.gcalEventId) {
      try {
        await calendar.events.update({ calendarId, eventId: app.gcalEventId, requestBody: calEvent })
      } catch (e: any) {
        if (e.code === 404) {
          const created = await calendar.events.insert({ calendarId, requestBody: calEvent })
          await prisma.appuntamento.update({ where: { id: appuntamentoId }, data: { gcalEventId: created.data.id } })
        }
      }
    } else {
      const created = await calendar.events.insert({ calendarId, requestBody: calEvent })
      await prisma.appuntamento.update({ where: { id: appuntamentoId }, data: { gcalEventId: created.data.id } })
    }
  } catch (err) {
    console.error(`[GCal Auto-Sync] Errore sync appuntamento #${appuntamentoId}:`, err)
  }
}

// Rimuovi un evento da Google Calendar
export async function removeEventoFromGcal(gcalEventId: string | null) {
  if (!gcalEventId) return
  try {
    const config = await getActiveConfig()
    if (!config) return

    const authClient = await getAuthenticatedClient(config.userId)
    if (!authClient) return

    const calendar = getCalendarService(authClient.oauth2Client)
    await calendar.events.delete({ calendarId: authClient.calendarId, eventId: gcalEventId })
  } catch (err) {
    console.error(`[GCal Auto-Sync] Errore rimozione evento GCal:`, err)
  }
}

export async function removeAppuntamentoFromGcal(gcalEventId: string | null) {
  if (!gcalEventId) return
  try {
    const config = await getActiveConfig()
    if (!config) return

    const authClient = await getAuthenticatedClient(config.userId)
    if (!authClient) return

    const calendar = getCalendarService(authClient.oauth2Client)
    await calendar.events.delete({ calendarId: authClient.calendarId, eventId: gcalEventId })
  } catch (err) {
    console.error(`[GCal Auto-Sync] Errore rimozione appuntamento GCal:`, err)
  }
}
