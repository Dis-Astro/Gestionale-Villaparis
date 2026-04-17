import { NextRequest, NextResponse } from 'next/server'
import { getOAuth2Client } from '@/lib/google-calendar'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(new URL('/impostazioni?gcal=error&msg=' + encodeURIComponent(error), req.url))
  }

  if (!code) {
    return NextResponse.redirect(new URL('/impostazioni?gcal=error&msg=no_code', req.url))
  }

  // Verifica che l'utente sia loggato come ADMIN
  const token = req.cookies.get('vp_token')?.value
  if (!token) {
    return NextResponse.redirect(new URL('/impostazioni?gcal=error&msg=not_authenticated', req.url))
  }

  const payload = verifyToken(token)
  if (!payload || payload.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/impostazioni?gcal=error&msg=not_admin', req.url))
  }

  try {
    const oauth2Client = getOAuth2Client()
    const { tokens } = await oauth2Client.getToken(code)

    // Salva i token nella configurazione
    await prisma.googleCalendarConfig.upsert({
      where: { userId: payload.sub },
      create: {
        userId: payload.sub,
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token || null,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        calendarId: 'primary',
        isActive: true
      },
      update: {
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token || undefined,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        isActive: true,
        connectedAt: new Date()
      }
    })

    return NextResponse.redirect(new URL('/impostazioni?gcal=success', req.url))
  } catch (error: any) {
    console.error('Errore OAuth callback:', error)
    return NextResponse.redirect(new URL('/impostazioni?gcal=error&msg=' + encodeURIComponent(error.message || 'token_exchange_failed'), req.url))
  }
}
