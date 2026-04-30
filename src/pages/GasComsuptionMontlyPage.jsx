import { useState, useEffect } from 'react'
import { DashboardHeader } from "../components/dashboard-header"
import { DashboardSidebar } from "../components/dashboard-sidebar"
import { Card, CardContent, CardHeader } from "../components/ui/card"
import { Button } from "../components/ui/button"
import consumptionPointsData from '../lib/gas-consumption-points.json'
import { supabase } from '../supabaseClient'
import { 
  TrendingUpIcon,
  TrendingDownIcon,
  FlameIcon,
  ThermometerIcon,
  BarChart3Icon,
  DownloadIcon,
  Building2,
  TableIcon,
  Loader2Icon,
  RefreshCwIcon,
  AlertCircleIcon
} from 'lucide-react'

import MonthlyComparisonChart from '../components/MonthlyComparisonChart'
import { RedirectIfNotAuth } from '../components/RedirectIfNotAuth'
import { 
  getMonthlyGasTableName, 
  getMonthlyGasConsumptionTableName,
  AVAILABLE_YEARS, 
  DEFAULT_YEAR,
  MONTHS,
  getMonthName
} from '../utils/tableHelpers'

export default function GasComsumptionMonthlyPage() {
  const [selectedYear, setSelectedYear] = useState(DEFAULT_YEAR)
  
  const [monthlyConsumption, setMonthlyConsumption] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [monthlyData2023, setMonthlyData2023] = useState([])
  const [monthlyData2024, setMonthlyData2024] = useState([])
  const [monthlyData2025, setMonthlyData2025] = useState([])
  const [monthlyData2026, setMonthlyData2026] = useState([])

  const [comparisonChartType, setComparisonChartType] = useState('line')
  const [comparisonYearsToShow, setComparisonYearsToShow] = useState(['2025', '2026'])
  const [availableYears] = useState(['2023', '2024', '2025', '2026'])
  
  const [selectedPoint, setSelectedPoint] = useState('medidor_general_pozos')
  
  const [activeTab, setActiveTab] = useState('todos_los_puntos')

  useEffect(() => {
    fetchMonthlyData()
  }, [selectedYear])

  useEffect(() => {
    fetchAllYearsMonthlyData()
  }, [selectedPoint])

  const fetchMonthlyData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const consumptionTableName = getMonthlyGasConsumptionTableName()
      
      const { data: consumptionData, error: consumptionError } = await supabase
        .from(consumptionTableName)
        .select('*')
        .eq('anio', parseInt(selectedYear))
        .order('mes', { ascending: true })
      
      if (consumptionError) {
        console.error('Error cargando consumo:', consumptionError)
        throw consumptionError
      }
      
      setMonthlyConsumption(consumptionData || [])
      
    } catch (err) {
      console.error('Error al cargar datos:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchYearMonthlyData = async (year, setStateFunction) => {
    try {
      const shouldSumAll = selectedPoint === 'todos'
      const readingsTableName = getMonthlyGasTableName()
      const consumptionTableName = getMonthlyGasConsumptionTableName()

      const { data: readingsData, error: readingsError } = await supabase
        .from(readingsTableName)
        .select('*')
        .eq('anio', parseInt(year))
        .order('mes', { ascending: true })

      if (readingsError) {
        console.error(`Error cargando lecturas de ${year}:`, readingsError)
        setStateFunction([])
        return
      }

      const { data: consumptionData, error: consumptionError } = await supabase
        .from(consumptionTableName)
        .select('*')
        .eq('anio', parseInt(year))
        .order('mes', { ascending: true })

      if (consumptionError) {
        console.error(`Error cargando consumo de ${year}:`, consumptionError)
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
            if (key.startsWith('l_') && key !== 'l_id' && row[key] !== null) {
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
      console.error(`Error al cargar datos de ${year}:`, err)
      setStateFunction([])
    }
  }

  const fetchAllYearsMonthlyData = async () => {
    await Promise.all([
      fetchYearMonthlyData('2023', setMonthlyData2023),
      fetchYearMonthlyData('2024', setMonthlyData2024),
      fetchYearMonthlyData('2025', setMonthlyData2025),
      fetchYearMonthlyData('2026', setMonthlyData2026)
    ])
  }

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

  const calculateMetrics = () => {
    if (!monthlyConsumption || monthlyConsumption.length === 0) {
      return { calderas: 0, comedores: 0, residencial: 0, calderasPrev: 0, comedoresPrev: 0, residencialPrev: 0 }
    }

    const calderasCols = [
      'mega_calefaccion_1', 'mega_calefaccion_2', 'mega_calefaccion_3', 'mega_calefaccion_4', 'mega_calefaccion_5',
      'calefaccion_1_bryan', 'calefaccion_2_aerco', 'caldera_3', 'wellness_general_calefaccion',
      'residencias_abc_calefaccion'
    ]
    
    const comedoresCols = [
      'comedor_centrales_tec_food', 'dona_tota', 'chilaquiles_tec', 'carls_junior',
      'centrales_local', 'davilas_grill_team', 'pizza_little_caesars', 'ciap_super_salads',
      'wellness_supersalads', 'nikkori', 'nectar_works', 'sr_latino', 'la_dia'
    ]
    
    const residenciasCols = [
      'residencias_1', 'residencias_2', 'residencias_3', 'residencias_4', 'residencias_5',
      'residencias_7', 'residencias_8', 'residencias_abc_calefaccion', 'residencias_abc_regaderas',
      'residencias_abc_locales_comida', 'estudiantes_11', 'estudiantes_12', 'estudiantes_13', 'estudiantes_15_y_10'
    ]

    const sumConsumption = (data, columns) => {
      return data.reduce((total, row) => {
        const sum = columns.reduce((colSum, col) => {
          const columnName = `l_${col}`
          const value = parseFloat(row[columnName]) || 0
          return colSum + value
        }, 0)
        return total + sum
      }, 0)
    }

    const last3 = monthlyConsumption.slice(-3)
    const prev3 = monthlyConsumption.slice(-6, -3)

    return {
      calderas: Math.round(sumConsumption(last3, calderasCols)),
      comedores: Math.round(sumConsumption(last3, comedoresCols)),
      residencial: Math.round(sumConsumption(last3, residenciasCols)),
      calderasPrev: Math.round(sumConsumption(prev3, calderasCols)),
      comedoresPrev: Math.round(sumConsumption(prev3, comedoresCols)),
      residencialPrev: Math.round(sumConsumption(prev3, residenciasCols))
    }
  }

  const metrics = calculateMetrics()
  
  const calderasTrend = metrics.calderasPrev > 0 
    ? ((metrics.calderas - metrics.calderasPrev) / metrics.calderasPrev * 100).toFixed(1)
    : 0
  const comedoresTrend = metrics.comedoresPrev > 0
    ? ((metrics.comedores - metrics.comedoresPrev) / metrics.comedoresPrev * 100).toFixed(1)
    : 0
  const residencialTrend = metrics.residencialPrev > 0
    ? ((metrics.residencial - metrics.residencialPrev) / metrics.residencialPrev * 100).toFixed(1)
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
                    Consumo Mensual de Gas
                  </h1>
                  <p className="text-muted-foreground">
                    Analisis detallado del consumo de gas mensual
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Ano:</label>
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">

                      <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Consumo Total de Gas</p>
                          <p className="text-2xl font-bold text-foreground mt-1">
                            {metrics.calderas.toLocaleString()} m3
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            {parseFloat(calderasTrend) > 0 ? (
                              <TrendingUpIcon className="h-4 w-4 text-destructive" />
                            ) : (
                              <TrendingDownIcon className="h-4 w-4 text-green-500" />
                            )}
                            <span className={`text-sm ${parseFloat(calderasTrend) > 0 ? 'text-destructive' : 'text-green-500'}`}>
                              {parseFloat(calderasTrend) > 0 ? '+' : ''}{calderasTrend}% vs 3 meses anteriores
                            </span>
                          </div>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
                          <FlameIcon className="h-6 w-6 text-orange-500" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Calderas y Calefaccion</p>
                          <p className="text-2xl font-bold text-foreground mt-1">
                            {metrics.calderas.toLocaleString()} m3
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            {parseFloat(calderasTrend) > 0 ? (
                              <TrendingUpIcon className="h-4 w-4 text-destructive" />
                            ) : (
                              <TrendingDownIcon className="h-4 w-4 text-green-500" />
                            )}
                            <span className={`text-sm ${parseFloat(calderasTrend) > 0 ? 'text-destructive' : 'text-green-500'}`}>
                              {parseFloat(calderasTrend) > 0 ? '+' : ''}{calderasTrend}% vs 3 meses anteriores
                            </span>
                          </div>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
                          <ThermometerIcon className="h-6 w-6 text-red-500" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Comedores y Restaurantes</p>
                          <p className="text-2xl font-bold text-foreground mt-1">
                            {metrics.comedores.toLocaleString()} m3
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            {parseFloat(comedoresTrend) > 0 ? (
                              <TrendingUpIcon className="h-4 w-4 text-destructive" />
                            ) : (
                              <TrendingDownIcon className="h-4 w-4 text-green-500" />
                            )}
                            <span className={`text-sm ${parseFloat(comedoresTrend) > 0 ? 'text-destructive' : 'text-green-500'}`}>
                              {parseFloat(comedoresTrend) > 0 ? '+' : ''}{comedoresTrend}% vs 3 meses anteriores
                            </span>
                          </div>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-green-500" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Residencias</p>
                          <p className="text-2xl font-bold text-foreground mt-1">
                            {metrics.residencial.toLocaleString()} m3
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            {parseFloat(residencialTrend) > 0 ? (
                              <TrendingUpIcon className="h-4 w-4 text-destructive" />
                            ) : (
                              <TrendingDownIcon className="h-4 w-4 text-green-500" />
                            )}
                            <span className={`text-sm ${parseFloat(residencialTrend) > 0 ? 'text-destructive' : 'text-green-500'}`}>
                              {parseFloat(residencialTrend) > 0 ? '+' : ''}{residencialTrend}% vs meses anteriores
                            </span>
                          </div>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-blue-500" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                  <CardContent className="p-6">
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-semibold text-foreground whitespace-nowrap">Punto de Medicion:</label>
                        <select
                          value={selectedPoint}
                          onChange={(e) => setSelectedPoint(e.target.value)}
                          className="w-full border border-muted rounded-lg px-3 py-2.5 text-sm bg-background hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                        >
                          <option value="todos">Todos los Puntos</option>
                          {consumptionPointsData.categories?.flatMap(c => c.points).map(point => (
                            <option key={point.id} value={point.id}>{point.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="h-8 w-px bg-gray-300"></div>

                      <div className="flex items-center gap-2">
                        <label className="text-sm font-semibold text-foreground whitespace-nowrap">Tipo de Grafico:</label>
                        <div className="flex gap-1 border rounded-lg p-1 bg-background">
                          <Button
                            variant={comparisonChartType === 'line' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setComparisonChartType('line')}
                            className="w-full border border-muted rounded-lg px-3 py-2.5 text-sm bg-background hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                          >
                            Lineas
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

                      <div className="h-8 w-px bg-gray-300"></div>

                      <div className="flex items-center gap-2">
                        <label className="text-sm font-semibold text-foreground whitespace-nowrap">Anos:</label>
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

                <MonthlyComparisonChart
                  title={selectedPoint === 'todos' ? 'Todos los Puntos (Suma Total)' : (consumptionPointsData.categories?.flatMap(c => c.points)?.find(p => p.id === selectedPoint)?.name || "Punto de Medicion")}
                  unit="m3"
                  chartType={comparisonChartType}
                  showControls={false}
                  multiYearData={multiYearData}
                />

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TableIcon className="h-5 w-5 text-orange-500" />
                        <h3 className="text-lg font-semibold">Datos Detallados por Categoria</h3>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 overflow-x-auto">
                      <div className="flex gap-2 border-b border-muted pb-2">
                        {consumptionPointsData.categories?.map(category => (
                          <button
                            key={category.id}
                            onClick={() => setActiveTab(category.id)}
                            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                              activeTab === category.id
                                ? 'bg-orange-500 text-white shadow-sm'
                                : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                            }`}
                          >
                            {category.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-muted">
                            <th className="text-left py-3 px-4 font-semibold">Punto de Medicion</th>
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
                            ?.find(c => c.id === activeTab)
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