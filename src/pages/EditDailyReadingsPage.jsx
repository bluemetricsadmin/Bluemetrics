import { useState, useEffect, useRef } from 'react'
import { DashboardHeader } from "../components/dashboard-header"
import { DashboardSidebar } from "../components/dashboard-sidebar"
import { Card, CardContent, CardHeader } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { supabase } from '../supabaseClient'
import * as XLSX from 'xlsx'
import { 
  SaveIcon, 
  SearchIcon,
  CheckCircle2Icon,
  CircleIcon,
  AlertCircleIcon,
  CalendarIcon,
  Loader2Icon,
  RefreshCwIcon,
  Trash2Icon,
  UploadIcon,
  FileSpreadsheetIcon,
  DownloadIcon,
  DropletIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
  AlertTriangleIcon
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
  const isInitialLoadRef = useRef(false)

  const [existingDates, setExistingDates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 50
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [filterYear, setFilterYear] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [excelFile, setExcelFile] = useState(null)
  const [uploadingExcel, setUploadingExcel] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [savedCount, setSavedCount] = useState(0)

  // === Estados para edición manual de consumo ===
  const [editConsumoMode, setEditConsumoMode] = useState(false)
  const [consumoReadings, setConsumoReadings] = useState({})
  const [loadingConsumo, setLoadingConsumo] = useState(false)
  const [showConsumoConfirm, setShowConsumoConfirm] = useState(false)
  const [savingConsumo, setSavingConsumo] = useState(false)
  const [showConsumoSuccess, setShowConsumoSuccess] = useState(false)
  const [consumoSavedCount, setConsumoSavedCount] = useState(0)

  // === Estados para edición de consumo por pozo (lecturas_diarias_consumo) ===
  const [editConsumoPozoMode, setEditConsumoPozoMode] = useState(false)
  const [consumoPozoReadings, setConsumoPozoReadings] = useState({})
  const [loadingConsumoPozo, setLoadingConsumoPozo] = useState(false)
  const [consumoPozoRecordId, setConsumoPozoRecordId] = useState(null)
  const [showConsumoPozoConfirm, setShowConsumoPozoConfirm] = useState(false)
  const [savingConsumoPozo, setSavingConsumoPozo] = useState(false)
  const [showConsumoPozoSuccess, setShowConsumoPozoSuccess] = useState(false)
  const [consumoPozoSavedCount, setConsumoPozoSavedCount] = useState(0)

  // Cargar fechas existentes
  useEffect(() => {
    fetchExistingDates(0)
  }, [])

  // Recargar cuando cambian los filtros
  useEffect(() => {
    fetchExistingDates(0)
  }, [filterYear, filterMonth])

  const fetchExistingDates = async (page = 0) => {
    try {
      setLoading(true)
      setError(null)
      
      // Construir query base
      let countQuery = supabase
        .from('lecturas_diarias')
        .select('*', { count: 'exact', head: true })
      
      let dataQuery = supabase
        .from('lecturas_diarias')
        .select('dia_hora, mes_anio, id')
      
      // Aplicar filtros si existen
      // Formato real en DB: mes_anio = "enero 2026" (minúsculas)
      if (filterYear && filterMonth) {
        const filterValue = `${filterMonth.toLowerCase()} ${filterYear}`
        countQuery = countQuery.eq('mes_anio', filterValue)
        dataQuery = dataQuery.eq('mes_anio', filterValue)
      } else if (filterYear) {
        countQuery = countQuery.like('mes_anio', `% ${filterYear}`)
        dataQuery = dataQuery.like('mes_anio', `% ${filterYear}`)
      } else if (filterMonth) {
        countQuery = countQuery.like('mes_anio', `${filterMonth.toLowerCase()} %`)
        dataQuery = dataQuery.like('mes_anio', `${filterMonth.toLowerCase()} %`)
      }
      
      // Obtener total de registros
      const { count, error: countError } = await countQuery
      
      if (countError) throw countError
      setTotalCount(count || 0)
      
      // Obtener datos con paginación
      const { data, error: fetchError } = await dataQuery
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

      isInitialLoadRef.current = true
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

  const saveReadings = async () => {
    if (!selectedRecordId) {
      console.warn('⚠️ No hay registro seleccionado')
      return
    }

    setAutoSaveStatus('saving')
    try {
      const readingData = {}
      let count = 0

      dailyReadingPointsData.categories.forEach(category => {
        category.points.forEach(point => {
          const value = readings[point.id]
          
          if (value && value.trim() !== '') {
            readingData[point.id] = parseFloat(value)
            count++
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
      setSavedCount(count)
      setShowSuccessModal(true)

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

  // === EDICIÓN MANUAL DE CONSUMO ===

  // Cargar datos de consumo cuando se activa el modo o cambia el registro
  useEffect(() => {
    if (editConsumoMode && selectedRecordId) {
      loadConsumoData(selectedRecordId)
    }
  }, [editConsumoMode, selectedRecordId])

  // Cargar consumo global desde tabla lecturas_diarias
  const loadConsumoData = async (recordId) => {
    try {
      setLoadingConsumo(true)

      console.log('🔍 Cargando consumo diario desde lecturas_diarias, registro ID:', recordId)

      const { data, error: fetchError } = await supabase
        .from('lecturas_diarias')
        .select('consumo')
        .eq('id', recordId)
        .single()

      if (fetchError) {
        console.warn('⚠️ No se encontraron datos de consumo para el registro', recordId)
        setConsumoReadings({})
        return
      }

      const loaded = {}
      if (data.consumo !== null && data.consumo !== undefined) {
        loaded.consumo = data.consumo.toString()
      }

      console.log('✅ Consumo diario cargado:', loaded)
      setConsumoReadings(loaded)
    } catch (err) {
      console.error('❌ Error al cargar consumo diario:', err)
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

  // Guardar consumo global manual en lecturas_diarias
  const saveConsumoData = async () => {
    if (!selectedRecordId) return

    try {
      setSavingConsumo(true)

      const value = consumoReadings.consumo
      if (value === undefined || value === '' || value === null) {
        console.warn('⚠️ No hay valor de consumo para guardar')
        setSavingConsumo(false)
        return
      }

      const updateData = { consumo: parseFloat(value) }

      console.log('💾 Guardando consumo diario global en lecturas_diarias')

      const { error: updateError } = await supabase
        .from('lecturas_diarias')
        .update(updateData)
        .eq('id', selectedRecordId)

      if (updateError) throw updateError

      console.log('✅ Consumo diario actualizado exitosamente')
      setConsumoSavedCount(1)
      setShowConsumoConfirm(false)
      setShowConsumoSuccess(true)
    } catch (err) {
      console.error('❌ Error guardando consumo diario:', err)
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

  // === EDICIÓN DE CONSUMO POR POZO (lecturas_diarias_consumo) ===

  // Cargar datos de consumo por pozo cuando se activa el modo o cambia la fecha
  useEffect(() => {
    if (editConsumoPozoMode && selectedDate && selectedMonth) {
      loadConsumoPozoData(selectedDate, selectedMonth)
    }
  }, [editConsumoPozoMode, selectedDate, selectedMonth])

  const loadConsumoPozoData = async (dateStr, monthStr) => {
    try {
      setLoadingConsumoPozo(true)

      const { data, error: fetchError } = await supabase
        .from('lecturas_diarias_consumo')
        .select('*')
        .eq('dia_hora', dateStr)
        .eq('mes_anio', monthStr)
        .order('id', { ascending: false })
        .limit(1)

      if (fetchError) throw fetchError

      if (!data || data.length === 0) {
        console.warn('⚠️ No se encontraron datos de consumo por pozo para', dateStr, monthStr)
        setConsumoPozoReadings({})
        setConsumoPozoRecordId(null)
        return
      }

      const record = data[0]
      setConsumoPozoRecordId(record.id)

      const loaded = {}
      dailyReadingPointsData.categories.forEach(category => {
        category.points.forEach(point => {
          if (record[point.id] !== null && record[point.id] !== undefined) {
            loaded[point.id] = record[point.id].toString()
          }
        })
      })

      console.log('✅ Consumo por pozo cargado:', loaded)
      setConsumoPozoReadings(loaded)
    } catch (err) {
      console.error('❌ Error al cargar consumo por pozo:', err)
    } finally {
      setLoadingConsumoPozo(false)
    }
  }

  const handleConsumoPozoChange = (pointId, value) => {
    setConsumoPozoReadings(prev => ({
      ...prev,
      [pointId]: value
    }))
  }

  const saveConsumoPozoData = async () => {
    if (!consumoPozoRecordId) return

    try {
      setSavingConsumoPozo(true)

      const updateData = {}
      let count = 0

      dailyReadingPointsData.categories.forEach(category => {
        category.points.forEach(point => {
          const value = consumoPozoReadings[point.id]
          if (value !== undefined && value !== '' && value !== null) {
            updateData[point.id] = parseFloat(value)
            count++
          }
        })
      })

      const { error: updateError } = await supabase
        .from('lecturas_diarias_consumo')
        .update(updateData)
        .eq('id', consumoPozoRecordId)

      if (updateError) throw updateError

      console.log('✅ Consumo por pozo actualizado exitosamente')
      setConsumoPozoSavedCount(count)
      setShowConsumoPozoConfirm(false)
      setShowConsumoPozoSuccess(true)
    } catch (err) {
      console.error('❌ Error guardando consumo por pozo:', err)
      setError(`Error al guardar consumo por pozo: ${err.message}`)
    } finally {
      setSavingConsumoPozo(false)
    }
  }

  const toggleConsumoPozoMode = () => {
    if (editConsumoPozoMode) {
      setEditConsumoPozoMode(false)
      setConsumoPozoReadings({})
      setConsumoPozoRecordId(null)
    } else {
      setEditConsumoPozoMode(true)
    }
  }

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false)
    setSelectedDate(null)
    setSelectedMonth(null)
    setSelectedRecordId(null)
    setAvailableRecords([])
    setReadings({})
    setAutoSaveStatus('saved')
    setError(null)
    setSavedCount(0)
    console.log('✅ Proceso completado, volviendo al inicio')
  }

  const deleteReading = async () => {
    if (!selectedRecordId) {
      console.warn('⚠️ No hay registro seleccionado para eliminar')
      return
    }

    try {
      setDeleting(true)
      console.log('🗑️ Eliminando registro ID:', selectedRecordId)

      const { error: deleteError } = await supabase
        .from('lecturas_diarias')
        .delete()
        .eq('id', selectedRecordId)

      if (deleteError) throw deleteError

      console.log('✅ Lectura eliminada exitosamente')
      
      // Limpiar estados
      setSelectedDate(null)
      setSelectedMonth(null)
      setSelectedRecordId(null)
      setAvailableRecords([])
      setReadings({})
      setShowDeleteConfirm(false)
      
      // Recargar la lista de fechas
      await fetchExistingDates(currentPage)

    } catch (error) {
      console.error('❌ Error eliminando lectura:', error)
      setError(`Error al eliminar: ${error.message}`)
    } finally {
      setDeleting(false)
    }
  }

  const downloadTemplate = () => {
    // Crear datos de plantilla con todas las columnas
    const templateData = [
      {
        'mes año': 'enero 2026',
        'dia hora': 'Lun27 09:00',
        'Consumo': '',
        'General pozos': '',
        'Pozo 3': '',
        'Pozo 8': '',
        'Pozo 15': '',
        'Pozo 4': '',
        'A y D': '',
        'Campus 8': '',
        'A7-CC': '',
        'Megacentral': '',
        'Planta Física': '',
        'Residencias': '',
        'Pozo7': '',
        'Pozo11': '',
        'Pozo 12': '',
        'Pozo 14': ''
      }
    ]

    // Crear workbook y worksheet
    const ws = XLSX.utils.json_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Lecturas Diarias')

    // Descargar archivo
    XLSX.writeFile(wb, 'plantilla_lecturas_diarias.xlsx')
    console.log('✅ Plantilla descargada')
  }

  const handleExcelUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!selectedRecordId) {
      setError('Por favor selecciona primero una fecha para editar')
      return
    }

    setExcelFile(file)
    setUploadingExcel(true)
    setError(null)

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

      const firstRow = jsonData[0]
      const columns = Object.keys(firstRow)
      
      const hasMesAnio = columns.some(col => /mes.?a[ñn]o/i.test(col))
      const hasFechaHora = columns.some(col => /(fecha|dia).?hora/i.test(col))
      const isHorizontalFormat = hasMesAnio && hasFechaHora

      console.log('🔍 Formato detectado:', isHorizontalFormat ? 'HORIZONTAL' : 'VERTICAL')

      let newReadings = {}
      let matched = 0
      let unmatched = []

      if (isHorizontalFormat) {
        const row = jsonData[0]
        
        console.log('📋 Columnas del Excel:', Object.keys(row))
        console.log('📊 Datos de la fila:', row)
        
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
          'pozo 14': 'pozo_14',
          'pozo_3': 'pozo_3',
          'pozo_8': 'pozo_8',
          'pozo_15': 'pozo_15',
          'pozo_4': 'pozo_4',
          'pozo_12': 'pozo_12',
          'pozo_14': 'pozo_14'
        }

        Object.keys(row).forEach(columnName => {
          if (/mes.?a[ñn]o/i.test(columnName) || /dia.?hora/i.test(columnName)) {
            console.log(`⏭️ Saltando columna de fecha: ${columnName}`)
            return
          }

          const value = row[columnName]
          if (value === undefined || value === null || value === '') {
            console.log(`⏭️ Saltando columna vacía: ${columnName}`)
            return
          }

          const columnLower = columnName.toLowerCase().trim()
          const pointId = pointMapping[columnLower]

          // Convertir el valor a string y limpiar comas si es necesario
          let cleanValue = value.toString().replace(/,/g, '')
          
          if (pointId) {
            console.log(`✅ Mapeo directo: "${columnName}" -> ${pointId} = ${cleanValue}`)
            newReadings[pointId] = cleanValue
            matched++
          } else {
            let found = false
            dailyReadingPointsData.categories.forEach(category => {
              category.points.forEach(point => {
                const pointNameLower = point.name.toLowerCase()
                const pointIdLower = point.id.toLowerCase()
                
                if (columnLower === pointNameLower || 
                    columnLower === pointIdLower ||
                    pointNameLower.includes(columnLower) ||
                    columnLower.includes(pointNameLower)) {
                  console.log(`✅ Mapeo por búsqueda: "${columnName}" -> ${point.id} = ${cleanValue}`)
                  newReadings[point.id] = cleanValue
                  found = true
                  matched++
                }
              })
            })

            if (!found) {
              console.warn(`❌ No se encontró mapeo para: "${columnName}"`)
              unmatched.push(columnName)
            }
          }
        })

      } else {
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

      console.log(`✅ Coincidencias encontradas: ${matched}`)
      console.log('📦 Nuevas lecturas a cargar:', newReadings)
      if (unmatched.length > 0) {
        console.warn('⚠️ Columnas no coincidentes:', unmatched)
      }

      if (matched === 0) {
        throw new Error('No se encontraron coincidencias con los puntos de medición')
      }

      console.log('🔄 Actualizando estado de lecturas...')
      setReadings(prev => {
        const updated = { ...prev, ...newReadings }
        console.log('📝 Estado anterior:', prev)
        console.log('📝 Estado actualizado:', updated)
        return updated
      })
      setAutoSaveStatus('saved')
      setError(null)
      
      const successMsg = `✅ ${matched} lecturas cargadas desde Excel${unmatched.length > 0 ? ` (${unmatched.length} no coincidieron)` : ''}`
      console.log(successMsg)

    } catch (error) {
      console.error('❌ Error procesando Excel:', error)
      setError(`Error al procesar Excel: ${error.message}`)
    } finally {
      setUploadingExcel(false)
      setExcelFile(null)
      e.target.value = ''
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

                  {/* Filtros de Año y Mes */}
                  <div className="flex items-center gap-2">
                    <select
                      value={filterYear}
                      onChange={(e) => {
                        setFilterYear(e.target.value)
                        setCurrentPage(0)
                      }}
                      className="px-3 py-1.5 text-sm border rounded-md bg-background"
                    >
                      <option value="">Todos los años</option>
                      <option value="2026">2026</option>
                      <option value="2025">2025</option>
                      <option value="2024">2024</option>
                      <option value="2023">2023</option>
                    </select>
                    
                    <select
                      value={filterMonth}
                      onChange={(e) => {
                        setFilterMonth(e.target.value)
                        setCurrentPage(0)
                      }}
                      className="px-3 py-1.5 text-sm border rounded-md bg-background"
                    >
                      <option value="">Todos los meses</option>
                      <option value="enero">Enero</option>
                      <option value="febrero">Febrero</option>
                      <option value="marzo">Marzo</option>
                      <option value="abril">Abril</option>
                      <option value="mayo">Mayo</option>
                      <option value="junio">Junio</option>
                      <option value="julio">Julio</option>
                      <option value="agosto">Agosto</option>
                      <option value="septiembre">Septiembre</option>
                      <option value="octubre">Octubre</option>
                      <option value="noviembre">Noviembre</option>
                      <option value="diciembre">Diciembre</option>
                    </select>
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
                          key={date.id}
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
                           selectedDate === date.dia_hora && selectedMonth === date.mes_anio
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
                              Fecha: {selectedMonth} {selectedDate}
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
                            <label className="inline-block">
                              <input
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleExcelUpload}
                                className="hidden"
                                disabled={uploadingExcel || !selectedRecordId}
                              />
                              <Button 
                                variant="outline"
                                size="sm"
                                disabled={uploadingExcel || !selectedRecordId}
                                className="cursor-pointer"
                                asChild
                              >
                                <span>
                                  {uploadingExcel ? (
                                    <>
                                      <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                                      Cargando...
                                    </>
                                  ) : (
                                    <>
                                      <FileSpreadsheetIcon className="h-4 w-4 mr-2" />
                                      Cargar Excel
                                    </>
                                  )}
                                </span>
                              </Button>
                            </label>
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

                {/* Edición Manual de Consumo */}
                <Card className="mt-6">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <DropletIcon className="h-5 w-5 text-blue-500" />
                        <div>
                          <h3 className="text-lg font-semibold">
                            Edición Manual de Consumo Global
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Edita manualmente el valor de consumo global del día seleccionado
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
                            {(() => {
                              const value = consumoReadings.consumo || ''
                              const hasValue = value !== '' && value !== undefined

                              return (
                                <div
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
                                    <p className="font-medium text-sm truncate">Consumo Total del Día</p>
                                    <span className="text-xs text-muted-foreground">consumo</span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground font-medium">Consumo:</span>
                                    <input
                                      type="number"
                                      step="0.01"
                                      placeholder="Consumo m³"
                                      value={value}
                                      onChange={(e) => handleConsumoChange('consumo', e.target.value)}
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
                            })()}
                          </div>

                          {/* Botón Guardar Consumo */}
                          <div className="mt-6 flex items-center justify-between">
                            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 flex items-start gap-2">
                              <AlertTriangleIcon className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                              <p className="text-xs text-amber-800 dark:text-amber-200">
                                Los cambios manuales sobrescribirán el valor de consumo global para la fecha seleccionada.
                              </p>
                            </div>

                            <Button
                              size="sm"
                              onClick={() => setShowConsumoConfirm(true)}
                              disabled={savingConsumo || !consumoReadings.consumo}
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

                {/* Edición de Consumo por Pozo (lecturas_diarias_consumo) */}
                <Card className="mt-6">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <DropletIcon className="h-5 w-5 text-emerald-500" />
                        <div>
                          <h3 className="text-lg font-semibold">
                            Edición de Consumo por Pozo
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Edita los valores de consumo por punto de medición (tabla lecturas_diarias_consumo)
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={toggleConsumoPozoMode}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-all hover:shadow-sm"
                        style={{
                          borderColor: editConsumoPozoMode ? '#10b981' : undefined,
                          backgroundColor: editConsumoPozoMode ? 'rgba(16,185,129,0.08)' : undefined
                        }}
                      >
                        {editConsumoPozoMode ? (
                          <ToggleRightIcon className="h-6 w-6 text-emerald-500" />
                        ) : (
                          <ToggleLeftIcon className="h-6 w-6 text-muted-foreground" />
                        )}
                        <span className={`text-sm font-medium ${editConsumoPozoMode ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                          {editConsumoPozoMode ? 'Activado' : 'Desactivado'}
                        </span>
                      </button>
                    </div>
                  </CardHeader>

                  {editConsumoPozoMode && (
                    <CardContent>
                      {loadingConsumoPozo ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2Icon className="h-6 w-6 animate-spin text-emerald-500 mr-3" />
                          <span className="text-muted-foreground">Cargando consumo por pozo...</span>
                        </div>
                      ) : consumoPozoRecordId === null ? (
                        <div className="text-center py-8">
                          <AlertCircleIcon className="h-10 w-10 text-amber-500 mx-auto mb-3" />
                          <p className="text-sm text-muted-foreground">
                            No se encontró un registro de consumo en <strong>lecturas_diarias_consumo</strong> para la fecha seleccionada.
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="space-y-4">
                            {dailyReadingPointsData.categories.map(category => {
                              const points = category.points
                              return (
                                <div key={category.id}>
                                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-2">
                                    {category.name}
                                  </h4>
                                  <div className="space-y-2">
                                    {points.map(point => {
                                      const value = consumoPozoReadings[point.id] || ''
                                      const hasValue = value !== '' && value !== undefined

                                      return (
                                        <div
                                          key={point.id}
                                          className={`flex items-center gap-4 p-3 rounded-lg border-2 transition-all ${
                                            hasValue
                                              ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-900/10'
                                              : 'border-muted hover:border-emerald-300'
                                          }`}
                                        >
                                          <div className="flex-shrink-0">
                                            {hasValue ? (
                                              <CheckCircle2Icon className="h-5 w-5 text-emerald-500" />
                                            ) : (
                                              <CircleIcon className="h-5 w-5 text-muted-foreground" />
                                            )}
                                          </div>

                                          <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">{point.name}</p>
                                            <span className="text-xs text-muted-foreground">{point.id}</span>
                                          </div>

                                          <div className="flex items-center gap-2">
                                            <input
                                              type="number"
                                              step="0.01"
                                              placeholder="Consumo m³"
                                              value={value}
                                              onChange={(e) => handleConsumoPozoChange(point.id, e.target.value)}
                                              className={`w-40 px-3 py-2 border rounded-lg text-sm text-right font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                                                hasValue
                                                  ? 'border-emerald-300 bg-white dark:bg-gray-900'
                                                  : 'border-muted'
                                              }`}
                                            />
                                            <span className="text-sm text-muted-foreground">m³</span>
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              )
                            })}
                          </div>

                          {/* Botón Guardar Consumo por Pozo */}
                          <div className="mt-6 flex items-center justify-between">
                            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 flex items-start gap-2">
                              <AlertTriangleIcon className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                              <p className="text-xs text-amber-800 dark:text-amber-200">
                                Los cambios manuales sobrescribirán los valores de consumo por pozo para la fecha seleccionada.
                              </p>
                            </div>

                            <Button
                              size="sm"
                              onClick={() => setShowConsumoPozoConfirm(true)}
                              disabled={savingConsumoPozo || Object.keys(consumoPozoReadings).length === 0}
                              className="bg-emerald-600 hover:bg-emerald-700 ml-4"
                            >
                              <SaveIcon className="h-4 w-4 mr-2" />
                              Guardar Consumo por Pozo
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
                  <h3 className="text-lg font-semibold">Eliminar Lectura Diaria</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Esta acción no se puede deshacer
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <p className="text-sm text-foreground mb-4">
                  ¿Estás seguro de que deseas eliminar la lectura del día <strong>{selectedDate}</strong>?
                </p>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-xs text-red-800 dark:text-red-200">
                    <strong>Advertencia:</strong> Se eliminarán permanentemente todas las lecturas de esta fecha.
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
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <CheckCircle2Icon className="h-10 w-10 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">¡Guardado Exitoso!</h3>
                  <p className="text-muted-foreground mt-2">
                    Las lecturas diarias se han actualizado correctamente
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
                  Fecha: {selectedDate}
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
                    Estás a punto de sobrescribir datos de consumo
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <p className="text-sm text-foreground mb-4">
                  ¿Estás seguro de que deseas guardar los valores de consumo manuales para la fecha <strong>{selectedDate}</strong>?
                </p>
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    <strong>Advertencia:</strong> Los valores de consumo serán reemplazados por los valores ingresados manualmente.
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
                    El consumo diario se ha actualizado correctamente
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
                  Fecha: {selectedDate} — {selectedMonth}
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

      {/* Modal de Confirmación de Consumo por Pozo */}
      {showConsumoPozoConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
                  <AlertTriangleIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Confirmar Cambio de Consumo por Pozo</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Estás a punto de sobrescribir datos de consumo por pozo
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <p className="text-sm text-foreground mb-4">
                  ¿Estás seguro de que deseas guardar los valores de consumo por pozo para la fecha <strong>{selectedDate}</strong>?
                </p>
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    <strong>Advertencia:</strong> Los valores de consumo por pozo serán reemplazados por los valores ingresados manualmente.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowConsumoPozoConfirm(false)}
                  disabled={savingConsumoPozo}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={saveConsumoPozoData}
                  disabled={savingConsumoPozo}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {savingConsumoPozo ? (
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

      {/* Modal de Éxito de Consumo por Pozo */}
      {showConsumoPozoSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
                  <CheckCircle2Icon className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">¡Consumo por Pozo Actualizado!</h3>
                  <p className="text-muted-foreground mt-2">
                    El consumo por pozo se ha actualizado correctamente
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                <p className="text-lg font-semibold mb-2">
                  {consumoPozoSavedCount} puntos actualizados
                </p>
                <p className="text-sm text-muted-foreground">
                  Fecha: {selectedDate} — {selectedMonth}
                </p>
              </div>

              <Button
                size="lg"
                onClick={() => setShowConsumoPozoSuccess(false)}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
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
