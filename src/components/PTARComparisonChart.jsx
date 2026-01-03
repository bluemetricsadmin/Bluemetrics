import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader } from "./ui/card"
import { Line, Bar } from 'react-chartjs-2'
import {
  TrendingUpIcon,
  TrendingDownIcon,
  MinusIcon
} from 'lucide-react'

/**
 * Gráfica de comparación para PTAR con múltiples años
 * Adaptada específicamente para datos de agua residual y tratada
 */
export default function PTARComparisonChart({
  title = "Comparación PTAR",
  multiYearData = null, // array de { year: '2023', data: [...] }
  unit = "m³",
  chartType = 'line',
  dataType = 'residual' // 'residual' o 'tratada'
}) {

  const [selectedYears, setSelectedYears] = useState(['2023', '2024', '2025', '2026'])
  
  // Filtrar datos por años seleccionados
  const filteredMultiYearData = multiYearData !== null && Array.isArray(multiYearData)
    ? multiYearData.filter(yearItem => selectedYears.includes(yearItem.year))
    : []
  
  const useMultiYear = filteredMultiYearData.length > 0

  // Procesar datos
  const processData = (data) => {
    if (!data || data.length === 0) return []
    
    return data.map((item, index) => {
      const consumption = item.consumption || 0
      const lastConsumption = index > 0 ? (data[index - 1].consumption || 0) : 0
      
      const vsLastPercent = lastConsumption > 0 
        ? ((consumption - lastConsumption) / lastConsumption * 100)
        : 0
      
      return {
        week: item.week,
        consumption: consumption,
        vsLastPercent
      }
    })
  }

  // Procesar datos para modo multi-año
  const processedMultiYear = useMemo(() => {
    if (!useMultiYear) return []
    return filteredMultiYearData.map(yearItem => ({
      year: yearItem.year,
      processed: processData(yearItem.data)
    }))
  }, [filteredMultiYearData, useMultiYear])

  // Calcular estadísticas comparativas
  const comparisonStats = useMemo(() => {
    if (processedMultiYear.length === 0) {
      return {
        totals: {},
        yearOverYear: 0,
        avgByYear: {}
      }
    }

    const totals = {}
    const avgByYear = {}
    
    processedMultiYear.forEach(yearItem => {
      const total = yearItem.processed.reduce((sum, w) => sum + w.consumption, 0)
      totals[yearItem.year] = total
      avgByYear[yearItem.year] = total / yearItem.processed.length
    })

    // Calcular cambio año sobre año (último vs penúltimo)
    const years = Object.keys(totals).sort()
    const yearOverYear = years.length >= 2
      ? ((totals[years[years.length - 1]] - totals[years[years.length - 2]]) / totals[years[years.length - 2]] * 100)
      : 0

    return {
      totals,
      yearOverYear,
      avgByYear
    }
  }, [processedMultiYear])

  // Configuración de Chart.js
  const chartData = useMemo(() => {
    const datasets = []
    const colors = [
      { border: 'rgb(59, 130, 246)', bg: 'rgba(59, 130, 246, 0.6)', bgFill: 'rgba(59, 130, 246, 0.1)' }, // Azul - 2023
      { border: 'rgb(34, 197, 94)', bg: 'rgba(34, 197, 94, 0.6)', bgFill: 'rgba(34, 197, 94, 0.1)' }, // Verde - 2024
      { border: 'rgb(245, 158, 11)', bg: 'rgba(245, 158, 11, 0.6)', bgFill: 'rgba(245, 158, 11, 0.1)' }, // Naranja - 2025
    ]

    if (useMultiYear && processedMultiYear.length > 0) {
      // Crear dataset para cada año
      // Encontrar el año con más datos para usar como referencia de labels
      const maxDataYear = processedMultiYear.reduce((max, year) => 
        year.processed.length > max.processed.length ? year : max
      , processedMultiYear[0])
      
      // Crear labels basados en el año con más datos
      const labels = maxDataYear.processed.map(d => `${d.week}`)
      
      // Crear datasets para cada año, rellenando con null donde no hay datos
      processedMultiYear.forEach((yearItem, index) => {
        const color = colors[index % colors.length]
        const isLastYear = index === processedMultiYear.length - 1
        
        // Crear un mapa de week -> consumption para este año
        const dataMap = {}
        yearItem.processed.forEach(d => {
          dataMap[d.week] = d.consumption
        })
        
        // Crear array de datos alineado con los labels
        const alignedData = maxDataYear.processed.map(d => dataMap[d.week] || null)
        
        datasets.push({
          label: yearItem.year,
          data: alignedData,
          borderColor: color.border,
          backgroundColor: chartType === 'bar' ? color.bg : color.bgFill,
          borderWidth: 2,
          borderDash: isLastYear ? [] : [5, 5],
          fill: chartType === 'line',
          tension: 0.4,
          pointRadius: isLastYear ? 3 : 2,
          pointHoverRadius: isLastYear ? 6 : 5,
          pointBackgroundColor: color.border,
          spanGaps: true // Conectar puntos aunque haya nulls
        })
      })
      
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
          label: function(context) {
            const dataIndex = context.dataIndex
            let label = `${context.dataset.label}: ${context.parsed.y.toLocaleString()} ${unit}`
            
            // Agregar información de cambio
            if (processedMultiYear[context.datasetIndex]) {
              const change = processedMultiYear[context.datasetIndex].processed[dataIndex]?.vsLastPercent
              if (change && change !== 0) {
                label += ` (${change > 0 ? '+' : ''}${change.toFixed(1)}%)`
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
            Comparación entre años - {dataType === 'residual' ? 'Agua Residual' : 'Agua Tratada'}
          </p>
        </div>

        {/* Estadísticas de comparación */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          {Object.keys(comparisonStats.totals).sort().map((year, index) => (
            <div 
              key={year}
              className={`p-3 rounded-lg border ${
                index === Object.keys(comparisonStats.totals).length - 1
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200'
                  : 'bg-gray-50 dark:bg-gray-800 border-gray-200'
              }`}
            >
              <p className="text-xs text-muted-foreground">Total {year}</p>
              <p className={`text-lg font-bold ${
                index === Object.keys(comparisonStats.totals).length - 1
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              }`}>
                {comparisonStats.totals[year].toLocaleString()} {unit}
              </p>
            </div>
          ))}

          {/* Cambio año sobre año */}
          {Object.keys(comparisonStats.totals).length >= 2 && (
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
          )}
        </div>

      </CardHeader>

      <CardContent>
        <div className="h-[450px] w-full">
          <ChartComponent data={chartData} options={chartOptions} />
        </div>
      </CardContent>
    </Card>
  )
}
