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

## Utenti
- **Admin**: Accesso completo a tutte le funzionalità
- **Worker**: Inserimento rapportini, gestione appuntamenti/eventi/planimetrie
- **Report**: Solo visualizzazione dashboard, reportistica e stampe

## Funzionalità implementate

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
- **Meteo automatico**: Integrazione Open-Meteo nei rapportini interni
- **Quick-fill visitatori**: Suggerimenti automatici nome/cognome/azienda da visitatori frequenti
- **Tavolo Imperiale**: Convertito da Stazione a Tavolo (rettangolare, con posti e varianti menu)
- **Piano B planimetrie**: Toggle Piano A/Piano B per gestire due layout alternativi (interno/esterno, pioggia/sole)
- **Versione 2.0.0**: Aggiornamento numero release in package.json e footer

## Database Schema (campi chiave)
- **PresenzaVilla**: id, dataRiferimento, nome, cognome, azienda, orarioIngresso, orarioUscita, motivoVisita, mansioneSvolta, note, **meteo**, createdByUserId
- **Evento**: id, titolo, tipo, dataConfermata, fascia, stato, personePreviste, disposizioneSala, **disposizioneSalaPianoB**, **pianoAttivo**, menu, ...
- **User**: id, email, passwordHash, role, isActive
- **Tavolo (tipo piantina)**: id, numero, posti, posizione, rotazione, **forma** ('rotondo'|'imperiale'), dimensionePerc, varianti

## API Endpoints principali
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Utente corrente
- `GET/POST /api/presenze-villa` - CRUD presenze villa
- `GET /api/presenze-villa/suggerimenti` - Visitatori frequenti
- `GET /api/meteo?date=YYYY-MM-DD` - Meteo del giorno
- `GET/POST/PUT/DELETE /api/eventi` - CRUD eventi
- `GET/POST/DELETE /api/piantine` - Gestione planimetrie

## Credenziali di test
- Admin: admin@villaparis.local / Admin123!
- Worker: worker.check@villaparis.local / Worker123!
- Report: report.temp@villaparis.local / Report123!

## Backlog futuro
- (P2) Preset schemi tavoli per fasce di invitati
- (P2) Preset menu per tipologia evento
- (P2) Fix warning Recharts nei grafici
- (P2) Warning locale Docker durante npm install
