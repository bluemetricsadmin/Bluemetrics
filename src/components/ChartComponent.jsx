import { formatMX } from '../utils/formatMX'
import React from 'react'
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
  Filler,
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'

// Registrar componentes de Chart.js
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

const ChartComponent = ({ 
  chartType, 
  chartData, 
  data, 
  selectedMetrics, 
  availableMetrics, 
  dataKeys,  // Nueva prop: array de nombres de claves a mostrar
  colors,    // Nueva prop: array de colores correspondientes
  type, 
  options 
}) => {
  // Si se proporciona data en lugar de chartData, usar data (para compatibilidad)
  const actualData = chartData || data;
  const actualType = chartType || type || 'line';
  
  // Validar props
  if (!actualData) {
    return (
      <div className="h-96 w-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
        <div className="text-center">
          <p className="text-gray-500">No hay datos para mostrar</p>
        </div>
      </div>
    )
  }

  // Si se proporciona un objeto con structure Chart.js (labels, datasets), usarlo directamente
  if (actualData.labels && actualData.datasets) {
    const finalOptions = options || {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        }
      }
    };

    try {
      return (
        <div className="h-96 w-full">
          {actualType === 'line' || actualType === 'area' ? (
            <Line data={actualData} options={finalOptions} />
          ) : actualType === 'bar' ? (
            <Bar data={actualData} options={finalOptions} />
          ) : actualType === 'doughnut' ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              Gráficos tipo doughnut no están soportados aún
            </div>
          ) : (
            <Line data={actualData} options={finalOptions} />
          )}
        </div>
      )
    } catch (error) {
      console.error('Error en ChartComponent:', error)
      return (
        <div className="h-96 w-full flex items-center justify-center border-2 border-red-300 rounded-lg bg-red-50">
          <div className="text-center">
            <p className="text-red-600 font-medium">Error al renderizar el gráfico</p>
            <p className="text-red-500 text-sm mt-1">{error.message}</p>
          </div>
        </div>
      )
    }
  }

  // Si es un array de datos y se requieren métricas específicas
  if (Array.isArray(actualData)) {
    // Modo nuevo: usar dataKeys y colors
    if (dataKeys && colors) {
      // Preparar datos para Chart.js
      const getLabelKey = () => {
        if (actualData.length > 0) {
          const firstItem = actualData[0]
          if (firstItem.quarter) return 'quarter'
          if (firstItem.period) return 'period'
          if (firstItem.year) return 'year'
        }
        return 'period' // fallback
      }
      
      const labelKey = getLabelKey()
      const labels = actualData.map(item => item[labelKey])
      
      const datasets = dataKeys.map((key, index) => ({
        label: key,
        data: actualData.map(item => item[key] || 0),
        borderColor: colors[index] || '#3b82f6',
        backgroundColor: actualType === 'area' ? `${colors[index] || '#3b82f6'}40` : colors[index] || '#3b82f6',
        fill: actualType === 'area',
        tension: 0.4,
      }))

      const finalData = {
        labels,
        datasets,
      }

      const finalOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: false,
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: function(context) {
                const label = context.dataset.label || '';
                const value = context.parsed.y;
                if (label.includes('%')) {
                  return `${label}: ${value.toFixed(2)}%`;
                }
                return `${label}: ${formatMX(value)} m³`;
              }
            }
          },
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Período'
            }
          },
          y: {
            display: true,
            title: {
              display: true,
              text: dataKeys.some(k => k.includes('%')) ? 'Porcentaje (%)' : 'Volumen (m³)'
            },
            ticks: {
              callback: function(value) {
                return formatMX(value)
              }
            }
          },
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        }
      }

      try {
        return (
          <div className="h-96 w-full">
            {actualType === 'line' || actualType === 'area' ? (
              <Line data={finalData} options={finalOptions} />
            ) : actualType === 'bar' ? (
              <Bar data={finalData} options={finalOptions} />
            ) : actualType === 'composed' ? (
              <Line data={finalData} options={finalOptions} />
            ) : (
              <Line data={finalData} options={finalOptions} />
            )}
          </div>
        )
      } catch (error) {
        console.error('Error en ChartComponent:', error)
        return (
          <div className="h-96 w-full flex items-center justify-center border-2 border-red-300 rounded-lg bg-red-50">
            <div className="text-center">
              <p className="text-red-600 font-medium">Error al renderizar el gráfico</p>
              <p className="text-red-500 text-sm mt-1">{error.message}</p>
            </div>
          </div>
        )
      }
    }

    // Modo antiguo: usar selectedMetrics y availableMetrics
    if (!selectedMetrics || selectedMetrics.length === 0) {
      return (
        <div className="h-96 w-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
          <div className="text-center">
            <p className="text-gray-500">Selecciona al menos una métrica</p>
          </div>
        </div>
      )
    }

    // Preparar datos para Chart.js - detectar automáticamente la clave de etiqueta
    const getLabelKey = () => {
      if (actualData.length > 0) {
        const firstItem = actualData[0]
        if (firstItem.quarter) return 'quarter'
        if (firstItem.period) return 'period'
        if (firstItem.year) return 'year'
      }
      return 'year' // fallback
    }
    
    const labelKey = getLabelKey()
    const labels = actualData.map(item => item[labelKey])
    
    const datasets = selectedMetrics
      .map(metricKey => {
        const metric = availableMetrics.find(m => m.key === metricKey)
        if (!metric) return null

        return {
          label: metric.label,
          data: actualData.map(item => item[metricKey]),
          borderColor: metric.color,
          backgroundColor: actualType === 'area' ? `${metric.color}40` : metric.color,
          fill: actualType === 'area',
          tension: 0.4,
        }
      })
      .filter(Boolean)

    const finalData = {
      labels,
      datasets,
    }

    const finalOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: false,
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${formatMX(context.parsed.y)} m³`
            }
          }
        },
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: labelKey === 'quarter' ? 'Trimestre' : labelKey === 'period' ? 'Período' : 'Año'
          }
        },
        y: {
          display: true,
          title: {
            display: true,
            text: 'Volumen (m³)'
          },
          ticks: {
            callback: function(value) {
              return formatMX(value)
            }
          }
        },
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      }
    }

    try {
      return (
        <div className="h-96 w-full">
          {actualType === 'line' || actualType === 'area' ? (
            <Line data={finalData} options={finalOptions} />
          ) : actualType === 'bar' ? (
            <Bar data={finalData} options={finalOptions} />
          ) : actualType === 'composed' ? (
            <Line data={finalData} options={finalOptions} />
          ) : (
            <Line data={finalData} options={finalOptions} />
          )}
        </div>
      )
    } catch (error) {
      console.error('Error en ChartComponent:', error)
      return (
        <div className="h-96 w-full flex items-center justify-center border-2 border-red-300 rounded-lg bg-red-50">
          <div className="text-center">
            <p className="text-red-600 font-medium">Error al renderizar el gráfico</p>
            <p className="text-red-500 text-sm mt-1">{error.message}</p>
          </div>
        </div>
      )
    }
  }

  // Si no es ninguno de los casos anteriores
  return (
    <div className="h-96 w-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
      <div className="text-center">
        <p className="text-gray-500">Formato de datos no compatible</p>
      </div>
    </div>
  )
}

export default ChartComponent