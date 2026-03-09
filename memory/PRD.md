# Villa Paris Gestionale - PRD

## Problema originale
Sistema gestionale per location eventi (matrimoni, battesimi, feste).
L'utente vuole un'applicazione finita, pulita e facilmente deployabile.

## Target
Gestori di Villa Paris (location eventi).

## Requisiti implementati

### UI & Layout
- [x] Layout AppShell (sidebar + topbar) unificato su tutte le pagine
- [x] Navigazione coerente tra dashboard, calendario, eventi, clienti, report
- [x] Breadcrumb con chiavi univoche (fix bug React key duplicata)

### Funzionalita Core
- [x] Dashboard con KPI e statistiche
- [x] Calendario eventi con appuntamenti rapidi (1-click)
- [x] Calendario: Year picker (2024-2030) e input "Vai a data"
- [x] Calendario: Tooltip hover con dettagli evento
- [x] Calendario: Doppio click per aprire scheda completa
- [x] Gestione eventi CRUD completa
- [x] Menu Base - template con selezione piatti
- [x] Piantina sala - drag & drop con varianti alimentari
- [x] Stampe PDF - contratti e documenti operativi
- [x] Report con export Excel (multi-foglio: Report Aziendale + Anagrafica Clienti)
- [x] Report: grafici (Ricavi/Eventi/Ospiti per mese, Eventi per tipo)
- [x] Versioning - snapshot anti-contestazione
- [x] Blocco automatico modifiche a -10 giorni

### Flusso Evento & Canale Contatto
- [x] Canale di contatto (Telefono, Mail, Matrimonio.com, Social, Passaparola, Altro) nel form Nuovo Evento
- [x] Canale di contatto nel modal Appuntamento Rapido (calendario)
- [x] Due anagrafiche separate per evento: Sposa/Festeggiata + Sposo (2 record Cliente distinti)
- [x] Auto-show sezione Sposo quando tipo = Matrimonio
- [x] canalePrimoContatto salvato sia su Evento che su Cliente

### Anagrafica Clienti
- [x] CRUD completo clienti
- [x] Canale contatto e tipo cliente nel form clienti
- [x] Rimossa sezione "secondo contatto" (2 persone = 2 anagrafiche separate)
- [x] Export CSV clienti
- [x] Ricerca clienti per nome, email, telefono, citta

### Database & Backend
- [x] Migrazione da SQLite a PostgreSQL (produzione)
- [x] Prisma ORM con schema aggiornato (canalePrimoContatto su Evento)
- [x] API eventi supporta creazione multipla clienti
- [x] Singleton client Prisma per connessioni efficienti

### Deploy & Infrastructure
- [x] Dockerfile multi-stage per Next.js 15
- [x] docker-compose.yml con variabili d'ambiente
- [x] docker/entrypoint.sh per migrazioni automatiche all'avvio
- [x] Script Proxmox one-liner (install-ct.sh + ct-setup.sh)
- [x] GitHub Actions CI/CD deploy automatico

## Architettura
```
/app
├── prisma/
│   ├── schema.dev.prisma      # SQLite (dev/preview)
│   └── schema.prisma          # PostgreSQL (produzione)
├── src/
│   ├── app/
│   │   ├── (app)/             # Pagine con layout AppShell
│   │   │   ├── calendario/    # Calendar + appuntamento rapido + canale
│   │   │   ├── clienti/       # Anagrafica senza 2 contatto
│   │   │   ├── nuovo-evento/  # 2 clienti + canale contatto
│   │   │   └── ...
│   │   └── api/               # API Routes Next.js
│   └── components/
├── docker-compose.yml
├── Dockerfile
└── README.md
```

## Stack Tecnologico
- Frontend: Next.js 15 (App Router), React, TypeScript, Tailwind CSS, shadcn/ui
- Backend: Next.js API Routes
- Database: PostgreSQL 16 (prod) + SQLite (dev) + Prisma ORM
- Deploy: Docker, Docker Compose, Bash (Proxmox LXC)
- Librerie: pdfmake, exceljs, react-dnd, recharts, FullCalendar

## Backlog P1/P2

### P1 - Upcoming
- [ ] Pagina Impostazioni (attualmente placeholder)
- [ ] Ripristino versione evento (API + UI button)
- [ ] Webhook GitHub Actions per deploy continuo su Proxmox

### P2 - Backlog
- [ ] CRUD Clienti migliorato (filtri avanzati)
- [ ] Fix doppio click su tavoli sovrapposti nella piantina
