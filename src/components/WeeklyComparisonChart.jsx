import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader } from "./ui/card"
import { Button } from "./ui/button"
import { Line, Bar } from 'react-chartjs-2'
import {
  TrendingUpIcon,
  TrendingDownIcon,
  MinusIcon,
  BarChart3Icon,
  LineChartIcon
} from 'lucide-react'

/**
 * Gráfica de comparación semanal con múltiples años
 * Muestra comparativas: vs semana anterior, vs misma semana año anterior, vs semana anterior año anterior
 */
export default function WeeklyComparisonChart({
  title = "Comparación Semanal",
  currentYearData = [],
  previousYearData = [],
  currentYear = "2025",
  previousYear = "2024",
  unit = "m³",
  chartType: externalChartType = null,
  comparisonMode: externalComparisonMode = null,
  showControls = true,
  multiYearData = null, // Nueva prop: array de { year: '2023', data: [...] }
  multiYearDataRiego = null, // Datos de pozos de riego
  multiYearDataServicios = null, // Datos de pozos de servicios
  total2023 = 0 // Total del año 2023
}) {

  const [internalChartType, setInternalChartType] = useState('line') // 'line' o 'bar'
  const [internalComparisonMode, setInternalComparisonMode] = useState('both') // 'current', 'previous', 'both'
  const [wellFilter, setWellFilter] = useState('total') // 'total', 'riego', 'servicios'
  const [selectedYears, setSelectedYears] = useState(['2025', '2026']) // Últimos 2 años por default
  
  // Usar props externos si se proporcionan, sino usar estados internos
  const chartType = externalChartType !== null ? externalChartType : internalChartType
  const comparisonMode = externalComparisonMode !== null ? externalComparisonMode : internalComparisonMode
  
  // Determinar qué datos usar según el filtro
  const getFilteredData = () => {
    switch (wellFilter) {
      case 'riego':
        return multiYearDataRiego
      case 'servicios':
        return multiYearDataServicios
      default:
        return multiYearData
    }
  }
  
  const activeMultiYearData = getFilteredData()
  
  // Filtrar datos por años seleccionados
  const filteredMultiYearData = activeMultiYearData !== null && Array.isArray(activeMultiYearData)
    ? activeMultiYearData.filter(yearItem => selectedYears.includes(yearItem.year))
    : []
  
  // Determinar si usar modo multi-año
  const useMultiYear = filteredMultiYearData.length > 0

  // Derivar currentYear y previousYear dinámicamente del multiYearData
  const effectiveCurrentYear = useMultiYear && filteredMultiYearData.length > 0
    ? filteredMultiYearData[filteredMultiYearData.length - 1].year
    : currentYear
  const effectivePreviousYear = useMultiYear && filteredMultiYearData.length > 1
    ? filteredMultiYearData[filteredMultiYearData.length - 2].year
    : previousYear
  
  // Función para alternar selección de año
  const toggleYear = (year) => {
    setSelectedYears(prev => {
      if (prev.includes(year)) {
        // No permitir desactivar todos los años
        if (prev.length === 1) return prev
        return prev.filter(y => y !== year)
      } else {
        return [...prev, year].sort()
      }
    })
  }

  // Procesar datos para obtener consumo semanal (siempre 52 semanas)
  const processWeeklyData = (weeklyData) => {
    if (!weeklyData || weeklyData.length === 0) return []

    // Crear template de 52 semanas y mapear datos existentes por número de semana
    const allWeeks = Array.from({ length: 52 }, (_, i) => ({ week: i + 1 }))
    const dataByWeek = Object.fromEntries(weeklyData.map(d => [d.week, d]))
    const normalized = allWeeks.map(w => dataByWeek[w.week] || { ...w, consumption: 0, reading: 0 })

    return normalized.map((week, index) => {
      // Usar el campo consumption directamente si existe, sino calcular
      const consumption = week.consumption !== undefined && week.consumption !== null
        ? week.consumption
        : (index > 0 ? Math.max(0, (week.reading || 0) - (normalized[index - 1].reading || 0)) : 0)
      
      const lastWeekConsumption = index > 0 
        ? (normalized[index - 1].consumption !== undefined && normalized[index - 1].consumption !== null
            ? normalized[index - 1].consumption
            : 0)
        : 0
      
      const vsLastWeekPercent = lastWeekConsumption > 0 
        ? ((consumption - lastWeekConsumption) / lastWeekConsumption * 100)
        : 0
      
      return {
        week: week.week,
        consumption: consumption,
        reading: week.reading || consumption,
        vsLastWeek: consumption - lastWeekConsumption,
        vsLastWeekPercent
      }
    })
  }

  // Procesar datos para modo multi-año
  const processedMultiYear = useMemo(() => {
    if (!useMultiYear) return []
    return filteredMultiYearData.map(yearItem => ({
      year: yearItem.year,
      processed: processWeeklyData(yearItem.data)
    }))
  }, [filteredMultiYearData, useMultiYear])

  const processedCurrent = useMemo(() => {
    if (useMultiYear && processedMultiYear.length > 0) {
      return processedMultiYear[processedMultiYear.length - 1].processed
    }
    return processWeeklyData(currentYearData)
  }, [currentYearData, useMultiYear, processedMultiYear])

  const processedPrevious = useMemo(() => {
    if (useMultiYear && processedMultiYear.length > 1) {
      return processedMultiYear[processedMultiYear.length - 2].processed
    }
    return processWeeklyData(previousYearData)
  }, [previousYearData, useMultiYear, processedMultiYear])

  // Calcular estadísticas comparativas
  const comparisonStats = useMemo(() => {
    if (processedCurrent.length === 0) {
      return {
        currentTotal: 0,
        previousTotal: 0,
        yearOverYear: 0,
        avgWeeklyCurrent: 0,
        avgWeeklyPrevious: 0,
        currentWeekVsLast: 0,
        sameWeekLastYear: 0,
        total2023: 0
      }
    }

    const currentTotal = processedCurrent.reduce((sum, w) => sum + w.consumption, 0)
    const previousTotal = processedPrevious.reduce((sum, w) => sum + w.consumption, 0)
    const yearOverYear = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal * 100) : 0
    
    const avgWeeklyCurrent = currentTotal / processedCurrent.length
    const avgWeeklyPrevious = processedPrevious.length > 0 
      ? previousTotal / processedPrevious.length 
      : 0

    // Comparación semana actual vs semana anterior
    const lastWeek = processedCurrent[processedCurrent.length - 1]
    const currentWeekVsLast = lastWeek ? lastWeek.vsLastWeekPercent : 0

    // Comparación semana actual vs misma semana año pasado
    const currentWeekNum = lastWeek?.week || 0
    const sameWeekLastYearData = processedPrevious.find(w => w.week === currentWeekNum)
    const sameWeekLastYear = sameWeekLastYearData && lastWeek
      ? ((lastWeek.consumption - sameWeekLastYearData.consumption) / sameWeekLastYearData.consumption * 100)
      : 0

    // Calcular total de 2023 desde multiYearData si está disponible
    let calculated2023Total = total2023
    if (useMultiYear && processedMultiYear.length > 0) {
      const year2023Data = processedMultiYear.find(y => y.year === '2023')
      if (year2023Data) {
        calculated2023Total = year2023Data.processed.reduce((sum, w) => sum + w.consumption, 0)
      }
    }

    return {
      currentTotal,
      previousTotal,
      yearOverYear,
      avgWeeklyCurrent,
      avgWeeklyPrevious,
      currentWeekVsLast,
      sameWeekLastYear,
      lastWeekNumber: currentWeekNum,
      total2023: calculated2023Total
    }
  }, [processedCurrent, processedPrevious, total2023, useMultiYear, processedMultiYear])

  // Configuración de Chart.js
  const chartData = useMemo(() => {
    const datasets = []
    const colors = [
      { border: 'rgb(59, 130, 246)', bg: 'rgba(59, 130, 246, 0.6)', bgFill: 'rgba(59, 130, 246, 0.1)' }, // Azul
      { border: 'rgb(34, 197, 94)', bg: 'rgba(34, 197, 94, 0.6)', bgFill: 'rgba(34, 197, 94, 0.1)' }, // Verde
      { border: 'rgb(245, 158, 11)', bg: 'rgba(245, 158, 11, 0.6)', bgFill: 'rgba(245, 158, 11, 0.1)' }, // Naranja
      { border: 'rgb(239, 68, 68)', bg: 'rgba(239, 68, 68, 0.6)', bgFill: 'rgba(239, 68, 68, 0.1)' }, // Rojo
      { border: 'rgb(139, 92, 246)', bg: 'rgba(139, 92, 246, 0.6)', bgFill: 'rgba(139, 92, 246, 0.1)' } // Púrpura
    ]

    if (useMultiYear && processedMultiYear.length > 0) {
      // Modo multi-año: crear dataset para cada año
      processedMultiYear.forEach((yearItem, index) => {
        const color = colors[index % colors.length]
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
          pointRadius: isLastYear ? 3 : 2,
          pointHoverRadius: isLastYear ? 6 : 5,
          pointBackgroundColor: isLastYear ? yearItem.processed.map(d => {
            if (d.vsLastWeekPercent > 5) return 'rgb(239, 68, 68)'
            if (d.vsLastWeekPercent < -5) return 'rgb(34, 197, 94)'
            return color.border
          }) : color.border
        })
      })
      
      const labels = processedMultiYear[processedMultiYear.length - 1].processed.map(d => `Sem ${d.week}`)
      return { labels, datasets }
    }

    // Modo original de 2 años
    const labels = Array.from({ length: 52 }, (_, i) => `Sem ${i + 1}`)

    if (comparisonMode === 'current' || comparisonMode === 'both') {
      datasets.push({
        label: `${effectiveCurrentYear}`,
        data: processedCurrent.map(d => d.consumption),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: chartType === 'bar' ? 'rgba(59, 130, 246, 0.6)' : 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: chartType === 'line',
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: processedCurrent.map(d => {
          if (d.vsLastWeekPercent > 5) return 'rgb(239, 68, 68)'
          if (d.vsLastWeekPercent < -5) return 'rgb(34, 197, 94)'
          return 'rgb(59, 130, 246)'
        })
      })
    }

    if ((comparisonMode === 'previous' || comparisonMode === 'both') && processedPrevious.length > 0) {
      datasets.push({
        label: `${effectivePreviousYear}`,
        data: processedPrevious.map(d => d.consumption),
        borderColor: 'rgb(156, 163, 175)',
        backgroundColor: chartType === 'bar' ? 'rgba(156, 163, 175, 0.4)' : 'rgba(156, 163, 175, 0.05)',
        borderWidth: 2,
        borderDash: [5, 5],
        fill: chartType === 'line',
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 5
      })
    }

    return { labels, datasets }
  }, [processedCurrent, processedPrevious, effectiveCurrentYear, effectivePreviousYear, chartType, comparisonMode, useMultiYear, processedMultiYear])

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
          label: function(context) {
            const dataIndex = context.dataIndex
            let label = `${context.dataset.label}: ${context.parsed.y.toLocaleString()} ${unit}`
            
            // Agregar información de cambio vs semana anterior para cada año
            if (useMultiYear && processedMultiYear[context.datasetIndex]) {
              const yearData = processedMultiYear[context.datasetIndex].processed[dataIndex]
              if (yearData && yearData.vsLastWeekPercent !== 0) {
                const change = yearData.vsLastWeekPercent
                label += ` (${change > 0 ? '+' : ''}${change.toFixed(1)}% vs sem anterior)`
              }
            } else if (context.datasetIndex === 0 && processedCurrent[dataIndex]) {
              const change = processedCurrent[dataIndex].vsLastWeekPercent
              if (change !== 0) {
                label += ` (${change > 0 ? '+' : ''}${change.toFixed(1)}% vs sem anterior)`
              }
            }
            
            return label
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
          maxRotation: 45,
          minRotation: 45,
          font: {
            size: 9
          },
          callback: function(value, index) {
            return index % 2 === 0 ? this.getLabelForValue(value) : ''
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
            Análisis comparativo de consumo semanal
          </p>
        </div>

        {/* Controles - solo mostrar si showControls es true */}
        {showControls && (
          <div className="flex items-center gap-2 flex-wrap mt-4">
            {/* Selector de filtro de pozos */}
            <select
              value={wellFilter}
              onChange={(e) => setWellFilter(e.target.value)}
              className="px-3 py-2 border border-muted rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary h-8"
            >
              <option value="total">Todos los Pozos</option>
              <option value="riego">Pozos de Riego</option>
              <option value="servicios">Pozos de Servicios</option>
            </select>

            {/* Selector de tipo de gráfico */}
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

            {/* Selector de años */}
            <div className="flex gap-1 border rounded-lg p-1">
              <Button
                variant={selectedYears.includes('2023') ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleYear('2023')}
                className="h-8"
              >
                2023
              </Button>
              <Button
                variant={selectedYears.includes('2024') ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleYear('2024')}
                className="h-8"
              >
                2024
              </Button>
              <Button
                variant={selectedYears.includes('2025') ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleYear('2025')}
                className="h-8"
              >
                2025
              </Button>
              <Button
                variant={selectedYears.includes('2026') ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleYear('2026')}
                className="h-8"
              >
                2026
              </Button>
            </div>
          </div>
        )}

        {/* Estadísticas de comparación */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-4">
          {/* Totales dinámicos por año */}
          {useMultiYear && processedMultiYear.length > 0 ? (
            processedMultiYear.slice().reverse().map((yearItem, index) => {
              const yearTotal = yearItem.processed.reduce((sum, w) => sum + w.consumption, 0)
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

          {/* Semana actual vs anterior */}


        </div>

      </CardHeader>

      <CardContent>
        <div className="h-[450px] w-full">
          <ChartComponent data={chartData} options={chartOptions} />
        </div>

        {/* Leyenda de colores de puntos */}
        {chartType === 'line' && comparisonMode !== 'previous' && (
          <div className="mt-4 p-3 bg-muted/30 rounded-lg">
            <p className="text-xs font-medium mb-2">Leyenda de puntos (cambio vs semana anterior):</p>
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>Aumento &gt;5%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Estable ({'>'}=0 y {'<'}=5%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Disminución &lt;0% (verde)</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
