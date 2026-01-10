import { useState, useEffect, useRef } from 'react'
import { DashboardHeader } from "../components/dashboard-header"
import { DashboardSidebar } from "../components/dashboard-sidebar"
import { Card, CardContent, CardHeader } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { supabase } from '../supabaseClient'
import { 
  SaveIcon, 
  SearchIcon,
  CheckCircle2Icon,
  CircleIcon,
  AlertCircleIcon,
  CalendarIcon,
  Loader2Icon,
  RefreshCwIcon
} from 'lucide-react'
import { RedirectIfNotAuth } from '../components/RedirectIfNotAuth'

// Definición de categorías y puntos de medición para lecturas diarias
const dailyReadingPointsData = {
  categories: [
    {
      id: 'pozos',
      name: 'Pozos',
      points: [
        { id: 'general_pozos', name: 'General Pozos' },
        { id: 'pozo_3', name: 'Pozo 3' },
        { id: 'pozo_8', name: 'Pozo 8' },
        { id: 'pozo_15', name: 'Pozo 15' },
        { id: 'pozo_4', name: 'Pozo 4' },
        { id: 'pozo7', name: 'Pozo 7' },
        { id: 'pozo11', name: 'Pozo 11' },
        { id: 'pozo_12', name: 'Pozo 12' },
        { id: 'pozo_14', name: 'Pozo 14' }
      ]
    },
    {
      id: 'zonas',
      name: 'Zonas de Consumo',
      points: [
        { id: 'a_y_d', name: 'A y D' },
        { id: 'campus_8', name: 'Campus 8' },
        { id: 'a7_cc', name: 'A7-CC' },
        { id: 'megacentral', name: 'Megacentral' },
        { id: 'planta_fisica', name: 'Planta Física' },
        { id: 'residencias', name: 'Residencias' }
      ]
    },
    {
      id: 'general',
      name: 'General',
      points: [
        { id: 'consumo', name: 'Consumo Total' }
      ]
    }
  ]
}

