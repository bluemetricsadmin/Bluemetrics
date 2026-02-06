import { useState, useEffect } from 'react'
import { DashboardHeader } from "../components/dashboard-header"
import { DashboardSidebar } from "../components/dashboard-sidebar"
import { Card, CardContent, CardHeader } from "../components/ui/card"
import { Button } from "../components/ui/button"
import consumptionPointsData from '../lib/consumption-points.json'
import { supabase } from '../supabaseClient'
import * as XLSX from 'xlsx'
import { 
  SaveIcon, 
  UploadIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  CalendarIcon,
  Loader2Icon,
  FileSpreadsheetIcon,
  EyeIcon,
  DownloadIcon,
  ListOrderedIcon,
  DatabaseIcon,
  CalculatorIcon
} from 'lucide-react'
import { RedirectIfNotAuth } from '../components/RedirectIfNotAuth'
import { 
  getMonthlyWaterTableName, 
  getMonthlyWaterConsumptionTableName,
  AVAILABLE_YEARS, 
  DEFAULT_YEAR,
  MONTHS,
  getMonthName
} from '../utils/tableHelpers'
import PointsOrderModal, { applyOrderToCategories } from '../components/PointsOrderModal'
import { usePersistedState } from '../hooks/usePersistedState'

export default function AddMonthlyWaterReadingsPage() {
  // Estados principales con persistencia
  const [selectedYear, setSelectedYear, clearSelectedYear] = usePersistedState('monthly_water_selectedYear', DEFAULT_YEAR)
  const [selectedMonth, setSelectedMonth, clearSelectedMonth] = usePersistedState('monthly_water_selectedMonth', new Date().getMonth() + 1)
  const [step, setStep, clearStep] = usePersistedState('monthly_water_step', 1)
  
  // Estados para Excel y datos con persistencia
  const [readings, setReadings, clearReadings] = usePersistedState('monthly_water_readings', {})
  const [excelData, setExcelData, clearExcelData] = usePersistedState('monthly_water_excelData', null)
  
  // Estados para cálculo de consumo con persistencia
  const [previousMonthReadings, setPreviousMonthReadings] = useState(null)
  const [consumption, setConsumption, clearConsumption] = usePersistedState('monthly_water_consumption', {})
  
  // Estados de UI (no persistidos)
  const [excelFile, setExcelFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [activeCategory, setActiveCategory, clearActiveCategory] = usePersistedState('monthly_water_activeCategory', 'pozos_servicios')
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [orderedCategoriesData, setOrderedCategoriesData] = useState(() => 
    applyOrderToCategories(consumptionPointsData.categories)
  )
  const [monthExists, setMonthExists] = useState(false)
  
  // Estado para seleccionar tipo de tabla destino
  const [targetTable, setTargetTable, clearTargetTable] = usePersistedState('monthly_water_targetTable', 'ambas') // 'lectura', 'consumo' o 'ambas'
  
  // Función para limpiar todos los datos persistidos
  const clearAllPersistedData = () => {
    clearStep()
    clearReadings()
    clearExcelData()
    clearConsumption()
    clearActiveCategory()
    clearTargetTable()
    console.log('✅ Datos persistidos limpiados')
  }

  // Verificar si el mes ya existe al cambiar año/mes
  useEffect(() => {
    checkIfMonthExists()
  }, [selectedYear, selectedMonth])

  const checkIfMonthExists = async () => {
    try {
      const tableName = getMonthlyWaterTableName()
      const { data, error: fetchError } = await supabase
        .from(tableName)
        .select('id')
        .eq('anio', parseInt(selectedYear))
        .eq('mes', selectedMonth)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('❌ Error verificando mes:', fetchError)
      }

      setMonthExists(!!data)
      console.log(`📅 Mes ${getMonthName(selectedMonth)} ${selectedYear} existe:`, !!data)
    } catch (err) {
      console.error('❌ Error al verificar mes:', err)
      setMonthExists(false)
    }
  }

  // Obtener lecturas del mes anterior
  const fetchPreviousMonthReadings = async () => {
    try {
      const tableName = getMonthlyWaterTableName()
      let prevYear = parseInt(selectedYear)
      let prevMonth = selectedMonth - 1
      
      // Si es enero, buscar diciembre del año anterior
      if (selectedMonth === 1) {
        prevYear = prevYear - 1
        prevMonth = 12
      }
      
      const { data, error: fetchError } = await supabase
        .from(tableName)
        .select('*')
        .eq('anio', prevYear)
        .eq('mes', prevMonth)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          console.log('ℹ️ No existe el mes anterior:', getMonthName(prevMonth), prevYear)
          setPreviousMonthReadings(null)
          return null
        }
        throw fetchError
      }

      setPreviousMonthReadings(data)
      console.log('✅ Lecturas de mes anterior cargadas:', getMonthName(prevMonth), prevYear)
      return data
    } catch (err) {
      console.error('❌ Error al obtener mes anterior:', err)
      setPreviousMonthReadings(null)
      return null
    }
  }

  // Crear nuevo mes
  const createMonth = async () => {
    if (monthExists) {
      setError(`El mes ${getMonthName(selectedMonth)} ${selectedYear} ya existe. Use la página de edición.`)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const tableName = getMonthlyWaterTableName()
      const consumoTableName = getMonthlyWaterConsumptionTableName()
      
      // Crear el mes en tabla de lecturas
      const { error: insertError } = await supabase
        .from(tableName)
        .insert([{
          anio: parseInt(selectedYear),
          mes: selectedMonth
        }])

      if (insertError) throw insertError

      console.log('✅ Mes creado en tabla de lecturas:', getMonthName(selectedMonth), selectedYear)

      // Crear el mes en tabla de consumo
      const { error: consumoInsertError } = await supabase
        .from(consumoTableName)
        .insert([{
          anio: parseInt(selectedYear),
          mes: selectedMonth
        }])

      if (consumoInsertError) {
        console.warn('⚠️ Error al crear mes en tabla de consumo:', consumoInsertError)
      } else {
        console.log('✅ Mes creado en tabla de consumo:', getMonthName(selectedMonth), selectedYear)
      }

      setSuccess(`Mes ${getMonthName(selectedMonth)} ${selectedYear} creado exitosamente`)
      setStep(2)
      
    } catch (err) {
      console.error('❌ Error al crear mes:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Procesar archivo Excel
  const handleExcelUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setExcelFile(file)
    setLoading(true)
    setError(null)

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      console.log('📊 Datos del Excel:', jsonData)
      setExcelData(jsonData)

      if (!jsonData || jsonData.length === 0) {
        throw new Error('El archivo Excel está vacío')
      }

      // Detectar columnas automáticamente
      const firstRow = jsonData[0]
      const columns = Object.keys(firstRow)
      
      // Buscar columnas de nombre/ID (case insensitive)
      const nameColumn = columns.find(col => 
        /^(punto|nombre|name|id|medidor)$/i.test(col.toLowerCase().trim())
      ) || columns.find(col => 
        /(punto|nombre|name|id|medidor)/i.test(col.toLowerCase())
      )

      // Buscar columnas de lectura (case insensitive)
      const readingColumn = columns.find(col => 
        /^(lectura|valor|value|m3|m³|reading)$/i.test(col.toLowerCase().trim())
      ) || columns.find(col => 
        /(lectura|valor|value|m3|m³|reading)/i.test(col.toLowerCase())
      )

      console.log('🔍 Columnas detectadas:', { nameColumn, readingColumn })

      if (!nameColumn || !readingColumn) {
        throw new Error('No se pudieron detectar las columnas necesarias. Asegúrate de tener columnas para nombre y lectura.')
      }

      // Procesar y mapear datos del Excel a readings
      const newReadings = {}
      let matched = 0
      let unmatched = []
      
      const readingKey = `${selectedYear}_${selectedMonth}`
      
      jsonData.forEach(row => {
        const pointName = row[nameColumn]?.toString().trim()
        const reading = row[readingColumn]
        
        if (!pointName || !reading) return

        let found = false

        // Buscar el punto de consumo por nombre o ID
        consumptionPointsData.categories.forEach(category => {
          category.points.forEach(point => {
            if (!point.noRead) {
              // Coincidencia exacta o parcial (case insensitive)
              const pointNameLower = pointName.toLowerCase()
              const pointIdLower = point.id.toLowerCase()
              const pointDisplayNameLower = point.name.toLowerCase()
              
              if (pointNameLower === pointIdLower || 
                  pointNameLower === pointDisplayNameLower ||
                  pointIdLower.includes(pointNameLower) ||
                  pointDisplayNameLower.includes(pointNameLower)) {
                const key = `${point.id}_${readingKey}`
                newReadings[key] = reading.toString()
                found = true
                matched++
              }
            }
          })
        })

        if (!found) {
          unmatched.push(pointName)
        }
      })

      setReadings(newReadings)

      // Obtener mes anterior y calcular consumo
      const prevMonth = await fetchPreviousMonthReadings()
      
      // Casos especiales con factor 10
      const specialCases = {
        'circuito_6_residencias': 10,
        'circuito_8_campus': 10,
        'medidor_general_pozos': 10,
        'campo_soft_bol': 10
      }

      // Calcular consumo
      const newConsumption = {}
      consumptionPointsData.categories.forEach(category => {
        category.points.forEach(point => {
          if (!point.noRead) {
            const key = `${point.id}_${readingKey}`
            const currentValue = parseFloat(newReadings[key])
            
            if (!isNaN(currentValue) && prevMonth) {
              const previousValue = parseFloat(prevMonth[`l_${point.id}`]) || 0
              const factor = specialCases[point.id] || 1
              const consumptionVal = (currentValue - previousValue) * factor
              newConsumption[key] = consumptionVal
            }
          }
        })
      })
      
      setConsumption(newConsumption)
      console.log('📊 Consumo calculado para', Object.keys(newConsumption).length, 'puntos')

      let message = `✅ Excel procesado: ${matched} lecturas cargadas`
      if (unmatched.length > 0) {
        message += `. ${unmatched.length} puntos no encontrados: ${unmatched.slice(0, 3).join(', ')}${unmatched.length > 3 ? '...' : ''}`
        console.warn('⚠️ Puntos no encontrados:', unmatched)
      }

      setSuccess(message)
      setStep(3)
      
    } catch (err) {
      console.error('❌ Error al procesar Excel:', err)
      setError(err.message || 'Error al procesar el archivo Excel. Verifica el formato.')
    } finally {
      setLoading(false)
    }
  }

  // Guardar lecturas en Supabase
  const saveReadings = async () => {
    setLoading(true)
    setError(null)

    try {
      const readingKey = `${selectedYear}_${selectedMonth}`
      
      // Preparar objeto con los datos
      const monthData = {
        anio: parseInt(selectedYear),
        mes: selectedMonth
      }

      // Agregar todas las lecturas al objeto (solo puntos habilitados)
      let dataCount = 0
      orderedCategoriesData.forEach(category => {
        category.points.forEach(point => {
          if (!point.noRead) {
            const key = `${point.id}_${readingKey}`
            const value = readings[key]
            
            if (value && value.trim() !== '') {
              const numValue = parseFloat(value)
              if (!isNaN(numValue)) {
                monthData[`l_${point.id}`] = numValue
                dataCount++
              }
            }
          }
        })
      })

      console.log(`💾 Datos a guardar:`, monthData)
      console.log(`📊 Total de datos: ${dataCount}`)

      if (dataCount === 0) {
        throw new Error('No hay datos para guardar')
      }

      let successMessages = []

      // Guardar en tabla de LECTURAS si es 'lectura' o 'ambas'
      if (targetTable === 'lectura' || targetTable === 'ambas') {
        const lecturasTableName = getMonthlyWaterTableName()
        const { data, error: lecturasError } = await supabase
          .from(lecturasTableName)
          .update(monthData)
          .eq('anio', parseInt(selectedYear))
          .eq('mes', selectedMonth)
          .select()

        if (lecturasError) {
          console.error('❌ Error en tabla de lecturas:', lecturasError)
          throw new Error(`Error en lecturas: ${lecturasError.message}`)
        }
        
        console.log('✅ Guardado en tabla de LECTURAS')
        successMessages.push(`${dataCount} lecturas`)
      }

      // Guardar en tabla de CONSUMO si es 'consumo' o 'ambas'
      if (targetTable === 'consumo' || targetTable === 'ambas') {
        const consumoTableName = getMonthlyWaterConsumptionTableName()
        const { data, error: consumoError } = await supabase
          .from(consumoTableName)
          .update(monthData)
          .eq('anio', parseInt(selectedYear))
          .eq('mes', selectedMonth)
          .select()

        if (consumoError) {
          console.error('❌ Error en tabla de consumo:', consumoError)
          throw new Error(`Error en consumo: ${consumoError.message}`)
        }
        
        console.log('✅ Guardado en tabla de CONSUMO')
        successMessages.push(`${dataCount} consumos`)
      }
      
      const finalMessage = targetTable === 'ambas' 
        ? `✅ Guardado en AMBAS tablas: ${successMessages.join(' y ')}`
        : `✅ ${successMessages[0]} guardados exitosamente`
      
      setSuccess(finalMessage)
      setStep(4)
      
      // Limpiar datos persistidos después de guardar exitosamente
      setTimeout(() => {
        clearAllPersistedData()
      }, 3000)

    } catch (error) {
      console.error('❌ Error guardando:', error)
      setError(`Error al guardar: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Manejar edición de lectura y recalcular consumo
  const handleReadingChange = (pointId, value) => {
    const readingKey = `${selectedYear}_${selectedMonth}`
    const key = `${pointId}_${readingKey}`
    const newReadings = { ...readings, [key]: value }
    setReadings(newReadings)

    // Recalcular consumo para este punto
    if (previousMonthReadings && value && value.trim() !== '') {
      const currentValue = parseFloat(value)
      if (!isNaN(currentValue)) {
        const previousValue = parseFloat(previousMonthReadings[`l_${pointId}`]) || 0
        
        const specialCases = {
          'circuito_6_residencias': 10,
          'circuito_8_campus': 10,
          'medidor_general_pozos': 10,
          'campo_soft_bol': 10
        }
        const factor = specialCases[pointId] || 1
        const consumoValue = (currentValue - previousValue) * factor
        
        setConsumption(prev => ({ ...prev, [key]: consumoValue }))
      }
    }
  }

  // Reiniciar formulario
  const resetForm = () => {
    setStep(1)
    setExcelFile(null)
    setReadings({})
    setExcelData(null)
    setConsumption({})
    setError(null)
    setSuccess(null)
    checkIfMonthExists()
  }

  // Volver a ingresar datos con Excel (mantener en paso 3)
  const returnToExcelUpload = () => {
    setExcelFile(null)
    setReadings({})
    setExcelData(null)
    setConsumption({})
    setError(null)
    setSuccess('Por favor, selecciona un nuevo archivo Excel para cargar los datos')
  }

  // Manejar cuando se guarda el orden
  const handleOrderSaved = (newOrderedCategories) => {
    setOrderedCategoriesData(newOrderedCategories)
  }

  // Descargar plantilla de Excel
  const downloadTemplate = () => {
    const templateData = []

    const aguaCiudadOrder = [
      'campo_soft_bol_ciudad',
      'cedes_ciudad',
      'estacionamiento_e3',
      'guarderia',
      'naranjos',
      'casa_solar'
    ]
    const aguaCiudadOrderIndex = new Map(aguaCiudadOrder.map((id, idx) => [id, idx]))
    
    orderedCategoriesData.forEach(category => {
      const orderedPoints =
        category.id === 'agua_ciudad'
          ? [...category.points].sort((a, b) => {
              const aIdx = aguaCiudadOrderIndex.has(a.id) ? aguaCiudadOrderIndex.get(a.id) : Number.POSITIVE_INFINITY
              const bIdx = aguaCiudadOrderIndex.has(b.id) ? aguaCiudadOrderIndex.get(b.id) : Number.POSITIVE_INFINITY
              return aIdx - bIdx
            })
          : category.points

      orderedPoints.forEach(point => {
        templateData.push({
          'Punto de Consumo': point.name,
          'ID': point.id,
          'Lectura': 0
        })
      })
    })

    const ws = XLSX.utils.json_to_sheet(templateData)
    
    ws['!cols'] = [
      { wch: 70 },
      { wch: 35 },
      { wch: 15 }
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Lecturas Mensuales')
    
    const totalPuntos = consumptionPointsData.categories.reduce((acc, cat) => acc + cat.points.length, 0)
    
    const instrucciones = [
      { 'INSTRUCCIONES': 'Plantilla de Lecturas Mensuales de Agua - Aquanet' },
      { 'INSTRUCCIONES': '' },
      { 'INSTRUCCIONES': '📋 INSTRUCCIONES:' },
      { 'INSTRUCCIONES': '' },
      { 'INSTRUCCIONES': '1. Complete la columna "Lectura" con los valores en m³' },
      { 'INSTRUCCIONES': '2. NO modifique las columnas "Punto de Consumo" ni "ID"' },
      { 'INSTRUCCIONES': '3. Guarde el archivo y súbalo en el sistema' },
      { 'INSTRUCCIONES': '' },
      { 'INSTRUCCIONES': '📊 Total de puntos: ' + totalPuntos },
      { 'INSTRUCCIONES': '' },
      { 'INSTRUCCIONES': '⚠️ Nota: Algunos puntos están marcados como "(NO TOMAR LECTURA)"' },
      { 'INSTRUCCIONES': '   Puede dejar esos en 0 o vacío.' }
    ]
    
    const wsInstrucciones = XLSX.utils.json_to_sheet(instrucciones)
    wsInstrucciones['!cols'] = [{ wch: 80 }]
    XLSX.utils.book_append_sheet(wb, wsInstrucciones, 'Instrucciones')

    const fecha = new Date().toISOString().split('T')[0]
    XLSX.writeFile(wb, `Plantilla_Lecturas_Mensuales_${fecha}.xlsx`)
  }

  // Calcular progreso
  const calculateProgress = () => {
    const total = consumptionPointsData.categories.reduce((acc, cat) => 
      acc + cat.points.filter(p => !p.noRead).length, 0
    )
    const readingKey = `${selectedYear}_${selectedMonth}`
    const completed = Object.keys(readings).filter(key => {
      if (!key.endsWith(readingKey)) return false
      return readings[key] && readings[key].trim() !== ''
    }).length
    return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 }
  }

  const progress = calculateProgress()

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
                    Agregar Lecturas Mensuales de Agua
                  </h1>
                  <p className="text-muted-foreground">
                    Crea mes, sube Excel y verifica datos antes de guardar
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowOrderModal(true)}
                    className="flex items-center gap-2"
                  >
                    <ListOrderedIcon className="h-4 w-4" />
                    Ordenar Puntos
                  </Button>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Año:</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => {
                        setSelectedYear(e.target.value)
                        resetForm()
                      }}
                      className="px-3 py-2 border border-muted rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {AVAILABLE_YEARS.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Mes:</label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => {
                        setSelectedMonth(parseInt(e.target.value))
                        resetForm()
                      }}
                      className="px-3 py-2 border border-muted rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {MONTHS.map(month => (
                        <option key={month.value} value={month.value}>{month.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Indicador de pasos */}
            {step < 4 && (
              <div className="mb-8">
                <div className="flex items-center justify-between max-w-3xl mx-auto">
                  {[
                    { num: 1, title: 'Crear Mes', icon: CalendarIcon },
                    { num: 2, title: 'Subir Excel', icon: UploadIcon },
                    { num: 3, title: 'Verificar y Guardar', icon: EyeIcon }
                  ].map((s, idx) => (
                    <div key={s.num} className="flex items-center flex-1">
                      <div className="flex flex-col items-center">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                          step >= s.num 
                            ? 'bg-primary border-primary text-primary-foreground' 
                            : 'border-muted text-muted-foreground'
                        }`}>
                          <s.icon className="h-5 w-5" />
                        </div>
                        <p className={`text-sm mt-2 font-medium ${step >= s.num ? 'text-primary' : 'text-muted-foreground'}`}>
                          {s.title}
                        </p>
                      </div>
                      {idx < 2 && (
                        <div className={`flex-1 h-0.5 mx-4 ${step > s.num ? 'bg-primary' : 'bg-muted'}`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mensajes de estado */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                <AlertCircleIcon className="h-5 w-5 text-red-600" />
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                <CheckCircle2Icon className="h-5 w-5 text-green-600" />
                <p className="text-green-800">{success}</p>
              </div>
            )}

            {/* PASO 1: Crear Mes */}
            {step === 1 && (
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <CalendarIcon className="h-6 w-6 text-primary" />
                    <div>
                      <h3 className="text-xl font-semibold">Paso 1: Crear Nuevo Mes</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {getMonthName(selectedMonth)} {selectedYear}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Año Seleccionado
                        </label>
                        <input
                          type="text"
                          value={selectedYear}
                          disabled
                          className="w-full px-4 py-3 border border-muted rounded-lg bg-muted text-sm font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Mes Seleccionado
                        </label>
                        <input
                          type="text"
                          value={getMonthName(selectedMonth)}
                          disabled
                          className="w-full px-4 py-3 border border-muted rounded-lg bg-muted text-sm font-medium"
                        />
                      </div>
                    </div>

                    {monthExists && (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-yellow-800 text-sm">
                          ⚠️ Este mes ya existe en la base de datos. Use la página de edición para modificar los datos.
                        </p>
                      </div>
                    )}

                    <Button 
                      className="w-full mt-4" 
                      size="lg"
                      onClick={createMonth}
                      disabled={loading || monthExists}
                    >
                      {loading ? (
                        <>
                          <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                          Creando...
                        </>
                      ) : (
                        <>
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          Crear Mes y Continuar
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* PASO 2: Subir Excel */}
            {step === 2 && (
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <FileSpreadsheetIcon className="h-6 w-6 text-primary" />
                    <div>
                      <h3 className="text-xl font-semibold">Paso 2: Subir Archivo Excel</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {getMonthName(selectedMonth)} {selectedYear}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                      <FileSpreadsheetIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground mb-4">
                        Sube un archivo Excel con las lecturas mensuales
                      </p>
                      <label className="inline-block">
                        <input
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={handleExcelUpload}
                          className="hidden"
                          disabled={loading}
                        />
                        <Button asChild disabled={loading}>
                          <span>
                            {loading ? (
                              <>
                                <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                                Procesando...
                              </>
                            ) : (
                              <>
                                <UploadIcon className="h-4 w-4 mr-2" />
                                Seleccionar Excel
                              </>
                            )}
                          </span>
                        </Button>
                      </label>
                      {excelFile && (
                        <p className="text-sm text-green-600 mt-4">
                          ✓ Archivo cargado: {excelFile.name}
                        </p>
                      )}
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-2">
                            📋 Formato esperado del Excel:
                          </p>
                          <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                            <li>• Columna "Punto de Consumo", "Nombre" o "ID"</li>
                            <li>• Columna "Lectura", "Valor" o "m³"</li>
                            <li>• Los nombres deben coincidir con los puntos de consumo</li>
                          </ul>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={downloadTemplate}
                          className="text-blue-700 border-blue-300 hover:bg-blue-100"
                        >
                          <DownloadIcon className="h-4 w-4 mr-1" />
                          Plantilla
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* PASO 3: Verificar y Guardar */}
            {step === 3 && (
              <>
                {/* Selector de Tabla Destino */}
                <Card className="mb-6">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <DatabaseIcon className="h-5 w-5 text-primary" />
                        <span className="font-medium">Guardar en tabla de:</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant={targetTable === 'ambas' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setTargetTable('ambas')}
                          className={targetTable === 'ambas' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                        >
                          <SaveIcon className="h-4 w-4 mr-2" />
                          Ambas
                        </Button>
                        <Button
                          variant={targetTable === 'lectura' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setTargetTable('lectura')}
                          className={targetTable === 'lectura' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                        >
                          <DatabaseIcon className="h-4 w-4 mr-2" />
                          Solo Lecturas
                        </Button>
                        <Button
                          variant={targetTable === 'consumo' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setTargetTable('consumo')}
                          className={targetTable === 'consumo' ? 'bg-green-600 hover:bg-green-700' : ''}
                        >
                          <CalculatorIcon className="h-4 w-4 mr-2" />
                          Solo Consumo
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {targetTable === 'ambas' 
                        ? '🔄 Los datos se guardarán en AMBAS tablas (lecturas y consumo)'
                        : targetTable === 'lectura' 
                          ? '📊 Los datos se guardarán solo como lecturas de medidores' 
                          : '📈 Los datos se guardarán solo como consumo calculado'}
                    </p>
                  </CardContent>
                </Card>

                {/* Barra de progreso */}
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
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={returnToExcelUpload}>
                          <UploadIcon className="h-4 w-4 mr-2" />
                          Cargar Otro Excel
                        </Button>
                        <Button 
                          onClick={saveReadings} 
                          disabled={loading || progress.completed === 0}
                          className={
                            targetTable === 'ambas' ? 'bg-purple-600 hover:bg-purple-700' :
                            targetTable === 'consumo' ? 'bg-green-600 hover:bg-green-700' : ''
                          }
                        >
                          {loading ? (
                            <>
                              <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                              Guardando...
                            </>
                          ) : (
                            <>
                              <SaveIcon className="h-4 w-4 mr-2" />
                              {targetTable === 'ambas' ? 'Guardar en Ambas Tablas' :
                               targetTable === 'consumo' ? 'Guardar en Consumo' : 'Guardar en Lecturas'}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tabs de Categorías */}
                <div className="mb-6 overflow-x-auto">
                  <div className="flex gap-2 border-b border-muted pb-2">
                    {orderedCategoriesData.map(category => {
                      const categoryPoints = category.points.filter(p => !p.noRead)
                      const readingKey = `${selectedYear}_${selectedMonth}`
                      const categoryCompleted = categoryPoints.filter(p => {
                        const key = `${p.id}_${readingKey}`
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

                {/* Formulario de Verificación */}
                {orderedCategoriesData.map(category => {
                  if (category.id !== activeCategory) return null

                  const readingKey = `${selectedYear}_${selectedMonth}`

                  return (
                    <Card key={category.id}>
                      <CardHeader>
                        <div>
                          <h3 className="text-lg font-semibold">{category.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {category.description}
                          </p>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {category.points.filter(p => !p.noRead).map((point) => {
                            const key = `${point.id}_${readingKey}`
                            const value = readings[key] || ''
                            const consumoValue = consumption[key]
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
                                {/* Indicador de estado */}
                                <div className="flex-shrink-0">
                                  {isCompleted ? (
                                    <CheckCircle2Icon className="h-5 w-5 text-green-500" />
                                  ) : (
                                    <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
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
                                    type="number"
                                    placeholder="Lectura"
                                    value={value}
                                    onChange={(e) => handleReadingChange(point.id, e.target.value)}
                                    className={`w-32 px-3 py-2 border rounded-lg text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary ${
                                      isCompleted 
                                        ? 'border-green-300 bg-white dark:bg-gray-900' 
                                        : 'border-muted'
                                    }`}
                                  />
                                  <span className="text-sm text-muted-foreground w-8">m³</span>
                                </div>

                                {/* Consumo calculado */}
                                {consumoValue !== undefined && (
                                  <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg">
                                    <span className="text-xs text-blue-600 dark:text-blue-400">Consumo:</span>
                                    <span className={`text-sm font-bold ${consumoValue < 0 ? 'text-red-500' : 'text-blue-600 dark:text-blue-400'}`}>
                                      {consumoValue.toFixed(2)} m³
                                    </span>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </>
            )}

            {/* PASO 4: Completado */}
            {step === 4 && (
              <Card className="max-w-2xl mx-auto">
                <CardContent className="pt-8 pb-8 text-center">
                  <CheckCircle2Icon className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    ¡Lecturas Guardadas!
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Las lecturas de {getMonthName(selectedMonth)} {selectedYear} se han guardado correctamente.
                  </p>
                  <div className="flex justify-center gap-4">
                    <Button onClick={resetForm}>
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Agregar Otro Mes
                    </Button>
                    <Button variant="outline" asChild>
                      <a href="/consumo-mensual-agua">
                        Ver Consumo Mensual
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </main>
        </div>

        {/* Modal de ordenar puntos */}
        <PointsOrderModal
          isOpen={showOrderModal}
          onClose={() => setShowOrderModal(false)}
          categories={consumptionPointsData.categories}
          onOrderSaved={handleOrderSaved}
        />
      </div>
    </RedirectIfNotAuth>
  )
}
