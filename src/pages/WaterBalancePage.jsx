import { formatMXInt } from '../utils/formatMX'
import { useState } from 'react'
import { DashboardHeader } from "../components/dashboard-header"
import { DashboardSidebar } from "../components/dashboard-sidebar"
import { Card, CardContent, CardHeader } from "../components/ui/card"
import { Button } from "../components/ui/button"
import ChartComponent from "../components/ChartComponent"
import { dashboardData } from '../lib/dashboard-data'
import { 
  FilterIcon, 
  TrendingUpIcon, 
  TrendingDownIcon,
  DropletIcon, 
  ActivityIcon,
  BarChart3Icon,
  CalendarIcon,
  DownloadIcon,
  ArrowRightIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  Waves,
  Building2,
  Factory,
  Truck,
  Database,
  Zap,
  AlertTriangleIcon,
  CheckCircleIcon,
  Target
} from 'lucide-react'

export default function WaterBalancePage() {
  const [timeFrame, setTimeFrame] = useState('monthly')
  const [selectedYear, setSelectedYear] = useState('2025')
  const [showFlow, setShowFlow] = useState(true)

  // Obtener datos de balance según período
  const getBalanceData = () => {
    switch (timeFrame) {
      case 'quarterly':
        return dashboardData.balanceHistory.quarterly
      case 'yearly':
        return dashboardData.balanceHistory.yearly
      case 'monthly':
      default:
        return dashboardData.balanceHistory.monthly
    }
  }

  // Datos para gráficos
  const balanceData = getBalanceData()
  const waterBalance = dashboardData.waterBalance
  const waterFlow = dashboardData.waterFlow
  const sustainability = dashboardData.sustainability

  // Calcular métricas clave
  const totalInflow = waterBalance.inflow.total
  const totalOutflow = waterBalance.outflow.total
  const netBalance = totalInflow - totalOutflow
  const balancePercentage = ((netBalance / totalInflow) * 100).toFixed(1)
  const efficiency = ((totalOutflow / totalInflow) * 100).toFixed(1)

  // Datos para gráfico de balance
  const balanceChartData = {
    labels: balanceData.map(item => item.name),
    datasets: [
      {
        label: 'Entrada (miles m³)',
        data: balanceData.map(item => item.inflow),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2
      },
      {
        label: 'Salida (miles m³)',
        data: balanceData.map(item => item.outflow),
        backgroundColor: 'rgba(239, 68, 68, 0.6)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 2
      },
      {
        label: 'Balance Neto (miles m³)',
        data: balanceData.map(item => item.balance),
        backgroundColor: 'rgba(16, 185, 129, 0.6)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 2,
        type: 'line'
      }
    ]
  }

  // Datos para gráfico de eficiencia
  const efficiencyChartData = {
    labels: balanceData.map(item => item.name),
    datasets: [{
      label: 'Eficiencia (%)',
      data: balanceData.map(item => item.efficiency),
      backgroundColor: 'rgba(245, 158, 11, 0.6)',
      borderColor: 'rgb(245, 158, 11)',
      borderWidth: 3,
      fill: true
    }]
  }

  // Configuración de gráficos
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }

  // Componente de flujo visual simplificado
  const WaterFlowDiagram = () => (
    <div className="p-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
      <h4 className="font-semibold mb-4 text-center">Flujo de Agua del Sistema</h4>
      
      {/* Fuentes */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="h-16 w-16 mx-auto mb-2 rounded-full bg-blue-500/20 flex items-center justify-center">
            <Waves className="h-8 w-8 text-blue-600" />
          </div>
          <p className="text-sm font-medium">Pozos</p>
          <p className="text-xs text-muted-foreground">{formatMXInt(waterFlow.sources[0].value / 1000)}k m³</p>
        </div>
        <div className="text-center">
          <div className="h-16 w-16 mx-auto mb-2 rounded-full bg-green-500/20 flex items-center justify-center">
            <Building2 className="h-8 w-8 text-green-600" />
          </div>
          <p className="text-sm font-medium">Municipal</p>
          <p className="text-xs text-muted-foreground">{formatMXInt(waterFlow.sources[1].value / 1000)}k m³</p>
        </div>
        <div className="text-center">
          <div className="h-16 w-16 mx-auto mb-2 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <Factory className="h-8 w-8 text-yellow-600" />
          </div>
          <p className="text-sm font-medium">PTAR</p>
          <p className="text-xs text-muted-foreground">{formatMXInt(waterFlow.sources[2].value / 1000)}k m³</p>
        </div>
        <div className="text-center">
          <div className="h-16 w-16 mx-auto mb-2 rounded-full bg-red-500/20 flex items-center justify-center">
            <Truck className="h-8 w-8 text-red-600" />
          </div>
          <p className="text-sm font-medium">Pipas</p>
          <p className="text-xs text-muted-foreground">{formatMXInt(waterFlow.sources[3].value / 1000)}k m³</p>
        </div>
      </div>

      {/* Flecha hacia abajo */}
      <div className="flex justify-center mb-6">
        <ArrowDownIcon className="h-8 w-8 text-gray-400" />
      </div>

      {/* Distribución */}
      <div className="grid grid-cols-2 gap-8 mb-6">
        <div className="text-center">
          <div className="h-20 w-20 mx-auto mb-2 rounded-full bg-indigo-500/20 flex items-center justify-center">
            <Zap className="h-10 w-10 text-indigo-600" />
          </div>
          <p className="text-sm font-medium">Red Principal</p>
          <p className="text-xs text-muted-foreground">{formatMXInt(waterFlow.distribution[0].value / 1000)}k m³</p>
        </div>
        <div className="text-center">
          <div className="h-20 w-20 mx-auto mb-2 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Database className="h-10 w-10 text-purple-600" />
          </div>
          <p className="text-sm font-medium">Almacenamiento</p>
          <p className="text-xs text-muted-foreground">{formatMXInt(waterFlow.distribution[1].value / 1000)}k m³</p>
        </div>
      </div>

      {/* Flecha hacia abajo */}
      <div className="flex justify-center mb-6">
        <ArrowDownIcon className="h-8 w-8 text-gray-400" />
      </div>

      {/* Usos finales */}
      <div className="grid grid-cols-4 gap-4">
        <div className="text-center">
          <div className="h-16 w-16 mx-auto mb-2 rounded-full bg-green-600/20 flex items-center justify-center">
            <DropletIcon className="h-8 w-8 text-green-700" />
          </div>
          <p className="text-sm font-medium">Riego</p>
          <p className="text-xs text-muted-foreground">{formatMXInt(waterFlow.usage[0].value / 1000)}k m³</p>
        </div>
        <div className="text-center">
          <div className="h-16 w-16 mx-auto mb-2 rounded-full bg-red-600/20 flex items-center justify-center">
            <ActivityIcon className="h-8 w-8 text-red-700" />
          </div>
          <p className="text-sm font-medium">Torres</p>
          <p className="text-xs text-muted-foreground">{formatMXInt(waterFlow.usage[1].value / 1000)}k m³</p>
        </div>
        <div className="text-center">
          <div className="h-16 w-16 mx-auto mb-2 rounded-full bg-orange-600/20 flex items-center justify-center">
            <Building2 className="h-8 w-8 text-orange-700" />
          </div>
          <p className="text-sm font-medium">Edificios</p>
          <p className="text-xs text-muted-foreground">{formatMXInt(waterFlow.usage[2].value / 1000)}k m³</p>
        </div>
        <div className="text-center">
          <div className="h-16 w-16 mx-auto mb-2 rounded-full bg-gray-600/20 flex items-center justify-center">
            <AlertTriangleIcon className="h-8 w-8 text-gray-700" />
          </div>
          <p className="text-sm font-medium">Pérdidas</p>
          <p className="text-xs text-muted-foreground">{formatMXInt(waterFlow.usage[3].value / 1000)}k m³</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      
      <div className="ml-64">
        <DashboardHeader />
        <main className="p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Balance Hídrico</h1>
                <p className="text-muted-foreground">Análisis integral del flujo de agua en el sistema</p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm">
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  Exportar Balance
                </Button>
                <Button variant="outline" size="sm">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Programar Reporte
                </Button>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Filtros de Análisis</h3>
                <div className="flex items-center gap-2">
                  <FilterIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Personalizar período</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Período</label>
                  <select 
                    value={timeFrame} 
                    onChange={(e) => setTimeFrame(e.target.value)}
                    className="w-full border border-muted rounded px-3 py-2 text-sm"
                  >
                    <option value="monthly">Mensual</option>
                    <option value="quarterly">Trimestral</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>
                {timeFrame !== 'yearly' && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">Año</label>
                    <select 
                      value={selectedYear} 
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="w-full border border-muted rounded px-3 py-2 text-sm"
                    >
                      <option value="2023">2023</option>
                      <option value="2024">2024</option>
                      <option value="2025">2025</option>
                    </select>
                  </div>
                )}
                <div className="flex items-end">
                  <Button 
                    variant={showFlow ? "default" : "outline"} 
                    onClick={() => setShowFlow(!showFlow)}
                    className="w-full"
                  >
                    <BarChart3Icon className="h-4 w-4 mr-2" />
                    {showFlow ? 'Ocultar' : 'Mostrar'} Flujo
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Métricas principales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Entrada Total</p>
                    <p className="text-2xl font-bold text-foreground">
                      {formatMXInt(totalInflow / 1000)}k m³
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <ArrowUpIcon className="h-4 w-4 text-blue-500" />
                      <span className="text-sm text-blue-500">+2.3% vs anterior</span>
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <ArrowDownIcon className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Salida Total</p>
                    <p className="text-2xl font-bold text-foreground">
                      {formatMXInt(totalOutflow / 1000)}k m³
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <ArrowUpIcon className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-500">+1.8% vs anterior</span>
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
                    <ArrowUpIcon className="h-6 w-6 text-red-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Balance Neto</p>
                    <p className="text-2xl font-bold text-foreground">
                      {formatMXInt(netBalance / 1000)}k m³
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUpIcon className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-500">{balancePercentage}% del total</span>
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                    <BarChart3Icon className="h-6 w-6 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Eficiencia</p>
                    <p className="text-2xl font-bold text-foreground">{efficiency}%</p>
                    <p className="text-sm text-green-500 mt-1">Excelente</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                    <Target className="h-6 w-6 text-yellow-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Diagrama de flujo */}
          {showFlow && (
            <Card className="mb-6">
              <CardHeader>
                <h3 className="text-lg font-semibold">Diagrama de Flujo del Sistema</h3>
              </CardHeader>
              <CardContent>
                <WaterFlowDiagram />
              </CardContent>
            </Card>
          )}

          {/* Gráficos principales */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">
                  Balance Hídrico - {timeFrame === 'monthly' ? 'Mensual' : timeFrame === 'quarterly' ? 'Trimestral' : 'Anual'}
                </h3>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ChartComponent 
                    data={balanceChartData} 
                    type="bar"
                    options={chartOptions}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Tendencia de Eficiencia</h3>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ChartComponent 
                    data={efficiencyChartData} 
                    type="line"
                    options={{
                      ...chartOptions,
                      scales: {
                        y: {
                          beginAtZero: false,
                          min: 90,
                          max: 100,
                          ticks: {
                            callback: function(value) {
                              return value + '%'
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Análisis detallado */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Desglose de entrada */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Entrada por Fuente</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Waves className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Pozos</span>
                    </div>
                    <span className="text-sm font-medium">{formatMXInt(waterBalance.inflow.pozos / 1000)}k m³</span>
                  </div>
                  <div className="ml-6 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(waterBalance.inflow.pozos / totalInflow * 100)}%` }}></div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Agua Municipal</span>
                    </div>
                    <span className="text-sm font-medium">{formatMXInt(waterBalance.inflow.municipal / 1000)}k m³</span>
                  </div>
                  <div className="ml-6 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${(waterBalance.inflow.municipal / totalInflow * 100)}%` }}></div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Factory className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">PTAR</span>
                    </div>
                    <span className="text-sm font-medium">{formatMXInt(waterBalance.inflow.ptar / 1000)}k m³</span>
                  </div>
                  <div className="ml-6 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${(waterBalance.inflow.ptar / totalInflow * 100)}%` }}></div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-red-500" />
                      <span className="text-sm">Pipas</span>
                    </div>
                    <span className="text-sm font-medium">{formatMXInt(waterBalance.inflow.pipas / 1000)}k m³</span>
                  </div>
                  <div className="ml-6 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: `${(waterBalance.inflow.pipas / totalInflow * 100)}%` }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Desglose de salida */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Salida por Uso</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DropletIcon className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Riego</span>
                    </div>
                    <span className="text-sm font-medium">{formatMXInt(waterBalance.outflow.riego / 1000)}k m³</span>
                  </div>
                  <div className="ml-6 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-green-600 rounded-full" style={{ width: `${(waterBalance.outflow.riego / totalOutflow * 100)}%` }}></div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ActivityIcon className="h-4 w-4 text-red-600" />
                      <span className="text-sm">Torres de Enfriamiento</span>
                    </div>
                    <span className="text-sm font-medium">{formatMXInt(waterBalance.outflow.torres / 1000)}k m³</span>
                  </div>
                  <div className="ml-6 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-red-600 rounded-full" style={{ width: `${(waterBalance.outflow.torres / totalOutflow * 100)}%` }}></div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-orange-600" />
                      <span className="text-sm">Edificios</span>
                    </div>
                    <span className="text-sm font-medium">{formatMXInt(waterBalance.outflow.edificios / 1000)}k m³</span>
                  </div>
                  <div className="ml-6 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-orange-600 rounded-full" style={{ width: `${(waterBalance.outflow.edificios / totalOutflow * 100)}%` }}></div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Factory className="h-4 w-4 text-purple-600" />
                      <span className="text-sm">Industria</span>
                    </div>
                    <span className="text-sm font-medium">{formatMXInt(waterBalance.outflow.industria / 1000)}k m³</span>
                  </div>
                  <div className="ml-6 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-purple-600 rounded-full" style={{ width: `${(waterBalance.outflow.industria / totalOutflow * 100)}%` }}></div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangleIcon className="h-4 w-4 text-gray-600" />
                      <span className="text-sm">Pérdidas</span>
                    </div>
                    <span className="text-sm font-medium">{formatMXInt(waterBalance.outflow.perdidas / 1000)}k m³</span>
                  </div>
                  <div className="ml-6 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-gray-600 rounded-full" style={{ width: `${(waterBalance.outflow.perdidas / totalOutflow * 100)}%` }}></div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Waves className="h-4 w-4 text-amber-600" />
                      <span className="text-sm">Evaporación</span>
                    </div>
                    <span className="text-sm font-medium">{formatMXInt(waterBalance.outflow.evaporacion / 1000)}k m³</span>
                  </div>
                  <div className="ml-6 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-amber-600 rounded-full" style={{ width: `${(waterBalance.outflow.evaporacion / totalOutflow * 100)}%` }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Indicadores de sostenibilidad */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Indicadores de Sostenibilidad</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Estrés Hídrico</span>
                      <span className="text-sm font-medium">{sustainability.waterStress}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${sustainability.waterStress}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Tasa de Reutilización</span>
                      <span className="text-sm font-medium">{sustainability.reuseRate}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${sustainability.reuseRate}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Tasa de Pérdidas</span>
                      <span className="text-sm font-medium">{sustainability.lossRate}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full" style={{ width: `${sustainability.lossRate}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Resiliencia del Sistema</span>
                      <span className="text-sm font-medium">{sustainability.resilience}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${sustainability.resilience}%` }}></div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Estado: Sostenible</span>
                    </div>
                    <p className="text-xs text-green-700 mt-1">
                      El sistema muestra un balance positivo y eficiencia óptima
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}

