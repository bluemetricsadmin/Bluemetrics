import { useState, useMemo } from 'react'
import { Line, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import {
  TrendingUpIcon,
  TrendingDownIcon,
  MinusIcon,
  Calendar,
  BarChart3 as BarChart3Icon,
  LineChart as LineChartIcon,
  Download,
  Filter
} from 'lucide-react'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

// Funciones auxiliares
const formatearFecha = (fecha, vista) => {
  if (!fecha) return 'N/A'
  try {
    const partes = fecha.split(' ')
    if (vista === 'semanal') return partes[0] || fecha
    if (vista === 'mensual') return partes[0]?.substring(0, 5) || fecha
    return fecha
  } catch {
    return fecha
  }
}

const formatearFechaTooltip = (fecha, vista) => {
  if (!fecha) return 'N/A'
  if (vista === 'anual') return fecha

  const fechaStr = String(fecha)
  const soloFecha = fechaStr.split(' ')[0] || fechaStr

  // Convertir formato ISO (YYYY-MM-DD) a DD/MM/YYYY para consistencia visual
  if (/^\d{4}-\d{2}-\d{2}$/.test(soloFecha)) {
    const [anio, mes, dia] = soloFecha.split('-')
    return `${dia}/${mes}/${anio}`
  }

  return soloFecha
}

const construirFechaTooltip = (point, vista) => {
  if (!point) return 'N/A'

  const mesAnio = (point.mes && point.anio)
    ? `${point.mes} ${point.anio}`
    : (point.mesAnio || '')

  if (vista === 'anual') {
    return mesAnio || point.fecha || 'N/A'
  }

  const dia = formatearFechaTooltip(point.diaHora || point.fecha, vista)

  if (mesAnio && dia) return `${mesAnio} - ${dia}`
  return dia || mesAnio || 'N/A'
}

const extraerMes = (fecha) => {
  if (!fecha) return null
  const partes = fecha.split(' ')[0]?.split('/')
  if (partes && partes.length >= 2) {
    return `${partes[1]}/${partes[2] || new Date().getFullYear()}`
  }
  return null
}

const extraerAnio = (mesAnio) => {
  if (!mesAnio) return null
  const match = mesAnio.match(/(\d{4})/)
  return match ? match[1] : null
}

const MESES_ES = {
  'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4,
  'mayo': 5, 'junio': 6, 'julio': 7, 'agosto': 8,
  'septiembre': 9, 'octubre': 10, 'noviembre': 11, 'diciembre': 12
}

const YEAR_COLORS = [
  { border: 'rgb(59, 130, 246)', bg: 'rgba(59, 130, 246, 0.6)', bgFill: 'rgba(59, 130, 246, 0.1)' },
  { border: 'rgb(34, 197, 94)', bg: 'rgba(34, 197, 94, 0.6)', bgFill: 'rgba(34, 197, 94, 0.1)' },
  { border: 'rgb(245, 158, 11)', bg: 'rgba(245, 158, 11, 0.6)', bgFill: 'rgba(245, 158, 11, 0.1)' },
  { border: 'rgb(239, 68, 68)', bg: 'rgba(239, 68, 68, 0.6)', bgFill: 'rgba(239, 68, 68, 0.1)' },
  { border: 'rgb(139, 92, 246)', bg: 'rgba(139, 92, 246, 0.6)', bgFill: 'rgba(139, 92, 246, 0.1)' }
]

const DailyConsumptionChartJS = ({
  data = [],
  puntoField = 'consumo',
  puntoLabel = 'Consumo',
  multiYearData = null,
  chartType: externalChartType = null
}) => {
  const [vistaActual, setVistaActual] = useState('mensual')
  const [internalChartType, setInternalChartType] = useState('line')
  const [mostrarPromedio, setMostrarPromedio] = useState(true)
  const [selectedYears, setSelectedYears] = useState(null) // null = default (current year only)

  const chartType = externalChartType !== null ? externalChartType : internalChartType

  // Detectar años disponibles
  const availableYears = useMemo(() => {
    if (multiYearData && multiYearData.length > 0) {
      return multiYearData.map(d => d.year).sort()
    }
    const years = [...new Set(data.map(l => extraerAnio(l.mes_anio)).filter(Boolean))]
    return years.sort()
  }, [data, multiYearData])

  // Por defecto solo mostrar el año actual (2026), el usuario puede activar más
  const activeSelectedYears = useMemo(() => {
    if (selectedYears !== null) return selectedYears
    const currentYear = new Date().getFullYear().toString()
    if (availableYears.includes(currentYear)) return [currentYear]
    // Fallback: último año disponible
    return availableYears.length > 0 ? [availableYears[availableYears.length - 1]] : availableYears
  }, [selectedYears, availableYears])

  const toggleYear = (year) => {
    setSelectedYears(prev => {
      const current = prev !== null ? prev : availableYears
      if (current.includes(year)) {
        if (current.length === 1) return current
        return current.filter(y => y !== year)
      }
      return [...current, year].sort()
    })
  }

  // Procesar datos para vista actual (single year mode)
  const processSingleYearData = (yearData, vista) => {
    if (!yearData || yearData.length === 0) return []

    let limite, agrupacion
    switch (vista) {
      case 'semanal': limite = 7; agrupacion = 'dia'; break
      case 'mensual': limite = 30; agrupacion = 'dia'; break
      case 'anual': limite = 12; agrupacion = 'mes'; break
      default: limite = 30; agrupacion = 'dia'
    }

    if (agrupacion === 'dia') {
      return yearData.slice(0, limite).reverse().map(item => ({
        fecha: item.dia_hora || item.fecha || 'N/A',
        diaHora: item.dia_hora || item.fecha || 'N/A',
        mes: item.mes || null,
        anio: item.anio || null,
        mesAnio: item.mes_anio || null,
        valor: parseFloat(item[puntoField]) || 0,
        fechaCorta: formatearFecha(item.dia_hora || item.fecha, vista)
      }))
    } else {
      const datosPorMes = {}
      let anio = null
      yearData.forEach(item => {
        const mes = item.mes_anio || extraerMes(item.dia_hora)
        if (mes) {
          const mesKey = mes.toLowerCase()
          if (!datosPorMes[mesKey]) datosPorMes[mesKey] = { total: 0, count: 0 }
          datosPorMes[mesKey].total += parseFloat(item[puntoField]) || 0
          datosPorMes[mesKey].count += 1
          if (!anio) {
            const match = mes.match(/(\d{4})/)
            if (match) anio = match[1]
          }
        }
      })

      if (!anio) anio = new Date().getFullYear().toString()

      // Generar los 12 meses del año en orden ascendente
      const todosMeses = Object.keys(MESES_ES).map(nombreMes => `${nombreMes} ${anio}`)

      return todosMeses.map(mes => ({
        fecha: mes,
        diaHora: '',
        mes: mes.split(' ')[0] || null,
        anio: mes.split(' ')[1] || anio,
        mesAnio: mes,
        valor: datosPorMes[mes]
          ? parseFloat((datosPorMes[mes].total / datosPorMes[mes].count).toFixed(2))
          : 0,
        fechaCorta: mes
      }))
    }
  }

  // Multi-year processing
  const processMultiYearData = (yearItems, vista) => {
    if (!yearItems || yearItems.length === 0) return []

    return yearItems.map(yearItem => {
      const processed = processSingleYearData(yearItem.data, vista)
      return {
        year: yearItem.year,
        processed
      }
    })
  }

  // Detectar si usar multi-year
  const useMultiYear = multiYearData !== null && multiYearData.length > 0

  // Datos procesados para multi-year
  const processedMultiYear = useMemo(() => {
    if (!useMultiYear) return []
    const filtered = multiYearData.filter(d => activeSelectedYears.includes(d.year))
    return processMultiYearData(filtered, vistaActual)
  }, [multiYearData, useMultiYear, activeSelectedYears, vistaActual, puntoField])

  // Datos procesados single year
  const datosProcessados = useMemo(() => {
    if (useMultiYear && processedMultiYear.length > 0) {
      return processedMultiYear[processedMultiYear.length - 1].processed
    }
    return processSingleYearData(data, vistaActual)
  }, [data, vistaActual, puntoField, useMultiYear, processedMultiYear])

  // Estadísticas
  const estadisticas = useMemo(() => {
    if (datosProcessados.length === 0) return null

    const valores = datosProcessados.map(d => parseFloat(d.valor))
    const promedio = valores.reduce((a, b) => a + b, 0) / valores.length
    const maximo = Math.max(...valores)
    const minimo = Math.min(...valores)
    const total = valores.reduce((a, b) => a + b, 0)
    const tendencia = valores[valores.length - 1] - valores[0]
    const tendenciaPorcentaje = valores[0] !== 0 ? (tendencia / valores[0]) * 100 : 0

    return {
      promedio: promedio.toFixed(2),
      maximo: maximo.toFixed(2),
      minimo: minimo.toFixed(2),
      total: total.toFixed(2),
      tendencia: tendencia.toFixed(2),
      tendenciaPorcentaje: tendenciaPorcentaje.toFixed(1)
    }
  }, [datosProcessados])

  // Multi-year comparison stats
  const comparisonStats = useMemo(() => {
    if (!useMultiYear || processedMultiYear.length === 0) return null

    // Determinar el último índice con datos reales en el año más reciente
    const latestProcessed = processedMultiYear[processedMultiYear.length - 1].processed
    const indicesWithData = latestProcessed.reduce((acc, d, i) => (d.valor > 0 ? i : acc), -1)
    const maxIndexWithData = indicesWithData >= 0 ? indicesWithData : latestProcessed.length - 1

    const yearTotals = processedMultiYear.map(y => ({
      year: y.year,
      total: y.processed.slice(0, maxIndexWithData + 1).reduce((sum, d) => sum + d.valor, 0)
    }))

    const latest = yearTotals[yearTotals.length - 1]
    const previous = yearTotals.length > 1 ? yearTotals[yearTotals.length - 2] : null
    const yearOverYear = previous && previous.total > 0
      ? ((latest.total - previous.total) / previous.total * 100)
      : 0

    return { yearTotals, yearOverYear }
  }, [useMultiYear, processedMultiYear])

  // Chart.js data configuration
  const chartData = useMemo(() => {
    if (useMultiYear && processedMultiYear.length > 0) {
      // Multi-year mode
      const maxLen = Math.max(...processedMultiYear.map(y => y.processed.length))
      const labels = processedMultiYear.find(y => y.processed.length === maxLen)
        ?.processed.map(d => d.fechaCorta) || []

      const datasets = processedMultiYear.map((yearItem, index) => {
        const color = YEAR_COLORS[index % YEAR_COLORS.length]
        const isLatest = index === processedMultiYear.length - 1
        const values = yearItem.processed.map(d => d.valor)

        // Color-coded points for latest year
        const pointColors = isLatest ? values.map((val, i) => {
          if (i === 0) return color.border
          const prev = values[i - 1]
          if (prev === 0) return color.border
          const change = ((val - prev) / prev) * 100
          if (change > 5) return 'rgb(239, 68, 68)'
          if (change < 0) return 'rgb(34, 197, 94)'
          return color.border
        }) : color.border

        return {
          label: yearItem.year,
          data: values,
          borderColor: color.border,
          backgroundColor: chartType === 'bar' ? color.bg : color.bgFill,
          borderWidth: 2,
          borderDash: isLatest ? [] : [5, 5],
          fill: chartType === 'line',
          tension: 0.4,
          pointRadius: isLatest ? 3 : 2,
          pointHoverRadius: isLatest ? 6 : 5,
          pointBackgroundColor: pointColors
        }
      })

      return { labels, datasets }
    }

    // Single year mode
    const labels = datosProcessados.map(d => d.fechaCorta)
    const values = datosProcessados.map(d => d.valor)

    const pointColors = values.map((val, i) => {
      if (i === 0) return 'rgb(59, 130, 246)'
      const prev = values[i - 1]
      if (prev === 0) return 'rgb(59, 130, 246)'
      const change = ((val - prev) / prev) * 100
      if (change > 5) return 'rgb(239, 68, 68)'
      if (change < 0) return 'rgb(34, 197, 94)'
      return 'rgb(59, 130, 246)'
    })

    const datasets = [{
      label: puntoLabel,
      data: values,
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: chartType === 'bar' ? 'rgba(59, 130, 246, 0.6)' : 'rgba(59, 130, 246, 0.1)',
      borderWidth: 2,
      fill: chartType === 'line',
      tension: 0.4,
      pointRadius: 3,
      pointHoverRadius: 6,
      pointBackgroundColor: pointColors
    }]

    // Average line as extra dataset
    if (mostrarPromedio && estadisticas) {
      const avg = parseFloat(estadisticas.promedio)
      datasets.push({
        label: `Promedio (${estadisticas.promedio} m³)`,
        data: Array(values.length).fill(avg),
        borderColor: 'rgb(255, 115, 0)',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        pointHoverRadius: 0,
        fill: false
      })
    }

    return { labels, datasets }
  }, [datosProcessados, chartType, puntoLabel, mostrarPromedio, estadisticas, useMultiYear, processedMultiYear])

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
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
          title: function (contextItems) {
            if (!contextItems || contextItems.length === 0) return ''

            const firstItem = contextItems[0]
            const { dataIndex } = firstItem

            if (useMultiYear && processedMultiYear.length > 0) {
              // Usar siempre el año más reciente para el título (es el que define el eje X)
              const latestYear = processedMultiYear[processedMultiYear.length - 1]
              const point = latestYear.processed[dataIndex]
              return point ? `Fecha: ${construirFechaTooltip(point, vistaActual)}` : firstItem.label
            }

            const point = datosProcessados[dataIndex]
            return point ? `Fecha: ${construirFechaTooltip(point, vistaActual)}` : firstItem.label
          },
          label: function (context) {
            let label = `${context.dataset.label}: ${context.parsed.y.toLocaleString()} m³`
            if (useMultiYear && processedMultiYear[context.datasetIndex]) {
              const yearData = processedMultiYear[context.datasetIndex].processed
              if (context.dataIndex > 0 && yearData[context.dataIndex]) {
                const curr = yearData[context.dataIndex].valor
                const prev = yearData[context.dataIndex - 1].valor
                if (prev > 0) {
                  const change = ((curr - prev) / prev * 100).toFixed(1)
                  label += ` (${change > 0 ? '+' : ''}${change}% vs anterior)`
                }
              }
            } else if (!useMultiYear && context.datasetIndex === 0 && context.dataIndex > 0) {
              const curr = context.parsed.y
              const prev = context.dataset.data[context.dataIndex - 1]
              if (prev > 0) {
                const change = ((curr - prev) / prev * 100).toFixed(1)
                label += ` (${change > 0 ? '+' : ''}${change}% vs anterior)`
              }
            }
            return label
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          font: { size: 9 },
          callback: function (value, index) {
            return index % 2 === 0 ? this.getLabelForValue(value) : ''
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: {
          callback: function (value) {
            return value.toLocaleString() + ' m³'
          }
        }
      }
    }
  }

  // Export CSV
  const exportarDatos = () => {
    const csv = [
      ['Fecha', 'Valor'],
      ...datosProcessados.map(d => [d.fecha, d.valor])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `consumo_${vistaActual}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const ChartComponent = chartType === 'bar' ? Bar : Line

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-lg">
      {/* Header */}
      <div className="p-6 pb-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Consumo Diario - {puntoLabel}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {useMultiYear ? 'Análisis comparativo de consumo' : (
                <>
                  {vistaActual === 'semanal' && 'Últimos 7 días'}
                  {vistaActual === 'mensual' && 'Últimos 30 días'}
                  {vistaActual === 'anual' && 'Últimos 12 meses'}
                </>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportarDatos}
              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar
            </button>
          </div>
        </div>

        {/* Controls row */}
        <div className="flex flex-wrap items-center gap-4 mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          {/* Periodo */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-semibold text-gray-700">Período:</span>
            <div className="flex gap-1 border rounded-lg p-1 bg-white">
              {[
                { key: 'semanal', label: '7D' },
                { key: 'mensual', label: '30D' },
                { key: 'anual', label: '12M' }
              ].map(v => (
                <button
                  key={v.key}
                  onClick={() => setVistaActual(v.key)}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    vistaActual === v.key
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-6 w-px bg-gray-300" />

          {/* Chart type */}
          <div className="flex items-center gap-2">
            <BarChart3Icon className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-semibold text-gray-700">Gráfico:</span>
            <div className="flex gap-1 border rounded-lg p-1 bg-white">
              <button
                onClick={() => setInternalChartType('line')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1 ${
                  chartType === 'line'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <LineChartIcon className="w-3.5 h-3.5" />
                Líneas
              </button>
              <button
                onClick={() => setInternalChartType('bar')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1 ${
                  chartType === 'bar'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <BarChart3Icon className="w-3.5 h-3.5" />
                Barras
              </button>
            </div>
          </div>

          {/* Year toggles (multi-year mode) */}
          {useMultiYear && availableYears.length > 1 && (
            <>
              <div className="h-6 w-px bg-gray-300" />
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-700">Años:</span>
                <div className="flex gap-1 border rounded-lg p-1 bg-white">
                  {availableYears.map(year => (
                    <button
                      key={year}
                      onClick={() => toggleYear(year)}
                      className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                        activeSelectedYears.includes(year)
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Average toggle (single year) */}
          {!useMultiYear && (
            <>
              <div className="h-6 w-px bg-gray-300" />
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-600" />
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mostrarPromedio}
                    onChange={(e) => setMostrarPromedio(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Promedio</span>
                </label>
              </div>
            </>
          )}
        </div>

        {/* Multi-year stats */}
        {useMultiYear && comparisonStats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
            {comparisonStats.yearTotals.slice().reverse().map((yt, index) => {
              const isLatest = index === 0
              return (
                <div key={yt.year} className={`p-3 rounded-lg border ${
                  isLatest
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <p className="text-xs text-gray-500">Total {yt.year}</p>
                  <p className={`text-lg font-bold ${isLatest ? 'text-gray-900' : 'text-gray-500'}`}>
                    {yt.total.toLocaleString(undefined, { maximumFractionDigits: 1 })} m³
                  </p>
                </div>
              )
            })}

            <div className={`p-3 rounded-lg border ${
              comparisonStats.yearOverYear > 0
                ? 'bg-red-50 border-red-200'
                : comparisonStats.yearOverYear < 0
                  ? 'bg-green-50 border-green-200'
                  : 'bg-gray-50 border-gray-200'
            }`}>
              <p className="text-xs text-gray-500">Cambio Anual</p>
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
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="px-6 pb-2">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="h-[450px] w-full">
            <ChartComponent data={chartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Point legend (line chart only) */}
      {chartType === 'line' && (
        <div className="px-6 pt-2">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs font-medium mb-2 text-gray-600">Leyenda de puntos (cambio vs lectura anterior):</p>
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>Aumento &gt;5%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Estable (0% a 5%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Disminución &lt;0%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}

      {/*   
      {estadisticas && (
        <div className="p-6 pt-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-xs text-blue-600 font-medium mb-1">Promedio</p>
              <p className="text-2xl font-bold text-blue-900">{estadisticas.promedio}</p>
              <p className="text-xs text-blue-600">m³</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <p className="text-xs text-green-600 font-medium mb-1">Máximo</p>
              <p className="text-2xl font-bold text-green-900">{estadisticas.maximo}</p>
              <p className="text-xs text-green-600">m³</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <p className="text-xs text-yellow-600 font-medium mb-1">Mínimo</p>
              <p className="text-2xl font-bold text-yellow-900">{estadisticas.minimo}</p>
              <p className="text-xs text-yellow-600">m³</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <p className="text-xs text-purple-600 font-medium mb-1">Total</p>
              <p className="text-2xl font-bold text-purple-900">{estadisticas.total}</p>
              <p className="text-xs text-purple-600">m³</p>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-4 border border-indigo-200">
              <div className="flex items-center gap-2 mb-1">
                {parseFloat(estadisticas.tendencia) >= 0 ? (
                  <TrendingUpIcon className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDownIcon className="w-4 h-4 text-red-600" />
                )}
                <p className="text-xs text-indigo-600 font-medium">Tendencia</p>
              </div>
              <p className={`text-2xl font-bold ${
                parseFloat(estadisticas.tendencia) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {estadisticas.tendencia > 0 ? '+' : ''}{estadisticas.tendencia} m³
              </p>
              <p className={`text-xs ${
                parseFloat(estadisticas.tendenciaPorcentaje) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {estadisticas.tendenciaPorcentaje > 0 ? '+' : ''}{estadisticas.tendenciaPorcentaje}%
              </p>
            </div>
          </div>
        </div>
      )}
      
      
      */}
      
    </div>
  )
}

export default DailyConsumptionChartJS
