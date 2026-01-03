import { useParams, useNavigate } from "react-router"
import { useState, useEffect } from "react"
import { DashboardHeader } from "../components/dashboard-header"
import { DashboardSidebar } from "../components/dashboard-sidebar"
import { Card, CardHeader, CardContent } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { supabase } from '../supabaseClient'
import {
  ArrowLeftIcon,
  DropletIcon,
  MapPinIcon,
  CalendarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  AlertTriangleIcon,
  InfoIcon,
  FileTextIcon,
  SettingsIcon,
  BarChart3Icon,
  FilterIcon,
  Loader2Icon,
  GaugeIcon,
  ClockIcon,
  ActivityIcon
} from "lucide-react"
import ChartComponent from '../components/ChartComponent'
import WeeklyComparisonChart from '../components/WeeklyComparisonChart'
import WellComments from '../components/WellComments'
import WellEventsHistory from '../components/WellEventsHistory'
import datosPozo12 from '../lib/datos_pozo_12.json'

export default function WellDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  // Estados para datos de Supabase
  const [currentReading, setCurrentReading] = useState(0)
  const [currentConsumption, setCurrentConsumption] = useState(0)
  const [totalConsumption2026, setTotalConsumption2026] = useState(0)
  const [totalConsumption2025, setTotalConsumption2025] = useState(0)
  const [totalConsumption2024, setTotalConsumption2024] = useState(0)
  const [totalConsumption2023, setTotalConsumption2023] = useState(0)
  const [vsLastWeek, setVsLastWeek] = useState(0)
  const [vsLastYear, setVsLastYear] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [chartDataFromSupabase, setChartDataFromSupabase] = useState([])
  
  // Estados para los filtros de gráficas
  const [selectedMetrics, setSelectedMetrics] = useState(['reading', 'consumption'])
  const [chartType, setChartType] = useState('line')
  const [showComparison, setShowComparison] = useState(true)
  const [timeFilter, setTimeFilter] = useState('weekly') // 'yearly', 'quarterly', 'monthly', 'weekly'
  const [dateRange, setDateRange] = useState('all') // 'all', 'last6months', 'lastyear', 'custom'
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [visualizationType, setVisualizationType] = useState('general') // 'general', 'consumo-pozo'
  
  // Estados para comparación multi-año
  const [selectedYears, setSelectedYears] = useState(['2026']) // Años seleccionados para comparación
  const [availableYears] = useState(['2023', '2024', '2025', '2026']) // Años disponibles
  const [comparisonChartType, setComparisonChartType] = useState('line') // 'line' o 'bar'
  
  // Estados para datos de múltiples años
  const [weeklyReadings2023, setWeeklyReadings2023] = useState([])
  const [weeklyReadings2024, setWeeklyReadings2024] = useState([])
  const [weeklyReadings2025, setWeeklyReadings2025] = useState([])
  const [weeklyReadings2026, setWeeklyReadings2026] = useState([])
  
  // Cargar datos de Supabase al montar el componente
  useEffect(() => {
    fetchWellData()
  }, [id])

  // Cargar datos cuando cambian los años seleccionados                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
  useEffect(() => {
    fetchMultiYearData()                                                    
  }, [id, selectedYears])

  // Actualizar métricas seleccionadas cuando cambia el tipo de visualización
  useEffect(() => {
    if (visualizationType === 'consumo-pozo') {
      setSelectedMetrics(['consumoServicios', 'consumoRiego', 'total'])
      setTimeFilter('monthly') // Forzar vista mensual para consumo por pozo
    } else {
      setSelectedMetrics(['reading', 'consumption'])
      setTimeFilter('weekly') // Vista semanal para datos de Supabase
    }
  }, [visualizationType])

  // Función para cargar datos del pozo desde Supabase
  const fetchWellData = async () => {
    try {
      setLoading(true)
      setError(null)

      const year = 2026
      const lastYear = 2025
      const readingsTable = `lecturas_semana_agua_${year}`
      const consumptionTable = `lecturas_semana_agua_consumo_${year}`
      const lastYearConsumptionTable = `lecturas_semana_agua_consumo_${lastYear}`

      // Mapeo de IDs de pozos a columnas
      const columnMapping = {
        11: 'l_pozo_11',
        12: 'l_pozo_12',
        3: 'l_pozo_3',
        7: 'l_pozo_7',
        14: 'l_pozo_14',
        4: 'l_pozo_4_riego',
        8: 'l_pozo_8_riego',
        15: 'l_pozo_15_riego'
      }

      const columnName = columnMapping[id] || 'l_pozo_12'

      console.log('🔍 Cargando datos del pozo', id, 'columna:', columnName)

      // 1. GET: Lectura actual (última semana del año actual)
      const { data: readingsData, error: readingsError } = await supabase
        .from(readingsTable)
        .select('*')
        .order('l_numero_semana', { ascending: false })
        .limit(2)

      if (readingsError) throw readingsError

      // 2. GET: Consumo actual (última semana del año actual)
      const { data: consumptionData, error: consumptionError } = await supabase
        .from(consumptionTable)
        .select('*')
        .order('l_numero_semana', { ascending: false })
        .limit(2)

      if (consumptionError) throw consumptionError

      // 3. GET: Consumo del año pasado (misma semana)
      const currentWeekNumber = readingsData?.[0]?.l_numero_semana || 1
      const { data: lastYearData, error: lastYearError } = await supabase
        .from(lastYearConsumptionTable)
        .select('*')
        .eq('l_numero_semana', currentWeekNumber)
        .single()

      if (lastYearError && lastYearError.code !== 'PGRST116') {
        console.warn('⚠️ No hay datos del año pasado:', lastYearError)
      }

      console.log('✅ Lecturas:', readingsData)
      console.log('✅ Consumo:', consumptionData)
      console.log('✅ Año pasado:', lastYearData)

      // Procesar datos
      const lastWeekReading = parseFloat(readingsData?.[0]?.[columnName]) || 0
      const lastWeekConsumption = parseFloat(consumptionData?.[0]?.[columnName]) || 0
      const previousWeekConsumption = parseFloat(consumptionData?.[1]?.[columnName]) || 0
      const lastYearConsumption = parseFloat(lastYearData?.[columnName]) || 0

      // Calcular vs semana anterior
      const vsWeek = lastWeekConsumption - previousWeekConsumption

      // Calcular vs año anterior
      const vsYear = lastWeekConsumption - lastYearConsumption

      setCurrentReading(lastWeekReading)
      setCurrentConsumption(lastWeekConsumption)
      setVsLastWeek(vsWeek)
      setVsLastYear(vsYear)

      console.log('📊 Métricas calculadas:', {
        lectura: lastWeekReading,
        consumo: lastWeekConsumption,
        vsLastWeek: vsWeek,
        vsLastYear: vsYear
      })

      // Cargar datos para el gráfico desde Supabase (año actual)
      const chartData = await fetchChartDataFromSupabase(2026)
      setChartDataFromSupabase(chartData)
      setWeeklyReadings2026(chartData)

      // Calcular consumo total del año 2026
      const { data: allConsumptionData, error: allConsumptionError } = await supabase
        .from(consumptionTable)
        .select('*')
        .order('l_numero_semana', { ascending: true })

      if (!allConsumptionError && allConsumptionData) {
        const total = allConsumptionData.reduce((sum, row) => {
          return sum + (parseFloat(row[columnName]) || 0)
        }, 0)
        setTotalConsumption2026(total)
        console.log('📊 Consumo total 2026:', total)
      }

      // Calcular consumo total del año 2025
      const { data: allConsumptionData2025, error: allConsumptionError2025 } = await supabase
        .from('lecturas_semana_agua_consumo_2025')
        .select('*')
        .order('l_numero_semana', { ascending: true })

      if (!allConsumptionError2025 && allConsumptionData2025) {
        const total2025 = allConsumptionData2025.reduce((sum, row) => {
          return sum + (parseFloat(row[columnName]) || 0)
        }, 0)
        setTotalConsumption2025(total2025)
        console.log('📊 Consumo total 2025:', total2025)
      }

      // Calcular consumo total del año 2024
      const { data: allConsumptionData2024, error: allConsumptionError2024 } = await supabase
        .from('lecturas_semana_agua_consumo_2024')
        .select('*')
        .order('l_numero_semana', { ascending: true })

      if (!allConsumptionError2024 && allConsumptionData2024) {
        const total2024 = allConsumptionData2024.reduce((sum, row) => {
          return sum + (parseFloat(row[columnName]) || 0)
        }, 0)
        setTotalConsumption2024(total2024)
        console.log('📊 Consumo total 2024:', total2024)
      }

      // Calcular consumo total del año 2023
      const { data: allConsumptionData2023, error: allConsumptionError2023 } = await supabase
        .from('lecturas_semana_agua_consumo_2023')
        .select('*')
        .order('l_numero_semana', { ascending: true })

      if (!allConsumptionError2023 && allConsumptionData2023) {
        const total2023 = allConsumptionData2023.reduce((sum, row) => {
          return sum + (parseFloat(row[columnName]) || 0)
        }, 0)
        setTotalConsumption2023(total2023)
        console.log('📊 Consumo total 2023:', total2023)
      }

    } catch (err) {
      console.error('❌ Error cargando datos del pozo:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Función para cargar datos del gráfico desde Supabase para un año específico
  const fetchChartDataFromSupabase = async (year) => {
    try {
      const readingsTable = `lecturas_semana_agua_${year}`
      const consumptionTable = `lecturas_semana_agua_consumo_${year}`

      // Mapeo de IDs de pozos a columnas
      const columnMapping = {
        11: 'l_pozo_11',
        12: 'l_pozo_12',
        3: 'l_pozo_3',
        7: 'l_pozo_7',
        14: 'l_pozo_14',
        4: 'l_pozo_4_riego',
        8: 'l_pozo_8_riego',
        15: 'l_pozo_15_riego'
      }

      const columnName = columnMapping[id] || 'l_pozo_12'

      console.log(`📊 Cargando datos de gráfico para columna ${columnName} y año ${year}`)

      // Cargar todas las lecturas del año
      const { data: readingsData, error: readingsError } = await supabase
        .from(readingsTable)
        .select('*')
        .order('l_numero_semana', { ascending: true })

      if (readingsError) throw readingsError

      // Cargar todos los consumos del año
      const { data: consumptionData, error: consumptionError } = await supabase
        .from(consumptionTable)
        .select('*')
        .order('l_numero_semana', { ascending: true })

      if (consumptionError) throw consumptionError

      console.log(`✅ Datos de gráfico ${year} cargados:`, readingsData?.length, 'semanas')

      // Crear un mapa de datos existentes por número de semana
      const dataMap = new Map()
      
      ;(readingsData || []).forEach(reading => {
        const consumption = (consumptionData || []).find(c => c.l_numero_semana === reading.l_numero_semana)
        dataMap.set(reading.l_numero_semana, {
          reading: parseFloat(reading[columnName]) || 0,
          consumption: parseFloat(consumption?.[columnName]) || 0,
          fechaInicio: reading.l_fecha_inicio,
          fechaFin: reading.l_fecha_fin
        })
      })

      // Generar array de 52 semanas completas
      const chartData = Array.from({ length: 52 }, (_, index) => {
        const weekNumber = index + 1
        const weekData = dataMap.get(weekNumber)
        
        return {
          week: weekNumber,
          period: `Semana ${weekNumber}`,
          weekNumber: weekNumber,
          reading: weekData?.reading || 0,
          consumption: weekData?.consumption || 0,
          realConsumption: weekData?.consumption || 0,
          availableForConsumption: datosPozo12.especificaciones_anuales[0].m3_cedidos_por_anexo,
          m3CededByAnnex: datosPozo12.especificaciones_anuales[0].m3_cedidos_por_anexo,
          fechaInicio: weekData?.fechaInicio || null,
          fechaFin: weekData?.fechaFin || null
        }
      })

      return chartData
    } catch (err) {
      console.error(`❌ Error cargando datos del gráfico para año ${year}:`, err)
      return []
    }
  }

  // Función para cargar datos de múltiples años
  const fetchMultiYearData = async () => {
    try {
      const promises = selectedYears.map(async (year) => {
        const data = await fetchChartDataFromSupabase(parseInt(year))
        return { year, data }
      })
      
      const results = await Promise.all(promises)
      
      results.forEach(({ year, data }) => {
        if (year === '2023') setWeeklyReadings2023(data)
        if (year === '2024') setWeeklyReadings2024(data)
        if (year === '2025') setWeeklyReadings2025(data)
        if (year === '2026') setWeeklyReadings2026(data)
      })
    } catch (err) {
      console.error('❌ Error cargando datos multi-año:', err)
    }
  }

  // Preparar datos para WeeklyComparisonChart basado en años seleccionados
  const getMultiYearChartData = () => {
    const yearDataMap = {
      '2023': weeklyReadings2023,
      '2024': weeklyReadings2024,
      '2025': weeklyReadings2025,
      '2026': weeklyReadings2026
    }

    const sortedSelectedYears = [...selectedYears].sort()
    
    // Generar datos para todos los años seleccionados
    return sortedSelectedYears.map(year => ({
      year,
      data: yearDataMap[year] || []
    }))
  }

  const multiYearData = getMultiYearChartData()

  // Tipos de visualización disponibles
  const visualizationTypes = [
    { key: 'general', label: 'Vista General' },
    { key: 'consumo-pozo', label: 'Consumo por Pozo - Meses' }
  ]

  // Información estática de pozos con valores originales y actualizados
  const wellsStaticInfo = {
    11: {
      location: "Calle Talía 318",
      service: "Servicios",
      title: "06NVL114666/24ELGR06",
      annex: "2.1",
      m3CededByAnnex: 50000,
      m3PorAnexo: 190229.00,
      medidor: {
        fechaInstalacion: "2020-01-15",
        vidaUtilMeses: 60,
        topeLectura: 999999.99,
        estado: "activo",
        tipoFalla: null,
        fechaFalla: null
      },
      historialEstado: []
    },
    12: {
      location: "Calle Navio 358",
      service: "Servicios",
      title: "06NVL114666/24ELGR06",
      annex: "2.2",
      m3CededByAnnex: 20000,
      m3PorAnexo: 90885.00,
      medidor: {
        fechaInstalacion: "2019-08-20",
        vidaUtilMeses: 72,
        topeLectura: 999999.99,
        estado: "activo",
        tipoFalla: null,
        fechaFalla: null
      },
      historialEstado: [
        { fechaInicio: "2023-02-10", fechaFin: "2023-02-25", motivo: "Mantenimiento preventivo de bomba", estado: "parado" },
        { fechaInicio: "2024-07-05", fechaFin: "2024-07-08", motivo: "Reparación de tubería", estado: "mantenimiento" }
      ]
    },
    3: {
      location: "Gimnasio sur",
      service: "Servicios",
      title: "06NVL102953/24EMGR06",
      annex: "2.1",
      m3CededByAnnex: 0,
      m3PorAnexo: 1148.00,
      medidor: {
        fechaInstalacion: "2021-03-10",
        vidaUtilMeses: 48,
        topeLectura: 999999.99,
        estado: "activo",
        tipoFalla: null,
        fechaFalla: null
      },
      historialEstado: []
    },
    4: {
      location: "CDB2",
      service: "Riego",
      title: "06NVL102953/24EMGR06",
      annex: "2.2",
      m3CededByAnnex: 60000,
      m3PorAnexo: 90720.00,
      medidor: {
        fechaInstalacion: "2021-01-10",
        vidaUtilMeses: 60,
        topeLectura: 999999.99,
        estado: "activo",
        tipoFalla: null,
        fechaFalla: null
      },
      historialEstado: []
    },
    7: {
      location: "Calle Revolución",
      service: "Servicios",
      title: "06NVL102953/24EMGR06",
      annex: "2.3",
      m3CededByAnnex: 0,
      m3PorAnexo: 40000.00,
      medidor: {
        fechaInstalacion: "2020-06-15",
        vidaUtilMeses: 60,
        topeLectura: 999999.99,
        estado: "activo",
        tipoFalla: null,
        fechaFalla: null
      },
      historialEstado: []
    },
    8: {
      location: "Calle Junco de la Vega Esquina Arrollo Seco",
      service: "Riego",
      title: "06NVL102953/24EMGR06",
      annex: "2.4",
      m3CededByAnnex: 20000,
      m3PorAnexo: 38000.00,
      medidor: {
        fechaInstalacion: "2020-09-05",
        vidaUtilMeses: 60,
        topeLectura: 999999.99,
        estado: "activo",
        tipoFalla: null,
        fechaFalla: null
      },
      historialEstado: []
    },
    14: {
      location: "Calle Musas 323",
      service: "Servicios",
      title: "06NVL102953/24EMGR06",
      annex: "2.5",
      m3CededByAnnex: 0,
      m3PorAnexo: 64882.00,
      medidor: {
        fechaInstalacion: "2019-11-20",
        vidaUtilMeses: 72,
        topeLectura: 999999.99,
        estado: "activo",
        tipoFalla: null,
        fechaFalla: null
      },
      historialEstado: []
    },
    15: {
      location: "Posterior a Cedes (Enfrente del Edificio Núcleo)",
      service: "Riego",
      title: "06NVL102953/24EMGR06",
      annex: "2.6",
      m3CededByAnnex: 40000,
      m3PorAnexo: 78000.00,
      medidor: {
        fechaInstalacion: "2020-04-12",
        vidaUtilMeses: 60,
        topeLectura: 999999.99,
        estado: "activo",
        tipoFalla: null,
        fechaFalla: null
      },
      historialEstado: []
    }
  }

  const staticInfo = wellsStaticInfo[id] || wellsStaticInfo[12]

  // Datos específicos del Pozo basados en el JSON reorganizado
  const wellData = {
    id: parseInt(id) || 12,
    name: `Pozo ${id}`,
    service: staticInfo.service,
    location: staticInfo.location,
    annexCode: staticInfo.annex,
    titleCode: staticInfo.title,
    m3CededByAnnex: staticInfo.m3CededByAnnex,
    m3PorAnexo: staticInfo.m3PorAnexo,
    status: "active",
    yearlyData: datosPozo12.especificaciones_anuales.map(spec => ({
      year: spec.año,
      m3CededByAnnex: spec.m3_cedidos_por_anexo,
      m3CededByTitle: spec.m3_cedidos_por_titulo,
      realConsumption: spec.consumo_real_m3,
      availableForConsumption: spec.m3_disponibles_para_consumir,
      observations: spec.observaciones
    })),
    quarterlyData: datosPozo12.datos_trimestrales.consumo_trimestral.map((trimestre, index) => {
      const trimestreNum = ['primer_trimestre', 'segundo_trimestre', 'tercer_trimestre', 'cuarto_trimestre'];
      const quarterLabels = ['T1', 'T2', 'T3', 'T4'];
      
      return trimestreNum.map((key, qIndex) => {
        if (trimestre[key] !== null && trimestre[key] !== undefined) {
          return {
            period: `Q${qIndex + 1} ${trimestre.año}`,
            quarter: `${quarterLabels[qIndex]} ${trimestre.año}`,
            m3CededByAnnex: 0, // No hay datos específicos en el JSON
            m3CededByTitle: 0, // No hay datos específicos en el JSON  
            realConsumption: trimestre[key],
            availableForConsumption: 70885, // Valor por defecto del JSON
            observations: `${quarterLabels[qIndex]} ${trimestre.año} - Consumo real`
          }
        }
        return null;
      }).filter(Boolean);
    }).flat(),
    monthlyData: (() => {
      const monthlyConsumption = datosPozo12.datos_mensuales.consumo_mensual;
      const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                         'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
      const monthAbbrev = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 
                          'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      
      return monthlyConsumption.flatMap(yearData => {
        return monthNames.map((month, index) => {
          const consumption = yearData[month];
          if (consumption !== null) {
            return {
              period: `${monthAbbrev[index]} ${yearData.año}`,
              month: monthNames[index].charAt(0).toUpperCase() + monthNames[index].slice(1),
              m3CededByAnnex: 0, // No hay datos específicos en el JSON
              m3CededByTitle: 0, // No hay datos específicos en el JSON
              realConsumption: consumption,
              availableForConsumption: 70885, // Valor por defecto del JSON
              observations: `${monthNames[index].charAt(0).toUpperCase() + monthNames[index].slice(1)} ${yearData.año}: Consumo registrado`
            };
          }
          return null;
        }).filter(Boolean);
      });
    })(),
    weeklyData: (() => {
      const weeklyConsumption = datosPozo12.datos_semanales.consumo_semanal_detallado;
      const weeklyReadings = datosPozo12.datos_semanales.lecturas_acumuladas;
      
      return weeklyConsumption.map((week, index) => {
        const matchingReading = weeklyReadings.find(reading => 
          reading.fecha.includes(week.periodo.split(' ')[2]) && 
          reading.fecha.includes(week.periodo.split(' ')[3])
        );
        
        return {
          period: week.periodo,
          week: `Sem ${index + 1}`,
          m3CededByAnnex: 0,
          m3CededByTitle: 0,
          realConsumption: week.total_pozos,
          consumoServicios: week.consumo_servicios,
          consumoRiego: week.consumo_riego,
          availableForConsumption: 70885,
          observations: week.notas || `Semana del ${week.periodo}`,
          lectura: matchingReading?.lectura || 0
        };
      });
    })(),
    technicalSpecs: {
      depth: "45m",
      waterLevel: "12m",
      flow: "850 L/min",
      pressure: "2.3 bar",
      temperature: "19°C",
      ph: "7.1",
      quality: "good"
    }
  }

  // Opciones de métricas disponibles para graficar (coinciden con las 4 tarjetas de abajo)
  const availableMetrics = [
    { key: 'reading', label: 'Lectura Acumulada (m³)', color: '#3b82f6' },
    { key: 'consumption', label: 'Consumo Semanal (m³)', color: '#10b981' },
    { key: 'vsLastWeek', label: 'vs Semana Anterior (m³)', color: '#f59e0b' },
    { key: 'vsLastYear', label: 'vs Año Anterior (m³)', color: '#8b5cf6' }
  ]

  // Filtrar datos por rango de fechas
  const filterDataByDateRange = (data) => {
    if (dateRange === 'all') return data;
    
    const now = new Date();
    let startDate = new Date();
    
    switch (dateRange) {
      case 'last6months':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case 'lastyear':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate);
          const endDate = new Date(customEndDate);
          return data.filter(item => {
            // Para datos semanales, usar la fecha del período
            if (timeFilter === 'weekly' && item.period) {
              const itemDate = new Date(item.period.split(' - ')[0]);
              return itemDate >= startDate && itemDate <= endDate;
            }
            return true;
          });
        }
        return data;
      default:
        return data;
    }
    
    // Filtrar por año para datos anuales, trimestrales y mensuales
    if (timeFilter !== 'weekly') {
      return data.filter(item => {
        const itemYear = parseInt(item.year || item.quarter?.split(' ')[1] || item.period?.split(' ')[1]);
        return itemYear >= startDate.getFullYear();
      });
    }
    
    // Filtrar por fecha para datos semanales
    return data.filter(item => {
      const itemDate = new Date(item.fechaInicio);
      return itemDate >= startDate;
    });
  };

  // Preparar datos para los gráficos según el filtro de tiempo y tipo de visualización
  const getChartData = () => {
    let sourceData = []
    let labelKey = 'year'
    
    // Si es visualización de consumo por pozo, forzar vista mensual
    if (visualizationType === 'consumo-pozo') {
      sourceData = wellData.monthlyData || []
      labelKey = 'period'
    } else {
      switch (timeFilter) {
        case 'weekly':
          // Usar datos de Supabase si están disponibles, sino usar JSON
          sourceData = chartDataFromSupabase.length > 0 ? chartDataFromSupabase : wellData.weeklyData || []
          labelKey = 'period'
          break
        case 'quarterly':
          sourceData = wellData.quarterlyData || []
          labelKey = 'quarter'
          break
        case 'monthly':
          sourceData = wellData.monthlyData || []
          labelKey = 'period'
          break
        case 'yearly':
        default:
          sourceData = wellData.yearlyData || []
          labelKey = 'year'
          break
      }
    }
    
    // Aplicar filtros de fecha
    const filteredData = filterDataByDateRange(sourceData);
    
    if (visualizationType === 'consumo-pozo') {
      // Para la vista de consumo por pozo, usar datos mensuales del JSON
      const monthNames = {
        'enero': 'Ene', 'febrero': 'Feb', 'marzo': 'Mar', 
        'abril': 'Abr', 'mayo': 'May', 'junio': 'Jun',
        'julio': 'Jul', 'agosto': 'Ago', 'septiembre': 'Sep', 
        'octubre': 'Oct', 'noviembre': 'Nov', 'diciembre': 'Dic'
      }
      
      const monthlyData = []
      datosPozo12.datos_mensuales.consumo_mensual.forEach(yearData => {
        Object.entries(monthNames).forEach(([month, shortMonth]) => {
          if (yearData[month] !== null) {
            monthlyData.push({
              period: `${shortMonth} ${yearData.año}`,
              consumoServicios: yearData[month] * 0.6, // Estimado 60% para servicios
              consumoRiego: yearData[month] * 0.4, // Estimado 40% para riego
              total: yearData[month]
            })
          }
        })
      })
      
      return monthlyData
    }
    
    // Vista general
    return filteredData.map(data => ({
      [labelKey]: timeFilter === 'yearly' 
        ? data.year?.toString().replace(' (hasta mayo)', '')
        : data[labelKey] || data.period,
      reading: data.reading || 0,
      consumption: data.consumption || 0,
      realConsumption: data.realConsumption || 0,
      consumoServicios: data.consumoServicios || 0,
      consumoRiego: data.consumoRiego || 0,
      availableForConsumption: data.availableForConsumption || 0,
      m3CededByAnnex: data.m3CededByAnnex || 0,
      m3CededByTitle: data.m3CededByTitle || 0,
      vsLastWeek: data.vsLastWeek || 0,
      vsLastYear: data.vsLastYear || 0,
      efficiency: data.availableForConsumption > 0 
        ? ((data.realConsumption / data.availableForConsumption) * 100).toFixed(1)
        : 0
    }))
  }

  const chartData = getChartData()

  // Función para alternar métricas seleccionadas
  const toggleMetric = (metricKey) => {
    setSelectedMetrics(prev => 
      prev.includes(metricKey) 
        ? prev.filter(m => m !== metricKey)
        : [...prev, metricKey]
    )
  }

  const getConsumptionTrend = (current, previous) => {
    if (!previous || previous === 0) return "new"
    if (current > previous) return "up"
    if (current < previous) return "down"
    return "stable"
  }

  const getConsumptionStatus = (real, available) => {
    const percentage = (real / available) * 100
    if (percentage > 100) return { status: "critical", color: "red", text: "Excede límite" }
    if (percentage > 80) return { status: "warning", color: "yellow", text: "Cerca del límite" }
    if (percentage > 50) return { status: "normal", color: "green", text: "Uso normal" }
    return { status: "low", color: "blue", text: "Uso bajo" }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar fijo */}
      <DashboardSidebar />
      
      {/* Contenido principal con margen para el sidebar */}
      <div className="ml-64">
        <DashboardHeader />
        <main className="p-6">
          <div className="space-y-6">
            {/* Header con navegación de regreso */}
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => navigate('/pozos')}
                className="flex items-center gap-2"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Volver a Pozos
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{wellData.name}</h1>
                <p className="text-gray-600 mt-1">Información detallada y consumo histórico</p>
              </div>
            </div>

            {/* Información general del pozo */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <InfoIcon className="h-5 w-5" />
                    Información General
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Ubicación</label>
                        <p className="text-sm text-gray-900 flex items-center gap-1">
                          <MapPinIcon className="h-4 w-4" />
                          {wellData.location}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Servicio</label>
                        <p className="text-sm text-gray-900">{wellData.service}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Código de Anexo</label>
                        <p className="text-sm text-gray-900 font-mono">{wellData.annexCode}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Código de Título</label>
                        <p className="text-sm text-gray-900 font-mono">{wellData.titleCode}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">m³ cedidos por Anexo (2026)</label>
                        <p className="text-sm text-gray-900">{wellData.m3CededByAnnex.toLocaleString()}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">m³ por Anexo (Actualizado)</label>
                        <p className="text-sm text-gray-900 font-semibold">{wellData.m3PorAnexo.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Estado</label>
                        <Badge className="bg-green-100 text-green-800 border-green-200">Activo</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Especificaciones Técnicas e Información del Medidor */}
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <SettingsIcon className="h-5 w-5" />
                    Especificaciones Técnicas
                  </h2>

                  {staticInfo.medidor ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4" />
                            Fecha de Instalación
                          </label>
                          <p className="text-sm text-gray-900 font-medium mt-1">
                            {new Date(staticInfo.medidor.fechaInstalacion).toLocaleDateString('es-MX', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                            <ClockIcon className="h-4 w-4" />
                            Vida Útil
                          </label>
                          <p className="text-sm text-gray-900 font-medium mt-1">
                            {staticInfo.medidor.vidaUtilMeses} meses ({(staticInfo.medidor.vidaUtilMeses / 12).toFixed(1)} años)
                          </p>
                        </div>
                      </div>

                      <div className="border-t pt-3">
                        <label className="text-sm font-medium text-gray-500">Tope de Lectura</label>
                        <p className="text-base text-gray-900 font-semibold">
                          {staticInfo.medidor.topeLectura.toLocaleString('es-MX', { minimumFractionDigits: 2 })} m³
                        </p>
                      </div>

                      <div className="border-t pt-3">
                        <label className="text-sm font-medium text-gray-500">Lectura Actual</label>
                        <p className="text-base text-blue-600 font-semibold">
                          {currentReading.toLocaleString('es-MX', { minimumFractionDigits: 2 })} m³
                        </p>
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Capacidad utilizada</span>
                            <span>{((currentReading / staticInfo.medidor.topeLectura) * 100).toFixed(2)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                (currentReading / staticInfo.medidor.topeLectura) * 100 > 90
                                  ? 'bg-red-600'
                                  : (currentReading / staticInfo.medidor.topeLectura) * 100 > 70
                                  ? 'bg-yellow-500'
                                  : 'bg-blue-600'
                              }`}
                              style={{ width: `${Math.min((currentReading / staticInfo.medidor.topeLectura) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      <div className="border-t pt-3">
                        <label className="text-sm font-medium text-gray-500">Estado del Medidor</label>
                        <div className="mt-2">
                          <Badge className={
                            staticInfo.medidor.estado === 'activo'
                              ? 'bg-green-100 text-green-800 border-green-200'
                              : staticInfo.medidor.estado === 'falla'
                              ? 'bg-red-100 text-red-800 border-red-200'
                              : staticInfo.medidor.estado === 'mantenimiento'
                              ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                              : 'bg-orange-100 text-orange-800 border-orange-200'
                          }>
                            <ActivityIcon className="h-3 w-3 inline mr-1" />
                            {staticInfo.medidor.estado === 'activo' ? 'Activo' :
                             staticInfo.medidor.estado === 'falla' ? 'Falla Detectada' :
                             staticInfo.medidor.estado === 'mantenimiento' ? 'En Mantenimiento' :
                             'Requiere Reemplazo'}
                          </Badge>
                        </div>

                        {staticInfo.medidor.estado === 'falla' && staticInfo.medidor.tipoFalla && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-800">
                              <strong>Tipo de falla:</strong> {staticInfo.medidor.tipoFalla}
                            </p>
                            {staticInfo.medidor.fechaFalla && (
                              <p className="text-xs text-red-600 mt-1">
                                Detectada el {new Date(staticInfo.medidor.fechaFalla).toLocaleDateString('es-MX')}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {((currentReading / staticInfo.medidor.topeLectura) * 100) > 90 && (
                        <div className="p-2 bg-red-50 border-l-4 border-red-400 rounded">
                          <div className="flex items-start gap-2">
                            <AlertTriangleIcon className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-medium text-red-800">
                                Alerta: Medidor cerca del tope
                              </p>
                              <p className="text-xs text-red-700 mt-1">
                                Programar reemplazo pronto
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No hay información disponible</p>
                  )}
                </div>
              </Card>
            </div>

          

            {/* Historial de consumo - DESHABILITADO */}
            {false && (
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileTextIcon className="h-5 w-5" />
                  Historial de Consumo
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500  tracking-wider">
                          AÑO
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500  tracking-wider">
                          m³ CEDIDOS POR ANO
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500  tracking-wider">
                          m³ CEDIDOS POR TÍTULO
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500  tracking-wider">
                         m³ DISPONIBLES PARA CONSUMIR
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500  tracking-wider">
                        CONSUMO REAL (m³) 
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500  tracking-wider">
                        ESTADO
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500  tracking-wider">
                        OBSERVACIONES
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {wellData.yearlyData.map((data, index) => {
                        const consumptionStatus = getConsumptionStatus(data.realConsumption, data.availableForConsumption)
                        
                        return (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {data.year}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {data.m3CededByAnnex.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {data.m3CededByTitle.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex items-center gap-2">
                              {data.availableForConsumption.toLocaleString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                             
                              {data.realConsumption.toLocaleString()}
                                {index > 0 && wellData.yearlyData[index - 1] && (
                                  <>
                                    {getConsumptionTrend(data.realConsumption, wellData.yearlyData[index - 1].realConsumption) === 'up' && (
                                      <TrendingUpIcon className="h-4 w-4 text-red-500" />
                                    )}
                                    {getConsumptionTrend(data.realConsumption, wellData.yearlyData[index - 1].realConsumption) === 'down' && (
                                      <TrendingDownIcon className="h-4 w-4 text-green-500" />
                                    )}
                                  </>
                                )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge className={`bg-${consumptionStatus.color}-100 text-${consumptionStatus.color}-800 border-${consumptionStatus.color}-200`}>
                                {consumptionStatus.text}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                              <div className="flex items-start gap-2">
                                {consumptionStatus.status === 'critical' && (
                                  <AlertTriangleIcon className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                                )}
                                <span className="line-clamp-2">{data.observations}</span>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
            )}

    {/* Métricas en tiempo real desde Supabase */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {loading ? (
                    <Card className="p-4 col-span-5">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2Icon className="h-5 w-5 animate-spin text-gray-400" />
                        <span className="text-sm text-gray-500">Cargando métricas...</span>
                      </div>
                    </Card>
                  ) : error ? (
                    <Card className="p-4 col-span-5">
                      <div className="flex items-center gap-2 text-red-600">
                        <AlertTriangleIcon className="h-5 w-5" />
                        <span className="text-sm">Error: {error}</span>
                      </div>
                    </Card>
                  ) : (
                    <>
                      {/* Lectura Actual del Medidor */}
                      <Card className="p-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Lectura Actual del Medidor</h4>
                        <div className="flex items-center gap-2">
                          <DropletIcon className="h-5 w-5 text-blue-500" />
                          <span className="text-lg font-semibold text-gray-900">
                            {currentReading.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m³
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Última semana registrada 45</p>
                      </Card>

                      {/* Consumo de la Última Semana */}
                      <Card className="p-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Consumo de la Última Semana</h4>
                        <div className="flex items-center gap-2">
                          <DropletIcon className="h-5 w-5 text-green-500" />
                          <span className="text-lg font-semibold text-gray-900">
                            {currentConsumption.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m³
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Última semana 45</p>
                      </Card>

                      {/* Consumo vs Semana Anterior */}
                      <Card className="p-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Consumo vs Semana Anterior</h4>
                        <div className="flex items-center gap-2">
                          {vsLastWeek > 0 ? (
                            <TrendingUpIcon className="h-5 w-5 text-red-500" />
                          ) : vsLastWeek < 0 ? (
                            <TrendingDownIcon className="h-5 w-5 text-green-500" />
                          ) : (
                            <div className="h-5 w-5" />
                          )}
                          <span className={`text-lg font-semibold ${vsLastWeek > 0 ? 'text-red-600' : vsLastWeek < 0 ? 'text-green-600' : 'text-gray-900'}`}>
                            {vsLastWeek > 0 ? '+' : ''}{vsLastWeek.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m³
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {vsLastWeek > 0 ? 'Aumento' : vsLastWeek < 0 ? 'Disminución' : 'Sin cambio'}
                        </p>
                      </Card>

                      {/* Consumo vs Año Anterior */}
                      <Card className="p-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Consumo vs Año Anterior</h4>
                        <div className="flex items-center gap-2">
                          {vsLastYear > 0 ? (
                            <TrendingUpIcon className="h-5 w-5 text-red-500" />
                          ) : vsLastYear < 0 ? (
                            <TrendingDownIcon className="h-5 w-5 text-green-500" />
                          ) : (
                            <div className="h-5 w-5" />
                          )}
                          <span className={`text-lg font-semibold ${vsLastYear > 0 ? 'text-red-600' : vsLastYear < 0 ? 'text-green-600' : 'text-gray-900'}`}>
                            {vsLastYear > 0 ? '+' : ''}{vsLastYear.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m³
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Misma semana 2024</p>
                      </Card>
                    </>
                  )}
                </div>

              {/* Sección de Comparativas Semanales entre Años */}
            <div className="mt-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <BarChart3Icon className="h-6 w-6 text-primary" />
                  Análisis de Comparativas Semanales - Pozo {id}
                </h2>
                <p className="text-muted-foreground mt-1">
                  Comparación detallada del consumo entre diferentes años
                </p>
              </div>

              {/* Filtros arriba del gráfico */}
              <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-muted/30 rounded-lg border border-muted">
                {/* Tipo de Gráfico */}
                <div className="flex items-center gap-2">
                  <label className="text-sm font-semibold text-foreground">Tipo de Gráfico:</label>
                  <select 
                    value={comparisonChartType} 
                    onChange={(e) => setComparisonChartType(e.target.value)}
                    className="border border-muted rounded-lg px-3 py-2 text-sm bg-background hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                  >
                    <option value="line">Líneas</option>
                    <option value="bar">Barras</option>
                  </select>
                </div>

                {/* Selección de años para comparación */}
                <div className="flex items-center gap-2">
                  <label className="text-sm font-semibold text-foreground">Años a mostrar:</label>
                  <div className="flex gap-2">
                    {availableYears.map(year => (
                      <Button
                        key={year}
                        variant={selectedYears.includes(year) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setSelectedYears(prev => {
                            if (prev.includes(year)) {
                              // Si ya está seleccionado, quitarlo (mínimo 1 año)
                              return prev.length > 1 ? prev.filter(y => y !== year) : prev
                            } else {
                              // Si no está seleccionado, agregarlo
                              return [...prev, year].sort()
                            }
                          })
                        }}
                        className={`text-xs transition-all duration-200 ${
                          selectedYears.includes(year) 
                            ? 'bg-primary text-primary-foreground shadow-md' 
                            : 'hover:bg-muted/50'
                        }`}
                      >
                        {year}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Gráfica de comparación */}
              <div className="mb-6">
                <WeeklyComparisonChart
                  title={`Pozo ${id} - ${staticInfo.service}`}
                  unit="m³"
                  chartType={comparisonChartType}
                  showControls={false}
                  multiYearData={multiYearData}
                  total2023={totalConsumption2023}
                />
              </div>
            </div>

              {/* Sección de Comentarios e Historial de Eventos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Componente de Comentarios */}
              <WellComments wellId={parseInt(id)} />

              {/* Componente de Historial de Eventos */}
              <WellEventsHistory wellId={parseInt(id)} />
            </div>
         

            {/* Alertas y recomendaciones específicas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <AlertTriangleIcon className="h-5 w-5 text-red-500" />
                    Alertas Críticas
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start p-3 bg-red-50 border-l-4 border-red-400 rounded">
                      <AlertTriangleIcon className="h-5 w-5 text-red-400 mt-0.5" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-red-800">
                          Consumo excesivo en 2025
                        </p>
                        <p className="text-sm text-red-700">
                          El consumo hasta mayo (84,493 m³) excede significativamente el volumen disponible (70,885 m³)
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                      <AlertTriangleIcon className="h-5 w-5 text-yellow-400 mt-0.5" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-yellow-800">
                          Incremento abrupto de consumo
                        </p>
                        <p className="text-sm text-yellow-700">
                          El consumo aumentó drasticamente de 36,152 m³ en 2024 a 84,493 m³ en solo 5 meses de 2025
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Recomendaciones
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                      <InfoIcon className="h-5 w-5 text-blue-400 mt-0.5" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-blue-800">
                          Revisión de permisos
                        </p>
                        <p className="text-sm text-blue-700">
                          Solicitar ampliación de derechos de agua o revisar la distribución actual
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start p-3 bg-green-50 border-l-4 border-green-400 rounded">
                      <InfoIcon className="h-5 w-5 text-green-400 mt-0.5" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-800">
                          Implementar medidas de control
                        </p>
                        <p className="text-sm text-green-700">
                          Instalar sistemas de monitoreo en tiempo real para controlar el consumo
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

          </div>
        </main>
      </div>
    </div>
  )
}