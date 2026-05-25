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
  Loader2Icon,
  RefreshCwIcon,
  DatabaseIcon,
  CalculatorIcon,
  UploadIcon,
  Trash2Icon,
  FileSpreadsheetIcon,
  DownloadIcon,
  DropletIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
  AlertTriangleIcon
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

export default function EditMonthlyWaterReadingsPage() {
  const [selectedYear, setSelectedYear] = useState(DEFAULT_YEAR)
  const [selectedMonth, setSelectedMonth] = useState(null)
  const [readings, setReadings] = useState({})
  const [activeCategory, setActiveCategory] = useState('pozos_servicios')
  const [searchTerm, setSearchTerm] = useState('')
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved')
  const firstInputRef = useRef(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [savedCount, setSavedCount] = useState(0)

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Estados para edición manual de consumo
  const [editConsumoMode, setEditConsumoMode] = useState(false)
  const [consumoReadings, setConsumoReadings] = useState({})
  const [loadingConsumo, setLoadingConsumo] = useState(false)
  const [showConsumoConfirm, setShowConsumoConfirm] = useState(false)
  const [savingConsumo, setSavingConsumo] = useState(false)
  const [showConsumoSuccess, setShowConsumoSuccess] = useState(false)
  const [consumoSavedCount, setConsumoSavedCount] = useState(0)

  // Obtener puntos de la categoría activa (para edición de consumo)
  const getActiveCategoryPoints = () => {
    const category = consumptionPointsData.categories.find(c => c.id === activeCategory)
    if (!category) return []
    return category.points.filter(p => !p.noRead && !!getMonthlyDbFieldName(p.id))
  }

  const getMonthlyDbFieldName = (pointId) => {
    const overrides = {
      caffenio: 'l_caffenio',
      campo_soft_bol_ciudad: 'l_campo_soft_bol',
      cedes_tinaco_riego: 'l_cedes_tinaco_riego_pluvial',
      escamilla_banos_alumnos_ciudad: 'l_escamilla_banos_alumnos'
    }

    if (Object.prototype.hasOwnProperty.call(overrides, pointId)) {
      return overrides[pointId]
    }

    return `l_${pointId}`
  }

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false)
    setSavedCount(0)
  }
  
  // Estado para seleccionar tipo de tabla (lecturas o consumo)
  const [targetTable, setTargetTable] = useState('lectura') // 'lectura' o 'consumo'

  // Estados para datos de Supabase
  const [existingMonths, setExistingMonths] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [excelFile, setExcelFile] = useState(null)

  // Cargar meses existentes desde Supabase cuando cambia el año o la tabla
  useEffect(() => {
    fetchExistingMonths()
  }, [selectedYear, targetTable])

  const fetchExistingMonths = async () => {
    try {
      setLoading(true)
      setError(null)

      const tableName = targetTable === 'consumo' 
        ? getMonthlyWaterConsumptionTableName() 
        : getMonthlyWaterTableName()
      console.log('🔍 Cargando desde tabla:', tableName)
      
      const { data, error: fetchError } = await supabase
        .from(tableName)
        .select('id, anio, mes')
        .eq('anio', parseInt(selectedYear))
        .order('mes', { ascending: true })

      if (fetchError) throw fetchError

      console.log('✅ Meses obtenidos desde Supabase:', data)

      const months = (data || []).map(month => ({
        id: month.id,
        year: month.anio,
        month: month.mes,
        monthName: getMonthName(month.mes)
      }))

      setExistingMonths(months)

    } catch (err) {
      console.error('❌ Error al cargar meses:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Cargar lecturas de un mes específico al seleccionarlo o cambiar tabla
  useEffect(() => {
    if (selectedMonth) {
      loadMonthReadings(selectedMonth)
    }
  }, [selectedMonth, targetTable])

  const loadMonthReadings = async (monthNumber) => {
    try {
      setLoading(true)
      const tableName = targetTable === 'consumo' 
        ? getMonthlyWaterConsumptionTableName() 
        : getMonthlyWaterTableName()
      const { data, error: fetchError } = await supabase
        .from(tableName)
        .select('*')
        .eq('anio', parseInt(selectedYear))
        .eq('mes', monthNumber)
        .single()

      if (fetchError) {
        console.log('🆕 Mes sin datos')
        setReadings({})
        return
      }

      console.log('✅ Lecturas cargadas:', data)

      // Convertir los datos de la base de datos al formato de readings
      const loadedReadings = {}
      const readingKey = `${selectedYear}_${monthNumber}`
      
      consumptionPointsData.categories.forEach(category => {
        category.points.forEach(point => {
          if (!point.noRead) {
            const dbFieldName = getMonthlyDbFieldName(point.id)
            if (!dbFieldName) return
            if (data[dbFieldName] !== null && data[dbFieldName] !== undefined) {
              const key = `${point.id}_${readingKey}`
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
    if (!category || !selectedMonth) return { completed: 0, total: 0, percentage: 0 }

    const readingKey = `${selectedYear}_${selectedMonth}`
    const activePoints = category.points.filter(p => !p.noRead && !!getMonthlyDbFieldName(p.id))
    const total = activePoints.length
    const completed = activePoints.filter(p => {
      const key = `${p.id}_${readingKey}`
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
    if (Object.keys(readings).length === 0 || !selectedMonth) return

    const timer = setTimeout(() => {
      saveReadings({ showModal: false })
    }, 3000)

    return () => clearTimeout(timer)
  }, [readings])

  // Guardar lecturas en Supabase
  const saveReadings = async ({ showModal = false } = {}) => {
    if (!selectedMonth) {
      console.warn('⚠️ No hay mes seleccionado')
      return
    }

    setAutoSaveStatus('saving')
    try {
      const readingKey = `${selectedYear}_${selectedMonth}`
      const monthData = {
        anio: parseInt(selectedYear),
        mes: selectedMonth
      }

      // Agregar todas las lecturas al objeto
      consumptionPointsData.categories.forEach(category => {
        category.points.forEach(point => {
          if (!point.noRead) {
            const key = `${point.id}_${readingKey}`
            const value = readings[key]

            const dbFieldName = getMonthlyDbFieldName(point.id)
            if (!dbFieldName) return

            if (value === undefined || value === null || value.trim() === '') {
              monthData[dbFieldName] = null
            } else {
              const parsed = parseFloat(value)
              monthData[dbFieldName] = Number.isFinite(parsed) ? parsed : null
            }
          }
        })
      })

      const tableLabel = targetTable === 'consumo' ? 'consumo' : 'lecturas'
      console.log(`💾 Guardando en tabla de ${tableLabel}:`, monthData)

      const tableName = targetTable === 'consumo' 
        ? getMonthlyWaterConsumptionTableName() 
        : getMonthlyWaterTableName()

      // UPSERT - Crear o actualizar (evita casos donde UPDATE no afecta filas)
      const { error: upsertError } = await supabase
        .from(tableName)
        .upsert(monthData, { onConflict: 'anio,mes' })

      if (upsertError) throw upsertError
      
      console.log(`✅ ${tableLabel.charAt(0).toUpperCase() + tableLabel.slice(1)} actualizadas exitosamente`)

      // --- Recalcular y actualizar tabla de consumo (solo cuando se editan lecturas) ---
      if (targetTable === 'lectura') {
        let consumoCount = 0
        try {
          // Determinar mes anterior
          let prevYear = parseInt(selectedYear)
          let prevMonth = selectedMonth - 1

          if (selectedMonth === 1) {
            prevYear = prevYear - 1
            prevMonth = 12
          }

          // Obtener lecturas del mes anterior desde tabla de lecturas
          const { data: prevMonthData, error: prevError } = await supabase
            .from(getMonthlyWaterTableName())
            .select('*')
            .eq('anio', prevYear)
            .eq('mes', prevMonth)
            .single()

          if (prevError) {
            console.warn(`⚠️ No se encontró mes anterior ${prevMonth}/${prevYear} para calcular consumo`)
          }

          // Casos especiales con factor 10 (mismos que semanales y AddMonthly)
          const specialCases = {
            'circuito_6_residencias': 10,
            'circuito_8_campus': 10,
            'medidor_general_pozos': 10,
            'campo_soft_bol': 10
          }

          // Calcular consumo para cada punto
          const consumoData = {
            anio: parseInt(selectedYear),
            mes: selectedMonth
          }

          consumptionPointsData.categories.forEach(category => {
            category.points.forEach(point => {
              if (point.noRead) return
              const dbFieldName = getMonthlyDbFieldName(point.id)
              if (!dbFieldName) return

              const key = `${point.id}_${readingKey}`
              const currentValue = readings[key] ? parseFloat(readings[key]) : NaN

              if (!isNaN(currentValue) && prevMonthData) {
                const previousValue = parseFloat(prevMonthData[dbFieldName]) || 0
                const factor = specialCases[point.id] || 1
                const consumption = (currentValue - previousValue) * factor
                consumoData[dbFieldName] = consumption
                consumoCount++
              }
            })
          })

          if (consumoCount > 0) {
            const consumoTableName = getMonthlyWaterConsumptionTableName()
            console.log(`📊 Guardando consumo calculado (${consumoCount} puntos) en ${consumoTableName}`)

            const { error: consumoError } = await supabase
              .from(consumoTableName)
              .upsert(consumoData, { onConflict: 'anio,mes' })

            if (consumoError) {
              console.warn('⚠️ Error guardando consumo:', consumoError)
            } else {
              console.log('✅ Consumo mensual actualizado exitosamente')
            }
          } else {
            console.warn('⚠️ No se pudo calcular consumo (sin mes anterior o sin lecturas)')
          }
        } catch (consumoErr) {
          console.warn('⚠️ Error al recalcular consumo:', consumoErr)
          // No lanzar error - las lecturas ya se guardaron correctamente
        }
      }

      setAutoSaveStatus('saved')
      setError(null)

      if (showModal) {
        const count = Object.keys(monthData).filter(k => k !== 'anio' && k !== 'mes').length
        setSavedCount(count)
        setShowSuccessModal(true)
      }
      setTimeout(() => setAutoSaveStatus('saved'), 2000)

    } catch (error) {
      console.error('❌ Error guardando:', error)
      setAutoSaveStatus('error')
      setError(error.message)
    }
  }

  //Borrar lecturas 
  const deleteReading = async () => {
      if (!selectedMonth) {
        console.warn('⚠️ No hay registro seleccionado para eliminar')
        return
      }
  
      try {
        setDeleting(true)
        console.log(`🗑️ Eliminando registro: ${selectedMonth}/${selectedYear}`)

        // Debes eliminar por ANIO y MES, no por ID
        const { error: deleteError } = await supabase
          .from('lecturas_mensuales_agua')
          .delete()
          .eq('anio', parseInt(selectedYear))
          .eq('mes', selectedMonth)

        if (deleteError) throw deleteError

        console.log('✅ Lectura eliminada exitosamente')
        
        // Limpiar estados
        setSelectedMonth(null)
        setReadings({})
        setShowDeleteConfirm(false)
        setAutoSaveStatus('saved')
        
        // Recargar la lista de fechas
        await fetchExistingMonths()
  
      } catch (error) {
        console.error('❌ Error eliminando lectura:', error)
        setError(`Error al eliminar: ${error.message}`)
      } finally {
        setDeleting(false)
      }
    }

  // Copiar lecturas del mes anterior desde Supabase
  const copyPreviousMonthReadings = async () => {
    if (!selectedMonth) {
      alert('Primero selecciona un mes')
      return
    }

    let prevYear = parseInt(selectedYear)
    let prevMonth = selectedMonth - 1
    
    // Si es enero, buscar diciembre del año anterior
    if (selectedMonth === 1) {
      prevYear = prevYear - 1
      prevMonth = 12
    }

    try {
      const tableName = targetTable === 'consumo' 
        ? getMonthlyWaterConsumptionTableName() 
        : getMonthlyWaterTableName()
      const { data, error: fetchError } = await supabase
        .from(tableName)
        .select('*')
        .eq('anio', prevYear)
        .eq('mes', prevMonth)
        .single()

      if (fetchError) throw fetchError

      if (!data) {
        alert('No se encontraron datos del mes anterior')
        return
      }

      const newReadings = {}
      const readingKey = `${selectedYear}_${selectedMonth}`
      consumptionPointsData.categories.forEach(category => {
        category.points.forEach(point => {
          if (!point.noRead) {
            const dbFieldName = getMonthlyDbFieldName(point.id)
            if (!dbFieldName) return

            if (data[dbFieldName] !== null && data[dbFieldName] !== undefined) {
              const key = `${point.id}_${readingKey}`
              newReadings[key] = data[dbFieldName].toString()
            }
          }
        })
      })

      setReadings({ ...readings, ...newReadings })
      alert(`Lecturas de ${getMonthName(prevMonth)} ${prevYear} copiadas exitosamente`)

    } catch (err) {
      console.error('❌ Error al copiar lecturas:', err)
      alert(`Error al copiar lecturas: ${err.message}`)
    }
  }

  // Procesar archivo Excel para cargar lecturas
  const handleExcelUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!selectedMonth) {
      setError('Primero selecciona un mes para cargar los datos')
      return
    }

    setExcelFile(file)
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      console.log('📊 Datos del Excel:', jsonData)

      if (!jsonData || jsonData.length === 0) {
        throw new Error('El archivo Excel está vacío')
      }

      // Detectar columnas automáticamente
      const firstRow = jsonData[0]
      const columns = Object.keys(firstRow)
      
      console.log('📋 Columnas encontradas:', columns)
      
      // Buscar columna de ID (prioridad sobre nombre)
      const idColumn = columns.find(col => col === 'ID' || col === 'id')
      
      // Buscar columnas de nombre/ID (case insensitive)
      const nameColumn = idColumn || columns.find(col => 
        /^(punto de consumo|punto|nombre|name|medidor)$/i.test(col.trim())
      ) || columns.find(col => 
        /(punto|nombre|name|medidor)/i.test(col)
      )

      // Buscar columnas de lectura (case insensitive)
      const readingColumn = columns.find(col => 
        /^(lectura|valor|value|m3|m³|reading|consumo)$/i.test(col.trim())
      ) || columns.find(col => 
        /(lectura|valor|value|m3|m³|reading|consumo)/i.test(col)
      )

      console.log('🔍 Columnas detectadas:', { idColumn, nameColumn, readingColumn })

      if (!nameColumn || !readingColumn) {
        throw new Error(`No se pudieron detectar las columnas necesarias. Columnas encontradas: ${columns.join(', ')}`)
      }

      // Procesar y mapear datos del Excel a readings
      const newReadings = { ...readings }
      let matched = 0
      let unmatched = []
      
      const readingKey = `${selectedYear}_${selectedMonth}`
      
      jsonData.forEach(row => {
        // Usar ID si existe, sino usar nombre
        const pointId = idColumn ? row[idColumn]?.toString().trim() : null
        const pointName = row[nameColumn]?.toString().trim()
        const reading = row[readingColumn]
        
        // Saltar si no hay valor de lectura o es 0 (template vacío)
        if (reading === undefined || reading === null || reading === '' || reading === 0) return
        if (!pointId && !pointName) return

        let found = false

        // Buscar el punto de consumo por ID o nombre
        consumptionPointsData.categories.forEach(category => {
          category.points.forEach(point => {
            if (!point.noRead && !found) {
              const searchId = (pointId || pointName).toLowerCase()
              const pointIdLower = point.id.toLowerCase()
              const pointDisplayNameLower = point.name.toLowerCase()
              
              // Coincidencia exacta por ID
              if (searchId === pointIdLower) {
                const key = `${point.id}_${readingKey}`
                newReadings[key] = reading.toString()
                found = true
                matched++
              }
              // Coincidencia exacta por nombre
              else if (searchId === pointDisplayNameLower) {
                const key = `${point.id}_${readingKey}`
                newReadings[key] = reading.toString()
                found = true
                matched++
              }
            }
          })
        })

        if (!found && (pointId || pointName)) {
          unmatched.push(pointId || pointName)
        }
      })

      setReadings(newReadings)

      let message = `✅ Excel cargado: ${matched} lecturas actualizadas`
      if (unmatched.length > 0) {
        message += `. ${unmatched.length} puntos no encontrados`
        console.warn('⚠️ Puntos no encontrados:', unmatched)
      }
      if (matched === 0) {
        message = '⚠️ No se encontraron lecturas válidas. Asegúrate de que el Excel tiene valores mayores a 0'
      }

      setSuccess(message)
      
      // Reset file input
      e.target.value = ''
      
    } catch (err) {
      console.error('❌ Error al procesar Excel:', err)
      setError(err.message || 'Error al procesar el archivo Excel')
    } finally {
      setLoading(false)
    }
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
        'cedes_site', 'nucleo', 'expedition','expedition_bread', 'expedition_matthew','hub', 
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
    XLSX.utils.book_append_sheet(wb, ws, 'Lecturas Mensuales')
    
    // Hoja de instrucciones
    const instrucciones = [
      { 'INSTRUCCIONES': 'Plantilla de Lecturas Mensuales de Agua' },
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
    XLSX.writeFile(wb, `Plantilla_Lecturas_Mensuales_${fecha}.xlsx`)
  }

  // Manejar cambio de lectura
  const handleReadingChange = (pointId, value) => {
    const readingKey = `${selectedYear}_${selectedMonth}`
    const key = `${pointId}_${readingKey}`
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
      .filter(p => !p.noRead)
      .filter(p => !!getMonthlyDbFieldName(p.id))
    
    if (searchTerm) {
      points = points.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return points
  }

  // === EDICIÓN MANUAL DE CONSUMO ===

  // Cargar datos de consumo cuando se activa el modo, cambia el mes o cambia la categoría
  useEffect(() => {
    if (editConsumoMode && selectedMonth) {
      loadConsumoData(selectedMonth)
    }
  }, [editConsumoMode, selectedMonth, activeCategory])

  // Cargar consumo desde tabla de consumo mensual
  const loadConsumoData = async (monthNumber) => {
    try {
      setLoadingConsumo(true)
      const consumoTableName = getMonthlyWaterConsumptionTableName()
      
      console.log('🔍 Cargando consumo desde:', consumoTableName, 'mes:', monthNumber, 'año:', selectedYear)

      const { data, error: fetchError } = await supabase
        .from(consumoTableName)
        .select('*')
        .eq('anio', parseInt(selectedYear))
        .eq('mes', monthNumber)
        .single()

      if (fetchError) {
        console.warn('⚠️ No se encontraron datos de consumo para el mes', monthNumber)
        setConsumoReadings({})
        return
      }

      // Cargar todos los puntos de la categoría activa
      const loaded = {}
      const points = getActiveCategoryPoints()
      points.forEach(point => {
        const dbField = getMonthlyDbFieldName(point.id)
        if (dbField && data[dbField] !== null && data[dbField] !== undefined) {
          loaded[point.id] = data[dbField].toString()
        }
      })

      console.log('✅ Consumo cargado:', loaded)
      setConsumoReadings(loaded)
    } catch (err) {
      console.error('❌ Error al cargar consumo:', err)
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

  // Guardar consumo manual
  const saveConsumoData = async () => {
    if (!selectedMonth) return

    try {
      setSavingConsumo(true)
      const consumoTableName = getMonthlyWaterConsumptionTableName()

      const updateData = {}
      let count = 0

      const points = getActiveCategoryPoints()
      points.forEach(point => {
        const value = consumoReadings[point.id]
        if (value !== undefined && value !== '' && value !== null) {
          const dbField = getMonthlyDbFieldName(point.id)
          if (dbField) {
            updateData[dbField] = parseFloat(value)
            count++
          }
        }
      })

      console.log(`💾 Guardando consumo manual de ${count} puntos en ${consumoTableName}`)

      const { error: updateError } = await supabase
        .from(consumoTableName)
        .update(updateData)
        .eq('anio', parseInt(selectedYear))
        .eq('mes', selectedMonth)

      if (updateError) throw updateError

      console.log('✅ Consumo actualizado exitosamente')
      setConsumoSavedCount(count)
      setShowConsumoConfirm(false)
      setShowConsumoSuccess(true)
    } catch (err) {
      console.error('❌ Error guardando consumo:', err)
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
                    Editar Lecturas Mensuales de Agua
                  </h1>
                  <p className="text-muted-foreground">
                    Edita manualmente las lecturas de consumo mensual de agua - Año {selectedYear}
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
                        setSelectedMonth(null)
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
                    onClick={fetchExistingMonths}
                    disabled={loading}
                  >
                    <RefreshCwIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Recargar
                  </Button>
                </div>
              </div>
            </div>

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

            {/*
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <DatabaseIcon className="h-5 w-5 text-primary" />
                    <span className="font-medium">Editar tabla de:</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={targetTable === 'lectura' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setTargetTable('lectura')
                        setSelectedMonth(null)
                        setReadings({})
                      }}
                      className={targetTable === 'lectura' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                    >
                      <DatabaseIcon className="h-4 w-4 mr-2" />
                      Lecturas
                    </Button>
                    <Button
                      variant={targetTable === 'consumo' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setTargetTable('consumo')
                        setSelectedMonth(null)
                        setReadings({})
                      }}
                      className={targetTable === 'consumo' ? 'bg-green-600 hover:bg-green-700' : ''}
                    >
                      <CalculatorIcon className="h-4 w-4 mr-2" />
                      Consumo
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {targetTable === 'lectura' 
                    ? '📊 Editando tabla de lecturas (valores acumulados de medidores)' 
                    : '📈 Editando tabla de consumo (diferencia entre lecturas)'}
                </p>
              </CardContent>
            </Card>

            
            */}
            

            {/* Selección de Mes */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Seleccionar Mes - {targetTable === 'consumo' ? 'Consumo' : 'Lecturas'}</h3>
                  </div>
                  
                  {selectedMonth && (
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={downloadTemplate}
                      >
                        <DownloadIcon className="h-4 w-4 mr-2" />
                        Plantilla
                      </Button>
                      <label>
                        <input
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={handleExcelUpload}
                          className="hidden"
                          disabled={loading}
                        />
                        <Button asChild variant="outline" size="sm">
                          <span>
                            <UploadIcon className="h-4 w-4 mr-2" />
                            Cargar Excel
                          </span>
                        </Button>
                      </label>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={copyPreviousMonthReadings}
                      >
                        <CopyIcon className="h-4 w-4 mr-2" />
                        Copiar Mes Anterior
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {loading && !selectedMonth ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2Icon className="h-8 w-8 animate-spin text-primary mr-3" />
                    <span className="text-muted-foreground">Cargando meses...</span>
                  </div>
                ) : error && existingMonths.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircleIcon className="h-12 w-12 text-destructive mx-auto mb-3" />
                    <p className="text-destructive font-semibold mb-2">Error al cargar meses</p>
                    <p className="text-sm text-muted-foreground mb-4">{error}</p>
                    <Button onClick={fetchExistingMonths} size="sm">
                      <RefreshCwIcon className="h-4 w-4 mr-2" />
                      Reintentar
                    </Button>
                  </div>
                ) : existingMonths.length === 0 ? (
                  <div className="text-center py-8">
                    <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground mb-2">No hay meses registrados para {selectedYear}</p>
                    <p className="text-sm text-muted-foreground">
                      Usa la página "Agregar Lecturas Mensuales" para crear un nuevo mes.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {existingMonths.map(month => (
                        <button
                          key={month.month}
                          onClick={() => setSelectedMonth(month.month)}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            selectedMonth === month.month
                              ? 'border-primary bg-primary/10 shadow-md'
                              : 'border-muted hover:border-primary/50'
                          }`}
                        >
                          <div className="text-center">
                            <p className="font-semibold text-lg">{month.monthName}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {month.year}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>

                    {!selectedMonth && !loading && (
                      <div className="text-center py-8 text-muted-foreground">
                        Selecciona un mes para editar sus lecturas
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {selectedMonth && (
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
                      const categoryPoints = category.points.filter(p => !p.noRead && !!getMonthlyDbFieldName(p.id))
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

                {/* Formulario de Entrada de Datos */}
                {consumptionPointsData.categories.map(category => {
                  if (category.id !== activeCategory) return null

                  const filteredPoints = getFilteredPoints(category)
                  const readingKey = `${selectedYear}_${selectedMonth}`

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
                              onClick={() => setShowDeleteConfirm(true)}
                              disabled={deleting}
                              className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                            >
                              <Trash2Icon className="h-4 w-4 mr-2" />
                              Eliminar Lectura
                            </Button>
                          <Button 
                            size="sm"
                            onClick={() => saveReadings({ showModal: true })}
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
                              const key = `${point.id}_${readingKey}`
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

                {/* === Toggle y Editor de Consumo Manual === */}
                <Card className="mt-6 mb-6">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <DropletIcon className="h-5 w-5 text-blue-500" />
                        <div>
                          <h3 className="text-lg font-semibold">
                            Edición Manual de Consumo - {consumptionPointsData.categories.find(c => c.id === activeCategory)?.name || 'Categoría'}
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
                                Los cambios manuales sobrescribirán el consumo calculado automáticamente para esta categoría en el mes seleccionado.
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
                  <h3 className="text-lg font-semibold">Eliminar Lectura Mensual</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Esta acción no se puede deshacer
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <p className="text-sm text-foreground mb-4">
                  ¿Estás seguro de que deseas eliminar la lectura del mes <strong>{selectedMonth}</strong>?
                </p>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-xs text-red-800 dark:text-red-200">
                    <strong>Advertencia:</strong> Se eliminarán permanentemente todas las lecturas de este mes.
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

      {/* Modal de Guardado Exitoso */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <div className="text-center">
                <CheckCircle2Icon className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  ¡Guardado Exitoso!
                </h2>
                <p className="text-muted-foreground">
                  Se guardaron {savedCount} lecturas en el mes seleccionado.
                </p>
              </div>
            </CardHeader>

            <CardContent>
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
                  ¿Estás seguro de que deseas guardar los valores de consumo manuales para <strong>{getMonthName(selectedMonth)} {selectedYear}</strong>?
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
                    El consumo se ha actualizado correctamente
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
                  {getMonthName(selectedMonth)} {selectedYear}
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
