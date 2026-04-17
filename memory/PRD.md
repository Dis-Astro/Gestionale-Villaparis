# Villa Paris Gestionale - PRD

## Problema Originale
Gestionale full-stack per Villa Paris per gestione eventi (matrimoni, battesimi, ecc.), clienti, appuntamenti, calendario, planimetrie sale, menu con varianti alimentari, reportistica operativa e presenze in villa (rapportini interni).

## Architettura
- **Frontend**: Next.js 15 (App Router), React 18, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes (App Router)
- **Database**: SQLite (dev) / PostgreSQL (prod) via Prisma ORM
- **Auth**: JWT custom con cookie httpOnly (ruoli: ADMIN, REPORT, WORKER)
- **Drag & Drop**: react-dnd per planimetrie
- **Export**: pdfmake, ExcelJS, jsPDF per export PDF/Excel/PNG
- **Meteo**: Open-Meteo API (gratuita, nessuna chiave richiesta)
- **Google Calendar**: googleapis npm, OAuth2 con auto-refresh tokens

## Utenti
- **Admin**: Accesso completo a tutte le funzionalita', inclusa connessione Google Calendar
- **Worker**: Inserimento rapportini, gestione appuntamenti/eventi/planimetrie
- **Report**: Solo visualizzazione dashboard, reportistica e stampe

## Funzionalita' implementate

### FASE 1 - Struttura dati (Completata)
- Gestione Contatti → Appuntamenti → Eventi
- Calendario interattivo
- Dashboard operativa

### FASE 2 - Autenticazione e ruoli (Completata)
- JWT custom con bcrypt
- 3 ruoli con permessi differenziati
- Eliminazione account con audit log

### FASE 3 - Reportistica (Completata)
- Report settimanali/mensili/annuali
- Export Excel e PDF
- Report storici eventi

### FASE 4 - v2.0.0 (Completata - 01/04/2026)
- Meteo automatico nei rapportini interni (Open-Meteo)
- Quick-fill visitatori frequenti
- Tavolo Imperiale (da Stazione a Tavolo con posti e varianti menu)
- Piano B planimetrie (toggle Piano A/Piano B)
- Versione 2.0.0

### FASE 5 - Google Calendar (Completata - 17/04/2026)
- **OAuth2 Connect**: Interfaccia admin per connettere Google Calendar con flusso OAuth2
- **Sincronizzazione automatica**: Eventi, appuntamenti e date opzionate sincronizzati automaticamente con GCal
- **Auto-sync su CRUD**: Creazione/modifica/cancellazione di eventi e appuntamenti si riflettono su GCal in tempo reale
- **Rilevamento modifiche esterne**: Controllo modifiche fatte direttamente su Google Calendar con tracciamento dell'autore
- **Validazione admin**: Interfaccia per accettare o rifiutare modifiche esterne (con ripristino automatico su rifiuto)
- **Colori per tipo**: Eventi colorati su GCal in base al tipo (matrimonio rosso, battesimo blu, ecc.)

## Database Schema (campi chiave)
- **GoogleCalendarConfig**: userId, accessToken, refreshToken, tokenExpiry, calendarId, syncToken, lastSyncAt, isActive
- **GoogleCalendarChange**: gcalEventId, tipoRisorsa, risorsaId, tipoModifica, dettagli, modificatoDa, stato, validatoDa
- **Evento**: ..., gcalEventId, disposizioneSalaPianoB, pianoAttivo
- **Appuntamento**: ..., gcalEventId
- **PresenzaVilla**: ..., meteo

## API Endpoints principali
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Utente corrente
- `GET/POST /api/presenze-villa` - CRUD presenze villa
- `GET /api/presenze-villa/suggerimenti` - Visitatori frequenti
- `GET /api/meteo?date=YYYY-MM-DD` - Meteo del giorno
- `GET/POST/PUT/DELETE /api/eventi` - CRUD eventi (auto-sync GCal)
- `GET/POST/PUT/DELETE /api/appuntamenti` - CRUD appuntamenti (auto-sync GCal)
- `GET /api/oauth/google-calendar/login` - Start OAuth flow
- `GET /api/oauth/google-calendar/callback` - OAuth callback
- `GET/POST/DELETE /api/google-calendar/sync` - Status, sync, disconnect
- `POST /api/google-calendar/check-changes` - Rileva modifiche esterne
- `POST /api/google-calendar/validate-change` - Valida/rifiuta modifiche

## Credenziali di test
- Admin: admin@villaparis.local / Admin123!
- Worker: worker.check@villaparis.local / Worker123!
- Report: report.temp@villaparis.local / Report123!

## Configurazione Google Calendar
- GOOGLE_CLIENT_ID: in .env
- GOOGLE_CLIENT_SECRET: in .env
- Redirect URI: {APP_URL}/api/oauth/google-calendar/callback
- Scope: https://www.googleapis.com/auth/calendar

## Backlog futuro
- (P2) Preset schemi tavoli per fasce di invitati
- (P2) Preset menu per tipologia evento
- (P2) Fix warning Recharts nei grafici
