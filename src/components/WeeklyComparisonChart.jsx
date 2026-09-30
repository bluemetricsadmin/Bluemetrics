import { formatMX } from '../utils/formatMX'
import { useMemo, useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader } from "./ui/card"
import { Button } from "./ui/button"
import { Line, Bar } from 'react-chartjs-2'
import { supabase } from '../supabaseClient'
import { getColorForYear } from '../utils/chartColors'
import { getMonthForWeek } from '../utils/tableHelpers'
import { getPreviousYearData, construirEtiquetaYoY } from '../utils/yearOverYear'
import {
  TrendingUpIcon,
  TrendingDownIcon,
  MinusIcon,
  BarChart3Icon,
  LineChartIcon,
  MessageSquareIcon,
  MessageSquareOffIcon,
  InfoIcon,
  XIcon,
  Loader2Icon
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
  selectedYearsToShow = null,
  showControls = true,
  multiYearData = null, // Nueva prop: array de { year: '2023', data: [...] }
  multiYearDataRiego = null, // Datos de pozos de riego
  multiYearDataServicios = null, // Datos de pozos de servicios
  total2023 = 0, // Total del año 2023
  sourceType = "agua" // Tipo de recurso para los comentarios semanales ('agua' | 'gas')
}) {

  const [internalChartType, setInternalChartType] = useState('line') // 'line' o 'bar'
  const [internalComparisonMode, setInternalComparisonMode] = useState('both') // 'current', 'previous', 'both'
  const [wellFilter, setWellFilter] = useState('total') // 'total', 'riego', 'servicios'
  const [selectedYears, setSelectedYears] = useState(['2026']) // Últimos 2 años por default

  // Comentarios semanales por recurso y año:
  // { [year]: { [week_number]: { comment, author, authorName, updated_at } } }
  const [weekComments, setWeekComments] = useState({})
  const [loadingComments, setLoadingComments] = useState(false)
  const [selectedWeek, setSelectedWeek] = useState(null)
  const [selectedYear, setSelectedYear] = useState(null)
  const [showComments, setShowComments] = useState(true)

  // Precarga de todos los comentarios del recurso activo (filtrado local por año/semana)
  useEffect(() => {
    let cancelled = false

    const fetchComments = async () => {
      try {
        setLoadingComments(true)
        const { data, error } = await supabase
          .from('weekly_comments')
          .select('week_number, comment, year, author, updated_at, profiles(full_name)')
          .eq('source_type', sourceType)

        if (error) {
          console.error('❌ Error cargando comentarios semanales para la gráfica:', error)
          if (!cancelled) setWeekComments({})
          return
        }

        const map = {}
        data?.forEach(c => {
          const yearKey = String(c.year)
          if (!map[yearKey]) map[yearKey] = {}
          map[yearKey][c.week_number] = {
            comment: c.comment,
            author: c.author,
            authorName: c.profiles?.full_name || null,
            updated_at: c.updated_at
          }
        })

        if (!cancelled) setWeekComments(map)
      } catch (err) {
        console.error('❌ Error al cargar comentarios semanales para la gráfica:', err)
        if (!cancelled) setWeekComments({})
      } finally {
        if (!cancelled) setLoadingComments(false)
      }
    }

    fetchComments()
    setSelectedWeek(null)
    setSelectedYear(null)

    return () => { cancelled = true }
  }, [sourceType])
  
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

  const activeYears = Array.isArray(selectedYearsToShow) && selectedYearsToShow.length > 0
    ? selectedYearsToShow
    : selectedYears
  
  // Filtrar datos por años seleccionados
  const filteredMultiYearData = activeMultiYearData !== null && Array.isArray(activeMultiYearData)
    ? activeMultiYearData.filter(yearItem => activeYears.includes(yearItem.year))
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

  // El Cambio Anual solo tiene sentido al comparar 2 o más años.
  // En modo multi-año se necesita al menos un año previo; en modo de 2 años siempre existe.
  const canCompareYearOverYear = useMultiYear
    ? filteredMultiYearData.length > 1
    : true
  
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

  // Lookup vs misma semana del año anterior: activo solo cuando se muestra exactamente 1 año
  const buildYoyWeekLookup = () => {
    if (!useMultiYear || filteredMultiYearData.length !== 1) return null
    const yearStr = filteredMultiYearData[0].year
    const prevData = getPreviousYearData(activeMultiYearData, yearStr)
    if (!prevData) return null
    const mapByWeek = {}
    prevData.forEach(d => {
      if (d.week === undefined || d.week === null) return
      const val = parseFloat(d.consumption)
      mapByWeek[d.week] = Number.isFinite(val) ? val : null
    })
    return { prevYear: String(parseInt(yearStr, 10) - 1), mapByWeek }
  }
  const yoyWeekLookup = buildYoyWeekLookup()

  // Mapeo datasetIndex -> año, en el mismo orden en que se construyen los datasets
  const datasetYears = useMemo(() => {
    if (useMultiYear && processedMultiYear.length > 0) {
      return processedMultiYear.map(yearItem => String(yearItem.year))
    }
    const years = []
    if (comparisonMode === 'current' || comparisonMode === 'both') {
      years.push(String(effectiveCurrentYear))
    }
    if ((comparisonMode === 'previous' || comparisonMode === 'both') && processedPrevious.length > 0) {
      years.push(String(effectivePreviousYear))
    }
    return years
  }, [useMultiYear, processedMultiYear, comparisonMode, effectiveCurrentYear, effectivePreviousYear, processedPrevious])

  // Helpers de comentarios semanales
  const hasComment = useCallback(
    (year, week) => showComments && Boolean(weekComments[String(year)]?.[week]),
    [weekComments, showComments]
  )

  // Comentarios de la semana seleccionada para todos los años visibles (hasta 4)
  const selectedWeekComments = useMemo(() => {
    if (selectedWeek == null) return []
    return datasetYears
      .map(year => {
        const entry = weekComments[String(year)]?.[selectedWeek]
        if (!entry) return null
        return {
          year: String(year),
          comment: entry.comment,
          authorName: entry.authorName,
          updated_at: entry.updated_at,
          color: getColorForYear(year).border,
          isSelected: String(selectedYear) === String(year)
        }
      })
      .filter(Boolean)
      .reverse()
  }, [selectedWeek, selectedYear, datasetYears, weekComments])

  const clearSelectedWeek = () => {
    setSelectedWeek(null)
    setSelectedYear(null)
  }

  // Manejar clic sobre un punto/barra de la gráfica para seleccionar su semana y año
  const handleChartClick = (event, _elements, chart) => {
    if (!showComments) return
    const hits = chart
      ? chart.getElementsAtEventForMode(event, 'nearest', { intersect: true }, true)
      : []
    if (!hits || hits.length === 0) return
    const { index, datasetIndex } = hits[0]
    const year = datasetYears[datasetIndex]
    if (year === undefined || year === null) return
    setSelectedWeek(index + 1)
    setSelectedYear(String(year))
  }

  // Cambiar el cursor al pasar sobre un punto interactivo
  const handleChartHover = (event, elements, chart) => {
    const target = event?.native?.target || event?.target
    if (!target?.style) return
    if (!showComments) {
      target.style.cursor = 'default'
      return
    }
    const hits = chart
      ? chart.getElementsAtEventForMode(event, 'nearest', { intersect: true }, true)
      : elements
    target.style.cursor = hits && hits.length > 0 ? 'pointer' : 'default'
  }

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

    // Determinar la última semana con datos reales en el año actual
    const weeksWithData = processedCurrent.filter(w => w.consumption > 0)
    const maxWeekWithData = weeksWithData.length > 0
      ? Math.max(...weeksWithData.map(w => w.week))
      : 52

    // Filtrar ambos años a las mismas semanas transcurridas
    const currentFiltered = processedCurrent.filter(w => w.week <= maxWeekWithData)
    const previousFiltered = processedPrevious.filter(w => w.week <= maxWeekWithData)

    const currentTotal = currentFiltered.reduce((sum, w) => sum + w.consumption, 0)
    const previousTotal = previousFiltered.reduce((sum, w) => sum + w.consumption, 0)
    const yearOverYear = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal * 100) : 0

    const avgWeeklyCurrent = currentFiltered.length > 0 ? currentTotal / currentFiltered.length : 0
    const avgWeeklyPrevious = previousFiltered.length > 0
      ? previousTotal / previousFiltered.length
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

    if (useMultiYear && processedMultiYear.length > 0) {
      // Modo multi-año: crear dataset para cada año con color fijo por año
      processedMultiYear.forEach((yearItem, index) => {
        const color = getColorForYear(yearItem.year)
        const isLastYear = index === processedMultiYear.length - 1
        const weeks = yearItem.processed.map(d => d.week)
        const isSelectedYear = String(selectedYear) === String(yearItem.year)

        datasets.push({
          label: yearItem.year,
          data: yearItem.processed.map(d => d.consumption),
          borderColor: chartType === 'bar'
            ? weeks.map(w => hasComment(yearItem.year, w) ? 'rgb(139, 92, 246)' : color.border)
            : color.border,
          backgroundColor: chartType === 'bar'
            ? weeks.map(w => hasComment(yearItem.year, w) ? 'rgba(139, 92, 246, 0.75)' : color.bg)
            : color.bgFill,
          borderWidth: chartType === 'bar' ? 1 : 2,
          borderDash: isLastYear ? [] : [5, 5],
          fill: chartType === 'line',
          tension: 0.4,
          pointRadius: weeks.map(w => (isSelectedYear && selectedWeek === w) ? 7 : (isLastYear ? 3 : 2)),
          pointHoverRadius: isLastYear ? 6 : 5,
          pointBackgroundColor: weeks.map((w, i) => {
            if (chartType === 'bar') return hasComment(yearItem.year, w) ? 'rgb(139, 92, 246)' : color.border
            if (isLastYear) {
              if (yearItem.processed[i].vsLastWeekPercent > 5) return 'rgb(239, 68, 68)'
              if (yearItem.processed[i].vsLastWeekPercent < -5) return 'rgb(34, 197, 94)'
            }
            return color.border
          }),
          pointBorderColor: weeks.map(w => hasComment(yearItem.year, w) ? 'rgb(139, 92, 246)' : 'rgba(0, 0, 0, 0)'),
          pointBorderWidth: weeks.map(w => hasComment(yearItem.year, w) ? 2.5 : 0)
        })
      })
      
      const labels = processedMultiYear[processedMultiYear.length - 1].processed.map(d => `Sem ${d.week}`)
      return { labels, datasets }
    }

    // Modo original de 2 años
    const labels = Array.from({ length: 52 }, (_, i) => `Sem ${i + 1}`)
    const currentColor = getColorForYear(effectiveCurrentYear)
    const previousColor = getColorForYear(effectivePreviousYear)

    if (comparisonMode === 'current' || comparisonMode === 'both') {
      const currentWeeks = processedCurrent.map(d => d.week)
      const isSelectedYear = String(selectedYear) === String(effectiveCurrentYear)
      datasets.push({
        label: `${effectiveCurrentYear}`,
        data: processedCurrent.map(d => d.consumption),
        borderColor: chartType === 'bar'
          ? currentWeeks.map(w => hasComment(effectiveCurrentYear, w) ? 'rgb(139, 92, 246)' : currentColor.border)
          : currentColor.border,
        backgroundColor: chartType === 'bar'
          ? currentWeeks.map(w => hasComment(effectiveCurrentYear, w) ? 'rgba(139, 92, 246, 0.75)' : currentColor.bg)
          : currentColor.bgFill,
        borderWidth: chartType === 'bar' ? 1 : 2,
        fill: chartType === 'line',
        tension: 0.4,
        pointRadius: currentWeeks.map(w => (isSelectedYear && selectedWeek === w) ? 7 : 3),
        pointHoverRadius: 6,
        pointBackgroundColor: currentWeeks.map((w, i) => {
          if (chartType === 'bar') return hasComment(effectiveCurrentYear, w) ? 'rgb(139, 92, 246)' : currentColor.border
          if (processedCurrent[i].vsLastWeekPercent > 5) return 'rgb(239, 68, 68)'
          if (processedCurrent[i].vsLastWeekPercent < -5) return 'rgb(34, 197, 94)'
          return currentColor.border
        }),
        pointBorderColor: currentWeeks.map(w => hasComment(effectiveCurrentYear, w) ? 'rgb(139, 92, 246)' : 'rgba(0, 0, 0, 0)'),
        pointBorderWidth: currentWeeks.map(w => hasComment(effectiveCurrentYear, w) ? 2.5 : 0)
      })
    }

    if ((comparisonMode === 'previous' || comparisonMode === 'both') && processedPrevious.length > 0) {
      const previousWeeks = processedPrevious.map(d => d.week)
      const isSelectedYear = String(selectedYear) === String(effectivePreviousYear)
      datasets.push({
        label: `${effectivePreviousYear}`,
        data: processedPrevious.map(d => d.consumption),
        borderColor: chartType === 'bar'
          ? previousWeeks.map(w => hasComment(effectivePreviousYear, w) ? 'rgb(139, 92, 246)' : previousColor.border)
          : previousColor.border,
        backgroundColor: chartType === 'bar'
          ? previousWeeks.map(w => hasComment(effectivePreviousYear, w) ? 'rgba(139, 92, 246, 0.75)' : previousColor.bg)
          : previousColor.bgFill,
        borderWidth: chartType === 'bar' ? 1 : 2,
        borderDash: [5, 5],
        fill: chartType === 'line',
        tension: 0.4,
        pointRadius: previousWeeks.map(w => (isSelectedYear && selectedWeek === w) ? 7 : 2),
        pointHoverRadius: 5,
        pointBackgroundColor: previousWeeks.map(w => hasComment(effectivePreviousYear, w) ? 'rgb(139, 92, 246)' : previousColor.border),
        pointBorderColor: previousWeeks.map(w => hasComment(effectivePreviousYear, w) ? 'rgb(139, 92, 246)' : 'rgba(0, 0, 0, 0)'),
        pointBorderWidth: previousWeeks.map(w => hasComment(effectivePreviousYear, w) ? 2.5 : 0)
      })
    }

    return { labels, datasets }
  }, [processedCurrent, processedPrevious, effectiveCurrentYear, effectivePreviousYear, chartType, comparisonMode, useMultiYear, processedMultiYear, hasComment, selectedWeek, selectedYear])

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: handleChartClick,
    onHover: handleChartHover,
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
        titleFont: { size: 12, weight: 'bold' },
        callbacks: {
          title: function(tooltipItems) {
            if (!tooltipItems || tooltipItems.length === 0) return ''
            const weekNum = tooltipItems[0].dataIndex + 1
            return `Sem ${weekNum} — ${getMonthForWeek(weekNum)}`
          },
          label: function(context) {
            const dataIndex = context.dataIndex
            let label = `${context.dataset.label}: ${formatMX(context.parsed.y)} ${unit}`
            
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
          },
          afterLabel: function(context) {
            if (!yoyWeekLookup || context.parsed.y <= 0 || !processedMultiYear[context.datasetIndex]) return null
            const point = processedMultiYear[context.datasetIndex].processed[context.dataIndex]
            if (!point) return null
            return construirEtiquetaYoY({
              valorActual: context.parsed.y,
              valorAnterior: yoyWeekLookup.mapByWeek[point.week],
              etiquetaPeriodo: `Sem ${point.week} ${yoyWeekLookup.prevYear}`,
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
            return formatMX(value) + ' ' + unit
          }
        }
      }
    }
  }

  const ChartComponent = chartType === 'bar' ? Bar : Line

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-base font-semibold truncate">{title}</h3>
            <p className="text-xs text-muted-foreground">
              Análisis comparativo de consumo semanal
            </p>
          </div>
          <Button
            variant={showComments ? 'default' : 'outline'}
            size="sm"
            className="h-8 shrink-0"
            title={showComments ? 'Ocultar comentarios' : 'Mostrar comentarios'}
            onClick={() => setShowComments(v => !v)}
          >
            {showComments ? (
              <MessageSquareIcon className="h-4 w-4" />
            ) : (
              <MessageSquareOffIcon className="h-4 w-4" />
            )}
            <span className="ml-1 hidden sm:inline">Comentarios</span>
          </Button>
        </div>

        {/* Controles - solo mostrar si showControls es true */}
        {showControls && (
          <div className="flex items-center gap-2 flex-wrap mt-3">
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 mt-3">
          {/* Totales dinámicos por año */}
          {useMultiYear && processedMultiYear.length > 0 ? (
            processedMultiYear.slice().reverse().map((yearItem, index) => {
              const yearTotal = yearItem.processed.reduce((sum, w) => sum + w.consumption, 0)
              const isLatest = index === 0
              return (
                <div key={yearItem.year} className={`p-2 rounded-lg border ${
                  isLatest
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200'
                }`}>
                  <p className="text-[11px] text-muted-foreground">Total {yearItem.year}</p>
                  <p className={`text-base font-bold ${isLatest ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {formatMX(yearTotal)} {unit}
                  </p>
                </div>
              )
            })
          ) : (
            <>
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200">
                <p className="text-[11px] text-muted-foreground">Total {effectiveCurrentYear}</p>
                <p className="text-base font-bold text-foreground">
                  {formatMX(comparisonStats.currentTotal)} {unit}
                </p>
              </div>
              <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200">
                <p className="text-[11px] text-muted-foreground">Total {effectivePreviousYear}</p>
                <p className="text-base font-bold text-muted-foreground">
                  {formatMX(comparisonStats.previousTotal)} {unit}
                </p>
              </div>
            </>
          )}

          {/* Cambio año sobre año */}
          {canCompareYearOverYear && (
            <div className={`p-2 rounded-lg border ${
              comparisonStats.yearOverYear > 0 
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200' 
                : comparisonStats.yearOverYear < 0
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200'
                : 'bg-gray-50 dark:bg-gray-800 border-gray-200'
            }`}>
              <p className="text-[11px] text-muted-foreground">Cambio Anual</p>
              <div className="flex items-center gap-1">
                {comparisonStats.yearOverYear > 0 ? (
                  <TrendingUpIcon className="h-4 w-4 text-red-600" />
                ) : comparisonStats.yearOverYear < 0 ? (
                  <TrendingDownIcon className="h-4 w-4 text-green-600" />
                ) : (
                  <MinusIcon className="h-4 w-4 text-gray-600" />
                )}
                <p className={`text-base font-bold ${
                  comparisonStats.yearOverYear > 0 ? 'text-red-600' : 
                  comparisonStats.yearOverYear < 0 ? 'text-green-600' : 
                  'text-gray-600'
                }`}>
                  {comparisonStats.yearOverYear > 0 ? '+' : ''}{comparisonStats.yearOverYear.toFixed(1)}%
                </p>
              </div>
            </div>
          )}

        </div>

      </CardHeader>

      <CardContent>
        {/* Comentarios de la semana seleccionada al hacer clic en la gráfica */}
        {showComments && (
          <div className="mb-3">
            {selectedWeek == null ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-muted bg-muted/20 text-xs text-muted-foreground">
                <MessageSquareIcon className="h-3.5 w-3.5 shrink-0" />
                <span>Haz clic en un punto de la gráfica para ver los comentarios de esa semana.</span>
                {loadingComments && <Loader2Icon className="h-3.5 w-3.5 animate-spin" />}
              </div>
            ) : (
              <div className={`rounded-lg border p-3 ${
                selectedWeekComments.length > 0
                  ? 'bg-violet-50/60 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800'
                  : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <MessageSquareIcon className={`h-4 w-4 shrink-0 ${selectedWeekComments.length > 0 ? 'text-violet-600' : 'text-amber-600'}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        Semana {selectedWeek} · {getMonthForWeek(selectedWeek)}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {selectedWeekComments.length > 0
                          ? `${selectedWeekComments.length} ${selectedWeekComments.length === 1 ? 'comentario' : 'comentarios'}`
                          : 'Sin comentarios'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 shrink-0"
                    title="Quitar selección"
                    onClick={clearSelectedWeek}
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                </div>

                {loadingComments ? (
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
                    Cargando comentarios...
                  </div>
                ) : selectedWeekComments.length > 0 ? (
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {selectedWeekComments.map(c => (
                      <div
                        key={c.year}
                        className={`rounded-md border bg-background/70 p-2 ${
                          c.isSelected ? 'border-violet-400 ring-1 ring-violet-300' : 'border-border'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                          <span className="text-xs font-semibold text-foreground">{c.year}</span>
                          {c.isSelected && (
                            <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300">
                              Seleccionado
                            </span>
                          )}
                        </div>
                        <p className="text-[13px] leading-snug text-foreground whitespace-pre-wrap break-words max-h-24 overflow-y-auto">
                          {c.comment}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-[10px] text-muted-foreground">
                          <span>- {c.authorName || 'Usuario'}</span>
                          {c.updated_at && (
                            <span>Editado: {new Date(c.updated_at).toLocaleString('es-MX')}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-start gap-2 mt-2 text-xs text-amber-800 dark:text-amber-200">
                    <InfoIcon className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>Sin comentarios registrados para la Semana {selectedWeek}.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="h-[360px] w-full sm:h-[400px]">
          <ChartComponent data={chartData} options={chartOptions} />
        </div>

        {/* Leyenda de colores de puntos */}
        {chartType === 'line' && comparisonMode !== 'previous' && (
          <div className="mt-3 p-2 bg-muted/30 rounded-lg">
            <p className="text-[11px] font-medium mb-1">Leyenda de puntos (cambio vs semana anterior):</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
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
              {showComments && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-white border-2 border-violet-500"></div>
                  <span>Semana con comentario</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
