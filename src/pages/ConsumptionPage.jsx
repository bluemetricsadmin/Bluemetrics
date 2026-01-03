import { useState, useEffect } from 'react'
import { DashboardHeader } from "../components/dashboard-header"
import { DashboardSidebar } from "../components/dashboard-sidebar"
import { Card, CardContent, CardHeader } from "../components/ui/card"
import { Button } from "../components/ui/button"
import ConsumptionTable from "../components/ConsumptionTable"
import WeeklyComparisonChart from "../components/WeeklyComparisonChart"
import WeeklyComparisonTable from "../components/WeeklyComparisonTable"
import datosPozo12 from '../lib/datos_pozo_12.json'
import consumptionPointsData from '../lib/consumption-points.json'
import { dashboardData } from '../lib/dashboard-data'
import { supabase } from '../supabaseClient'
import { 
  TrendingUpIcon,
  TrendingDownIcon,
  AlertTriangleIcon, 
  DropletIcon,
  BarChart3Icon,
  CalendarIcon,
  DownloadIcon,
  Truck,
  Building2,
  Waves,
  TableIcon,
  Loader2Icon
} from 'lucide-react'

import { RedirectIfNotAuth } from '../components/RedirectIfNotAuth';
import { AVAILABLE_YEARS, DEFAULT_YEAR } from '../utils/tableHelpers';

