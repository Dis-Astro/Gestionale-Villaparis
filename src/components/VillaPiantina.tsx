'use client'

import { useState, useRef, useEffect } from 'react'
import Tavolo from './Tavolo'
import Stazione from './Stazione'
import PannelloVariantiTavolo from './PannelloVariantiTavolo'
import { Tavolo as TavoloType, Stazione as StazioneType } from '../types/piantina'
import { type VariantId, type VariantiTavolo } from '@/lib/types'
import { Upload, Printer } from 'lucide-react'

export default function VillaPiantina({
  disposizione,
  onChange,
  editabile = true,
  planimetrie = [],
  onNuovaPlanimetria,
  onCambiaPlanimetria,
  onStampa,
  stampaRef,
  variantiAttive = []
}: {
  disposizione: { tavoli: TavoloType[], stazioni: StazioneType[], immagine?: string, rotazioneImmagine?: number }
  onChange?: (nuovaDisposizione: { tavoli: TavoloType[], stazioni: StazioneType[], immagine?: string, rotazioneImmagine?: number }) => void
  editabile?: boolean
  planimetrie?: { nome: string, url: string }[]
  onNuovaPlanimetria?: (file: File) => void
  onCambiaPlanimetria?: (url: string) => void
  onStampa?: () => void
  stampaRef?: React.RefObject<HTMLDivElement | null>
  variantiAttive?: VariantId[]
}) {
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [backgroundImage, setBackgroundImage] = useState<string | null>(disposizione?.immagine || null)
  const [rotazioneImmagine, setRotazioneImmagine] = useState<number>(disposizione?.rotazioneImmagine || 0)
  const [planimetriaSelezionata, setPlanimetriaSelezionata] = useState<string | null>(null)
  const [tavoloVariantiAperto, setTavoloVariantiAperto] = useState<TavoloType | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setBackgroundImage(disposizione?.immagine || null)
    setRotazioneImmagine(disposizione?.rotazioneImmagine || 0)
    if (typeof disposizione?.immagine === 'string' && disposizione.immagine.startsWith('/planimetrie/')) {
      setPlanimetriaSelezionata(disposizione.immagine)
    }
  }, [disposizione?.immagine, disposizione?.rotazioneImmagine])

  const safeDisposizione = {
    tavoli: Array.isArray(disposizione?.tavoli) ? disposizione.tavoli : [],
    stazioni: Array.isArray(disposizione?.stazioni) ? disposizione.stazioni : [],
    immagine: disposizione?.immagine || undefined,
    rotazioneImmagine: disposizione?.rotazioneImmagine || 0
  }

  const emitChange = (next: Partial<{ tavoli: TavoloType[]; stazioni: StazioneType[]; immagine?: string; rotazioneImmagine?: number }>) => {
    if (!onChange) return
    onChange({
      ...safeDisposizione,
      immagine: backgroundImage ?? undefined,
      rotazioneImmagine,
      ...next
    })
  }

  const handleDragEnd = (tipo: 'tavolo' | 'stazione', id: number, nuovaPosPerc: { x: number, y: number }) => {
    if (tipo === 'tavolo') {
      const nuoviTavoli = safeDisposizione.tavoli.map(t =>
        t.id === id ? { ...t, posizione: { xPerc: nuovaPosPerc.x, yPerc: nuovaPosPerc.y } } : t
      )
      emitChange({ tavoli: nuoviTavoli })
    } else {
      const nuoveStazioni = safeDisposizione.stazioni.map(s =>
        s.id === id ? { ...s, posizione: { xPerc: nuovaPosPerc.x, yPerc: nuovaPosPerc.y } } : s
      )
      emitChange({ stazioni: nuoveStazioni })
    }
  }

  const handleRotateTavolo = (id: number, nuovaRotazione: number) => {
    const nuoviTavoli = safeDisposizione.tavoli.map(t =>
      t.id === id ? { ...t, rotazione: nuovaRotazione } : t
    )
    emitChange({ tavoli: nuoviTavoli })
  }

  const handleRotateStazione = (id: number, nuovaRotazione: number) => {
    const nuoveStazioni = safeDisposizione.stazioni.map(s =>
      s.id === id ? { ...s, rotazione: nuovaRotazione } : s
    )
    emitChange({ stazioni: nuoveStazioni })
  }

  const handleResizeTavolo = (id: number, nuovaDimensionePerc: number) => {
    const nuoviTavoli = safeDisposizione.tavoli.map(t =>
      t.id === id ? { ...t, dimensionePerc: nuovaDimensionePerc } : t
    )
    emitChange({ tavoli: nuoviTavoli })
  }

  const handleUpdatePostiTavolo = (id: number, posti: number) => {
    const nuoviTavoli = safeDisposizione.tavoli.map(t =>
      t.id === id ? { ...t, posti } : t
    )
    emitChange({ tavoli: nuoviTavoli })
  }

  const handleResizeStazione = (id: number, dimensionePerc: { larghezzaPerc: number, altezzaPerc: number }) => {
    const nuoveStazioni = safeDisposizione.stazioni.map(s =>
      s.id === id ? { ...s, dimensionePerc } : s
    )
    emitChange({ stazioni: nuoveStazioni })
  }

  const handleDeleteTavolo = (id: number) => {
    const nuoviTavoli = safeDisposizione.tavoli.filter(t => t.id !== id)
    emitChange({ tavoli: nuoviTavoli })
    setSelectedItem(null)
  }

  const handleDeleteStazione = (id: number) => {
    const nuoveStazioni = safeDisposizione.stazioni.filter(s => s.id !== id)
    emitChange({ stazioni: nuoveStazioni })
    setSelectedItem(null)
  }

  const handleRenameTavolo = (id: number, nuovoNome: string) => {
    const nuoviTavoli = safeDisposizione.tavoli.map(t =>
      t.id === id ? { ...t, numero: nuovoNome } : t
    )
    emitChange({ tavoli: nuoviTavoli })
  }

  const handleRenameStazione = (id: number, nuovoNome: string) => {
    const nuoveStazioni = safeDisposizione.stazioni.map(s =>
      s.id === id ? { ...s, nome: nuovoNome } : s
    )
    emitChange({ stazioni: nuoveStazioni })
  }

  // Handler per salvare varianti tavolo
  const handleSaveVariantiTavolo = (tavoloId: number, varianti: VariantiTavolo) => {
    const nuoviTavoli = safeDisposizione.tavoli.map(t =>
      t.id === tavoloId ? { ...t, varianti } : t
    )
    emitChange({ tavoli: nuoviTavoli })
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const nuovaImmagine = event.target?.result as string
        setBackgroundImage(nuovaImmagine)
        emitChange({ immagine: nuovaImmagine })
        if (onNuovaPlanimetria) {
          onNuovaPlanimetria(file)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleChangePlanimetria = (url: string) => {
    setPlanimetriaSelezionata(url)
    setBackgroundImage(url)
    if (onCambiaPlanimetria) {
      onCambiaPlanimetria(url)
    }
    emitChange({ immagine: url })
  }

  const ruotaPlanimetria90 = () => {
    const nuovaRotazione = (rotazioneImmagine + 90) % 360
    setRotazioneImmagine(nuovaRotazione)
    emitChange({ rotazioneImmagine: nuovaRotazione })
  }

  // PATCH: posizione di default sempre visibile
  const aggiungiTavolo = () => {
    const nuovoId = Math.max(0, ...safeDisposizione.tavoli.map(t => t.id || 0)) + 1
    emitChange({
      tavoli: [
        ...safeDisposizione.tavoli,
        {
          id: nuovoId,
          numero: `T${nuovoId}`,
          posti: 8,
          posizione: { xPerc: 0.12, yPerc: 0.12 }, // PATCH: fisso e visibile!
          rotazione: 0,
          forma: 'rotondo',
          dimensionePerc: 0.03
        }
      ]
    })
  }

  const aggiungiStazione = () => {
    const nuovoId = Math.max(0, ...safeDisposizione.stazioni.map(s => s.id || 0)) + 1
    emitChange({
      stazioni: [
        ...safeDisposizione.stazioni,
        {
          id: nuovoId,
          nome: `Stazione ${nuovoId}`,
          tipo: 'buffet',
          posizione: { xPerc: 0.18, yPerc: 0.18 }, // PATCH: fisso e visibile!
          rotazione: 0,
          dimensionePerc: { larghezzaPerc: 0.15, altezzaPerc: 0.06 }
        }
      ]
    })
  }

  // --- UI ---

  return (
    <div className="flex flex-col md:flex-row gap-4 w-full max-w-6xl mx-auto">
      {/* SIDEBAR PULSANTI SINISTRA */}
      <div className="flex flex-row md:flex-col gap-2 md:gap-4 md:w-44 items-start">
        {editabile && (
          <>
            <button
              className="bg-white px-4 py-2 rounded shadow flex items-center gap-1 border"
              onClick={() => onStampa && onStampa()}
              data-testid="piantina-stampa-btn"
            >
              <Printer size={16} />
              <span className="hidden md:inline">Stampa</span>
            </button>
            {planimetrie && planimetrie.length > 0 && (
              <select
                className="border rounded px-2 py-1"
                value={planimetriaSelezionata ?? ''}
                onChange={e => handleChangePlanimetria(e.target.value)}
              >
                <option value="">-- Planimetria --</option>
                {planimetrie.map(p => (
                  <option key={p.url} value={p.url}>{p.nome}</option>
                ))}
              </select>
            )}
            <button
              className="bg-blue-500 text-white px-3 py-1 rounded flex items-center gap-1"
              onClick={() => fileInputRef.current?.click()}
              data-testid="piantina-upload-bg-btn"
            >
              <Upload size={16} />
              <span className="hidden md:inline">Cambia planimetria</span>
            </button>
            <button
              className="bg-gray-700 text-white px-3 py-1 rounded"
              onClick={ruotaPlanimetria90}
              data-testid="piantina-ruota-90-btn"
            >
              ↻ Ruota 90°
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
            />
            <button
              className="bg-blue-500 text-white px-3 py-1 rounded"
              onClick={aggiungiTavolo}
              data-testid="piantina-aggiungi-tavolo-btn"
            >
              + Tavolo
            </button>
            <button
              className="bg-green-500 text-white px-3 py-1 rounded"
              onClick={aggiungiStazione}
              data-testid="piantina-aggiungi-stazione-btn"
            >
              + Stazione
            </button>
          </>
        )}
      </div>

      {/* PLANIMETRIA */}
      <div className="flex-1">
        <div
          ref={stampaRef || containerRef}
          className="relative border rounded-lg overflow-hidden aspect-[16/9] w-full bg-white"
        >
          {/* Background */}
          <div
            className="absolute inset-0 w-full h-full bg-gray-100"
            style={backgroundImage ? {
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              transform: `rotate(${rotazioneImmagine}deg)`,
              transformOrigin: 'center center',
              transition: 'transform 0.2s ease'
            } : {}}
          >
            {!backgroundImage && (
              <div className="text-center pt-24">
                <p className="text-gray-500 mb-2">Immagine piantina Villa Paris</p>
              </div>
            )}
          </div>

          {/* Tavoli */}
          {safeDisposizione.tavoli.map(tavolo => (
            <Tavolo
              key={tavolo.id}
              tavolo={tavolo}
              selected={selectedItem === `tavolo-${tavolo.id}`}
              onSelect={() => setSelectedItem(`tavolo-${tavolo.id}`)}
              onDragEnd={pos => handleDragEnd('tavolo', tavolo.id, pos)}
              onRotate={rot => handleRotateTavolo(tavolo.id, rot)}
              onDelete={() => handleDeleteTavolo(tavolo.id)}
              onRename={nome => handleRenameTavolo(tavolo.id, nome)}
              onUpdatePosti={(posti) => handleUpdatePostiTavolo(tavolo.id, posti)}
              onResize={(dimensionePerc) => handleResizeTavolo(tavolo.id, dimensionePerc)}
              onOpenVarianti={() => setTavoloVariantiAperto(tavolo)}
              editabile={editabile}
              containerRef={stampaRef || containerRef}
            />
          ))}

          {/* Stazioni */}
          {safeDisposizione.stazioni.map(stazione => (
            <Stazione
              key={stazione.id}
              stazione={stazione}
              selected={selectedItem === `stazione-${stazione.id}`}
              onSelect={() => setSelectedItem(`stazione-${stazione.id}`)}
              onDragEnd={pos => handleDragEnd('stazione', stazione.id, pos)}
              onRotate={rot => handleRotateStazione(stazione.id, rot)}
              onDelete={() => handleDeleteStazione(stazione.id)}
              onRename={nome => handleRenameStazione(stazione.id, nome)}
              onResize={(dimensionePerc) => handleResizeStazione(stazione.id, dimensionePerc)}
              editabile={editabile}
              containerRef={stampaRef || containerRef}
            />
          ))}
        </div>
      </div>

      {/* Pannello Varianti Tavolo */}
      {tavoloVariantiAperto && (
        <PannelloVariantiTavolo
          tavoloNumero={tavoloVariantiAperto.numero}
          tavoloPosti={tavoloVariantiAperto.posti}
          varianti={tavoloVariantiAperto.varianti || {}}
          variantiAttive={variantiAttive}
          onSave={(varianti) => handleSaveVariantiTavolo(tavoloVariantiAperto.id, varianti)}
          onClose={() => setTavoloVariantiAperto(null)}
        />
      )}
    </div>
  )
}
