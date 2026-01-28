import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { DashboardHeader } from "../components/dashboard-header"
import { DashboardSidebar } from "../components/dashboard-sidebar"
import { DashboardSummary } from "../components/dashboard-summary"
import { Card, CardContent, CardHeader } from "../components/ui/card"
import { Button } from "../components/ui/button"
import ChartComponent from "../components/ChartComponent"
import { 
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar, Radar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend
)
import { WellMonitoringCharts } from "../components/well-monitoring-charts"
import { dashboardData } from '../lib/dashboard-data'
import { supabase } from '../supabaseClient'
import { Line } from 'react-chartjs-2'
import { 
  TrendingUpIcon, 
  TrendingDownIcon,
  DropletIcon, 
  ActivityIcon,
  TargetIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  CalendarIcon,
  DownloadIcon,
  ZapIcon,
  BarChart3Icon,
  FlameIcon,
  Waves,
  Factory,
  TrendingUp,
  Sparkles
} from 'lucide-react'

import { RedirectIfNotAuth } from '../components/RedirectIfNotAuth';
import { useAuth } from '../contexts/AuthContextNew';

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const [selectedPeriod, setSelectedPeriod] = useState('monthly')
  const { consumption, goals, efficiencyKPIs } = dashboardData

  // Redirigir usuarios con rol "datos" directamente a lecturas semanales
  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'datos') {
        navigate('/agregar-lecturas', { replace: true })
      }
    }
  }, [user, loading, navigate])
  
  // Estados para datos de Supabase
  const [waterWeeklyData, setWaterWeeklyData] = useState([])
  const [gasWeeklyData, setGasWeeklyData] = useState([])
  const [ptarData, setPtarData] = useState([])
  const [dailyReadingsData, setDailyReadingsData] = useState([])
  const [dataLoading, setDataLoading] = useState(true)

  // Cargar datos de todas las secciones
  useEffect(() => {
    fetchAllDashboardData()
  }, [])

  const fetchAllDashboardData = async () => {
    try {
      setDataLoading(true)
      
      // Cargar datos de agua (últimas 12 semanas de 2025)
      const { data: waterData } = await supabase
        .from('lecturas_semana_agua_consumo_2025')
        .select('*')
        .order('l_numero_semana', { ascending: true })
        .limit(12)
      
      // Cargar datos de gas (últimas 12 semanas de 2025)
      const { data: gasData } = await supabase
        .from('lecturas_semanales_gas_consumo_2025')
        .select('*')
        .order('numero_semana', { ascending: true })
        .limit(12)
      
      // Cargar datos de PTAR (últimas 12 semanas)
      const { data: ptarDataResult } = await supabase
        .from('ptar_lecturas')
        .select('*')
        .order('semana', { ascending: true })
        .limit(12)
      
      // Cargar lecturas diarias (últimos 30 días)
      const { data: dailyData } = await supabase
        .from('lecturas_diarias')
        .select('*')
        .order('fecha', { ascending: true })
        .limit(30)
      
      setWaterWeeklyData(waterData || [])
      setGasWeeklyData(gasData || [])
      setPtarData(ptarDataResult || [])
      setDailyReadingsData(dailyData || [])
      
    } catch (error) {
      console.error('Error cargando datos del dashboard:', error)
    } finally {
      setDataLoading(false)
    }
  }

  // Formatear números
  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(0)}k`
    return num.toLocaleString()
  }

  // Obtener color según tendencia
  const getTrendColor = (trend) => {
    if (trend > 0) return 'text-red-500'
    if (trend < 0) return 'text-green-500'
    return 'text-gray-500'
  }

  // Obtener color según estado de KPI
  const getKPIColor = (estado) => {
    switch (estado) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200'
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'danger': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  // Datos para gráfico de consumo comparativo
  const consumptionComparisonData = {
    labels: ['Diario', 'Semanal', 'Mensual', 'Anual'],
    datasets: [
      {
        label: 'Período Actual',
        data: [
          consumption.current.daily,
          consumption.current.weekly / 1000,
          consumption.current.monthly / 1000,
          consumption.current.yearly / 1000
        ],
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2
      },
      {
        label: 'Período Anterior',
        data: [
          consumption.previous.daily,
          consumption.previous.weekly / 1000,
          consumption.previous.monthly / 1000,
          consumption.previous.yearly / 1000
        ],
        backgroundColor: 'rgba(156, 163, 175, 0.6)',
        borderColor: 'rgb(156, 163, 175)',
        borderWidth: 2
      }
    ]
  }

  // Datos para gráfico de metas vs consumo
  const goalsData = {
    labels: ['Riego', 'Servicios', 'Total'],
    datasets: [
      {
        label: 'Meta (m³)',
        data: [goals.riego.meta_mensual, goals.servicios.meta_mensual, goals.total.meta_mensual],
        backgroundColor: 'rgba(16, 185, 129, 0.6)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 2
      },
      {
        label: 'Consumo Actual (m³)',
        data: [goals.riego.consumo_actual, goals.servicios.consumo_actual, goals.total.consumo_actual],
        backgroundColor: 'rgba(239, 68, 68, 0.6)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 2
      }
    ]
  }

  // Datos para gráfico de KPIs de eficiencia
  const efficiencyData = {
    labels: ['Distribución', 'Aprovechamiento', 'Pérdidas', 'Reciclaje', 'General'],
    datasets: [
      {
        label: 'Actual (%)',
        data: [
          efficiencyKPIs.distribucion.actual,
          efficiencyKPIs.aprovechamiento.actual,
          100 - efficiencyKPIs.perdidas.actual, // Invertir pérdidas para visualización
          efficiencyKPIs.reciclaje.actual,
          efficiencyKPIs.general.actual
        ],
        backgroundColor: 'rgba(245, 158, 11, 0.6)',
        borderColor: 'rgb(245, 158, 11)',
        borderWidth: 2
      },
      {
        label: 'Meta (%)',
        data: [
          efficiencyKPIs.distribucion.meta,
          efficiencyKPIs.aprovechamiento.meta,
          100 - efficiencyKPIs.perdidas.meta, // Invertir pérdidas para visualización
          efficiencyKPIs.reciclaje.meta,
          efficiencyKPIs.general.meta
        ],
        backgroundColor: 'rgba(16, 185, 129, 0.3)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 2,
        borderDash: [5, 5]
      }
    ]
  }

  // Preparar datos de consumo de agua semanal
  const getWaterConsumptionChartData = () => {
    if (!waterWeeklyData || waterWeeklyData.length === 0) return null
    
    const labels = waterWeeklyData.map(w => `S${w.l_numero_semana}`)
    const totalConsumption = waterWeeklyData.map(w => {
      // Sumar consumo de pozos principales
      const pozos = (parseFloat(w.l_pozo_11) || 0) + (parseFloat(w.l_pozo_12) || 0) + 
                    (parseFloat(w.l_pozo_14) || 0) + (parseFloat(w.l_pozo_7) || 0) + 
                    (parseFloat(w.l_pozo_3) || 0)
      return Math.round(pozos)
    })
    
    return {
      labels,
      datasets: [{
        label: 'Consumo Agua (m³)',
        data: totalConsumption,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      }]
    }
  }

  // Preparar datos de consumo de gas semanal
  const getGasConsumptionChartData = () => {
    if (!gasWeeklyData || gasWeeklyData.length === 0) return null
    
    const labels = gasWeeklyData.map(w => `S${w.numero_semana}`)
    const totalConsumption = gasWeeklyData.map(w => {
      // Sumar consumo de calderas y comedores principales
      const total = (parseFloat(w.caldera_3) || 0) + 
                    (parseFloat(w.comedor_centrales_tec_food) || 0) + (parseFloat(w.dona_tota) || 0)
      return Math.round(total)
    })
    
    return {
      labels,
      datasets: [{
        label: 'Consumo Gas (m³)',
        data: totalConsumption,
        borderColor: 'rgb(249, 115, 22)',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        fill: true,
        tension: 0.4
      }]
    }
  }

  // Preparar datos de PTAR
  const getPTARChartData = () => {
    if (!ptarData || ptarData.length === 0) return null
    
    const labels = ptarData.map(w => `S${w.semana}`)
    const entrada = ptarData.map(w => parseFloat(w.entrada_m3) || 0)
    const salida = ptarData.map(w => parseFloat(w.salida_m3) || 0)
    
    return {
      labels,
      datasets: [
        {
          label: 'Entrada (m³)',
          data: entrada,
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Salida (m³)',
          data: salida,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    }
  }

  // Preparar datos de lecturas diarias
  const getDailyReadingsChartData = () => {
    if (!dailyReadingsData || dailyReadingsData.length === 0) return null
    
    const labels = dailyReadingsData.map(d => {
      const fecha = new Date(d.fecha)
      return `${fecha.getDate()}/${fecha.getMonth() + 1}`
    })
    const consumo = dailyReadingsData.map(d => parseFloat(d.consumo_total) || 0)
    
    return {
      labels,
      datasets: [{
        label: 'Consumo Diario (m³)',
        data: consumo,
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4
      }]
    }
  }

  // Generar predicción simple usando promedio móvil
  const generatePrediction = () => {
    if (!waterWeeklyData || waterWeeklyData.length < 4) return null
    
    // Tomar las últimas 4 semanas
    const lastWeeks = waterWeeklyData.slice(-4)
    const consumos = lastWeeks.map(w => {
      const pozos = (parseFloat(w.l_pozo_11) || 0) + (parseFloat(w.l_pozo_12) || 0) + 
                    (parseFloat(w.l_pozo_14) || 0) + (parseFloat(w.l_pozo_7) || 0) + 
                    (parseFloat(w.l_pozo_3) || 0)
      return pozos
    })
    
    // Calcular promedio y tendencia
    const promedio = consumos.reduce((a, b) => a + b, 0) / consumos.length
    const tendencia = (consumos[consumos.length - 1] - consumos[0]) / consumos.length
    
    // Predecir próximas 4 semanas
    const predicciones = []
    for (let i = 1; i <= 4; i++) {
      predicciones.push(Math.round(promedio + (tendencia * i)))
    }
    
    const lastWeekNum = waterWeeklyData[waterWeeklyData.length - 1]?.l_numero_semana || 0
    
    return {
      labels: [`S${lastWeekNum + 1}`, `S${lastWeekNum + 2}`, `S${lastWeekNum + 3}`, `S${lastWeekNum + 4}`],
      datasets: [
        {
          label: 'Histórico (m³)',
          data: [...consumos.map(c => Math.round(c)), null, null, null, null],
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Predicción (m³)',
          data: [null, null, null, consumos[consumos.length - 1], ...predicciones],
          borderColor: 'rgb(168, 85, 247)',
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          borderDash: [5, 5],
          fill: true,
          tension: 0.4
        }
      ],
      allLabels: [
        ...lastWeeks.map(w => `S${w.l_numero_semana}`),
        `S${lastWeekNum + 1}`, `S${lastWeekNum + 2}`, `S${lastWeekNum + 3}`, `S${lastWeekNum + 4}`
      ],
      promedio: Math.round(promedio),
      tendencia: tendencia > 0 ? 'ascendente' : 'descendente',
      cambioEstimado: Math.round(Math.abs(tendencia * 4))
    }
  }

  const waterChartData = getWaterConsumptionChartData()
  const gasChartData = getGasConsumptionChartData()
  const ptarChartData = getPTARChartData()
  const dailyChartData = getDailyReadingsChartData()
  const predictionData = generatePrediction()

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
                <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard Principal</h1>
                <p className="text-muted-foreground">Resumen ejecutivo del sistema hídrico</p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm">
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  Exportar Resumen
                </Button>
                <Button variant="outline" size="sm">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Programar Reporte
                </Button>
              </div>
            </div>
          </div>

          {/* Dashboard Summary */}
          <DashboardSummary />

          {/* Resumen de Consumo Comparativo */}
          <Card className="mb-6">
            <CardHeader>
              <h3 className="text-lg font-semibold">Resumen de Consumo vs Período Anterior</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Consumo Diario</p>
                  <p className="text-2xl font-bold text-foreground">{formatNumber(consumption.current.daily)} m³</p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    {consumption.trends.daily < 0 ? (
                      <TrendingDownIcon className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingUpIcon className="h-4 w-4 text-red-500" />
                    )}
                    <span className={`text-sm ${getTrendColor(consumption.trends.daily)}`}>
                      {Math.abs(consumption.trends.daily)}% vs anterior
                    </span>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Consumo Semanal</p>
                  <p className="text-2xl font-bold text-foreground">{formatNumber(consumption.current.weekly)} m³</p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    {consumption.trends.weekly < 0 ? (
                      <TrendingDownIcon className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingUpIcon className="h-4 w-4 text-red-500" />
                    )}
                    <span className={`text-sm ${getTrendColor(consumption.trends.weekly)}`}>
                      {Math.abs(consumption.trends.weekly)}% vs anterior
                    </span>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Consumo Mensual</p>
                  <p className="text-2xl font-bold text-foreground">{formatNumber(consumption.current.monthly)} m³</p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    {consumption.trends.monthly < 0 ? (
                      <TrendingDownIcon className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingUpIcon className="h-4 w-4 text-red-500" />
                    )}
                    <span className={`text-sm ${getTrendColor(consumption.trends.monthly)}`}>
                      {Math.abs(consumption.trends.monthly)}% vs anterior
                    </span>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Consumo Anual</p>
                  <p className="text-2xl font-bold text-foreground">{formatNumber(consumption.current.yearly)} m³</p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    {consumption.trends.yearly < 0 ? (
                      <TrendingDownIcon className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingUpIcon className="h-4 w-4 text-red-500" />
                    )}
                    <span className={`text-sm ${getTrendColor(consumption.trends.yearly)}`}>
                      {Math.abs(consumption.trends.yearly)}% vs anterior
                    </span>
                  </div>
                </div>
              </div>

              <div className="h-64">
                <div className="h-full">
                  <Bar data={consumptionComparisonData} options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top'
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: function(value) {
                            return formatNumber(value) + ' m³'
                          }
                        }
                      }
                    }
                  }} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metas vs Consumo Actual */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Consumo vs Metas Establecidas</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-6">
                  {/* Riego */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <DropletIcon className="h-5 w-5 text-green-600" />
                        <span className="font-medium">Pozos - Riego</span>
                      </div>
                      <span className={`px-2 py-1 rounded text-sm ${
                        goals.riego.porcentaje_cumplimiento > 100 ? 'bg-red-100 text-red-700' : 
                        goals.riego.porcentaje_cumplimiento > 90 ? 'bg-yellow-100 text-yellow-700' : 
                        'bg-green-100 text-green-700'
                      }`}>
                        {goals.riego.porcentaje_cumplimiento}% de meta
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Meta Mensual</p>
                        <p className="font-medium">{formatNumber(goals.riego.meta_mensual)} m³</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Consumo Actual</p>
                        <p className="font-medium">{formatNumber(goals.riego.consumo_actual)} m³</p>
                      </div>
                    </div>
                    <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          goals.riego.porcentaje_cumplimiento > 100 ? 'bg-red-500' : 
                          goals.riego.porcentaje_cumplimiento > 90 ? 'bg-yellow-500' : 
                          'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(goals.riego.porcentaje_cumplimiento, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Servicios */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <ActivityIcon className="h-5 w-5 text-blue-600" />
                        <span className="font-medium">Pozos - Servicios</span>
                      </div>
                      <span className={`px-2 py-1 rounded text-sm ${
                        goals.servicios.porcentaje_cumplimiento > 100 ? 'bg-red-100 text-red-700' : 
                        goals.servicios.porcentaje_cumplimiento > 90 ? 'bg-yellow-100 text-yellow-700' : 
                        'bg-green-100 text-green-700'
                      }`}>
                        {goals.servicios.porcentaje_cumplimiento}% de meta
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Meta Mensual</p>
                        <p className="font-medium">{formatNumber(goals.servicios.meta_mensual)} m³</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Consumo Actual</p>
                        <p className="font-medium">{formatNumber(goals.servicios.consumo_actual)} m³</p>
                      </div>
                    </div>
                    <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          goals.servicios.porcentaje_cumplimiento > 100 ? 'bg-red-500' : 
                          goals.servicios.porcentaje_cumplimiento > 90 ? 'bg-yellow-500' : 
                          'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(goals.servicios.porcentaje_cumplimiento, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="h-48">
                  <Bar data={goalsData} options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top'
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: function(value) {
                            return formatNumber(value) + ' m³'
                          }
                        }
                      }
                    }
                  }} />
                </div>
              </CardContent>
            </Card>

            {/* KPIs de Eficiencia */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">KPIs de Eficiencia</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-6">
                  {Object.entries(efficiencyKPIs).map(([key, kpi], index) => (
                    <div key={index} className={`border rounded-lg p-3 ${getKPIColor(kpi.estado)}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium capitalize">{key.replace('_', ' ')}</span>
                        <div className="flex items-center gap-2">
                          {kpi.estado === 'success' ? (
                            <CheckCircleIcon className="h-4 w-4" />
                          ) : (
                            <AlertTriangleIcon className="h-4 w-4" />
                          )}
                          <span className="text-sm font-medium">
                            {kpi.actual}% {key === 'perdidas' ? '(pérdidas)' : ''}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Meta: {kpi.meta}%</span>
                        <span className={getTrendColor(key === 'perdidas' ? -kpi.tendencia : kpi.tendencia)}>
                          {kpi.tendencia > 0 ? '+' : ''}{kpi.tendencia}% vs anterior
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 bg-white/50 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-current rounded-full opacity-60"
                          style={{ width: `${(kpi.actual / kpi.meta) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="h-48">
                  <Radar data={efficiencyData} options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top'
                      }
                    },
                    scales: {
                      r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                          callback: function(value) {
                            return value + '%'
                          }
                        }
                      }
                    }
                  }} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sección de Resumen de Todas las Features */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
              <BarChart3Icon className="h-6 w-6 text-primary" />
              Resumen de Todas las Secciones
            </h2>
          </div>

          {/* Grid de Gráficas de Todas las Secciones */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Consumo de Agua Semanal */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DropletIcon className="h-5 w-5 text-blue-500" />
                    <h3 className="text-lg font-semibold">Consumo de Agua - Últimas 12 Semanas</h3>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-64 flex items-center justify-center">
                    <p className="text-muted-foreground">Cargando datos...</p>
                  </div>
                ) : waterChartData ? (
                  <div className="h-64">
                    <Line data={waterChartData} options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: true, position: 'top' },
                        tooltip: {
                          callbacks: {
                            label: (context) => `${context.dataset.label}: ${context.parsed.y.toLocaleString()} m³`
                          }
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: { callback: (value) => `${value.toLocaleString()} m³` }
                        }
                      }
                    }} />
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center">
                    <p className="text-muted-foreground">No hay datos disponibles</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Consumo de Gas Semanal */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FlameIcon className="h-5 w-5 text-orange-500" />
                    <h3 className="text-lg font-semibold">Consumo de Gas - Últimas 12 Semanas</h3>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-64 flex items-center justify-center">
                    <p className="text-muted-foreground">Cargando datos...</p>
                  </div>
                ) : gasChartData ? (
                  <div className="h-64">
                    <Line data={gasChartData} options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: true, position: 'top' },
                        tooltip: {
                          callbacks: {
                            label: (context) => `${context.dataset.label}: ${context.parsed.y.toLocaleString()} m³`
                          }
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: { callback: (value) => `${value.toLocaleString()} m³` }
                        }
                      }
                    }} />
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center">
                    <p className="text-muted-foreground">No hay datos disponibles</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* PTAR - Entrada vs Salida */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Factory className="h-5 w-5 text-green-600" />
                    <h3 className="text-lg font-semibold">PTAR - Entrada vs Salida</h3>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-64 flex items-center justify-center">
                    <p className="text-muted-foreground">Cargando datos...</p>
                  </div>
                ) : ptarChartData ? (
                  <div className="h-64">
                    <Line data={ptarChartData} options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: true, position: 'top' },
                        tooltip: {
                          callbacks: {
                            label: (context) => `${context.dataset.label}: ${context.parsed.y.toLocaleString()} m³`
                          }
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: { callback: (value) => `${value.toLocaleString()} m³` }
                        }
                      }
                    }} />
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center">
                    <p className="text-muted-foreground">No hay datos disponibles</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Lecturas Diarias */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Waves className="h-5 w-5 text-teal-500" />
                    <h3 className="text-lg font-semibold">Lecturas Diarias - Últimos 30 Días</h3>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-64 flex items-center justify-center">
                    <p className="text-muted-foreground">Cargando datos...</p>
                  </div>
                ) : dailyChartData ? (
                  <div className="h-64">
                    <Line data={dailyChartData} options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: true, position: 'top' },
                        tooltip: {
                          callbacks: {
                            label: (context) => `${context.dataset.label}: ${context.parsed.y.toLocaleString()} m³`
                          }
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: { callback: (value) => `${value.toLocaleString()} m³` }
                        }
                      }
                    }} />
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center">
                    <p className="text-muted-foreground">No hay datos disponibles</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sección de Predicción con IA */}
          <Card className="mb-6 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-purple-600" />
                  <h3 className="text-xl font-bold text-purple-900">Predicción de Consumo - Próximas 4 Semanas</h3>
                </div>
                <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                  IA Predictiva
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {dataLoading ? (
                <div className="h-80 flex items-center justify-center">
                  <p className="text-muted-foreground">Generando predicción...</p>
                </div>
              ) : predictionData ? (
                <>
                  {/* Métricas de Predicción */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-lg p-4 border border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-5 w-5 text-purple-600" />
                        <p className="text-sm text-muted-foreground">Promedio Proyectado</p>
                      </div>
                      <p className="text-2xl font-bold text-purple-900">{predictionData.promedio.toLocaleString()} m³</p>
                      <p className="text-xs text-muted-foreground mt-1">Por semana</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        <ActivityIcon className="h-5 w-5 text-purple-600" />
                        <p className="text-sm text-muted-foreground">Tendencia</p>
                      </div>
                      <p className="text-2xl font-bold text-purple-900 capitalize">{predictionData.tendencia}</p>
                      <p className="text-xs text-muted-foreground mt-1">Próximas semanas</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        <ZapIcon className="h-5 w-5 text-purple-600" />
                        <p className="text-sm text-muted-foreground">Cambio Estimado</p>
                      </div>
                      <p className="text-2xl font-bold text-purple-900">±{predictionData.cambioEstimado.toLocaleString()} m³</p>
                      <p className="text-xs text-muted-foreground mt-1">En 4 semanas</p>
                    </div>
                  </div>

                  {/* Gráfica de Predicción */}
                  <div className="h-80 bg-white rounded-lg p-4 border border-purple-200">
                    <Line data={{
                      labels: predictionData.allLabels,
                      datasets: predictionData.datasets
                    }} options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: true, position: 'top' },
                        tooltip: {
                          callbacks: {
                            label: (context) => {
                              if (context.parsed.y === null) return null
                              return `${context.dataset.label}: ${context.parsed.y.toLocaleString()} m³`
                            }
                          }
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: { callback: (value) => `${value.toLocaleString()} m³` }
                        }
                      }
                    }} />
                  </div>

                  {/* Nota sobre la predicción */}
                  <div className="mt-4 p-4 bg-purple-100 rounded-lg border border-purple-200">
                    <p className="text-sm text-purple-900">
                      <strong>Nota:</strong> Esta predicción se basa en el análisis de las últimas 4 semanas de consumo 
                      utilizando promedio móvil y tendencia lineal. Los valores reales pueden variar según factores 
                      estacionales, eventos especiales y cambios en el uso del campus.
                    </p>
                  </div>
                </>
              ) : (
                <div className="h-80 flex items-center justify-center">
                  <p className="text-muted-foreground">No hay suficientes datos para generar predicción</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Componente de monitoreo de pozos */}
          <div className="grid gap-6">
            <WellMonitoringCharts />
          </div>
        </main>
      </div>
    </div>
  )
    </RedirectIfNotAuth>
  );
}
