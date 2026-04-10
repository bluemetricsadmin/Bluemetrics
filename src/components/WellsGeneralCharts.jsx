import { useState, useEffect } from 'react'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { supabase } from '../supabaseClient'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from 'recharts'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip as ChartTooltipPlugin,
  Legend as ChartLegendPlugin,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartTitle,
  ChartTooltipPlugin,
  ChartLegendPlugin,
  Filler
)
import { 
  Loader2Icon, 
  AlertTriangleIcon, 
  BarChart3,
  TrendingUp,
  Droplet,
  LineChart as LineChartIcon,
  Calendar,
  CalendarDays
} from 'lucide-react'

export default function WellsGeneralCharts() {
  const [chartData, setChartData] = useState({
    riego: [],
    servicios: [],
    total: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedChart, setSelectedChart] = useState('total') // 'riego', 'servicios', 'total'
  const [viewType, setViewType] = useState('mensual') // 'semanal', 'mensual', 'anual'
  const [chartType, setChartType] = useState('line') // 'bar', 'line', 'area'
  const [rawData, setRawData] = useState({
    riego: [],
    servicios: [],
    total: []
  })
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [dateFilterActive, setDateFilterActive] = useState(false)

  // Configuración de pozos
  const wellsConfig = {
    riego: ['l_pozo_4_riego', 'l_pozo_8_riego', 'l_pozo_15_riego'],
    servicios: ['l_pozo_11', 'l_pozo_12', 'l_pozo_3', 'l_pozo_7', 'l_pozo_14']
  }

  useEffect(() => {
    fetchYearlyData()
  }, [])

  useEffect(() => {
    processDataByView()
  }, [viewType, rawData, dateFilterActive, startDate, endDate])

  const fetchYearlyData = async () => {
    try {
      setLoading(true)
      setError(null)

      const years = [2023, 2024, 2025, 2026]
      const allData = {
        riego: [],
        servicios: [],
        total: []
      }

      // Obtener datos de cada año
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
          // Procesar cada semana
          data.forEach(row => {
            const consumoRiego = wellsConfig.riego.reduce((acc, col) => {
              return acc + (parseFloat(row[col]) || 0)
            }, 0)

            const consumoServicios = wellsConfig.servicios.reduce((acc, col) => {
              return acc + (parseFloat(row[col]) || 0)
            }, 0)

            const consumoTotal = consumoRiego + consumoServicios

            allData.riego.push({
              year: year.toString(),
              week: row.l_numero_semana,
              fecha_inicio: row.l_fecha_inicio,
              fecha_fin: row.l_fecha_fin,
              consumo: parseFloat(consumoRiego.toFixed(2))
            })

            allData.servicios.push({
              year: year.toString(),
              week: row.l_numero_semana,
              fecha_inicio: row.l_fecha_inicio,
              fecha_fin: row.l_fecha_fin,
              consumo: parseFloat(consumoServicios.toFixed(2))
            })

            allData.total.push({
              year: year.toString(),
              week: row.l_numero_semana,
              fecha_inicio: row.l_fecha_inicio,
              fecha_fin: row.l_fecha_fin,
              consumo: parseFloat(consumoTotal.toFixed(2))
            })
          })
        }
      }

      setRawData(allData)
      console.log('✅ Datos crudos cargados:', allData)
    } catch (err) {
      console.error('❌ Error cargando datos de gráficos:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const processDataByView = () => {
    if (!rawData.riego || rawData.riego.length === 0) return

    const processed = {
      riego: [],
      servicios: [],
      total: []
    }

    const types = ['riego', 'servicios', 'total']

    types.forEach(type => {
      let data = rawData[type]

      // Aplicar filtro de fechas si está activo
      if (dateFilterActive && startDate && endDate) {
        data = data.filter(item => {
          const itemDate = item.fecha_inicio || `${item.year}-01-01`
          return itemDate >= startDate && itemDate <= endDate
        })
      }

      if (viewType === 'anual') {
        // Agrupar por año
        const yearGroups = {}
        data.forEach(item => {
          if (!yearGroups[item.year]) {
            yearGroups[item.year] = []
          }
          yearGroups[item.year].push(item.consumo)
        })

        processed[type] = Object.keys(yearGroups).map(year => ({
          label: year,
          consumo: parseFloat(yearGroups[year].reduce((a, b) => a + b, 0).toFixed(2))
        }))
      } else if (viewType === 'mensual') {
        // Agrupar por mes
        const monthGroups = {}
        data.forEach(item => {
          const month = item.fecha_inicio ? item.fecha_inicio.substring(0, 7) : `${item.year}-W${item.week}`
          if (!monthGroups[month]) {
            monthGroups[month] = []
          }
          monthGroups[month].push(item.consumo)
        })

        processed[type] = Object.keys(monthGroups).sort().map(month => ({
          label: month,
          consumo: parseFloat(monthGroups[month].reduce((a, b) => a + b, 0).toFixed(2))
        }))
      } else if (viewType === 'semanal') {
        // Mostrar todas las semanas
        processed[type] = data.map(item => ({
          label: `${item.year}-S${item.week}`,
          consumo: item.consumo
        }))
      }
    })

    setChartData(processed)
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">Año {label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-gray-700">
                {entry.name}: {entry.value.toLocaleString('es-MX', { minimumFractionDigits: 2 })} m³
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  const renderChart = () => {
    const data = chartData[selectedChart]
    
    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">No hay datos disponibles</p>
        </div>
      )
    }

    const commonProps = {
      data,
      margin: { top: 20, right: 30, left: 20, bottom: 20 }
    }

    const xAxisLabel = viewType === 'anual' ? 'Año' : viewType === 'mensual' ? 'Mes' : 'Semana'

    if (chartType === 'line') {
      const chartJSData = {
        labels: data.map(d => d.label),
        datasets: [{
          label: 'Consumo Total',
          data: data.map(d => d.consumo),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 7,
          pointBackgroundColor: 'rgb(59, 130, 246)',
        }]
      }

      const chartJSOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 15,
              font: { size: 12 }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ${context.parsed.y.toLocaleString('es-MX', { minimumFractionDigits: 2 })} m³`
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              maxRotation: viewType === 'semanal' ? 45 : 0,
              minRotation: 0,
              font: { size: 11 }
            }
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(0, 0, 0, 0.05)' },
            ticks: {
              callback: function(value) {
                return value.toLocaleString() + ' m³'
              }
            }
          }
        }
      }

      return (
        <div style={{ height: 400 }}>
          <Line data={chartJSData} options={chartJSOptions} />
        </div>
      )
    }

    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="label" 
            tick={{ fill: '#6b7280', fontSize: 12 }}
            angle={viewType === 'semanal' ? -45 : 0}
            textAnchor={viewType === 'semanal' ? 'end' : 'middle'}
            height={viewType === 'semanal' ? 80 : 60}
            label={{ value: xAxisLabel, position: 'insideBottom', offset: viewType === 'semanal' ? -15 : -10, fill: '#374151' }}
          />
          <YAxis 
            tick={{ fill: '#6b7280', fontSize: 14 }}
            label={{ value: 'Consumo (m³)', angle: -90, position: 'insideLeft', fill: '#374151', offset: 10 }}
            width={80}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
          />
          <Bar 
            dataKey="consumo" 
            fill="#3b82f6" 
            name="Consumo Total"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    )
  }

  const getChartTitle = () => {
    switch (selectedChart) {
      case 'riego':
        return 'Consumo de Agua - Pozos de Riego'
      case 'servicios':
        return 'Consumo de Agua - Pozos de Servicios'
      case 'total':
        return 'Consumo de Agua - Todos los Pozos'
      default:
        return 'Consumo de Agua'
    }
  }

  const getChartDescription = () => {
    switch (selectedChart) {
      case 'riego':
        return 'Sumatoria de consumo de los 3 pozos de riego (Pozo 4, 8 y 15) en los años 2023, 2024, 2025 y 2026'
      case 'servicios':
        return 'Sumatoria de consumo de los 5 pozos de servicios (Pozo 3, 7, 11, 12 y 14) en los años 2023, 2024, 2025 y 2026'
      case 'total':
        return 'Sumatoria de consumo de todos los pozos (8 pozos: riego + servicios) en los años 2023, 2024, 2025 y 2026'
      default:
        return ''
    }
  }

  const getChartStats = () => {
    const data = chartData[selectedChart]
    if (!data || data.length === 0) return null

    const totalConsumo = data.reduce((sum, item) => sum + item.consumo, 0)
    const promedioAnual = totalConsumo / data.length
    const maxYear = data.reduce((max, item) => item.consumo > max.consumo ? item : max, data[0])
    const minYear = data.reduce((min, item) => item.consumo < min.consumo ? item : min, data[0])

    return {
      totalConsumo,
      promedioAnual,
      maxYear,
      minYear
    }
  }

  const stats = getChartStats()

  if (loading) {
    return (
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <Loader2Icon className="h-8 w-8 animate-spin text-gray-400" />
            <p className="text-sm text-gray-500 ml-3">Cargando datos de gráficos...</p>
          </div>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <AlertTriangleIcon className="h-8 w-8 text-red-500" />
            <p className="text-sm text-red-600 ml-3">Error: {error}</p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">{getChartTitle()}</h2>
            </div>
            <p className="text-sm text-gray-600">{getChartDescription()}</p>
          </div>
        </div>

        {/* Botones de selección de pozos */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            variant={selectedChart === 'total' ? 'default' : 'outline'}
            onClick={() => setSelectedChart('total')}
            className="flex items-center gap-2"
          >
            <Droplet className="h-4 w-4" />
            Todos los Pozos
          </Button>
          <Button
            variant={selectedChart === 'riego' ? 'default' : 'outline'}
            onClick={() => setSelectedChart('riego')}
            className="flex items-center gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            Pozos de Riego
          </Button>
          <Button
            variant={selectedChart === 'servicios' ? 'default' : 'outline'}
            onClick={() => setSelectedChart('servicios')}
            className="flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Pozos de Servicios
          </Button>
        </div>

        {/* Filtros de vista y tipo de gráfico */}
        <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          {/* Filtro de vista temporal */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Vista:</span>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={viewType === 'anual' ? 'default' : 'outline'}
                onClick={() => setViewType('anual')}
              >
                Anual
              </Button>
              <Button
                size="sm"
                variant={viewType === 'mensual' ? 'default' : 'outline'}
                onClick={() => setViewType('mensual')}
              >
                Mensual
              </Button>
              <Button
                size="sm"
                variant={viewType === 'semanal' ? 'default' : 'outline'}
                onClick={() => setViewType('semanal')}
              >
                Semanal
              </Button>
            </div>
          </div>

          {/* Separador vertical */}
          <div className="border-l border-gray-300"></div>

          {/* Filtro de tipo de gráfico */}
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Tipo:</span>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={chartType === 'bar' ? 'default' : 'outline'}
                onClick={() => setChartType('bar')}
                className="flex items-center gap-1"
              >
                <BarChart3 className="h-3 w-3" />
                Barras
              </Button>
              <Button
                size="sm"
                variant={chartType === 'line' ? 'default' : 'outline'}
                onClick={() => setChartType('line')}
                className="flex items-center gap-1"
              >
                <LineChartIcon className="h-3 w-3" />
                Líneas
              </Button>

            </div>
          </div>
        </div>

        {/* Filtros de Fecha */}
        
        {/* 
        
        <div className="flex flex-wrap gap-4 mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Filtro por Fechas:</span>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">Desde:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">Hasta:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant={dateFilterActive ? 'default' : 'outline'}
              onClick={() => {
                if (startDate && endDate) {
                  setDateFilterActive(!dateFilterActive)
                } else {
                  alert('Por favor selecciona ambas fechas')
                }
              }}
              disabled={!startDate || !endDate}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {dateFilterActive ? 'Filtro Activo' : 'Aplicar Filtro'}
            </Button>
            
            {dateFilterActive && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setDateFilterActive(false)
                  setStartDate('')
                  setEndDate('')
                }}
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                Limpiar
              </Button>
            )}
          </div>

          {dateFilterActive && (
            <div className="w-full mt-2 p-2 bg-blue-100 rounded border border-blue-300">
              <p className="text-xs text-blue-800">
                <strong>Filtro activo:</strong> Mostrando datos desde {new Date(startDate).toLocaleDateString('es-MX')} hasta {new Date(endDate).toLocaleDateString('es-MX')}
              </p>
            </div>
          )}
        </div>
        
        */}
        

        {/* Estadísticas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700 font-medium mb-1">Consumo Total</p>
              <p className="text-2xl font-bold text-blue-900">
                {stats.totalConsumo.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} m³
              </p>
            </div>


              {/*<div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <p className="text-sm text-purple-700 font-medium mb-1">Año con Mayor Consumo</p>
              <p className="text-2xl font-bold text-purple-900">{stats.maxYear.year}</p>
              <p className="text-xs text-purple-600">
                {stats.maxYear.consumo.toLocaleString('es-MX', { minimumFractionDigits: 0 })} m³
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <p className="text-sm text-orange-700 font-medium mb-1">Año con Menor Consumo</p>
              <p className="text-2xl font-bold text-orange-900">{stats.minYear.year}</p>
              <p className="text-xs text-orange-600">
                {stats.minYear.consumo.toLocaleString('es-MX', { minimumFractionDigits: 0 })} m³
              </p>
            </div> */}
            
          </div>
        )}

        {/* Gráfico */}
        <div className="bg-gray-50 p-4 rounded-lg">
          {renderChart()}
        </div>
      </div>
    </Card>
  )
}
