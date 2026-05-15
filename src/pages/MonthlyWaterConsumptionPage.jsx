import { useState, useEffect } from 'react'
import { DashboardHeader } from "../components/dashboard-header"
import { DashboardSidebar } from "../components/dashboard-sidebar"
import { Card, CardContent, CardHeader } from "../components/ui/card"
import { Button } from "../components/ui/button"
import consumptionPointsData from '../lib/consumption-points.json'
import { supabase } from '../supabaseClient'
import { 
  TrendingUpIcon,
  TrendingDownIcon,
  DropletIcon,
  BarChart3Icon,
  DownloadIcon,
  Waves,
  TableIcon,
  Loader2Icon,
  RefreshCwIcon,
  AlertCircleIcon
} from 'lucide-react'

import MonthlyComparisonChart from '../components/MonthlyComparisonChart'
import { RedirectIfNotAuth } from '../components/RedirectIfNotAuth'
import { 
  getMonthlyWaterTableName, 
  getMonthlyWaterConsumptionTableName,
  AVAILABLE_YEARS, 
  DEFAULT_YEAR,
  MONTHS,
  getMonthName
} from '../utils/tableHelpers'

export default function MonthlyWaterConsumptionPage() {
  const [selectedYear, setSelectedYear] = useState(DEFAULT_YEAR)
  
  // Estados para datos de Supabase
  const [monthlyConsumption, setMonthlyConsumption] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Estados para comparativas entre años (per-year data para MonthlyComparisonChart)
  const [monthlyData2023, setMonthlyData2023] = useState([])
  const [monthlyData2024, setMonthlyData2024] = useState([])
  const [monthlyData2025, setMonthlyData2025] = useState([])
  const [monthlyData2026, setMonthlyData2026] = useState([])

  // Estados para controles de gráfica (estilo ConsumptionPage)
  const [comparisonChartType, setComparisonChartType] = useState('line')
  const [comparisonYearsToShow, setComparisonYearsToShow] = useState(['2025', '2026'])
  const [availableYears] = useState(['2023', '2024', '2025', '2026'])
  
  // Estado para punto de medición seleccionado
  const [selectedPoint, setSelectedPoint] = useState('medidor_general_pozos')
  
  // Tab activa para tablas detalladas
  const [activeTab, setActiveTab] = useState('pozos_servicios')

  // Cargar datos cuando cambia el año
  useEffect(() => {
    fetchMonthlyData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear])

  // Cargar datos de comparación cuando cambia el punto seleccionado
  useEffect(() => {
    fetchAllYearsMonthlyData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPoint])

  const fetchMonthlyData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const consumptionTableName = getMonthlyWaterConsumptionTableName()
      
      // Cargar consumo mensual
      const { data: consumptionData, error: consumptionError } = await supabase
        .from(consumptionTableName)
        .select('*')
        .eq('anio', parseInt(selectedYear))
        .order('mes', { ascending: true })
      
      if (consumptionError) {
        console.error('❌ Error cargando consumo:', consumptionError)
        throw consumptionError
      }
      
      setMonthlyConsumption(consumptionData || [])
      
    } catch (err) {
      console.error('❌ Error al cargar datos:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Función para cargar datos de un año específico para la gráfica de comparación
  const fetchYearMonthlyData = async (year, setStateFunction) => {
    try {
      const shouldSumAll = selectedPoint === 'todos'
      const readingsTableName = getMonthlyWaterTableName()
      const consumptionTableName = getMonthlyWaterConsumptionTableName()

      // Cargar lecturas mensuales
      const { data: readingsData, error: readingsError } = await supabase
        .from(readingsTableName)
        .select('*')
        .eq('anio', parseInt(year))
        .order('mes', { ascending: true })

      if (readingsError) {
        console.error(`❌ Error cargando lecturas de ${year}:`, readingsError)
        setStateFunction([])
        return
      }

      // Cargar consumo mensual
      const { data: consumptionData, error: consumptionError } = await supabase
        .from(consumptionTableName)
        .select('*')
        .eq('anio', parseInt(year))
        .order('mes', { ascending: true })

      if (consumptionError) {
        console.error(`❌ Error cargando consumo de ${year}:`, consumptionError)
        setStateFunction([])
        return
      }

      if (!readingsData || readingsData.length === 0) {
        setStateFunction([])
        return
      }

      let formattedData
      if (shouldSumAll) {
        formattedData = (consumptionData || []).map(row => {
          let totalConsumption = 0
          Object.keys(row).forEach(key => {
            if (key.startsWith('l_') && 
                key !== 'l_id' &&
                row[key] !== null) {
              const value = parseFloat(row[key])
              if (!isNaN(value)) {
                totalConsumption += value
              }
            }
          })
          return {
            month: row.mes,
            monthName: getMonthName(row.mes),
            reading: totalConsumption,
            consumption: totalConsumption
          }
        })
      } else {
        const columnName = `l_${selectedPoint}`
        formattedData = readingsData.map(reading => {
          const consumption = (consumptionData || []).find(c => c.mes === reading.mes)
          return {
            month: reading.mes,
            monthName: getMonthName(reading.mes),
            reading: parseFloat(reading[columnName]) || 0,
            consumption: parseFloat(consumption?.[columnName]) || 0
          }
        })
      }

      setStateFunction(formattedData)
    } catch (err) {
      console.error(`❌ Error al cargar datos de ${year}:`, err)
      setStateFunction([])
    }
  }

  // Cargar datos de todos los años para comparación
  const fetchAllYearsMonthlyData = async () => {
    await Promise.all([
      fetchYearMonthlyData('2023', setMonthlyData2023),
      fetchYearMonthlyData('2024', setMonthlyData2024),
      fetchYearMonthlyData('2025', setMonthlyData2025),
      fetchYearMonthlyData('2026', setMonthlyData2026)
    ])
  }

  // Preparar datos multi-año para MonthlyComparisonChart
  const getMultiYearChartData = () => {
    const yearDataMap = {
      '2023': monthlyData2023,
      '2024': monthlyData2024,
      '2025': monthlyData2025,
      '2026': monthlyData2026
    }

    const sortedSelectedYears = [...comparisonYearsToShow].sort()
    return sortedSelectedYears.map(year => ({
      year,
      data: yearDataMap[year] || []
    }))
  }

  const multiYearData = getMultiYearChartData()

  // Calcular métricas principales
  const calculateMetrics = () => {
    if (!monthlyConsumption || monthlyConsumption.length === 0) {
      return { pozos: 0, riego: 0, servicios: 0, pozosPrev: 0, riegoPrev: 0, serviciosPrev: 0 }
    }

    // Columnas de pozos
    const pozosServiciosCols = ['l_pozo_11', 'l_pozo_12', 'l_pozo_3', 'l_pozo_7', 'l_pozo_14']
    const pozosRiegoCols = ['l_pozo_4_riego', 'l_pozo_8_riego', 'l_pozo_15_riego']
    const todosPozosCols = [...pozosServiciosCols, ...pozosRiegoCols]

    const sumConsumption = (data, columns) => {
      return data.reduce((total, row) => {
        const sum = columns.reduce((colSum, col) => {
          const value = parseFloat(row[col]) || 0
          return colSum + value
        }, 0)
        return total + sum
      }, 0)
    }

    // Últimos 3 meses vs 3 anteriores
    const last3 = monthlyConsumption.slice(-3)
    const prev3 = monthlyConsumption.slice(-6, -3)

    return {
      pozos: Math.round(sumConsumption(last3, todosPozosCols)),
      riego: Math.round(sumConsumption(last3, pozosRiegoCols)),
      servicios: Math.round(sumConsumption(last3, pozosServiciosCols)),
      pozosPrev: Math.round(sumConsumption(prev3, todosPozosCols)),
      riegoPrev: Math.round(sumConsumption(prev3, pozosRiegoCols)),
      serviciosPrev: Math.round(sumConsumption(prev3, pozosServiciosCols))
    }
  }

  const metrics = calculateMetrics()
  
  const pozosTrend = metrics.pozosPrev > 0 
    ? ((metrics.pozos - metrics.pozosPrev) / metrics.pozosPrev * 100).toFixed(1)
    : 0
  const riegoTrend = metrics.riegoPrev > 0
    ? ((metrics.riego - metrics.riegoPrev) / metrics.riegoPrev * 100).toFixed(1)
    : 0
  const serviciosTrend = metrics.serviciosPrev > 0
    ? ((metrics.servicios - metrics.serviciosPrev) / metrics.serviciosPrev * 100).toFixed(1)
    : 0

  return (
    <RedirectIfNotAuth>
      <div className="min-h-screen bg-background">
        <DashboardSidebar />
        
        <div className="ml-64">
          <DashboardHeader />
          <main className="p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-foreground mb-2">
                    Consumo Mensual de Agua
                  </h1>
                  <p className="text-muted-foreground">
                    Análisis detallado del consumo hídrico mensual
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Año:</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="px-3 py-2 border border-muted rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {AVAILABLE_YEARS.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={fetchMonthlyData}
                    disabled={loading}
                  >
                    <RefreshCwIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Recargar
                  </Button>
                  <Button variant="outline" size="sm">
                    <DownloadIcon className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </div>
            </div>

            {/* Estado de carga o error */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2Icon className="h-8 w-8 animate-spin text-primary mr-3" />
                <span className="text-muted-foreground">Cargando datos mensuales...</span>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                <AlertCircleIcon className="h-5 w-5 text-red-600" />
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {!loading && !error && (
              <>
               

                {/* Controles de Comparativas Mensuales */}
                <Card className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                  <CardContent className="p-6">
                    <div className="flex flex-wrap items-center gap-4">
                      {/* Punto de Medición */}
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-semibold text-foreground whitespace-nowrap">Punto de Medición:</label>
                        <select
                          value={selectedPoint}
                          onChange={(e) => setSelectedPoint(e.target.value)}
                          className="border border-muted rounded-lg px-3 py-2 text-sm bg-background hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors min-w-[200px]"
                        >
                          <optgroup label="Pozos de Agua Potable (Servicios)">
                        <option value="medidor_general_pozos">Medidor General de los pozos 7,12,11 y 14 / TOTAL POZOS</option>
                        <option value="pozo_11">Pozo de agua potable 11</option>
                        <option value="pozo_14">Pozo de agua potable 14</option>
                        <option value="pozo_12">Pozo de agua potable 12</option>
                        <option value="pozo_7">Pozo de agua potable 7</option>
                        <option value="pozo_3">Pozo de agua potable 3</option>
                      </optgroup>
                      <optgroup label="Pozos de Riego">
                        <option value="pozo_4_riego">Pozo de riego 4</option>
                        <option value="pozo_8_riego">Pozo de riego 8</option>
                        <option value="pozo_15_riego">Pozo de riego 15</option>
                      </optgroup>
                      <optgroup label="Circuito 8 Campus">
                        <option value="circuito_8_campus">Circuito 8 Campus</option>
                        <option value="auditorio_luis_elizondo">Auditorio Luis Elizondo</option>
                        <option value="cdb2">CDB2</option>
                        <option value="cdb2_banos_nuevos_2025">CDB2 Baños nuevos 2025</option>
                        <option value="arena_borrego">Arena Borrego</option>
                        <option value="farnville">Farnville</option>
                        <option value="em_box">Em Box</option>
                        <option value="edificio_negocios_daf">Edificio de Negocios (DAF)</option>
                        <option value="aulas_6">Aulas 6</option>
                        <option value="domo_cultural">Domo Cultural</option>
                        <option value="wellness_parque_central_tunel">Wellness Parque Central (Parque Central Tunel Instalaciones)</option>
                        <option value="wellness_registro">WELLNESS REGISTRO (Wellness-Parque Central)</option>
                        <option value="parque_central_registro">Parque Central Registro</option>
                        <option value="wellness_edificio">Wellness-edificio</option>
                        <option value="wellness_super_salads">Wellness-Super Salads</option>
                        <option value="wellness_torre_enfriamiento">Wellness Torre de Enfriamiento</option>
                        <option value="wellness_alberca">Wellness Alberca</option>
                        <option value="centrales_comedor_1_principal">Centrales Comedor 1 (Puertas Giratorias) (Concesiones)</option>
                        <option value="centrales_dona_tota">Centrales Comedor 1-Doña Tota</option>
                        <option value="centrales_subway">Centrales Comedor 1-Subway</option>
                        <option value="centrales_carls_jr">Centrales Comedor 1-Carls Jr.</option>
                        <option value="centrales_little_cesars">Centrales Comedor 1-Pizza Little Cesars</option>
                        <option value="centrales_grill_team">Centrales Comedor 1- Grill Team (Davila´s, GRILL)</option>
                        <option value="centrales_chilaquiles">Centrales Comedor 1 Chilaquiles</option>
                        <option value="centrales_tec_food">Centrales Comedor 1 Tec Food</option>
                        <option value="centrales_oxxo">Centrales Comedor 1-oxxo</option>
                        <option value="comedor_central_tunel">Comedor Central (Comedor Comedor 1 tunel)</option>
                        <option value="administrativo">Administrativo</option>
                        <option value="biotecnologia">Biotecnología</option>
                        <option value="escuela_arte_caldera_1">Escuela de Arte y Caldera 1</option>
                        <option value="ciap_oriente">Ciap-Oriente</option>
                        <option value="ciap_centro">Ciap-Centro</option>
                        <option value="ciap_poniente">Ciap-Poniente</option>
                        <option value="ciap_green_shake">Ciap-Green Shake</option>
                        <option value="ciap_andatti">Ciap-Andatti (Tim Horton)</option>
                        <option value="ciap_dc_jochos">Ciap DC Jochos</option>
                        <option value="crepaso">Crepaso</option>
                        <option value="el_negro">El Negro</option>
                        <option value="aulas_5">Aulas 5</option>
                        <option value="ciap_starbucks">Ciap-Starbucks</option>
                        <option value="ciap_super_salads">Ciap-Super Salads</option>
                        <option value="ciap_sotano">Ciap-sótano</option>
                        <option value="reflexion">Reflexión</option>
                        <option value="residencias_10_15">Residencias 10 y 15</option>
                        <option value="residencias_10_15_llenado">Residencias 10 y 15 llenado</option>
                        <option value="cedes_cisterna">Cedes (Cisterna)</option>
                        <option value="cedes_site">Cedes Site</option>
                        <option value="nucleo">Nucleo</option>
                        <option value="expedition">Expedition</option>
                        <option value="expedition_bread">Expedition Bread</option>
                        <option value="expedition_matthew">Expedition Matthew</option>
                        <option value="caffenio">Caffenio</option>
                        <option value="cedes_e2">Cedes-E2</option>
                        <option value="e2_beiker">E2-Beiker</option>
                        <option value="e2_evobike">E2-Evobike</option>
                        <option value="e2_pancho_de_rigo">E2-Pancho de Rigo</option>
                        <option value="e2_bebedero_nube">E2 bebedero Nube</option>
                        <option value="aulas_1">Aulas 1</option>
                        <option value="rectoria_norte">Rectoría Norte</option>
                        <option value="pabellon_la_carreta">Pabellon La Carreta</option>
                        <option value="rectoria_sur">Rectoría Sur  (NO TOMAR LECTURA)</option>
                        <option value="aulas_2">Aulas 2</option>
                        <option value="cetec">Cetec</option>
                        <option value="biblioteca">Biblioteca</option>
                        <option value="biblioteca_nikkori">Biblioteca-Nikkori</option>
                        <option value="biblioteca_nectar_works">Biblioteca-Nectar Works</option>
                        <option value="biblioteca_tim_horton">Biblioteca-Tim Horton</option>
                        <option value="aulas_3">Aulas 3</option>
                        <option value="basanti">Basanti</option>
                        <option value="aulas_3_sr_latino">Aulas 3 - Sr. Latino</option>
                        <option value="centrales_sur">Centrales Sur</option>
                        <option value="aulas_4_norte">Aulas 4 Norte</option>
                      </optgroup>
                      <optgroup label="Circuito 6 Residencias">
                        <option value="circuito_6_residencias">Circuito 6 Residencias</option>
                        <option value="residencias_2_ote">Residencias 2 ote</option>
                        <option value="residencias_2_pte">Residencias 2 pte  (YA NO HAY MEDIDOR desde 29-Sep-25)</option>
                        <option value="residencias_3">Residencias 3</option>
                        <option value="residencias_5">Residencias 5</option>
                        <option value="correos">Correos Mr Heppy</option>
                        <option value="residencias_abc">Residencias ABC (Residencias 1 Nuevas)</option>
                        <option value="residencias_abc_lavanderia">Residencias ABC (Lavandería)</option>
                        <option value="mil_mascaras">Mil Mascaras</option>
                      </optgroup>
                      <optgroup label="Circuito 4 A7-CE">
                        <option value="circuito_4_a7_ce">Circuito 4 A7-CE</option>
                        <option value="aulas_7">Aulas 7</option>
                        <option value="cah3_torre_enfriamiento">CAH 3 Torre de Enfriamiento</option>
                        <option value="caldera_3">Caldera 3 (NO TOMAR LECTURA)</option>
                        <option value="la_dia">La Dia</option>
                        <option value="aulas_4_sur">Aulas 4 sur</option>
                        <option value="aulas_4_maestros">Aulas 4 maestros</option>
                        <option value="centro_congresos">Centro Congresos</option>
                        <option value="jubileo">Jubileo</option>
                        <option value="aulas_4_oxxo">Aulas 4 OXXO</option>
                      </optgroup>
                      <optgroup label="Circuito Planta Física">
                        <option value="circuito_planta_fisica">Circuito Planta Física</option>
                        <option value="estacionamiento_e1">Estacionamiento E1</option>
                        <option value="megacentral_te_2">Megacentral Torres de Enfriamiento 2</option>
                        <option value="escamilla_banos_trabajadores">Escamilla baños trabajadores  (revisar medidor, cambio)</option>
                        <option value="estadio_banorte">Estadio Banorte (Estadio Borrego)</option>
                        <option value="estadio_banorte_te">Estadio Banorte Torre Enfriamiento</option>
                        <option value="campus_norte_edificios_ciudad">Campus Norte Edificios (agua de la ciudad) (NO TOMAR LECTURA)</option>
                        <option value="estadio_azul">Estadio Azul</option>
                      </optgroup>
                      <optgroup label="Circuito Megacentral">
                        <option value="circuito_megacentral">Circuito Megacentral</option>
                        <option value="megacentral_te_4">Megacentral Torre Enfriamiento 4</option>
                      </optgroup>
                      <optgroup label="Sistemas de Riego y PTAR">
                        <option value="pozo_4_riego_alt">Pozo 4 (Riego)</option>
                        <option value="pozo_8_riego_alt">Pozo 8 (Riego)</option>
                        <option value="pozo_15_riego_alt">Pozo 15 (Riego)</option>
                        <option value="campus_norte_ciudad_riego">Campus Norte (Ciudad riego)</option>
                        <option value="comedor_d_ciudad">Comedor D (agua de la ciudad)</option>
                      </optgroup>
                      <optgroup label="Purgas y Evaporación">
                        <option value="estadio_banorte_purgas">Estadio Banorte purgas (Estadio Borrego Torre Enfriamiento purgas  (importante))</option>
                        <option value="wellness_cisterna_pluvial_purgas">Wellnes Cisterna Pluvial purgas  (medidor dañado)</option>
                        <option value="wellness_suavizador_purga">Wellness Suavizador purga  (importante)</option>
                        <option value="wellness_te_rebosadero">Wellness T.E. rebosadero</option>
                        <option value="wellness_te_purga">Wellness T.E. purga (importante)</option>
                        <option value="megacentral_te_purgas">Megacentral Torres Enfriamiento purgas</option>
                        <option value="megacentral_suavizador_purga">Megacentral Suavizador (purga) (fuera de servcicio provisional)</option>
                        <option value="cah3_te_purgas">CAH3 Torre Enfriamiento purgas</option>
                        <option value="residencias_10_15_te_purga">Residencias 10 y 15 T.E. purga</option>
                        <option value="ciap_cisterna_pluvial">Ciap Cisterna Pluvial-Riego al sanitario 2</option>
                      </optgroup>
                      <optgroup label="Agua de la Ciudad">
                        <option value="estacionamiento_e3">Estacionamiento E3</option>
                        <option value="guarderia">Guardería (Ciudad)</option>
                        <option value="naranjos">Naranjos (Ciudad-Guardería)</option>
                        <option value="casa_solar">Casa Solar (Ciudad)</option>
                        <option value="residencias_11_ciudad">Estudiantes Residencias 11 (Ciudad)</option>
                        <option value="residencias_12_ciudad">Estudiantes Residencias 12 (Ciudad)</option>
                        <option value="residencias_13_1_ciudad">Estudiantes Residencias 13(Ciudad)</option>
                        <option value="residencias_13_2_ciudad">Estudiantes Residencias 13-2 (Ciudad) (ESTE NO JAVIER GZA)</option>
                        <option value="residencias_13_3_ciudad">Estudiantes Residencias 13-3 (Ciudad) (ESTE NO JAVIER GZA)</option>
                        <option value="residencias_15_sotano">Residencias 15 sótano (ESTE NO JAVIER GZA)</option>
                      </optgroup>
                        </select>
                      </div>

                      {/* Separador */}
                      <div className="h-8 w-px bg-gray-300"></div>

                      {/* Tipo de Gráfico */}
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-semibold text-foreground whitespace-nowrap">Tipo de Gráfico:</label>
                        <div className="flex gap-1 border rounded-lg p-1 bg-background">
                          <Button
                            variant={comparisonChartType === 'line' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setComparisonChartType('line')}
                            className="h-8 px-3"
                          >
                            Líneas
                          </Button>
                          <Button
                            variant={comparisonChartType === 'bar' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setComparisonChartType('bar')}
                            className="h-8 px-3"
                          >
                            Barras
                          </Button>
                        </div>
                      </div>

                      {/* Separador */}
                      <div className="h-8 w-px bg-gray-300"></div>

                      {/* Años a mostrar */}
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-semibold text-foreground whitespace-nowrap">Años:</label>
                        <div className="flex gap-1 border rounded-lg p-1 bg-background">
                          {availableYears.map(year => (
                            <Button
                              key={year}
                              variant={comparisonYearsToShow.includes(year) ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                setComparisonYearsToShow(prev => {
                                  if (prev.includes(year)) {
                                    if (prev.length === 1) return prev
                                    return prev.filter(y => y !== year)
                                  }
                                  return [...prev, year].sort()
                                })
                              }}
                              className="h-8 px-3"
                            >
                              {year}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Gráfica de comparación mensual */}
                <MonthlyComparisonChart
                  title={selectedPoint === 'todos' ? 'Todos los Puntos (Suma Total)' : (consumptionPointsData.categories.flatMap(c => c.points).find(p => p.id === selectedPoint)?.name || "Punto de Medición")}
                  unit="m³"
                  chartType={comparisonChartType}
                  showControls={false}
                  multiYearData={multiYearData}
                />

                {/* Tabla de datos detallados */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TableIcon className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">Datos Detallados por Categoría</h3>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Tabs de categorías */}
                    <div className="mb-4 overflow-x-auto">
                      <div className="flex gap-2 border-b border-muted pb-2">
                        {consumptionPointsData.categories.map(category => (
                          <button
                            key={category.id}
                            onClick={() => setActiveTab(category.id)}
                            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                              activeTab === category.id
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                            }`}
                          >
                            {category.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tabla de datos */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-muted">
                            <th className="text-left py-3 px-4 font-semibold">Punto de Medición</th>
                            {MONTHS.map(month => (
                              <th key={month.value} className="text-right py-3 px-2 font-semibold">
                                {month.label.substring(0, 3)}
                              </th>
                            ))}
                            <th className="text-right py-3 px-4 font-semibold bg-muted/30">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {consumptionPointsData.categories
                            .find(c => c.id === activeTab)
                            ?.points.filter(p => !p.noRead)
                            .map(point => {
                              const columnName = `l_${point.id}`
                              const monthValues = MONTHS.map(month => {
                                const monthData = monthlyConsumption.find(r => r.mes === month.value)
                                return monthData ? parseFloat(monthData[columnName]) || 0 : 0
                              })
                              const total = monthValues.reduce((sum, val) => sum + val, 0)

                              return (
                                <tr key={point.id} className="border-b border-muted/50 hover:bg-muted/20">
                                  <td className="py-3 px-4">
                                    <div>
                                      <p className="font-medium">{point.name}</p>
                                      <p className="text-xs text-muted-foreground">{point.id}</p>
                                    </div>
                                  </td>
                                  {monthValues.map((value, idx) => (
                                    <td key={idx} className="text-right py-3 px-2">
                                      {value > 0 ? value.toLocaleString() : '-'}
                                    </td>
                                  ))}
                                  <td className="text-right py-3 px-4 font-semibold bg-muted/30">
                                    {total > 0 ? total.toLocaleString() : '-'}
                                  </td>
                                </tr>
                              )
                            })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </main>
        </div>
      </div>
    </RedirectIfNotAuth>
  )
}
