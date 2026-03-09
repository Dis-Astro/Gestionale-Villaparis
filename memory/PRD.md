# Villa Paris Gestionale - PRD

## Problema originale
Sistema gestionale per location eventi (matrimoni, battesimi, feste).

## Requisiti implementati

### Funzionalita Core
- [x] Dashboard con KPI e statistiche (dati reali: 79 eventi, 92 clienti)
- [x] Calendario eventi con appuntamenti rapidi, year picker, tooltip, doppio click
- [x] Gestione eventi CRUD con due anagrafiche separate (sposa/sposo)
- [x] Canale contatto (Telefono, Mail, Matrimonio.com, Social, Passaparola, Altro) in: form nuovo evento, appuntamento rapido, form clienti
- [x] Menu Base, Piantina sala, Stampe PDF
- [x] Report con export Excel: header "Data Evento" con giorno della settimana
- [x] Versioning anti-contestazione

### Anagrafica Clienti
- [x] CRUD completo (senza secondo contatto - due persone = due record separati)
- [x] Canale contatto + tipo cliente nel form
- [x] Export CSV, ricerca avanzata

### Database
- [x] 79 eventi e 92 clienti importati dal file Excel reale dell'utente
- [x] Date salvate in epoch ms (formato Prisma SQLite)
- [x] Script seed: scripts/seed_data.py

### Deploy
- [x] Dockerfile, docker-compose, entrypoint, Proxmox scripts
- [x] GitHub Actions CI/CD

## Stack
Next.js 15, React, TypeScript, Tailwind, shadcn/ui, Prisma, SQLite/PostgreSQL, exceljs, pdfmake, recharts, FullCalendar

## Backlog
- [ ] P1: Pagina Impostazioni
- [ ] P1: Ripristino versione evento
- [ ] P2: CRUD Clienti migliorato
- [ ] P2: Fix doppio click tavoli sovrapposti piantina
