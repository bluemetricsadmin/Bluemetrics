import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { DashboardHeader } from "../components/dashboard-header"
import { DashboardSidebar } from "../components/dashboard-sidebar"
import { Card, CardContent, CardHeader } from "../components/ui/card"
import { supabase } from '../supabaseClient'
import { getTopAndBottomConsumers, getPointConsumption } from "../utils/consumptionHelpers"
import consumptionPointsData from '../lib/consumption-points.json'
import { CalendarIcon, Loader2Icon, BarChart3Icon } from 'lucide-react'

import { RedirectIfNotAuth } from '../components/RedirectIfNotAuth';
import { useAuth } from '../contexts/AuthContextNew';

const CONSUMPTION_TABLE = 'lecturas_semana_agua_consumo_2026'

// Helper para forzar el formato mexicano
const formatMX = (value) => {
  if (value === null || value === undefined || isNaN(value)) return "0.00";
  return Number(value).toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

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

  const [selectedWeek, setSelectedWeek] = useState(null)
  const [availableWeeks, setAvailableWeeks] = useState([])
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Los 160 puntos de medición definidos en el catálogo
  const points = useMemo(() => {
    return (consumptionPointsData.categories || []).flatMap(cat => cat.points || [])
  }, [])

  // Cargar las filas de consumo semanal desde la tabla de 2026
  useEffect(() => {
    const fetchConsumptionData = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data, error: fetchError } = await supabase
          .from(CONSUMPTION_TABLE)
          .select('*')
          .order('l_numero_semana', { ascending: true })

        if (fetchError) {
          console.error('❌ Error cargando consumo:', fetchError)
          setError(fetchError.message)
          return
        }

        setRows(data || [])

        const weeks = (data || []).map(row => ({
          weekNumber: row.l_numero_semana,
          startDate: row.l_fecha_inicio,
          endDate: row.l_fecha_fin
        }))
        setAvailableWeeks(weeks)

        if (weeks.length > 0) {
          setSelectedWeek(weeks[weeks.length - 1].weekNumber)
        }
      } catch (err) {
        console.error('❌ Error al cargar datos:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchConsumptionData()
  }, [])

  // Construir weeklyData de cada punto a partir de las filas de consumo
  const pointsWithData = useMemo(() => {
    return points.map(point => {
      const weeklyData = rows.map(row => ({
        week: row.l_numero_semana,
        consumption: parseFloat(row[`l_${point.id}`]) || 0
      }))
      return {
        ...point,
        weeklyData
      }
    })
  }, [points, rows])

  // Top 5 / Bottom 5 según consumo de la semana seleccionada
  const globalTopBottom = useMemo(() => {
    if (!selectedWeek) return { top5: [], bottom5: [] }
    return getTopAndBottomConsumers(pointsWithData, selectedWeek)
  }, [pointsWithData, selectedWeek])

  const selectedWeekInfo = availableWeeks.find(w => w.weekNumber === selectedWeek)

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
                  Comparativa global de los 160 puntos de medición: los 5 de mayor y menor consumo por semana
                </p>
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
                  <p className="text-muted-foreground">No hay semanas disponibles en la tabla {CONSUMPTION_TABLE}</p>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/10 p-4">
                      <h4 className="text-sm font-semibold text-red-700 dark:text-red-300 mb-3">
                        Top 5 Mayor Consumo — Semana {selectedWeek}
                      </h4>
                      <ol className="space-y-2">
                        {globalTopBottom.top5.map((item, index) => (
                          <li key={item.id} className="flex items-center justify-between gap-2 text-sm">
                            <span className="flex items-center gap-2 min-w-0">
                              <span className="text-xs font-bold text-red-600 w-5 flex-shrink-0">{index + 1}.</span>
                              <span className="truncate text-foreground">{item.name}</span>
                            </span>
                            <span className="font-semibold text-red-700 dark:text-red-300 whitespace-nowrap">
                              {formatMX(getPointConsumption(item, selectedWeek))} m³
                            </span>
                          </li>
                        ))}
                        {globalTopBottom.top5.length === 0 && (
                          <li className="text-sm text-muted-foreground">Sin datos para esta semana</li>
                        )}
                      </ol>
                    </div>
                    <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-900/10 p-4">
                      <h4 className="text-sm font-semibold text-green-700 dark:text-green-300 mb-3">
                        Top 5 Menor Consumo — Semana {selectedWeek}
                      </h4>
                      <ol className="space-y-2">
                        {globalTopBottom.bottom5.map((item, index) => (
                          <li key={item.id} className="flex items-center justify-between gap-2 text-sm">
                            <span className="flex items-center gap-2 min-w-0">
                              <span className="text-xs font-bold text-green-600 w-5 flex-shrink-0">{index + 1}.</span>
                              <span className="truncate text-foreground">{item.name}</span>
                            </span>
                            <span className="font-semibold text-green-700 dark:text-green-300 whitespace-nowrap">
                              {formatMX(getPointConsumption(item, selectedWeek))} m³
                            </span>
                          </li>
                        ))}
                        {globalTopBottom.bottom5.length === 0 && (
                          <li className="text-sm text-muted-foreground">Sin datos para esta semana</li>
                        )}
                      </ol>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </main>
        </div>
      </div>
    </RedirectIfNotAuth>
  )
}