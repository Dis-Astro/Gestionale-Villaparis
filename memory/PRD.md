# Villa Paris Gestionale - PRD

## Problema originale
Sistema gestionale per location eventi (matrimoni, battesimi, feste) per Villa Paris, con installazione semplice su Proxmox tramite comando one-liner.

## Stato attuale
**P0 deploy COMPLETATO:** installazione Proxmox confermata dall’utente.

## Ultimo aggiornamento (10-03-2026)
- Deploy Proxmox stabilizzato (`Dockerfile` con `npm install`, branch `OPUS`, script one-liner allineato).
- Calendario ottimizzato:
  - avvio su data odierna
  - ricerca evento/cliente con jump rapido
  - filtri rapidi (Tutti/Confermati/Opzionati/Appuntamenti)
  - scorciatoie `+1 settimana` e `+1 mese`
- Flusso menu reso più semplice per operatore:
  - in **Nuovo Evento** aggiunta sezione “Menu Evento (Easy)” con menu base, sovrapprezzo/persona, extra accordi
  - conversione automatica da menu base a menu evento personalizzabile
  - `MenuBaseSelector` semplificato (caricamento template + gestione menu base)
- Piantina migliorata (iPad/desktop):
  - tavoli e stazioni ridimensionabili (slider + maniglia drag)
  - salvataggio disposizione con supporto override blocco -10 giorni
  - export PNG, export PDF e stampa migliorata
- Nuovo ciclo piantina (richieste utente 1B/2B/3C/4A):
  - rotazione planimetria a step **90°** con persistenza (`rotazioneImmagine`)
  - libreria planimetrie persistente (`GET/POST /api/piantine`) con riuso su eventi diversi
  - copia schema da evento simile (suggerimenti automatici + scelta manuale)
  - gestione posti tavolo direttamente nel controllo tavolo (nome + posti + dimensione)
  - tavolo nuovo con dimensione iniziale **molto piccola** (`dimensionePerc=0.03`)
- Report Excel aggiornato:
  - colonna `Prezzo/Persona` aggiunta
  - fallback automatico a `struttura.prezzo` se `evento.prezzo` non presente

## Validazione
- Test TypeScript: `npx tsc --noEmit` ✅
- Smoke test UI Playwright su calendario/nuovo evento/piantina ✅
- Testing Agent: `/app/test_reports/iteration_6.json` → tutte le feature richieste PASS ✅
- Testing Agent: `/app/test_reports/iteration_7.json` → nuove feature piantina PASS ✅

## Stato funzionalità applicative
- Bug critici precedenti corretti: modifica eventi, date in modifica, creazione bozze/versioni, PDF clienti, notifiche.
- Nuove richieste operative menu/piantina/report implementate e validate.

## Stack
Next.js 15, React, TypeScript, Tailwind, shadcn/ui, Prisma, SQLite (dev) / PostgreSQL (prod), exceljs, pdfmake, recharts, FullCalendar, Docker.

## Backlog prioritizzato
- **P1**: Rendere la selezione menu base sempre disponibile anche in Modifica Evento con flusso guidato (non solo primo caricamento).
- **P1**: Preset rapidi planimetria (layout standard matrimonio/comunione/compleanno).
- **P2**: CRUD Clienti migliorato (filtri avanzati / UX).
- **P2**: Fix doppio click tavoli sovrapposti in piantina.
- **P2**: Riduzione warning locale durante installazione dipendenze container.
