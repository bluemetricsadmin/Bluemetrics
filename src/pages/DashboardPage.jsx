import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { DashboardHeader } from "../components/dashboard-header"
import { DashboardSidebar } from "../components/dashboard-sidebar"
import { Card, CardContent, CardHeader } from "../components/ui/card"
import { CalendarIcon, Loader2Icon, BarChart3Icon, FlameIcon, Droplet } from 'lucide-react'

import { RedirectIfNotAuth } from '../components/RedirectIfNotAuth';
import { useAuth } from '../contexts/AuthContextNew';
import YearConsumptionTable from '../components/YearConsumptionTable';
import { useDashboardTopBottom } from '../hooks/useDashboardTopBottom'
import { WATER_CONSUMPTION_TABLE } from '../services/dashboardConsumption'
import { formatMX, formatMXPercent } from '../utils/formatMX'

function TopBottomTable({ title, entries, week, previousWeek, accent }) {
  const isRed = accent === 'red'
  const wrapper = isRed
    ? 'border-red-200 bg-red-50 dark:bg-red-900/10'
    : 'border-green-200 bg-green-50 dark:bg-green-900/10'
  const heading = isRed
    ? 'text-red-700 dark:text-red-300'
    : 'text-green-700 dark:text-green-300'
  const rank = isRed ? 'text-red-600' : 'text-green-600'
  const value = isRed
    ? 'text-red-700 dark:text-red-300'
    : 'text-green-700 dark:text-green-300'
  const totalBorder = isRed ? 'border-red-300' : 'border-green-300'

  const totals = entries.reduce(
    (acc, item) => {
      acc.previous += item.previous
      acc.current += item.current
      acc.difference += item.difference
      return acc
    },
    { previous: 0, current: 0, difference: 0 }
  )
  const totalPercent = totals.previous !== 0
    ? (totals.difference / totals.previous) * 100
    : null

  return (
    <div className={`rounded-lg border p-4 ${wrapper}`}>
      <h4 className={`text-sm font-semibold mb-3 ${heading}`}>{title}</h4>
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin datos para esta semana</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground">
                <th className="text-left font-medium pb-2 pr-2">Punto</th>
                <th className="text-right font-medium pb-2 px-2 whitespace-nowrap">Sem. {previousWeek}</th>
                <th className="text-right font-medium pb-2 px-2 whitespace-nowrap">Sem. {week}</th>
                <th className="text-right font-medium pb-2 px-2 whitespace-nowrap">Diferencia (m³)</th>
                <th className="text-right font-medium pb-2 pl-2 whitespace-nowrap">% Dif.</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((item, index) => (
                <tr key={item.id} className="border-t border-black/5 dark:border-white/5">
                  <td className="py-1.5 pr-2">
                    <span className="flex items-center gap-2 min-w-0">
                      <span className={`text-xs font-bold w-4 flex-shrink-0 ${rank}`}>{index + 1}.</span>
                      <span className="truncate text-foreground" title={item.name}>{item.name}</span>
                    </span>
                  </td>
                  <td className="py-1.5 px-2 text-right text-muted-foreground whitespace-nowrap">
                    {formatMX(item.previous)}
                  </td>
                  <td className="py-1.5 px-2 text-right font-medium whitespace-nowrap">
                    {formatMX(item.current)}
                  </td>
                  <td className={`py-1.5 px-2 text-right font-semibold whitespace-nowrap ${value}`}>
                    {formatMX(item.difference)}
                  </td>
                  <td className="py-1.5 pl-2 text-right whitespace-nowrap">
                    {item.percent === null ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <span className={
                        item.percent > 0
                          ? 'text-red-600 dark:text-red-400'
                          : item.percent < 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-muted-foreground'
                      }>
                        {formatMXPercent(item.percent)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className={`border-t-2 ${totalBorder}`}>
                <td className="py-2 pr-2 font-semibold text-foreground">Total</td>
                <td className="py-2 px-2 text-right font-semibold text-muted-foreground whitespace-nowrap">
                  {formatMX(totals.previous)}
                </td>
                <td className="py-2 px-2 text-right font-semibold whitespace-nowrap">
                  {formatMX(totals.current)}
                </td>
                <td className={`py-2 px-2 text-right font-bold whitespace-nowrap ${value}`}>
                  {formatMX(totals.difference)}
                </td>
                <td className="py-2 pl-2 text-right font-semibold whitespace-nowrap">
                  {totalPercent === null ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <span className={
                      totalPercent > 0
                        ? 'text-red-600 dark:text-red-400'
                        : totalPercent < 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-muted-foreground'
                    }>
                      {formatMXPercent(totalPercent)}
                    </span>
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  // Redirigir usuarios con rol "datos" directamente a lecturas semanales
  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === 'datos') {
        navigate('/agregar-lecturas', { replace: true })
      }
    }
  }, [user, authLoading, navigate])

  const {
    points,
    gasPoints,
    loading,
    error,
    gasLoading,
    gasError,
    selectedWeek,
    setSelectedWeek,
    availableWeeks,
    selectedWeekInfo,
    previousWeek,
    globalTopBottom,
    gasTopBottom,
  } = useDashboardTopBottom()

  return (
    <RedirectIfNotAuth>
      <div className="min-h-screen bg-background">
        <DashboardSidebar />

        <div className="ml-64">
          <DashboardHeader />
          <main className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
                  <BarChart3Icon className="h-8 w-8 text-primary" />
                  Dashboard de Consumo
                </h1>
                <p className="text-muted-foreground">
                  Comparativa global de puntos de medición seleccionados: los 5 de mayor y menor diferencia de consumo entre la semana anterior y la semana seleccionada
                </p>
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2 mb-2">
                <Droplet className="h-6 w-6 text-blue-500" />
                Comparativa de Consumo de Agua
              </h2>
                
              </div>

              {/* Selector de semana */}
              
              <div className="flex items-center gap-3">
              
                <label className="text-sm font-semibold text-foreground whitespace-nowrap flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  Semana:
                </label>
                <select
                  value={selectedWeek ?? ''}
                  onChange={(e) => setSelectedWeek(Number(e.target.value))}
                  disabled={loading || availableWeeks.length === 0}
                  className="border border-muted rounded-lg px-3 py-2 text-sm bg-background hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors min-w-[220px]"
                >
                  {availableWeeks.length === 0 && <option value="">Sin semanas disponibles</option>}
                  {availableWeeks.map(week => (
                    <option key={week.weekNumber} value={week.weekNumber}>
                      Semana {week.weekNumber} — {week.startDate} a {week.endDate}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <Card>
                <CardContent className="py-16 flex flex-col items-center justify-center gap-3">
                  <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-muted-foreground">Cargando datos de consumo...</p>
                </CardContent>
              </Card>
            ) : error ? (
              <Card>
                <CardContent className="py-16 flex flex-col items-center justify-center text-center">
                  <p className="text-lg font-semibold text-destructive mb-2">Error al cargar los datos</p>
                  <p className="text-sm text-muted-foreground">{error}</p>
                </CardContent>
              </Card>
            ) : !selectedWeek ? (
              <Card>
                <CardContent className="py-16 flex flex-col items-center justify-center text-center">
                  <p className="text-muted-foreground">No hay semanas disponibles en la tabla {WATER_CONSUMPTION_TABLE}</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Comparativa Global — Semana {selectedWeek}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {points.length} puntos de medición considerados
                        {selectedWeekInfo && ` · ${selectedWeekInfo.startDate} a ${selectedWeekInfo.endDate}`}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <TopBottomTable
                      title={`Top 5 Mayor Diferencia — Semana ${previousWeek} vs ${selectedWeek}`}
                      entries={globalTopBottom.top5}
                      week={selectedWeek}
                      previousWeek={previousWeek}
                      accent="red"
                    />
                    <TopBottomTable
                      title={`Top 5 Menor Diferencia — Semana ${previousWeek} vs ${selectedWeek}`}
                      entries={globalTopBottom.bottom5}
                      week={selectedWeek}
                      previousWeek={previousWeek}
                      accent="green"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
  
    <div className="mt-8">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2 mb-4">
                <FlameIcon className="h-6 w-6 text-orange-500" />
                Comparativa de Consumo de Gas
              </h2>
              {gasLoading ? (
                <Card>
                  <CardContent className="py-16 flex flex-col items-center justify-center gap-3">
                    <Loader2Icon className="h-8 w-8 animate-spin text-orange-500" />
                    <p className="text-muted-foreground">Cargando datos de consumo de gas...</p>
                  </CardContent>
                </Card>
              ) : gasError ? (
                <Card>
                  <CardContent className="py-16 flex flex-col items-center justify-center text-center">
                    <p className="text-lg font-semibold text-destructive mb-2">Error al cargar los datos de gas</p>
                    <p className="text-sm text-muted-foreground">{gasError}</p>
                  </CardContent>
                </Card>
              ) : gasPoints.length === 0 ? (
                <Card>
                  <CardContent className="py-16 flex flex-col items-center justify-center text-center">
                    <p className="text-muted-foreground">No hay puntos de gas en la lista de seleccionados</p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">Comparativa Global de Gas — Semana {selectedWeek}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {gasPoints.length} puntos de gas considerados
                          {selectedWeekInfo && ` · ${selectedWeekInfo.startDate} a ${selectedWeekInfo.endDate}`}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <TopBottomTable
                        title={`Top 5 Mayor Diferencia de Gas — Semana ${previousWeek} vs ${selectedWeek}`}
                        entries={gasTopBottom.top5}
                        week={selectedWeek}
                        previousWeek={previousWeek}
                        accent="red"
                      />
                      <TopBottomTable
                        title={`Top 5 Menor Diferencia de Gas — Semana ${previousWeek} vs ${selectedWeek}`}
                        entries={gasTopBottom.bottom5}
                        week={selectedWeek}
                        previousWeek={previousWeek}
                        accent="green"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

 
            {/* Comparativa de gas */}
           <YearConsumptionTable />
          </main>
        </div>
      </div>
    </RedirectIfNotAuth>
  )
}