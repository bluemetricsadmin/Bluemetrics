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
  DownloadIcon,
  Waves,
  TableIcon,
  Loader2Icon,
  RefreshCwIcon,
  AlertCircleIcon
} from 'lucide-react'

import MonthlyComparisonChart from '../components/MonthlyComparisonChart'
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
  
  // Estados para datos de Supabase
  const [monthlyConsumption, setMonthlyConsumption] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Estados para comparativas entre años (per-year data para MonthlyComparisonChart)
  const [monthlyData2023, setMonthlyData2023] = useState([])
  const [monthlyData2024, setMonthlyData2024] = useState([])
  const [monthlyData2025, setMonthlyData2025] = useState([])
  const [monthlyData2026, setMonthlyData2026] = useState([])

  // Estados para controles de gráfica (estilo ConsumptionPage)
  const [comparisonChartType, setComparisonChartType] = useState('line')
  const [comparisonYearsToShow, setComparisonYearsToShow] = useState(['2025', '2026'])
  const [availableYears] = useState(['2023', '2024', '2025', '2026'])
  
  // Estado para punto de medición seleccionado
  const [selectedPoint, setSelectedPoint] = useState('medidor_general_pozos')
  
  // Tab activa para tablas detalladas
  const [activeTab, setActiveTab] = useState('pozos_servicios')

  // Cargar datos cuando cambia el año
  useEffect(() => {
    fetchMonthlyData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear])

  // Cargar datos de comparación cuando cambia el punto seleccionado
  useEffect(() => {
    fetchAllYearsMonthlyData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPoint])

  const fetchMonthlyData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const consumptionTableName = getMonthlyWaterConsumptionTableName()
      
      // Cargar consumo mensual
      const { data: consumptionData, error: consumptionError } = await supabase
        .from(consumptionTableName)
        .select('*')
        .eq('anio', parseInt(selectedYear))
        .order('mes', { ascending: true })
      
      if (consumptionError) {
        console.error('❌ Error cargando consumo:', consumptionError)
        throw consumptionError
      }
      
      setMonthlyConsumption(consumptionData || [])
      
    } catch (err) {
      console.error('❌ Error al cargar datos:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Función para cargar datos de un año específico para la gráfica de comparación
  const fetchYearMonthlyData = async (year, setStateFunction) => {
    try {
      const shouldSumAll = selectedPoint === 'todos'
      const readingsTableName = getMonthlyWaterTableName()
      const consumptionTableName = getMonthlyWaterConsumptionTableName()

      // Cargar lecturas mensuales
      const { data: readingsData, error: readingsError } = await supabase
        .from(readingsTableName)
        .select('*')
        .eq('anio', parseInt(year))
        .order('mes', { ascending: true })

      if (readingsError) {
        console.error(`❌ Error cargando lecturas de ${year}:`, readingsError)
        setStateFunction([])
        return
      }

      // Cargar consumo mensual
      const { data: consumptionData, error: consumptionError } = await supabase
        .from(consumptionTableName)
        .select('*')
        .eq('anio', parseInt(year))
        .order('mes', { ascending: true })

      if (consumptionError) {
        console.error(`❌ Error cargando consumo de ${year}:`, consumptionError)
        setStateFunction([])
        return
      }

      if (!readingsData || readingsData.length === 0) {
        setStateFunction([])
        return
      }

      let formattedData
      if (shouldSumAll) {
        formattedData = (consumptionData || []).map(row => {
          let totalConsumption = 0
          Object.keys(row).forEach(key => {
            if (key.startsWith('l_') && 
                key !== 'l_id' &&
                row[key] !== null) {
              const value = parseFloat(row[key])
              if (!isNaN(value)) {
                totalConsumption += value
              }
            }
          })
          return {
            month: row.mes,
            monthName: getMonthName(row.mes),
            reading: totalConsumption,
            consumption: totalConsumption
          }
        })
      } else {
        const columnName = `l_${selectedPoint}`
        formattedData = readingsData.map(reading => {
          const consumption = (consumptionData || []).find(c => c.mes === reading.mes)
          return {
            month: reading.mes,
            monthName: getMonthName(reading.mes),
            reading: parseFloat(reading[columnName]) || 0,
            consumption: parseFloat(consumption?.[columnName]) || 0
          }
        })
      }

      setStateFunction(formattedData)
    } catch (err) {
      console.error(`❌ Error al cargar datos de ${year}:`, err)
      setStateFunction([])
    }
  }

  // Cargar datos de todos los años para comparación
  const fetchAllYearsMonthlyData = async () => {
    await Promise.all([
      fetchYearMonthlyData('2023', setMonthlyData2023),
      fetchYearMonthlyData('2024', setMonthlyData2024),
      fetchYearMonthlyData('2025', setMonthlyData2025),
      fetchYearMonthlyData('2026', setMonthlyData2026)
    ])
  }

  // Preparar datos multi-año para MonthlyComparisonChart
  const getMultiYearChartData = () => {
    const yearDataMap = {
      '2023': monthlyData2023,
      '2024': monthlyData2024,
      '2025': monthlyData2025,
      '2026': monthlyData2026
    }

    const sortedSelectedYears = [...comparisonYearsToShow].sort()
    return sortedSelectedYears.map(year => ({
      year,
      data: yearDataMap[year] || []
    }))
  }

  const multiYearData = getMultiYearChartData()

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

                {/* Controles de Comparativas Mensuales */}
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
                                    if (prev.length === 1) return prev
                                    return prev.filter(y => y !== year)
                                  }
                                  return [...prev, year].sort()
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

                {/* Gráfica de comparación mensual */}
                <MonthlyComparisonChart
                  title={selectedPoint === 'todos' ? 'Todos los Puntos (Suma Total)' : (consumptionPointsData.categories.flatMap(c => c.points).find(p => p.id === selectedPoint)?.name || "Punto de Medición")}
                  unit="m³"
                  chartType={comparisonChartType}
                  showControls={false}
                  multiYearData={multiYearData}
                />

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
