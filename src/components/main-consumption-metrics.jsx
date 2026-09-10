import { formatMX } from '../utils/formatMX'
import { Card, CardContent, CardHeader } from "../components/ui/card"
import DashboardChart from "./DashboardChart"
import datosPozo12 from '../lib/datos_pozo_12.json'
import { useState } from 'react'
import { FilterIcon, TrendingUpIcon, AlertTriangleIcon } from 'lucide-react'

// Procesar datos de eficiencia del Pozo 12
const processEfficiencyData = () => {
  const lastYear = datosPozo12.especificaciones_anuales[datosPozo12.especificaciones_anuales.length - 1];
  const efficiency = Math.min((lastYear.consumo_real_m3 / lastYear.m3_disponibles_para_consumir * 100), 100);
  
  return [
    { name: "Efficiency", value: efficiency, fill: "hsl(var(--chart-2))" },
    { name: "Remaining", value: 100 - efficiency, fill: "hsl(var(--muted))" },
  ];
};

// Procesar datos de consumo mensual del último año con datos
const processConsumptionData = () => {
  const monthlyData = datosPozo12.datos_mensuales.consumo_mensual;
  const lastYearWithData = monthlyData.find(year => year.año === "2025 (ene–jun)") || monthlyData[monthlyData.length - 1];
  
  const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio'];
  const monthAbbrev = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
  
  return monthNames.map((month, index) => {
    const value = lastYearWithData[month];
    if (value !== null && value !== undefined) {
      return {
        name: monthAbbrev[index],
        value: Math.round(value / 1000) // Convertir a miles para mejor visualización
      };
    }
    return null;
  }).filter(Boolean);
};

