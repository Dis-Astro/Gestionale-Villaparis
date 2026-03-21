# Villa Paris Gestionale - PRD

## Problema originale
Sistema gestionale per location eventi (matrimoni, battesimi, feste) per Villa Paris, con installazione semplice su Proxmox tramite comando one-liner.

## Stato attuale
**P0 deploy COMPLETATO:** installazione Proxmox confermata dall’utente.
**P0 build production RIPRISTINATA:** errore Next.js su `/appuntamenti` risolto e build `npm run build` verificata con esito positivo.
**FASE 3 reportistica COMPLETATA:** dashboard e report operativi reali con policy spam, export Excel/PDF e KPI su contatti/appuntamenti/interazioni/tempo.
**HOTFIX post FASE 3 COMPLETATO:** report eventi storico ripristinato come modulo separato e primo contatto reso visibile nel calendario come voce dedicata.

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
- Refinement UI (11-03-2026 - iterazione 11):
  - rimossa opzione toggle “Mostra solo Schemi Preferiti”: ora la vista copia schema mostra sempre e solo i preferiti
  - aggiunto controllo separato “Aggiungi ai preferiti” per gestire l’elenco senza perdere pulizia UI
  - pannello controlli piantina ridisegnato in **segmented controls** compatti (più armonico e iPad-friendly)
  - pulsanti `+ Tavolo` e `+ Stazione` allineati orizzontalmente (non più impilati)
- Refinement schema preferiti (11-03-2026 - iterazione 12):
  - semplificata la card “Scegli schema” in modalità ultra-compatta: solo dropdown preferiti + `Applica schema` + `⭐` + `Rimuovi Preferito`
  - rimossi testi/righe ridondanti (“Visualizzazione attiva”, secondo dropdown gestione preferiti)
  - comportamento coerente con richiesta operatore: vista pulita, meno elementi, minore carico cognitivo
- Report Excel aggiornato:
  - colonna `Prezzo/Persona` aggiunta
  - fallback automatico a `struttura.prezzo` se `evento.prezzo` non presente
- **FASE 1 flusso strutturale (20-03-2026) COMPLETATA**
  - introdotte nuove entità dominio: `User`, `Appuntamento`, `AppuntamentoCliente`, `InterazioneCliente`, `AuditLog`
  - nuovo flusso operativo: appuntamenti gestiti da API/page dedicate (`/api/appuntamenti`, `/appuntamenti`), non più creati come evento fittizio da calendario
  - calendario aggiornato: creazione appuntamento via `/api/appuntamenti`, doppio click su appuntamento apre scheda appuntamento
  - evento aggiornato con relazione opzionale `appuntamentoOrigineId` (conversione da appuntamento a evento)
  - `PUT /api/eventi` riscritto patch-safe (niente azzeramenti su campi non inviati)
  - audit backend attivo per `CLIENT`, `EVENT`, `APPOINTMENT` via `AuditLog` + endpoint `/api/audit`
  - clienti estesi con gestione spam manuale (`isSpam`, `spamReason`, `spamMarkedAt`) + KPI pre-evento
  - aggiunto script conservativo di backfill legacy: `scripts/backfill_appointments.js`
- **FASE 2 auth/ruoli (20-03-2026) COMPLETATA**
  - implementata auth JWT custom email/password (`/api/auth/login`, `/api/auth/me`, `/api/auth/logout`)
  - introdotto middleware globale per protezione pagine/API con controllo ruolo
  - pagina `Gestione Utenti` (solo Admin): lista, creazione, attiva/disattiva, cambio ruolo, reset password
  - sidebar role-based:
    - ADMIN: accesso completo
    - REPORT: accesso report + audit, no gestione utenti
    - WORKER: solo Calendario/Eventi/Clienti/Menu Base/Stampe
  - audit anche per operazioni utenti (`entityType=USER`)
  - seed admin iniziale confermato (`admin@villaparis.local / Admin123!`)
- **FIX build production `/appuntamenti` (20-03-2026) COMPLETATO**
  - root cause: `useSearchParams()` era usato direttamente nel componente pagina client `src/app/(app)/appuntamenti/page.tsx`, quindi Next.js continuava a rilevare l’assenza del `Suspense boundary` durante il prerender
  - fix minimo applicato: estratta la logica in `AppuntamentiPageContent` e wrappata dal default export con `<Suspense>`
  - verifica eseguita: `npm run build` ✅
- **FASE 3 reportistica operativa (20-03-2026) COMPLETATA**
  - nuova logica condivisa `src/lib/report/operational.ts` con source of truth su `Cliente`, `Appuntamento`, `Evento`, `InterazioneCliente`
  - `GET /api/report/stats` riscritto: supporta `period=week|month|year`, filtri `operatorId/source/status/spamMode` e restituisce KPI reali, trend, provenienze, operatori, clienti, attività
  - `GET /api/report/azienda.xlsx` riscritto: export Excel multi-sheet coerente con i nuovi report operativi
  - export PDF report aggiunto lato frontend (`src/lib/report/pdf.ts`)
  - dashboard `/dashboard` estesa con filtri e KPI reali dalla reportistica FASE 3
  - pagina `/report/azienda` sostituita con report operativo completo: filtri, policy spam, KPI cards, chart, tabelle operatori/clienti/attività
  - policy spam robusta:
    - settimanale: spam visibile ed evidenziato in rosso
    - mensile/annuale: spam escluso da conteggi e liste principali
  - sidebar resa completamente scorrevole su viewport bassi mantenendo pulsante `Nuovo Evento` e info utente sempre accessibili
  - nessuna API mocked