export default function ConsumptionPage() {
  const [timeFrame, setTimeFrame] = useState('monthly')
  const [selectedYearForReadings, setSelectedYearForReadings] = useState(DEFAULT_YEAR) // Año para consumo semanal
  
  // Estados para el nuevo sistema de tablas detalladas
  const [activeTab, setActiveTab] = useState('pozos_servicios') // Tab activa para las tablas
  const [selectedWeek, setSelectedWeek] = useState(2) // Semana seleccionada (1 o 2)
  const [showComparison, setShowComparison] = useState(true) // Mostrar comparación entre semanas
  
  // Estados para datos de Supabase
  const [weeklyReadings, setWeeklyReadings] = useState([])
  const [availableWeeks, setAvailableWeeks] = useState([])
  const [consumptionPoints, setConsumptionPoints] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Estados para comparativas semanales
  const [selectedPoint, setSelectedPoint] = useState('medidor_general_pozos')
  const [weeklyReadings2023, setWeeklyReadings2023] = useState([])
  const [weeklyReadings2024, setWeeklyReadings2024] = useState([])
  const [weeklyReadings2025, setWeeklyReadings2025] = useState([])
  const [weeklyReadings2026, setWeeklyReadings2026] = useState([])

  // Estados para filtros de gráficas de comparación
  const [comparisonChartType, setComparisonChartType] = useState('line') // 'line' o 'bar'
  const [comparisonYearsToShow, setComparisonYearsToShow] = useState(['2025', '2026']) // Array de años para comparar
  const [availableYears] = useState(['2023', '2024', '2025', '2026']) // Años disponibles para comparación

  // Cargar semanas disponibles desde Supabase cuando cambia el año de consumo
  useEffect(() => {
    fetchWeeklyReadings()
  }, [selectedYearForReadings])

  // Cargar datos de todos los años para comparativas
  useEffect(() => {
    fetchBothYearsData()
  }, [selectedPoint])

  const fetchWeeklyReadings = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Cargar AMBAS tablas: lecturas y consumo
      const readingsTableName = `lecturas_semana_agua_${selectedYearForReadings}`
      const consumptionTableName = `lecturas_semana_agua_consumo_${selectedYearForReadings}`
      
      console.log('🔍 Cargando lecturas desde:', readingsTableName)
      console.log('🔍 Cargando consumo desde:', consumptionTableName)
      
      // Cargar lecturas semanales (valores acumulados)
      const { data: readingsData, error: readingsError } = await supabase
        .from(readingsTableName)
        .select('*')
        .order('l_numero_semana', { ascending: true })
      
      if (readingsError) {
        console.error('❌ Error cargando lecturas:', readingsError)
        throw readingsError
      }
      
      // Cargar consumo semanal
      const { data: consumptionData, error: consumptionError } = await supabase
        .from(consumptionTableName)
        .select('*')
        .order('l_numero_semana', { ascending: true })
      
      if (consumptionError) {
        console.error('❌ Error cargando consumo:', consumptionError)
        throw consumptionError
      }
      
      console.log('✅ Lecturas obtenidas:', readingsData?.length, 'semanas')
      console.log('✅ Consumo obtenido:', consumptionData?.length, 'semanas')
      
      // Combinar lecturas y consumo por semana
      const mergedData = (readingsData || []).map(reading => {
        const consumption = (consumptionData || []).find(c => c.l_numero_semana === reading.l_numero_semana)
        return {
          ...reading,
          consumption: consumption || {} // Agregar datos de consumo
        }
      })
      
      setWeeklyReadings(mergedData)
      
      // Crear lista de semanas disponibles
      const weeks = (readingsData || []).map(week => ({
        weekNumber: week.l_numero_semana,
        startDate: week.l_fecha_inicio,
        endDate: week.l_fecha_fin
      }))
      
      setAvailableWeeks(weeks)
      
      // Si hay semanas, seleccionar la última por defecto
      if (weeks.length > 0) {
        setSelectedWeek(weeks[weeks.length - 1].weekNumber)
      }

      // Convertir datos combinados al formato de puntos de consumo
      processConsumptionPoints(mergedData, consumptionData)
      
    } catch (err) {
      console.error('❌ Error al cargar datos:', err)
      setError(err.message)
      
      // Fallback a datos del JSON si hay error
      setAvailableWeeks(consumptionPointsData.metadata.weeks)
      setConsumptionPoints(consumptionPointsData.categories)
    } finally {
      setLoading(false)
    }
  }

  // Procesar datos de Supabase para convertirlos en formato de puntos de consumo
  const processConsumptionPoints = (mergedData, consumptionData) => {
    // Mapeo de IDs del JSON a columnas de la nueva tabla con prefijo l_ (minúsculas)
    const columnMapping = {
      'medidor_general_pozos': 'l_medidor_general_pozos',
      'pozo_11': 'l_pozo_11',
      'pozo_12': 'l_pozo_12',
      'pozo_14': 'l_pozo_14',
      'pozo_7': 'l_pozo_7',
      'pozo_3': 'l_pozo_3',
      'pozo_4_riego': 'l_pozo_4_riego',
      'pozo_8_riego': 'l_pozo_8_riego',
      'pozo_15_riego': 'l_pozo_15_riego',
      'residencias_10_15': 'l_residencias_10_15',
      'residencias_1_antiguo': 'l_residencias_1_antiguo',
      'residencias_2_ote': 'l_residencias_2_ote',
      'residencias_3': 'l_residencias_3',
      'residencias_4': 'l_residencias_4',
      'residencias_5': 'l_residencias_5',
      'wellness_edificio': 'l_wellness_edificio',
      'biblioteca': 'l_biblioteca',
      'cetec': 'l_cetec',
      'biotecnologia': 'l_biotecnologia',
      'arena_borrego': 'l_arena_borrego',
      'centro_congresos': 'l_centro_congresos',
      'auditorio_luis_elizondo': 'l_auditorio_luis_elizondo',
      'nucleo': 'l_nucleo',
      'expedition': 'l_expedition',
      'wellness_torre_enfriamiento': 'l_wellness_torre_enfriamiento',
      'cah3_torre_enfriamiento': 'l_cah3_torre_enfriamiento',
      'megacentral_te_2': 'l_megacentral_te_2',
      'estadio_banorte_te': 'l_estadio_banorte_te',
      'circuito_8_campus': 'l_circuito_8_campus',
      'circuito_6_residencias': 'l_circuito_6_residencias',
      'circuito_4_a7_ce': 'l_circuito_4_a7_ce',
      'circuito_planta_fisica': 'l_circuito_planta_fisica',
      'circuito_megacentral': 'l_circuito_megacentral'
    }

    // Usar las categorías del JSON como estructura base
    const categories = consumptionPointsData.categories.map(category => ({
      ...category,
      points: category.points.map(point => {
        // Obtener el nombre de columna correcto con prefijo l_ (minúsculas)
        const columnName = columnMapping[point.id] || `l_${point.id}`
        
        // Construir weeklyData con LECTURAS y CONSUMO
        const weeklyDataFromDB = mergedData.map(week => {
          const reading = week[columnName] // Lectura acumulada
          const consumption = week.consumption?.[columnName] // Consumo de la semana
          
          return {
            week: week.l_numero_semana,
            reading: reading !== null && reading !== undefined ? parseFloat(reading) : 0,
            consumption: consumption !== null && consumption !== undefined ? parseFloat(consumption) : 0
          }
        }).filter(w => w.reading !== null || w.consumption !== null)

        return {
          ...point,
          weeklyData: weeklyDataFromDB.length > 0 ? weeklyDataFromDB : point.weeklyData // Fallback al JSON
        }
      })
    }))

    setConsumptionPoints(categories)
  }

  // Función genérica para cargar datos de un año específico (LECTURAS + CONSUMO)
  const fetchYearData = async (year, consumptionTableName, setStateFunction) => {
    try {
      const shouldSumAll = selectedPoint === 'todos'
      
      // Cargar AMBAS tablas: lecturas y consumo (igual que fetchWeeklyReadings)
      const readingsTableName = `lecturas_semana_agua_${year}`
      
      console.log(`🔍 Cargando lecturas de ${year} desde: ${readingsTableName}`)
      console.log(`🔍 Cargando consumo de ${year} desde: ${consumptionTableName}`)
      
      // Cargar lecturas semanales (valores acumulados)
      const { data: readingsData, error: readingsError } = await supabase
        .from(readingsTableName)
        .select('*')
        .order('l_numero_semana', { ascending: true })
      
      if (readingsError) {
        console.error(`❌ Error cargando lecturas de ${year}:`, readingsError)
        setStateFunction([])
        return
      }
      
      // Cargar consumo semanal
      const { data: consumptionData, error: consumptionError } = await supabase
        .from(consumptionTableName)
        .select('*')
        .order('l_numero_semana', { ascending: true })
      
      if (consumptionError) {
        console.error(`❌ Error cargando consumo de ${year}:`, consumptionError)
        setStateFunction([])
        return
      }

      if (!readingsData || readingsData.length === 0) {
        console.warn(`⚠️ No hay datos de lecturas en ${readingsTableName}`)
        setStateFunction([])
        return
      }

      console.log(`📊 Lecturas de ${year}:`, readingsData.length, 'semanas')
      console.log(`📊 Consumo de ${year}:`, consumptionData?.length || 0, 'semanas')

      let formattedData
      if (shouldSumAll) {
        // Sumar todo el consumo de cada semana desde la tabla de CONSUMO
        formattedData = (consumptionData || []).map(week => {
          let totalConsumption = 0
          // Sumar todos los campos numéricos (consumo) con prefijo l_ excepto metadatos
          Object.keys(week).forEach(key => {
            if (key.startsWith('l_') && 
                key !== 'l_numero_semana' && 
                key !== 'l_fecha_inicio' && 
                key !== 'l_fecha_fin' && 
                key !== 'l_id' &&
                key !== 'l_created_at' &&
                key !== 'l_updated_at' &&
                week[key] !== null) {
              const value = parseFloat(week[key])
              if (!isNaN(value)) {
                totalConsumption += value
              }
            }
          })
          return {
            week: week.l_numero_semana,
            reading: totalConsumption,  // Consumo total
            consumption: totalConsumption  // Mantener compatibilidad
          }
        })
      } else {
        // Mapear el punto seleccionado al nombre de columna con prefijo l_ (minúsculas)
        const columnName = `l_${selectedPoint}`
        
        console.log(`🎯 Buscando columna: ${columnName}`)
        
        // Combinar lecturas y consumo para el punto específico
        formattedData = readingsData.map(reading => {
          const consumption = (consumptionData || []).find(c => c.l_numero_semana === reading.l_numero_semana)
          return {
            week: reading.l_numero_semana,
            reading: parseFloat(reading[columnName]) || 0,  // Lectura acumulada
            consumption: parseFloat(consumption?.[columnName]) || 0  // Consumo de la semana
          }
        })
      }
      
      setStateFunction(formattedData)
      console.log(`✅ Datos de ${year} formateados:`, formattedData.length, 'semanas', formattedData.slice(0, 3))
    } catch (err) {
      console.error(`❌ Error al cargar datos de ${year}:`, err)
      setStateFunction([])
    }
  }

  // Función para cargar datos de todos los años para comparación
  const fetchBothYearsData = async () => {
    await Promise.all([
      fetchYearData('2023', 'lecturas_semana_agua_consumo_2023', setWeeklyReadings2023),
      fetchYearData('2024', 'lecturas_semana_agua_consumo_2024', setWeeklyReadings2024),
      fetchYearData('2025', 'lecturas_semana_agua_consumo_2025', setWeeklyReadings2025),
      fetchYearData('2026', 'lecturas_semana_agua_consumo_2026', setWeeklyReadings2026)
    ])
  }

  // Calcular consumo real de las últimas 4 semanas vs 4 semanas anteriores
  const calculateLast4WeeksConsumption = () => {
    if (!weeklyReadings || weeklyReadings.length === 0) {
      return { pozos: 0, riego: 0, servicios: 0, pozosPrev: 0, riegoPrev: 0, serviciosPrev: 0 }
    }

    // Obtener las últimas 8 semanas (4 actuales + 4 anteriores)
    const last8Weeks = weeklyReadings.slice(-8)
    
    if (last8Weeks.length < 8) {
      console.warn('No hay suficientes semanas de datos (mínimo 8)')
    }

    // Dividir en dos grupos: últimas 4 y anteriores 4
    const last4Weeks = last8Weeks.slice(-4)
    const previous4Weeks = last8Weeks.slice(-8, -4)

    // Función para sumar consumo de columnas específicas
    const sumConsumption = (weeks, columns) => {
      return weeks.reduce((total, week) => {
        const weekConsumption = week.consumption || week
        const sum = columns.reduce((colSum, col) => {
          const value = parseFloat(weekConsumption[col]) || 0
          return colSum + value
        }, 0)
        return total + sum
      }, 0)
    }

    // Columnas de POZOS DE SERVICIOS (Pozos 11, 12, 3, 7, 14)
    const pozosServiciosCols = ['l_pozo_11', 'l_pozo_12', 'l_pozo_3', 'l_pozo_7', 'l_pozo_14']
    
    // Columnas de POZOS DE RIEGO (Pozos 4, 8, 15)
    const pozosRiegoCols = ['l_pozo_4_riego', 'l_pozo_8_riego', 'l_pozo_15_riego']
    
    // TOTAL DE TODOS LOS POZOS (Servicios + Riego)
    const todosPozosCols = [...pozosServiciosCols, ...pozosRiegoCols]
    
    // Columnas de PUNTOS DE SERVICIO (edificios, residencias, torres de enfriamiento, etc)
    const puntosServicioCols = [
      'l_residencias_10_15', 'l_residencias_1_antiguo', 'l_residencias_2_ote',
      'l_residencias_3', 'l_residencias_4', 'l_residencias_5',
      'l_wellness_edificio', 'l_biblioteca', 'l_cetec', 'l_biotecnologia',
      'l_arena_borrego', 'l_centro_congresos', 'l_auditorio_luis_elizondo',
      'l_nucleo', 'l_expedition', 'l_wellness_torre_enfriamiento',
      'l_cah3_torre_enfriamiento', 'l_megacentral_te_2', 'l_estadio_banorte_te',
      'l_circuito_8_campus', 'l_circuito_6_residencias', 'l_circuito_4_a7_ce',
      'l_circuito_planta_fisica', 'l_circuito_megacentral'
    ]

    return {
      pozos: sumConsumption(last4Weeks, todosPozosCols),
      riego: sumConsumption(last4Weeks, pozosRiegoCols),
      servicios: sumConsumption(last4Weeks, pozosServiciosCols),
      pozosPrev: sumConsumption(previous4Weeks, todosPozosCols),
      riegoPrev: sumConsumption(previous4Weeks, pozosRiegoCols),
      serviciosPrev: sumConsumption(previous4Weeks, pozosServiciosCols)
    }
  }

  // Procesar datos de consumo según filtros (función original mantenida para compatibilidad)
  const getConsumptionData = () => {
    switch (timeFrame) {
      case 'daily':
        // Simular datos diarios de la última semana
        return [
          { name: 'Lun', value: 2800, category: 'general' },
          { name: 'Mar', value: 3200, category: 'general' },
          { name: 'Mié', value: 2950, category: 'general' },
          { name: 'Jue', value: 3100, category: 'general' },
          { name: 'Vie', value: 2750, category: 'general' },
          { name: 'Sáb', value: 2400, category: 'general' },
          { name: 'Dom', value: 2200, category: 'general' },
        ]
      case 'weekly':
        return datosPozo12.datos_semanales.consumo_semanal_detallado.slice(-8).map((week, index) => ({
          name: `S${index + 1}`,
          value: Math.round(week.total_pozos / 1000),
          servicios: Math.round(week.consumo_servicios / 1000),
          riego: Math.round(week.consumo_riego / 1000)
        }))
      case 'quarterly':
        const quarterlyData = datosPozo12.datos_trimestrales.consumo_trimestral
        const yearData = quarterlyData.find(q => q.año.includes('2025')) || quarterlyData[quarterlyData.length - 1]
        const quarters = ['primer_trimestre', 'segundo_trimestre', 'tercer_trimestre', 'cuarto_trimestre']
        const quarterLabels = ['Q1', 'Q2', 'Q3', 'Q4']
        
        return quarters.map((quarter, index) => {
          const value = yearData[quarter]
          if (value !== null && value !== undefined) {
            return {
              name: quarterLabels[index],
              value: Math.round(value / 1000)
            }
          }
          return null
        }).filter(Boolean)
        
      case 'yearly':
        return datosPozo12.especificaciones_anuales.map(year => ({
          name: year.año.toString().replace('2025 (hasta mayo)', '2025'),
          value: Math.round(year.consumo_real_m3 / 1000),
          disponible: Math.round(year.m3_disponibles_para_consumir / 1000),
          efficiency: ((year.consumo_real_m3 / year.m3_disponibles_para_consumir) * 100).toFixed(1)
        }))
        
      case 'monthly':
      default:
        const monthlyData = datosPozo12.datos_mensuales.consumo_mensual
        const lastYearWithData = monthlyData.find(year => year.año.includes('2025')) || monthlyData[monthlyData.length - 1]
        
        const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
        const monthAbbrev = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
        
        return monthNames.map((month, index) => {
          const value = lastYearWithData[month]
          if (value !== null && value !== undefined) {
            return {
              name: monthAbbrev[index],
              value: Math.round(value / 1000)
            }
          }
          return null
        }).filter(Boolean)
    }
  }

  // Datos de consumo por categoría
  const getCategoryData = () => {
    return [
      {
        name: 'Pozos Total',
        value: 12500,
        percentage: 85.5,
        meta: 15000
      },
      {
        name: 'Servicios',
        value: 3750,
        percentage: 78.2,
        meta: 4800
      },
      {
        name: 'Riego',
        value: 8750,
        percentage: 89.3,
        meta: 9800
      },
      {
        name: 'Torres de enfriamiento',
        value: 2800,
        percentage: 93.3,
        meta: 3000
      },
      {
        name: 'PTAR',
        value: 1500,
        percentage: 75.0,
        meta: 2000
      }
    ].map(item => ({
      ...item,
      percentage: ((item.value / item.meta) * 100).toFixed(1)
    }))
  }

  // Datos de eficiencia por pozo - Actualizado con pozos reales
  const getWellEfficiencyData = () => {
    // Pozos de Servicios
    const serviciosWells = [
      { name: 'Pozo 11 - Servicios', consumption: 1200, efficiency: 95, status: 'normal', type: 'Servicios' },
      { name: 'Pozo 12 - Servicios', consumption: 850, efficiency: 92, status: 'normal', type: 'Servicios' },
      { name: 'Pozo 3 - Servicios', consumption: 800, efficiency: 88, status: 'normal', type: 'Servicios' },
      { name: 'Pozo 7 - Servicios', consumption: 950, efficiency: 93, status: 'normal', type: 'Servicios' },
      { name: 'Pozo 14 - Servicios', consumption: 1100, efficiency: 94, status: 'normal', type: 'Servicios' }
    ]
    
    // Pozos de Riego
    const riegoWells = [
      { name: 'Pozo 4 - Riego', consumption: 1350, efficiency: 96, status: 'normal', type: 'Riego' },
      { name: 'Pozo 8 - Riego', consumption: 1250, efficiency: 94, status: 'normal', type: 'Riego' },
      { name: 'Pozo 15 - Riego', consumption: 1150, efficiency: 91, status: 'normal', type: 'Riego' }
    ]
    
    return [...serviciosWells, ...riegoWells]
  }


  // Cálculos de métricas principales con datos REALES
  const consumptionData = getConsumptionData()
  const categoryData = getCategoryData()
  const wellData = getWellEfficiencyData()
  
  // Calcular consumo real de últimas 4 semanas vs 4 anteriores
  const last4WeeksData = calculateLast4WeeksConsumption()
  
  console.log('📊 Consumo últimas 4 semanas:', last4WeeksData)
  
  // Métricas de pozos de medición
  const consumoPozos = Math.round(last4WeeksData.pozos)
  const pozosTrend = last4WeeksData.pozosPrev > 0 
    ? ((last4WeeksData.pozos - last4WeeksData.pozosPrev) / last4WeeksData.pozosPrev * 100).toFixed(1)
    : 0
  
  // Métricas de riego
  const riegoTotal = Math.round(last4WeeksData.riego)
  const riegoTrend = last4WeeksData.riegoPrev > 0
    ? ((last4WeeksData.riego - last4WeeksData.riegoPrev) / last4WeeksData.riegoPrev * 100).toFixed(1)
    : 0
  
  // Métricas de servicios
  const serviciosTotal = Math.round(last4WeeksData.servicios)
  const serviciosTrend = last4WeeksData.serviciosPrev > 0
    ? ((last4WeeksData.servicios - last4WeeksData.serviciosPrev) / last4WeeksData.serviciosPrev * 100).toFixed(1)
    : 0
  
  // Mantener compatibilidad con código existente
  const currentConsumption = consumoPozos
  const consumptionTrend = pozosTrend

  // Preparar datos para WeeklyComparisonChart basado en años seleccionados
  const getMultiYearChartData = () => {
    const yearDataMap = {
      '2023': weeklyReadings2023,
      '2024': weeklyReadings2024,
      '2025': weeklyReadings2025,
      '2026': weeklyReadings2026
    }

    const sortedSelectedYears = [...comparisonYearsToShow].sort()
    
    // Generar datos para todos los años seleccionados
    return sortedSelectedYears.map(year => ({
      year,
      data: yearDataMap[year] || []
    }))
  }

  const multiYearData = getMultiYearChartData()
  
  // Debug: Log para verificar datos
  console.log('MultiYear Data:', multiYearData)
  console.log('Weekly Readings 2024:', weeklyReadings2024)
  console.log('Weekly Readings 2025:', weeklyReadings2025)

  return (
    <RedirectIfNotAuth>
      <div className="min-h-screen bg-background">
      <DashboardSidebar />
      
      <div className="ml-64">
        <DashboardHeader />
        <main className="p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Análisis de Consumo</h1>
                <p className="text-muted-foreground">Monitoreo detallado del consumo hídrico del sistema</p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm">
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  Exportar Reporte
                </Button>
              </div>
            </div>
          </div>


          {/* Métricas principales - Últimas 4 semanas vs 4 anteriores */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Total de Todos los Pozos */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Pozos</p>
                    <p className="text-xs text-muted-foreground/70">Servicios (11,12,3,7,14) + Riego (4,8,15) - Últimas 4 semanas</p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {consumoPozos.toLocaleString()} m³
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      {parseFloat(pozosTrend) > 0 ? (
                        <TrendingUpIcon className="h-4 w-4 text-destructive" />
                      ) : (
                        <TrendingDownIcon className="h-4 w-4 text-green-500" />
                      )}
                      <span className={`text-sm ${parseFloat(pozosTrend) > 0 ? 'text-destructive' : 'text-green-500'}`}>
                        {parseFloat(pozosTrend) > 0 ? '+' : ''}{pozosTrend}% vs 4 semanas anteriores
                      </span>
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <DropletIcon className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pozos de Riego */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pozos de Riego</p>
                    <p className="text-xs text-muted-foreground/70">Pozos (4, 8, 15) - Últimas 4 semanas</p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {riegoTotal.toLocaleString()} m³
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      {parseFloat(riegoTrend) > 0 ? (
                        <TrendingUpIcon className="h-4 w-4 text-destructive" />
                      ) : (
                        <TrendingDownIcon className="h-4 w-4 text-green-500" />
                      )}
                      <span className={`text-sm ${parseFloat(riegoTrend) > 0 ? 'text-destructive' : 'text-green-500'}`}>
                        {parseFloat(riegoTrend) > 0 ? '+' : ''}{riegoTrend}% vs 4 semanas anteriores
                      </span>
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Waves className="h-6 w-6 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pozos de Servicios */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pozos de Servicios</p>
                    <p className="text-xs text-muted-foreground/70">Pozos (11, 12, 3, 7, 14) - Últimas 4 semanas</p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {serviciosTotal.toLocaleString()} m³
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      {parseFloat(serviciosTrend) > 0 ? (
                        <TrendingUpIcon className="h-4 w-4 text-destructive" />
                      ) : (
                        <TrendingDownIcon className="h-4 w-4 text-green-500" />
                      )}
                      <span className={`text-sm ${parseFloat(serviciosTrend) > 0 ? 'text-destructive' : 'text-green-500'}`}>
                        {parseFloat(serviciosTrend) > 0 ? '+' : ''}{serviciosTrend}% vs 4 semanas anteriores
                      </span>
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <DropletIcon className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>






          
          {/* Nueva Sección: Comparativas Semanales con Gráficas y Tablas */}
          <div className="mt-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <BarChart3Icon className="h-6 w-6 text-primary" />
                Análisis de Comparativas Semanales
              </h2>
              <p className="text-muted-foreground mt-1">
                Comparación detallada entre años con indicadores de color y cantidad
              </p>
            </div>

            {/* Controles superiores */}
            <Card className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex flex-wrap items-center gap-4">
                  {/* Punto de Medición */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-semibold text-foreground whitespace-nowrap">Punto de Medición:</label>
                    <select
                      value={selectedPoint}
                      onChange={(e) => setSelectedPoint(e.target.value)}
                      className="border border-muted rounded-lg px-3 py-2 text-sm bg-background hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors min-w-[200px]"
                    >
                      <optgroup label="Pozos de Servicios">
                        <option value="medidor_general_pozos">Medidor General de Pozos</option>
                        <option value="pozo_11">Pozo 11</option>
                        <option value="pozo_12">Pozo 12</option>
                        <option value="pozo_14">Pozo 14</option>
                        <option value="pozo_7">Pozo 7</option>
                        <option value="pozo_3">Pozo 3</option>
                      </optgroup>
                      <optgroup label="Pozos de Riego">
                        <option value="pozo_4_riego">Pozo 4 Riego</option>
                        <option value="pozo_8_riego">Pozo 8 Riego</option>
                        <option value="pozo_15_riego">Pozo 15 Riego</option>
                      </optgroup>
                      <optgroup label="Residencias">
                        <option value="residencias_10_15">Residencias 10 y 15</option>
                        <option value="residencias_1_antiguo">Residencias 1 (Antiguo)</option>
                        <option value="residencias_2_ote">Residencias 2 Oriente</option>
                        <option value="residencias_3">Residencias 3</option>
                        <option value="residencias_4">Residencias 4</option>
                        <option value="residencias_5">Residencias 5</option>
                      </optgroup>
                      <optgroup label="Edificios Principales">
                        <option value="wellness_edificio">Wellness Edificio</option>
                        <option value="biblioteca">Biblioteca</option>
                        <option value="cetec">CETEC</option>
                        <option value="biotecnologia">Biotecnología</option>
                        <option value="arena_borrego">Arena Borrego</option>
                        <option value="centro_congresos">Centro de Congresos</option>
                        <option value="auditorio_luis_elizondo">Auditorio Luis Elizondo</option>
                        <option value="nucleo">Núcleo</option>
                        <option value="expedition">Expedition</option>
                      </optgroup>
                      <optgroup label="Torres de Enfriamiento">
                        <option value="wellness_torre_enfriamiento">Wellness Torre Enfriamiento</option>
                        <option value="cah3_torre_enfriamiento">CAH3 Torre Enfriamiento</option>
                        <option value="megacentral_te_2">Megacentral TE 2</option>
                        <option value="estadio_banorte_te">Estadio Banorte TE</option>
                      </optgroup>
                      <optgroup label="Circuitos">
                        <option value="circuito_8_campus">Circuito 8" Campus</option>
                        <option value="circuito_6_residencias">Circuito 6" Residencias</option>
                        <option value="circuito_4_a7_ce">Circuito 4" A7 CE</option>
                        <option value="circuito_planta_fisica">Circuito Planta Física</option>
                        <option value="circuito_megacentral">Circuito Megacentral</option>
                      </optgroup>
                    </select>
                  </div>

                  {/* Separador */}
                  <div className="h-8 w-px bg-gray-300"></div>

                  {/* Tipo de Gráfico */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-semibold text-foreground whitespace-nowrap">Tipo de Gráfico:</label>
                    <div className="flex gap-1 border rounded-lg p-1 bg-background">
                      <Button
                        variant={comparisonChartType === 'line' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setComparisonChartType('line')}
                        className="h-8 px-3"
                      >
                        Líneas
                      </Button>
                      <Button
                        variant={comparisonChartType === 'bar' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setComparisonChartType('bar')}
                        className="h-8 px-3"
                      >
                        Barras
                      </Button>
                    </div>
                  </div>

                  {/* Separador */}
                  <div className="h-8 w-px bg-gray-300"></div>

                  {/* Años a mostrar */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-semibold text-foreground whitespace-nowrap">Años:</label>
                    <div className="flex gap-1 border rounded-lg p-1 bg-background">
                      {availableYears.map(year => (
                        <Button
                          key={year}
                          variant={comparisonYearsToShow.includes(year) ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setComparisonYearsToShow(prev => {
                              if (prev.includes(year)) {
                                return prev.length > 1 ? prev.filter(y => y !== year) : prev
                              } else {
                                return [...prev, year].sort()
                              }
                            })
                          }}
                          className="h-8 px-3"
                        >
                          {year}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gráfica a pantalla completa */}
            <WeeklyComparisonChart
              title={selectedPoint === 'todos' ? 'Todos los Puntos (Suma Total)' : (consumptionPoints.flatMap(c => c.points).find(p => p.id === selectedPoint)?.name || "Punto de Medición")}
              unit="m³"
              chartType={comparisonChartType}
              showControls={false}
              multiYearData={multiYearData}
            />
          </div>




          <div className="mt-8"></div>




          {/* Sección de Tablas Detalladas por Punto de Consumo */}
          <div className="mt-8">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <TableIcon className="h-6 w-6 text-primary" />
                    Detalle por Punto de Medición - Año {selectedYearForReadings}
                  </h2>
                  <p className="text-muted-foreground mt-1">Vista detallada de todos los medidores del campus</p>
                </div>
                <div className="flex items-center gap-3">
                  {/* Selector de Año para Consumo */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Año:</label>
                    <select
                      value={selectedYearForReadings}
                      onChange={(e) => setSelectedYearForReadings(e.target.value)}
                      className="px-3 py-2 border border-muted rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      disabled={loading}
                    >
                      {AVAILABLE_YEARS.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  {/* Selector de semana */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Semana:</label>
                    <select
                      value={selectedWeek}
                      onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
                      className="px-3 py-2 border border-muted rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      disabled={loading}
                    >
                      {loading ? (
                        <option>Cargando...</option>
                      ) : availableWeeks.length > 0 ? (
                        availableWeeks.map(week => (
                          <option key={week.weekNumber} value={week.weekNumber}>
                            Semana {week.weekNumber} ({week.startDate} - {week.endDate})
                          </option>
                        ))
                      ) : (
                        <option>No hay semanas disponibles</option>
                      )}
                    </select>
                    {loading && (
                      <Loader2Icon className="h-4 w-4 animate-spin text-primary" />
                    )}
                  </div>
                  {/* Toggle comparación */}
                  <Button
                    variant={showComparison ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowComparison(!showComparison)}
                  >
                    {showComparison ? 'Con Comparación' : 'Sin Comparación'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Tabs de categorías */}
            <div className="mb-6 overflow-x-auto">
              <div className="flex gap-2 border-b border-muted pb-2">
                {loading ? (
                  <div className="px-4 py-2 text-sm text-muted-foreground">Cargando categorías...</div>
                ) : consumptionPoints.length === 0 ? (
                  <div className="px-4 py-2 text-sm text-muted-foreground">No hay categorías disponibles</div>
                ) : (
                  consumptionPoints.map(category => (
                    <button
                      key={category.id}
                      onClick={() => setActiveTab(category.id)}
                      className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                        activeTab === category.id
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      {category.name}
                      <span className="ml-2 text-xs opacity-70">
                        ({category.points.length})
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Descripción de la categoría activa */}
            {!loading && consumptionPoints.find(cat => cat.id === activeTab) && (
              <div className="mb-4 p-4 bg-primary/5 border-l-4 border-primary rounded">
                <p className="text-sm text-muted-foreground">
                  {consumptionPoints.find(cat => cat.id === activeTab).description}
                </p>
              </div>
            )}

            {/* Tabla de la categoría activa */}
            {!loading && consumptionPoints.map(category => (
              category.id === activeTab && (
                <ConsumptionTable
                  key={category.id}
                  title={category.name}
                  data={category.points}
                  weekNumber={selectedWeek}
                  showComparison={showComparison}
                  selectedYear={selectedYearForReadings}
                />
              )
            ))}

            <div className="mt-8"></div>

            {/* Controles para la tabla de comparación */}
            <div className="mb-4 flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold">Comparar años en tabla:</span>
                <div className="flex items-center gap-2">
                  <select
                    value={comparisonYearsToShow[0] || '2025'}
                    onChange={(e) => {
                      const newYear1 = e.target.value
                      setComparisonYearsToShow(prev => [newYear1, prev[1] || '2026'])
                    }}
                    className="px-3 py-2 border border-muted rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {availableYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  <span className="text-sm font-medium">vs</span>
                  <select
                    value={comparisonYearsToShow[1] || '2026'}
                    onChange={(e) => {
                      const newYear2 = e.target.value
                      setComparisonYearsToShow(prev => [prev[0] || '2025', newYear2])
                    }}
                    className="px-3 py-2 border border-muted rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {availableYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Tabla tipo Excel de comparación */}
            <div className="mb-6">
              <WeeklyComparisonTable
                title={`Tabla Comparativa Semanal ${comparisonYearsToShow.join(' vs ')} - Consumo Semanal`}
                data2024={multiYearData.find(data => data.year === comparisonYearsToShow[0])?.data || []}
                data2025={multiYearData.find(data => data.year === comparisonYearsToShow[1])?.data || []}
                pointName={selectedPoint === 'todos' ? 'Todos los Puntos (Suma Total)' : (consumptionPoints.flatMap(c => c.points).find(p => p.id === selectedPoint)?.name || "Punto de Medición")}
                unit="m³"
                year1={comparisonYearsToShow[0] || '2025'}
                year2={comparisonYearsToShow[1] || '2026'}
              />
            </div>
          </div>

         </main>
       </div>
     </div>
    </RedirectIfNotAuth>
  )
}