export function MainConsumptionMetrics() {
  const [timeFrame, setTimeFrame] = useState('monthly') // 'monthly', 'quarterly', 'yearly'
  const [selectedYear, setSelectedYear] = useState('2025')
  const [comparisonMode, setComparisonMode] = useState(false)
  
  // Procesar datos dinámicamente según filtros
  const getFilteredConsumptionData = () => {
    switch (timeFrame) {
      case 'quarterly':
        const quarterlyData = datosPozo12.datos_trimestrales.consumo_trimestral;
        const yearData = quarterlyData.find(q => q.año.includes(selectedYear)) || quarterlyData[quarterlyData.length - 1];
        const quarters = ['primer_trimestre', 'segundo_trimestre', 'tercer_trimestre', 'cuarto_trimestre'];
        const quarterLabels = ['Q1', 'Q2', 'Q3', 'Q4'];
        
        return quarters.map((quarter, index) => {
          const value = yearData[quarter];
          if (value !== null && value !== undefined) {
            return {
              name: quarterLabels[index],
              value: Math.round(value / 1000)
            };
          }
          return null;
        }).filter(Boolean);
        
      case 'yearly':
        return datosPozo12.especificaciones_anuales.map(year => ({
          name: year.año.toString().replace('2025 (hasta mayo)', '2025'),
          value: Math.round(year.consumo_real_m3 / 1000)
        }));
        
      case 'monthly':
      default:
        const monthlyData = datosPozo12.datos_mensuales.consumo_mensual;
        const lastYearWithData = monthlyData.find(year => year.año.includes(selectedYear)) || monthlyData[monthlyData.length - 1];
        
        const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        const monthAbbrev = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        
        return monthNames.map((month, index) => {
          const value = lastYearWithData[month];
          if (value !== null && value !== undefined) {
            return {
              name: monthAbbrev[index],
              value: Math.round(value / 1000)
            };
          }
          return null;
        }).filter(Boolean);
    }
  };
  
  const efficiencyData = processEfficiencyData();
  const consumptionData = getFilteredConsumptionData();
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Main System Dashboard */}
      <Card className="bg-card border-border">
        <CardHeader className="bg-primary text-primary-foreground rounded-t-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm">1270.01</span>
            <span className="font-semibold">BlueMetrics</span>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Dashboard Principal del Sistema Hídrico</h2>
            <div className="flex items-center gap-2">
              <FilterIcon className="h-4 w-4 text-muted-foreground" />
              <select 
                value={timeFrame} 
                onChange={(e) => setTimeFrame(e.target.value)}
                className="text-xs border border-muted rounded px-2 py-1"
              >
                <option value="monthly">Mensual</option>
                <option value="quarterly">Trimestral</option>
                <option value="yearly">Anual</option>
              </select>
              {(timeFrame === 'monthly' || timeFrame === 'quarterly') && (
                <select 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="text-xs border border-muted rounded px-2 py-1"
                >
                  <option value="2022">2022</option>
                  <option value="2023">2023</option>
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                </select>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Consumo Diario</div>
              <div className="text-2xl font-bold text-foreground">
                {(() => {
                  const lastMonthConsumption = consumptionData.length > 0 ? consumptionData[consumptionData.length - 1].value * 1000 : 0;
                  const dailyAverage = Math.round(lastMonthConsumption / 30);
                  return `${formatMX(dailyAverage)} m³`;
                })()}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Consumo Semanal</div>
              <div className="text-2xl font-bold text-foreground">
                {(() => {
                  const weeklyData = datosPozo12.datos_semanales.consumo_semanal_detallado;
                  const lastWeek = weeklyData[weeklyData.length - 1];
                  return `${formatMX(Math.round(lastWeek?.total_pozos || 0))} m³`;
                })()}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-2">Eficiencia</div>
              <div className="relative w-20 h-20 mx-auto">
                {/* Círculo de progreso CSS */}
                <div className="relative w-20 h-20">
                  <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-gray-300"
                      strokeWidth="3"
                      stroke="currentColor"
                      fill="transparent"
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-blue-600"
                      strokeWidth="3"
                      strokeDasharray={`${efficiencyData[0].value}, 100`}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">
                      {Math.round(efficiencyData[0].value)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-sm text-muted-foreground mb-2">Consumo Mensual</div>
              <div className="text-3xl font-bold text-foreground">
                {(() => {
                  const lastMonthValue = consumptionData.length > 0 ? consumptionData[consumptionData.length - 1].value : 0;
                  return formatMX(lastMonthValue * 1000);
                })()}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-chart-1"></div>
                  <div className="w-2 h-2 rounded-full bg-chart-2"></div>
                  <div className="w-2 h-2 rounded-full bg-destructive"></div>
                </div>
                <span className="text-xs text-muted-foreground">{datosPozo12.pozo.id}</span>
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-2">
                Tendencia {timeFrame === 'monthly' ? 'Mensual' : timeFrame === 'quarterly' ? 'Trimestral' : 'Anual'}
                {(timeFrame === 'monthly' || timeFrame === 'quarterly') && (
                  <span className="text-xs text-muted-foreground ml-1">({selectedYear})</span>
                )}
              </div>
              <div className="h-16">
                <DashboardChart data={consumptionData} type="bar" height="100%" />
              </div>
            </div>
          </div>

          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <div className="text-destructive font-semibold text-sm mb-1">ALERTA CRÍTICA</div>
            <div className="text-sm text-foreground">
              {(() => {
                const lastYear = datosPozo12.especificaciones_anuales[datosPozo12.especificaciones_anuales.length - 1];
                const exceedPercent = ((lastYear.consumo_real_m3 / lastYear.m3_disponibles_para_consumir - 1) * 100).toFixed(0);
                return `${datosPozo12.pozo.id} ha excedido el límite anual en ${exceedPercent}%`;
              })()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Water Balance */}
      <Card className="bg-card border-border">
        <CardHeader className="bg-primary text-primary-foreground rounded-t-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm">Aucan'ti</span>
            <span className="font-semibold">BlueMetrics</span>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Balance Hídrico Integral</h2>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Origen del Agua</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-chart-1"></div>
                    <span className="text-sm">Pozos</span>
                  </div>
                  <span className="text-sm font-medium">45.000 m³</span>
                </div>
                <div className="ml-5 h-2 bg-chart-1/20 rounded-full overflow-hidden">
                  <div className="h-full w-3/4 bg-chart-1 rounded-full"></div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-chart-2"></div>
                    <span className="text-sm">Agua Filtrada</span>
                  </div>
                  <span className="text-sm font-medium">10.000 m³</span>
                </div>
                <div className="ml-5 h-2 bg-chart-2/20 rounded-full overflow-hidden">
                  <div className="h-full w-1/4 bg-chart-2 rounded-full"></div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-chart-3"></div>
                    <span className="text-sm">Agua y Drenaje</span>
                  </div>
                  <span className="text-sm font-medium">5.000 m³</span>
                </div>
                <div className="ml-5 h-2 bg-chart-3/20 rounded-full overflow-hidden">
                  <div className="h-full w-1/6 bg-chart-3 rounded-full"></div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Distribución del Uso</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Riego</span>
                  <span className="text-sm font-medium">3.000 m³</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full w-1/8 bg-secondary rounded-full"></div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Torres de Enfriamiento</span>
                  <span className="text-sm font-medium">16.000 m³</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full w-2/3 bg-primary rounded-full"></div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Edificios</span>
                  <span className="text-sm font-medium">5.000 m³</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full w-1/5 bg-chart-1 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
