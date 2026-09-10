import { formatMX } from '../utils/formatMX'
import { Card, CardContent, CardHeader } from "../components/ui/card"
import DashboardChart from "./DashboardChart"
import datosPozo12 from '../lib/datos_pozo_12.json'
import { dashboardData } from '../lib/dashboard-data'
import { useState } from 'react'
import { FilterIcon, CalendarIcon } from 'lucide-react'

// Procesar datos semanales del JSON
const processWeeklyData = () => {
  const weeklyData = datosPozo12.datos_semanales.consumo_semanal_detallado;
  const recentWeeks = weeklyData.slice(-6); // Últimas 6 semanas
  
  return recentWeeks.map(week => ({
    name: week.periodo.split(' ')[2] + ' ' + week.periodo.split(' ')[3], // Mes Año
    actual: Math.round(week.total_pozos / 1000), // Convertir a miles para mejor visualización
    target: 50, // Meta fija de 50k m³
    consumo_servicios: week.consumo_servicios,
    consumo_riego: week.consumo_riego,
    total_pozos: week.total_pozos
  }));
};

// Procesar lecturas semanales para el gráfico histórico
const processHistoricalData = () => {
  const readings = datosPozo12.datos_semanales.lecturas_acumuladas;
  const recent30 = readings.slice(-30); // Últimas 30 lecturas
  
  return recent30.map((reading, index) => ({
    day: index + 1,
    consumption: Math.round((reading.lectura || 0) / 1000), // Convertir a miles
    fecha: reading.fecha
  }));
};

