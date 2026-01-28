import { useState, useEffect, useRef } from 'react'
import { DashboardHeader } from "../components/dashboard-header"
import { DashboardSidebar } from "../components/dashboard-sidebar"
import { Card, CardContent, CardHeader } from "../components/ui/card"
import { Button } from "../components/ui/button"
import consumptionPointsData from '../lib/consumption-points.json'
import { supabase } from '../supabaseClient'
import * as XLSX from 'xlsx'
import { 
  SaveIcon, 
  CopyIcon, 
  SearchIcon,
  CheckCircle2Icon,
  CircleIcon,
  AlertCircleIcon,
  CalendarIcon,
  TrendingUpIcon,
  Loader2Icon,
  RefreshCwIcon,
  EditIcon,
  DownloadIcon
} from 'lucide-react'
import { RedirectIfNotAuth } from '../components/RedirectIfNotAuth'
import { getTableNameByYear, AVAILABLE_YEARS, DEFAULT_YEAR } from '../utils/tableHelpers'

export default function EditWeeklyReadingsPage() {
  const [selectedWeek, setSelectedWeek] = useState(null)
  const [selectedYear, setSelectedYear] = useState(DEFAULT_YEAR)
  const [readings, setReadings] = useState({})
  const [activeCategory, setActiveCategory] = useState('pozos_servicios')
  const [searchTerm, setSearchTerm] = useState('')
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved') // 'saved', 'saving', 'error'
  const firstInputRef = useRef(null)

  // Estados para datos de Supabase
  const [existingWeeks, setExistingWeeks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [savedCount, setSavedCount] = useState(0)

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false)
    setSelectedWeek(null)
    setReadings({})
    setAutoSaveStatus('saved')
    setError(null)
    setSavedCount(0)
    console.log('✅ Proceso completado, volviendo al inicio')
  }

  const downloadTemplate = () => {
    const templateData = []
    consumptionPointsData.categories.forEach(category => {
      category.points.forEach(point => {
        if (!point.noRead) {
          templateData.push({
            'Punto de Consumo': point.name,
            'ID': point.id,
            'Lectura': 0
          })
        }
      })
    })
    const ws = XLSX.utils.json_to_sheet(templateData)
    ws['!cols'] = [{ wch: 70 }, { wch: 35 }, { wch: 15 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Lecturas Agua')
    const fecha = new Date().toISOString().split('T')[0]
    XLSX.writeFile(wb, `Plantilla_Lecturas_Agua_${fecha}.xlsx`)
    console.log('✅ Plantilla descargada')
  }

  // Cargar semanas existentes desde Supabase cuando cambia el año
  useEffect(() => {
    fetchExistingWeeks()
  }, [selectedYear])

  const fetchExistingWeeks = async () => {
    try {
      setLoading(true)
      setError(null)

      const tableName = getTableNameByYear(selectedYear)
      console.log('🔍 Cargando desde tabla:', tableName)
      
      const { data, error: fetchError } = await supabase
        .from(tableName)
        .select('l_numero_semana, l_fecha_inicio, l_fecha_fin')
        .order('l_numero_semana', { ascending: true })

      if (fetchError) throw fetchError

      console.log('✅ Semanas obtenidas desde Supabase:', data)

      const weeks = (data || []).map(week => ({
        weekNumber: week.l_numero_semana,
        startDate: week.l_fecha_inicio,
        endDate: week.l_fecha_fin
      }))

      setExistingWeeks(weeks)

    } catch (err) {
      console.error('❌ Error al cargar semanas:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Cargar lecturas de una semana específica al seleccionarla
  useEffect(() => {
    if (selectedWeek) {
      loadWeekReadings(selectedWeek)
    }
  }, [selectedWeek])

  const loadWeekReadings = async (weekNumber) => {
    try {
      setLoading(true)
      const tableName = getTableNameByYear(selectedYear)
      const { data, error: fetchError } = await supabase
        .from(tableName)
        .select('*')
        .eq('l_numero_semana', weekNumber)
        .single()

      if (fetchError) {
        console.log('🆕 Semana sin datos')
        setReadings({})
        return
      }

      console.log('✅ Lecturas cargadas:', data)

      // Convertir los datos de la base de datos al formato de readings
      const loadedReadings = {}
      
      consumptionPointsData.categories.forEach(category => {
        category.points.forEach(point => {
          if (!point.noRead) {
            const dbFieldName = `l_${point.id}`
            if (data[dbFieldName] !== null && data[dbFieldName] !== undefined) {
              const key = `${point.id}_${weekNumber}`
              loadedReadings[key] = data[dbFieldName].toString()
            }
          }
        })
      })

      setReadings(loadedReadings)

    } catch (err) {
      console.error('❌ Error al cargar lecturas:', err)
    } finally {
      setLoading(false)
    }
  }

  // Calcular progreso de entrada de datos
  const calculateProgress = () => {
    const category = consumptionPointsData.categories.find(c => c.id === activeCategory)
    if (!category) return { completed: 0, total: 0, percentage: 0 }

    const activePoints = category.points.filter(p => !p.noRead)
    const total = activePoints.length
    const completed = activePoints.filter(p => {
      const key = `${p.id}_${selectedWeek}`
      return readings[key] && readings[key].trim() !== ''
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
    if (Object.keys(readings).length === 0 || !selectedWeek) return

    const timer = setTimeout(() => {
      saveReadings()
    }, 3000)

    return () => clearTimeout(timer)
  }, [readings])

  // Guardar lecturas en Supabase
  const saveReadings = async () => {
    if (!selectedWeek) {
      console.warn('⚠️ No hay semana seleccionada')
      return
    }

    setAutoSaveStatus('saving')
    try {
      const weekData = {
        l_numero_semana: selectedWeek
      }

      // Agregar todas las lecturas al objeto
      consumptionPointsData.categories.forEach(category => {
        category.points.forEach(point => {
          if (!point.noRead) {
            const key = `${point.id}_${selectedWeek}`
            const value = readings[key]
            
            if (value && value.trim() !== '') {
              weekData[`l_${point.id}`] = parseFloat(value)
            }
          }
        })
      })

      console.log('💾 Guardando datos:', weekData)

      const tableName = getTableNameByYear(selectedYear)
      const weekInfo = existingWeeks.find(w => w.weekNumber === selectedWeek)
      
      if (weekInfo) {
        weekData.l_fecha_inicio = weekInfo.startDate
        weekData.l_fecha_fin = weekInfo.endDate
      }

      // UPDATE - Actualizar semana existente
      const { error: updateError } = await supabase
        .from(tableName)
        .update(weekData)
        .eq('l_numero_semana', selectedWeek)

      if (updateError) throw updateError
      
      console.log('✅ Lecturas actualizadas exitosamente')
      setAutoSaveStatus('saved')
      const count = Object.keys(weekData).filter(k => k !== 'l_numero_semana' && k !== 'l_fecha_inicio' && k !== 'l_fecha_fin').length
      setSavedCount(count)
      setShowSuccessModal(true)

    } catch (error) {
      console.error('❌ Error guardando:', error)
      setAutoSaveStatus('error')
      setError(error.message)
    }
  }

  // Copiar lecturas de la semana anterior desde Supabase
  const copyPreviousWeekReadings = async () => {
    if (!selectedWeek || selectedWeek === 1) {
      alert('No hay semana anterior para copiar')
      return
    }

    const previousWeek = selectedWeek - 1

    try {
      const tableName = getTableNameByYear(selectedYear)
      const { data, error: fetchError } = await supabase
        .from(tableName)
        .select('*')
        .eq('l_numero_semana', previousWeek)
        .single()

      if (fetchError) throw fetchError

      if (!data) {
        alert('No se encontraron datos de la semana anterior')
        return
      }

      const newReadings = {}

      consumptionPointsData.categories.forEach(category => {
        category.points.forEach(point => {
          if (!point.noRead) {
            const dbFieldName = `l_${point.id}`
            if (data[dbFieldName] !== null && data[dbFieldName] !== undefined) {
              const key = `${point.id}_${selectedWeek}`
              newReadings[key] = data[dbFieldName].toString()
            }
          }
        })
      })

      setReadings({ ...readings, ...newReadings })
      alert('Lecturas de la semana anterior copiadas exitosamente')

    } catch (err) {
      console.error('❌ Error al copiar lecturas:', err)
      alert(`Error al copiar lecturas: ${err.message}`)
    }
  }

  // Manejar cambio de lectura
  const handleReadingChange = (pointId, value) => {
    const key = `${pointId}_${selectedWeek}`
    setReadings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  // Manejar Enter para pasar al siguiente campo
  const handleKeyDown = (e, pointId, index, filteredPoints) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const nextIndex = index + 1
      if (nextIndex < filteredPoints.length) {
        const nextPointId = filteredPoints[nextIndex].id
        const nextInput = document.getElementById(`input-${nextPointId}`)
        if (nextInput) {
          nextInput.focus()
        }
      }
    }
  }

  // Filtrar puntos por búsqueda
  const getFilteredPoints = (category) => {
    let points = category.points
    
    if (searchTerm) {
      points = points.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return points
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
                  <h1 className="text-3xl font-bold text-foreground mb-2">
                    Editar Lecturas Semanales
                  </h1>
                  <p className="text-muted-foreground">
                    Edita manualmente las lecturas de consumo de agua - Año {selectedYear}
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Selector de Año */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Año:</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => {
                        setSelectedYear(e.target.value)
                        setSelectedWeek(null)
                        setReadings({})
                      }}
                      className="px-3 py-2 border border-muted rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {AVAILABLE_YEARS.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>

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
                    onClick={fetchExistingWeeks}
                    disabled={loading}
                  >
                    <RefreshCwIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Recargar
                  </Button>
                </div>
              </div>
            </div>

            {/* Selección de Semana */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Seleccionar Semana</h3>
                  </div>
                  
                  {selectedWeek && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={copyPreviousWeekReadings}
                      disabled={selectedWeek === 1}
                    >
                      <CopyIcon className="h-4 w-4 mr-2" />
                      Copiar Semana Anterior
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2Icon className="h-8 w-8 animate-spin text-primary mr-3" />
                    <span className="text-muted-foreground">Cargando semanas...</span>
                  </div>
                ) : error && existingWeeks.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircleIcon className="h-12 w-12 text-destructive mx-auto mb-3" />
                    <p className="text-destructive font-semibold mb-2">Error al cargar semanas</p>
                    <p className="text-sm text-muted-foreground mb-4">{error}</p>
                    <Button onClick={fetchExistingWeeks} size="sm">
                      <RefreshCwIcon className="h-4 w-4 mr-2" />
                      Reintentar
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {existingWeeks.map(week => (
                        <button
                          key={week.weekNumber}
                          onClick={() => setSelectedWeek(week.weekNumber)}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            selectedWeek === week.weekNumber
                              ? 'border-primary bg-primary/10 shadow-md'
                              : 'border-muted hover:border-primary/50'
                          }`}
                        >
                          <div className="text-left">
                            <p className="font-semibold text-lg">Semana {week.weekNumber}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {week.startDate} - {week.endDate}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>

                    {!selectedWeek && !loading && (
                      <div className="text-center py-8 text-muted-foreground">
                        Selecciona una semana para editar sus lecturas
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {selectedWeek && (
              <>
                {/* Barra de progreso y búsqueda */}
                <Card className="mb-6">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1 mr-4">
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
                      </div>

                      {/* Búsqueda */}
                      <div className="relative w-80">
                        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Buscar medidor..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-muted rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tabs de Categorías */}
                <div className="mb-6 overflow-x-auto">
                  <div className="flex gap-2 border-b border-muted pb-2">
                    {consumptionPointsData.categories.map(category => {
                      const categoryPoints = category.points.filter(p => !p.noRead)
                      const categoryCompleted = categoryPoints.filter(p => {
                        const key = `${p.id}_${selectedWeek}`
                        return readings[key] && readings[key].trim() !== ''
                      }).length

                      return (
                        <button
                          key={category.id}
                          onClick={() => setActiveCategory(category.id)}
                          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                            activeCategory === category.id
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                          }`}
                        >
                          {category.name}
                          <span className="ml-2 text-xs opacity-70">
                            ({categoryCompleted}/{categoryPoints.length})
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Formulario de Entrada de Datos */}
                {consumptionPointsData.categories.map(category => {
                  if (category.id !== activeCategory) return null

                  const filteredPoints = getFilteredPoints(category)

                  return (
                    <Card key={category.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold">{category.name}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {category.description}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={downloadTemplate}
                              className="border-green-300 text-green-600 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/20"
                            >
                              <DownloadIcon className="h-4 w-4 mr-2" />
                              Descargar Plantilla
                            </Button>
                            <Button 
                              size="sm"
                              onClick={saveReadings}
                              disabled={autoSaveStatus === 'saving'}
                            >
                              <SaveIcon className="h-4 w-4 mr-2" />
                              Guardar Ahora
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {filteredPoints.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              No se encontraron medidores
                            </div>
                          ) : (
                            filteredPoints.map((point, index) => {
                              const key = `${point.id}_${selectedWeek}`
                              const value = readings[key] || ''
                              const isCompleted = value.trim() !== ''

                              // Saltar medidores sin lectura
                              if (point.noRead) return null

                              return (
                                <div 
                                  key={point.id}
                                  className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                                    isCompleted 
                                      ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/10' 
                                      : 'border-muted hover:border-primary/50'
                                  }`}
                                >
                                  {/* Indicador de estado */}
                                  <div className="flex-shrink-0">
                                    {isCompleted ? (
                                      <CheckCircle2Icon className="h-5 w-5 text-green-500" />
                                    ) : (
                                      <CircleIcon className="h-5 w-5 text-muted-foreground" />
                                    )}
                                  </div>

                                  {/* Información del medidor */}
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">
                                      {point.name}
                                    </p>
                                    <span className="text-xs text-muted-foreground">
                                      {point.id}
                                    </span>
                                  </div>

                                  {/* Input de lectura */}
                                  <div className="flex items-center gap-2">
                                    <input
                                      id={`input-${point.id}`}
                                      ref={index === 0 ? firstInputRef : null}
                                      type="number"
                                      placeholder="Lectura en m³"
                                      value={value}
                                      onChange={(e) => handleReadingChange(point.id, e.target.value)}
                                      onKeyDown={(e) => handleKeyDown(e, point.id, index, filteredPoints)}
                                      className={`w-40 px-3 py-2 border rounded-lg text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary ${
                                        isCompleted 
                                          ? 'border-green-300 bg-white dark:bg-gray-900' 
                                          : 'border-muted'
                                      }`}
                                    />
                                    <span className="text-sm text-muted-foreground">m³</span>
                                  </div>
                                </div>
                              )
                            })
                          )}
                        </div>

                        {/* Ayuda rápida */}
                        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-2">
                            💡 Atajos de teclado:
                          </p>
                          <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                            <li>• <kbd className="px-1 py-0.5 bg-white dark:bg-gray-800 rounded border">Enter</kbd> - Siguiente campo</li>
                            <li>• <kbd className="px-1 py-0.5 bg-white dark:bg-gray-800 rounded border">Tab</kbd> - Navegar entre campos</li>
                            <li>• Auto-guardado cada 3 segundos</li>
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Modal de Guardado Exitoso */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <CheckCircle2Icon className="h-10 w-10 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">¡Guardado Exitoso!</h3>
                  <p className="text-muted-foreground mt-2">
                    Las lecturas semanales de agua se han actualizado correctamente
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                <p className="text-lg font-semibold mb-2">
                  {savedCount} lecturas actualizadas
                </p>
                <p className="text-sm text-muted-foreground">
                  Semana: {selectedWeek}
                </p>
              </div>

              <Button
                size="lg"
                onClick={handleCloseSuccessModal}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Aceptar
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </RedirectIfNotAuth>
  )
}
