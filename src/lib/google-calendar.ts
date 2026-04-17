import { google } from 'googleapis'
import prisma from '@/lib/prisma'

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET

function getRedirectUri() {
  // In production, use the actual domain
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'
  return `${baseUrl}/api/oauth/google-calendar/callback`
}

export function getOAuth2Client() {
  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, getRedirectUri())
}

export function getAuthUrl() {
  const oauth2Client = getOAuth2Client()
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/calendar']
  })
}

export async function getAuthenticatedClient(userId: string) {
  const config = await prisma.googleCalendarConfig.findUnique({ where: { userId } })
  if (!config || !config.isActive) return null

  const oauth2Client = getOAuth2Client()
  oauth2Client.setCredentials({
    access_token: config.accessToken,
    refresh_token: config.refreshToken,
    expiry_date: config.tokenExpiry ? config.tokenExpiry.getTime() : undefined
  })

  // Auto-refresh se scaduto
  oauth2Client.on('tokens', async (tokens) => {
    const updateData: any = {}
    if (tokens.access_token) updateData.accessToken = tokens.access_token
    if (tokens.expiry_date) updateData.tokenExpiry = new Date(tokens.expiry_date)
    if (tokens.refresh_token) updateData.refreshToken = tokens.refresh_token
    if (Object.keys(updateData).length > 0) {
      await prisma.googleCalendarConfig.update({ where: { userId }, data: updateData })
    }
  })

  return { oauth2Client, calendarId: config.calendarId || 'primary' }
}

export function getCalendarService(oauth2Client: any) {
  return google.calendar({ version: 'v3', auth: oauth2Client })
}

// Colori Google Calendar per tipo evento
const COLORI_TIPO: Record<string, string> = {
  matrimonio: '11',    // Rosso (Tomato)
  battesimo: '9',      // Blu (Blueberry)
  comunione: '5',      // Giallo (Banana)
  cresima: '10',       // Verde (Basil)
  compleanno: '6',     // Arancione (Tangerine)
  aziendale: '7',      // Grigio (Graphite)
  altro: '8',          // Viola (Grape)
}

export function buildCalendarEvent(
  tipo: 'evento' | 'appuntamento' | 'opzione',
  data: any
) {
  if (tipo === 'evento') {
    const colorId = COLORI_TIPO[data.tipo?.toLowerCase()] || '8'
    const summary = `[EVENTO] ${data.titolo}`
    const description = [
      `Tipo: ${data.tipo || 'N/D'}`,
      `Stato: ${data.stato || 'N/D'}`,
      data.personePreviste ? `Invitati: ${data.personePreviste}` : null,
      data.fascia ? `Fascia: ${data.fascia}` : null,
      data.luogo ? `Luogo: ${data.luogo}` : null,
      data.note ? `Note: ${data.note}` : null,
      `---`,
      `Gestito da Villa Paris`
    ].filter(Boolean).join('\n')

    if (data.dataConfermata) {
      const date = new Date(data.dataConfermata)
      return {
        summary,
        description,
        colorId,
        start: { date: date.toISOString().slice(0, 10), timeZone: 'Europe/Rome' },
        end: { date: date.toISOString().slice(0, 10), timeZone: 'Europe/Rome' },
      }
    }
    return null
  }

  if (tipo === 'appuntamento') {
    const date = new Date(data.dataAppuntamento)
    const durata = data.durataMinuti || 60
    const endDate = new Date(date.getTime() + durata * 60 * 1000)
    const clienteNome = data.clientePrincipale
      ? `${data.clientePrincipale.nome || ''} ${data.clientePrincipale.cognome || ''}`.trim()
      : 'Cliente'

    return {
      summary: `[APPUNTAMENTO] ${clienteNome}`,
      description: [
        `Stato funnel: ${data.statoFunnel || 'N/D'}`,
        data.esito ? `Esito: ${data.esito}` : null,
        data.noteColloquio ? `Note: ${data.noteColloquio}` : null,
        `---`,
        `Gestito da Villa Paris`
      ].filter(Boolean).join('\n'),
      colorId: '3',
      start: { dateTime: date.toISOString(), timeZone: 'Europe/Rome' },
      end: { dateTime: endDate.toISOString(), timeZone: 'Europe/Rome' },
    }
  }

  if (tipo === 'opzione') {
    const date = new Date(data.dataOpzionata)
    return {
      summary: `[OPZIONE] Data opzionata - ${data.clienteNome || 'N/D'}`,
      description: `Data opzionata per potenziale evento.\nScadenza opzione: ${data.dataScadenza || 'N/D'}\n---\nGestito da Villa Paris`,
      colorId: '5',
      start: { date: date.toISOString().slice(0, 10), timeZone: 'Europe/Rome' },
      end: { date: date.toISOString().slice(0, 10), timeZone: 'Europe/Rome' },
    }
  }

  return null
}

// Recupera la configurazione attiva (la prima trovata con isActive=true)
export async function getActiveConfig() {
  return prisma.googleCalendarConfig.findFirst({
    where: { isActive: true },
    include: { user: { select: { email: true } } }
  })
}
