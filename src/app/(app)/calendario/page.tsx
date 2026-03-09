'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import interactionPlugin from "@fullcalendar/interaction"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Calendar, Plus, Edit, Trash2, CalendarOff,
  UserPlus, X, Phone, Mail, Clock, Users
} from "lucide-react"

// ──────────────────────────────────────────────────
// SCHEMA COLORI CALENDARIO
// ──────────────────────────────────────────────────
const COLORI = {
  registrazione:  { bg: '#92400E', text: 'bg-amber-900',  label: 'Registrazione 1° contatto' },
  opzionato:      { bg: '#F59E0B', text: 'bg-amber-400',   label: 'Data opzionata'             },
  confermato:     { bg: '#10B981', text: 'bg-emerald-500', label: 'Confermato'                 },
  appuntamento:   { bg: '#8B5CF6', text: 'bg-violet-500',  label: 'Appuntamento'               },
  matrimonio:     { bg: '#3B82F6', text: 'bg-blue-500',    label: 'Matrimonio'                 },
  battesimo:      { bg: '#EC4899', text: 'bg-pink-500',    label: 'Battesimo'                  },
  compleanno:     { bg: '#F97316', text: 'bg-orange-500',  label: 'Compleanno'                 },
  comunione:      { bg: '#06B6D4', text: 'bg-cyan-500',    label: 'Comunione'                  },
  cresima:        { bg: '#6366F1', text: 'bg-indigo-500',  label: 'Cresima'                    },
  aziendale:      { bg: '#64748B', text: 'bg-slate-500',   label: 'Aziendale'                  },
  altro:          { bg: '#6B7280', text: 'bg-gray-500',    label: 'Altro'                      },
}

function colorePerTipo(tipo: string, ruolo: 'confermato' | 'opzionato' | 'registrazione' | 'appuntamento'): string {
  if (ruolo === 'registrazione') return COLORI.registrazione.bg
  if (ruolo === 'opzionato')     return COLORI.opzionato.bg
  if (ruolo === 'appuntamento')  return COLORI.appuntamento.bg
  const t = tipo.toLowerCase()
  if (t.includes('matrimon'))   return COLORI.matrimonio.bg
  if (t.includes('battesim'))   return COLORI.battesimo.bg
  if (t.includes('complea'))    return COLORI.compleanno.bg
  if (t.includes('comuni'))     return COLORI.comunione.bg
  if (t.includes('cresim'))     return COLORI.cresima.bg
  if (t.includes('aziendale'))  return COLORI.aziendale.bg
  return COLORI.confermato.bg
}

