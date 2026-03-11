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
- Nuovo ciclo UX planimetria (richiesta “immagine piccola/non lavorabile”):
  - rimosso pulsante rotazione rapida dalla toolbar planimetria
  - introdotto editor in upload con **ritaglio operativo**: zoom, rotazione libera, spostamento X/Y
  - applicazione editor via canvas (output JPEG) per usare tutta l’area (`background-size: cover`)
  - salvataggio in evento + salvataggio in libreria planimetrie mantenuti
- Nuovo ciclo audit completo dati/menu/stampe (11-03-2026):
  - **Menu Base**: aggiunto flag per pietanza `defaultSelected` (selezione di default per velocizzare scelta cliente)
  - **Menu Evento**: rimosso flusso “elimina portata”; ora selezione per singola pietanza con limiti categoria + extra piatto
  - **API Menu Base** resa compatibile sqlite/postgres (fix errore salvataggio in preview)
  - **Stampe PDF**: eliminato caso `undefined/undefined` cliente; aggiunto prezzo/persona e totale stimato in cliente+operativo
  - **Anagrafica Clienti**: normalizzazione date input (`YYYY-MM-DD`) per coerenza card↔scheda cliente
  - **Dashboard/Stats report**: rimosso fallback hardcoded 80, ora usa `evento.prezzo` o fallback `struttura.prezzo`
- Nuovo ciclo UX planimetria avanzata iPad/Pencil (11-03-2026):
  - fix export/stampa planimetria: rimosso vincolo html2canvas `oklch`, export riscritto con canvas renderer custom (PNG/PDF/Stampa)
  - varianti menu tavolo apribili **solo da pulsante** 🍽 (doppio click disattivato)
  - resize tavoli/stazioni spostato in **toolbar esterna** (massivo + singolo + reset), eliminati controlli invasivi in overlay tavolo/stazione
  - modalità operativa touch: **Drag Lock default ON** + **Snap Grid default ON**
  - libreria planimetrie: aggiunta eliminazione (`DELETE /api/piantine`), nomi troncati per evitare overlap UI
  - schema riuso eventi: introdotto flag **Schema Preferito** + filtro “Mostra solo Schemi Preferiti”
  - report azienda: ridotti warning chart con `ResponsiveContainer width=99% debounce=100`
- Report Excel aggiornato:
  - colonna `Prezzo/Persona` aggiunta
  - fallback automatico a `struttura.prezzo` se `evento.prezzo` non presente

## Validazione
- Test TypeScript: `npx tsc --noEmit` ✅
- Smoke test UI Playwright su calendario/nuovo evento/piantina ✅
- Testing Agent: `/app/test_reports/iteration_6.json` → tutte le feature richieste PASS ✅
- Testing Agent: `/app/test_reports/iteration_7.json` → nuove feature piantina PASS ✅
- Testing Agent: `/app/test_reports/iteration_8.json` → editor planimetria (upload+crop+rotate) PASS ✅
- Testing Agent: `/app/test_reports/iteration_9.json` → audit completo menu/stampe/clienti/report PASS ✅
- Testing Agent: `/app/test_reports/iteration_10.json` → UX planimetria + export + schema preferiti PASS ✅

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
