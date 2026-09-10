import { formatMX, formatMXInt } from '../utils/formatMX'
import { Card, CardContent } from "../components/ui/card"
import { dashboardData } from "../lib/dashboard-data"
import { 
  Droplets, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Activity,
  Gauge,
  DollarSign,
  Zap,
  Shield,
  Layers
} from "lucide-react"

export function DashboardSummary() {
  const formatCurrency = (amount) => `$${formatMX(amount)}`
  const formatPercentage = (value) => `${value}%`
  const getTrendIcon = (current, previous) => {
    if (current > previous) return <TrendingUp className="w-3 h-3 text-green-500" />
    return <TrendingUp className="w-3 h-3 text-red-500 rotate-180" />
  }

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-6 mb-6">
      {/* Fila Principal */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Droplets className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-muted-foreground">Consumo Total</div>
              <div className="text-lg font-bold text-foreground">
                {formatMXInt(dashboardData.stats.totalConsumption / 1000)}k m³
              </div>
              <div className="flex items-center gap-1 text-xs">
                {getTrendIcon(dashboardData.stats.totalConsumption, 75000)}
                <span className="text-muted-foreground">vs mes anterior</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-secondary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-muted-foreground">Eficiencia</div>
              <div className="text-lg font-bold text-foreground">
                {formatPercentage(dashboardData.consumption.efficiency)}
              </div>
              <div className="text-xs text-green-600">+2.4% este mes</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-muted-foreground">Alertas Activas</div>
              <div className="text-lg font-bold text-foreground">
                {dashboardData.stats.activeAlerts}
              </div>
              <div className="text-xs text-muted-foreground">
                {dashboardData.alerts.filter(a => a.type === "critical").length} críticas
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-chart-1/10 rounded-lg">
              <CheckCircle className="w-5 h-5 text-chart-1" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-muted-foreground">IA Precisión</div>
              <div className="text-lg font-bold text-foreground">
                {formatPercentage(dashboardData.stats.aiPrecision)}
              </div>
              <div className="text-xs text-green-600">+1.2% mejora</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-chart-2/10 rounded-lg">
              <Activity className="w-5 h-5 text-chart-2" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-muted-foreground">Pozos Activos</div>
              <div className="text-lg font-bold text-foreground">
                {dashboardData.stats.activeWells}/{dashboardData.stats.totalWells}
              </div>
              <div className="text-xs text-muted-foreground">
                {dashboardData.stats.maintenanceScheduled} en mantenim.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-chart-3/10 rounded-lg">
              <Gauge className="w-5 h-5 text-chart-3" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-muted-foreground">Uptime Sistema</div>
              <div className="text-lg font-bold text-foreground">
                {formatPercentage(dashboardData.stats.systemUptime)}
              </div>
              <div className="text-xs text-green-600">Excelente</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fila Secundaria */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-muted-foreground">Ahorro Mensual</div>
              <div className="text-lg font-bold text-foreground">
                {formatCurrency(dashboardData.stats.savingsAchieved)}
              </div>
              <div className="text-xs text-green-600">
                Meta: {formatCurrency(dashboardData.stats.monthlyBudget - dashboardData.stats.actualCost)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Zap className="w-5 h-5 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-muted-foreground">Efic. Energética</div>
              <div className="text-lg font-bold text-foreground">
                {formatPercentage(dashboardData.stats.energyEfficiency)}
              </div>
              <div className="text-xs text-blue-600">Optimizado</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-muted-foreground">Calidad Agua</div>
              <div className="text-lg font-bold text-foreground">
                {formatPercentage(dashboardData.stats.waterQualityIndex)}
              </div>
              <div className="text-xs text-purple-600">Excelente</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Layers className="w-5 h-5 text-orange-600" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-muted-foreground">Diversificación</div>
              <div className="text-lg font-bold text-foreground">
                {dashboardData.stats.sourceDiversification}
              </div>
              <div className="text-xs text-orange-600">fuentes activas</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-muted-foreground">Tiempo Respuesta</div>
              <div className="text-lg font-bold text-foreground">
                {dashboardData.stats.emergencyResponseTime} min
              </div>
              <div className="text-xs text-emerald-600">Bajo meta</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Activity className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-muted-foreground">Huella Carbono</div>
              <div className="text-lg font-bold text-foreground">
                {dashboardData.stats.carbonFootprint} tCO₂
              </div>
              <div className="text-xs text-indigo-600">-5% este año</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