export function WellMonitoringCharts() {
  const [weeklyFilter, setWeeklyFilter] = useState('recent') // 'recent', 'all', 'range'
  const [weeklyRange, setWeeklyRange] = useState(6) // Número de semanas
  const [selectedYear, setSelectedYear] = useState('2022') // Año seleccionado
  
  // Procesar datos dinámicamente según filtros
  const getFilteredWeeklyData = () => {
    const weeklyData = datosPozo12.datos_semanales.consumo_semanal_detallado;
    
    switch (weeklyFilter) {
      case 'recent':
        return weeklyData.slice(-weeklyRange);
      case 'all':
        return weeklyData;
      case 'range':
        // Filtrar por año seleccionado
        return weeklyData.filter(week => week.periodo.includes(selectedYear));
      default:
        return weeklyData.slice(-6);
    }
  };
  
  const getFilteredHistoricalData = () => {
    const readings = datosPozo12.datos_semanales.lecturas_acumuladas;
    const filteredReadings = readings.filter(reading => 
      reading.fecha.includes(selectedYear) || weeklyFilter === 'all'
    );
    
    const dataToUse = weeklyFilter === 'all' ? 
      filteredReadings.slice(-30) : 
      filteredReadings.slice(-weeklyRange);
    
    return dataToUse.map((reading, index) => ({
      day: index + 1,
      consumption: Math.round((reading.lectura || 0) / 1000),
      fecha: reading.fecha
    }));
  };
  
  const wellConsumptionData = getFilteredWeeklyData().map(week => ({
    name: week.periodo.split(' ')[2] + ' ' + week.periodo.split(' ')[3],
    actual: Math.round(week.total_pozos / 1000),
    target: 50,
    consumo_servicios: week.consumo_servicios,
    consumo_riego: week.consumo_riego,
    total_pozos: week.total_pozos
  }));
  
  const historicalData = getFilteredHistoricalData();
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Well Visualization */}
      <Card className="bg-card border-border">
        <CardHeader className="bg-primary text-primary-foreground rounded-t-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm">25 mar 24</span>
            <span className="font-semibold">BlueMetrics</span>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Visualización por Pozo</h2>
            <div className="flex items-center gap-2">
              <FilterIcon className="h-4 w-4 text-muted-foreground" />
              <select 
                value={weeklyFilter} 
                onChange={(e) => setWeeklyFilter(e.target.value)}
                className="text-xs border border-muted rounded px-2 py-1"
              >
                <option value="recent">Recientes</option>
                <option value="range">Por Año</option>
                <option value="all">Todos</option>
              </select>
              {weeklyFilter === 'recent' && (
                <select 
                  value={weeklyRange} 
                  onChange={(e) => setWeeklyRange(Number(e.target.value))}
                  className="text-xs border border-muted rounded px-2 py-1"
                >
                  <option value={6}>6 semanas</option>
                  <option value={12}>12 semanas</option>
                  <option value={24}>24 semanas</option>
                </select>
              )}
              {weeklyFilter === 'range' && (
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

          <div className="mb-6">
            <div className="text-sm text-muted-foreground mb-1">{datosPozo12.pozo.id}</div>
            <div className="text-sm text-muted-foreground mb-2">Consumo Semanal vs. Meta</div>
            <div className="text-3xl font-bold text-foreground mb-4">
              {wellConsumptionData.length > 0 ? 
                `${formatMX(wellConsumptionData[wellConsumptionData.length - 1].actual * 1000)} m³` 
                : '0 m³'
              }
            </div>
          </div>

          <div className="mb-6">
            <div className="h-32">
              <DashboardChart data={wellConsumptionData} type="bar" height="100%" />
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-chart-2"></div>
                <span className="text-xs text-muted-foreground">Meta</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Mostrando {wellConsumptionData.length} semanas de datos - {weeklyFilter === 'range' ? `Año ${selectedYear}` : weeklyFilter === 'all' ? 'Todos los datos' : `Últimas ${weeklyRange} semanas`}
              </div>
            </div>
          </div>

          <div className="mb-4">
            <div className="text-sm text-muted-foreground mb-2">Historial de Consumo</div>
            <div className="text-sm text-muted-foreground">(Últimos 30 Días)</div>
          </div>
        </CardContent>
      </Card>

      {/* Well Status and Performance */}
      <Card className="bg-card border-border">
        <CardHeader className="bg-primary text-primary-foreground rounded-t-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm">{datosPozo12.pozo.id}</span>
            <span className="font-semibold">BlueMetrics</span>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Estado del Pozo</h2>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">12</div>
              <div className="text-sm text-muted-foreground">Pozo Activo</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary">
                {(() => {
                  const lastYear = datosPozo12.especificaciones_anuales[datosPozo12.especificaciones_anuales.length - 1];
                  const efficiency = (lastYear.consumo_real_m3 / lastYear.m3_disponibles_para_consumir * 100).toFixed(0);
                  return `${Math.min(efficiency, 100)}%`;
                })()}
              </div>
              <div className="text-sm text-muted-foreground">Eficiencia</div>
            </div>
          </div>

          <div className="mb-6">
            <div className="text-sm text-muted-foreground mb-2">
              Tendencia de Lecturas ({historicalData.length} registros)
            </div>
            <div className="h-24">
              <DashboardChart data={historicalData} type="area" height="100%" />
            </div>
          </div>

          <div className="space-y-3">
            {(() => {
              const currentWell = datosPozo12.pozo;
              const wellFromData = dashboardData.wells.find(w => w.id === currentWell.id);
              
              const getStatusColor = (status) => {
                switch(status) {
                  case 'normal': return 'secondary';
                  case 'warning': return 'chart-3';
                  case 'alert': return 'destructive';
                  case 'inactive': return 'muted';
                  default: return 'secondary';
                }
              };
              
              const getLevelColor = (level) => {
                switch(level) {
                  case 'high': return 'chart-1';
                  case 'normal': return 'secondary';
                  case 'low': return 'chart-3';
                  default: return 'secondary';
                }
              };
              
              const getLimitColor = (limit) => {
                switch(limit) {
                  case 'normal': return 'secondary';
                  case 'approaching': return 'chart-3';
                  case 'exceeded': return 'destructive';
                  default: return 'secondary';
                }
              };
              
              return (
                <>
                  <div className={`flex items-center justify-between p-3 bg-${getStatusColor(wellFromData?.status)}/10 rounded-lg`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full bg-${getStatusColor(wellFromData?.status)}`}></div>
                      <span className="text-sm font-medium">Estado Operativo</span>
                    </div>
                    <span className={`text-sm text-${getStatusColor(wellFromData?.status)} font-medium capitalize`}>
                      {wellFromData?.status || 'Normal'}
                    </span>
                  </div>

                  <div className={`flex items-center justify-between p-3 bg-${getLevelColor(wellFromData?.waterLevel)}/10 rounded-lg`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full bg-${getLevelColor(wellFromData?.waterLevel)}`}></div>
                      <span className="text-sm font-medium">Nivel de Agua</span>
                    </div>
                    <span className={`text-sm text-${getLevelColor(wellFromData?.waterLevel)} font-medium capitalize`}>
                      {wellFromData?.waterLevel || 'Normal'}
                    </span>
                  </div>

                  <div className={`flex items-center justify-between p-3 bg-${getLimitColor(wellFromData?.dailyLimit)}/10 rounded-lg`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full bg-${getLimitColor(wellFromData?.dailyLimit)}`}></div>
                      <span className="text-sm font-medium">Límite Diario</span>
                    </div>
                    <span className={`text-sm text-${getLimitColor(wellFromData?.dailyLimit)} font-medium capitalize`}>
                      {wellFromData?.dailyLimit === 'exceeded' ? 'Excedido' : 
                       wellFromData?.dailyLimit === 'approaching' ? 'Cerca del límite' : 'Normal'}
                    </span>
                  </div>

                  {wellFromData && (
                    <>
                      <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-primary"></div>
                          <span className="text-sm font-medium">Profundidad</span>
                        </div>
                        <span className="text-sm text-primary font-medium">{wellFromData.depth}m</span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-chart-2"></div>
                          <span className="text-sm font-medium">Capacidad Máx.</span>
                        </div>
                        <span className="text-sm text-chart-2 font-medium">{wellFromData.maxCapacity} m³/h</span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-muted-foreground"></div>
                          <span className="text-sm font-medium">Último Mant.</span>
                        </div>
                        <span className="text-sm text-muted-foreground font-medium">
                          {new Date(wellFromData.lastMaintenance).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                    </>
                  )}
                </>
              );
            })()}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
