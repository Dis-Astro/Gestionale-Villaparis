# Villa Paris Gestionale - PRD

## Problema originale
Sistema gestionale per location eventi (matrimoni, battesimi, feste).

## Requisiti implementati

### Funzionalita Core
- [x] Dashboard con KPI e statistiche (dati reali: 79 eventi, 92 clienti)
- [x] Calendario eventi con appuntamenti rapidi, year picker, tooltip, doppio click
- [x] Gestione eventi CRUD con due anagrafiche separate (sposa/sposo)
- [x] Canale contatto in: form nuovo evento, appuntamento rapido, form clienti
- [x] Menu Base, Piantina sala, Stampe PDF
- [x] Report con export Excel: header "Data Evento" con giorno della settimana
- [x] Versioning/Stampa bozze funzionante (snapshot serializzato correttamente)
- [x] Modifica eventi: JSON fields (dateProposte, menu, struttura, disposizioneSala) parsed correttamente

### Bug Fix Critici
- [x] PUT eventi: disposizioneSala serializzata con toJson()
- [x] Modifica evento: dateProposte parsate da stringa JSON ad array
- [x] Versioni/Stampa: snapshot serializzato con JSON.stringify()
- [x] React key duplicata nella Topbar

### Database
- [x] 79 eventi e 92 clienti importati da Excel reale
- [x] Date in epoch ms (formato Prisma SQLite)
- [x] Script seed: scripts/seed_data.py

## Stack
Next.js 15, React, TypeScript, Tailwind, shadcn/ui, Prisma, SQLite/PostgreSQL, exceljs, pdfmake, recharts, FullCalendar

## Backlog
- [ ] P1: Pagina Impostazioni
- [ ] P1: Ripristino versione evento
- [ ] P2: CRUD Clienti migliorato
- [ ] P2: Fix doppio click tavoli sovrapposti piantina
