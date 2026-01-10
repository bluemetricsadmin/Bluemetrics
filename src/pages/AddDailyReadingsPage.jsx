import { useState, useEffect } from 'react'
import { DashboardHeader } from "../components/dashboard-header"
import { DashboardSidebar } from "../components/dashboard-sidebar"
import { Card, CardContent, CardHeader } from "../components/ui/card"
import { Button } from "../components/ui/button"
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
  DownloadIcon
} from 'lucide-react'
import { RedirectIfNotAuth } from '../components/RedirectIfNotAuth'
import { usePersistedState } from '../hooks/usePersistedState'

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

export default function AddDailyReadingsPage() {
  // Estados principales con persistencia
  const [step, setStep, clearStep] = usePersistedState('daily_step', 1)
  
  // Estados para la fecha con persistencia
  const [selectedDate, setSelectedDate, clearSelectedDate] = usePersistedState('daily_selectedDate', '')
  const [mesAnio, setMesAnio, clearMesAnio] = usePersistedState('daily_mesAnio', '')
  
  // Estados para Excel y datos con persistencia
  const [readings, setReadings, clearReadings] = usePersistedState('daily_readings', {})
  const [excelData, setExcelData, clearExcelData] = usePersistedState('daily_excelData', null)
  
  // Estados para cálculo de consumo con persistencia
  const [previousDayReadings, setPreviousDayReadings] = useState(null)
  const [consumption, setConsumption, clearConsumption] = usePersistedState('daily_consumption', {})
  
  // Estados de UI (no persistidos)
  const [excelFile, setExcelFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [activeCategory, setActiveCategory, clearActiveCategory] = usePersistedState('daily_activeCategory', 'pozos')
  
  // Función para limpiar todos los datos persistidos
  const clearAllPersistedData = () => {
    clearStep()
    clearSelectedDate()
    clearMesAnio()
    clearReadings()
    clearExcelData()
    clearConsumption()
    clearActiveCategory()
    console.log('✅ Datos persistidos limpiados')
  }

  // Obtener lecturas del día anterior
  const fetchPreviousDayReadings = async () => {
    if (!selectedDate) {
      setPreviousDayReadings(null)
      console.log('ℹ️ No hay fecha seleccionada')
      return null
    }

    try {
      const currentDate = new Date(selectedDate)
      const previousDate = new Date(currentDate)
      previousDate.setDate(previousDate.getDate() - 1)
      const previousDateStr = previousDate.toISOString().split('T')[0]
      
      const { data, error: fetchError } = await supabase
        .from('lecturas_diarias')
        .select('*')
        .eq('dia_hora', previousDateStr)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          console.log('ℹ️ No existe lectura del día anterior:', previousDateStr)
          setPreviousDayReadings(null)
          return null
        }
        throw fetchError
      }

      setPreviousDayReadings(data)
      console.log('✅ Lecturas del día anterior cargadas:', previousDateStr)
      return data
    } catch (err) {
      console.error('❌ Error al obtener día anterior:', err)
      setPreviousDayReadings(null)
      return null
    }
  }

  // Crear nuevo registro de fecha
  const createDateEntry = async () => {
    if (!selectedDate) {
      setError('Por favor selecciona una fecha')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Calcular mes_anio
      const date = new Date(selectedDate)
      const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                     'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
      const mesAnioStr = `${meses[date.getMonth()]} ${date.getFullYear()}`
      setMesAnio(mesAnioStr)
      
      // Verificar si ya existe
      const { data: existing } = await supabase
        .from('lecturas_diarias')
        .select('id')
        .eq('dia_hora', selectedDate)
        .single()

      if (existing) {
        setSuccess(`Fecha ${selectedDate} ya existe. Puedes editarla.`)
      } else {
        // Crear la entrada
        const { error: insertError } = await supabase
          .from('lecturas_diarias')
          .insert([{
            dia_hora: selectedDate,
            mes_anio: mesAnioStr
          }])

        if (insertError) throw insertError
        console.log('✅ Entrada de fecha creada:', selectedDate)
        setSuccess(`Fecha ${selectedDate} creada exitosamente`)
      }

      setStep(2)
      
    } catch (err) {
      console.error('❌ Error al crear fecha:', err)
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

      const firstRow = jsonData[0]
      const columns = Object.keys(firstRow)
      
      // Verificar si es formato horizontal (tiene columnas Mes/Año y Fecha/Hora)
      const hasMesAnio = columns.some(col => /mes.?a[ñn]o/i.test(col))
      const hasFechaHora = columns.some(col => /fecha.?hora/i.test(col))
      const isHorizontalFormat = hasMesAnio && hasFechaHora

      console.log('🔍 Formato detectado:', isHorizontalFormat ? 'HORIZONTAL' : 'VERTICAL')

      let newReadings = {}
      let matched = 0
      let unmatched = []

      if (isHorizontalFormat) {
        // FORMATO HORIZONTAL: cada columna es un punto de medición
        // Usar solo la primera fila de datos (la fecha seleccionada debe coincidir)
        const row = jsonData[0]
        
        // Mapeo de nombres de columnas a IDs de puntos
        const pointMapping = {
          'consumo': 'consumo',
          'general pozos': 'general_pozos',
          'pozo 3': 'pozo_3',
          'pozo 8': 'pozo_8',
          'pozo 15': 'pozo_15',
          'pozo 4': 'pozo_4',
          'a y d': 'a_y_d',
          'campus 8': 'campus_8',
          'a7-cc': 'a7_cc',
          'megacentral': 'megacentral',
          'planta física': 'planta_fisica',
          'planta fisica': 'planta_fisica',
          'residencias': 'residencias',
          'pozo7': 'pozo7',
          'pozo11': 'pozo11',
          'pozo 12': 'pozo_12',
          'pozo 14': 'pozo_14'
        }

        // Iterar sobre todas las columnas del Excel
        Object.keys(row).forEach(columnName => {
          // Saltar columnas de fecha
          if (/mes.?a[ñn]o/i.test(columnName) || /fecha.?hora/i.test(columnName)) {
            return
          }

          const value = row[columnName]
          if (value === undefined || value === null || value === '') return

          // Buscar coincidencia en el mapeo
          const columnLower = columnName.toLowerCase().trim()
          const pointId = pointMapping[columnLower]

          if (pointId) {
            newReadings[pointId] = value.toString()
            matched++
          } else {
            // Intentar coincidencia flexible
            let found = false
            dailyReadingPointsData.categories.forEach(category => {
              category.points.forEach(point => {
                const pointNameLower = point.name.toLowerCase()
                const pointIdLower = point.id.toLowerCase()
                
                if (columnLower === pointNameLower || 
                    columnLower === pointIdLower ||
                    pointNameLower.includes(columnLower) ||
                    columnLower.includes(pointNameLower)) {
                  newReadings[point.id] = value.toString()
                  found = true
                  matched++
                }
              })
            })

            if (!found) {
              unmatched.push(columnName)
            }
          }
        })

      } else {
        // FORMATO VERTICAL: cada fila es un punto de medición
        const nameColumn = columns.find(col => 
          /^(punto|nombre|name|id|medidor)$/i.test(col.toLowerCase().trim())
        ) || columns.find(col => 
          /(punto|nombre|name|id|medidor)/i.test(col.toLowerCase())
        )

        const readingColumn = columns.find(col => 
          /^(lectura|valor|value|m3|m³|reading)$/i.test(col.toLowerCase().trim())
        ) || columns.find(col => 
          /(lectura|valor|value|m3|m³|reading)/i.test(col.toLowerCase())
        )

        console.log('🔍 Columnas detectadas:', { nameColumn, readingColumn })

        if (!nameColumn || !readingColumn) {
          throw new Error('No se pudieron detectar las columnas necesarias. Use formato horizontal o vertical válido.')
        }

        jsonData.forEach(row => {
          const pointName = row[nameColumn]?.toString().trim()
          const reading = row[readingColumn]
          
          if (!pointName || reading === undefined || reading === null) return

          let found = false

          dailyReadingPointsData.categories.forEach(category => {
            category.points.forEach(point => {
              const pointNameLower = pointName.toLowerCase()
              const pointIdLower = point.id.toLowerCase()
              const pointDisplayNameLower = point.name.toLowerCase()
              
              if (pointNameLower === pointIdLower || 
                  pointNameLower === pointDisplayNameLower ||
                  pointIdLower.includes(pointNameLower) ||
                  pointDisplayNameLower.includes(pointNameLower)) {
                newReadings[point.id] = reading.toString()
                found = true
                matched++
              }
            })
          })

          if (!found) {
            unmatched.push(pointName)
          }
        })
      }

      setReadings(newReadings)

      // Obtener día anterior y calcular consumo
      const prevDay = await fetchPreviousDayReadings()
      
      // Calcular consumo
      const newConsumption = {}
      dailyReadingPointsData.categories.forEach(category => {
        category.points.forEach(point => {
          const currentValue = parseFloat(newReadings[point.id])
          
          if (!isNaN(currentValue) && prevDay) {
            const previousValue = parseFloat(prevDay[point.id]) || 0
            const consumptionValue = currentValue - previousValue
            newConsumption[point.id] = consumptionValue
          }
        })
      })
      
      setConsumption(newConsumption)
      console.log('📊 Consumo calculado para', Object.keys(newConsumption).length, 'puntos')

      let message = `✅ Excel procesado (${isHorizontalFormat ? 'horizontal' : 'vertical'}): ${matched} lecturas cargadas`
      if (unmatched.length > 0) {
        message += `. ${unmatched.length} columnas no encontradas: ${unmatched.slice(0, 3).join(', ')}${unmatched.length > 3 ? '...' : ''}`
        console.warn('⚠️ Columnas no encontradas:', unmatched)
      }

      setSuccess(message)
      setStep(3)
      
    } catch (err) {
      console.error('❌ Error al procesar Excel:', err)
      setError(err.message || 'Error al procesar el archivo Excel')
    } finally {
      setLoading(false)
    }
  }

  // Guardar lecturas en Supabase
  const saveReadings = async () => {
    if (!selectedDate) return

    setLoading(true)
    setError(null)

    try {
      const readingData = {
        dia_hora: selectedDate,
        mes_anio: mesAnio
      }

      // Agregar todas las lecturas al objeto
      let readingsCount = 0
      dailyReadingPointsData.categories.forEach(category => {
        category.points.forEach(point => {
          const value = readings[point.id]
          
          if (value && value.trim() !== '') {
            const numValue = parseFloat(value)
            if (!isNaN(numValue)) {
              readingData[point.id] = numValue
              readingsCount++
            }
          }
        })
      })

      console.log('💾 Guardando datos:', readingData)
      console.log(`📊 Total de lecturas a guardar: ${readingsCount}`)

      if (readingsCount === 0) {
        throw new Error('No hay lecturas para guardar')
      }

      // Verificar que la fecha existe
      const { data: existingDate, error: checkError } = await supabase
        .from('lecturas_diarias')
        .select('id, dia_hora')
        .eq('dia_hora', selectedDate)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        throw new Error(`Error verificando fecha: ${checkError.message}`)
      }

      if (!existingDate) {
        throw new Error(`La fecha ${selectedDate} no existe. Por favor créala primero.`)
      }

      console.log('✅ Fecha encontrada:', existingDate)
      
      // UPDATE - Actualizar la fecha que creamos
      const { data, error: updateError } = await supabase
        .from('lecturas_diarias')
        .update(readingData)
        .eq('dia_hora', selectedDate)
        .select()

      if (updateError) {
        console.error('❌ Error de Supabase:', updateError)
        throw new Error(`Error al actualizar: ${updateError.message}`)
      }

      if (!data || data.length === 0) {
        throw new Error('No se actualizó ningún registro')
      }
      
      console.log('✅ Lecturas guardadas exitosamente:', data)
      setSuccess(`✅ ${readingsCount} lecturas guardadas exitosamente`)
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
    const newReadings = { ...readings, [pointId]: value }
    setReadings(newReadings)

    // Recalcular consumo para este punto
    if (previousDayReadings && value && value.trim() !== '') {
      const currentValue = parseFloat(value)
      if (!isNaN(currentValue)) {
        const previousValue = parseFloat(previousDayReadings[pointId]) || 0
        const consumptionValue = currentValue - previousValue
        setConsumption(prev => ({ ...prev, [pointId]: consumptionValue }))
      }
    }
  }

  // Reiniciar formulario
  const resetForm = () => {
    setStep(1)
    setSelectedDate('')
    setMesAnio('')
    setExcelFile(null)
    setReadings({})
    setExcelData(null)
    setError(null)
    setSuccess(null)
  }

  // Descargar plantilla de Excel
  const downloadTemplate = () => {
    // Orden específico de columnas según lo solicitado
    const columnOrder = [
      { id: 'consumo', name: 'Consumo' },
      { id: 'general_pozos', name: 'General pozos' },
      { id: 'pozo_3', name: 'Pozo 3' },
      { id: 'pozo_8', name: 'Pozo 8' },
      { id: 'pozo_15', name: 'Pozo 15' },
      { id: 'pozo_4', name: 'Pozo 4' },
      { id: 'a_y_d', name: 'A y D' },
      { id: 'campus_8', name: 'Campus 8' },
      { id: 'a7_cc', name: 'A7-CC' },
      { id: 'megacentral', name: 'Megacentral' },
      { id: 'planta_fisica', name: 'Planta Física' },
      { id: 'residencias', name: 'Residencias' },
      { id: 'pozo7', name: 'Pozo7' },
      { id: 'pozo11', name: 'Pozo11' },
      { id: 'pozo_12', name: 'Pozo 12' },
      { id: 'pozo_14', name: 'Pozo 14' }
    ]

    // Crear formato horizontal: cada fila es una fecha, cada columna es un punto
    const templateData = []
    
    // Crear una fila de ejemplo con la fecha actual
    const today = new Date()
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                   'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
    const mesAnio = `${meses[today.getMonth()]}${today.getFullYear()}`
    
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    const diaStr = `${dias[today.getDay()]}${today.getDate()} ${today.getHours()}:${today.getMinutes().toString().padStart(2, '0')}`
    
    // Fila de ejemplo
    const exampleRow = {
      'Mes/Año': mesAnio,
      'Fecha/Hora': diaStr
    }
    
    // Agregar columnas para cada punto de medición
    columnOrder.forEach(point => {
      exampleRow[point.name] = 0
    })
    
    templateData.push(exampleRow)

    // Crear hoja con formato horizontal
    const ws = XLSX.utils.json_to_sheet(templateData)
    
    // Ajustar anchos de columna
    const colWidths = [
      { wch: 18 },  // Mes/Año
      { wch: 18 }   // Fecha/Hora
    ]
    columnOrder.forEach(() => {
      colWidths.push({ wch: 15 }) // Cada punto de medición
    })
    ws['!cols'] = colWidths

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Lecturas Diarias')
    
    // Hoja de instrucciones
    const instrucciones = [
      { 'INSTRUCCIONES': 'Plantilla de Lecturas Diarias de Agua - Aquanet' },
      { 'INSTRUCCIONES': '' },
      { 'INSTRUCCIONES': '📋 INSTRUCCIONES:' },
      { 'INSTRUCCIONES': '' },
      { 'INSTRUCCIONES': '1. Formato HORIZONTAL: cada FILA es una fecha, cada COLUMNA es un punto de medición' },
      { 'INSTRUCCIONES': '2. La columna "Mes/Año" debe tener formato: ej. "diciembre2025"' },
      { 'INSTRUCCIONES': '3. La columna "Fecha/Hora" debe tener formato: ej. "Lun8 09:00"' },
      { 'INSTRUCCIONES': '4. Complete las lecturas en m³ para cada punto de medición' },
      { 'INSTRUCCIONES': '5. NO modifique los nombres de las columnas' },
      { 'INSTRUCCIONES': '6. Puede agregar múltiples filas para diferentes fechas' },
      { 'INSTRUCCIONES': '7. Guarde el archivo y súbalo en el sistema' },
      { 'INSTRUCCIONES': '' },
      { 'INSTRUCCIONES': '📊 Total de puntos de medición: ' + columnOrder.length }
    ]
    
    const wsInstrucciones = XLSX.utils.json_to_sheet(instrucciones)
    wsInstrucciones['!cols'] = [{ wch: 80 }]
    XLSX.utils.book_append_sheet(wb, wsInstrucciones, 'Instrucciones')

    const fecha = new Date().toISOString().split('T')[0]
    XLSX.writeFile(wb, `Plantilla_Lecturas_Diarias_${fecha}.xlsx`)
  }

  // Calcular progreso
  const calculateProgress = () => {
    const total = dailyReadingPointsData.categories.reduce((acc, cat) => 
      acc + cat.points.length, 0
    )
    const completed = Object.keys(readings).filter(key => readings[key] && readings[key].trim() !== '').length
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
                    Agregar Lecturas Diarias de Agua
                  </h1>
                  <p className="text-muted-foreground">
                    Selecciona fecha, sube Excel y verifica datos antes de guardar
                  </p>
                </div>
              </div>
            </div>

            {/* Indicador de pasos */}
            {step < 4 && (
              <div className="mb-8">
                <div className="flex items-center justify-between max-w-3xl mx-auto">
                  {[
                    { num: 1, title: 'Seleccionar Fecha', icon: CalendarIcon },
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

            {/* PASO 1: Seleccionar Fecha */}
            {step === 1 && (
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <CalendarIcon className="h-6 w-6 text-primary" />
                    <div>
                      <h3 className="text-xl font-semibold">Paso 1: Seleccionar Fecha</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Elige la fecha para la lectura diaria
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Fecha de la Lectura
                      </label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full px-4 py-3 border border-muted rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <Button 
                      className="w-full mt-4" 
                      size="lg"
                      onClick={createDateEntry}
                      disabled={loading || !selectedDate}
                    >
                      {loading ? (
                        <>
                          <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                          Creando...
                        </>
                      ) : (
                        <>
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          Crear Fecha y Continuar
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
                        Fecha: {selectedDate}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                      <FileSpreadsheetIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground mb-4">
                        Sube un archivo Excel con las lecturas diarias
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
                            <li>• Columna "Punto de Medición", "Nombre" o "ID"</li>
                            <li>• Columna "Lectura", "Valor" o "m³"</li>
                            <li>• Los nombres deben coincidir con los puntos de medición</li>
                          </ul>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={downloadTemplate}
                          className="ml-4 bg-white dark:bg-gray-800"
                        >
                          <DownloadIcon className="h-4 w-4 mr-2" />
                          Descargar Plantilla
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
                {/* Barra de progreso */}
                <Card className="mb-6">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 mr-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">
                            Progreso: {progress.completed} de {progress.total} lecturas
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
                      <Button 
                        size="lg"
                        onClick={saveReadings}
                        disabled={loading || progress.completed === 0}
                      >
                        {loading ? (
                          <>
                            <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                            Guardando...
                          </>
                        ) : (
                          <>
                            <SaveIcon className="h-4 w-4 mr-2" />
                            Guardar Lecturas
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Tabs de Categorías */}
                <div className="mb-6 overflow-x-auto">
                  <div className="flex gap-2 border-b border-muted pb-2">
                    {dailyReadingPointsData.categories.map(category => {
                      const categoryPoints = category.points
                      const categoryCompleted = categoryPoints.filter(p => {
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
                            ({categoryCompleted}/{categoryPoints.length})
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Lista de lecturas por categoría */}
                {dailyReadingPointsData.categories.map(category => {
                  if (category.id !== activeCategory) return null

                  return (
                    <Card key={category.id}>
                      <CardHeader>
                        <div>
                          <h3 className="text-lg font-semibold">{category.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Vista previa: Día Anterior, Lectura Actual y Consumo
                          </p>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {/* Header de columnas */}
                        <div className="grid grid-cols-[2fr,1fr,1fr,1fr] gap-4 pb-3 border-b border-muted mb-3">
                          <div className="text-xs font-semibold text-muted-foreground uppercase">Punto de Medición</div>
                          <div className="text-xs font-semibold text-muted-foreground uppercase text-right">Día Anterior</div>
                          <div className="text-xs font-semibold text-muted-foreground uppercase text-right">Lectura Actual</div>
                          <div className="text-xs font-semibold text-muted-foreground uppercase text-right">Consumo</div>
                        </div>

                        <div className="space-y-2">
                          {category.points.map(point => {
                            const currentValue = readings[point.id] || ''
                            const isCompleted = currentValue.trim() !== ''
                            
                            const previousValue = previousDayReadings ? 
                              (previousDayReadings[point.id] || 0) : null
                            const consumoValue = consumption[point.id]

                            return (
                              <div 
                                key={point.id}
                                className={`grid grid-cols-[2fr,1fr,1fr,1fr] gap-4 p-3 rounded-lg border transition-all items-center ${
                                  isCompleted 
                                    ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/10' 
                                    : 'border-muted bg-muted/30'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="flex-shrink-0">
                                    {isCompleted ? (
                                      <CheckCircle2Icon className="h-5 w-5 text-green-500" />
                                    ) : (
                                      <AlertCircleIcon className="h-5 w-5 text-muted-foreground" />
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-sm">{point.name}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{point.id}</p>
                                  </div>
                                </div>

                                <div className="text-right">
                                  {previousValue !== null ? (
                                    <span className="text-sm text-blue-600 font-medium">
                                      {parseFloat(previousValue).toLocaleString()}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">N/A</span>
                                  )}
                                </div>

                                <div className="text-right">
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={currentValue}
                                    onChange={(e) => handleReadingChange(point.id, e.target.value)}
                                    className="w-full px-2 py-1 text-sm font-semibold text-right border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="0.00"
                                  />
                                </div>

                                <div className="text-right">
                                  {consumoValue !== undefined && !isNaN(consumoValue) ? (
                                    <span className={`text-sm font-bold ${
                                      consumoValue >= 0 ? 'text-purple-600' : 'text-red-600'
                                    }`}>
                                      {consumoValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">--</span>
                                  )}
                                </div>
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

            {/* PASO 4: Confirmación de Éxito */}
            {step === 4 && (
              <div className="max-w-2xl mx-auto">
                <Card className="border-green-200 bg-green-50/50">
                  <CardContent className="pt-12 pb-12">
                    <div className="text-center">
                      <div className="mb-6 flex justify-center">
                        <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
                          <CheckCircle2Icon className="h-16 w-16 text-green-600" />
                        </div>
                      </div>

                      <h2 className="text-3xl font-bold text-green-800 mb-3">
                        ¡Lecturas Guardadas Exitosamente!
                      </h2>

                      <p className="text-lg text-green-700 mb-6">
                        {success}
                      </p>

                      <div className="bg-white rounded-lg p-6 mb-8 border border-green-200">
                        <div className="grid grid-cols-2 gap-6 text-center">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Fecha</p>
                            <p className="text-2xl font-bold text-primary">{selectedDate}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Lecturas</p>
                            <p className="text-2xl font-bold text-green-600">{progress.completed}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mb-8 text-left">
                        <h3 className="text-lg font-semibold mb-4 text-center">Resumen por Categoría</h3>
                        <div className="space-y-3">
                          {dailyReadingPointsData.categories.map(category => {
                            const categoryPoints = category.points
                            const categoryCompleted = categoryPoints.filter(p => {
                              return readings[p.id] && readings[p.id].trim() !== ''
                            }).length

                            return (
                              <div key={category.id} className="bg-white rounded-lg p-4 border border-green-200">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-foreground">{category.name}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">
                                      {categoryCompleted} de {categoryPoints.length}
                                    </span>
                                    <CheckCircle2Icon className="h-5 w-5 text-green-600" />
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      <div className="flex gap-4 justify-center">
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={() => window.location.href = '/'}
                          className="border-green-300 text-green-700 hover:bg-green-50"
                        >
                          Ir al Dashboard
                        </Button>
                        <Button
                          size="lg"
                          onClick={resetForm}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Agregar Otra Fecha
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </main>
        </div>
      </div>
    </RedirectIfNotAuth>
  )
}
