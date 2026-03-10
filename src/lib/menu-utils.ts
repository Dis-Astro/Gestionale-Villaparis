import type { MenuEvento, Portata } from '@/lib/types'

const CATEGORIA_LABELS: Record<string, string> = {
  antipasto: 'Antipasti',
  primo: 'Primi',
  secondo: 'Secondi',
  contorno: 'Contorni',
  dolce: 'Dolci',
  bevanda: 'Bevande',
  altro: 'Altro'
}

const ORDINE_CATEGORIE = ['antipasto', 'primo', 'secondo', 'contorno', 'dolce', 'bevanda', 'altro']

export function normalizeStrutturaMenuBase(raw: any): any {
  if (!raw) return {}
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw)
    } catch {
      return {}
    }
  }
  return raw
}

export function getPrezzoDaStruttura(raw: any): number | null {
  const struttura = normalizeStrutturaMenuBase(raw)
  const prezzo = Number(struttura?.prezzo)
  return Number.isFinite(prezzo) && prezzo > 0 ? prezzo : null
}

export function buildMenuEventoFromStruttura(raw: any): MenuEvento {
  const struttura = normalizeStrutturaMenuBase(raw)
  const piatti = Array.isArray(struttura?.piatti) ? struttura.piatti : []

  const portate = ORDINE_CATEGORIE.reduce<Portata[]>((acc, categoria, idx) => {
    const righe = piatti
      .filter((p: any) => p?.categoria === categoria && p?.nome)
      .map((p: any) => `• ${p.nome}${p.descrizione ? ` — ${p.descrizione}` : ''}`)

    if (!righe.length) return acc

    acc.push({
      id: `base-${categoria}-${idx}`,
      nome: CATEGORIA_LABELS[categoria] || categoria,
      ordine: idx + 1,
      descrizione: righe.join('\n')
    })

    return acc
  }, [])

  return {
    portate,
    variantiAttive: [],
    note: ''
  }
}
