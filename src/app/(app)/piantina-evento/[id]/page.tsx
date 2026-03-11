'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import VillaPiantina from '@/components/VillaPiantina'
import VillaPiantinaDnDWrapper from '@/components/VillaPiantinaDnDWrapper'
import { type VariantId, calcolaRiepilogoVarianti, VARIANTI_DEFAULT } from '@/lib/types'
import BannerBlocco, { getOverrideHeaders } from '@/components/BannerBlocco'
import jsPDF from 'jspdf'
import { 
  Layout, 
  Save, 
  ArrowLeft, 
  UtensilsCrossed,
  Info,
  Printer,
  Image,
  FileText
} from 'lucide-react'

export default function GestionePiantinaPage() {
  const { id } = useParams()
  const eventoId = Number(id)
  const router = useRouter()
  const [evento, setEvento] = useState<any>(null)
  const [infoBlocco, setInfoBlocco] = useState<any>(null)
  const [disposizione, setDisposizione] = useState<{ tavoli: any[], stazioni: any[], immagine?: string, rotazioneImmagine?: number }>({ tavoli: [], stazioni: [], immagine: undefined, rotazioneImmagine: 0 })
  const [planimetrie, setPlanimetrie] = useState<{ nome: string; url: string }[]>([])
  const [eventiSimili, setEventiSimili] = useState<any[]>([])
  const [schemaDaCopiareId, setSchemaDaCopiareId] = useState('')
  const [schemaDaPreferireId, setSchemaDaPreferireId] = useState('')
  const [preferitiSchemaIds, setPreferitiSchemaIds] = useState<number[]>([])
  const [variantiAttive, setVariantiAttive] = useState<VariantId[]>([])
  const [status, setStatus] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const stampaRef = useRef<HTMLDivElement>(null)

  const aggiornaDisposizione = useCallback((nuova: any) => {
    setDisposizione(JSON.parse(JSON.stringify(nuova)))
  }, [])

  const parseDisposizione = (raw: any) => {
    const parsed = typeof raw === 'string'
      ? (() => {
          try { return JSON.parse(raw || '{}') } catch { return {} }
        })()
      : raw

    return {
      tavoli: Array.isArray(parsed?.tavoli) ? parsed.tavoli : [],
      stazioni: Array.isArray(parsed?.stazioni) ? parsed.stazioni : [],
      immagine: parsed?.immagine ?? undefined,
      rotazioneImmagine: parsed?.rotazioneImmagine || 0
    }
  }

  const fetchPlanimetrie = useCallback(async () => {
    try {
      const res = await fetch('/api/piantine')
      const data = await res.json()
      setPlanimetrie(Array.isArray(data) ? data : [])
    } catch {
      setPlanimetrie([])
    }
  }, [])

  useEffect(() => {
    const fetchEvento = async () => {
      try {
        const res = await fetch(`/api/eventi?id=${id}`)
        if (!res.ok) {
          console.error('Errore nel caricamento evento:', res.status)
          return
        }
        const data = await res.json()
        setEvento(data)
        if (data._blocco) setInfoBlocco(data._blocco)
        
        if (data.menu?.variantiAttive) {
          setVariantiAttive(data.menu.variantiAttive)
        }

        setDisposizione(parseDisposizione(data.disposizioneSala))
      } catch (error) {
        console.error('Errore nel caricamento evento:', error)
      }
    }
    fetchEvento()
    fetchPlanimetrie()
  }, [id, fetchPlanimetrie])

  useEffect(() => {
    const raw = localStorage.getItem('schema_preferiti_ids')
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) setPreferitiSchemaIds(parsed.map((x) => Number(x)).filter(Boolean))
      } catch {
        setPreferitiSchemaIds([])
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('schema_preferiti_ids', JSON.stringify(preferitiSchemaIds))
  }, [preferitiSchemaIds])

  useEffect(() => {
    const fetchEventiSimili = async () => {
      if (!evento?.tipo) return
      try {
        const res = await fetch('/api/eventi')
        const data = await res.json()
        if (!Array.isArray(data)) return

        const candidati = data
          .filter((ev: any) => Number(ev.id) !== eventoId)
          .map((ev: any) => ({ ...ev, _disposizioneParsed: parseDisposizione(ev.disposizioneSala) }))
          .filter((ev: any) => ev._disposizioneParsed.tavoli.length > 0)
          .sort((a: any, b: any) => {
            const aScore = Math.abs((a.personePreviste || 0) - (evento.personePreviste || 0))
            const bScore = Math.abs((b.personePreviste || 0) - (evento.personePreviste || 0))
            const sameTypeA = a.tipo === evento.tipo ? -1000 : 0
            const sameTypeB = b.tipo === evento.tipo ? -1000 : 0
            return (aScore + sameTypeA) - (bScore + sameTypeB)
          })
          .slice(0, 15)

        setEventiSimili(candidati)
      } catch {
        setEventiSimili([])
      }
    }
    fetchEventiSimili()
  }, [evento?.tipo, evento?.personePreviste, eventoId])

  const handleUploadPlanimetriaGlobale = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('nome', file.name)

    const res = await fetch('/api/piantine', {
      method: 'POST',
      body: formData
    })

    if (res.ok) {
      await fetchPlanimetrie()
      setStatus('✅ Planimetria salvata in libreria')
      setTimeout(() => setStatus(''), 2000)
    } else {
      setStatus('❌ Errore salvataggio planimetria in libreria')
    }
  }

  const handleCopiaSchema = () => {
    const selected = eventiSimili.find((e) => String(e.id) === schemaDaCopiareId)
    if (!selected) return
    setDisposizione(parseDisposizione(selected.disposizioneSala))
    setStatus(`✅ Schema copiato da evento #${selected.id}`)
    setTimeout(() => setStatus(''), 2000)
  }

  const togglePreferitoSchema = (eventoIdToToggle: number) => {
    setPreferitiSchemaIds((prev) =>
      prev.includes(eventoIdToToggle)
        ? prev.filter((id) => id !== eventoIdToToggle)
        : [...prev, eventoIdToToggle]
    )
  }

  const addPreferitoSchema = (eventoIdToAdd: number) => {
    setPreferitiSchemaIds((prev) =>
      prev.includes(eventoIdToAdd) ? prev : [...prev, eventoIdToAdd]
    )
  }

  const handleDeletePlanimetriaGlobale = async (url: string) => {
    const res = await fetch(`/api/piantine?url=${encodeURIComponent(url)}`, { method: 'DELETE' })
    if (res.ok) {
      await fetchPlanimetrie()
      setStatus('✅ Planimetria eliminata dalla libreria')
      setTimeout(() => setStatus(''), 2000)
    } else {
      setStatus('❌ Errore eliminazione planimetria')
    }
  }

  const loadImage = (src: string) => {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new window.Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })
  }

  const handleSave = async () => {
    if (!evento) return
    setIsSaving(true)
    setStatus('Salvataggio in corso...')
    const overrideHeaders = getOverrideHeaders()
    try {
      const res = await fetch(`/api/eventi?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...overrideHeaders },
        body: JSON.stringify({
          ...evento,
          disposizioneSala: disposizione
        })
      })

      if (res.status === 423) {
        const body = await res.json()
        setStatus(`🔒 ${body.message || 'Evento bloccato: serve override amministrativo.'}`)
      } else {
        setStatus(res.ok ? '✅ Salvato con successo' : '❌ Errore nel salvataggio')
      }
      setTimeout(() => setStatus(''), 2000)
    } catch (error) {
      console.error('Errore nel salvataggio:', error)
      setStatus('❌ Errore nel salvataggio')
    } finally {
      setIsSaving(false)
    }
  }

  const generateCanvas = async () => {
    const width = 1920
    const height = 1080
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)

    if (disposizione?.immagine) {
      try {
        const img = await loadImage(disposizione.immagine)
        const scale = Math.max(width / img.width, height / img.height)
        const drawW = img.width * scale
        const drawH = img.height * scale
        const x = (width - drawW) / 2
        const y = (height - drawH) / 2
        ctx.drawImage(img, x, y, drawW, drawH)
      } catch {
        // se immagine non caricabile, continua con sfondo bianco
      }
    }

    // Stazioni
    for (const stazione of disposizione?.stazioni || []) {
      const x = (stazione.posizione?.xPerc || 0) * width
      const y = (stazione.posizione?.yPerc || 0) * height
      const w = (stazione.dimensionePerc?.larghezzaPerc || 0.15) * width
      const h = (stazione.dimensionePerc?.altezzaPerc || 0.06) * height

      ctx.save()
      ctx.translate(x + w / 2, y + h / 2)
      ctx.rotate(((stazione.rotazione || 0) * Math.PI) / 180)
      ctx.fillStyle = '#e9f7ef'
      ctx.strokeStyle = '#22c55e'
      ctx.lineWidth = 2
      const radius = 12
      ctx.beginPath()
      ctx.moveTo(-w / 2 + radius, -h / 2)
      ctx.lineTo(w / 2 - radius, -h / 2)
      ctx.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + radius)
      ctx.lineTo(w / 2, h / 2 - radius)
      ctx.quadraticCurveTo(w / 2, h / 2, w / 2 - radius, h / 2)
      ctx.lineTo(-w / 2 + radius, h / 2)
      ctx.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - radius)
      ctx.lineTo(-w / 2, -h / 2 + radius)
      ctx.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + radius, -h / 2)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle = '#111827'
      ctx.font = `${Math.max(14, h * 0.45)}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(stazione.nome || 'Stazione', 0, 0)
      ctx.restore()
    }

    // Tavoli
    for (const tavolo of disposizione?.tavoli || []) {
      const x = (tavolo.posizione?.xPerc || 0) * width
      const y = (tavolo.posizione?.yPerc || 0) * height
      const diameter = (tavolo.dimensionePerc || 0.03) * width
      const radius = diameter / 2

      ctx.save()
      ctx.translate(x + radius, y + radius)
      ctx.rotate(((tavolo.rotazione || 0) * Math.PI) / 180)

      ctx.fillStyle = '#f9fafb'
      ctx.strokeStyle = '#6b7280'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(0, 0, radius, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle = '#111827'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = `${Math.max(11, diameter * 0.25)}px sans-serif`
      ctx.fillText(tavolo.numero || `T${tavolo.id}`, 0, -Math.max(4, diameter * 0.08))

      ctx.fillStyle = '#4b5563'
      ctx.font = `${Math.max(9, diameter * 0.16)}px sans-serif`
      ctx.fillText(`${tavolo.posti || 0}p`, 0, Math.max(8, diameter * 0.18))
      ctx.restore()
    }

    return canvas
  }

  const handleExportPng = async () => {
    try {
      const canvas = await generateCanvas()
      if (!canvas) return
      const imgData = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = imgData
      a.download = `planimetria-evento-${id}.png`
      a.click()
    } catch (error) {
      console.error('Errore export PNG:', error)
      setStatus('❌ Errore export PNG planimetria')
    }
  }

  const handleExportPdf = async () => {
    try {
      const canvas = await generateCanvas()
      if (!canvas) return
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      pdf.addImage(imgData, 'PNG', 8, 8, pageWidth - 16, pageHeight - 16, undefined, 'FAST')
      pdf.save(`planimetria-evento-${id}.pdf`)
    } catch (error) {
      console.error('Errore export PDF:', error)
      setStatus('❌ Errore export PDF planimetria')
    }
  }

  const handleStampaPlanimetria = async () => {
    try {
      const canvas = await generateCanvas()
      if (!canvas) return
      const imgData = canvas.toDataURL('image/png')
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head><title>Planimetria Evento</title></head>
            <body style="margin:0;display:flex;justify-content:center;align-items:center;background:#fff;">
              <img src="${imgData}" style="max-width:100%;height:auto;"/>
            </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.focus()
        setTimeout(() => {
          printWindow.print()
          printWindow.close()
        }, 300)
      }
    } catch (error) {
      console.error('Errore stampa planimetria:', error)
      setStatus('❌ Errore stampa planimetria')
    }
  }

  const riepilogo = calcolaRiepilogoVarianti(disposizione)
  const eventiPreferiti = eventiSimili.filter((ev) => preferitiSchemaIds.includes(Number(ev.id)))

  if (!evento) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6" data-testid="piantina-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Button 
            variant="ghost" 
            onClick={() => router.push(`/modifica-evento/${id}`)}
            className="mb-2 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Torna all'evento
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2" data-testid="piantina-title">
            <Layout className="w-7 h-7 text-amber-500" />
            Disposizione Sala
          </h1>
          <p className="text-gray-500">{evento.titolo}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportPng} data-testid="export-png-piantina-btn">
            <Image className="w-4 h-4 mr-2" />
            PNG
          </Button>
          <Button variant="outline" onClick={handleExportPdf} data-testid="export-pdf-piantina-btn">
            <FileText className="w-4 h-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" onClick={handleStampaPlanimetria} data-testid="print-piantina-btn">
            <Printer className="w-4 h-4 mr-2" />
            Stampa
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/eventi/${id}/menu`)}
            data-testid="piantina-open-menu-btn"
          >
            <UtensilsCrossed className="w-4 h-4 mr-2" />
            Menu
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-amber-500 hover:bg-amber-600"
            data-testid="save-piantina-btn"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Salvataggio...' : 'Salva'}
          </Button>
        </div>
      </div>

      {/* Status */}
      {status && (
        <div className={`px-4 py-2 rounded-lg text-sm ${
          status.includes('✅') ? 'bg-green-50 text-green-700' : status.includes('🔒') ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
        }`} data-testid="status-message">
          {status}
        </div>
      )}

      {infoBlocco && (
        <BannerBlocco
          infoBlocco={infoBlocco}
          onOverrideSuccess={() => setStatus('🔓 Override attivato. Ora puoi salvare la planimetria.')}
        />
      )}

      {/* Riepilogo varianti */}
      {riepilogo.tavoliConVarianti > 0 && (
        <Card className="bg-blue-50 border-blue-200" data-testid="riepilogo-varianti">
          <CardContent className="p-4">
            <h3 className="font-semibold text-blue-900 mb-2">📊 Riepilogo Varianti</h3>
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="text-blue-800">
                {riepilogo.tavoliConVarianti} tavoli con varianti
              </span>
              {Object.entries(riepilogo.perVariante).map(([variantId, count]) => {
                const variante = VARIANTI_DEFAULT[variantId as VariantId]
                if (!variante || !count) return null
                return (
                  <span 
                    key={variantId}
                    className="px-2 py-1 rounded-full text-white text-xs font-medium"
                    style={{ backgroundColor: variante.colore }}
                  >
                    {variante.nomeStampa}: {count}
                  </span>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Istruzioni */}
      <Card className="bg-gray-50">
        <CardContent className="p-4 flex items-center gap-3">
          <Info className="w-5 h-5 text-gray-500" />
          <p className="text-sm text-gray-600">
            <strong>Tip:</strong> Seleziona un tavolo per rinominarlo, impostare i posti (es. Giglio 5, Orchidea 7) e ridimensionarlo.
          </p>
        </CardContent>
      </Card>

      <Card data-testid="copia-schema-card">
        <CardHeader>
          <CardTitle className="text-base">Copia schema da evento simile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-600" data-testid="schema-preferiti-label">
            Visualizzazione attiva: <strong>solo Schemi Preferiti</strong>
          </p>

          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
          <select
            className="w-full md:max-w-lg border rounded-lg px-3 py-2 text-sm"
            value={schemaDaCopiareId}
            onChange={(e) => setSchemaDaCopiareId(e.target.value)}
            data-testid="copia-schema-select"
          >
            <option value="">-- Seleziona evento di riferimento --</option>
            {eventiPreferiti.map((ev) => (
              <option key={ev.id} value={String(ev.id)}>
                {preferitiSchemaIds.includes(Number(ev.id)) ? '★ ' : ''}#{ev.id} · {ev.titolo} · {ev.tipo} · {ev.personePreviste || 0} invitati
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            onClick={() => schemaDaCopiareId && togglePreferitoSchema(Number(schemaDaCopiareId))}
            disabled={!schemaDaCopiareId}
            data-testid="remove-schema-preferito-btn"
          >
            Rimuovi Preferito
          </Button>
          <Button
            variant="outline"
            onClick={handleCopiaSchema}
            disabled={!schemaDaCopiareId}
            data-testid="copia-schema-btn"
          >
            Copia schema
          </Button>
          </div>

          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center pt-2 border-t">
            <select
              className="w-full md:max-w-lg border rounded-lg px-3 py-2 text-sm"
              value={schemaDaPreferireId}
              onChange={(e) => setSchemaDaPreferireId(e.target.value)}
              data-testid="aggiungi-preferito-select"
            >
              <option value="">-- Aggiungi evento ai preferiti --</option>
              {eventiSimili.map((ev) => (
                <option key={ev.id} value={String(ev.id)}>
                  #{ev.id} · {ev.titolo} · {ev.tipo} · {ev.personePreviste || 0} invitati
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              onClick={() => schemaDaPreferireId && addPreferitoSchema(Number(schemaDaPreferireId))}
              disabled={!schemaDaPreferireId || preferitiSchemaIds.includes(Number(schemaDaPreferireId))}
              data-testid="add-schema-preferito-btn"
            >
              {preferitiSchemaIds.includes(Number(schemaDaPreferireId)) ? 'Già preferito' : 'Aggiungi Preferito'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Piantina */}
      <Card>
        <CardContent className="p-4">
          <VillaPiantinaDnDWrapper>
            <VillaPiantina
              disposizione={disposizione}
              onChange={aggiornaDisposizione}
              editabile={true}
              stampaRef={stampaRef}
              onStampa={handleStampaPlanimetria}
              planimetrie={planimetrie}
              onNuovaPlanimetria={handleUploadPlanimetriaGlobale}
              onCambiaPlanimetria={(url) => setDisposizione((prev) => ({ ...prev, immagine: url }))}
              onDeletePlanimetria={handleDeletePlanimetriaGlobale}
              variantiAttive={variantiAttive}
            />
          </VillaPiantinaDnDWrapper>
        </CardContent>
      </Card>
    </div>
  )
}
