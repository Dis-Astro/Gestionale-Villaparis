# Villa Paris Gestionale - PRD

## Problema originale
Sistema gestionale per location eventi (matrimoni, battesimi, feste) per Villa Paris, con installazione semplice su Proxmox tramite comando one-liner.

## Stato attuale
**P0 in corso (bloccato su azione utente):** correzione deploy completata localmente, da pubblicare su GitHub.

## Ultimo aggiornamento (fork corrente)
- Verificato che il `Dockerfile` usa `npm install` (non `npm ci`) nello stage dipendenze: fix principale per errore build su Proxmox.
- Verificato che `proxmox/install-ct.sh` e `proxmox/ct-setup.sh` puntano di default al branch `OPUS`.
- Aggiornato `README.md`:
  - default `REPO_BRANCH` corretto a `OPUS`
  - nota esplicita: serve **Save to Github** prima di rilanciare il one-liner Proxmox.

## Requisito critico aperto (P0)
Per risolvere definitivamente il deploy:
1. Usare **Save to Github** sul branch usato da Proxmox (`OPUS`).
2. Rilanciare il comando:
   ```bash
   bash -c "$(curl -fsSL https://raw.githubusercontent.com/Dis-Astro/villa-paris-gestionale/OPUS/proxmox/install-ct.sh)"
   ```
3. Inviare log completo se compare un nuovo errore.

## Stato funzionalità applicative
- Bug critici precedenti risultano corretti: modifica eventi, date in modifica, creazione bozze/versioni, PDF clienti, menu notifiche.

## Stack
Next.js 15, React, TypeScript, Tailwind, shadcn/ui, Prisma, SQLite (dev) / PostgreSQL (prod), exceljs, pdfmake, recharts, FullCalendar, Docker.

## Backlog prioritizzato
- **P1**: Pagina Impostazioni (completamento/refine).
- **P1**: Ripristino versione evento (API + UI).
- **P2**: CRUD Clienti migliorato (filtri avanzati / UX).
- **P2**: Fix doppio click tavoli sovrapposti in piantina.
- **P2**: Riduzione warning locale durante installazione dipendenze container.
