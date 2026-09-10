import { formatMX } from '../utils/formatMX'
import { useState, useEffect } from "react"
import { supabase } from '../supabaseClient'
import { DashboardHeader } from "../components/dashboard-header"
import { DashboardSidebar } from "../components/dashboard-sidebar"
import { Card } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { 
  DropletIcon, 
  TrendingUpIcon,
  TrendingDownIcon,
  FilterIcon,
  BarChart3Icon,
  RecycleIcon,
  ActivityIcon,
  Loader2,
  AlertCircle
} from "lucide-react"
import ChartComponent from '../components/ChartComponent'
import PTARComparisonChart from '../components/PTARComparisonChart'

export default function PTARPage() {
  // Estados para datos de Supabase
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lecturasDiarias, setLecturasDiarias] = useState([])
  const [resumenAnual, setResumenAnual] = useState([])
  const [resumenMensual, setResumenMensual] = useState([])
  const [resumenTrimestral, setResumenTrimestral] = useState([])
  
  // Estados para los filtros de gráficas
  const [timeFilter, setTimeFilter] = useState('yearly')
  const [chartType, setChartType] = useState('line')
  const [selectedYears, setSelectedYears] = useState([])
  const [dateRange, setDateRange] = useState({ start: null, end: null })
  const [activeChart, setActiveChart] = useState('flujos') // 'flujos', 'eficiencia', 'balance', 'residual', 'tratada'
  const [lastWeekNumber, setLastWeekNumber] = useState(null)
  const [lastWeekData, setLastWeekData] = useState(null)
  const [previousWeekData, setPreviousWeekData] = useState(null)

  // Cargar datos de Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // 1. Cargar lecturas diarias
        const { data: diarias, error: errorDiarias } = await supabase
          .from('lecturas_ptar')
          .select('*')
          .order('fecha', { ascending: true })

        if (errorDiarias) throw errorDiarias

        // 2. Cargar resumen anual
        const { data: anual, error: errorAnual } = await supabase
          .from('vista_ptar_resumen_anual')
          .select('*')
          .order('año', { ascending: false })

        if (errorAnual) throw errorAnual

        // 3. Cargar resumen mensual
        const { data: mensual, error: errorMensual } = await supabase
          .from('vista_ptar_resumen_mensual')
          .select('*')
          .order('año', { ascending: false })
          .order('mes', { ascending: false })

        if (errorMensual) throw errorMensual

        // 4. Cargar resumen trimestral
        const { data: trimestral, error: errorTrimestral } = await supabase
          .from('vista_ptar_resumen_trimestral')
          .select('*')
          .order('año', { ascending: false })
          .order('trimestre', { ascending: false })

        if (errorTrimestral) throw errorTrimestral

        setLecturasDiarias(diarias || [])
        setResumenAnual(anual || [])
        setResumenMensual(mensual || [])
        setResumenTrimestral(trimestral || [])

        // Establecer años disponibles
        if (anual && anual.length > 0) {
          const years = anual.map(item => Number(item.año)).filter(y => !isNaN(y))
          setSelectedYears(years)
        }

        // Obtener última semana disponible
        if (diarias && diarias.length > 0) {
          const sortedByDate = [...diarias].sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
          const lastDate = new Date(sortedByDate[0].fecha)
          const weekNum = getWeekNumber(lastDate)
          setLastWeekNumber(weekNum)
          
          // Obtener datos de última semana y semana anterior
          const lastWeekRecords = diarias.filter(d => {
            const date = new Date(d.fecha)
            return getWeekNumber(date) === weekNum && date.getFullYear() === lastDate.getFullYear()
          })
          
          const prevWeekRecords = diarias.filter(d => {
            const date = new Date(d.fecha)
            return getWeekNumber(date) === (weekNum - 1) && date.getFullYear() === lastDate.getFullYear()
          })
          
          // Calcular totales
          const lastWeekAR = lastWeekRecords.reduce((sum, d) => sum + (Number(d.ar) || 0), 0)
          const lastWeekAT = lastWeekRecords.reduce((sum, d) => sum + (Number(d.at) || 0), 0)
          const prevWeekAR = prevWeekRecords.reduce((sum, d) => sum + (Number(d.ar) || 0), 0)
          const prevWeekAT = prevWeekRecords.reduce((sum, d) => sum + (Number(d.at) || 0), 0)
          
          setLastWeekData({ ar: lastWeekAR, at: lastWeekAT, eficiencia: lastWeekAR > 0 ? (lastWeekAT / lastWeekAR * 100) : 0 })
          setPreviousWeekData({ ar: prevWeekAR, at: prevWeekAT, eficiencia: prevWeekAR > 0 ? (prevWeekAT / prevWeekAR * 100) : 0 })
        }

      } catch (err) {
        console.error('Error al cargar datos:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Función para obtener el número de semana ISO del año
  const getWeekNumber = (date) => {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() + 4 - (d.getDay() || 7))
    const yearStart = new Date(d.getFullYear(), 0, 1)
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
    return weekNo
  }

  // Calcular variaciones porcentuales
  const calculateVariation = (current, previous) => {
    if (!previous || previous === 0) return 0
    return (((current - previous) / previous) * 100).toFixed(1)
  }

  // Obtener datos del año actual para mostrar
  const currentYearData = resumenAnual[0] || {}

  // Calcular variaciones con respecto a la última semana
  const arVariation = lastWeekData && previousWeekData 
    ? calculateVariation(lastWeekData.ar, previousWeekData.ar)
    : 0
  const atVariation = lastWeekData && previousWeekData
    ? calculateVariation(lastWeekData.at, previousWeekData.at)
    : 0
  const eficienciaVariation = lastWeekData && previousWeekData
    ? calculateVariation(lastWeekData.eficiencia, previousWeekData.eficiencia)
    : 0

  // Obtener años disponibles
  const availableYears = [...new Set(resumenAnual.map(d => Number(d.año)))].filter(y => !isNaN(y))

  // Función para filtrar por rango de fechas (para diario/semanal)
  const applyDateFilter = (data) => {
    if (!dateRange.start || !dateRange.end) return data
    
    return data.filter(item => {
      if (!item.fecha) return true
      const itemDate = new Date(item.fecha)
      const startDate = new Date(dateRange.start)
      const endDate = new Date(dateRange.end)
      return itemDate >= startDate && itemDate <= endDate
    })
  }

  // Preparar datos para los gráficos según el filtro de tiempo
  const getChartData = () => {
    if (timeFilter === 'yearly') {
      // Datos anuales desde vista_ptar_resumen_anual
      return resumenAnual
        .filter(data => selectedYears.includes(Number(data.año)))
        .map(data => ({
          period: data.año?.toString() || '',
          ar: Number(data.total_agua_residual_m3) || 0,
          at: Number(data.total_agua_tratada_m3) || 0,
          eficiencia: Number(data.eficiencia_promedio_porcentaje) || 0,
          registros: Number(data.total_registros) || 0
        }))
        .sort((a, b) => Number(a.period) - Number(b.period))
    } else if (timeFilter === 'quarterly') {
      // Datos trimestrales desde vista_ptar_resumen_trimestral
      return resumenTrimestral
        .filter(data => selectedYears.includes(Number(data.año)))
        .map(data => ({
          period: `${data.trimestre_label} ${data.año}`,
          ar: Number(data.total_agua_residual_m3) || 0,
          at: Number(data.total_agua_tratada_m3) || 0,
          eficiencia: Number(data.eficiencia_promedio_porcentaje) || 0,
          registros: Number(data.total_registros) || 0,
          sortKey: Number(data.año) * 10 + Number(data.trimestre)
        }))
        .sort((a, b) => a.sortKey - b.sortKey)
    } else if (timeFilter === 'monthly') {
      // Datos mensuales desde vista_ptar_resumen_mensual
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
      
      return resumenMensual
        .filter(data => selectedYears.includes(Number(data.año)))
        .map(data => ({
          period: `${monthNames[Number(data.mes) - 1]} ${data.año}`,
          ar: Number(data.total_agua_residual_m3) || 0,
          at: Number(data.total_agua_tratada_m3) || 0,
          eficiencia: Number(data.eficiencia_promedio_porcentaje) || 0,
          registros: Number(data.total_registros) || 0,
          sortKey: Number(data.año) * 100 + Number(data.mes)
        }))
        .sort((a, b) => a.sortKey - b.sortKey)
    } else if (timeFilter === 'weekly') {
      // Datos semanales: agrupar lecturas diarias por semana
      const weeklyData = []
      const filteredData = applyDateFilter(lecturasDiarias)
      const sortedData = [...filteredData].sort((a, b) => 
        new Date(a.fecha) - new Date(b.fecha)
      )
      
      // Función para obtener el número de semana ISO del año
      const getWeekNumber = (date) => {
        const d = new Date(date)
        d.setHours(0, 0, 0, 0)
        d.setDate(d.getDate() + 4 - (d.getDay() || 7))
        const yearStart = new Date(d.getFullYear(), 0, 1)
        const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
        return weekNo
      }
      
      // Agrupar por año y semana
      const weeksByYearAndWeek = {}
      
      sortedData.forEach(item => {
        const date = new Date(item.fecha)
        const year = date.getFullYear()
        const weekNum = getWeekNumber(date)
        const key = `${year}-W${weekNum}`
        
        if (!weeksByYearAndWeek[key]) {
          weeksByYearAndWeek[key] = {
            year,
            weekNum,
            data: []
          }
        }
        weeksByYearAndWeek[key].data.push(item)
      })
      
      // Convertir a array y procesar
      Object.keys(weeksByYearAndWeek)
        .sort()
        .forEach(key => {
          const { year, weekNum, data } = weeksByYearAndWeek[key]
          
          const totalAr = data.reduce((sum, d) => sum + (Number(d.ar) || 0), 0)
          const totalAt = data.reduce((sum, d) => sum + (Number(d.at) || 0), 0)
          const totalRecirculacion = data.reduce((sum, d) => sum + (Number(d.recirculacion) || 0), 0)
          const totalDia = data.reduce((sum, d) => sum + (Number(d.total_dia) || 0), 0)
          
          weeklyData.push({
            period: `Semana ${weekNum} ${year}`,
            ar: totalAr,
            at: totalAt,
            recirculacion: totalRecirculacion,
            total_dia: totalDia,
            eficiencia: totalAr > 0 ? ((totalAt / totalAr) * 100).toFixed(1) : 0,
            registros: data.length,
            sortKey: year * 100 + weekNum
          })
        })
      
      return weeklyData
    } else if (timeFilter === 'daily') {
      // Datos diarios desde lecturas_ptar
      const filteredData = applyDateFilter(lecturasDiarias)
      return [...filteredData]
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
        .map(data => ({
          period: new Date(data.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
          ar: Number(data.ar) || 0,
          at: Number(data.at) || 0,
          recirculacion: Number(data.recirculacion) || 0,
          total_dia: Number(data.total_dia) || 0,
          medidor_entrada: Number(data.medidor_entrada) || 0,
          medidor_salida: Number(data.medidor_salida) || 0,
          eficiencia: (Number(data.ar) > 0 && Number(data.at) > 0) 
            ? ((Number(data.at) / Number(data.ar)) * 100).toFixed(1) 
            : 0,
          fecha: data.fecha
        }))
        .reverse()
    }
    
    return []
  }

  const chartData = getChartData()

  // Preparar datos específicos para cada gráfica
  const getFlujosChartData = () => {
    // Gráfica de Flujos: AR vs AT comparando años
    return chartData.map(item => ({
      period: item.period,
      'Agua Residual': item.ar,
      'Agua Tratada': item.at
    }))
  }

  const getEficienciaChartData = () => {
    // Gráfica de Eficiencia: comparando años
    return chartData.map(item => ({
      period: item.period,
      'Eficiencia %': Number(item.eficiencia)
    }))
  }

  const getBalanceChartData = () => {
    // Gráfica de Balance: Recirculación + Total Día (solo para diario/semanal)
    if (timeFilter !== 'daily' && timeFilter !== 'weekly') return []
    
    return chartData.map(item => ({
      period: item.period,
      'Recirculación': item.recirculacion || 0,
      'Total Día': item.total_dia || 0
    }))
  }

  const getMedidoresChartData = () => {
    // Gráfica de Medidores: Entrada vs Salida (solo para diario)
    if (timeFilter !== 'daily') return []
    
    return chartData.map(item => ({
      period: item.period,
      'Medidor Entrada': item.medidor_entrada || 0,
      'Medidor Salida': item.medidor_salida || 0
    }))
  }

  const getResidualChartData = () => {
    // Gráfica de Agua Residual comparando años
    return chartData.map(item => ({
      period: item.period,
      'Agua Residual': item.ar
    }))
  }

  const getTratadaChartData = () => {
    // Gráfica de Agua Tratada comparando años
    return chartData.map(item => ({
      period: item.period,
      'Agua Tratada': item.at
    }))
  }

  // Preparar datos multi-año para PTARComparisonChart (AR)
  const getMultiYearResidualData = () => {
    if (timeFilter === 'yearly') {
      // Vista anual: usar datos mensuales para mostrar la tendencia del año
      const yearGroups = {}
      
      resumenMensual
        .filter(data => selectedYears.includes(Number(data.año)))
        .forEach(data => {
          const year = data.año?.toString()
          if (!yearGroups[year]) yearGroups[year] = []
          yearGroups[year].push({
            week: Number(data.mes), // Usar mes como punto en el eje X
            consumption: Number(data.total_agua_residual_m3) || 0
          })
        })
      
      return Object.keys(yearGroups).sort().map(year => ({
        year,
        data: yearGroups[year].sort((a, b) => a.week - b.week)
      }))
    } else if (timeFilter === 'monthly') {
      // Vista mensual: igual que yearly, mostrar meses
      const yearGroups = {}
      
      resumenMensual
        .filter(data => selectedYears.includes(Number(data.año)))
        .forEach(data => {
          const year = data.año?.toString()
          if (!yearGroups[year]) yearGroups[year] = []
          yearGroups[year].push({
            week: Number(data.mes),
            consumption: Number(data.total_agua_residual_m3) || 0
          })
        })
      
      return Object.keys(yearGroups).sort().map(year => ({
        year,
        data: yearGroups[year].sort((a, b) => a.week - b.week)
      }))
    } else if (timeFilter === 'weekly') {
      // Usar datos semanales agrupados
      const yearGroups = {}
      const filteredData = applyDateFilter(lecturasDiarias)
      
      filteredData.forEach(item => {
        const date = new Date(item.fecha)
        const year = date.getFullYear().toString()
        const weekNum = getWeekNumber(date)
        
        if (!selectedYears.includes(Number(year))) return
        
        if (!yearGroups[year]) yearGroups[year] = {}
        if (!yearGroups[year][weekNum]) {
          yearGroups[year][weekNum] = []
        }
        yearGroups[year][weekNum].push(Number(item.ar) || 0)
      })
      
      return Object.keys(yearGroups).sort().map(year => ({
        year,
        data: Object.keys(yearGroups[year]).sort((a, b) => Number(a) - Number(b)).map(weekNum => ({
          week: Number(weekNum),
          consumption: yearGroups[year][weekNum].reduce((sum, val) => sum + val, 0)
        }))
      }))
    } else if (timeFilter === 'quarterly') {
      const yearGroups = {}
      
      resumenTrimestral
        .filter(data => selectedYears.includes(Number(data.año)))
        .forEach(data => {
          const year = data.año?.toString()
          if (!yearGroups[year]) yearGroups[year] = []
          yearGroups[year].push({
            week: Number(data.trimestre),
            consumption: Number(data.total_agua_residual_m3) || 0
          })
        })
      
      return Object.keys(yearGroups).sort().map(year => ({
        year,
        data: yearGroups[year].sort((a, b) => a.week - b.week)
      }))
    } else if (timeFilter === 'daily') {
      // Vista diaria: usar datos diarios filtrados
      const yearGroups = {}
      const filteredData = applyDateFilter(lecturasDiarias)
      
      filteredData.forEach((item, index) => {
        const date = new Date(item.fecha)
        const year = date.getFullYear().toString()
        
        if (!selectedYears.includes(Number(year))) return
        
        if (!yearGroups[year]) yearGroups[year] = []
        yearGroups[year].push({
          week: index + 1, // Usar índice como posición
          consumption: Number(item.ar) || 0,
          date: item.fecha
        })
      })
      
      return Object.keys(yearGroups).sort().map(year => ({
        year,
        data: yearGroups[year]
      }))
    }
    return []
  }

  // Preparar datos multi-año para PTARComparisonChart (AT)
  const getMultiYearTratadaData = () => {
    if (timeFilter === 'yearly') {
      // Vista anual: usar datos mensuales para mostrar la tendencia del año
      const yearGroups = {}
      
      resumenMensual
        .filter(data => selectedYears.includes(Number(data.año)))
        .forEach(data => {
          const year = data.año?.toString()
          if (!yearGroups[year]) yearGroups[year] = []
          yearGroups[year].push({
            week: Number(data.mes), // Usar mes como punto en el eje X
            consumption: Number(data.total_agua_tratada_m3) || 0
          })
        })
      
      return Object.keys(yearGroups).sort().map(year => ({
        year,
        data: yearGroups[year].sort((a, b) => a.week - b.week)
      }))
    } else if (timeFilter === 'monthly') {
      // Vista mensual: igual que yearly, mostrar meses
      const yearGroups = {}
      
      resumenMensual
        .filter(data => selectedYears.includes(Number(data.año)))
        .forEach(data => {
          const year = data.año?.toString()
          if (!yearGroups[year]) yearGroups[year] = []
          yearGroups[year].push({
            week: Number(data.mes),
            consumption: Number(data.total_agua_tratada_m3) || 0
          })
        })
      
      return Object.keys(yearGroups).sort().map(year => ({
        year,
        data: yearGroups[year].sort((a, b) => a.week - b.week)
      }))
    } else if (timeFilter === 'weekly') {
      // Usar datos semanales agrupados
      const yearGroups = {}
      const filteredData = applyDateFilter(lecturasDiarias)
      
      filteredData.forEach(item => {
        const date = new Date(item.fecha)
        const year = date.getFullYear().toString()
        const weekNum = getWeekNumber(date)
        
        if (!selectedYears.includes(Number(year))) return
        
        if (!yearGroups[year]) yearGroups[year] = {}
        if (!yearGroups[year][weekNum]) {
          yearGroups[year][weekNum] = []
        }
        yearGroups[year][weekNum].push(Number(item.at) || 0)
      })
      
      return Object.keys(yearGroups).sort().map(year => ({
        year,
        data: Object.keys(yearGroups[year]).sort((a, b) => Number(a) - Number(b)).map(weekNum => ({
          week: Number(weekNum),
          consumption: yearGroups[year][weekNum].reduce((sum, val) => sum + val, 0)
        }))
      }))
    } else if (timeFilter === 'quarterly') {
      const yearGroups = {}
      
      resumenTrimestral
        .filter(data => selectedYears.includes(Number(data.año)))
        .forEach(data => {
          const year = data.año?.toString()
          if (!yearGroups[year]) yearGroups[year] = []
          yearGroups[year].push({
            week: Number(data.trimestre),
            consumption: Number(data.total_agua_tratada_m3) || 0
          })
        })
      
      return Object.keys(yearGroups).sort().map(year => ({
        year,
        data: yearGroups[year].sort((a, b) => a.week - b.week)
      }))
    } else if (timeFilter === 'daily') {
      // Vista diaria: usar datos diarios filtrados
      const yearGroups = {}
      const filteredData = applyDateFilter(lecturasDiarias)
      
      filteredData.forEach((item, index) => {
        const date = new Date(item.fecha)
        const year = date.getFullYear().toString()
        
        if (!selectedYears.includes(Number(year))) return
        
        if (!yearGroups[year]) yearGroups[year] = []
        yearGroups[year].push({
          week: index + 1, // Usar índice como posición
          consumption: Number(item.at) || 0,
          date: item.fecha
        })
      })
      
      return Object.keys(yearGroups).sort().map(year => ({
        year,
        data: yearGroups[year]
      }))
    }
    return []
  }

  // Estado de carga
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardSidebar />
        <div className="ml-64">
          <DashboardHeader />
          <main className="p-6">
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-lg text-gray-600">Cargando datos PTAR...</span>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Estado de error
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardSidebar />
        <div className="ml-64">
          <DashboardHeader />
          <main className="p-6">
            <Card className="p-6 bg-red-50 border-red-200">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-red-600" />
                <div>
                  <h3 className="text-lg font-semibold text-red-900">Error al cargar datos</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </Card>
          </main>
        </div>
      </div>
    )
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
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <RecycleIcon className="h-8 w-8 text-blue-600" />
                PTAR - Planta de Tratamiento de Aguas Residuales
              </h1>
              <p className="text-gray-600 mt-1">Monitoreo y análisis de tratamiento de aguas - Datos en tiempo real</p>
            </div>

            {/* Mini Dashboard - Tarjetas de métricas principales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Agua Residual (AR) */}
              <Card className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Agua Residual (AR)</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {formatMX(currentYearData.total_agua_residual_m3 || 0)} m³
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm text-gray-500">
                        vs semana {lastWeekNumber ? lastWeekNumber - 1 : 'anterior'}
                      </span>
                      <Badge 
                        className={`flex items-center gap-1 ${
                          parseFloat(arVariation) > 0 
                            ? 'bg-red-100 text-red-800 border-red-200' 
                            : 'bg-green-100 text-green-800 border-green-200'
                        }`}
                      >
                        {parseFloat(arVariation) > 0 ? (
                          <TrendingUpIcon className="h-3 w-3" />
                        ) : (
                          <TrendingDownIcon className="h-3 w-3" />
                        )}
                        {Math.abs(arVariation)}%
                      </Badge>
                    </div>
                  </div>
                  <div className="p-3 bg-red-100 rounded-lg">
                    <DropletIcon className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </Card>

              {/* Agua Tratada (AT) */}
              <Card className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Agua Tratada (AT)</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {formatMX(currentYearData.total_agua_tratada_m3 || 0)} m³
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm text-gray-500">
                        vs semana {lastWeekNumber ? lastWeekNumber - 1 : 'anterior'}
                      </span>
                      <Badge 
                        className={`flex items-center gap-1 ${
                          parseFloat(atVariation) > 0 
                            ? 'bg-green-100 text-green-800 border-green-200' 
                            : 'bg-red-100 text-red-800 border-red-200'
                        }`}
                      >
                        {parseFloat(atVariation) > 0 ? (
                          <TrendingUpIcon className="h-3 w-3" />
                        ) : (
                          <TrendingDownIcon className="h-3 w-3" />
                        )}
                        {Math.abs(atVariation)}%
                      </Badge>
                    </div>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <RecycleIcon className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </Card>

              {/* Eficiencia de Tratamiento */}
              <Card className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Eficiencia Tratamiento</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {(currentYearData.eficiencia_promedio_porcentaje || 0).toFixed(2)}%
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm text-gray-500">
                        vs semana {lastWeekNumber ? lastWeekNumber - 1 : 'anterior'}
                      </span>
                      <Badge 
                        className={`flex items-center gap-1 ${
                          parseFloat(eficienciaVariation) > 0 
                            ? 'bg-green-100 text-green-800 border-green-200' 
                            : 'bg-red-100 text-red-800 border-red-200'
                        }`}
                      >
                        {parseFloat(eficienciaVariation) > 0 ? (
                          <TrendingUpIcon className="h-3 w-3" />
                        ) : (
                          <TrendingDownIcon className="h-3 w-3" />
                        )}
                        {Math.abs(eficienciaVariation)}%
                      </Badge>
                    </div>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <ActivityIcon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Tarjeta de Resumen Estadístico */}
            <Card className="p-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <h3 className="text-sm font-medium text-gray-500">Total Registros</h3>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {currentYearData.total_registros || 0}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{currentYearData.año || 'N/A'}</p>
                </div>
                <div className="text-center border-l border-r border-gray-200">
                  <h3 className="text-sm font-medium text-gray-500">Promedio Diario AR</h3>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {(currentYearData.promedio_diario_ar_m3 || 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">m³/día</p>
                </div>
                <div className="text-center">
                  <h3 className="text-sm font-medium text-gray-500">Promedio Diario AT</h3>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {(currentYearData.promedio_diario_at_m3 || 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">m³/día</p>
                </div>
              </div>
            </Card>

            {/* Análisis Gráfico */}
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <BarChart3Icon className="h-5 w-5" />
                    Análisis Histórico PTAR
                  </h2>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <FilterIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-500">Período:</span>
                      <select 
                        value={timeFilter} 
                        onChange={(e) => setTimeFilter(e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="yearly">Anual</option>
                        <option value="quarterly">Trimestral</option>
                        <option value="monthly">Mensual</option>
                        <option value="weekly">Semanal</option>
                        <option value="daily">Diario</option>
                      </select>
                    </div>
                    {/* Selector de Años */}
                    {(timeFilter === 'yearly' || timeFilter === 'quarterly' || timeFilter === 'monthly') && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Años:</span>
                        <div className="flex gap-2">
                          {availableYears.map(year => (
                            <Button
                              key={year}
                              size="sm"
                              variant={selectedYears.includes(year) ? "default" : "outline"}
                              onClick={() => {
                                setSelectedYears(prev => 
                                  prev.includes(year) 
                                    ? prev.filter(y => y !== year)
                                    : [...prev, year].sort()
                                )
                              }}
                              className="text-xs px-2 py-1 h-auto"
                            >
                              {year}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Tipo de Gráfico:</span>
                      <select 
                        value={chartType} 
                        onChange={(e) => setChartType(e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="line">Líneas</option>
                        <option value="bar">Barras</option>
                        <option value="area">Área</option>
                        <option value="composed">Combinado</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Filtro de Fechas para Diario/Semanal */}
                {(timeFilter === 'daily' || timeFilter === 'weekly') && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Filtrar por Rango de Fechas:</h3>
                    <div className="flex gap-4">
                      <div>
                        <label className="text-xs text-gray-600">Fecha Inicio:</label>
                        <input 
                          type="date" 
                          value={dateRange.start || ''}
                          onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                          className="block mt-1 text-sm border border-gray-300 rounded px-2 py-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">Fecha Fin:</label>
                        <input 
                          type="date" 
                          value={dateRange.end || ''}
                          onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                          className="block mt-1 text-sm border border-gray-300 rounded px-2 py-1"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setDateRange({ start: null, end: null })}
                          className="text-xs"
                        >
                          Limpiar Filtro
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Selector de Tipo de Gráfica */}
                <div className="mb-6">
                  <div className="flex flex-wrap gap-2 border-b border-gray-200">
                    <button
                      onClick={() => setActiveChart('flujos')}
                      className={`px-4 py-2 text-sm font-medium ${
                        activeChart === 'flujos'
                          ? 'border-b-2 border-blue-500 text-blue-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      📊 Flujos (AR vs AT)
                    </button>
                    <button
                      onClick={() => setActiveChart('residual')}
                      className={`px-4 py-2 text-sm font-medium ${
                        activeChart === 'residual'
                          ? 'border-b-2 border-blue-500 text-blue-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      💧 Agua Residual (AR)
                    </button>
                    <button
                      onClick={() => setActiveChart('tratada')}
                      className={`px-4 py-2 text-sm font-medium ${
                        activeChart === 'tratada'
                          ? 'border-b-2 border-blue-500 text-blue-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      ♻️ Agua Tratada (AT)
                    </button>
                    <button
                      onClick={() => setActiveChart('eficiencia')}
                      className={`px-4 py-2 text-sm font-medium ${
                        activeChart === 'eficiencia'
                          ? 'border-b-2 border-blue-500 text-blue-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      📈 Eficiencia
                    </button>
                    {(timeFilter === 'daily' || timeFilter === 'weekly') && (
                      <>
                        <button
                          onClick={() => setActiveChart('balance')}
                          className={`px-4 py-2 text-sm font-medium ${
                            activeChart === 'balance'
                              ? 'border-b-2 border-blue-500 text-blue-600'
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          🔄 Balance
                        </button>
                        {timeFilter === 'daily' && (
                          <button
                            onClick={() => setActiveChart('medidores')}
                            className={`px-4 py-2 text-sm font-medium ${
                              activeChart === 'medidores'
                                ? 'border-b-2 border-blue-500 text-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                          >
                            📏 Medidores
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Gráficas Dinámicas según activeChart */}
                <div className="min-h-[400px]">
                  {activeChart === 'flujos' && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-4">
                        Comparación de Flujos: Agua Residual vs Agua Tratada
                      </h3>
                      <ChartComponent 
                        chartType={chartType}
                        chartData={getFlujosChartData()}
                        dataKeys={['Agua Residual', 'Agua Tratada']}
                        colors={['#dc2626', '#16a34a']}
                      />
                    </div>
                  )}

                  {activeChart === 'residual' && (
                    <PTARComparisonChart
                      title="Comparación de Agua Residual (AR) entre Años"
                      multiYearData={getMultiYearResidualData()}
                      unit="m³"
                      chartType={chartType}
                      dataType="residual"
                    />
                  )}

                  {activeChart === 'tratada' && (
                    <PTARComparisonChart
                      title="Comparación de Agua Tratada (AT) entre Años"
                      multiYearData={getMultiYearTratadaData()}
                      unit="m³"
                      chartType={chartType}
                      dataType="tratada"
                    />
                  )}

                  {activeChart === 'eficiencia' && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-4">
                        Eficiencia de Tratamiento por Período
                      </h3>
                      <ChartComponent 
                        chartType={chartType}
                        chartData={getEficienciaChartData()}
                        dataKeys={['Eficiencia %']}
                        colors={['#7c3aed']}
                      />
                    </div>
                  )}

                  {activeChart === 'balance' && (timeFilter === 'daily' || timeFilter === 'weekly') && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-4">
                        Balance de Operación: Recirculación y Total Diario
                      </h3>
                      <ChartComponent 
                        chartType={chartType}
                        chartData={getBalanceChartData()}
                        dataKeys={['Recirculación', 'Total Día']}
                        colors={['#2563eb', '#f59e0b']}
                      />
                    </div>
                  )}

                  {activeChart === 'medidores' && timeFilter === 'daily' && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-4">
                        Lectura de Medidores: Entrada vs Salida
                      </h3>
                      <ChartComponent 
                        chartType={chartType}
                        chartData={getMedidoresChartData()}
                        dataKeys={['Medidor Entrada', 'Medidor Salida']}
                        colors={['#8b5cf6', '#14b8a6']}
                      />
                    </div>
                  )}
                </div>

                {/* Estadísticas del gráfico */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Total Agua Residual</h4>
                    <span className="text-lg font-semibold text-gray-900">
                      {resumenAnual.length > 0 
                        ? formatMX(resumenAnual.reduce((sum, item) => sum + (Number(item.total_agua_residual_m3) || 0), 0))
                        : '0'} m³
                    </span>
                  </Card>
                  
                  <Card className="p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Total Agua Tratada</h4>
                    <span className="text-lg font-semibold text-gray-900">
                      {resumenAnual.length > 0 
                        ? formatMX(resumenAnual.reduce((sum, item) => sum + (Number(item.total_agua_tratada_m3) || 0), 0))
                        : '0'} m³
                    </span>
                  </Card>
                  
                  <Card className="p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Eficiencia Promedio</h4>
                    <span className="text-lg font-semibold text-green-600">
                      {resumenAnual.length > 0 
                        ? (resumenAnual.reduce((sum, item) => sum + (Number(item.eficiencia_promedio_porcentaje) || 0), 0) / resumenAnual.length).toFixed(1)
                        : '0'}%
                    </span>
                  </Card>
                </div>
              </div>
            </Card>

            {/* Tabla de Datos Completa */}
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Tabla de Datos - 
                  {timeFilter === 'yearly' && ' Resumen Anual'}
                  {timeFilter === 'quarterly' && ' Resumen Trimestral'}
                  {timeFilter === 'monthly' && ' Resumen Mensual'}
                  {timeFilter === 'weekly' && ' Resumen Semanal'}
                  {timeFilter === 'daily' && ' Lecturas Diarias'}
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  {chartData.length} registro{chartData.length !== 1 ? 's' : ''} disponible{chartData.length !== 1 ? 's' : ''}
                </p>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Período
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          AR (m³)
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          AT (m³)
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Eficiencia (%)
                        </th>
                        {(timeFilter === 'daily' || timeFilter === 'weekly') && (
                          <>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Recirculación
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total Día
                            </th>
                          </>
                        )}
                        {timeFilter === 'daily' && (
                          <>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Med. Entrada
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Med. Salida
                            </th>
                          </>
                        )}
                        {(timeFilter === 'yearly' || timeFilter === 'quarterly' || timeFilter === 'monthly' || timeFilter === 'weekly') && (
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Registros
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {chartData.map((data, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {data.period}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatMX(Number(data.ar))}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatMX(Number(data.at))}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            <Badge className={
                              Number(data.eficiencia) >= 95 
                                ? "bg-green-100 text-green-800 border-green-200" 
                                : Number(data.eficiencia) >= 90
                                ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                : "bg-red-100 text-red-800 border-red-200"
                            }>
                              {Number(data.eficiencia).toFixed(2)}%
                            </Badge>
                          </td>
                          {(timeFilter === 'daily' || timeFilter === 'weekly') && (
                            <>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatMX(Number(data.recirculacion || 0))}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatMX(Number(data.total_dia || 0))}
                              </td>
                            </>
                          )}
                          {timeFilter === 'daily' && (
                            <>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatMX(Number(data.medidor_entrada || 0))}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatMX(Number(data.medidor_salida || 0))}
                              </td>
                            </>
                          )}
                          {(timeFilter === 'yearly' || timeFilter === 'quarterly' || timeFilter === 'monthly' || timeFilter === 'weekly') && (
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {data.registros || 'N/A'}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}

