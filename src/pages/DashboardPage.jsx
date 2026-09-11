import { formatMX } from '../utils/formatMX'
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { DashboardHeader } from "../components/dashboard-header"
import { DashboardSidebar } from "../components/dashboard-sidebar"
import { Card, CardContent, CardHeader } from "../components/ui/card"
import { supabase } from '../supabaseClient'
import { getTopAndBottomConsumers, getPointConsumption } from "../utils/consumptionHelpers"
import consumptionPointsData from '../lib/consumption-points.json'
import gasConsumptionPointsData from '../lib/gas-consumption-points.json'
import { CalendarIcon, Loader2Icon, BarChart3Icon, FlameIcon, Droplet } from 'lucide-react'

import { RedirectIfNotAuth } from '../components/RedirectIfNotAuth';
import { useAuth } from '../contexts/AuthContextNew';

const CONSUMPTION_TABLE = 'lecturas_semana_agua_consumo_2026'
const GAS_CONSUMPTION_TABLE = 'lecturas_semanales_gas_consumo_2026'

const SELECTED_POINT_IDS = [
  'l_auditorio_luis_elizondo',
  'l_cdb2',
  'l_cdb2_banos_nuevos_2025',
  'l_arena_borrego',
  'l_lago_aulas_7_llenado',
  'l_edificio_negocios_daf',
  'l_aulas_6',
  'l_domo_cultural',
  'l_wellness_registro',
  'l_parque_central_registro',
  'l_wellness_edificio',
  'l_wellness_torre_enfriamiento',
  'l_wellness_alberca',
  'l_centrales_comedor_1_principal',
  'l_administrativo',
  'l_biotecnologia',
  'l_ciap_oriente',
  'l_ciap_centro',
  'l_ciap_poniente',
  'l_ciap_andatti',
  'l_aulas_5',
  'l_ciap_starbucks',
  'l_ciap_super_salads',
  'l_ciap_sotano',
  'l_reflexion',
  'l_residencias_10_15',
  'l_caffenio',
  'l_cedes_cisterna',
  'l_san_huevito',
  'l_cedes_site',
  'l_cedes_site_bomba',
  'l_nucleo',
  'l_expedition',
  'l_expedition_bread',
  'l_expedition_matthew',
  'l_hub',
  'l_aulas_1',
  'l_rectoria_norte',
  'l_pabellon_la_carreta',
  'l_aulas_2',
  'l_cetec',
  'l_biblioteca',
  'l_biblioteca_tim_horton',
  'l_aulas_3',
  'l_aulas_3_sr_latino',
  'l_centrales_sur',
  'l_aulas_4_norte',
  'l_aulas_4_centro',
  'l_residencias_2_ote',
  'l_residencias_3',
  'l_residencias_5',
  'l_correos',
  'l_residencias_abc',
  'l_residencias_abc_lavanderia',
  'l_mil_mascaras',
  'l_aulas_7',
  'l_la_dia',
  'l_aulas_4_sur',
  'l_cdi_1',
  'l_aulas_4_maestros',
  'l_cdi_2',
  'l_centro_congresos',
  'l_jubileo',
  'l_aulas_4_oxxo',
  'l_escamilla_banos_trabajadores',
  'l_estadio_banorte',
  'l_estadio_banorte_te',
  'l_campus_norte_edificios_ciudad',
  'l_estadio_azul',
  'l_comedor_d_ciudad',
  'l_purgas_evaporacion',
  'l_wellness_suavizador_purga',
  'l_wellness_te_purga',
  'l_wellness_te_rebosadero',
  'l_residencias_10_15_te_purga',
  'l_ciap_cisterna_pluvial',
  'l_campo_soft_bol',
  'l_guarderia',
  'l_naranjos',
  'l_casa_solar',
  'l_residencias_15_sotano'
]