- **HOTFIX post FASE 3 (21-03-2026) COMPLETATO**
  - root cause report eventi scomparso: la FASE 3 aveva sovrascritto `src/app/(app)/report/azienda/page.tsx`, `src/app/api/report/stats/route.ts` e `src/app/api/report/azienda.xlsx/route.ts` invece di affiancare il nuovo report operativo al report eventi storico
  - fix minimo applicato: il report operativo è rimasto su `/report/azienda`; ripristinato il modulo storico eventi separato su `/report/eventi` con API dedicate `GET /api/report/eventi/stats` e `GET /api/report/eventi.xlsx`
  - menu aggiornato in modo conservativo con due voci distinte: `Report Operativo` e `Report Eventi`
  - root cause primo contatto mancante in calendario: il calendario leggeva solo `/api/eventi` + `/api/appuntamenti` e si basava su `Evento.dataPrimoContatto`; i primi contatti presenti solo in `Cliente.dataPrimoContatto` senza evento collegato non entravano nel feed calendario
  - fix minimo applicato: aggiunto feed dedicato da `/api/clienti` dentro `calendario/page.tsx`, deduplicato rispetto agli eventi che hanno già la stessa registrazione primo contatto, mantenendo separazione visiva tra primo contatto / appuntamento / evento

## Validazione
- Build produzione: `npm run build` ✅ (20-03-2026, FASE 3 inclusa)
- Build produzione: `npm run build` ✅ (20-03-2026, fix `useSearchParams` su `/appuntamenti` verificato)
- Smoke test API locale: login admin + `GET /api/report/stats` + `GET /api/report/azienda.xlsx` ✅
- Smoke test UI locale: `/report/azienda` carica correttamente e sidebar scrollabile (`overflow-y:auto`) ✅
- Testing Agent: `/app/test_reports/iteration_15.json` → FASE 3 report/dashboard/export/sidebar PASS ✅
- Build produzione hotfix: `npm run build` ✅ (21-03-2026)
- Testing Agent: `/app/test_reports/iteration_16.json` → coesistenza Report Operativo + Report Eventi + Primo contatto nel calendario PASS ✅
- Auto frontend smoke: hotfix report/calendario PASS ✅
- Deep backend smoke: hotfix report/eventi/clienti PASS ✅
- Test TypeScript: `npx tsc --noEmit` ✅
- Smoke test UI Playwright su calendario/nuovo evento/piantina ✅
- Testing Agent: `/app/test_reports/iteration_6.json` → tutte le feature richieste PASS ✅
- Testing Agent: `/app/test_reports/iteration_7.json` → nuove feature piantina PASS ✅
- Testing Agent: `/app/test_reports/iteration_8.json` → editor planimetria (upload+crop+rotate) PASS ✅
- Testing Agent: `/app/test_reports/iteration_9.json` → audit completo menu/stampe/clienti/report PASS ✅
- Testing Agent: `/app/test_reports/iteration_10.json` → UX planimetria + export + schema preferiti PASS ✅
- Testing Agent: `/app/test_reports/iteration_11.json` → refinement UI preferiti + layout controlli PASS ✅
- Smoke test Playwright locale: card schema preferiti compatta e senza elementi ridondanti ✅
- Testing Agent: `/app/test_reports/iteration_12.json` → card schema preferiti ultra-semplificata PASS ✅
- Testing Agent: `/app/test_reports/iteration_13.json` → FASE 1 flusso appuntamenti + patch-safe + audit PASS ✅
- Testing Agent: `/app/test_reports/iteration_14.json` → FASE 2 auth/ruoli/protezioni PASS ✅

## Stato funzionalità applicative
- Bug critici precedenti corretti: modifica eventi, date in modifica, creazione bozze/versioni, PDF clienti, notifiche.
- Nuove richieste operative menu/piantina/report implementate e validate.
- Reportistica FASE 3 ora reale e utilizzabile operativamente senza mock.
- Hotfix report/calendario validato: report operativo intatto, report eventi storico nuovamente disponibile, primo contatto visibile nel calendario senza eventi fittizi.

## Note tecniche di compatibilità
- In ambiente preview locale, l’esecuzione manuale di `npm run build` rigenera temporaneamente Prisma sullo schema produzione (`schema.prisma`); per ripristinare il runtime dev (`schema.dev.prisma`) può essere necessario `sudo supervisorctl restart frontend` dopo il build. La build production resta comunque valida.

## Stack
Next.js 15, React, TypeScript, Tailwind, shadcn/ui, Prisma, SQLite (dev) / PostgreSQL (prod), exceljs, pdfmake, recharts, FullCalendar, Docker.

## Backlog prioritizzato
- **P1**: Rendere la selezione menu base sempre disponibile anche in Modifica Evento con flusso guidato (non solo primo caricamento).
- **P1**: Preset rapidi planimetria (layout standard matrimonio/comunione/compleanno).
- **P2**: CRUD Clienti migliorato (filtri avanzati / UX).
- **P2**: Fix doppio click tavoli sovrapposti in piantina.
- **P2**: Riduzione warning locale durante installazione dipendenze container.
