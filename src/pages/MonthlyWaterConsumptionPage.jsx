import { useState, useEffect } from 'react'
import { DashboardHeader } from "../components/dashboard-header"
import { DashboardSidebar } from "../components/dashboard-sidebar"
import { Card, CardContent, CardHeader } from "../components/ui/card"
import { Button } from "../components/ui/button"
import consumptionPointsData from '../lib/consumption-points.json'
import { supabase } from '../supabaseClient'
import { 
  TrendingUpIcon,
  TrendingDownIcon,
  DropletIcon,
  BarChart3Icon,
  CalendarIcon,
  DownloadIcon,
  Waves,
  TableIcon,
  Loader2Icon,
  RefreshCwIcon,
  AlertCircleIcon
} from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts'

import { RedirectIfNotAuth } from '../components/RedirectIfNotAuth'
import { 
  getMonthlyWaterTableName, 
  getMonthlyWaterConsumptionTableName,
  AVAILABLE_YEARS, 
  DEFAULT_YEAR,
  MONTHS,
  getMonthName
} from '../utils/tableHelpers'

export default function MonthlyWaterConsumptionPage() {
  const [selectedYear, setSelectedYear] = useState(DEFAULT_YEAR)
  const [viewMode, setViewMode] = useState('chart') // 'chart' o 'table'
  const [chartType, setChartType] = useState('bar') // 'bar' o 'line'
  
  // Estados para datos de Supabase
  const [monthlyReadings, setMonthlyReadings] = useState([])
  const [monthlyConsumption, setMonthlyConsumption] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Estados para comparativas entre años
  const [comparisonYears, setComparisonYears] = useState([DEFAULT_YEAR])
  const [comparisonData, setComparisonData] = useState({})
  
  // Estado para punto de medición seleccionado
  const [selectedPoint, setSelectedPoint] = useState('medidor_general_pozos')
  
  // Tab activa para tablas detalladas
  const [activeTab, setActiveTab] = useState('pozos_servicios')

  // Cargar datos cuando cambia el año
  useEffect(() => {
    fetchMonthlyData()
  }, [selectedYear])

  // Cargar datos de comparación cuando cambian los años seleccionados
  useEffect(() => {
    fetchComparisonData()
  }, [comparisonYears, selectedPoint])

  const fetchMonthlyData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const readingsTableName = getMonthlyWaterTableName()
      const consumptionTableName = getMonthlyWaterConsumptionTableName()
      
      console.log('🔍 Cargando lecturas mensuales desde:', readingsTableName)
      console.log('🔍 Cargando consumo mensual desde:', consumptionTableName)
      
      // Cargar lecturas mensuales
      const { data: readingsData, error: readingsError } = await supabase
        .from(readingsTableName)
        .select('*')
        .eq('anio', parseInt(selectedYear))
        .order('mes', { ascending: true })
      
      if (readingsError) {
        console.error('❌ Error cargando lecturas:', readingsError)
        throw readingsError
      }
      
      // Cargar consumo mensual
      const { data: consumptionData, error: consumptionError } = await supabase
        .from(consumptionTableName)
        .select('*')
        .eq('anio', parseInt(selectedYear))
        .order('mes', { ascending: true })
      
      if (consumptionError) {
        console.error('❌ Error cargando consumo:', consumptionError)
        // No lanzar error, puede que la tabla no exista aún
      }
      
      console.log('✅ Lecturas obtenidas:', readingsData?.length, 'meses')
      console.log('✅ Consumo obtenido:', consumptionData?.length, 'meses')
      
      setMonthlyReadings(readingsData || [])
      setMonthlyConsumption(consumptionData || [])
      
    } catch (err) {
      console.error('❌ Error al cargar datos:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchComparisonData = async () => {
    try {
      const consumptionTableName = getMonthlyWaterConsumptionTableName()
      const newComparisonData = {}
      
      for (const year of comparisonYears) {
        const { data, error } = await supabase
          .from(consumptionTableName)
          .select('*')
          .eq('anio', parseInt(year))
          .order('mes', { ascending: true })
        
        if (!error && data) {
          newComparisonData[year] = data.map(row => ({
            mes: row.mes,
            monthName: getMonthName(row.mes),
            value: selectedPoint === 'todos' 
              ? calculateTotalConsumption(row)
              : parseFloat(row[`l_${selectedPoint}`]) || 0
          }))
        }
      }
      
      setComparisonData(newComparisonData)
    } catch (err) {
      console.error('❌ Error cargando datos de comparación:', err)
    }
  }

  // Calcular consumo total de un mes (suma de todos los puntos)
  const calculateTotalConsumption = (row) => {
    let total = 0
    Object.keys(row).forEach(key => {
      if (key.startsWith('l_') && 
          key !== 'l_id' &&
          row[key] !== null) {
        const value = parseFloat(row[key])
        if (!isNaN(value)) {
          total += value
        }
      }
    })
    return total
  }

  // Calcular métricas principales
  const calculateMetrics = () => {
    if (!monthlyConsumption || monthlyConsumption.length === 0) {
      return { pozos: 0, riego: 0, servicios: 0, pozosPrev: 0, riegoPrev: 0, serviciosPrev: 0 }
    }

    // Columnas de pozos
    const pozosServiciosCols = ['l_pozo_11', 'l_pozo_12', 'l_pozo_3', 'l_pozo_7', 'l_pozo_14']
    const pozosRiegoCols = ['l_pozo_4_riego', 'l_pozo_8_riego', 'l_pozo_15_riego']
    const todosPozosCols = [...pozosServiciosCols, ...pozosRiegoCols]

    const sumConsumption = (data, columns) => {
      return data.reduce((total, row) => {
        const sum = columns.reduce((colSum, col) => {
          const value = parseFloat(row[col]) || 0
          return colSum + value
        }, 0)
        return total + sum
      }, 0)
    }

    // Últimos 3 meses vs 3 anteriores
    const last3 = monthlyConsumption.slice(-3)
    const prev3 = monthlyConsumption.slice(-6, -3)

    return {
      pozos: Math.round(sumConsumption(last3, todosPozosCols)),
      riego: Math.round(sumConsumption(last3, pozosRiegoCols)),
      servicios: Math.round(sumConsumption(last3, pozosServiciosCols)),
      pozosPrev: Math.round(sumConsumption(prev3, todosPozosCols)),
      riegoPrev: Math.round(sumConsumption(prev3, pozosRiegoCols)),
      serviciosPrev: Math.round(sumConsumption(prev3, pozosServiciosCols))
    }
  }

  const metrics = calculateMetrics()
  
  const pozosTrend = metrics.pozosPrev > 0 
    ? ((metrics.pozos - metrics.pozosPrev) / metrics.pozosPrev * 100).toFixed(1)
    : 0
  const riegoTrend = metrics.riegoPrev > 0
    ? ((metrics.riego - metrics.riegoPrev) / metrics.riegoPrev * 100).toFixed(1)
    : 0
  const serviciosTrend = metrics.serviciosPrev > 0
    ? ((metrics.servicios - metrics.serviciosPrev) / metrics.serviciosPrev * 100).toFixed(1)
    : 0

  // Preparar datos para gráficas
  const prepareChartData = () => {
    const data = monthlyConsumption.map(row => {
      const columnName = `l_${selectedPoint}`
      return {
        mes: getMonthName(row.mes),
        mesNum: row.mes,
        value: selectedPoint === 'todos' 
          ? calculateTotalConsumption(row)
          : parseFloat(row[columnName]) || 0
      }
    })
    return data
  }

  // Preparar datos de comparación entre años para gráfica
  const prepareComparisonChartData = () => {
    const allMonths = MONTHS.map(m => ({
      mes: m.label,
      mesNum: m.value
    }))

    return allMonths.map(month => {
      const dataPoint = { mes: month.mes }
      comparisonYears.forEach(year => {
        const yearData = comparisonData[year]?.find(d => d.mes === month.mesNum)
        dataPoint[year] = yearData?.value || 0
      })
      return dataPoint
    })
  }

  const chartData = prepareChartData()
  const comparisonChartData = prepareComparisonChartData()

  // Colores para años en comparación
  const yearColors = {
    '2023': '#94a3b8',
    '2024': '#60a5fa',
    '2025': '#34d399',
    '2026': '#f97316'
  }

  // Toggle año en comparación
  const toggleComparisonYear = (year) => {
    if (comparisonYears.includes(year)) {
      if (comparisonYears.length > 1) {
        setComparisonYears(comparisonYears.filter(y => y !== year))
      }
    } else {
      setComparisonYears([...comparisonYears, year])
    }
  }

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
                  <h1 className="text-3xl font-bold text-foreground mb-2">
                    Consumo Mensual de Agua
                  </h1>
                  <p className="text-muted-foreground">
                    Análisis detallado del consumo hídrico mensual
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Año:</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="px-3 py-2 border border-muted rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {AVAILABLE_YEARS.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={fetchMonthlyData}
                    disabled={loading}
                  >
                    <RefreshCwIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Recargar
                  </Button>
                  <Button variant="outline" size="sm">
                    <DownloadIcon className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </div>
            </div>

            {/* Estado de carga o error */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2Icon className="h-8 w-8 animate-spin text-primary mr-3" />
                <span className="text-muted-foreground">Cargando datos mensuales...</span>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                <AlertCircleIcon className="h-5 w-5 text-red-600" />
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {!loading && !error && (
              <>
                {/* Métricas principales */}
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

                {/* Sección de Gráficas de Consumo Mensual */}
                <Card className="mb-6">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BarChart3Icon className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">Consumo Mensual por Punto de Medición</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant={chartType === 'bar' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setChartType('bar')}
                        >
                          Barras
                        </Button>
                        <Button
                          variant={chartType === 'line' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setChartType('line')}
                        >
                          Líneas
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Selector de punto de medición */}
                    <div className="mb-4">
                      <label className="text-sm font-medium mr-2">Punto de Medición:</label>
                      <select
                        value={selectedPoint}
                        onChange={(e) => setSelectedPoint(e.target.value)}
                        className="px-3 py-2 border border-muted rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary min-w-[250px]"
                      >
                        <option value="todos">📊 Total (Todos los puntos)</option>
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
                          <option value="residencias_3">Residencias 3</option>
                          <option value="residencias_5">Residencias 5</option>
                        </optgroup>
                        <optgroup label="Edificios Principales">
                          <option value="wellness_edificio">Wellness Edificio</option>
                          <option value="biblioteca">Biblioteca</option>
                          <option value="cetec">CETEC</option>
                          <option value="biotecnologia">Biotecnología</option>
                          <option value="arena_borrego">Arena Borrego</option>
                          <option value="centro_congresos">Centro de Congresos</option>
                        </optgroup>
                      </select>
                    </div>

                    {/* Gráfica */}
                    {chartData.length > 0 ? (
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          {chartType === 'bar' ? (
                            <BarChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="mes" />
                              <YAxis />
                              <Tooltip 
                                formatter={(value) => [`${value.toLocaleString()} m³`, 'Consumo']}
                              />
                              <Legend />
                              <Bar dataKey="value" name="Consumo (m³)" fill="#3b82f6" />
                            </BarChart>
                          ) : (
                            <LineChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="mes" />
                              <YAxis />
                              <Tooltip 
                                formatter={(value) => [`${value.toLocaleString()} m³`, 'Consumo']}
                              />
                              <Legend />
                              <Line 
                                type="monotone" 
                                dataKey="value" 
                                name="Consumo (m³)" 
                                stroke="#3b82f6" 
                                strokeWidth={2}
                                dot={{ fill: '#3b82f6' }}
                              />
                            </LineChart>
                          )}
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-80 flex items-center justify-center text-muted-foreground">
                        No hay datos de consumo mensual para {selectedYear}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Comparativa entre años */}
                <Card className="mb-6">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">Comparativa entre Años</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        {AVAILABLE_YEARS.map(year => (
                          <Button
                            key={year}
                            variant={comparisonYears.includes(year) ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => toggleComparisonYear(year)}
                            style={{
                              backgroundColor: comparisonYears.includes(year) ? yearColors[year] : undefined,
                              borderColor: yearColors[year]
                            }}
                          >
                            {year}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={comparisonChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="mes" />
                          <YAxis />
                          <Tooltip 
                            formatter={(value, name) => [`${value.toLocaleString()} m³`, name]}
                          />
                          <Legend />
                          {comparisonYears.map(year => (
                            <Line
                              key={year}
                              type="monotone"
                              dataKey={year}
                              name={year}
                              stroke={yearColors[year]}
                              strokeWidth={2}
                              dot={{ fill: yearColors[year] }}
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Tabla de datos detallados */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TableIcon className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">Datos Detallados por Categoría</h3>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Tabs de categorías */}
                    <div className="mb-4 overflow-x-auto">
                      <div className="flex gap-2 border-b border-muted pb-2">
                        {consumptionPointsData.categories.map(category => (
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
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tabla de datos */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-muted">
                            <th className="text-left py-3 px-4 font-semibold">Punto de Medición</th>
                            {MONTHS.map(month => (
                              <th key={month.value} className="text-right py-3 px-2 font-semibold">
                                {month.label.substring(0, 3)}
                              </th>
                            ))}
                            <th className="text-right py-3 px-4 font-semibold bg-muted/30">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {consumptionPointsData.categories
                            .find(c => c.id === activeTab)
                            ?.points.filter(p => !p.noRead)
                            .map(point => {
                              const columnName = `l_${point.id}`
                              const monthValues = MONTHS.map(month => {
                                const monthData = monthlyConsumption.find(r => r.mes === month.value)
                                return monthData ? parseFloat(monthData[columnName]) || 0 : 0
                              })
                              const total = monthValues.reduce((sum, val) => sum + val, 0)

                              return (
                                <tr key={point.id} className="border-b border-muted/50 hover:bg-muted/20">
                                  <td className="py-3 px-4">
                                    <div>
                                      <p className="font-medium">{point.name}</p>
                                      <p className="text-xs text-muted-foreground">{point.id}</p>
                                    </div>
                                  </td>
                                  {monthValues.map((value, idx) => (
                                    <td key={idx} className="text-right py-3 px-2">
                                      {value > 0 ? value.toLocaleString() : '-'}
                                    </td>
                                  ))}
                                  <td className="text-right py-3 px-4 font-semibold bg-muted/30">
                                    {total > 0 ? total.toLocaleString() : '-'}
                                  </td>
                                </tr>
                              )
                            })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </main>
        </div>
      </div>
    </RedirectIfNotAuth>
  )
}
