import { formatMX } from '../utils/formatMX'
import { Card, CardContent, CardHeader } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { AlertTriangle, AlertCircle, Info, CheckCircle, X, Bell, MapPin, Clock, Activity } from "lucide-react"
import { dashboardData } from '../lib/dashboard-data'

const alerts = dashboardData.alerts || []
const recommendations = dashboardData.recommendations || []

function getAlertIcon(type) {
  switch (type) {
    case "critical":
      return <AlertTriangle className="w-4 h-4" />
    case "warning":
      return <AlertCircle className="w-4 h-4" />
    case "info":
      return <Info className="w-4 h-4" />
    case "success":
      return <CheckCircle className="w-4 h-4" />
    default:
      return <Bell className="w-4 h-4" />
  }
}

function getAlertColor(type) {
  switch (type) {
    case "critical":
      return "text-destructive bg-destructive/10 border-destructive/20"
    case "warning":
      return "text-orange-600 bg-orange-50 border-orange-200"
    case "info":
      return "text-blue-600 bg-blue-50 border-blue-200"
    case "success":
      return "text-secondary bg-secondary/10 border-secondary/20"
    default:
      return "text-muted-foreground bg-muted border-border"
  }
}

function getPriorityColor(priority) {
  switch (priority) {
    case "high":
      return "destructive"
    case "medium":
      return "secondary"
    case "low":
      return "outline"
    default:
      return "outline"
  }
}

export function AlertsRecommendationsSystem() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Alerts Panel */}
      <Card className="bg-card border-border">
        <CardHeader className="bg-primary text-primary-foreground rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <span className="font-semibold">Alertas del Sistema</span>
            </div>
            <Badge variant="secondary" className="bg-primary-foreground text-primary">
              {alerts.filter((a) => a.status === "active").length} Activas
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {alerts.slice(0, 6).map((alert) => (
              <div key={alert.id} className={`p-4 rounded-lg border ${getAlertColor(alert.type)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <div className="font-medium text-sm mb-1">{alert.title}</div>
                      <div className="text-sm opacity-90 mb-2">{alert.message}</div>
                      <div className="flex items-center gap-4 text-xs opacity-70">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {alert.timestamp}
                        </div>
                        {alert.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {alert.location}
                          </div>
                        )}
                      </div>
                      {alert.affectedSystems && alert.affectedSystems.length > 0 && (
                        <div className="flex items-center gap-1 mt-2">
                          <Activity className="w-3 h-3 opacity-50" />
                          <div className="text-xs opacity-70">
                            Afecta: {alert.affectedSystems.join(", ")}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="text-xs bg-transparent">
                      {alert.action}
                    </Button>
                    <Button size="sm" variant="ghost" className="p-1">
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-border">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-destructive">
                  {alerts.filter(a => a.type === "critical" && a.status === "active").length}
                </div>
                <div className="text-xs text-muted-foreground">Críticas</div>
              </div>
              <div>
                <div className="text-lg font-bold text-orange-600">
                  {alerts.filter(a => a.type === "warning" && a.status === "active").length}
                </div>
                <div className="text-xs text-muted-foreground">Advertencias</div>
              </div>
              <div>
                <div className="text-lg font-bold text-blue-600">
                  {alerts.filter(a => a.type === "info").length}
                </div>
                <div className="text-xs text-muted-foreground">Info</div>
              </div>
              <div>
                <div className="text-lg font-bold text-secondary">
                  {alerts.filter(a => a.status === "resolved").length}
                </div>
                <div className="text-xs text-muted-foreground">Resueltas</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations Panel */}
      <Card className="bg-card border-border">
        <CardHeader className="bg-primary text-primary-foreground rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span className="font-semibold">Recomendaciones IA</span>
            </div>
            <Badge variant="secondary" className="bg-primary-foreground text-primary">
              94% Precisión
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {recommendations.slice(0, 5).map((rec) => (
              <div key={rec.id} className="p-4 bg-muted/30 rounded-lg border border-border">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={getPriorityColor(rec.priority)} className="text-xs">
                        {rec.priority.toUpperCase()}
                      </Badge>
                      <span className="font-medium text-sm">{rec.title}</span>
                      {rec.category && (
                        <Badge variant="outline" className="text-xs">
                          {rec.category}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">{rec.description}</div>
                    <div className="text-xs text-secondary font-medium mb-2">{rec.impact}</div>
                    {rec.estimatedSavings && (
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div>💧 Ahorro: {rec.estimatedSavings} m³</div>
                        <div>⏱️ Tiempo: {rec.implementationTime}</div>
                        <div>🔧 Dificultad: {rec.difficulty}</div>
                      </div>
                    )}
                  </div>
                  <Button size="sm" variant="outline" className="text-xs ml-4 bg-transparent">
                    {rec.action}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-border">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-primary">
                  {recommendations.filter(r => r.priority === 'high').length}
                </div>
                <div className="text-xs text-muted-foreground">Alta Prioridad</div>
              </div>
              <div>
                <div className="text-lg font-bold text-chart-1">
                  {recommendations.filter(r => r.priority === 'medium').length}
                </div>
                <div className="text-xs text-muted-foreground">Media Prioridad</div>
              </div>
              <div>
                <div className="text-lg font-bold text-secondary">
                  {dashboardData.stats.implementedRecommendations}
                </div>
                <div className="text-xs text-muted-foreground">Implementadas</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-muted/30">
              <div className="text-sm text-center">
                <span className="text-muted-foreground">Ahorro Total Estimado: </span>
                <span className="font-semibold text-primary">
                  {formatMX(recommendations.reduce((acc, rec) => acc + (rec.estimatedSavings || 0), 0))} m³/mes
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