const GAS_SELECTED_POINT_IDS = [
  'l_domo_cultural',
  'l_centrales_local',
  'l_dona_tota',
  'l_chilaquiles_tec',
  'l_carls_junior',
  'l_comedor_centrales_tec_food',
  'l_davilas_grill_team',
  'l_pizza_little_caesars',
  'l_biotecnologia',
  'l_caldera_1_leon',
  'l_ciap_super_salads',
  'l_aulas_1',
  'l_biblioteca',
  'l_nikkori',
  'l_nectar_works',
  'l_sr_latino',
  'l_arena_borrego',
  'l_calefaccion_1_bryan',
  'l_calefaccion_2_aerco',
  'l_caldera_3',
  'l_aulas_7',
  'l_la_dia',
  'l_aulas_4',
  'l_centro_congresos_vestidores',
  'l_jubileo',
  'l_expedition',
  'l_bread_expedition',
  'l_matthew_expedition',
  'l_cedes',
  'l_residencias_2',
  'l_residencias_5',
  'l_residencias_3',
  'l_residencias_abc_calefaccion',
  'l_residencias_abc_regaderas',
  'l_residencias_abc_locales_comida',
  'l_campus_norte_edificio_d_calefaccion',
  'l_campus_norte_comedor_d',
  'l_wellness_supersalads',
  'l_wellness_general_calefaccion',
  'l_wellness_calentador_sotano_regaderas',
  'l_wellness_alberca',
  'l_auditorio_luis_elizondo',
  'l_guarderia',
  'l_escamilla',
  'l_casa_solar',
  'l_estudiantes_11',
  'l_estudiantes_12',
  'l_estudiantes_13',
  'l_estudiantes_15_y_10'
]


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
  const [gasRows, setGasRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [gasLoading, setGasLoading] = useState(true)
  const [error, setError] = useState(null)
  const [gasError, setGasError] = useState(null)

  // Puntos de medición del catálogo incluidos en la lista de puntos seleccionados
  const points = useMemo(() => {
    return (consumptionPointsData.categories || [])
      .flatMap(cat => cat.points || [])
      .filter(p => SELECTED_POINT_IDS.includes(`l_${p.id}`))
  }, [])

  // Puntos de gas del catálogo incluidos en la lista seleccionada
  const gasPoints = useMemo(() => {
    return (gasConsumptionPointsData.categories || [])
      .flatMap(cat => cat.points || [])
      .filter(p => GAS_SELECTED_POINT_IDS.includes(`l_${p.id}`))
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

  // Cargar las filas de consumo semanal de gas
  useEffect(() => {
    const fetchGasConsumptionData = async () => {
      try {
        setGasLoading(true)
        setGasError(null)

        const { data, error: fetchError } = await supabase
          .from(GAS_CONSUMPTION_TABLE)
          .select('*')
          .order('numero_semana', { ascending: true })

        if (fetchError) {
          console.error('❌ Error cargando consumo de gas:', fetchError)
          setGasError(fetchError.message)
          return
        }

        setGasRows(data || [])
      } catch (err) {
        console.error('❌ Error al cargar datos de gas:', err)
        setGasError(err.message)
      } finally {
        setGasLoading(false)
      }
    }

    fetchGasConsumptionData()
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

  // Construir weeklyData de cada punto de gas a partir de las filas de consumo
  const gasPointsWithData = useMemo(() => {
    return gasPoints.map(point => {
      const weeklyData = gasRows.map(row => ({
        week: row.numero_semana,
        consumption: parseFloat(row[point.id]) || 0
      }))
      return {
        ...point,
        weeklyData
      }
    })
  }, [gasPoints, gasRows])

  // Top 5 / Bottom 5 de gas según consumo de la semana seleccionada
  const gasTopBottom = useMemo(() => {
    if (!selectedWeek) return { top5: [], bottom5: [] }
    return getTopAndBottomConsumers(gasPointsWithData, selectedWeek)
  }, [gasPointsWithData, selectedWeek])

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
                  Comparativa global de puntos de medición seleccionados: los 5 de mayor y menor consumo por semana
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

            {/* Comparativa de gas */}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/10 p-4">
                        <h4 className="text-sm font-semibold text-red-700 dark:text-red-300 mb-3">
                          Top 5 Mayor Consumo de Gas — Semana {selectedWeek}
                        </h4>
                        <ol className="space-y-2">
                          {gasTopBottom.top5.map((item, index) => (
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
                          {gasTopBottom.top5.length === 0 && (
                            <li className="text-sm text-muted-foreground">Sin datos para esta semana</li>
                          )}
                        </ol>
                      </div>
                      <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-900/10 p-4">
                        <h4 className="text-sm font-semibold text-green-700 dark:text-green-300 mb-3">
                          Top 5 Menor Consumo de Gas — Semana {selectedWeek}
                        </h4>
                        <ol className="space-y-2">
                          {gasTopBottom.bottom5.map((item, index) => (
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
                          {gasTopBottom.bottom5.length === 0 && (
                            <li className="text-sm text-muted-foreground">Sin datos para esta semana</li>
                          )}
                        </ol>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </main>
        </div>
      </div>
    </RedirectIfNotAuth>
  )
}