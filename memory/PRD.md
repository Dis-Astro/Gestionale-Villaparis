# Villa Paris Gestionale - PRD

## Problema originale
Sistema gestionale per location eventi (matrimoni, battesimi, feste) per Villa Paris.

## Stato: PRONTO PER LA PRESENTAZIONE

### Tutte le funzionalita testate (16/16 PASS)
- [x] Dashboard con KPI reali (79 eventi, 92 clienti, statistiche)
- [x] Calendario con year picker, tooltip hover, doppio click, appuntamento rapido + canale contatto
- [x] Clienti: CRUD completo, canale contatto, tipo cliente, ricerca, export CSV
- [x] Nuovo Evento: canale contatto, 2 anagrafiche separate (sposa/sposo), auto-show per matrimoni
- [x] Modifica Evento: dateProposte, salvataggio, disposizioneSala (JSON parsing corretto)
- [x] Stampa PDF Cliente (bozza): versioni + download PDF funzionante
- [x] Notifiche: dropdown con eventi imminenti (entro 30 giorni)
- [x] Report Azienda: grafici, statistiche per anno, Excel con "Data Evento" + giorno settimana
- [x] Menu Base, Impostazioni (con Dati Azienda, config PDF, config Notifiche)
- [x] Nessun errore React in console

### Bug Fix Critici Risolti
- [x] PUT eventi: disposizioneSala serializzata con toJson()
- [x] Versioni/Stampa: snapshot serializzato con JSON.stringify()
- [x] Modifica evento: JSON string parsing per dateProposte/menu/struttura/disposizioneSala
- [x] React key duplicata nella Topbar

### Deploy Proxmox
- [x] Schema PostgreSQL (schema.prisma) aggiornato con canalePrimoContatto su Evento
- [x] Install script e ct-setup.sh puntano a branch OPUS
- [x] Entrypoint usa `prisma db push` per sync automatico schema
- [x] One-liner:
```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Dis-Astro/villa-paris-gestionale/OPUS/proxmox/install-ct.sh)"
```

## Stack
Next.js 15, React, TypeScript, Tailwind, shadcn/ui, Prisma, SQLite(dev)/PostgreSQL(prod), exceljs, pdfmake, recharts, FullCalendar

## Backlog
- [ ] P1: Ripristino versione evento (API + UI)
- [ ] P2: CRUD Clienti migliorato (filtri avanzati)
- [ ] P2: Fix doppio click tavoli sovrapposti piantina
