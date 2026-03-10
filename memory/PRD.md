# Villa Paris Gestionale - PRD

## Problema originale
Sistema gestionale per location eventi (matrimoni, battesimi, feste) per Villa Paris.

## Stato: PRONTO PER IL DEPLOY

### Tutte le funzionalita testate (16/16 PASS)
- [x] Dashboard, Calendario, Clienti, Nuovo Evento, Modifica Evento
- [x] Stampa PDF Cliente, Notifiche, Report Azienda + Excel
- [x] Menu Base, Impostazioni, Piantina sala

### Bug Fix Risolti
- [x] PUT eventi: disposizioneSala serializzata
- [x] Versioni/Stampa: snapshot serializzato
- [x] Modifica evento: JSON string parsing
- [x] package-lock.json rigenerato e in sync con package.json
- [x] Dockerfile: Stage prod-deps separato per tutte le dipendenze transitive
- [x] Schema PostgreSQL (schema.prisma) allineato con schema.dev.prisma
- [x] Entrypoint usa `prisma db push` per sync automatico schema
- [x] Script Proxmox: branch default OPUS

### Deploy Proxmox
```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Dis-Astro/villa-paris-gestionale/OPUS/proxmox/install-ct.sh)"
```

## Stack
Next.js 15, React, TypeScript, Tailwind, shadcn/ui, Prisma, SQLite(dev)/PostgreSQL(prod), exceljs, pdfmake, recharts, FullCalendar

## Backlog
- [ ] P1: Ripristino versione evento (API + UI)
- [ ] P2: CRUD Clienti migliorato (filtri avanzati)
- [ ] P2: Fix doppio click tavoli sovrapposti piantina
