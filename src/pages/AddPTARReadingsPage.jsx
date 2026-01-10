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
  DownloadIcon,
  Droplets
} from 'lucide-react'
import { RedirectIfNotAuth } from '../components/RedirectIfNotAuth'
import { usePersistedState } from '../hooks/usePersistedState'

// Definición de puntos de medición para PTAR en orden específico
const ptarReadingPoints = [
  { id: 'medidor_entrada', name: 'Medidor Entrada', columnName: 'Medidor Entrada' },
  { id: 'medidor_salida', name: 'Medidor salida', columnName: 'Medidor salida' },
  { id: 'ar', name: 'AR', columnName: 'AR' },
  { id: 'at', name: 'AT', columnName: 'AT' },
  { id: 'recirculacion', name: 'Recirculacion', columnName: 'Recirculacion' },
  { id: 'total_dia', name: 'Total dia', columnName: 'Total dia' }
]

export default function AddPTARReadingsPage() {
  // Estados principales con persistencia
  const [step, setStep, clearStep] = usePersistedState('ptar_step', 1)
  
  // Estados para fecha y hora con persistencia
  const [selectedDate, setSelectedDate, clearSelectedDate] = usePersistedState('ptar_selectedDate', '')
  const [selectedTime, setSelectedTime, clearSelectedTime] = usePersistedState('ptar_selectedTime', '')
  
  // Estados para Excel y datos con persistencia
  const [readings, setReadings, clearReadings] = usePersistedState('ptar_readings', {})
  const [excelData, setExcelData, clearExcelData] = usePersistedState('ptar_excelData', null)
  
  // Estados de UI (no persistidos)
  const [excelFile, setExcelFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  
  // Función para limpiar todos los datos persistidos
  const clearAllPersistedData = () => {
    clearStep()
    clearSelectedDate()
    clearSelectedTime()
    clearReadings()
    clearExcelData()
    console.log('✅ Datos persistidos limpiados')
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
      
      // Verificar si ya existe
      const { data: existing } = await supabase
        .from('lecturas_ptar')
        .select('id')
        .eq('fecha', selectedDate)
        .single()

      if (existing) {
        setSuccess(`Fecha ${selectedDate} ya existe. Puedes editarla.`)
      } else {
        // Crear la entrada
        const { error: insertError } = await supabase
          .from('lecturas_ptar')
          .insert([{
            fecha: selectedDate,
            hora: selectedTime || '09:00'
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

      console.log('📊 Datos del Excel PTAR:', jsonData)
      setExcelData(jsonData)

      if (!jsonData || jsonData.length === 0) {
        throw new Error('El archivo Excel está vacío')
      }

      const firstRow = jsonData[0]
      const columns = Object.keys(firstRow)
      
      // Formato horizontal PTAR: Fecha, Hora, y columnas de mediciones
      const hasFecha = columns.some(col => /fecha/i.test(col))
      const hasHora = columns.some(col => /hora/i.test(col))
      const isHorizontalFormat = hasFecha && hasHora

      console.log('🔍 Formato detectado:', isHorizontalFormat ? 'HORIZONTAL' : 'VERTICAL')

      let newReadings = {}
      let matched = 0
      let unmatched = []

      if (isHorizontalFormat) {
        // FORMATO HORIZONTAL: usar primera fila
        const row = jsonData[0]
        
        // Mapeo de columnas PTAR
        const columnMapping = {
          'medidor entrada': 'medidor_entrada',
          'medidor salida': 'medidor_salida',
          'ar': 'ar',
          'at': 'at',
          'recirculacion': 'recirculacion',
          'total dia': 'total_dia'
        }

        Object.keys(row).forEach(columnName => {
          // Saltar columnas de fecha/hora
          if (/fecha/i.test(columnName) || /hora/i.test(columnName)) {
            return
          }

          const value = row[columnName]
          if (value === undefined || value === null || value === '') return

          const columnLower = columnName.toLowerCase().trim()
          const pointId = columnMapping[columnLower]

          if (pointId) {
            newReadings[pointId] = value.toString()
            matched++
          } else {
            unmatched.push(columnName)
          }
        })
      }

      setReadings(newReadings)

      let message = `✅ Excel procesado: ${matched} lecturas cargadas`
      if (unmatched.length > 0) {
        message += `. ${unmatched.length} columnas no encontradas`
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
        fecha: selectedDate,
        hora: selectedTime || '09:00'
      }

      let readingsCount = 0
      ptarReadingPoints.forEach(point => {
        const value = readings[point.id]
        
        if (value && value.trim() !== '') {
          const numValue = parseFloat(value)
          if (!isNaN(numValue)) {
            readingData[point.id] = numValue
            readingsCount++
          }
        }
      })

      console.log('💾 Guardando datos PTAR:', readingData)

      if (readingsCount === 0) {
        throw new Error('No hay lecturas para guardar')
      }

      // Verificar que la fecha existe
      const { data: existingDate, error: checkError } = await supabase
        .from('lecturas_ptar')
        .select('id, fecha')
        .eq('fecha', selectedDate)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        throw new Error(`Error verificando fecha: ${checkError.message}`)
      }

      if (!existingDate) {
        throw new Error(`La fecha ${selectedDate} no existe. Por favor créala primero.`)
      }

      // UPDATE
      const { data, error: updateError } = await supabase
        .from('lecturas_ptar')
        .update(readingData)
        .eq('fecha', selectedDate)
        .select()

      if (updateError) {
        console.error('❌ Error de Supabase:', updateError)
        throw new Error(`Error al actualizar: ${updateError.message}`)
      }

      if (!data || data.length === 0) {
        throw new Error('No se actualizó ningún registro')
      }
      
      console.log('✅ Lecturas PTAR guardadas exitosamente:', data)
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

  // Manejar edición de lectura
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

  // Reiniciar formulario
  const resetForm = () => {
    setStep(1)
    setSelectedDate('')
    setSelectedTime('')
    setExcelFile(null)
    setReadings({})
    setExcelData(null)
    setError(null)
    setSuccess(null)
  }

  // Volver a ingresar datos con Excel (mantener en paso 3)
  const returnToExcelUpload = () => {
    setExcelFile(null)
    setReadings({})
    setExcelData(null)
    setError(null)
    setSuccess('Por favor, selecciona un nuevo archivo Excel para cargar los datos')
  }

  // Descargar plantilla de Excel
  const downloadTemplate = () => {
    const templateData = []
    
    // Crear fila de ejemplo
    const today = new Date()
    const exampleRow = {
      'Fecha': today.toISOString().split('T')[0],
      'Hora': '9:00'
    }
    
    // Agregar columnas en orden específico
    ptarReadingPoints.forEach(point => {
      exampleRow[point.columnName] = 0
    })
    
    templateData.push(exampleRow)

    const ws = XLSX.utils.json_to_sheet(templateData)
    
    // Ajustar anchos de columna
    const colWidths = [
      { wch: 12 },  // Fecha
      { wch: 8 }    // Hora
    ]
    ptarReadingPoints.forEach(() => {
      colWidths.push({ wch: 15 })
    })
    ws['!cols'] = colWidths

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Lecturas PTAR')
    
    const instrucciones = [
      { 'INSTRUCCIONES': 'Plantilla de Lecturas PTAR - Aquanet' },
      { 'INSTRUCCIONES': '' },
      { 'INSTRUCCIONES': '📋 INSTRUCCIONES:' },
      { 'INSTRUCCIONES': '' },
      { 'INSTRUCCIONES': '1. Formato HORIZONTAL: cada FILA es una fecha' },
      { 'INSTRUCCIONES': '2. Columnas: Fecha, Hora, Medidor Entrada, Medidor salida, AR, AT, Recirculacion, Total dia' },
      { 'INSTRUCCIONES': '3. Complete las lecturas en m³' },
      { 'INSTRUCCIONES': '4. Total dia se calcula automáticamente (AR + AT + Recirculacion)' },
      { 'INSTRUCCIONES': '5. NO modifique los nombres de las columnas' },
      { 'INSTRUCCIONES': '6. Guarde el archivo y súbalo en el sistema' }
    ]
    
    const wsInstrucciones = XLSX.utils.json_to_sheet(instrucciones)
    wsInstrucciones['!cols'] = [{ wch: 80 }]
    XLSX.utils.book_append_sheet(wb, wsInstrucciones, 'Instrucciones')

    const fecha = new Date().toISOString().split('T')[0]
    XLSX.writeFile(wb, `Plantilla_Lecturas_PTAR_${fecha}.xlsx`)
  }

  // Calcular progreso
  const calculateProgress = () => {
    const total = ptarReadingPoints.length
    const completed = ptarReadingPoints.filter(p => {
      return readings[p.id] && readings[p.id].trim() !== ''
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
                  <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
                    <Droplets className="h-8 w-8 text-blue-600" />
                    Agregar Lecturas PTAR
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
                      <h3 className="text-xl font-semibold">Paso 1: Seleccionar Fecha y Hora</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Elige la fecha y hora para la lectura PTAR
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
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
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Hora
                        </label>
                        <input
                          type="time"
                          value={selectedTime}
                          onChange={(e) => setSelectedTime(e.target.value)}
                          className="w-full px-4 py-3 border border-muted rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
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
                        Fecha: {selectedDate} | Hora: {selectedTime || '09:00'}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                      <FileSpreadsheetIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground mb-4">
                        Sube un archivo Excel con las lecturas PTAR
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
                            <li>• Columnas: Fecha, Hora, Medidor Entrada, Medidor salida, AR, AT, Recirculacion, Total dia</li>
                            <li>• Formato horizontal: cada fila es una fecha</li>
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
                      <div className="flex gap-3">
                        <label className="inline-block">
                          <input
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={(e) => {
                              returnToExcelUpload()
                              handleExcelUpload(e)
                            }}
                            className="hidden"
                          />
                          <Button 
                            variant="outline"
                            size="lg"
                            asChild
                          >
                            <span>
                              <UploadIcon className="h-4 w-4 mr-2" />
                              Volver a Ingresar Datos
                            </span>
                          </Button>
                        </label>
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
                    </div>
                  </CardContent>
                </Card>

                {/* Lista de lecturas PTAR */}
                <Card>
                  <CardHeader>
                    <div>
                      <h3 className="text-lg font-semibold">Lecturas PTAR</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Revisa y edita las lecturas de la planta
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {ptarReadingPoints.map(point => {
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
                                <AlertCircleIcon className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm">{point.name}</p>
                              <p className="text-xs text-muted-foreground">{point.id}</p>
                            </div>

                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                step="0.01"
                                value={value}
                                onChange={(e) => handleReadingChange(point.id, e.target.value)}
                                disabled={isTotal}
                                className={`w-40 px-3 py-2 border rounded-lg text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary ${
                                  isTotal ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : ''
                                }`}
                                placeholder="0.00"
                              />
                              <span className="text-sm text-muted-foreground">m³</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-blue-900 dark:text-blue-100 font-medium">
                        💡 El <strong>Total dia</strong> se calcula automáticamente (AR + AT + Recirculacion)
                      </p>
                    </div>
                  </CardContent>
                </Card>
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
                        ¡Lecturas PTAR Guardadas!
                      </h2>

                      <p className="text-lg text-green-700 mb-6">
                        {success}
                      </p>

                      <div className="bg-white rounded-lg p-6 mb-8 border border-green-200">
                        <div className="grid grid-cols-3 gap-6 text-center">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Fecha</p>
                            <p className="text-xl font-bold text-primary">{selectedDate}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Hora</p>
                            <p className="text-xl font-bold text-primary">{selectedTime || '09:00'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Lecturas</p>
                            <p className="text-xl font-bold text-green-600">{progress.completed}</p>
                          </div>
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
