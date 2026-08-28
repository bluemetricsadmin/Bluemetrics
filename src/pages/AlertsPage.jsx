import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { updateAlertStatus } from '../utils/wellAlertSync'
import { DashboardHeader } from "../components/dashboard-header"
import { DashboardSidebar } from "../components/dashboard-sidebar"
import { Card, CardContent } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { 
  AlertTriangle, 
  CheckCircle, 
  Bell, 
  Clock, 
  Activity,
  Search,
  Droplets,
  ShieldAlert,
  Loader2,
  RefreshCw,
  Waves
} from "lucide-react"

const ANOMALY_EVENT_TYPE = 'anomalia_sobreconsumo'

// Convierte columna técnica → etiqueta legible
// ej: "l_ciap_andatti" → "Ciap Andatti", "megacentral" → "Megacentral"
function formatMeterLabel(col) {
  if (!col) return null
  return col
    .replace(/^l_/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

function getGranularityLabel(granularity) {
  switch (granularity) {
    case 'daily': return 'Diaria'
    case 'weekly': return 'Semanal'
    case 'monthly': return 'Mensual'
    default: return null
  }
}

function formatPeriod(evt) {
  if (evt.alert_granularity === 'daily' && evt.alert_date) {
    return new Date(evt.alert_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
  }
  if (evt.alert_granularity === 'weekly' && evt.alert_week) {
    return `Semana ${evt.alert_week}/${evt.alert_year}`
  }
  if (evt.alert_granularity === 'monthly' && evt.alert_month) {
    return `${new Date(evt.alert_year, evt.alert_month - 1, 1).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}`
  }
  return evt.title
}

function getStatusBadge(status) {
  switch (status) {
    case 'activo': return { label: 'Activa', variant: 'destructive' }
    case 'completado': return { label: 'Atendida', variant: 'default' }
    case 'cancelado': return { label: 'Descartada', variant: 'secondary' }
    default: return { label: status, variant: 'outline' }
  }
}

function timeAgo(dateStr) {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now - date
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Ahora mismo'
  if (diffMin < 60) return `Hace ${diffMin} min`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `Hace ${diffHours}h`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `Hace ${diffDays}d`
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterGranularity, setFilterGranularity] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")

  // Fetch inicial de alertas desde Supabase
  const fetchAlerts = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('well_events')
      .select('*')
      .eq('event_type', ANOMALY_EVENT_TYPE)
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) {
      console.error('Error cargando alertas:', error)
    } else {
      setAlerts(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchAlerts()
  }, [])

  // Suscripción Realtime a well_events
  useEffect(() => {
    const channel = supabase
      .channel('alerts-page-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'well_events' },
        (payload) => {
          console.log('🔔 AlertsPage Realtime:', payload.eventType, payload)

          if (payload.eventType === 'INSERT') {
            const newEvent = payload.new
            if (newEvent.event_type === ANOMALY_EVENT_TYPE) {
              setAlerts(prev => [newEvent, ...prev])
            }
          }

          if (payload.eventType === 'UPDATE') {
            setAlerts(prev => prev.map(a => a.id === payload.new.id ? payload.new : a))
          }

          if (payload.eventType === 'DELETE') {
            setAlerts(prev => prev.filter(a => a.id !== payload.old.id))
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 AlertsPage Realtime status:', status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Acciones sobre alertas
  const handleStatusChange = async (alertId, newStatus) => {
    setActionLoading(alertId)
    const success = await updateAlertStatus(alertId, newStatus)
    if (!success) {
      alert('Error al actualizar la alerta')
    }
    setActionLoading(null)
  }

  // Filtrado
  const filteredAlerts = alerts.filter(a => {
    const matchesSearch = !searchTerm || 
      a.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.meter_column && formatMeterLabel(a.meter_column).toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesGranularity = filterGranularity === "all" || a.alert_granularity === filterGranularity
    const matchesStatus = filterStatus === "all" || a.event_status === filterStatus

    return matchesSearch && matchesGranularity && matchesStatus
  })

  // Estadísticas
  const stats = {
    total: alerts.length,
    active: alerts.filter(a => a.event_status === 'activo').length,
    resolved: alerts.filter(a => a.event_status === 'completado').length,
    discarded: alerts.filter(a => a.event_status === 'cancelado').length
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      
      <div className="ml-64">
        <DashboardHeader />
        <main className="p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Centro de Alertas</h1>
                <p className="text-muted-foreground">
                  Anomalías de sobreconsumo detectadas automáticamente
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={fetchAlerts} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Bell className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{stats.total}</div>
                      <div className="text-sm text-muted-foreground">Total Alertas</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Activity className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{stats.active}</div>
                      <div className="text-sm text-muted-foreground">Activas</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{stats.resolved}</div>
                      <div className="text-sm text-muted-foreground">Atendidas</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{stats.discarded}</div>
                      <div className="text-sm text-muted-foreground">Descartadas</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filtros y búsqueda */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-64">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Buscar por título, descripción o medidor..."
                        className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <select 
                    className="px-3 py-2 border border-border rounded-md bg-background"
                    value={filterGranularity}
                    onChange={(e) => setFilterGranularity(e.target.value)}
                  >
                    <option value="all">Toda periodicidad</option>
                    <option value="daily">Diarias</option>
                    <option value="weekly">Semanales</option>
                    <option value="monthly">Mensuales</option>
                  </select>

                  <select 
                    className="px-3 py-2 border border-border rounded-md bg-background"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="all">Todo estado</option>
                    <option value="activo">Activas</option>
                    <option value="completado">Atendidas</option>
                    <option value="cancelado">Descartadas</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              <span className="ml-3 text-muted-foreground">Cargando alertas...</span>
            </div>
          )}

          {/* Lista de alertas */}
          {!loading && (
            <div className="grid gap-4">
              {filteredAlerts.map((evt) => {
                const statusBadge = getStatusBadge(evt.event_status)
                const isLoadingAction = actionLoading === evt.id
                const granularityLabel = getGranularityLabel(evt.alert_granularity)
                const meterLabel = formatMeterLabel(evt.meter_column) || 'Medidor desconocido'

                return (
                  <Card key={evt.id} className="border border-cyan-200">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="flex-shrink-0 mt-1 text-cyan-700">
                            <Waves className="w-5 h-5" />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="font-semibold text-base">{evt.title}</h3>
                              {granularityLabel && (
                                <Badge className="bg-cyan-100 text-cyan-800">
                                  <ShieldAlert className="w-3 h-3 mr-1" />
                                  {granularityLabel}
                                </Badge>
                              )}
                              <Badge variant={statusBadge.variant}>
                                {statusBadge.label}
                              </Badge>
                            </div>

                            <p className="text-sm text-muted-foreground mb-1">{evt.description}</p>

                            {evt.recommendation && (
                              <p className="text-xs text-muted-foreground mb-2">💡 {evt.recommendation}</p>
                            )}

                            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Droplets className="w-3 h-3" />
                                <span>{meterLabel}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{timeAgo(evt.created_at)}</span>
                              </div>
                              {evt.alert_granularity && (
                                <div className="flex items-center gap-1">
                                  <Activity className="w-3 h-3" />
                                  <span>Anomalía de sobreconsumo · {formatPeriod(evt)}</span>
                                </div>
                              )}
                              {evt.end_date && (
                                <div className="flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  <span>Cerrada: {new Date(evt.end_date).toLocaleDateString('es-MX')}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {evt.event_status === 'activo' && (
                          <div className="flex gap-2 ml-4 flex-shrink-0">
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="border-green-300 text-green-700 hover:bg-green-50"
                              disabled={isLoadingAction}
                              onClick={() => handleStatusChange(evt.id, 'completado')}
                            >
                              {isLoadingAction ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                              Atender
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="border-gray-300 text-gray-600 hover:bg-gray-50"
                              disabled={isLoadingAction}
                              onClick={() => handleStatusChange(evt.id, 'cancelado')}
                            >
                              Descartar
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {!loading && filteredAlerts.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay alertas</h3>
                <p className="text-muted-foreground">
                  {alerts.length === 0
                    ? 'Aún no se han generado alertas automáticas. Las alertas aparecerán aquí cuando el sistema detecte anomalías de sobreconsumo.'
                    : 'No se encontraron alertas que coincidan con los filtros seleccionados.'}
                </p>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  )
}