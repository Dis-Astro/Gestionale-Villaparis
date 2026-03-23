'use client'

import { useEffect, useState } from 'react'
import {
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  TrendingUp,
  Users,
  Euro,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Image
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'
import { downloadEventReportPdf, EventReportFilters, filterHistoricEvents } from '@/lib/report/eventi-pdf'

interface MonthlyData {
  mese: string
  meseFull: string
  eventi: number
  ospiti: number
  ricavi: number
  ticketMedio: number
}

interface TipoData {
  tipo: string
  count: number
  ricavi: number
}

interface ReportStats {
  year: number
  monthly: MonthlyData[]
  byTipo: TipoData[]
  totals: {
    eventiTotali: number
    ospitiTotali: number
    ricaviTotali: number
    ticketMedio: number
  }
}

const COLORS = ['#1E3A5F', '#D4AF37', '#22C55E', '#3B82F6', '#A855F7', '#EF4444', '#F59E0B', '#14B8A6']

export default function ReportEventiPage() {
  const [stats, setStats] = useState<ReportStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloadingExcel, setDownloadingExcel] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [year, setYear] = useState(new Date().getFullYear())
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [tipoFilter, setTipoFilter] = useState('')
  const [luogoFilter, setLuogoFilter] = useState('')
  const [downloadError, setDownloadError] = useState('')

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/report/eventi/stats?year=${year}`)
        if (res.ok) {
          setStats(await res.json())
        }
      } catch (error) {
        console.error('Error fetching event report stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [year])

  const handleDownloadExcel = async () => {
    setDownloadingExcel(true)
    setDownloadError('')
    try {
      const params = new URLSearchParams()
      if (dateFrom) params.append('from', dateFrom)
      if (dateTo) params.append('to', dateTo)
      if (tipoFilter) params.append('tipo', tipoFilter)
      if (luogoFilter) params.append('luogo', luogoFilter)

      const res = await fetch(`/api/report/eventi.xlsx?${params.toString()}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || body.detail || `Errore ${res.status}`)
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `VillaParis_Report_Eventi_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(link)
      link.click()
      window.URL.revokeObjectURL(url)
      link.remove()
    } catch (error) {
      setDownloadError(`Errore export eventi: ${error}`)
    } finally {
      setDownloadingExcel(false)
    }
  }

  const handleDownloadPdf = async () => {
    if (!stats) return
    setDownloadingPdf(true)
    setDownloadError('')
    try {
      const res = await fetch('/api/eventi')
      if (!res.ok) {
        throw new Error(`Errore ${res.status}`)
      }
      const eventi = await res.json()
      const filters: EventReportFilters = {
        year,
        dateFrom,
        dateTo,
        tipoFilter,
        luogoFilter
      }
      const filteredEvents = filterHistoricEvents(eventi, filters)
      downloadEventReportPdf(stats, filteredEvents, filters)
    } catch (error) {
      setDownloadError(`Errore export PDF eventi: ${error}`)
    } finally {
      setDownloadingPdf(false)
    }
  }

  const handleExportChartPNG = async (chartId: string) => {
    const chartElement = document.getElementById(chartId)
    if (!chartElement) return
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(chartElement, { backgroundColor: '#ffffff' })
      const url = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = url
      link.download = `${chartId}_${new Date().toISOString().split('T')[0]}.png`
      link.click()
    } catch (error) {
      console.error('Error exporting event chart:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="report-eventi-loading-state">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6" data-testid="report-eventi-page">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" data-testid="report-eventi-title">Report Eventi</h1>
          <p className="text-gray-500" data-testid="report-eventi-description">Storico eventi, anagrafiche clienti collegate, dettagli evento ed export storico.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleDownloadExcel}
            disabled={downloadingExcel}
            className="bg-green-600 hover:bg-green-700"
            data-testid="report-eventi-download-excel-button"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            {downloadingExcel ? 'Download Excel...' : 'Scarica Excel'}
          </Button>
          <Button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf || !stats}
            className="bg-slate-900 hover:bg-slate-800"
            data-testid="report-eventi-download-pdf-button"
          >
            <FileText className="w-4 h-4 mr-2" />
            {downloadingPdf ? 'Export PDF...' : 'Scarica PDF'}
          </Button>
        </div>
      </div>

      {downloadError && (
        <div className="mt-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm" data-testid="report-eventi-download-error">
          {downloadError}
        </div>
      )}

      <Card data-testid="report-eventi-filters-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="w-5 h-5" />
            Filtri storico eventi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Anno</label>
              <select value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="w-full px-3 py-2 border rounded-lg" data-testid="report-eventi-year-select">
                {[2024, 2025, 2026, 2027].map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data da</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full px-3 py-2 border rounded-lg" data-testid="report-eventi-date-from-input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data a</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full px-3 py-2 border rounded-lg" data-testid="report-eventi-date-to-input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo evento</label>
              <select value={tipoFilter} onChange={(e) => setTipoFilter(e.target.value)} className="w-full px-3 py-2 border rounded-lg" data-testid="report-eventi-type-select">
                <option value="">Tutti</option>
                <option value="matrimonio">Matrimonio</option>
                <option value="battesimo">Battesimo</option>
                <option value="comunione">Comunione</option>
                <option value="cresima">Cresima</option>
                <option value="compleanno">Compleanno</option>
                <option value="aziendale">Aziendale</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Luogo</label>
              <input type="text" value={luogoFilter} onChange={(e) => setLuogoFilter(e.target.value)} placeholder="Es: Villa Paris" className="w-full px-3 py-2 border rounded-lg" data-testid="report-eventi-location-input" />
            </div>
          </div>
        </CardContent>
      </Card>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card data-testid="report-eventi-kpi-total-events"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Eventi Totali</p><p className="text-3xl font-bold">{stats.totals.eventiTotali}</p></div><Calendar className="w-10 h-10 text-blue-500" /></div></CardContent></Card>
          <Card data-testid="report-eventi-kpi-total-guests"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Ospiti Totali</p><p className="text-3xl font-bold">{stats.totals.ospitiTotali.toLocaleString()}</p></div><Users className="w-10 h-10 text-green-500" /></div></CardContent></Card>
          <Card data-testid="report-eventi-kpi-total-revenue"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Ricavi Totali</p><p className="text-3xl font-bold">€{stats.totals.ricaviTotali.toLocaleString()}</p></div><Euro className="w-10 h-10 text-amber-500" /></div></CardContent></Card>
          <Card data-testid="report-eventi-kpi-ticket"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Ticket Medio</p><p className="text-3xl font-bold">€{stats.totals.ticketMedio}</p></div><TrendingUp className="w-10 h-10 text-purple-500" /></div></CardContent></Card>
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card data-testid="report-eventi-chart-revenue-card">
            <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-amber-500" />Ricavi per Mese</CardTitle><Button variant="ghost" size="sm" onClick={() => handleExportChartPNG('chart-ricavi-eventi')} data-testid="report-eventi-export-chart-revenue"><Image className="w-4 h-4" /></Button></CardHeader>
            <CardContent><div id="chart-ricavi-eventi" className="h-72"><ResponsiveContainer width="99%" height={280} debounce={100}><BarChart data={stats.monthly}><CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" /><XAxis dataKey="mese" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `€${Number(value) / 1000}k`} /><Tooltip formatter={(value) => [`€${Number(value).toLocaleString()}`, 'Ricavi']} labelFormatter={(label) => `Mese: ${label}`} /><Bar dataKey="ricavi" fill="#D4AF37" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></CardContent>
          </Card>
          <Card data-testid="report-eventi-chart-events-card">
            <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-blue-500" />Eventi per Mese</CardTitle><Button variant="ghost" size="sm" onClick={() => handleExportChartPNG('chart-eventi-storici')} data-testid="report-eventi-export-chart-events"><Image className="w-4 h-4" /></Button></CardHeader>
            <CardContent><div id="chart-eventi-storici" className="h-72"><ResponsiveContainer width="99%" height={280} debounce={100}><LineChart data={stats.monthly}><CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" /><XAxis dataKey="mese" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip /><Line type="monotone" dataKey="eventi" stroke="#3B82F6" strokeWidth={3} dot={{ fill: '#3B82F6', strokeWidth: 2 }} /></LineChart></ResponsiveContainer></div></CardContent>
          </Card>
          <Card data-testid="report-eventi-chart-guests-card">
            <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-green-500" />Ospiti per Mese</CardTitle><Button variant="ghost" size="sm" onClick={() => handleExportChartPNG('chart-ospiti-eventi')} data-testid="report-eventi-export-chart-guests"><Image className="w-4 h-4" /></Button></CardHeader>
            <CardContent><div id="chart-ospiti-eventi" className="h-72"><ResponsiveContainer width="99%" height={280} debounce={100}><BarChart data={stats.monthly}><CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" /><XAxis dataKey="mese" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip formatter={(value) => [Number(value).toLocaleString(), 'Ospiti']} /><Bar dataKey="ospiti" fill="#22C55E" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></CardContent>
          </Card>
          <Card data-testid="report-eventi-chart-types-card">
            <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="flex items-center gap-2"><PieChartIcon className="w-5 h-5 text-purple-500" />Eventi per Tipo</CardTitle><Button variant="ghost" size="sm" onClick={() => handleExportChartPNG('chart-tipo-eventi')} data-testid="report-eventi-export-chart-types"><Image className="w-4 h-4" /></Button></CardHeader>
            <CardContent><div id="chart-tipo-eventi" className="h-72"><ResponsiveContainer width="99%" height={280} debounce={100}><PieChart><Pie data={stats.byTipo} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`} outerRadius={80} fill="#8884d8" dataKey="count" nameKey="tipo">{stats.byTipo.map((entry, index) => <Cell key={`cell-${entry.tipo}-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip formatter={(value) => [value, 'Eventi']} /><Legend /></PieChart></ResponsiveContainer></div></CardContent>
          </Card>
        </div>
      )}

      <Card data-testid="report-eventi-preview-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Anteprima dati eventi</CardTitle>
          <Button variant="outline" onClick={handleDownloadExcel} disabled={downloadingExcel} data-testid="report-eventi-preview-download-button">
            <Download className="w-4 h-4 mr-2" />Download Excel
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="report-eventi-preview-table">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="px-4 py-3 text-left">Mese</th>
                  <th className="px-4 py-3 text-left">Eventi</th>
                  <th className="px-4 py-3 text-right">Ospiti</th>
                  <th className="px-4 py-3 text-right">Ricavi</th>
                  <th className="px-4 py-3 text-right">Ticket Medio</th>
                </tr>
              </thead>
              <tbody>
                {stats?.monthly.map((month, index) => (
                  <tr key={month.mese} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                    <td className="px-4 py-3 font-medium">{month.meseFull}</td>
                    <td className="px-4 py-3">{month.eventi}</td>
                    <td className="px-4 py-3 text-right">{month.ospiti.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">€{month.ricavi.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">€{month.ticketMedio}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-amber-100 font-bold">
                  <td className="px-4 py-3">TOTALE</td>
                  <td className="px-4 py-3">{stats?.totals.eventiTotali}</td>
                  <td className="px-4 py-3 text-right">{stats?.totals.ospitiTotali.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">€{stats?.totals.ricaviTotali.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">€{stats?.totals.ticketMedio}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}