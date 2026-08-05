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
  AlertTriangleIcon,
  CalendarIcon,
  Loader2Icon,
  FileSpreadsheetIcon,
  EyeIcon,
  DownloadIcon,
  ListOrderedIcon,
  XIcon
} from 'lucide-react'
import { RedirectIfNotAuth } from '../components/RedirectIfNotAuth'
import { getTableNameByYear, AVAILABLE_YEARS, DEFAULT_YEAR } from '../utils/tableHelpers'
import PointsOrderModal, { applyOrderToCategories } from '../components/PointsOrderModal'
import { usePersistedState } from '../hooks/usePersistedState'
import { predictionService } from '../services/predictionService'
import { fetchRecentHistoricalData } from '../lib/predictionMapping'
import { POZO_LABELS } from '../lib/pozoLabels'

// Sincroniza último consumo + predicción (1 semana adelante) hacia el Google Sheet externo.
// Best-effort: nunca lanza, siempre resuelve { ok, error? } para que saveReadings()
// pueda mostrar una advertencia visible sin bloquear el éxito del guardado principal.
async function syncPredictionToSheet(consumoTableName, consumptionData, weekNumber) {
  const DEBUG = '[DEBUG-SYNC]'

  try {
    // ── Capa 1: Supabase – obtener histórico ──────────────────────────
    console.debug(`${DEBUG} [Capa 1] Fetching histórico de ${consumoTableName}, limit=12`)
    const { data: historico, error: supaError } = await fetchRecentHistoricalData(
      supabase,
      consumoTableName,
      12
    )
    if (supaError) {
      console.error(`${DEBUG} [Capa 1] Error Supabase:`, supaError)
      throw new Error(`Supabase: ${supaError.message}`)
    }
    if (!historico || historico.length === 0) {
      throw new Error('No hay suficiente histórico para generar una predicción')
    }
    console.debug(`${DEBUG} [Capa 1] Histórico OK, ${historico.length} semanas`)

    // ── Capa 2: API de predicción ─────────────────────────────────────
    const withTimeout = (promise, ms) =>
      Promise.race([
        promise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Tiempo de espera agotado consultando el modelo')), ms)
        ),
      ])

    console.debug(`${DEBUG} [Capa 2] Enviando a predictionService.predict...`)
    const result = await withTimeout(predictionService.predict(historico), 15000)
    const predictions = result?.predictions_m3
    if (!predictions) {
      console.error(`${DEBUG} [Capa 2] Respuesta de predicción sin formato esperado:`, result)
      throw new Error('La respuesta de predicción no tiene el formato esperado')
    }
    console.debug(`${DEBUG} [Capa 2] Predicciones recibidas:`, predictions)

    // ── Capa 3: Construir payload (consumo + predicción) ──────────────
    const nowIso = new Date().toISOString()
    const payload = Object.keys(POZO_LABELS).map((key) => {
      const consumptionKey = `${key.replace('l_', '')}_${weekNumber}`
      return {
        fecha: nowIso,
        medidor: POZO_LABELS[key],
        semana: weekNumber,
        consumo: consumptionData[consumptionKey] ?? null,
        prediccion: predictions[key] ?? null,
      }
    })
    console.debug(`${DEBUG} [Capa 3] Payload construido (${payload.length} pozos):`, payload)

    // ── Capa 4: Enviar a Google Sheet (Apps Script) ───────────────────
    // Se usa FormData + mode:'no-cors' para evitar el preflight CORS que
    // Apps Script no responde. El body se envía como campo "data" y el
    // Apps Script lo lee desde e.parameter.data.
    const scriptUrl = import.meta.env.VITE_SCRIPT_PREDICT_URL
    if (!scriptUrl) throw new Error('VITE_SCRIPT_PREDICT_URL no está configurada')

    const formData = new FormData()
    formData.append('data', JSON.stringify(payload))

    console.debug(`${DEBUG} [Capa 4] POST (FormData+no-cors) a Apps Script: ${scriptUrl}`)
    console.debug(`${DEBUG} [Capa 4] Payload enviado:`, payload)
    await fetch(scriptUrl, {
      method: 'POST',
      mode: 'no-cors',
      body: formData,
    })
    // Con no-cors la respuesta es opaca: no podemos leer status/body,
    // pero si el fetch no lanza, la petición salió correctamente.
    console.debug(`${DEBUG} [Capa 4] Fetch completado (respuesta opaca, no-cors)`)

    return { ok: true }
  } catch (err) {
    console.error(`${DEBUG} Error en syncPredictionToSheet:`, err)
    return { ok: false, error: err.message || 'Error desconocido al sincronizar la predicción' }
  }
}

