import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader } from "./ui/card"
import { Button } from "./ui/button"
import { getColorForYear } from '../utils/chartColors'
import { getPreviousYearData, construirEtiquetaYoY } from '../utils/yearOverYear'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
  Filler,
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'
import {
  TrendingUpIcon,
  TrendingDownIcon,
  MinusIcon,
  BarChart3Icon,
  LineChartIcon
} from 'lucide-react'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  ChartLegend,
  Filler
)

/**
 * Gráfica de comparación mensual con múltiples años
 * Adaptado de WeeklyComparisonChart para datos mensuales (12 meses)
 * 
 * multiYearData format: [{ year: '2025', data: [{ month: 1, monthName: 'Enero', consumption: N, reading: N }] }]
 */
export default function MonthlyComparisonChart({
  title = "Comparación Mensual",
  unit = "m³",
  chartType: externalChartType = null,
  showControls = true,
  selectedYearsToShow = null,
  multiYearData = null,
}) {
  const [internalChartType, setInternalChartType] = useState('line')
  const [selectedYears, setSelectedYears] = useState(['2022','2023', '2024', '2025', '2026'])

  const chartType = externalChartType !== null ? externalChartType : internalChartType

  // Filtrar datos por años seleccionados
  const filteredMultiYearData = useMemo(() => {
    if (multiYearData === null || !Array.isArray(multiYearData)) return []
    const activeYears = Array.isArray(selectedYearsToShow) && selectedYearsToShow.length > 0
      ? selectedYearsToShow
      : selectedYears
    return multiYearData.filter(yearItem => activeYears.includes(yearItem.year))
  }, [multiYearData, selectedYears, selectedYearsToShow])

  const useMultiYear = filteredMultiYearData.length > 0

  const effectiveCurrentYear = useMultiYear && filteredMultiYearData.length > 0
    ? filteredMultiYearData[filteredMultiYearData.length - 1].year
    : '2026'
  const effectivePreviousYear = useMultiYear && filteredMultiYearData.length > 1
    ? filteredMultiYearData[filteredMultiYearData.length - 2].year
    : '2025'

  const toggleYear = (year) => {
    setSelectedYears(prev => {
      if (prev.includes(year)) {
        if (prev.length === 1) return prev
        return prev.filter(y => y !== year)
      } else {
        return [...prev, year].sort()
      }
    })
  }

  // Procesar datos mensuales
  const processMonthlyData = (monthlyData) => {
    if (!monthlyData || monthlyData.length === 0) return []

    const allMonths = [
      {month:1,monthName:'Enero'},{month:2,monthName:'Febrero'},{month:3,monthName:'Marzo'},
      {month:4,monthName:'Abril'},{month:5,monthName:'Mayo'},{month:6,monthName:'Junio'},
      {month:7,monthName:'Julio'},{month:8,monthName:'Agosto'},{month:9,monthName:'Septiembre'},
      {month:10,monthName:'Octubre'},{month:11,monthName:'Noviembre'},{month:12,monthName:'Diciembre'}
    ]
    // Map incoming data by month number, fill gaps with 0
    const dataByMonth = Object.fromEntries(monthlyData.map(d => [d.month, d]))
    const normalized = allMonths.map(m => dataByMonth[m.month] || { ...m, consumption: 0, reading: 0 })

    return normalized.map((item, index) => {
      const consumption = item.consumption !== undefined && item.consumption !== null
        ? item.consumption
        : (index > 0 ? Math.max(0, (item.reading || 0) - (normalized[index - 1].reading || 0)) : 0)

      const lastMonthConsumption = index > 0
        ? (normalized[index - 1].consumption !== undefined && normalized[index - 1].consumption !== null
            ? normalized[index - 1].consumption
            : 0)
        : 0

      const vsLastMonthPercent = lastMonthConsumption > 0
        ? ((consumption - lastMonthConsumption) / lastMonthConsumption * 100)
        : 0

      return {
        month: item.month,
        monthName: item.monthName || '',
        consumption,
        reading: item.reading || consumption,
        vsLastMonth: consumption - lastMonthConsumption,
        vsLastMonthPercent
      }
    })
  }

  const processedMultiYear = useMemo(() => {
    if (!useMultiYear) return []
    return filteredMultiYearData.map(yearItem => ({
      year: yearItem.year,
      processed: processMonthlyData(yearItem.data)
    }))
  }, [filteredMultiYearData, useMultiYear])

  const processedCurrent = useMemo(() => {
    if (useMultiYear && processedMultiYear.length > 0) {
      return processedMultiYear[processedMultiYear.length - 1].processed
    }
    return []
  }, [useMultiYear, processedMultiYear])

  const processedPrevious = useMemo(() => {
    if (useMultiYear && processedMultiYear.length > 1) {
      return processedMultiYear[processedMultiYear.length - 2].processed
    }
    return []
  }, [useMultiYear, processedMultiYear])

  // Lookup vs mismo mes del año anterior: activo solo cuando se muestra exactamente 1 año
  const yoyMonthLookup = useMemo(() => {
    if (!useMultiYear || filteredMultiYearData.length !== 1) return null
    const yearStr = filteredMultiYearData[0].year
    const prevData = getPreviousYearData(multiYearData, yearStr)
    if (!prevData) return null
    const mapByMonth = {}
    prevData.forEach(d => {
      if (d.month === undefined || d.month === null) return
      const val = parseFloat(d.consumption)
      mapByMonth[d.month] = Number.isFinite(val) ? val : null
    })
    return { prevYear: String(parseInt(yearStr, 10) - 1), mapByMonth }
  }, [useMultiYear, filteredMultiYearData, multiYearData])

  // Estadísticas comparativas
  const comparisonStats = useMemo(() => {
    if (processedCurrent.length === 0) {
      return {
        currentTotal: 0,
        previousTotal: 0,
        yearOverYear: 0,
        avgMonthlyCurrent: 0,
        avgMonthlyPrevious: 0,
        currentMonthVsLast: 0,
        sameMonthLastYear: 0
      }
    }

    // Determinar el último mes con datos reales en el año actual
    const monthsWithData = processedCurrent.filter(m => m.consumption > 0)
    const maxMonthWithData = monthsWithData.length > 0
      ? Math.max(...monthsWithData.map(m => m.month))
      : 12

    // Filtrar ambos años a los mismos meses transcurridos
    const currentFiltered = processedCurrent.filter(m => m.month <= maxMonthWithData)
    const previousFiltered = processedPrevious.filter(m => m.month <= maxMonthWithData)

    const currentTotal = currentFiltered.reduce((sum, m) => sum + m.consumption, 0)
    const previousTotal = previousFiltered.reduce((sum, m) => sum + m.consumption, 0)
    const yearOverYear = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal * 100) : 0

    const avgMonthlyCurrent = currentFiltered.length > 0 ? currentTotal / currentFiltered.length : 0
    const avgMonthlyPrevious = previousFiltered.length > 0
      ? previousTotal / previousFiltered.length
      : 0

    const lastMonth = processedCurrent[processedCurrent.length - 1]
    const currentMonthVsLast = lastMonth ? lastMonth.vsLastMonthPercent : 0

    const currentMonthNum = lastMonth?.month || 0
    const sameMonthLastYearData = processedPrevious.find(m => m.month === currentMonthNum)
    const sameMonthLastYear = sameMonthLastYearData && lastMonth
      ? ((lastMonth.consumption - sameMonthLastYearData.consumption) / sameMonthLastYearData.consumption * 100)
      : 0

    return {
      currentTotal,
      previousTotal,
      yearOverYear,
      avgMonthlyCurrent,
      avgMonthlyPrevious,
      currentMonthVsLast,
      sameMonthLastYear,
      lastMonthNumber: currentMonthNum
    }
  }, [processedCurrent, processedPrevious])

  // Configuración de Chart.js
  const chartData = useMemo(() => {
    const datasets = []

    if (useMultiYear && processedMultiYear.length > 0) {
      processedMultiYear.forEach((yearItem, index) => {
        const color = getColorForYear(yearItem.year)
        const isLastYear = index === processedMultiYear.length - 1

        datasets.push({
          label: yearItem.year,
          data: yearItem.processed.map(d => d.consumption),
          borderColor: color.border,
          backgroundColor: chartType === 'bar' ? color.bg : color.bgFill,
          borderWidth: 2,
          borderDash: isLastYear ? [] : [5, 5],
          fill: chartType === 'line',
          tension: 0.4,
          pointRadius: isLastYear ? 4 : 2,
          pointHoverRadius: isLastYear ? 7 : 5,
          pointBackgroundColor: isLastYear ? yearItem.processed.map(d => {
            if (d.vsLastMonthPercent > 5) return 'rgb(239, 68, 68)'
            if (d.vsLastMonthPercent < -5) return 'rgb(34, 197, 94)'
            return color.border
          }) : color.border
        })
      })

      // Usar nombres de mes del último año como labels
      const lastYearProcessed = processedMultiYear[processedMultiYear.length - 1].processed
      const labels = lastYearProcessed.map(d => d.monthName)
      return { labels, datasets }
    }

    return { labels: [], datasets: [] }
  }, [processedMultiYear, chartType, useMultiYear])

  const chartOptions = {
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
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            let label = `${context.dataset.label}: ${context.parsed.y.toLocaleString()} ${unit}`
            if (useMultiYear && processedMultiYear[context.datasetIndex]) {
              const monthData = processedMultiYear[context.datasetIndex].processed[context.dataIndex]
              if (monthData && monthData.vsLastMonthPercent !== 0) {
                const change = monthData.vsLastMonthPercent
                label += ` (${change > 0 ? '+' : ''}${change.toFixed(1)}% vs mes anterior)`
              }
            }
            return label
          },
          afterLabel: function (context) {
            if (!yoyMonthLookup || context.parsed.y <= 0 || !processedMultiYear[context.datasetIndex]) return null
            const monthData = processedMultiYear[context.datasetIndex].processed[context.dataIndex]
            if (!monthData) return null
            return construirEtiquetaYoY({
              valorActual: context.parsed.y,
              valorAnterior: yoyMonthLookup.mapByMonth[monthData.month],
              etiquetaPeriodo: `${monthData.monthName} ${yoyMonthLookup.prevYear}`,
              unidad: unit
            }) || null
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          maxRotation: 0,
          minRotation: 0,
          font: {
            size: 11
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          callback: function(value) {
            return value.toLocaleString() + ' ' + unit
          }
        }
      }
    }
  }

  const ChartComponent = chartType === 'bar' ? Bar : Line

  return (
    <Card className="w-full">
      <CardHeader>
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">
            Análisis comparativo de consumo mensual
          </p>
        </div>

        {showControls && (
          <div className="flex items-center gap-2 flex-wrap mt-4">
            <div className="flex gap-1 border rounded-lg p-1">
              <Button
                variant={chartType === 'line' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setInternalChartType('line')}
                className="h-8"
              >
                <LineChartIcon className="h-4 w-4" />
              </Button>
              <Button
                variant={chartType === 'bar' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setInternalChartType('bar')}
                className="h-8"
              >
                <BarChart3Icon className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex gap-1 border rounded-lg p-1">
              {['2023', '2024', '2025', '2026'].map(year => (
                <Button
                  key={year}
                  variant={selectedYears.includes(year) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleYear(year)}
                  className="h-8"
                >
                  {year}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Estadísticas de comparación */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-4">
          {useMultiYear && processedMultiYear.length > 0 ? (
            processedMultiYear.slice().reverse().map((yearItem, index) => {
              const yearTotal = yearItem.processed.reduce((sum, m) => sum + m.consumption, 0)
              const isLatest = index === 0
              return (
                <div key={yearItem.year} className={`p-3 rounded-lg border ${
                  isLatest
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200'
                }`}>
                  <p className="text-xs text-muted-foreground">Total {yearItem.year}</p>
                  <p className={`text-lg font-bold ${isLatest ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {yearTotal.toLocaleString()} {unit}
                  </p>
                </div>
              )
            })
          ) : (
            <>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200">
                <p className="text-xs text-muted-foreground">Total {effectiveCurrentYear}</p>
                <p className="text-lg font-bold text-foreground">
                  {comparisonStats.currentTotal.toLocaleString()} {unit}
                </p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200">
                <p className="text-xs text-muted-foreground">Total {effectivePreviousYear}</p>
                <p className="text-lg font-bold text-muted-foreground">
                  {comparisonStats.previousTotal.toLocaleString()} {unit}
                </p>
              </div>
            </>
          )}

          {/* Cambio año sobre año */}
          <div className={`p-3 rounded-lg border ${
            comparisonStats.yearOverYear > 0
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200'
              : comparisonStats.yearOverYear < 0
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200'
              : 'bg-gray-50 dark:bg-gray-800 border-gray-200'
          }`}>
            <p className="text-xs text-muted-foreground">Cambio Anual</p>
            <div className="flex items-center gap-1">
              {comparisonStats.yearOverYear > 0 ? (
                <TrendingUpIcon className="h-4 w-4 text-red-600" />
              ) : comparisonStats.yearOverYear < 0 ? (
                <TrendingDownIcon className="h-4 w-4 text-green-600" />
              ) : (
                <MinusIcon className="h-4 w-4 text-gray-600" />
              )}
              <p className={`text-lg font-bold ${
                comparisonStats.yearOverYear > 0 ? 'text-red-600' :
                comparisonStats.yearOverYear < 0 ? 'text-green-600' :
                'text-gray-600'
              }`}>
                {comparisonStats.yearOverYear > 0 ? '+' : ''}{comparisonStats.yearOverYear.toFixed(1)}%
              </p>
            </div>
          </div>



            {/*    
            
             <div className={`p-3 rounded-lg border ${
            comparisonStats.currentMonthVsLast > 0
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200'
              : comparisonStats.currentMonthVsLast < 0
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200'
              : 'bg-gray-50 dark:bg-gray-800 border-gray-200'
          }`}>
            <p className="text-xs text-muted-foreground">vs Mes Anterior</p>
            <div className="flex items-center gap-1">
              {comparisonStats.currentMonthVsLast > 0 ? (
                <TrendingUpIcon className="h-4 w-4 text-red-600" />
              ) : comparisonStats.currentMonthVsLast < 0 ? (
                <TrendingDownIcon className="h-4 w-4 text-green-600" />
              ) : (
                <MinusIcon className="h-4 w-4 text-gray-600" />
              )}
              <p className={`text-lg font-bold ${
                comparisonStats.currentMonthVsLast > 0 ? 'text-red-600' :
                comparisonStats.currentMonthVsLast < 0 ? 'text-green-600' :
                'text-gray-600'
              }`}>
                {comparisonStats.currentMonthVsLast > 0 ? '+' : ''}{comparisonStats.currentMonthVsLast.toFixed(1)}%
              </p>
            </div>
          </div>
            
            
            */}
          {/* Mes actual vs anterior */}
         
        </div>

      </CardHeader>

      <CardContent>
        <div className="h-[450px] w-full">
          <ChartComponent data={chartData} options={chartOptions} />
        </div>

        {chartType === 'line' && (
          <div className="mt-4 p-3 bg-muted/30 rounded-lg">
            <p className="text-xs font-medium mb-2">Leyenda de puntos (cambio vs mes anterior):</p>
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>Aumento &gt;5%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Estable ({'≥'}0 y {'<'}5%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Disminución &lt;0%</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
