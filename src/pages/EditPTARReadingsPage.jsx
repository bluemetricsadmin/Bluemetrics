import { useState, useEffect, useRef } from 'react'
import { DashboardHeader } from "../components/dashboard-header"
import { DashboardSidebar } from "../components/dashboard-sidebar"
import { Card, CardContent, CardHeader } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { supabase } from '../supabaseClient'
import { 
  SaveIcon, 
  CheckCircle2Icon,
  CircleIcon,
  AlertCircleIcon,
  CalendarIcon,
  Loader2Icon,
  RefreshCwIcon,
  Droplets
} from 'lucide-react'
import { RedirectIfNotAuth } from '../components/RedirectIfNotAuth'

// Definición de puntos de medición para PTAR
const ptarReadingPoints = [
  { id: 'medidor_entrada', name: 'Medidor Entrada' },
  { id: 'medidor_salida', name: 'Medidor salida' },
  { id: 'ar', name: 'AR' },
  { id: 'at', name: 'AT' },
  { id: 'recirculacion', name: 'Recirculacion' },
  { id: 'total_dia', name: 'Total dia' }
]

export default function EditPTARReadingsPage() {
  const [selectedDate, setSelectedDate] = useState(null)
  const [readings, setReadings] = useState({})
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved')
  const firstInputRef = useRef(null)

  const [existingDates, setExistingDates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Cargar fechas existentes
  useEffect(() => {
    fetchExistingDates()
  }, [])

  const fetchExistingDates = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error: fetchError } = await supabase
        .from('lecturas_ptar')
        .select('fecha, hora')
        .order('fecha', { ascending: false })

      if (fetchError) throw fetchError

      console.log('✅ Fechas PTAR obtenidas:', data)
      setExistingDates(data || [])

    } catch (err) {
      console.error('❌ Error al cargar fechas:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Cargar lecturas de una fecha específica
  useEffect(() => {
    if (selectedDate) {
      loadDateReadings(selectedDate)
    }
  }, [selectedDate])

  const loadDateReadings = async (dateStr) => {
    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('lecturas_ptar')
        .select('*')
        .eq('fecha', dateStr)
        .single()

      if (fetchError) {
        console.log('🆕 Fecha sin datos')
        setReadings({})
        return
      }

      console.log('✅ Lecturas PTAR cargadas:', data)

      const loadedReadings = {}
      ptarReadingPoints.forEach(point => {
        if (data[point.id] !== null && data[point.id] !== undefined) {
          loadedReadings[point.id] = data[point.id].toString()
        }
      })

      setReadings(loadedReadings)

    } catch (err) {
      console.error('❌ Error al cargar lecturas:', err)
    } finally {
      setLoading(false)
    }
  }

  const calculateProgress = () => {
    const total = ptarReadingPoints.length
    const completed = ptarReadingPoints.filter(p => {
      return readings[p.id] && readings[p.id].trim() !== ''
    }).length

    return { 
      completed, 
      total, 
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0 
    }
  }

  const progress = calculateProgress()

  // Auto-guardar cada 3 segundos
  useEffect(() => {
    if (Object.keys(readings).length === 0 || !selectedDate) return

    const timer = setTimeout(() => {
      saveReadings()
    }, 3000)

    return () => clearTimeout(timer)
  }, [readings])

  const saveReadings = async () => {
    if (!selectedDate) {
      console.warn('⚠️ No hay fecha seleccionada')
      return
    }

    setAutoSaveStatus('saving')
    try {
      const readingData = {
        fecha: selectedDate
      }

      ptarReadingPoints.forEach(point => {
        const value = readings[point.id]
        
        if (value && value.trim() !== '') {
          readingData[point.id] = parseFloat(value)
        }
      })

      console.log('💾 Guardando datos PTAR:', readingData)

      const { error: updateError } = await supabase
        .from('lecturas_ptar')
        .update(readingData)
        .eq('fecha', selectedDate)

      if (updateError) throw updateError
      
      console.log('✅ Lecturas PTAR actualizadas exitosamente')
      setAutoSaveStatus('saved')
      setTimeout(() => setAutoSaveStatus('saved'), 2000)

    } catch (error) {
      console.error('❌ Error guardando:', error)
      setAutoSaveStatus('error')
      setError(error.message)
    }
  }

  const handleReadingChange = (pointId, value) => {
    setReadings(prev => ({
      ...prev,
      [pointId]: value
    }))
  }

  // Auto-calcular total cuando cambian los valores
  useEffect(() => {
    if (readings.ar || readings.at || readings.recirculacion) {
      const ar = parseFloat(readings.ar) || 0
      const at = parseFloat(readings.at) || 0
      const recirculacion = parseFloat(readings.recirculacion) || 0
      const total = (ar + at + recirculacion).toFixed(2)
      
      if (total !== readings.total_dia) {
        setReadings(prev => ({
          ...prev,
          total_dia: total
        }))
      }
    }
  }, [readings.ar, readings.at, readings.recirculacion])

  const handleKeyDown = (e, pointId, index) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const nextIndex = index + 1
      if (nextIndex < ptarReadingPoints.length) {
        const nextPointId = ptarReadingPoints[nextIndex].id
        const nextInput = document.getElementById(`input-${nextPointId}`)
        if (nextInput) {
          nextInput.focus()
        }
      }
    }
  }

  return (
    <RedirectIfNotAuth>
      <div className="min-h-screen bg-background">
        <DashboardSidebar />
        
        <div className="ml-64">
          <DashboardHeader />
          <main className="p-6">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
                    <Droplets className="h-8 w-8 text-blue-600" />
                    Editar Lecturas PTAR
                  </h1>
                  <p className="text-muted-foreground">
                    Edita manualmente las lecturas de la Planta de Tratamiento
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Auto-save status */}
                  <div className="flex items-center gap-2 text-sm">
                    {autoSaveStatus === 'saving' && (
                      <span className="text-blue-500 flex items-center gap-1">
                        <Loader2Icon className="h-4 w-4 animate-spin" />
                        Guardando...
                      </span>
                    )}
                    {autoSaveStatus === 'saved' && (
                      <span className="text-green-500 flex items-center gap-1">
                        <CheckCircle2Icon className="h-4 w-4" />
                        Guardado
                      </span>
                    )}
                    {autoSaveStatus === 'error' && (
                      <span className="text-destructive flex items-center gap-1">
                        <AlertCircleIcon className="h-4 w-4" />
                        Error
                      </span>
                    )}
                  </div>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={fetchExistingDates}
                    disabled={loading}
                  >
                    <RefreshCwIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Recargar
                  </Button>
                </div>
              </div>
            </div>

            {/* Selección de Fecha */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Seleccionar Fecha</h3>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2Icon className="h-8 w-8 animate-spin text-primary mr-3" />
                    <span className="text-muted-foreground">Cargando fechas...</span>
                  </div>
                ) : error && existingDates.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircleIcon className="h-12 w-12 text-destructive mx-auto mb-3" />
                    <p className="text-destructive font-semibold mb-2">Error al cargar fechas</p>
                    <p className="text-sm text-muted-foreground mb-4">{error}</p>
                    <Button onClick={fetchExistingDates} size="sm">
                      <RefreshCwIcon className="h-4 w-4 mr-2" />
                      Reintentar
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {existingDates.map(date => (
                        <button
                          key={date.fecha}
                          onClick={() => setSelectedDate(date.fecha)}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            selectedDate === date.fecha
                              ? 'border-primary bg-primary/10 shadow-md'
                              : 'border-muted hover:border-primary/50'
                          }`}
                        >
                          <div className="text-left">
                            <p className="font-semibold text-sm">{date.fecha}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Hora: {date.hora}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>

                    {!selectedDate && !loading && (
                      <div className="text-center py-8 text-muted-foreground">
                        Selecciona una fecha para editar sus lecturas
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {selectedDate && (
              <>
                {/* Barra de progreso */}
                <Card className="mb-6">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        Progreso: {progress.completed} de {progress.total} medidores
                      </span>
                      <span className="text-sm font-bold text-primary">
                        {progress.percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3">
                      <div 
                        className="bg-primary h-3 rounded-full transition-all duration-300"
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Formulario de Entrada de Datos */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">Lecturas PTAR</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Fecha: {selectedDate}
                        </p>
                      </div>
                      <Button 
                        size="sm"
                        onClick={saveReadings}
                        disabled={autoSaveStatus === 'saving'}
                      >
                        <SaveIcon className="h-4 w-4 mr-2" />
                        Guardar Ahora
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {ptarReadingPoints.map((point, index) => {
                        const value = readings[point.id] || ''
                        const isCompleted = value.trim() !== ''
                        const isTotal = point.id === 'total_dia'

                        return (
                          <div 
                            key={point.id}
                            className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                              isCompleted 
                                ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/10' 
                                : 'border-muted hover:border-primary/50'
                            } ${isTotal ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800' : ''}`}
                          >
                            <div className="flex-shrink-0">
                              {isCompleted ? (
                                <CheckCircle2Icon className="h-5 w-5 text-green-500" />
                              ) : (
                                <CircleIcon className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {point.name}
                              </p>
                              <span className="text-xs text-muted-foreground">
                                {point.id}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <input
                                id={`input-${point.id}`}
                                ref={index === 0 ? firstInputRef : null}
                                type="text"
                                inputMode="decimal"
                                placeholder="Lectura en m³"
                                value={value}
                                onChange={(e) => handleReadingChange(point.id, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, point.id, index)}
                                disabled={isTotal}
                                className={`w-40 px-3 py-2 border rounded-lg text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary ${
                                  isCompleted 
                                    ? 'border-green-300 bg-white dark:bg-gray-900' 
                                    : 'border-muted'
                                } ${isTotal ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : ''}`}
                              />
                              <span className="text-sm text-muted-foreground">m³</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Información adicional */}
                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-2">
                        💡 Información:
                      </p>
                      <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                        <li>• <kbd className="px-1 py-0.5 bg-white dark:bg-gray-800 rounded border">Enter</kbd> - Siguiente campo</li>
                        <li>• El <strong>Total dia</strong> se calcula automáticamente (AR + AT + Recirculacion)</li>
                        <li>• Auto-guardado cada 3 segundos</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </main>
        </div>
      </div>
    </RedirectIfNotAuth>
  )
}