export default function CalendarioPage() {
  const router = useRouter()
  const [dataSelezionata, setDataSelezionata] = useState("")
  const [eventi, setEventi] = useState<any[]>([])
  const [eventiDelGiorno, setEventiDelGiorno] = useState<any[]>([])
  const [calendarKey, setCalendarKey] = useState(0)
  const [dateNascoste, setDateNascoste] = useState<string[]>([])

  // Modal appuntamento rapido
  const [showAppuntamento, setShowAppuntamento] = useState(false)
  const [appuntamento, setAppuntamento] = useState({
    nome: '', telefono: '', email: '', ora: '10:00', note: ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const [status, setStatus] = useState('')

  // Statistiche
  const appuntamentiMese = eventi.filter(e => {
    if (e.tipo !== 'Appuntamento') return false
    const d = e.dataConfermata || e.dateProposte?.[0]
    if (!d) return false
    const dt = new Date(d); const now = new Date()
    return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear()
  }).length
  const appuntamentiAnno = eventi.filter(e => e.tipo === 'Appuntamento').length

  const fetchEventi = () => {
    fetch("/api/eventi")
      .then(r => r.json())
      .then(data => {
        const parsed = data.map((ev: any) => ({
          ...ev,
          dataConfermata: ev.dataConfermata?.split("T")[0] || null,
          dataPrimoContatto: ev.dataPrimoContatto?.split("T")[0] || null,
          dateProposte: Array.isArray(ev.dateProposte)
            ? ev.dateProposte
            : (typeof ev.dateProposte === 'string' ? JSON.parse(ev.dateProposte || '[]') : [])
        }))
        setEventi(parsed)
      })
      .catch(() => {})
  }

  useEffect(() => { fetchEventi() }, [calendarKey])

  const handleDateClick = (arg: any) => {
    const data = arg.dateStr
    setDataSelezionata(data)
    filtraEventiPerData(data, eventi)
    setShowAppuntamento(true)
    setAppuntamento({ nome: '', telefono: '', email: '', ora: '10:00', note: '' })
    setStatus('')
  }

  const filtraEventiPerData = (data: string, evs: any[]) => {
    const res = evs.filter(e =>
      e.dataConfermata === data ||
      e.dataPrimoContatto === data ||
      (Array.isArray(e.dateProposte) && e.dateProposte.includes(data))
    )
    setEventiDelGiorno(res)
  }

  // ──────────────────────────────────────────────────
  // Costruzione eventi FullCalendar con colori distinti
  // ──────────────────────────────────────────────────
  const eventiCalendario = eventi.flatMap((ev) => {
    if (ev.stato === 'annullato') return []
    const result: any[] = []

    // 1. Data primo contatto → "Registrazione"
    if (ev.dataPrimoContatto && !dateNascoste.includes(ev.dataPrimoContatto)) {
      result.push({
        title: `\u{1F4CB} ${ev.titolo}`,
        date: ev.dataPrimoContatto,
        color: COLORI.registrazione.bg,
        extendedProps: { eventoId: ev.id, ruolo: 'registrazione' },
        classNames: ['fc-event-reg']
      })
    }

    // 2. Date opzionate
    if (Array.isArray(ev.dateProposte)) {
      ev.dateProposte
        .filter((d: string) => d !== ev.dataConfermata && !dateNascoste.includes(d))
        .forEach((d: string) => {
          result.push({
            title: ev.titolo,
            date: d,
            color: COLORI.opzionato.bg,
            extendedProps: { eventoId: ev.id, ruolo: 'opzionato' },
            classNames: ['opacity-80']
          })
        })
    }

    // 3. Data confermata (o appuntamento)
    if (ev.dataConfermata && !dateNascoste.includes(ev.dataConfermata)) {
      const ruolo = ev.tipo === 'Appuntamento' ? 'appuntamento' : 'confermato'
      const prefix = ev.tipo === 'Appuntamento' ? '\u{260E} ' : ''
      result.push({
        title: `${prefix}${ev.titolo}`,
        date: ev.dataConfermata,
        color: colorePerTipo(ev.tipo, ruolo),
        extendedProps: { eventoId: ev.id, ruolo }
      })
    }

    return result
  })

  const annullaEvento = async (id: number) => {
    if (!confirm('Annullare questo evento?')) return
    await fetch(`/api/eventi?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stato: 'annullato' })
    })
    setCalendarKey(k => k + 1)
  }

  const salvaAppuntamento = async () => {
    if (!appuntamento.nome.trim()) { setStatus('Inserisci il nome del cliente'); return }
    setIsSaving(true); setStatus('Salvataggio...')
    try {
      const res = await fetch('/api/eventi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'Appuntamento',
          titolo: `Appuntamento - ${appuntamento.nome}`,
          dateProposte: [dataSelezionata],
          dataConfermata: dataSelezionata,
          dataPrimoContatto: dataSelezionata,
          fascia: 'pranzo',
          stato: 'confermato',
          note: `Ora: ${appuntamento.ora}\nTelefono: ${appuntamento.telefono}\n${appuntamento.note}`,
          clienti: [{
            nome: appuntamento.nome,
            email: appuntamento.email || `${appuntamento.nome.toLowerCase().replace(/\s+/g, '.')}@appuntamento.local`,
            telefono: appuntamento.telefono
          }]
        })
      })
      if (res.ok) {
        setStatus('Appuntamento salvato!')
        setTimeout(() => { setShowAppuntamento(false); setCalendarKey(k => k + 1) }, 900)
      } else {
        setStatus(`Errore: ${await res.text()}`)
      }
    } catch { setStatus('Errore di connessione') }
    finally { setIsSaving(false) }
  }

  const statoLabel = (stato: string) => {
    switch (stato) {
      case 'confermato': return { text: 'Confermato', cls: 'bg-green-100 text-green-700' }
      case 'annullato':  return { text: 'Annullato',  cls: 'bg-red-100 text-red-700'   }
      default:           return { text: 'In attesa',  cls: 'bg-amber-100 text-amber-700'}
    }
  }

  return (
    <div className="space-y-6" data-testid="calendario-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-7 h-7 text-amber-500" />
            Calendario Eventi
          </h1>
          <p className="text-gray-500">Clicca su una data per creare un appuntamento</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="hidden sm:flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-100 rounded-full">
              <Phone className="w-3.5 h-3.5 text-violet-600" />
              <span className="text-violet-700 font-medium">{appuntamentiMese} questo mese</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full">
              <Users className="w-3.5 h-3.5 text-gray-600" />
              <span className="text-gray-700 font-medium">{appuntamentiAnno} anno</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Vai a:</label>
            <input
              type="date"
              className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500"
              value={dataSelezionata}
              onChange={e => {
                setDataSelezionata(e.target.value)
                setCalendarKey(k => k + 1)
                filtraEventiPerData(e.target.value, eventi)
              }}
            />
          </div>
          <Button
            onClick={() => router.push('/nuovo-evento')}
            className="bg-amber-500 hover:bg-amber-600"
            data-testid="nuovo-evento-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuovo Evento
          </Button>
        </div>
      </div>

      {/* Calendario */}
      <Card>
        <CardContent className="p-4">
          <FullCalendar
            key={calendarKey}
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            initialDate={dataSelezionata || undefined}
            dateClick={handleDateClick}
            locale="it"
            height="auto"
            events={eventiCalendario}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,dayGridWeek'
            }}
            buttonText={{ today: 'Oggi', month: 'Mese', week: 'Settimana' }}
          />
        </CardContent>
      </Card>

      {/* Modal Appuntamento Rapido */}
      {showAppuntamento && dataSelezionata && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md" data-testid="modal-appuntamento">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-violet-500" />
                Nuovo Appuntamento
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowAppuntamento(false)}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-violet-50 p-3 rounded-lg text-center">
                <p className="text-violet-700 font-medium">
                  {new Date(dataSelezionata + 'T12:00:00').toLocaleDateString('it-IT', {
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Cliente *</label>
                <Input
                  value={appuntamento.nome}
                  onChange={e => setAppuntamento({ ...appuntamento, nome: e.target.value })}
                  placeholder="Mario Rossi"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Phone className="w-3.5 h-3.5 inline mr-1" />Telefono
                  </label>
                  <Input
                    value={appuntamento.telefono}
                    onChange={e => setAppuntamento({ ...appuntamento, telefono: e.target.value })}
                    placeholder="333 1234567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Clock className="w-3.5 h-3.5 inline mr-1" />Ora
                  </label>
                  <Input
                    type="time"
                    value={appuntamento.ora}
                    onChange={e => setAppuntamento({ ...appuntamento, ora: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Mail className="w-3.5 h-3.5 inline mr-1" />Email (opzionale)
                </label>
                <Input
                  type="email"
                  value={appuntamento.email}
                  onChange={e => setAppuntamento({ ...appuntamento, email: e.target.value })}
                  placeholder="mario@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                <Input
                  value={appuntamento.note}
                  onChange={e => setAppuntamento({ ...appuntamento, note: e.target.value })}
                  placeholder="Tipo evento, preferenze..."
                />
              </div>

              {status && (
                <div className={`px-4 py-2 rounded-lg text-sm ${
                  status.includes('salvato') ? 'bg-green-50 text-green-700' :
                  status.includes('Errore') ? 'bg-red-50 text-red-700' :
                  'bg-blue-50 text-blue-700'
                }`}>
                  {status}
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowAppuntamento(false)}>
                  Annulla
                </Button>
                <Button
                  onClick={salvaAppuntamento}
                  disabled={isSaving}
                  className="flex-1 bg-violet-500 hover:bg-violet-600"
                  data-testid="salva-appuntamento-btn"
                >
                  {isSaving ? 'Salvataggio...' : 'Conferma'}
                </Button>
              </div>

              <div className="text-center">
                <Button
                  variant="link" size="sm"
                  onClick={() => { setShowAppuntamento(false); router.push(`/nuovo-evento?data=${dataSelezionata}`) }}
                >
                  Oppure crea un evento completo →
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Eventi del giorno */}
      {dataSelezionata && eventiDelGiorno.length > 0 && !showAppuntamento && (
        <Card data-testid="eventi-giorno">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-500" />
              {new Date(dataSelezionata + 'T12:00:00').toLocaleDateString('it-IT', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
              })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {eventiDelGiorno.map(e => {
                const info = statoLabel(e.stato)
                const isReg = e.dataPrimoContatto === dataSelezionata && e.dataConfermata !== dataSelezionata
                const isOp  = Array.isArray(e.dateProposte) && e.dateProposte.includes(dataSelezionata) && e.dataConfermata !== dataSelezionata
                const ruolo = isReg ? 'registrazione' : isOp ? 'opzionato' : e.tipo === 'Appuntamento' ? 'appuntamento' : 'confermato'
                const dot   = colorePerTipo(e.tipo, ruolo)
                return (
                  <div key={`${e.id}-${ruolo}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: dot }} />
                      <div>
                        <p className="font-medium text-sm text-gray-900">
                          {e.tipo === 'Appuntamento' ? '📞 ' : isReg ? '📋 ' : ''}{e.titolo}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-500">{e.tipo}</span>
                          {isReg && <span className="text-xs bg-amber-900/10 text-amber-800 px-1.5 py-0.5 rounded">1° contatto</span>}
                          {isOp  && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">opzionato</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${info.cls}`}>{info.text}</span>
                      <Button variant="ghost" size="sm" onClick={() => router.push(`/modifica-evento/${e.id}`)}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600"
                        onClick={() => annullaEvento(e.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legenda */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Legenda Calendario</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {Object.entries(COLORI).map(([key, val]) => (
              <div key={key} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: val.bg }} />
                <span className="text-xs text-gray-600">{val.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