export default function AddWeeklyReadingsPage() {
  // IDs que solo aparecen en plantilla Excel, NO en la plataforma web
  const templateOnlyIds = [
    'comedor_2_residencias_10_15', 'comedor_2_caldera_2', 'la_choza',
    'biblioteca_starbucks', 'aulas_3_starbucks', 'residencias_1_antiguo',
    'residencias_4', 'residencias_7', 'residencias_8', 'alberca',
    'arquitectura_e1', 'arquitectura_anexo', 'ptar_riego',
    'cedes_tinaco_riego', 'estadio_borrego_pluvial', 'campo_soft_bol_ciudad',
    'cedes_ciudad', 'escamilla_banos_alumnos_ciudad'
  ]

  // Casos especiales con factor multiplicador
  const specialCases = {
    'circuito_6_residencias': 10,
    'circuito_8_campus': 10,
    'medidor_general_pozos': 10,
    'campo_soft_bol': 10
  }

  // Fórmulas ajustadas: consumo final = consumo_base - consumo(factores)
  const newFormulas1 = ['residencias_10_15', 'estadio_banorte', 'estadio_banorte_purgas','aulas_4_sur', 'aulas_4_maestros']
  const newFormulas2 = ['nucleo', 'aulas_3']
  const factorConsumption1 = ['caffenio', 'estadio_azul', 'wellnes_te_purga','cdi_1', 'cdi_2']
  const factorConsumption2 = ['expedition', 'hub', 'basanti', 'aulas_3_sr_latino']

  // Mapa derivado: formulaId → [factorIds a restar]
  const adjustmentMap = {}
  newFormulas1.forEach((id, i) => { adjustmentMap[id] = [factorConsumption1[i]] })
  const _chunkSize = factorConsumption2.length / newFormulas2.length
  newFormulas2.forEach((id, i) => {
    adjustmentMap[id] = factorConsumption2.slice(i * _chunkSize, (i + 1) * _chunkSize)
  })

  // Estados principales con persistencia
  const [selectedYear, setSelectedYear, clearSelectedYear] = usePersistedState('weekly_selectedYear', DEFAULT_YEAR)
  const [step, setStep, clearStep] = usePersistedState('weekly_step', 1)
  
  // Estados para la semana con persistencia
  const [weekNumber, setWeekNumber, clearWeekNumber] = usePersistedState('weekly_weekNumber', null)
  const [startDate, setStartDate, clearStartDate] = usePersistedState('weekly_startDate', '')
  const [endDate, setEndDate, clearEndDate] = usePersistedState('weekly_endDate', '')
  
  // Estados para Excel y datos con persistencia
  const [readings, setReadings, clearReadings] = usePersistedState('weekly_readings', {})
  const [excelData, setExcelData, clearExcelData] = usePersistedState('weekly_excelData', null)
  
  // Estados para cálculo de consumo con persistencia
  const [previousWeekReadings, setPreviousWeekReadings] = useState(null)
  const [consumption, setConsumption, clearConsumption] = usePersistedState('weekly_consumption', {})
  
  // Estados de UI (no persistidos)
  const [excelFile, setExcelFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [activeCategory, setActiveCategory, clearActiveCategory] = usePersistedState('weekly_activeCategory', 'pozos_servicios')
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [orderedCategoriesData, setOrderedCategoriesData] = useState(() => 
    applyOrderToCategories(consumptionPointsData.categories)
  )
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [savedCount, setSavedCount] = useState(0)
  const [predictionSyncWarning, setPredictionSyncWarning] = useState(null)
  
  // Función para limpiar todos los datos persistidos
  const clearAllPersistedData = () => {
    clearStep()
    clearWeekNumber()
    clearStartDate()
    clearEndDate()
    clearReadings()
    clearExcelData()
    clearConsumption()
    clearActiveCategory()
    console.log('✅ Datos persistidos limpiados')
  }

  // Función para cancelar y volver al inicio
  const handleCancel = () => {
    clearAllPersistedData()
    setStep(1)
    setExcelFile(null)
    setLoading(false)
    setError(null)
    setSuccess(null)
    setPreviousWeekReadings(null)
    setPredictionSyncWarning(null)
    console.log('🔄 Proceso cancelado, volviendo al inicio')
  }

  // Función para cerrar el modal de éxito y volver al inicio
  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false)
    clearAllPersistedData()
    setStep(1)
    setExcelFile(null)
    setError(null)
    setSuccess(null)
    setPreviousWeekReadings(null)
    setPredictionSyncWarning(null)
    console.log('✅ Proceso completado, volviendo al inicio')
  }

  // Calcular siguiente número de semana al cargar
  useEffect(() => {
    fetchNextWeekNumber()
  }, [selectedYear])

  const fetchNextWeekNumber = async () => {
    try {
      const tableName = getTableNameByYear(selectedYear)
      const { data, error: fetchError } = await supabase
        .from(tableName)
        .select('l_numero_semana')
        .order('l_numero_semana', { ascending: false })
        .limit(1)

      if (fetchError) throw fetchError

      const nextWeek = data && data.length > 0 ? data[0].l_numero_semana + 1 : 1
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
      let tableName = getTableNameByYear(selectedYear)
      let previousWeekNum = weekNumber - 1
      
      // Si es la semana 1, buscar la última semana del año anterior
      if (weekNumber === 1) {
        const previousYear = String(parseInt(selectedYear) - 1)
        tableName = getTableNameByYear(previousYear)
        
        // Obtener la última semana del año anterior
        const { data: lastWeekData, error: lastWeekError } = await supabase
          .from(tableName)
          .select('l_numero_semana')
          .order('l_numero_semana', { ascending: false })
          .limit(1)
          .single()
        
        if (lastWeekError) {
          if (lastWeekError.code === 'PGRST116') {
            console.log('ℹ️ No hay datos del año anterior:', previousYear)
            setPreviousWeekReadings(null)
            return null
          }
          throw lastWeekError
        }
        
        previousWeekNum = lastWeekData.l_numero_semana
        console.log(`📅 Semana 1 del ${selectedYear}: usando última semana del ${previousYear} (semana ${previousWeekNum})`)
      }
      
      const { data, error: fetchError } = await supabase
        .from(tableName)
        .select('*')
        .eq('l_numero_semana', previousWeekNum)
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
      console.log('✅ Lecturas de semana anterior cargadas:', previousWeekNum, 'de la tabla', tableName)
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

      const tableName = getTableNameByYear(selectedYear)
      // Tabla de consumo (todo en minúsculas)
      const consumoTableName = `lecturas_semana_agua_consumo_${selectedYear}`
      
      // Crear la semana en tabla de lecturas
      const { error: insertError } = await supabase
        .from(tableName)
        .insert([{
          l_numero_semana: weekNumber,
          l_fecha_inicio: startDate,
          l_fecha_fin: endDate
        }])

      if (insertError) throw insertError

      console.log('✅ Semana creada en tabla de lecturas:', weekNumber)

      // Crear la semana en tabla de consumo
      const { error: consumoInsertError } = await supabase
        .from(consumoTableName)
        .insert([{
          l_numero_semana: weekNumber,
          l_fecha_inicio: startDate,
          l_fecha_fin: endDate
        }])

      if (consumoInsertError) {
        console.warn('⚠️ Error al crear semana en tabla de consumo:', consumoInsertError)
        // No lanzar error, continuar de todas formas
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
      
      jsonData.forEach(row => {
        const pointName = row[nameColumn]?.toString().trim()
        const reading = row[readingColumn]
        
        if (!pointName || !reading) return

        let found = false

        // Buscar el punto de consumo por nombre o ID
        consumptionPointsData.categories.forEach(category => {
          category.points.filter(p => !templateOnlyIds.includes(p.id)).forEach(point => {
            if (!point.noRead) {
              // Coincidencia exacta o parcial (case insensitive)
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
            }
          })
        })

        if (!found) {
          unmatched.push(pointName)
        }
      })

      setReadings(newReadings)

      // Obtener semana anterior y calcular consumo
      const prevWeek = await fetchPreviousWeekReadings()
      
      // Calcular consumo
      const newConsumption = {}
      consumptionPointsData.categories.forEach(category => {
        category.points.filter(p => !templateOnlyIds.includes(p.id)).forEach(point => {
          if (!point.noRead) {
            const key = `${point.id}_${weekNumber}`
            const currentValue = parseFloat(newReadings[key])
            
            if (!isNaN(currentValue) && prevWeek) {
              const previousValue = parseFloat(prevWeek[`l_${point.id}`]) || 0
              const factor = specialCases[point.id] || 1
              const consumption = (currentValue - previousValue) * factor
              newConsumption[key] = consumption
            }
          }
        })
      })
      
      // Segunda pasada: aplicar ajustes (restar consumos de factores)
      Object.entries(adjustmentMap).forEach(([formulaId, factorIds]) => {
        const formulaKey = `${formulaId}_${weekNumber}`
        if (newConsumption[formulaKey] !== undefined) {
          factorIds.forEach(factorId => {
            const factorKey = `${factorId}_${weekNumber}`
            const factorVal = newConsumption[factorKey]
            if (factorVal !== undefined && !isNaN(factorVal)) {
              newConsumption[formulaKey] -= factorVal
            }
          })
        }
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

  // Guardar lecturas en Supabase (método POST normal)
  const saveReadings = async () => {
    if (!weekNumber) return

    setLoading(true)
    setError(null)

    try {
      // Preparar objeto con todas las lecturas
      const weekData = {
        l_numero_semana: weekNumber,
        l_fecha_inicio: startDate,
        l_fecha_fin: endDate
      }

      // Agregar todas las lecturas al objeto (solo puntos habilitados)
      let readingsCount = 0
      orderedCategoriesData.forEach(category => {
        category.points.filter(p => !templateOnlyIds.includes(p.id)).forEach(point => {
          if (!point.noRead) {
            const key = `${point.id}_${weekNumber}`
            const value = readings[key]
            
            if (value && value.trim() !== '') {
              const numValue = parseFloat(value)
              if (!isNaN(numValue)) {
                weekData[`l_${point.id}`] = numValue
                readingsCount++
              }
            }
          }
        })
      })

      console.log('💾 Guardando datos:', weekData)
      console.log(`📊 Total de lecturas a guardar: ${readingsCount}`)

      if (readingsCount === 0) {
        throw new Error('No hay lecturas para guardar')
      }

      const tableName = getTableNameByYear(selectedYear)
      
      // Verificar que la semana existe
      const { data: existingWeek, error: checkError } = await supabase
        .from(tableName)
        .select('l_id, l_numero_semana')
        .eq('l_numero_semana', weekNumber)
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
      
      // UPDATE - Actualizar la semana que creamos
      const { data, error: updateError } = await supabase
        .from(tableName)
        .update(weekData)
        .eq('l_numero_semana', weekNumber)
        .select()

      if (updateError) {
        console.error('❌ Error de Supabase:', updateError)
        console.error('❌ Detalles del error:', JSON.stringify(updateError, null, 2))
        throw new Error(`Error al actualizar: ${updateError.message}`)
      }

      if (!data || data.length === 0) {
        throw new Error('No se actualizó ningún registro')
      }
      
      console.log('✅ Lecturas guardadas exitosamente:', data)
      console.log(`✅ Se guardaron ${readingsCount} lecturas en la semana ${weekNumber}`)
      
      // Guardar consumo en tabla de consumo (todo en minúsculas)
      const consumoTableName = `lecturas_semana_agua_consumo_${selectedYear}`
      const consumoData = {
        l_numero_semana: weekNumber,
        l_fecha_inicio: startDate,
        l_fecha_fin: endDate
      }

      // Agregar consumo calculado (solo puntos habilitados)
      let consumoCount = 0
      orderedCategoriesData.forEach(category => {
        category.points.filter(p => !templateOnlyIds.includes(p.id)).forEach(point => {
          if (!point.noRead) {
            const key = `${point.id}_${weekNumber}`
            const consumoValue = consumption[key]
            
            if (consumoValue !== undefined && !isNaN(consumoValue)) {
              consumoData[`l_${point.id}`] = consumoValue
              consumoCount++
            }
          }
        })
      })

      if (consumoCount > 0) {
        console.log('💾 Guardando consumo:', consumoData)
        console.log(`📊 Total de consumos a guardar: ${consumoCount}`)

        // Intentar insertar o actualizar consumo
        const { error: consumoError } = await supabase
          .from(consumoTableName)
          .upsert(consumoData, { 
            onConflict: 'l_numero_semana',
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

      // Sincronizar consumo + predicción con el Google Sheet externo (best-effort, no bloquea el guardado)
      const syncResult = await syncPredictionToSheet(consumoTableName, consumption, weekNumber)
      setPredictionSyncWarning(
        syncResult.ok
          ? null
          : `No se pudo sincronizar la predicción con el registro externo: ${syncResult.error}`
      )

      setSavedCount(readingsCount)
      setShowSuccessModal(true)

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

    // Recalcular consumo para este punto
    if (previousWeekReadings && value && value.trim() !== '') {
      const currentValue = parseFloat(value)
      if (!isNaN(currentValue)) {
        const previousValue = parseFloat(previousWeekReadings[`l_${pointId}`]) || 0
        
        const factor = specialCases[pointId] || 1
        const baseConsumption = (currentValue - previousValue) * factor

        setConsumption(prev => {
          const updated = { ...prev, [key]: baseConsumption }

          // Si el punto editado es una fórmula ajustada, aplicar su ajuste
          if (adjustmentMap[pointId]) {
            let adjusted = baseConsumption
            adjustmentMap[pointId].forEach(factorId => {
              const factorVal = updated[`${factorId}_${weekNumber}`]
              if (factorVal !== undefined && !isNaN(factorVal)) {
                adjusted -= factorVal
              }
            })
            updated[key] = adjusted
          }

          // Si el punto editado es un factor de alguna fórmula, recalcular esa fórmula
          Object.entries(adjustmentMap).forEach(([formulaId, factorIds]) => {
            if (factorIds.includes(pointId)) {
              const formulaKey = `${formulaId}_${weekNumber}`
              const formulaCurrent = parseFloat(newReadings[formulaKey])
              if (!isNaN(formulaCurrent)) {
                const formulaPrev = parseFloat(previousWeekReadings[`l_${formulaId}`]) || 0
                const formulaFactor = specialCases[formulaId] || 1
                let formulaAdjusted = (formulaCurrent - formulaPrev) * formulaFactor
                factorIds.forEach(fId => {
                  const fVal = updated[`${fId}_${weekNumber}`]
                  if (fVal !== undefined && !isNaN(fVal)) formulaAdjusted -= fVal
                })
                updated[formulaKey] = formulaAdjusted
              }
            }
          })

          return updated
        })
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
    setPredictionSyncWarning(null)
    fetchNextWeekNumber()
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
    // Lista de IDs permitidos en la plantilla (mismo set que semanales)
    const allowedIds = [
        'medidor_general_pozos', 'pozo_11', 'pozo_14', 'pozo_12', 'pozo_7', 'pozo_3',
        'pozo_4_riego', 'pozo_8_riego', 'pozo_15_riego',
        'circuito_8_campus', 'auditorio_luis_elizondo', 'cdb2', 'cdb2_banos_nuevos_2025',
        'arena_borrego', 'farnville', 'em_box', 'edificio_negocios_daf', 'aulas_6',
        'domo_cultural', 'wellness_parque_central_tunel', 'wellness_registro',
        'parque_central_registro', 'wellness_edificio', 'wellness_super_salads',
        'wellness_torre_enfriamiento', 'wellness_alberca', 'centrales_comedor_1_principal',
        'centrales_dona_tota', 'centrales_subway', 'centrales_carls_jr',
        'centrales_little_cesars', 'centrales_grill_team', 'centrales_chilaquiles',
        'centrales_tec_food', 'centrales_oxxo', 'comedor_central_tunel', 'administrativo',
        'biotecnologia', 'escuela_arte_caldera_1', 'ciap_oriente', 'ciap_centro',
        'ciap_poniente', 'ciap_green_shake', 'ciap_andatti', 'ciap_dc_jochos',
        'crepaso', 'el_negro', 'aulas_5', 'ciap_starbucks', 'ciap_super_salads',
        'ciap_sotano', 'reflexion', 'comedor_2_residencias_10_15', 'residencias_10_15','caffenio',
        'residencias_10_15_llenado', 'comedor_2_caldera_2', 'la_choza', 'cedes_cisterna','san_huevito',
        'cedes_site', 'cedes_site_bomba', 'nucleo', 'expedition','expedition_bread', 'expedition_matthew','hub', 
        , 'cedes_e2', 'e2_beiker', 'e2_evobike', 'e2_pancho_de_rigo',
        'e2_bebedero_nube', 'aulas_1', 'rectoria_norte', 'pabellon_la_carreta',
        'rectoria_sur', 'aulas_2', 'cetec', 'biblioteca', 'biblioteca_nikkori',
        'biblioteca_nectar_works', 'biblioteca_tim_horton', 'biblioteca_starbucks',
        'aulas_3', 'basanti', 'aulas_3_sr_latino', 'aulas_3_starbucks', 'centrales_sur',
        'aulas_4_norte','aulas_4_centro',  'circuito_6_residencias', 'residencias_1_antiguo', 'residencias_2_ote',
        'residencias_2_pte', 'residencias_3', 'residencias_4', 'residencias_5',
        'residencias_7', 'residencias_8', 'correos', 'alberca', 'residencias_abc',
        'residencias_abc_lavanderia','mil_mascaras', 'circuito_4_a7_ce', 'aulas_7', 'cah3_torre_enfriamiento',
        'caldera_3', 'la_dia', 'aulas_4_sur', 'cdi_1', 'aulas_4_maestros','cdi_2',  'centro_congresos',
        'jubileo', 'aulas_4_oxxo', 'circuito_planta_fisica', 'estacionamiento_e1',
        'arquitectura_e1', 'arquitectura_anexo', 'megacentral_te_2', 'escamilla_banos_trabajadores',
        'estadio_banorte', 'estadio_banorte_te', 'campus_norte_edificios_ciudad',
        'estadio_azul', 'circuito_megacentral', 'megacentral_te_4', 'ptar_riego',
        'pozo_4_riego_alt', 'pozo_8_riego_alt', 'pozo_15_riego_alt', 'campus_norte_ciudad_riego',
        'comedor_d_ciudad', 'estadio_banorte_purgas', 'wellness_cisterna_pluvial_purgas',
        'wellness_suavizador_purga','wellness_te_purga', 'wellness_te_rebosadero', 
        'cedes_tinaco_riego_pluvial', 'megacentral_te_purgas', 'megacentral_suavizador_purga',
        'cah3_te_purgas', 'residencias_10_15_te_purga', 'estadio_borrego_pluvial',
        'ciap_cisterna_pluvial', 'campo_soft_bol', 'cedes_ciudad',
        'estacionamiento_e3', 'guarderia', 'naranjos', 'casa_solar', 'escamilla_banos_alumnos',
        'residencias_11_ciudad', 'residencias_12_ciudad', 'residencias_13_1_ciudad',
        'residencias_13_2_ciudad', 'residencias_13_3_ciudad', 'residencias_15_sotano'
      ]

    const templateData = []
    const aguaCiudadOrder = [
      'campo_soft_bol',
      'cedes_ciudad',
      'estacionamiento_e3',
      'guarderia',
      'naranjos',
      'casa_solar'
    ]
    const aguaCiudadOrderIndex = new Map(aguaCiudadOrder.map((id, idx) => [id, idx]))

    consumptionPointsData.categories.forEach(category => {
      const pointsInTemplate = category.points.filter(point => allowedIds.includes(point.id))
      const orderedPoints =
        category.id === 'agua_ciudad'
          ? [...pointsInTemplate].sort((a, b) => {
              const aIdx = aguaCiudadOrderIndex.has(a.id) ? aguaCiudadOrderIndex.get(a.id) : Number.POSITIVE_INFINITY
              const bIdx = aguaCiudadOrderIndex.has(b.id) ? aguaCiudadOrderIndex.get(b.id) : Number.POSITIVE_INFINITY
              return aIdx - bIdx
            })
          : pointsInTemplate

      orderedPoints.forEach(point => {
        templateData.push({
          'Punto de Consumo': point.name,
          'ID': point.id,
          'Lectura': ''
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
    XLSX.utils.book_append_sheet(wb, ws, 'Lecturas Semanales')
    
    // Hoja de instrucciones
    const instrucciones = [
      { 'INSTRUCCIONES': 'Plantilla de Lecturas Semanales de Agua' },
      { 'INSTRUCCIONES': '' },
      { 'INSTRUCCIONES': '📋 INSTRUCCIONES:' },
      { 'INSTRUCCIONES': '' },
      { 'INSTRUCCIONES': '1. Complete la columna "Lectura" con los valores en m³' },
      { 'INSTRUCCIONES': '2. NO modifique las columnas "Punto de Consumo" ni "ID"' },
      { 'INSTRUCCIONES': '3. Deje vacíos los campos que no tenga datos' },
      { 'INSTRUCCIONES': '4. Guarde el archivo y súbalo en el sistema' },
      { 'INSTRUCCIONES': '' },
      { 'INSTRUCCIONES': `📊 Total de puntos: ${templateData.length}` }
    ]
    
    const wsInstrucciones = XLSX.utils.json_to_sheet(instrucciones)
    wsInstrucciones['!cols'] = [{ wch: 80 }]
    XLSX.utils.book_append_sheet(wb, wsInstrucciones, 'Instrucciones')

    const fecha = new Date().toISOString().split('T')[0]
    XLSX.writeFile(wb, `Plantilla_Lecturas_Semanales_${fecha}.xlsx`)
  }

  // Calcular progreso
  const calculateProgress = () => {
    const total = consumptionPointsData.categories.reduce((acc, cat) => 
      acc + cat.points.filter(p => !p.noRead).length, 0
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
                    Agregar Lecturas Semanales de Agua
                  </h1>
                  <p className="text-muted-foreground">
                    Crea semana, sube Excel y verifica datos antes de guardar - Año {selectedYear}
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

            {predictionSyncWarning && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
                <AlertTriangleIcon className="h-5 w-5 text-yellow-600" />
                <p className="text-yellow-800">{predictionSyncWarning}</p>
              </div>
            )}

            {/* PASO 1: Crear Semana */}
            {step === 1 && (
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <CalendarIcon className="h-6 w-6 text-primary" />
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
                          className="w-full px-4 py-3 border border-muted rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
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
                          className="w-full px-4 py-3 border border-muted rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
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
                    <FileSpreadsheetIcon className="h-6 w-6 text-primary" />
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
                        Sube un archivo Excel con las lecturas semanales
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
                          variant="outline"
                          size="lg"
                          onClick={handleCancel}
                          disabled={loading}
                          className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                        >
                          <XIcon className="h-4 w-4 mr-2" />
                          Cancelar
                        </Button>
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

                {/* Tabs de Categorías */}
                <div className="mb-6 overflow-x-auto">
                  <div className="flex gap-2 border-b border-muted pb-2">
                    {orderedCategoriesData.map(category => {
                      const categoryPoints = category.points.filter(p => !p.noRead && !templateOnlyIds.includes(p.id))
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
                {orderedCategoriesData.map(category => {
                  if (category.id !== activeCategory) return null

                  const filteredPoints = category.points.filter(p => !p.noRead && !templateOnlyIds.includes(p.id))

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
                        {/* Header de columnas */}
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
                              (previousWeekReadings[`l_${point.id}`] || 0) : null
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
                      {/* Icono de éxito animado */}
                      <div className="mb-6 flex justify-center">
                        <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
                          <CheckCircle2Icon className="h-16 w-16 text-green-600" />
                        </div>
                      </div>

                      {/* Título */}
                      <h2 className="text-3xl font-bold text-green-800 mb-3">
                        ¡Lecturas Guardadas Exitosamente!
                      </h2>

                      {/* Mensaje de confirmación */}
                      <p className="text-lg text-green-700 mb-6">
                        {success}
                      </p>

                      {/* Detalles de la operación */}
                      <div className="bg-white rounded-lg p-6 mb-8 border border-green-200">
                        <div className="grid grid-cols-3 gap-6 text-center">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Semana</p>
                            <p className="text-2xl font-bold text-primary">{weekNumber}</p>
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

                      {/* Resumen por categoría */}
                      <div className="mb-8 text-left">
                        <h3 className="text-lg font-semibold mb-4 text-center">Resumen por Categoría</h3>
                        <div className="space-y-3">
                          {orderedCategoriesData.map(category => {
                            const categoryPoints = category.points.filter(p => !p.noRead && !templateOnlyIds.includes(p.id))
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

                      {/* Botones de acción */}
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
                    Las lecturas semanales de agua se han guardado correctamente
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                <p className="text-lg font-semibold mb-2">
                  {savedCount} lecturas guardadas
                </p>
                <p className="text-sm text-muted-foreground">
                  Semana {weekNumber}: {startDate} - {endDate}
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

      {/* Modal de Ordenamiento */}
      <PointsOrderModal
        open={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        categories={consumptionPointsData.categories}
        onOrderSaved={handleOrderSaved}
      />
    </RedirectIfNotAuth>
  )
}


