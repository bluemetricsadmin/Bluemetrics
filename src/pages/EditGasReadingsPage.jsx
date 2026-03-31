import { useState, useEffect, useRef } from 'react'
import { DashboardHeader } from "../components/dashboard-header"
import { DashboardSidebar } from "../components/dashboard-sidebar"
import { Card, CardContent, CardHeader } from "../components/ui/card"
import { Button } from "../components/ui/button"
import gasConsumptionPointsData from '../lib/gas-consumption-points.json'
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
  Loader2Icon,
  RefreshCwIcon,
  DownloadIcon,
  Trash2Icon,
  DropletIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
  AlertTriangleIcon
} from 'lucide-react'
import { RedirectIfNotAuth } from '../components/RedirectIfNotAuth'
import { getGasTableNameByYear, AVAILABLE_YEARS, DEFAULT_YEAR } from '../utils/tableHelpers'

export default function EditGasReadingsPage() {
  const [selectedWeek, setSelectedWeek] = useState(null)
  const [selectedYear, setSelectedYear] = useState(DEFAULT_YEAR)
  const [readings, setReadings] = useState({})
  const [activeCategory, setActiveCategory] = useState('todos_los_puntos')
  const [searchTerm, setSearchTerm] = useState('')
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved')
  const firstInputRef = useRef(null)
  const isInitialLoadRef = useRef(false)

  const [existingWeeks, setExistingWeeks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [savedCount, setSavedCount] = useState(0)

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // === Estados para edición manual de consumo ===
  const [editConsumoMode, setEditConsumoMode] = useState(false)
  const [consumoReadings, setConsumoReadings] = useState({})
  const [loadingConsumo, setLoadingConsumo] = useState(false)
  const [showConsumoConfirm, setShowConsumoConfirm] = useState(false)
  const [savingConsumo, setSavingConsumo] = useState(false)
  const [showConsumoSuccess, setShowConsumoSuccess] = useState(false)
  const [consumoSavedCount, setConsumoSavedCount] = useState(0)

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
    gasConsumptionPointsData.categories.forEach(category => {
      category.points.forEach(point => {
        templateData.push({
          'Punto de Consumo': point.name,
          'ID': point.id,
          'Lectura': 0
        })
      })
    })
    const ws = XLSX.utils.json_to_sheet(templateData)
    ws['!cols'] = [{ wch: 70 }, { wch: 35 }, { wch: 15 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Lecturas Gas')
    const fecha = new Date().toISOString().split('T')[0]
    XLSX.writeFile(wb, `Plantilla_Lecturas_Gas_${fecha}.xlsx`)
    console.log('✅ Plantilla descargada')
  }

  // Cargar semanas existentes
  useEffect(() => {
    fetchExistingWeeks()
  }, [selectedYear])

  const fetchExistingWeeks = async () => {
    try {
      setLoading(true)
      setError(null)

      const tableName = getGasTableNameByYear(selectedYear)
      console.log('🔍 Cargando desde tabla:', tableName)
      
      const { data, error: fetchError } = await supabase
        .from(tableName)
        .select('numero_semana, fecha_inicio, fecha_fin')
        .order('numero_semana', { ascending: true })

      if (fetchError) throw fetchError

      console.log('✅ Semanas gas obtenidas:', data)

      const weeks = (data || []).map(week => ({
        weekNumber: week.numero_semana,
        startDate: week.fecha_inicio,
        endDate: week.fecha_fin
      }))

      setExistingWeeks(weeks)

    } catch (err) {
      console.error('❌ Error al cargar semanas:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Cargar lecturas de una semana específica
  useEffect(() => {
    if (selectedWeek) {
      loadWeekReadings(selectedWeek)
    }
  }, [selectedWeek])

  const loadWeekReadings = async (weekNumber) => {
    try {
      setLoading(true)
      const tableName = getGasTableNameByYear(selectedYear)
      const { data, error: fetchError } = await supabase
        .from(tableName)
        .select('*')
        .eq('numero_semana', weekNumber)
        .single()

      if (fetchError) {
        console.log('🆕 Semana sin datos')
        setReadings({})
        return
      }

      console.log('✅ Lecturas gas cargadas:', data)

      const loadedReadings = {}
      
      gasConsumptionPointsData.categories.forEach(category => {
        category.points.forEach(point => {
          if (!point.noRead) {
            const dbFieldName = point.id
            if (data[dbFieldName] !== null && data[dbFieldName] !== undefined) {
              const key = `${point.id}_${weekNumber}`
              loadedReadings[key] = data[dbFieldName].toString()
            }
          }
        })
      })

      isInitialLoadRef.current = true
      setReadings(loadedReadings)

    } catch (err) {
      console.error('❌ Error al cargar lecturas:', err)
    } finally {
      setLoading(false)
    }
  }

  const calculateProgress = () => {
    const category = gasConsumptionPointsData.categories.find(c => c.id === activeCategory)
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

  const saveReadings = async () => {
    if (!selectedWeek) {
      console.warn('⚠️ No hay semana seleccionada')
      return
    }

    setAutoSaveStatus('saving')
    try {
      const weekData = {
        numero_semana: selectedWeek
      }

      gasConsumptionPointsData.categories.forEach(category => {
        category.points.forEach(point => {
          if (!point.noRead) {
            const key = `${point.id}_${selectedWeek}`
            const value = readings[key]
            
            if (value && value.trim() !== '') {
              weekData[point.id] = parseFloat(value)
            }
          }
        })
      })

      console.log('💾 Guardando datos gas:', weekData)

      const tableName = getGasTableNameByYear(selectedYear)
      const weekInfo = existingWeeks.find(w => w.weekNumber === selectedWeek)
      
      if (weekInfo) {
        weekData.fecha_inicio = weekInfo.startDate
        weekData.fecha_fin = weekInfo.endDate
      }

      const { error: updateError } = await supabase
        .from(tableName)
        .update(weekData)
        .eq('numero_semana', selectedWeek)

      if (updateError) throw updateError


      //Actualizar consumo de gas
      let consumoCount = 0
      try {
        // Obtener lecturas de la semana anterior
        let prevTableName = tableName
        let prevWeekNum = selectedWeek - 1

        if (selectedWeek === 1) {
          // Si es semana 1, buscar última semana del año anterior
          const previousYear = String(parseInt(selectedYear) - 1)
          prevTableName = getGasTableNameByYear(previousYear)

          const { data: lastWeekData, error: lastWeekError } = await supabase
            .from(prevTableName)
            .select('l_numero_semana')
            .order('l_numero_semana', { ascending: false })
            .limit(1)
            .single()

          if (lastWeekError) {
            console.warn('⚠️ No se encontraron datos del año anterior para calcular consumo')
            prevWeekNum = null
          } else {
            prevWeekNum = lastWeekData.l_numero_semana
            console.log(`📅 Semana 1: usando semana ${prevWeekNum} del año ${previousYear} como referencia`)
          }
        }

        let prevWeekData = null
        if (prevWeekNum !== null) {
          const { data, error: prevError } = await supabase
            .from(prevTableName)
            .select('*')
            .eq('l_numero_semana', prevWeekNum)
            .single()

          if (!prevError && data) {
            prevWeekData = data
          } else {
            console.warn(`⚠️ No se encontró semana anterior ${prevWeekNum} en ${prevTableName}`)
          }
        }

        // Casos especiales con factor 10 (mismos que AddWeeklyReadingsPage)
        const specialCases = {
          'circuito_6_residencias': 10,
          'circuito_8_campus': 10,
          'medidor_general_pozos': 10,
          'campo_soft_bol': 10
        }

        // Calcular consumo para cada punto
        const consumoTableName = `lecturas_semana_agua_consumo_${selectedYear}`
        const consumoData = {
          l_numero_semana: selectedWeek
        }

        if (weekInfo) {
          consumoData.l_fecha_inicio = weekInfo.startDate
          consumoData.l_fecha_fin = weekInfo.endDate
        }

        gasConsumptionPointsData.categories.forEach(category => {
          category.points.forEach(point => {
            if (point.noRead) return
            const key = `${point.id}_${selectedWeek}`
            const currentValue = readings[key] ? parseFloat(readings[key]) : NaN

            if (!isNaN(currentValue) && prevWeekData) {
              const previousValue = parseFloat(prevWeekData[`l_${point.id}`]) || 0
              const factor = specialCases[point.id] || 1
              const consumption = (currentValue - previousValue) * factor
              consumoData[`l_${point.id}`] = consumption
              consumoCount++
            }
          })
        })

        if (consumoCount > 0) {
          console.log(`📊 Guardando consumo calculado (${consumoCount} puntos) en ${consumoTableName}`)

          const { error: consumoError } = await supabase
            .from(consumoTableName)
            .upsert(consumoData, {
              onConflict: 'l_numero_semana',
              ignoreDuplicates: false
            })

          if (consumoError) {
            console.warn('⚠️ Error guardando consumo:', consumoError)
          } else {
            console.log('✅ Consumo actualizado exitosamente')
          }
        } else {
          console.warn('⚠️ No se pudo calcular consumo (sin semana anterior o sin lecturas)')
        }
      } catch (consumoErr) {
        console.warn('⚠️ Error al recalcular consumo:', consumoErr)
        // No lanzar error - las lecturas ya se guardaron correctamente
      }
      
      console.log('✅ Lecturas gas actualizadas exitosamente')
      setAutoSaveStatus('saved')
      const count = Object.keys(weekData).filter(k => k !== 'numero_semana' && k !== 'fecha_inicio' && k !== 'fecha_fin').length
      setSavedCount(count)
      setShowSuccessModal(true)

    } catch (error) {
      console.error('❌ Error guardando:', error)
      setAutoSaveStatus('error')
      setError(error.message)
    }
  }

  const copyPreviousWeekReadings = async () => {
    if (!selectedWeek || selectedWeek === 1) {
      alert('No hay semana anterior para copiar')
      return
    }

    const previousWeek = selectedWeek - 1

    try {
      const tableName = getGasTableNameByYear(selectedYear)
      const { data, error: fetchError } = await supabase
        .from(tableName)
        .select('*')
        .eq('numero_semana', previousWeek)
        .single()

      if (fetchError) throw fetchError

      if (!data) {
        alert('No se encontraron datos de la semana anterior')
        return
      }

      const newReadings = {}

      gasConsumptionPointsData.categories.forEach(category => {
        category.points.forEach(point => {
          if (!point.noRead) {
            const dbFieldName = point.id
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

  const deleteReading = async () => {
    if (!selectedWeek) {
      console.warn('⚠️ No hay semana seleccionada para eliminar')
      return
    }

    try {
      setDeleting(true)
      const tableName = getGasTableNameByYear(selectedYear)
      
      console.log(`🗑️ Eliminando semana ${selectedWeek} de la tabla ${tableName}`)

      // Eliminar todos los datos de la semana
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .eq('numero_semana', selectedWeek)

      if (deleteError) throw deleteError

      console.log('✅ Semana eliminada exitosamente')
      
      // Limpiar estados específicos para semanales
      setSelectedWeek(null)
      setReadings({})
      setShowDeleteConfirm(false)
      setAutoSaveStatus('saved')
      setError(null)
      
      // Recargar las semanas disponibles
      await fetchExistingWeeks()

    } catch (error) {
      console.error('❌ Error eliminando semana:', error)
      setError(`Error al eliminar: ${error.message}`)
      setAutoSaveStatus('error')
    } finally {
      setDeleting(false)
    }
  }

  const handleReadingChange = (pointId, value) => {
    const key = `${pointId}_${selectedWeek}`
    setReadings(prev => ({
      ...prev,
      [key]: value
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

  // === EDICIÓN MANUAL DE CONSUMO ===

  const getActiveCategoryPoints = () => {
    const category = gasConsumptionPointsData.categories.find(c => c.id === activeCategory)
    if (!category) return []
    return category.points.filter(p => !p.noRead)
  }

  // Cargar datos de consumo cuando se activa el modo, cambia la semana o cambia la categoría
  useEffect(() => {
    if (editConsumoMode && selectedWeek) {
      loadConsumoData(selectedWeek)
    }
  }, [editConsumoMode, selectedWeek, activeCategory])

  // Cargar consumo desde tabla de consumo de gas
  const loadConsumoData = async (weekNumber) => {
    try {
      setLoadingConsumo(true)
      const consumoTableName = `lecturas_semanales_gas_consumo_${selectedYear}`

      console.log('🔍 Cargando consumo gas desde:', consumoTableName, 'semana:', weekNumber)

      const { data, error: fetchError } = await supabase
        .from(consumoTableName)
        .select('*')
        .eq('numero_semana', weekNumber)
        .single()

      if (fetchError) {
        console.warn('⚠️ No se encontraron datos de consumo gas para la semana', weekNumber)
        setConsumoReadings({})
        return
      }

      const loaded = {}
      const points = getActiveCategoryPoints()
      points.forEach(point => {
        const dbField = point.id
        if (data[dbField] !== null && data[dbField] !== undefined) {
          loaded[point.id] = data[dbField].toString()
        }
      })

      console.log('✅ Consumo gas cargado:', loaded)
      setConsumoReadings(loaded)
    } catch (err) {
      console.error('❌ Error al cargar consumo gas:', err)
    } finally {
      setLoadingConsumo(false)
    }
  }

  // Manejar cambio en input de consumo
  const handleConsumoChange = (pointId, value) => {
    setConsumoReadings(prev => ({
      ...prev,
      [pointId]: value
    }))
  }

  // Guardar consumo manual de gas
  const saveConsumoData = async () => {
    if (!selectedWeek) return

    try {
      setSavingConsumo(true)
      const consumoTableName = `lecturas_semanales_gas_consumo_${selectedYear}`

      const updateData = {}
      let count = 0

      const points = getActiveCategoryPoints()
      points.forEach(point => {
        const value = consumoReadings[point.id]
        if (value !== undefined && value !== '' && value !== null) {
          updateData[point.id] = parseFloat(value)
          count++
        }
      })

      console.log(`💾 Guardando consumo gas manual de ${count} puntos en ${consumoTableName}`)

      const { error: updateError } = await supabase
        .from(consumoTableName)
        .update(updateData)
        .eq('numero_semana', selectedWeek)

      if (updateError) throw updateError

      console.log('✅ Consumo gas actualizado exitosamente')
      setConsumoSavedCount(count)
      setShowConsumoConfirm(false)
      setShowConsumoSuccess(true)
    } catch (err) {
      console.error('❌ Error guardando consumo gas:', err)
      setError(`Error al guardar consumo: ${err.message}`)
    } finally {
      setSavingConsumo(false)
    }
  }

  // Toggle del modo edición de consumo
  const toggleConsumoMode = () => {
    if (editConsumoMode) {
      setEditConsumoMode(false)
      setConsumoReadings({})
    } else {
      setEditConsumoMode(true)
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
                  <h1 className="text-3xl font-bold text-foreground mb-2">
                    Editar Lecturas Semanales de Gas
                  </h1>
                  <p className="text-muted-foreground">
                    Edita manualmente las lecturas de consumo de gas - Año {selectedYear}
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
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
                    {gasConsumptionPointsData.categories.map(category => {
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
                {gasConsumptionPointsData.categories.map(category => {
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
                              variant="outline"
                              size="sm"
                              onClick={() => setShowDeleteConfirm(true)}
                              className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                            >
                              <Trash2Icon className="h-4 w-4 mr-2" />
                              Eliminar Semana
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

                {/* Edición Manual de Consumo de Gas */}
                <Card className="mt-6">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <DropletIcon className="h-5 w-5 text-blue-500" />
                        <div>
                          <h3 className="text-lg font-semibold">
                            Edición Manual de Consumo - {gasConsumptionPointsData.categories.find(c => c.id === activeCategory)?.name || 'Categoría'}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Edita manualmente los valores de consumo calculado para la categoría seleccionada
                          </p>
                        </div>
                      </div>

                      {/* Switch Toggle */}
                      <button
                        onClick={toggleConsumoMode}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-all hover:shadow-sm"
                        style={{
                          borderColor: editConsumoMode ? '#3b82f6' : undefined,
                          backgroundColor: editConsumoMode ? 'rgba(59,130,246,0.08)' : undefined
                        }}
                      >
                        {editConsumoMode ? (
                          <ToggleRightIcon className="h-6 w-6 text-blue-500" />
                        ) : (
                          <ToggleLeftIcon className="h-6 w-6 text-muted-foreground" />
                        )}
                        <span className={`text-sm font-medium ${editConsumoMode ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}`}>
                          {editConsumoMode ? 'Activado' : 'Desactivado'}
                        </span>
                      </button>
                    </div>
                  </CardHeader>

                  {editConsumoMode && (
                    <CardContent>
                      {loadingConsumo ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2Icon className="h-6 w-6 animate-spin text-blue-500 mr-3" />
                          <span className="text-muted-foreground">Cargando consumo...</span>
                        </div>
                      ) : (
                        <>
                          <div className="space-y-3">
                            {getActiveCategoryPoints().map((point) => {
                              const value = consumoReadings[point.id] || ''
                              const hasValue = value !== '' && value !== undefined

                              return (
                                <div
                                  key={point.id}
                                  className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                                    hasValue
                                      ? 'border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/10'
                                      : 'border-muted hover:border-blue-300'
                                  }`}
                                >
                                  <div className="flex-shrink-0">
                                    {hasValue ? (
                                      <CheckCircle2Icon className="h-5 w-5 text-blue-500" />
                                    ) : (
                                      <CircleIcon className="h-5 w-5 text-muted-foreground" />
                                    )}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{point.name}</p>
                                    <span className="text-xs text-muted-foreground">{point.id}</span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground font-medium">Consumo:</span>
                                    <input
                                      type="number"
                                      placeholder="Consumo m³"
                                      value={value}
                                      onChange={(e) => handleConsumoChange(point.id, e.target.value)}
                                      className={`w-40 px-3 py-2 border rounded-lg text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        hasValue
                                          ? 'border-blue-300 bg-white dark:bg-gray-900'
                                          : 'border-muted'
                                      }`}
                                    />
                                    <span className="text-sm text-muted-foreground">m³</span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>

                          {/* Botón Guardar Consumo */}
                          <div className="mt-6 flex items-center justify-between">
                            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 flex items-start gap-2">
                              <AlertTriangleIcon className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                              <p className="text-xs text-amber-800 dark:text-amber-200">
                                Los cambios manuales sobrescribirán el consumo calculado automáticamente para esta categoría en la semana seleccionada.
                              </p>
                            </div>

                            <Button
                              size="sm"
                              onClick={() => setShowConsumoConfirm(true)}
                              disabled={savingConsumo || Object.keys(consumoReadings).length === 0}
                              className="bg-blue-600 hover:bg-blue-700 ml-4"
                            >
                              <SaveIcon className="h-4 w-4 mr-2" />
                              Guardar Consumo
                            </Button>
                          </div>
                        </>
                      )}
                    </CardContent>
                  )}
                </Card>
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
                    Las lecturas de gas se han actualizado correctamente
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

      {/* Modal de Confirmación de Eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                  <Trash2Icon className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Eliminar Lectura de Gas</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Esta acción no se puede deshacer
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <p className="text-sm text-foreground mb-4">
                  ¿Estás seguro de que deseas eliminar la lectura de la semana <strong>{selectedWeek}</strong>?
                </p>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-xs text-red-800 dark:text-red-200">
                    <strong>Advertencia:</strong> Se eliminarán permanentemente todas las lecturas de esta semana.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={deleteReading}
                  disabled={deleting}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {deleting ? (
                    <>
                      <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <Trash2Icon className="h-4 w-4 mr-2" />
                      Eliminar
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Confirmación de Guardado de Consumo */}
      {showConsumoConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
                  <AlertTriangleIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Confirmar Cambio de Consumo</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Estás a punto de sobrescribir datos calculados
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <p className="text-sm text-foreground mb-4">
                  ¿Estás seguro de que deseas guardar los valores de consumo manuales para la semana <strong>{selectedWeek}</strong>?
                </p>
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    <strong>Advertencia:</strong> Los valores de consumo calculados automáticamente serán reemplazados por los valores ingresados manualmente.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowConsumoConfirm(false)}
                  disabled={savingConsumo}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={saveConsumoData}
                  disabled={savingConsumo}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {savingConsumo ? (
                    <>
                      <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <SaveIcon className="h-4 w-4 mr-2" />
                      Confirmar
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Éxito de Consumo */}
      {showConsumoSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                  <CheckCircle2Icon className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400">¡Consumo Actualizado!</h3>
                  <p className="text-muted-foreground mt-2">
                    El consumo de gas se ha actualizado correctamente
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                <p className="text-lg font-semibold mb-2">
                  {consumoSavedCount} puntos actualizados
                </p>
                <p className="text-sm text-muted-foreground">
                  Semana: {selectedWeek} — Año: {selectedYear}
                </p>
              </div>

              <Button
                size="lg"
                onClick={() => setShowConsumoSuccess(false)}
                className="w-full bg-blue-600 hover:bg-blue-700"
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
