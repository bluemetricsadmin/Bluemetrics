import { useState } from 'react'
import { DashboardHeader } from "../components/dashboard-header"
import { DashboardSidebar } from "../components/dashboard-sidebar"
import { Card, CardContent, CardHeader } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { 
  Brain, 
  Target, 
  RefreshCw,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Activity,
  BarChart3,
  LineChart
} from "lucide-react"
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
import { Bar, Line } from 'react-chartjs-2'
import { usePredictions } from '../hooks/usePredictions'

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

const POZO_LABELS = {
  l_pozo_3: 'Pozo 3',
  l_pozo_7: 'Pozo 7',
  l_pozo_11: 'Pozo 11',
  l_pozo_12: 'Pozo 12',
  l_pozo_14: 'Pozo 14',
}

export default function PredictionsPage() {
  const { loading, error, predictions, historicalData, pozos, refetch } = usePredictions()
  const [comparisonChartType, setComparisonChartType] = useState('bar')
  const [historicalChartType, setHistoricalChartType] = useState('line')

  const lastWeekData = historicalData[historicalData.length - 1] || {}
  const predicciones = predictions?.predictions_m3 || {}

  const comparisonData = {
    labels: pozos.map(p => POZO_LABELS[p] || p),
    datasets: [
      {
        label: 'Consumo Real (m³)',
        data: pozos.map(p => lastWeekData[p] || 0),
        backgroundColor: 'rgba(34, 197, 94, 0.7)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 2,
      },
      {
        label: 'Predicción ML (m³)',
        data: pozos.map(p => predicciones[p] || 0),
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
      },
    ],
  }

  const POZO_COLORS = [
    { border: 'rgb(239, 68, 68)', bg: 'rgba(239, 68, 68, 0.7)' },
    { border: 'rgb(34, 197, 94)', bg: 'rgba(34, 197, 94, 0.7)' },
    { border: 'rgb(59, 130, 246)', bg: 'rgba(59, 130, 246, 0.7)' },
    { border: 'rgb(168, 85, 247)', bg: 'rgba(168, 85, 247, 0.7)' },
    { border: 'rgb(245, 158, 11)', bg: 'rgba(245, 158, 11, 0.7)' },
  ]

  const historicalChartLabels = historicalData.map((d, i) => `Sem ${i + 1}`)
  const historicalChartDatasets = pozos.map((p, idx) => ({
    label: POZO_LABELS[p] || p,
    data: historicalData.map(d => d[p] || 0),
    borderColor: POZO_COLORS[idx % 5].border,
    backgroundColor: POZO_COLORS[idx % 5].bg,
    tension: 0.4,
    fill: false,
  }))

  const totalReal = pozos.reduce((sum, p) => sum + (lastWeekData[p] || 0), 0)
  const totalPredicho = pozos.reduce((sum, p) => sum + (predicciones[p] || 0), 0)
  const diffPercent = totalReal > 0 ? (((totalPredicho - totalReal) / totalReal) * 100).toFixed(1) : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardSidebar />
        <div className="ml-64">
          <DashboardHeader />
          <main className="p-6 flex items-center justify-center h-[60vh]">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-muted-foreground">Cargando predicciones...</p>
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardSidebar />
        <div className="ml-64">
          <DashboardHeader />
          <main className="p-6">
            <Card>
              <CardContent className="p-8 text-center">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">Error al cargar predicciones</h2>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={refetch}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reintentar
                </Button>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      
      <div className="ml-64">
        <DashboardHeader />
        <main className="p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Análisis Predictivo</h1>
                <p className="text-muted-foreground">
                  Predicciones de consumo de agua por pozos - Modelo ML
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={refetch}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Actualizar
                </Button>
              </div>
            </div>

            {/* Métricas principales */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Brain className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{pozos.length}</div>
                      <div className="text-sm text-muted-foreground">Pozos Modelados</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Target className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{totalReal.toFixed(1)}</div>
                      <div className="text-sm text-muted-foreground">Real (m³)</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Activity className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{totalPredicho.toFixed(1)}</div>
                      <div className="text-sm text-muted-foreground">Predicho (m³)</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${Number(diffPercent) >= 0 ? 'bg-orange-100' : 'bg-blue-100'}`}>
                      {Number(diffPercent) >= 0 
                        ? <AlertTriangle className="w-5 h-5 text-orange-600" />
                        : <CheckCircle className="w-5 h-5 text-blue-600" />
                      }
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{diffPercent}%</div>
                      <div className="text-sm text-muted-foreground">Desviación</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Gráfico comparativo Real vs Predicho - Full width */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Consumo Real vs Predicción ML</h3>
                  <p className="text-sm text-muted-foreground">Última semana disponible</p>
                </div>
                <div className="flex gap-1 bg-muted p-1 rounded-lg">
                  <Button
                    variant={comparisonChartType === 'bar' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setComparisonChartType('bar')}
                    className="h-8 px-3"
                  >
                    <BarChart3 className="w-4 h-4 mr-1" />
                    Barras
                  </Button>
                  <Button
                    variant={comparisonChartType === 'line' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setComparisonChartType('line')}
                    className="h-8 px-3"
                  >
                    <LineChart className="w-4 h-4 mr-1" />
                    Líneas
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                {comparisonChartType === 'bar' ? (
                  <Bar 
                    data={comparisonData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'top' },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: { display: true, text: 'Consumo (m³)' },
                        },
                      },
                    }} 
                  />
                ) : (
                  <Line 
                    data={comparisonData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'top' },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: { display: true, text: 'Consumo (m³)' },
                        },
                      },
                    }} 
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Gráfico tendencia histórica - Full width */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Tendencia Histórica por Pozo</h3>
                  <p className="text-sm text-muted-foreground">Últimas {historicalData.length} semanas</p>
                </div>
                <div className="flex gap-1 bg-muted p-1 rounded-lg">
                  <Button
                    variant={historicalChartType === 'bar' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setHistoricalChartType('bar')}
                    className="h-8 px-3"
                  >
                    <BarChart3 className="w-4 h-4 mr-1" />
                    Barras
                  </Button>
                  <Button
                    variant={historicalChartType === 'line' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setHistoricalChartType('line')}
                    className="h-8 px-3"
                  >
                    <LineChart className="w-4 h-4 mr-1" />
                    Líneas
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                {historicalChartType === 'bar' ? (
                  <Bar 
                    data={{ labels: historicalChartLabels, datasets: historicalChartDatasets }} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'top' },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: { display: true, text: 'Consumo (m³)' },
                        },
                      },
                    }} 
                  />
                ) : (
                  <Line 
                    data={{ labels: historicalChartLabels, datasets: historicalChartDatasets }} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'top' },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: { display: true, text: 'Consumo (m³)' },
                        },
                      },
                    }} 
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tabla de detalle por pozo */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Detalle por Pozo</h3>
              <p className="text-sm text-muted-foreground">Comparación de consumo real vs predicho</p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Pozo</th>
                      <th className="text-right p-3 font-medium">Real (m³)</th>
                      <th className="text-right p-3 font-medium">Predicho (m³)</th>
                      <th className="text-right p-3 font-medium">Diferencia</th>
                      <th className="text-center p-3 font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pozos.map(p => {
                      const real = lastWeekData[p] || 0
                      const pred = predicciones[p] || 0
                      const diff = real > 0 ? (((pred - real) / real) * 100).toFixed(1) : 'N/A'
                      const isClose = Math.abs(Number(diff)) <= 10

                      return (
                        <tr key={p} className="border-b hover:bg-muted/50">
                          <td className="p-3 font-medium">{POZO_LABELS[p] || p}</td>
                          <td className="p-3 text-right">{real.toFixed(2)}</td>
                          <td className="p-3 text-right">{pred.toFixed(2)}</td>
                          <td className={`p-3 text-right ${Number(diff) > 0 ? 'text-orange-600' : 'text-blue-600'}`}>
                            {diff !== 'N/A' ? `${Number(diff) > 0 ? '+' : ''}${diff}%` : diff}
                          </td>
                          <td className="p-3 text-center">
                            <Badge variant={isClose ? 'default' : 'destructive'}>
                              {isClose ? 'Cerca' : 'Desviado'}
                            </Badge>
                          </td>
                        </tr>
                      )
                    })}
                    <tr className="font-bold bg-muted/30">
                      <td className="p-3">Total</td>
                      <td className="p-3 text-right">{totalReal.toFixed(2)}</td>
                      <td className="p-3 text-right">{totalPredicho.toFixed(2)}</td>
                      <td className="p-3 text-right">{diffPercent}%</td>
                      <td className="p-3 text-center">
                        <Badge variant={Math.abs(Number(diffPercent)) <= 10 ? 'default' : 'destructive'}>
                          {Math.abs(Number(diffPercent)) <= 10 ? 'Óptimo' : 'Revisar'}
                        </Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