export default function EditDailyReadingsPage() {
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(null)
  const [selectedRecordId, setSelectedRecordId] = useState(null)
  const [availableRecords, setAvailableRecords] = useState([])
  const [readings, setReadings] = useState({})
  const [activeCategory, setActiveCategory] = useState('pozos')
  const [searchTerm, setSearchTerm] = useState('')
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved')
  const firstInputRef = useRef(null)

  const [existingDates, setExistingDates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 50

  // Cargar fechas existentes
  useEffect(() => {
    fetchExistingDates(0)
  }, [])

  const fetchExistingDates = async (page = 0) => {
    try {
      setLoading(true)
      setError(null)
      
      // Obtener total de registros
      const { count, error: countError } = await supabase
        .from('lecturas_diarias')
        .select('*', { count: 'exact', head: true })
      
      if (countError) throw countError
      setTotalCount(count || 0)
      
      // Obtener datos con paginación
      const { data, error: fetchError } = await supabase
        .from('lecturas_diarias')
        .select('dia_hora, mes_anio, id')
        .order('id', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1)

      if (fetchError) throw fetchError

      console.log('✅ Fechas obtenidas:', data)
      setExistingDates(data || [])
      setCurrentPage(page)

    } catch (err) {
      console.error('❌ Error al cargar fechas:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Cargar registros disponibles cuando se selecciona una fecha
  useEffect(() => {
    if (selectedDate && selectedMonth) {
      loadAvailableRecords(selectedDate, selectedMonth)
    }
  }, [selectedDate, selectedMonth])

  // Cargar lecturas cuando se selecciona un registro específico
  useEffect(() => {
    if (selectedRecordId) {
      loadRecordReadings(selectedRecordId)
    }
  }, [selectedRecordId])

  // Cargar todos los registros disponibles para una fecha
  const loadAvailableRecords = async (dateStr, monthStr) => {
    try {
      setLoading(true)
      
      console.log('🔍 === CARGANDO REGISTROS PARA FECHA ===')
      console.log('📅 Fecha:', dateStr)
      console.log('📆 Mes/Año:', monthStr)
      
      // Construir la query con AMBOS filtros
      const query = supabase
        .from('lecturas_diarias')
        .select('id, mes_anio, dia_hora, consumo, general_pozos')
        .eq('dia_hora', dateStr)
        .eq('mes_anio', monthStr)
        .order('id', { ascending: false })
      
      // Mostrar cómo se envía la query
      console.log('🔧 === CONSTRUCCIÓN DE LA QUERY ===')
      console.log('📍 URL Base:', supabase.supabaseUrl)
      console.log('📊 Tabla:', 'lecturas_diarias')
      console.log('🔎 Select:', 'id, mes_anio, dia_hora, consumo, general_pozos')
      console.log('🎯 Filtros eq:', [
        { columna: 'dia_hora', valor: dateStr },
        { columna: 'mes_anio', valor: monthStr }
      ])
      console.log('📈 Order by:', { columna: 'id', ascending: false })
      console.log('🌐 Query completa URL aproximada:')
      console.log(`   ${supabase.supabaseUrl}/rest/v1/lecturas_diarias?select=id,mes_anio,dia_hora,consumo,general_pozos&dia_hora=eq.${encodeURIComponent(dateStr)}&mes_anio=eq.${encodeURIComponent(monthStr)}&order=id.desc`)
      
      const { data, error: fetchError } = await query

      if (fetchError) {
        console.log('❌ Error al cargar registros:', fetchError)
        setAvailableRecords([])
        setReadings({})
        return
      }

      console.log(`✅ Se encontraron ${data.length} registro(s) para esta fecha`)
      setAvailableRecords(data || [])
      
      // Auto-seleccionar el primer registro (más reciente)
      if (data && data.length > 0) {
        setSelectedRecordId(data[0].id)
      } else {
        setReadings({})
      }

    } catch (err) {
      console.error('❌ Error:', err)
      setAvailableRecords([])
    } finally {
      setLoading(false)
    }
  }

  // Cargar lecturas de un registro específico por ID
  const loadRecordReadings = async (recordId) => {
    try {
      setLoading(true)
      
      console.log('🔍 === CARGANDO DATOS DEL REGISTRO ===')
      console.log('🆔 ID del registro:', recordId)
      
      const { data, error: fetchError } = await supabase
        .from('lecturas_diarias')
        .select('*')
        .eq('id', recordId)
        .single()

      if (fetchError) {
        console.log('❌ Error al cargar registro:', fetchError)
        setReadings({})
        return
      }

      console.log('✅ Registro cargado:', data)

      const loadedReadings = {}
      dailyReadingPointsData.categories.forEach(category => {
        category.points.forEach(point => {
          if (data[point.id] !== null && data[point.id] !== undefined) {
            loadedReadings[point.id] = data[point.id].toString()
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

  const calculateProgress = () => {
    const category = dailyReadingPointsData.categories.find(c => c.id === activeCategory)
    if (!category) return { completed: 0, total: 0, percentage: 0 }

    const total = category.points.length
    const completed = category.points.filter(p => {
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
    if (!selectedRecordId) {
      console.warn('⚠️ No hay registro seleccionado')
      return
    }

    setAutoSaveStatus('saving')
    try {
      const readingData = {}

      dailyReadingPointsData.categories.forEach(category => {
        category.points.forEach(point => {
          const value = readings[point.id]
          
          if (value && value.trim() !== '') {
            readingData[point.id] = parseFloat(value)
          }
        })
      })

      console.log('💾 Guardando datos para registro ID:', selectedRecordId, readingData)

      const { error: updateError } = await supabase
        .from('lecturas_diarias')
        .update(readingData)
        .eq('id', selectedRecordId)

      if (updateError) throw updateError
      
      console.log('✅ Lecturas actualizadas exitosamente')
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
                    Editar Lecturas Diarias
                  </h1>
                  <p className="text-muted-foreground">
                    Edita manualmente las lecturas diarias de consumo de agua
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
                    onClick={() => fetchExistingDates(currentPage)}
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
                          key={date.dia_hora}
                          onClick={() => {
                            console.log('\n🖱️ === CLICK EN CARTA DE FECHA ===')
                            console.log('📅 Fecha clickeada:', date.dia_hora)
                            console.log('📆 Mes/Año clickeado:', date.mes_anio)
                            console.log('📊 Tipo:', typeof date.dia_hora)
                            console.log('📏 Longitud:', date.dia_hora?.length)
                            console.log('🔤 Caracteres:', date.dia_hora?.split(''))
                            console.log('📋 Objeto completo:', date)
                            setSelectedDate(date.dia_hora)
                            setSelectedMonth(date.mes_anio)
                          }}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            selectedDate === date.dia_hora
                              ? 'border-primary bg-primary/10 shadow-md'
                              : 'border-muted hover:border-primary/50'
                          }`}
                        >
                          <div className="text-left">
                            <p className="font-semibold text-sm">{date.dia_hora}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {date.mes_anio}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Controles de Paginación */}
                    {totalCount > pageSize && (
                      <div className="flex items-center justify-between mt-6 pt-4 border-t">
                        <div className="text-sm text-muted-foreground">
                          Mostrando {currentPage * pageSize + 1}-{Math.min((currentPage + 1) * pageSize, totalCount)} de {totalCount} fechas
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchExistingDates(currentPage - 1)}
                            disabled={currentPage === 0 || loading}
                          >
                            Anterior
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchExistingDates(currentPage + 1)}
                            disabled={currentPage >= Math.ceil(totalCount / pageSize) - 1 || loading}
                          >
                            Siguiente
                          </Button>
                        </div>
                      </div>
                    )}

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
                    {dailyReadingPointsData.categories.map(category => {
                      const categoryCompleted = category.points.filter(p => {
                        return readings[p.id] && readings[p.id].trim() !== ''
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
                            ({categoryCompleted}/{category.points.length})
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Formulario de Entrada de Datos */}
                {dailyReadingPointsData.categories.map(category => {
                  if (category.id !== activeCategory) return null

                  const filteredPoints = getFilteredPoints(category)

                  return (
                    <Card key={category.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold">{category.name}</h3>
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
                          {filteredPoints.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              No se encontraron medidores
                            </div>
                          ) : (
                            filteredPoints.map((point, index) => {
                              const value = readings[point.id] || ''
                              const isCompleted = value.trim() !== ''

                              return (
                                <div 
                                  key={point.id}
                                  className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                                    isCompleted 
                                      ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/10' 
                                      : 'border-muted hover:border-primary/50'
                                  }`}
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
                                      type="number"
                                      step="0.01"
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
    </RedirectIfNotAuth>
  )
}
