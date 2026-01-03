import { useState, useEffect } from 'react'
import { DashboardHeader } from "../components/dashboard-header"
import { DashboardSidebar } from "../components/dashboard-sidebar"
import { Card, CardContent, CardHeader } from "../components/ui/card"
import { Button } from "../components/ui/button"
import gasConsumptionPointsData from '../lib/gas-consumption-points.json'
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
import { getGasTableNameByYear, AVAILABLE_YEARS, DEFAULT_YEAR } from '../utils/tableHelpers'

export default function AddWeeklyGasReadingsPage() {
  // Estados principales
  const [selectedYear, setSelectedYear] = useState(DEFAULT_YEAR)
  const [step, setStep] = useState(1) // 1: crear semana, 2: subir excel, 3: verificar datos, 4: confirmación
  
  // Estados para la semana
  const [weekNumber, setWeekNumber] = useState(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  
  // Estados para Excel y datos
  const [excelFile, setExcelFile] = useState(null)
  const [readings, setReadings] = useState({})
  const [excelData, setExcelData] = useState(null)
  
  // Estados para cálculo de consumo
  const [previousWeekReadings, setPreviousWeekReadings] = useState(null)
  const [consumption, setConsumption] = useState({})
  
  // Estados de UI
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [activeCategory, setActiveCategory] = useState('acometidas_campus')

  // Calcular siguiente número de semana al cargar
  useEffect(() => {
    fetchNextWeekNumber()
  }, [selectedYear])

  const fetchNextWeekNumber = async () => {
    try {
      const tableName = getGasTableNameByYear(selectedYear)
      const { data, error: fetchError } = await supabase
        .from(tableName)
        .select('numero_semana')
        .order('numero_semana', { ascending: false })
        .limit(1)

      if (fetchError) throw fetchError

      const nextWeek = data && data.length > 0 ? data[0].numero_semana + 1 : 1
      setWeekNumber(nextWeek)
      console.log('📅 Siguiente número de semana:', nextWeek)
    } catch (err) {
      console.error('❌ Error al obtener número de semana:', err)
      setWeekNumber(1)
    }
  }

  // Obtener lecturas de la semana anterior
  const fetchPreviousWeekReadings = async () => {
    if (!weekNumber) {
      setPreviousWeekReadings(null)
      return null
    }

    try {
      let tableName = getGasTableNameByYear(selectedYear)
      let previousWeekNum = weekNumber - 1

      // Si es la semana 1, buscar la última semana del año anterior
      if (weekNumber === 1) {
        const previousYear = parseInt(selectedYear) - 1
        tableName = getGasTableNameByYear(previousYear.toString())
        
        console.log(`ℹ️ Es semana 1 de ${selectedYear}, buscando última semana de ${previousYear}`)
        
        // Buscar la última semana del año anterior
        const { data: lastWeekData, error: lastWeekError } = await supabase
          .from(tableName)
          .select('*')
          .order('numero_semana', { ascending: false })
          .limit(1)
          .single()

        if (lastWeekError) {
          if (lastWeekError.code === 'PGRST116') {
            console.log(`ℹ️ No existe ninguna semana en ${previousYear}`)
            setPreviousWeekReadings(null)
            return null
          }
          throw lastWeekError
        }

        setPreviousWeekReadings(lastWeekData)
        console.log(`✅ Lecturas de última semana de ${previousYear} cargadas:`, lastWeekData.numero_semana)
        return lastWeekData
      }
      
      const { data, error: fetchError } = await supabase
        .from(tableName)
        .select('*')
        .eq('numero_semana', previousWeekNum)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          console.log('ℹ️ No existe la semana anterior:', previousWeekNum)
          setPreviousWeekReadings(null)
          return null
        }
        throw fetchError
      }

      setPreviousWeekReadings(data)
      console.log('✅ Lecturas de semana anterior cargadas:', previousWeekNum)
      return data
    } catch (err) {
      console.error('❌ Error al obtener semana anterior:', err)
      setPreviousWeekReadings(null)
      return null
    }
  }

  // Crear nueva semana
  const createWeek = async () => {
    if (!startDate || !endDate) {
      setError('Por favor completa las fechas de inicio y fin')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const tableName = getGasTableNameByYear(selectedYear)
      const consumoTableName = `lecturas_semanales_gas_consumo_${selectedYear}`
      
      // Crear la semana en tabla de lecturas
      const { error: insertError } = await supabase
        .from(tableName)
        .insert([{
          numero_semana: weekNumber,
          fecha_inicio: startDate,
          fecha_fin: endDate
        }])

      if (insertError) throw insertError

      console.log('✅ Semana creada en tabla de lecturas:', weekNumber)

      // Crear la semana en tabla de consumo
      const { error: consumoInsertError } = await supabase
        .from(consumoTableName)
        .insert([{
          numero_semana: weekNumber,
          fecha_inicio: startDate,
          fecha_fin: endDate
        }])

      if (consumoInsertError) {
        console.warn('⚠️ Error al crear semana en tabla de consumo:', consumoInsertError)
      } else {
        console.log('✅ Semana creada en tabla de consumo:', weekNumber)
      }

      setSuccess(`Semana ${weekNumber} creada exitosamente en ambas tablas`)
      setStep(2)
      
    } catch (err) {
      console.error('❌ Error al crear semana:', err)
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
        throw new Error('No se pudieron detectar las columnas necesarias. Asegúrate de tener columnas para nombre y lectura.')
      }

      const newReadings = {}
      let matched = 0
      let unmatched = []
      
      jsonData.forEach(row => {
        const pointName = row[nameColumn]?.toString().trim()
        const reading = row[readingColumn]
        
        if (!pointName || !reading) return

        let found = false

        gasConsumptionPointsData.categories.forEach(category => {
          category.points.forEach(point => {
            const pointNameLower = pointName.toLowerCase()
            const pointIdLower = point.id.toLowerCase()
            const pointDisplayNameLower = point.name.toLowerCase()
            
            if (pointNameLower === pointIdLower || 
                pointNameLower === pointDisplayNameLower ||
                pointIdLower.includes(pointNameLower) ||
                pointDisplayNameLower.includes(pointNameLower)) {
              const key = `${point.id}_${weekNumber}`
              newReadings[key] = reading.toString()
              found = true
              matched++
            }
          })
        })

        if (!found) {
          unmatched.push(pointName)
        }
      })

      setReadings(newReadings)

      const prevWeek = await fetchPreviousWeekReadings()

      // Factores de multiplicación para puntos de gas
      const gasFactors = {
        'campus_acometida_principal_digital': 1,
        'campus_acometida_principal_analogica': 2.44,
        'domo_cultural': 2.34,
        'centrales_local': 2.34,
        'dona_tota': 2.34,
        'chilaquiles_tec': 1,
        'carls_junior': 2.34,
        'comedor_centrales_tec_food': 2.34,
        'davilas_grill_team': 1,
        'pizza_little_caesars': 1,
        'biotecnologia': 2.34,
        'caldera_1_leon': 2.34,
        'mega_calefaccion_1': 2.34,
        'mega_calefaccion_2': 2.34,
        'mega_calefaccion_3': 2.34,
        'mega_calefaccion_4': 2.34,
        'mega_calefaccion_5': 2.34,
        'ciap_super_salads': 2.34,
        'aulas_1': 2.34,
        'biblioteca': 2.34,
        'nikkori': 9.86,
        'nectar_works': 9.86,
        'sr_latino': 2.34,
        'arena_borrego': 2.34,
        'calefaccion_1_bryan': 2.34,
        'calefaccion_2_aerco': 2.34,
        'caldera_3': 2.34,
        'aulas_7': 2.34,
        'la_dia': 2.34,
        'aulas_4': 2.34,
        'centro_congresos_vestidores': 1.01,
        'jubileo': 0.94,
        'expedition': 2.34,
        'bread_expedition': 2.34,
        'matthew_expedition': 2.34,
        'estudiantes_acometida_principal_digital': 1,
        'estudiantes_acometida_principal_analogico': 1.54,
        'cedes': 0.98,
        'cedes_trabajadores_vestidores': 0.98,
        'caldera_2': 0.98,
        'comedor_estudiantes': 0.98,
        'residencias_4': 0.98,
        'residencias_1': 0.98,
        'residencias_2': 0.98,
        'residencias_5': 0.98,
        'residencias_8': 0.98,
        'residencias_7': 0.98,
        'residencias_3': 1.52,
        'residencias_abc_calefaccion': 1.52,
        'residencias_abc_regaderas': 1.52,
        'residencias_abc_locales_comida': 1,
        'campus_norte_acometida_externa': 1.14,
        'campus_norte_acometida_interna': 1.14,
        'campus_norte_comedor_d': 0.97,
        'campus_norte_edificio_d_calefaccion': 0.97,
        'estadio_borrego_acometida_digital': 1,
        'estadio_borrego_acometida_analogica': 1.16,
        'estadio_yarda': 1,
        'wellness_acometida_digital': 1,
        'wellness_acometida_analogica': 1.2,
        'wellness_supersalads': 1.2,
        'wellness_general_calefaccion': 1,
        'wellness_calentador_sotano_regaderas': 1,
        'wellness_alberca': 1,
        'auditorio_luis_elizondo': 1,
        'pabellon_tec_semillero': 1,
        'pabellon_tec_cocina_estudiantes_2do_piso': 1.48,
        'guarderia': 1,
        'escamilla': 1,
        'casa_solar': 1,
        'estudiantes_11': 1,
        'estudiantes_12': 1,
        'estudiantes_13': 1,
        'estudiantes_15_y_10': 1
      }

      const newConsumption = {}
      gasConsumptionPointsData.categories.forEach(category => {
        category.points.forEach(point => {
          const key = `${point.id}_${weekNumber}`
          const currentValue = parseFloat(newReadings[key])
          
          if (!isNaN(currentValue) && prevWeek) {
            const previousValue = parseFloat(prevWeek[point.id]) || 0
            const factor = gasFactors[point.id] || 1
            const consumption = (currentValue - previousValue) * factor
            newConsumption[key] = consumption
            console.log(`📊 ${point.id}: current=${currentValue}, prev=${previousValue}, factor=${factor}, consumo=${consumption}`)
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
    if (!weekNumber) return

    setLoading(true)
    setError(null)

    try {
      const weekData = {
        numero_semana: weekNumber,
        fecha_inicio: startDate,
        fecha_fin: endDate
      }

      let readingsCount = 0
      gasConsumptionPointsData.categories.forEach(category => {
        category.points.forEach(point => {
          const key = `${point.id}_${weekNumber}`
          const value = readings[key]
          
          if (value && value.trim() !== '') {
            const numValue = parseFloat(value)
            if (!isNaN(numValue)) {
              weekData[point.id] = numValue
              readingsCount++
            }
          }
        })
      })

      console.log('💾 Guardando datos:', weekData)
      console.log(`📊 Total de lecturas a guardar: ${readingsCount}`)

      if (readingsCount === 0) {
        throw new Error('No hay lecturas para guardar')
      }

      const tableName = getGasTableNameByYear(selectedYear)
      
      const { data: existingWeek, error: checkError } = await supabase
        .from(tableName)
        .select('id, numero_semana')
        .eq('numero_semana', weekNumber)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ Error verificando semana:', checkError)
        throw new Error(`Error verificando semana: ${checkError.message}`)
      }

      if (!existingWeek) {
        console.error('❌ La semana no existe en la base de datos')
        throw new Error(`La semana ${weekNumber} no existe. Por favor créala primero.`)
      }

      console.log('✅ Semana encontrada:', existingWeek)
      
      const { data, error: updateError } = await supabase
        .from(tableName)
        .update(weekData)
        .eq('numero_semana', weekNumber)
        .select()

      if (updateError) {
        console.error('❌ Error de Supabase:', updateError)
        throw new Error(`Error al actualizar: ${updateError.message}`)
      }

      if (!data || data.length === 0) {
        throw new Error('No se actualizó ningún registro')
      }
      
      console.log('✅ Lecturas guardadas exitosamente:', data)
      
      const consumoTableName = `lecturas_semanales_gas_consumo_${selectedYear}`
      const consumoData = {
        numero_semana: weekNumber,
        fecha_inicio: startDate,
        fecha_fin: endDate
      }

      let consumoCount = 0
      gasConsumptionPointsData.categories.forEach(category => {
        category.points.forEach(point => {
          const key = `${point.id}_${weekNumber}`
          const consumoValue = consumption[key]
          
          if (consumoValue !== undefined && !isNaN(consumoValue)) {
            consumoData[point.id] = consumoValue
            consumoCount++
          }
        })
      })

      if (consumoCount > 0) {
        console.log('💾 Guardando consumo:', consumoData)

        const { error: consumoError } = await supabase
          .from(consumoTableName)
          .upsert(consumoData, { 
            onConflict: 'numero_semana',
            ignoreDuplicates: false 
          })

        if (consumoError) {
          console.warn('⚠️ Error guardando consumo:', consumoError)
          setSuccess(`✅ ${readingsCount} lecturas guardadas. Advertencia: No se pudo guardar el consumo`)
        } else {
          console.log('✅ Consumo guardado exitosamente')
          setSuccess(`✅ ${readingsCount} lecturas y ${consumoCount} consumos guardados exitosamente`)
        }
      } else {
        setSuccess(`✅ ${readingsCount} lecturas guardadas exitosamente`)
      }
      
      setStep(4)

    } catch (error) {
      console.error('❌ Error guardando:', error)
      setError(`Error al guardar: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Manejar edición de lectura y recalcular consumo
  const handleReadingChange = (pointId, value) => {
    const key = `${pointId}_${weekNumber}`
    const newReadings = { ...readings, [key]: value }
    setReadings(newReadings)

    if (previousWeekReadings && value && value.trim() !== '') {
      const currentValue = parseFloat(value)
      if (!isNaN(currentValue)) {
        const previousValue = parseFloat(previousWeekReadings[pointId]) || 0
        
        // Factores de multiplicación para puntos de gas
        const gasFactors = {
          'campus_acometida_principal_digital': 1,
          'campus_acometida_principal_analogica': 2.44,
          'domo_cultural': 2.34,
          'centrales_local': 2.34,
          'dona_tota': 2.34,
          'chilaquiles_tec': 1,
          'carls_junior': 2.34,
          'comedor_centrales_tec_food': 2.34,
          'davilas_grill_team': 1,
          'pizza_little_caesars': 1,
          'biotecnologia': 2.34,
          'caldera_1_leon': 2.34,
          'mega_calefaccion_1': 2.34,
          'mega_calefaccion_2': 2.34,
          'mega_calefaccion_3': 2.34,
          'mega_calefaccion_4': 2.34,
          'mega_calefaccion_5': 2.34,
          'ciap_super_salads': 2.34,
          'aulas_1': 2.34,
          'biblioteca': 2.34,
          'nikkori': 9.86,
          'nectar_works': 9.86,
          'sr_latino': 2.34,
          'arena_borrego': 2.34,
          'calefaccion_1_bryan': 2.34,
          'calefaccion_2_aerco': 2.34,
          'caldera_3': 2.34,
          'aulas_7': 2.34,
          'la_dia': 2.34,
          'aulas_4': 2.34,
          'centro_congresos_vestidores': 1.01,
          'jubileo': 0.94,
          'expedition': 2.34,
          'bread_expedition': 2.34,
          'matthew_expedition': 2.34,
          'estudiantes_acometida_principal_digital': 1,
          'estudiantes_acometida_principal_analogico': 1.54,
          'cedes': 0.98,
          'cedes_trabajadores_vestidores': 0.98,
          'caldera_2': 0.98,
          'comedor_estudiantes': 0.98,
          'residencias_4': 0.98,
          'residencias_1': 0.98,
          'residencias_2': 0.98,
          'residencias_5': 0.98,
          'residencias_8': 0.98,
          'residencias_7': 0.98,
          'residencias_3': 1.52,
          'residencias_abc_calefaccion': 1.52,
          'residencias_abc_regaderas': 1.52,
          'residencias_abc_locales_comida': 1,
          'campus_norte_acometida_externa': 1.14,
          'campus_norte_acometida_interna': 1.14,
          'campus_norte_comedor_d': 0.97,
          'campus_norte_edificio_d_calefaccion': 0.97,
          'estadio_borrego_acometida_digital': 1,
          'estadio_borrego_acometida_analogica': 1.16,
          'estadio_yarda': 1,
          'wellness_acometida_digital': 1,
          'wellness_acometida_analogica': 1.2,
          'wellness_supersalads': 1.2,
          'wellness_general_calefaccion': 1,
          'wellness_calentador_sotano_regaderas': 1,
          'wellness_alberca': 1,
          'auditorio_luis_elizondo': 1,
          'pabellon_tec_semillero': 1,
          'pabellon_tec_cocina_estudiantes_2do_piso': 1.48,
          'guarderia': 1,
          'escamilla': 1,
          'casa_solar': 1,
          'estudiantes_11': 1,
          'estudiantes_12': 1,
          'estudiantes_13': 1,
          'estudiantes_15_y_10': 1
        }
        
        const factor = gasFactors[pointId] || 1
        const consumoValue = (currentValue - previousValue) * factor
        
        setConsumption(prev => ({ ...prev, [key]: consumoValue }))
      }
    }
  }

  // Reiniciar formulario
  const resetForm = () => {
    setStep(1)
    setStartDate('')
    setEndDate('')
    setExcelFile(null)
    setReadings({})
    setExcelData(null)
    setError(null)
    setSuccess(null)
    fetchNextWeekNumber()
  }

  // Descargar plantilla de Excel
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
    
    ws['!cols'] = [
      { wch: 70 },
      { wch: 35 },
      { wch: 15 }
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Lecturas Semanales Gas')
    
    const totalPuntos = gasConsumptionPointsData.categories.reduce((acc, cat) => acc + cat.points.length, 0)
    
    const instrucciones = [
      { 'INSTRUCCIONES': 'Plantilla de Lecturas Semanales de Gas - Aquanet' },
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
    XLSX.writeFile(wb, `Plantilla_Lecturas_Semanales_Gas_${fecha}.xlsx`)
  }

  // Calcular progreso
  const calculateProgress = () => {
    const total = gasConsumptionPointsData.categories.reduce((acc, cat) => 
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
                    Agregar Lecturas Semanales de Gas
                  </h1>
                  <p className="text-muted-foreground">
                    Crea semana, sube Excel y verifica datos antes de guardar - Año {selectedYear}
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Año:</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => {
                        setSelectedYear(e.target.value)
                        resetForm()
                      }}
                      className="px-3 py-2 border border-muted rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      {AVAILABLE_YEARS.map(year => (
                        <option key={year} value={year}>{year}</option>
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
                    { num: 1, title: 'Crear Semana', icon: CalendarIcon },
                    { num: 2, title: 'Subir Excel', icon: UploadIcon },
                    { num: 3, title: 'Verificar y Guardar', icon: EyeIcon }
                  ].map((s, idx) => (
                    <div key={s.num} className="flex items-center flex-1">
                      <div className="flex flex-col items-center">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                          step >= s.num 
                            ? 'bg-orange-500 border-orange-500 text-white' 
                            : 'border-muted text-muted-foreground'
                        }`}>
                          <s.icon className="h-5 w-5" />
                        </div>
                        <p className={`text-sm mt-2 font-medium ${step >= s.num ? 'text-orange-500' : 'text-muted-foreground'}`}>
                          {s.title}
                        </p>
                      </div>
                      {idx < 2 && (
                        <div className={`flex-1 h-0.5 mx-4 ${step > s.num ? 'bg-orange-500' : 'bg-muted'}`} />
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

            {/* PASO 1: Crear Semana */}
            {step === 1 && (
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <CalendarIcon className="h-6 w-6 text-orange-500" />
                    <div>
                      <h3 className="text-xl font-semibold">Paso 1: Crear Nueva Semana</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Define las fechas de la semana {weekNumber}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Número de Semana
                      </label>
                      <input
                        type="text"
                        value={`Semana ${weekNumber || '...'}`}
                        disabled
                        className="w-full px-4 py-3 border border-muted rounded-lg bg-muted text-sm font-medium"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Fecha de Inicio
                        </label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full px-4 py-3 border border-muted rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Fecha de Fin
                        </label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full px-4 py-3 border border-muted rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>

                    <Button 
                      className="w-full mt-4" 
                      size="lg"
                      onClick={createWeek}
                      disabled={loading || !startDate || !endDate}
                    >
                      {loading ? (
                        <>
                          <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                          Creando...
                        </>
                      ) : (
                        <>
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          Crear Semana y Continuar
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
                    <FileSpreadsheetIcon className="h-6 w-6 text-orange-500" />
                    <div>
                      <h3 className="text-xl font-semibold">Paso 2: Subir Archivo Excel</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Semana {weekNumber}: {startDate} - {endDate}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                      <FileSpreadsheetIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground mb-4">
                        Sube un archivo Excel con las lecturas semanales de gas
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
                <Card className="mb-6">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 mr-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">
                            Progreso: {progress.completed} de {progress.total} lecturas
                          </span>
                          <span className="text-sm font-bold text-orange-500">
                            {progress.percentage}%
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-3">
                          <div 
                            className="bg-orange-500 h-3 rounded-full transition-all duration-300"
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

                <div className="mb-6 overflow-x-auto">
                  <div className="flex gap-2 border-b border-muted pb-2">
                    {gasConsumptionPointsData.categories.map(category => {
                      const categoryPoints = category.points
                      const categoryCompleted = categoryPoints.filter(p => {
                        const key = `${p.id}_${weekNumber}`
                        return readings[key] && readings[key].trim() !== ''
                      }).length

                      return (
                        <button
                          key={category.id}
                          onClick={() => setActiveCategory(category.id)}
                          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                            activeCategory === category.id
                              ? 'bg-orange-500 text-white shadow-sm'
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

                {gasConsumptionPointsData.categories.map(category => {
                  if (category.id !== activeCategory) return null

                  const filteredPoints = category.points

                  return (
                    <Card key={category.id}>
                      <CardHeader>
                        <div>
                          <h3 className="text-lg font-semibold">{category.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Vista previa: Semana Anterior, Lectura Actual y Consumo
                          </p>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-[2fr,1fr,1fr,1fr] gap-4 pb-3 border-b border-muted mb-3">
                          <div className="text-xs font-semibold text-muted-foreground uppercase">Punto de Consumo</div>
                          <div className="text-xs font-semibold text-muted-foreground uppercase text-right">Semana Anterior</div>
                          <div className="text-xs font-semibold text-muted-foreground uppercase text-right">Lectura Actual</div>
                          <div className="text-xs font-semibold text-muted-foreground uppercase text-right">Consumo</div>
                        </div>

                        <div className="space-y-2">
                          {filteredPoints.map(point => {
                            const key = `${point.id}_${weekNumber}`
                            const currentValue = readings[key] || ''
                            const isCompleted = currentValue.trim() !== ''
                            
                            const previousValue = previousWeekReadings ? 
                              (previousWeekReadings[point.id] || 0) : null
                            const consumoValue = consumption[key]

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
                                    className="w-full px-2 py-1 text-sm font-semibold text-right border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                        ¡Lecturas de Gas Guardadas Exitosamente!
                      </h2>

                      <p className="text-lg text-green-700 mb-6">
                        {success}
                      </p>

                      <div className="bg-white rounded-lg p-6 mb-8 border border-green-200">
                        <div className="grid grid-cols-3 gap-6 text-center">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Semana</p>
                            <p className="text-2xl font-bold text-orange-500">{weekNumber}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Período</p>
                            <p className="text-sm font-semibold text-foreground">
                              {startDate} - {endDate}
                            </p>
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
                          {gasConsumptionPointsData.categories.map(category => {
                            const categoryPoints = category.points.filter(p => !p.noRead)
                            const categoryCompleted = categoryPoints.filter(p => {
                              const key = `${p.id}_${weekNumber}`
                              return readings[key] && readings[key].trim() !== ''
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
                          Agregar Otra Semana
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


