'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import VillaPiantina from '@/components/VillaPiantina'
import VillaPiantinaDnDWrapper from '@/components/VillaPiantinaDnDWrapper'
import { type VariantId, calcolaRiepilogoVarianti, VARIANTI_DEFAULT } from '@/lib/types'
import BannerBlocco, { getOverrideHeaders } from '@/components/BannerBlocco'
import html2canvas from 'html2canvas'
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
  const router = useRouter()
  const [evento, setEvento] = useState<any>(null)
  const [infoBlocco, setInfoBlocco] = useState<any>(null)
  const [disposizione, setDisposizione] = useState<{ tavoli: any[], stazioni: any[], immagine?: string }>({ tavoli: [], stazioni: [], immagine: undefined })
  const [variantiAttive, setVariantiAttive] = useState<VariantId[]>([])
  const [status, setStatus] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const stampaRef = useRef<HTMLDivElement>(null)

  const aggiornaDisposizione = useCallback((nuova: any) => {
    setDisposizione(JSON.parse(JSON.stringify(nuova)))
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

        const disposizioneRaw = typeof data.disposizioneSala === 'string'
          ? (() => {
              try { return JSON.parse(data.disposizioneSala || '{}') } catch { return {} }
            })()
          : data.disposizioneSala
        
        if (disposizioneRaw && typeof disposizioneRaw === 'object') {
          setDisposizione({
            tavoli: Array.isArray(disposizioneRaw.tavoli) ? disposizioneRaw.tavoli : [],
            stazioni: Array.isArray(disposizioneRaw.stazioni) ? disposizioneRaw.stazioni : [],
            immagine: disposizioneRaw.immagine ?? undefined
          })
        } else {
          setDisposizione({ tavoli: [], stazioni: [], immagine: undefined })
        }
      } catch (error) {
        console.error('Errore nel caricamento evento:', error)
      }
    }
    fetchEvento()
  }, [id])

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
    if (!stampaRef.current) return null
    return html2canvas(stampaRef.current, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true
    })
  }

  const handleExportPng = async () => {
    const canvas = await generateCanvas()
    if (!canvas) return
    const imgData = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = imgData
    a.download = `planimetria-evento-${id}.png`
    a.click()
  }

  const handleExportPdf = async () => {
    const canvas = await generateCanvas()
    if (!canvas) return
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    pdf.addImage(imgData, 'PNG', 8, 8, pageWidth - 16, pageHeight - 16, undefined, 'FAST')
    pdf.save(`planimetria-evento-${id}.pdf`)
  }

  const handleStampaPlanimetria = async () => {
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
  }

  const riepilogo = calcolaRiepilogoVarianti(disposizione)

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
          status.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
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
            <strong>Tip:</strong> Seleziona un tavolo e clicca 🍽️ oppure fai <strong>doppio click</strong> per gestire le varianti alimentari
          </p>
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
              variantiAttive={variantiAttive}
            />
          </VillaPiantinaDnDWrapper>
        </CardContent>
      </Card>
    </div>
  )
}
