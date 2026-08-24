import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from "react-router"
import { DashboardHeader } from "../components/dashboard-header"
import { DashboardSidebar } from "../components/dashboard-sidebar"
import { Card, CardContent } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { supabase } from '../supabaseClient'
import WellsGeneralCharts from '../components/WellsGeneralCharts'
import WellEventsHistory from '../components/WellEventsHistory'
import WeeklyComparisonChart from '../components/WeeklyComparisonChart'
import {
  DropletIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  SettingsIcon,
  EyeIcon,
  Plus,
  PlusIcon,
  Loader2Icon,
  X,
  GaugeIcon,
  CalendarIcon,
  ClockIcon,
  FileTextIcon,
  BellIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  MinusIcon,
  BarChart3Icon,
  LineChartIcon,
  Waves
} from "lucide-react"

export default function WellsPage() {
  const navigate = useNavigate()
  const [wellsData, setWellsData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [configModalOpen, setConfigModalOpen] = useState(false)
  const [eventsModalOpen, setEventsModalOpen] = useState(false)
  const [selectedWell, setSelectedWell] = useState(null)
  const [wellEvents, setWellEvents] = useState([])
  const [recentAlerts, setRecentAlerts] = useState([])
  const [chartMode, setChartMode] = useState('timeline') // 'timeline' o 'analysis'
  const [kpiData, setKpiData] = useState({
    totalGeneral: 0,
    promedioAnual: 0,
    total2026: 0,
    total2025: 0,
    total2024: 0,
    total2023: 0,
    cambioAnual: 0,
    vsSemanaAnterior: 0,
    maxYear: { year: '2026', total: 0 },
    minYear: { year: '2023', total: 0 }
  })
  const [weeklyData, setWeeklyData] = useState({
    multiYearData: [],
    multiYearDataRiego: [],
    multiYearDataServicios: [],
    currentYearData: [],
    previousYearData: []
  })
  const [metrics, setMetrics] = useState({ pozos: 0, riego: 0, servicios: 0 })
  const [pozosTrend, setPozosTrend] = useState('0.0')
  const [riegoTrend, setRiegoTrend] = useState('0.0')
  const [serviciosTrend, setServiciosTrend] = useState('0.0')
  const [weeklyMetrics, setWeeklyMetrics] = useState({ pozos: 0, riego: 0, servicios: 0 })
  const [pozosTrendW, setPozosTrendW] = useState('0.0')
  const [riegoTrendW, setRiegoTrendW] = useState('0.0')
  const [serviciosTrendW, setServiciosTrendW] = useState('0.0')
  
  // Información estática de pozos (igual que en WellDetailPage)
  const [wellsStaticInfo, setWellsStaticInfo] = useState({
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
    7: {
      location: "Zona Servicios",
      service: "Servicios",
      title: "06NVL102953/24EMGR06",
      annex: "2.3",
      m3CededByAnnex: 0,
      m3PorAnexo: 50000.00,
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
    14: {
      location: "Zona Servicios",
      service: "Servicios",
      title: "06NVL102953/24EMGR06",
      annex: "2.4",
      m3CededByAnnex: 0,
      m3PorAnexo: 65885.00,
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
    4: {
      location: "Zona Riego",
      service: "Riego",
      title: "06NVL102953/24EMGR06",
      annex: "2.4",
      m3CededByAnnex: 0,
      m3PorAnexo: 38000.00,
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
    8: {
      location: "Zona Riego",
      service: "Riego",
      title: "06NVL102953/24EMGR06",
      annex: "2.5",
      m3CededByAnnex: 0,
      m3PorAnexo: 45885.00,
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
    15: {
      location: "Posterior a Cedes (enfrente de Núcleo)",
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
  })
  
  // Definición de pozos con sus columnas en Supabase
  const wellsConfig = [
    // POZOS DE SERVICIOS
    { id: 11, name: "Pozo 11", column: "l_pozo_11" },
    { id: 12, name: "Pozo 12", column: "l_pozo_12" },
    { id: 3, name: "Pozo 3", column: "l_pozo_3" },
    { id: 7, name: "Pozo 7", column: "l_pozo_7" },
    { id: 14, name: "Pozo 14", column: "l_pozo_14" },
    // POZOS DE RIEGO
    { id: 4, name: "Pozo 4", column: "l_pozo_4_riego" },
    { id: 8, name: "Pozo 8", column: "l_pozo_8_riego" },
    { id: 15, name: "Pozo 15", column: "l_pozo_15_riego" }
  ]

  // Cargar datos de Supabase
  useEffect(() => {
    fetchWellsData()
  }, [])

  // ========================================
  // Suscripción Realtime a well_events
  // Actualiza recentAlerts y alertCount en vivo
  // ========================================
  useEffect(() => {
    const channel = supabase
      .channel('well-events-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'well_events' },
        (payload) => {
          console.log('🔔 Realtime well_events:', payload.eventType, payload)

          if (payload.eventType === 'INSERT') {
            const newEvent = payload.new
            // Solo agregar a recientes si está activo
            if (newEvent.event_status === 'activo') {
              setRecentAlerts(prev => [newEvent, ...prev].slice(0, 5))
              setWellsData(prev => prev.map(well =>
                well.id === newEvent.well_id
                  ? { ...well, alertCount: (well.alertCount || 0) + 1 }
                  : well
              ))
            }
          }

          if (payload.eventType === 'UPDATE') {
            const updated = payload.new
            const old = payload.old
            // Si pasó de activo → completado/cancelado
            if (old.event_status === 'activo' && updated.event_status !== 'activo') {
              setRecentAlerts(prev => prev.filter(a => a.id !== updated.id))
              setWellsData(prev => prev.map(well =>
                well.id === updated.well_id
                  ? { ...well, alertCount: Math.max((well.alertCount || 1) - 1, 0) }
                  : well
              ))
            }
            // Si se re-activó
            if (old.event_status !== 'activo' && updated.event_status === 'activo') {
              setRecentAlerts(prev => [updated, ...prev.filter(a => a.id !== updated.id)].slice(0, 5))
              setWellsData(prev => prev.map(well =>
                well.id === updated.well_id
                  ? { ...well, alertCount: (well.alertCount || 0) + 1 }
                  : well
              ))
            }
          }

          if (payload.eventType === 'DELETE') {
            const deleted = payload.old
            setRecentAlerts(prev => prev.filter(a => a.id !== deleted.id))
            if (deleted.event_status === 'activo') {
              setWellsData(prev => prev.map(well =>
                well.id === deleted.well_id
                  ? { ...well, alertCount: Math.max((well.alertCount || 1) - 1, 0) }
                  : well
              ))
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime well_events status:', status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchWellsData = async () => {
    try {
      setLoading(true)
      setError(null)

      const year = 2026
      const readingsTable = `lecturas_semana_agua_${year}`
      const consumptionTable = `lecturas_semana_agua_consumo_${year}`

      console.log('🔍 Cargando datos de pozos desde:', readingsTable, consumptionTable)

      // Cargar lecturas
      const { data: readingsData, error: readingsError } = await supabase
        .from(readingsTable)
        .select('*')
        .order('l_numero_semana', { ascending: false })
        .limit(2) // Últimas 2 semanas

      if (readingsError) throw readingsError

      // Cargar consumo (TODAS las semanas del año para calcular el total)
      const { data: consumptionData, error: consumptionError } = await supabase
        .from(consumptionTable)
        .select('*')
        .order('l_numero_semana', { ascending: false })

      if (consumptionError) throw consumptionError

      console.log('✅ Lecturas:', readingsData)
      console.log('✅ Consumo:', consumptionData)

      // Cargar eventos activos para todos los pozos
      const { data: eventsData } = await supabase
        .from('well_events')
        .select('*')
        .eq('event_status', 'activo')
        .order('start_date', { ascending: false })

      // Guardar alertas recientes para la sección inferior (máx 5)
      setRecentAlerts((eventsData || []).slice(0, 5))

      // Contar alertas por pozo
      const alertsByWell = {}
      eventsData?.forEach(event => {
        alertsByWell[event.well_id] = (alertsByWell[event.well_id] || 0) + 1
      })

      // Procesar datos para cada pozo
      const currentWeek = readingsData?.[0]?.l_numero_semana || 0

      const processedWells = wellsConfig.map(well => {
        const staticInfo = wellsStaticInfo[well.id] || {}
        const lastWeekReading = readingsData?.[0]?.[well.column] || 0
        const previousWeekReading = readingsData?.[1]?.[well.column] || 0
        const lastWeekConsumption = consumptionData?.[0]?.[well.column] || 0
        const previousWeekConsumption = consumptionData?.[1]?.[well.column] || 0

        // Calcular m³ disponibles (ahora se llama "m3 para consumir")
        const m3ParaConsumir = (staticInfo.m3PorAnexo || 0) - (staticInfo.m3CededByAnnex || 0)

        // Calcular consumo total del año 2026
        const totalConsumption2026 = consumptionData?.reduce((sum, row) => {
          return sum + (parseFloat(row[well.column]) || 0)
        }, 0) || 0

        // Calcular % de consumo
        const consumptionPercent = m3ParaConsumir > 0 ? (totalConsumption2026 / m3ParaConsumir) * 100 : 0

        // Calcular agua disponible última semana
        const aguaDisponibleUltimaSemana = m3ParaConsumir - totalConsumption2026

        // Calcular vs semana anterior
        const vsLastWeek = lastWeekConsumption - previousWeekConsumption

        // Número de alertas activas
        const alertCount = alertsByWell[well.id] || 0

        return {
          ...well,
          tipo: staticInfo.service || 'N/A',
          location: staticInfo.location || 'N/A',
          service: staticInfo.service || 'N/A',
          lastWeekReading: parseFloat(lastWeekReading) || 0,
          lastWeekConsumption: parseFloat(lastWeekConsumption) || 0,
          m3ParaConsumir: m3ParaConsumir,
          totalConsumption2026: totalConsumption2026,
          consumptionPercent: parseFloat(consumptionPercent.toFixed(2)) || 0,
          aguaDisponibleUltimaSemana: aguaDisponibleUltimaSemana,
          vsLastWeek: parseFloat(vsLastWeek) || 0,
          weekNumber: currentWeek,
          alertCount: alertCount
        }
      })

      setWellsData(processedWells)
      console.log('✅ Datos procesados:', processedWells)

      // Cargar datos para KPIs y gráficas de comparación
      await fetchKPIsAndChartData()
    } catch (err) {
      console.error('❌ Error cargando datos de pozos:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchKPIsAndChartData = async () => {
    try {
      const years = [2023, 2024, 2025, 2026]
      const allPozos = ['l_pozo_11', 'l_pozo_12', 'l_pozo_3', 'l_pozo_7', 'l_pozo_14', 'l_pozo_4_riego', 'l_pozo_8_riego', 'l_pozo_15_riego']
      const pozosRiego = ['l_pozo_4_riego', 'l_pozo_8_riego', 'l_pozo_15_riego']
      const pozosServicios = ['l_pozo_11', 'l_pozo_12', 'l_pozo_3', 'l_pozo_7', 'l_pozo_14']
      const yearTotals = {}
      const allWeeklyData = []
      const riegoWeeklyData = []
      const serviciosWeeklyData = []

      for (const year of years) {
        const tableName = `lecturas_semana_agua_consumo_${year}`

        const { data, error: fetchError } = await supabase
          .from(tableName)
          .select('*')
          .order('l_numero_semana', { ascending: true })

        if (fetchError) {
          console.warn(`⚠️ No se pudieron cargar datos de ${year}:`, fetchError)
          continue
        }

        if (data && data.length > 0) {
          let yearTotal = 0
          let yearTotalRiego = 0
          let yearTotalServicios = 0
          const yearWeeks = []
          const yearWeeksRiego = []
          const yearWeeksServicios = []

          data.forEach((row) => {
            // Total de todos los pozos
            const consumoTotalSemana = allPozos.reduce((acc, col) => {
              return acc + (parseFloat(row[col]) || 0)
            }, 0)

            // Total de pozos de riego
            const consumoRiegoSemana = pozosRiego.reduce((acc, col) => {
              return acc + (parseFloat(row[col]) || 0)
            }, 0)

            // Total de pozos de servicios
            const consumoServiciosSemana = pozosServicios.reduce((acc, col) => {
              return acc + (parseFloat(row[col]) || 0)
            }, 0)

            yearTotal += consumoTotalSemana
            yearTotalRiego += consumoRiegoSemana
            yearTotalServicios += consumoServiciosSemana

            yearWeeks.push({
              week: row.l_numero_semana,
              consumption: parseFloat(consumoTotalSemana.toFixed(2)),
              reading: yearTotal,
              fecha_inicio: row.l_fecha_inicio,
              fecha_fin: row.l_fecha_fin
            })

            yearWeeksRiego.push({
              week: row.l_numero_semana,
              consumption: parseFloat(consumoRiegoSemana.toFixed(2)),
              reading: yearTotalRiego,
              fecha_inicio: row.l_fecha_inicio,
              fecha_fin: row.l_fecha_fin
            })

            yearWeeksServicios.push({
              week: row.l_numero_semana,
              consumption: parseFloat(consumoServiciosSemana.toFixed(2)),
              reading: yearTotalServicios,
              fecha_inicio: row.l_fecha_inicio,
              fecha_fin: row.l_fecha_fin
            })
          })

          yearTotals[year] = yearTotal
          allWeeklyData.push({
            year: year.toString(),
            data: yearWeeks
          })
          riegoWeeklyData.push({
            year: year.toString(),
            data: yearWeeksRiego
          })
          serviciosWeeklyData.push({
            year: year.toString(),
            data: yearWeeksServicios
          })
        }
      }

      // Calcular KPIs
      const years2023 = yearTotals[2023] || 0
      const years2024 = yearTotals[2024] || 0
      const years2025 = yearTotals[2025] || 0
      const years2026 = yearTotals[2026] || 0
      const totalGeneral = years2023 + years2024 + years2025 + years2026
      const promedioAnual = totalGeneral / 4

      const yearEntries = Object.entries(yearTotals).map(([year, total]) => ({ year, total }))
      const maxYear = yearEntries.reduce((max, item) => item.total > max.total ? item : max, { year: '2026', total: 0 })
      const minYear = yearEntries.reduce((min, item) => item.total < min.total ? item : min, { year: '2023', total: 0 })

      const cambioAnual = years2025 > 0 ? ((years2026 - years2025) / years2025 * 100) : 0

      let vsSemanaAnterior = 0
      if (allWeeklyData.length > 0) {
        const data2026 = allWeeklyData.find(y => y.year === '2026')
        if (data2026 && data2026.data.length >= 2) {
          const lastWeek = data2026.data[data2026.data.length - 1]
          const prevWeek = data2026.data[data2026.data.length - 2]
          vsSemanaAnterior = prevWeek.consumption > 0
            ? ((lastWeek.consumption - prevWeek.consumption) / prevWeek.consumption * 100)
            : 0
        }
      }

      setKpiData({
        totalGeneral,
        promedioAnual,
        total2026: years2026,
        total2025: years2025,
        total2024: years2024,
        total2023: years2023,
        cambioAnual,
        vsSemanaAnterior,
        maxYear,
        minYear
      })

      setWeeklyData({
        multiYearData: allWeeklyData,
        multiYearDataRiego: riegoWeeklyData,
        multiYearDataServicios: serviciosWeeklyData,
        currentYearData: allWeeklyData.find(y => y.year === '2026')?.data || [],
        previousYearData: allWeeklyData.find(y => y.year === '2025')?.data || []
      })

      console.log('✅ KPIs y datos de gráficas cargados:', { yearTotals, allWeeklyData, riegoWeeklyData, serviciosWeeklyData })
    } catch (err) {
      console.error('❌ Error cargando KPIs:', err)
    }
  }

  // Calcular métricas de últimos 3 meses (~13 semanas) desde weeklyData
  useEffect(() => {
    const calcTrend = (seriesData) => {
      const data2026 = seriesData.find(y => y.year === '2026')?.data || []
      const last13 = data2026.slice(-13)
      const prev13 = data2026.slice(-26, -13)
      const sumLast = last13.reduce((acc, w) => acc + (w.consumption || 0), 0)
      const sumPrev = prev13.reduce((acc, w) => acc + (w.consumption || 0), 0)
      const trend = sumPrev > 0 ? ((sumLast - sumPrev) / sumPrev * 100).toFixed(1) : '0.0'
      return { total: parseFloat(sumLast.toFixed(2)), trend }
    }

    const pozos = calcTrend(weeklyData.multiYearData)
    const riego = calcTrend(weeklyData.multiYearDataRiego)
    const servicios = calcTrend(weeklyData.multiYearDataServicios)

    setMetrics({ pozos: pozos.total, riego: riego.total, servicios: servicios.total })
    setPozosTrend(pozos.trend)
    setRiegoTrend(riego.trend)
    setServiciosTrend(servicios.trend)
  }, [weeklyData])

  // Calcular métricas semanales (últimas 4 semanas vs 4 anteriores)
  useEffect(() => {
    const calcWeeklyTrend = (seriesData) => {
      const data2026 = seriesData.find(y => y.year === '2026')?.data || []
      const last4 = data2026.slice(-4)
      const prev4 = data2026.slice(-8, -4)
      const sumLast = last4.reduce((acc, w) => acc + (w.consumption || 0), 0)
      const sumPrev = prev4.reduce((acc, w) => acc + (w.consumption || 0), 0)
      const trend = sumPrev > 0 ? ((sumLast - sumPrev) / sumPrev * 100).toFixed(1) : '0.0'
      return { total: parseFloat(sumLast.toFixed(2)), trend }
    }

    const pozos = calcWeeklyTrend(weeklyData.multiYearData)
    const riego = calcWeeklyTrend(weeklyData.multiYearDataRiego)
    const servicios = calcWeeklyTrend(weeklyData.multiYearDataServicios)

    setWeeklyMetrics({ pozos: pozos.total, riego: riego.total, servicios: servicios.total })
    setPozosTrendW(pozos.trend)
    setRiegoTrendW(riego.trend)
    setServiciosTrendW(servicios.trend)
  }, [weeklyData])

  const getQualityBadge = (quality) => {
    switch (quality) {
      case 'excellent':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Excelente</Badge>
      case 'good':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Buena</Badge>
      case 'fair':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Regular</Badge>
      case 'poor':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Deficiente</Badge>
      default:
        return <Badge>N/A</Badge>
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />
      case 'maintenance':
        return <AlertTriangleIcon className="h-5 w-5 text-yellow-600" />
      case 'inactive':
        return <XCircleIcon className="h-5 w-5 text-red-600" />
      default:
        return null
    }
  }

  const formatMeterLabel = (col) => {
    if (!col) return null
    return col
      .replace(/^l_/, '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
  }

  const getAlertWellLabel = (alert) => {
    if (alert.event_type === 'posible_fuga') {
      return formatMeterLabel(alert.meter_column) || 'Medidor desconocido'
    }

    const mappedWellName = wellsConfig.find(w => w.id === alert.well_id)?.name
    if (mappedWellName) return mappedWellName

    return alert.well_id != null ? `Pozo ${alert.well_id}` : 'Pozo desconocido'
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
            {/* Header de la página */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Gestión de Pozos</h1>
                <p className="text-gray-600 mt-1">Monitoreo y control de pozos de agua</p>
              </div>
              <Badge variant="outline" className="text-lg px-4 py-2">
                8 Pozos Activos
              </Badge>
            </div>



            {/* Selector de Tipo de Gráfica */}
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Visualización de Datos</h3>
                  <p className="text-sm text-gray-600">Selecciona el tipo de gráfica que deseas visualizar</p>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant={chartMode === 'timeline' ? 'default' : 'outline'}
                    onClick={() => setChartMode('timeline')}
                    className="flex items-center gap-2"
                    size="lg"
                  >
                    <LineChartIcon className="h-5 w-5" />
                    Comparación de Años
                  </Button>
                  <Button
                    variant={chartMode === 'analysis' ? 'default' : 'outline'}
                    onClick={() => setChartMode('analysis')}
                    className="flex items-center gap-2"
                    size="lg"
                  >
                    <BarChart3Icon className="h-5 w-5" />
                    Línea del Tiempo
                  </Button>
                </div>
              </div>
            </Card>

            {/* Gráficas Condicionales */}
            {chartMode === 'timeline' ? (
              <WeeklyComparisonChart
                title="Comparación de Consumo por Años (Todos los Pozos)"
                multiYearData={weeklyData.multiYearData}
                multiYearDataRiego={weeklyData.multiYearDataRiego}
                multiYearDataServicios={weeklyData.multiYearDataServicios}
                currentYearData={weeklyData.currentYearData}
                previousYearData={weeklyData.previousYearData}
                currentYear="2026"
                previousYear="2025"
                unit="m³"
                total2023={kpiData.total2023}
                showControls={true}
              />
            ) : (
              <WellsGeneralCharts />
            )}

{/* Lista de pozos */}
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Lista de Pozos</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
                          Pozo
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 tracking-wider">
                          m³ para consumir por pozo
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 tracking-wider">
                          Consumo real total hasta la semana
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 tracking-wider">
                          % consumido
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 tracking-wider">
                          Agua disponible última semana
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 tracking-wider">
                          Alertas
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {loading ? (
                        <tr>
                          <td colSpan="7" className="px-6 py-12 text-center">
                            <Loader2Icon className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                            <p className="text-sm text-gray-500 mt-2">Cargando datos...</p>
                          </td>
                        </tr>
                      ) : error ? (
                        <tr>
                          <td colSpan="7" className="px-6 py-12 text-center">
                            <AlertTriangleIcon className="h-8 w-8 mx-auto text-red-500" />
                            <p className="text-sm text-red-600 mt-2">Error: {error}</p>
                          </td>
                        </tr>
                      ) : wellsData.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-6 py-12 text-center">
                            <p className="text-sm text-gray-500">No hay datos disponibles</p>
                          </td>
                        </tr>
                      ) : (
                        wellsData.map((well) => {
                          return (
                            <tr key={well.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                                  <div className="ml-3">
                                    <div className="text-sm font-medium text-gray-900">
                                      {well.name}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {well.tipo}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 font-medium">
                                {well.m3ParaConsumir.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m³
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <div className="text-sm font-medium text-gray-900">
                                  {well.totalConsumption2026.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m³
                                </div>
                                <div className="text-xs text-gray-500">
                                  (sem {well.weekNumber})
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                                  well.consumptionPercent >= 100 ? 'bg-red-100 text-red-800 border-red-200' :
                                  well.consumptionPercent >= 80 ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                  well.consumptionPercent >= 60 ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                  'bg-green-100 text-green-800 border-green-200'
                                }`}>
                                  {well.consumptionPercent.toFixed(1)}%
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <div className="text-sm font-medium text-gray-900">
                                  {well.aguaDisponibleUltimaSemana.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m³
                                </div>
                                <div className="text-xs text-gray-500">
                                  (sem {well.weekNumber})
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className={
                                    well.alertCount > 0
                                      ? 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100'
                                      : 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100'
                                  }
                                  onClick={() => {
                                    setSelectedWell(well)
                                    setEventsModalOpen(true)
                                  }}
                                >
                                  <BellIcon className="h-4 w-4 mr-1" />
                                  Alertas {well.alertCount}
                                </Button>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <div className="flex justify-center space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => navigate(`/pozos/${well.id}`)}
                                    title="Ver detalles"
                                  >
                                    <EyeIcon className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    title="Configuración"
                                    onClick={() => {
                                      setSelectedWell(well)
                                      setConfigModalOpen(true)
                                    }}
                                  >
                                    <SettingsIcon className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>




            {/* Métricas Mensuales */}
            <div className="flex items-center gap-3 pt-2 border-b pb-3">
              <CalendarIcon className="h-5 w-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-900">Métricas Mensuales</h2>
              <Badge variant="outline" className="text-xs text-purple-700 border-purple-300 bg-purple-50">Últimos 3 meses (~13 semanas)</Badge>
            </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  {/* Total Pozos */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Pozos</p>
                          <p className="text-xs text-muted-foreground/70">Últimos 3 meses</p>
                          <p className="text-2xl font-bold text-foreground mt-1">
                            {metrics.pozos.toLocaleString()} m³
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            {parseFloat(pozosTrend) > 0 ? (
                              <TrendingUpIcon className="h-4 w-4 text-destructive" />
                            ) : (
                              <TrendingDownIcon className="h-4 w-4 text-green-500" />
                            )}
                            <span className={`text-sm ${parseFloat(pozosTrend) > 0 ? 'text-destructive' : 'text-green-500'}`}>
                              {parseFloat(pozosTrend) > 0 ? '+' : ''}{pozosTrend}% vs 3 meses anteriores
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
                          <p className="text-xs text-muted-foreground/70">Pozos (4, 8, 15)</p>
                          <p className="text-2xl font-bold text-foreground mt-1">
                            {metrics.riego.toLocaleString()} m³
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            {parseFloat(riegoTrend) > 0 ? (
                              <TrendingUpIcon className="h-4 w-4 text-destructive" />
                            ) : (
                              <TrendingDownIcon className="h-4 w-4 text-green-500" />
                            )}
                            <span className={`text-sm ${parseFloat(riegoTrend) > 0 ? 'text-destructive' : 'text-green-500'}`}>
                              {parseFloat(riegoTrend) > 0 ? '+' : ''}{riegoTrend}%
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
                          <p className="text-xs text-muted-foreground/70">Pozos (11, 12, 3, 7, 14)</p>
                          <p className="text-2xl font-bold text-foreground mt-1">
                            {metrics.servicios.toLocaleString()} m³
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            {parseFloat(serviciosTrend) > 0 ? (
                              <TrendingUpIcon className="h-4 w-4 text-destructive" />
                            ) : (
                              <TrendingDownIcon className="h-4 w-4 text-green-500" />
                            )}
                            <span className={`text-sm ${parseFloat(serviciosTrend) > 0 ? 'text-destructive' : 'text-green-500'}`}>
                              {parseFloat(serviciosTrend) > 0 ? '+' : ''}{serviciosTrend}%
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

            {/* Métricas Semanales */}
            <div className="flex items-center gap-3 pt-2 border-b pb-3">
              <ClockIcon className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Métricas Semanales</h2>
              <Badge variant="outline" className="text-xs text-blue-700 border-blue-300 bg-blue-50">Últimas 4 semanas</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Total Pozos - Semanal */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Pozos</p>
                      <p className="text-xs text-muted-foreground/70">Servicios + Riego — Últimas 4 semanas</p>
                      <p className="text-2xl font-bold text-foreground mt-1">
                        {weeklyMetrics.pozos.toLocaleString()} m³
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        {parseFloat(pozosTrendW) > 0 ? (
                          <TrendingUpIcon className="h-4 w-4 text-destructive" />
                        ) : (
                          <TrendingDownIcon className="h-4 w-4 text-green-500" />
                        )}
                        <span className={`text-sm ${parseFloat(pozosTrendW) > 0 ? 'text-destructive' : 'text-green-500'}`}>
                          {parseFloat(pozosTrendW) > 0 ? '+' : ''}{pozosTrendW}% vs 4 semanas anteriores
                        </span>
                      </div>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <DropletIcon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pozos de Riego - Semanal */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Pozos de Riego</p>
                      <p className="text-xs text-muted-foreground/70">Pozos (4, 8, 15) — Últimas 4 semanas</p>
                      <p className="text-2xl font-bold text-foreground mt-1">
                        {weeklyMetrics.riego.toLocaleString()} m³
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        {parseFloat(riegoTrendW) > 0 ? (
                          <TrendingUpIcon className="h-4 w-4 text-destructive" />
                        ) : (
                          <TrendingDownIcon className="h-4 w-4 text-green-500" />
                        )}
                        <span className={`text-sm ${parseFloat(riegoTrendW) > 0 ? 'text-destructive' : 'text-green-500'}`}>
                          {parseFloat(riegoTrendW) > 0 ? '+' : ''}{riegoTrendW}% vs 4 semanas anteriores
                        </span>
                      </div>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                      <Waves className="h-6 w-6 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pozos de Servicios - Semanal */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Pozos de Servicios</p>
                      <p className="text-xs text-muted-foreground/70">Pozos (11, 12, 3, 7, 14) — Últimas 4 semanas</p>
                      <p className="text-2xl font-bold text-foreground mt-1">
                        {weeklyMetrics.servicios.toLocaleString()} m³
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        {parseFloat(serviciosTrendW) > 0 ? (
                          <TrendingUpIcon className="h-4 w-4 text-destructive" />
                        ) : (
                          <TrendingDownIcon className="h-4 w-4 text-green-500" />
                        )}
                        <span className={`text-sm ${parseFloat(serviciosTrendW) > 0 ? 'text-destructive' : 'text-green-500'}`}>
                          {parseFloat(serviciosTrendW) > 0 ? '+' : ''}{serviciosTrendW}% vs 4 semanas anteriores
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

            {/* Sección de detalles adicionales */}
            <div className="flex justify-center">
              {/* Alertas de pozos */}
              <Card className="w-full max-w-8xl">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <BellIcon className="h-5 w-5 text-orange-500" />
                    Alertas Recientes
                    {recentAlerts.length > 0 && (
                      <Badge className="bg-red-100 text-red-700 border-red-200 ml-2">{recentAlerts.length} activa{recentAlerts.length !== 1 ? 's' : ''}</Badge>
                    )}
                  </h3>
                  <div className="space-y-3">
                    {recentAlerts.length === 0 ? (
                      <div className="flex items-center p-3 bg-green-50 border-l-4 border-green-400 rounded-r-lg">
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-green-800">
                            Todos los pozos operando normalmente
                          </p>
                          <p className="text-sm text-green-600">
                            No hay alertas activas en el sistema
                          </p>
                        </div>
                      </div>
                    ) : (
                      recentAlerts.map((alert) => {
                        const wellName = getAlertWellLabel(alert)
                        const isCritical = alert.severity === 'critica'
                        const isPreventive = alert.severity === 'preventiva'
                        const isConsumo = alert.event_type === 'alerta_consumo'
                        const isSobreconsumo = alert.event_type === 'sobreconsumo'

                        const borderColor = isCritical ? 'border-red-400' : isPreventive ? 'border-yellow-400' : 'border-blue-400'
                        const bgColor = isCritical ? 'bg-red-50' : isPreventive ? 'bg-yellow-50' : 'bg-blue-50'
                        const iconColor = isCritical ? 'text-red-500' : isPreventive ? 'text-yellow-500' : 'text-blue-500'
                        const titleColor = isCritical ? 'text-red-800' : isPreventive ? 'text-yellow-800' : 'text-blue-800'
                        const descColor = isCritical ? 'text-red-600' : isPreventive ? 'text-yellow-600' : 'text-blue-600'

                        return (
                          <div key={alert.id} className={`flex items-start p-3 ${bgColor} border-l-4 ${borderColor} rounded-r-lg`}>
                            <div className="flex-shrink-0 mt-0.5">
                              {isCritical ? (
                                <AlertTriangleIcon className={`h-5 w-5 ${iconColor}`} />
                              ) : isPreventive ? (
                                <AlertTriangleIcon className={`h-5 w-5 ${iconColor}`} />
                              ) : (
                                <DropletIcon className={`h-5 w-5 ${iconColor}`} />
                              )}
                            </div>
                            <div className="ml-3 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className={`text-sm font-medium ${titleColor}`}>
                                  {wellName}
                                </p>
                                <Badge className={`text-[10px] px-1.5 py-0 ${
                                  isCritical ? 'bg-red-200 text-red-800 border-red-300' :
                                  'bg-yellow-200 text-yellow-800 border-yellow-300'
                                }`}>
                                  {isCritical ? 'Crítica' : 'Preventiva'}
                                </Badge>
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  {isConsumo ? 'Consumo' : isSobreconsumo ? 'Sobreconsumo' : alert.event_type}
                                </Badge>
                              </div>
                              <p className={`text-xs ${descColor} mt-1 line-clamp-2`}>
                                {alert.title || alert.description}
                              </p>
                              {alert.recommendation && (
                                <p className="text-xs text-gray-500 mt-1 italic truncate">
                                  💡 {alert.recommendation}
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              </Card>

            </div>
          </div>
        </main>
      </div>

      {/* Botón flotante para agregar datos */}
      <Button
        onClick={() => navigate('/agregar-datos')}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-50"
        size="icon"
      >
        <PlusIcon className="h-6 w-6" />
      </Button>

      {/* Modal de Eventos/Alertas */}
      {eventsModalOpen && selectedWell && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <BellIcon className="h-5 w-5 text-orange-600" />
                  Eventos y Alertas - {selectedWell.name}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEventsModalOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <WellEventsHistory wellId={selectedWell.id} />
            </div>
          </div>
        </div>
      )}

      {/* Modal de Configuración */}
      {configModalOpen && selectedWell && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Configuración - {selectedWell.name}</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfigModalOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-6">
                {/* Sección: Información General */}
                <div className="border-b pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <SettingsIcon className="h-5 w-5 text-blue-600" />
                    Información General
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Ubicación</label>
                      <input
                        type="text"
                        defaultValue={wellsStaticInfo[selectedWell.id]?.location || ''}
                        onChange={(e) => {
                          setWellsStaticInfo(prev => ({
                            ...prev,
                            [selectedWell.id]: {
                              ...prev[selectedWell.id],
                              location: e.target.value
                            }
                          }))
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Servicio</label>
                      <select
                        defaultValue={wellsStaticInfo[selectedWell.id]?.service || 'Servicios'}
                        onChange={(e) => {
                          setWellsStaticInfo(prev => ({
                            ...prev,
                            [selectedWell.id]: {
                              ...prev[selectedWell.id],
                              service: e.target.value
                            }
                          }))
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Servicios">Servicios</option>
                        <option value="Riego">Riego</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Título</label>
                      <input
                        type="text"
                        defaultValue={wellsStaticInfo[selectedWell.id]?.title || ''}
                        onChange={(e) => {
                          setWellsStaticInfo(prev => ({
                            ...prev,
                            [selectedWell.id]: {
                              ...prev[selectedWell.id],
                              title: e.target.value
                            }
                          }))
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Anexo</label>
                      <input
                        type="text"
                        defaultValue={wellsStaticInfo[selectedWell.id]?.annex || ''}
                        onChange={(e) => {
                          setWellsStaticInfo(prev => ({
                            ...prev,
                            [selectedWell.id]: {
                              ...prev[selectedWell.id],
                              annex: e.target.value
                            }
                          }))
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">m³ por Anexo</label>
                      <input
                        type="number"
                        step="0.01"
                        defaultValue={wellsStaticInfo[selectedWell.id]?.m3PorAnexo || 0}
                        onChange={(e) => {
                          setWellsStaticInfo(prev => ({
                            ...prev,
                            [selectedWell.id]: {
                              ...prev[selectedWell.id],
                              m3PorAnexo: parseFloat(e.target.value) || 0
                            }
                          }))
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">m³ Cedidos por Anexo</label>
                      <input
                        type="number"
                        step="0.01"
                        defaultValue={wellsStaticInfo[selectedWell.id]?.m3CededByAnnex || 0}
                        onChange={(e) => {
                          setWellsStaticInfo(prev => ({
                            ...prev,
                            [selectedWell.id]: {
                              ...prev[selectedWell.id],
                              m3CededByAnnex: parseFloat(e.target.value) || 0
                            }
                          }))
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                    <h4 className="text-sm font-semibold text-blue-900 mb-2">m³ Disponibles Calculados</h4>
                    <p className="text-2xl font-bold text-blue-700">
                      {((wellsStaticInfo[selectedWell.id]?.m3PorAnexo || 0) - (wellsStaticInfo[selectedWell.id]?.m3CededByAnnex || 0)).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m³
                    </p>
                  </div>
                </div>

                {/* Sección: Información del Medidor */}
                <div className="border-b pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <GaugeIcon className="h-5 w-5 text-purple-600" />
                    Información del Medidor
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <CalendarIcon className="h-4 w-4 inline mr-1" />
                        Fecha de Instalación
                      </label>
                      <input
                        type="date"
                        defaultValue={wellsStaticInfo[selectedWell.id]?.medidor?.fechaInstalacion || ''}
                        onChange={(e) => {
                          setWellsStaticInfo(prev => ({
                            ...prev,
                            [selectedWell.id]: {
                              ...prev[selectedWell.id],
                              medidor: {
                                ...prev[selectedWell.id]?.medidor,
                                fechaInstalacion: e.target.value
                              }
                            }
                          }))
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <ClockIcon className="h-4 w-4 inline mr-1" />
                        Vida Útil (meses)
                      </label>
                      <input
                        type="number"
                        defaultValue={wellsStaticInfo[selectedWell.id]?.medidor?.vidaUtilMeses || 60}
                        onChange={(e) => {
                          setWellsStaticInfo(prev => ({
                            ...prev,
                            [selectedWell.id]: {
                              ...prev[selectedWell.id],
                              medidor: {
                                ...prev[selectedWell.id]?.medidor,
                                vidaUtilMeses: parseInt(e.target.value) || 60
                              }
                            }
                          }))
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tope de Lectura (m³)</label>
                      <input
                        type="number"
                        step="0.01"
                        defaultValue={wellsStaticInfo[selectedWell.id]?.medidor?.topeLectura || 999999.99}
                        onChange={(e) => {
                          setWellsStaticInfo(prev => ({
                            ...prev,
                            [selectedWell.id]: {
                              ...prev[selectedWell.id],
                              medidor: {
                                ...prev[selectedWell.id]?.medidor,
                                topeLectura: parseFloat(e.target.value) || 999999.99
                              }
                            }
                          }))
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Estado del Medidor</label>
                      <select
                        defaultValue={wellsStaticInfo[selectedWell.id]?.medidor?.estado || 'activo'}
                        onChange={(e) => {
                          setWellsStaticInfo(prev => ({
                            ...prev,
                            [selectedWell.id]: {
                              ...prev[selectedWell.id],
                              medidor: {
                                ...prev[selectedWell.id]?.medidor,
                                estado: e.target.value
                              }
                            }
                          }))
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="activo">Activo</option>
                        <option value="falla">Falla</option>
                        <option value="mantenimiento">Mantenimiento</option>
                        <option value="reemplazo">Requiere Reemplazo</option>
                      </select>
                    </div>

                    {wellsStaticInfo[selectedWell.id]?.medidor?.estado === 'falla' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Falla</label>
                          <input
                            type="text"
                            defaultValue={wellsStaticInfo[selectedWell.id]?.medidor?.tipoFalla || ''}
                            placeholder="Ej: Lectura incorrecta, obstrucción, etc."
                            onChange={(e) => {
                              setWellsStaticInfo(prev => ({
                                ...prev,
                                [selectedWell.id]: {
                                  ...prev[selectedWell.id],
                                  medidor: {
                                    ...prev[selectedWell.id]?.medidor,
                                    tipoFalla: e.target.value
                                  }
                                }
                              }))
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Falla</label>
                          <input
                            type="date"
                            defaultValue={wellsStaticInfo[selectedWell.id]?.medidor?.fechaFalla || ''}
                            onChange={(e) => {
                              setWellsStaticInfo(prev => ({
                                ...prev,
                                [selectedWell.id]: {
                                  ...prev[selectedWell.id],
                                  medidor: {
                                    ...prev[selectedWell.id]?.medidor,
                                    fechaFalla: e.target.value
                                  }
                                }
                              }))
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Sección: Historial de Estado del Pozo */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FileTextIcon className="h-5 w-5 text-orange-600" />
                    Historial de Estado del Pozo
                  </h3>
                  <div className="space-y-3">
                    {wellsStaticInfo[selectedWell.id]?.historialEstado?.length > 0 ? (
                      wellsStaticInfo[selectedWell.id].historialEstado.map((evento, index) => (
                        <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <Badge className={
                              evento.estado === 'parado' ? 'bg-red-100 text-red-800' :
                              evento.estado === 'mantenimiento' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }>
                              {evento.estado === 'parado' ? '🔴 Parado' :
                               evento.estado === 'mantenimiento' ? '🟡 Mantenimiento' :
                               '🟢 Activo'}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setWellsStaticInfo(prev => ({
                                  ...prev,
                                  [selectedWell.id]: {
                                    ...prev[selectedWell.id],
                                    historialEstado: prev[selectedWell.id].historialEstado.filter((_, i) => i !== index)
                                  }
                                }))
                              }}
                              className="text-red-600 hover:text-red-800"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-sm text-gray-700">
                            <strong>Periodo:</strong> {new Date(evento.fechaInicio).toLocaleDateString('es-MX')} - {evento.fechaFin ? new Date(evento.fechaFin).toLocaleDateString('es-MX') : 'Presente'}
                          </p>
                          <p className="text-sm text-gray-700 mt-1">
                            <strong>Motivo:</strong> {evento.motivo}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 italic">No hay eventos registrados</p>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newEvento = {
                          fechaInicio: new Date().toISOString().split('T')[0],
                          fechaFin: null,
                          motivo: '',
                          estado: 'parado'
                        }
                        setWellsStaticInfo(prev => ({
                          ...prev,
                          [selectedWell.id]: {
                            ...prev[selectedWell.id],
                            historialEstado: [...(prev[selectedWell.id]?.historialEstado || []), newEvento]
                          }
                        }))
                      }}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Evento
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setConfigModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    fetchWellsData()
                    setConfigModalOpen(false)
                  }}
                >
                  Guardar Cambios
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

