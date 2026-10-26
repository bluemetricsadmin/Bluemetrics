import { supabase } from '../supabaseClient'
import { deriveWeeklyConsumptionFromReadings } from '../utils/consumptionHelpers'

// Las tablas de consumo semanal tienen el año en el nombre y las semanas en
// la columna l_numero_semana (no existe columna de año).
export const WELL_CONSUMPTION_TABLE_PREFIX = 'lecturas_semana_agua_consumo_'
export const WELL_READINGS_TABLE_PREFIX = 'lecturas_semana_agua_'

// Grupos de columnas de pozos dentro de cada tabla de consumo.
export const WELL_COLUMNS_SERVICIOS = ['l_pozo_11', 'l_pozo_12', 'l_pozo_3', 'l_pozo_7', 'l_pozo_14']
export const WELL_COLUMNS_RIEGO = ['l_pozo_4_riego', 'l_pozo_8_riego', 'l_pozo_15_riego']
export const WELL_COLUMNS_ALL = [...WELL_COLUMNS_SERVICIOS, ...WELL_COLUMNS_RIEGO]

// Años usados por las gráficas comparativas y por las metas anuales.
export const CHART_YEARS = [2022, 2023, 2024, 2025, 2026]
export const TARGET_YEARS = [2024, 2025, 2026]

// Metas de reducción respecto al año anterior.
export const REDUCTION_2025 = 0.2 // 2025 = 20% menos que 2024
export const REDUCTION_2026 = 0.1 // 2026 = 10% menos que 2025

export const getWellTableName = (year) => `${WELL_CONSUMPTION_TABLE_PREFIX}${year}`
export const getWellReadingsTableName = (year) => `${WELL_READINGS_TABLE_PREFIX}${year}`

// Suma recursiva de las columnas de un pozo en una fila.
export const sumWellsForWeek = (row, columns) =>
  columns.reduce((acc, col) => acc + (parseFloat(row[col]) || 0), 0)

/**
 * Construye las series semanales y los totales anuales para un conjunto de filas.
 * Mantiene exactamente la forma que consumen los KPIs y el comparison chart.
 * @returns {{ total:number, totalRiego:number, totalServicios:number, lastWeek:number, weeks:Array, weeksRiego:Array, weeksServicios:Array }}
 */
export const buildYearSeries = (rows = []) => {
  let total = 0
  let totalRiego = 0
  let totalServicios = 0
  let lastWeek = 0
  const weeks = []
  const weeksRiego = []
  const weeksServicios = []

  rows.forEach((row) => {
    const consumoSemana = sumWellsForWeek(row, WELL_COLUMNS_ALL)
    const consumoRiego = sumWellsForWeek(row, WELL_COLUMNS_RIEGO)
    const consumoServicios = sumWellsForWeek(row, WELL_COLUMNS_SERVICIOS)

    total += consumoSemana
    totalRiego += consumoRiego
    totalServicios += consumoServicios
    lastWeek = Math.max(lastWeek, row.l_numero_semana || 0)

    const base = {
      week: row.l_numero_semana,
      fecha_inicio: row.l_fecha_inicio,
      fecha_fin: row.l_fecha_fin,
    }

    weeks.push({
      ...base,
      consumption: parseFloat(consumoSemana.toFixed(2)),
      reading: total,
    })
    weeksRiego.push({
      ...base,
      consumption: parseFloat(consumoRiego.toFixed(2)),
      reading: totalRiego,
    })
    weeksServicios.push({
      ...base,
      consumption: parseFloat(consumoServicios.toFixed(2)),
      reading: totalServicios,
    })
  })

  return { total, totalRiego, totalServicios, lastWeek, weeks, weeksRiego, weeksServicios }
}

/**
 * Construye un arreglo multi-año con la forma esperada por WeeklyComparisonChart.
 */
export const buildMultiYearSeries = (seriesByYear) =>
  Object.entries(seriesByYear)
    .filter(([, series]) => series && series.weeks.length > 0)
    .map(([year, series]) => ({ year, data: series.weeks }))

export const wellsConsumptionService = {
  /**
   * Consulta las filas de consumo de un año, ordenadas por semana.
   * @returns {Promise<{ data: Array, error: Error|null }>}
   */
  async fetchYearRows(year) {
    const { data, error } = await supabase
      .from(getWellTableName(year))
      .select('*')
      .order('l_numero_semana', { ascending: true })

    if (!error && data && data.length > 0) {
      return { data, error: null }
    }

    const { data: readingsData, error: readingsError } = await supabase
      .from(getWellReadingsTableName(year))
      .select('*')
      .order('l_numero_semana', { ascending: true })

    if (readingsError || !readingsData || readingsData.length === 0) {
      return { data: data || [], error: error || readingsError || null }
    }

    return {
      data: deriveWeeklyConsumptionFromReadings(readingsData),
      error: null,
    }
  },

  /**
   * Consulta y totaliza el consumo de todos los pozos para varios años.
   * Devuelve la data lista para los KPIs y para el comparison chart.
   * @returns {Promise<{ yearTotals:Object, allWeeklyData:Array, riegoWeeklyData:Array, serviciosWeeklyData:Array, lastWeekByYear:Object, seriesByYear:Object, error:Error|null }>}
   */
  async fetchMultiYearData(years = CHART_YEARS) {
    const yearTotals = {}
    const lastWeekByYear = {}
    const seriesByYear = {}
    let firstError = null

    for (const year of years) {
      const { data, error } = await this.fetchYearRows(year)

      if (error) {
        console.warn(`⚠️ No se pudieron cargar datos de ${year}:`, error)
        firstError = firstError || error
        continue
      }

      if (data.length > 0) {
        const series = buildYearSeries(data)
        seriesByYear[year] = series
        yearTotals[year] = series.total
        lastWeekByYear[year] = series.lastWeek
      }
    }

    const riegoWeeklyData = Object.entries(seriesByYear).map(([year, series]) => ({
      year,
      data: series.weeksRiego,
    }))
    const serviciosWeeklyData = Object.entries(seriesByYear).map(([year, series]) => ({
      year,
      data: series.weeksServicios,
    }))

    return {
      yearTotals,
      allWeeklyData: buildMultiYearSeries(seriesByYear),
      riegoWeeklyData,
      serviciosWeeklyData,
      lastWeekByYear,
      seriesByYear,
      error: firstError,
    }
  },

  /**
   * Totaliza solo el total combinado de pozos por año (consulta ligera para metas).
   * @returns {Promise<{ totalsByYear:Object, seriesByYear:Object, error:Error|null }>}
   */
  async fetchAnnualTotals(years = TARGET_YEARS) {
    const result = await this.fetchMultiYearData(years)
    return {
      totalsByYear: result.yearTotals,
      lastWeekByYear: result.lastWeekByYear,
      seriesByYear: result.seriesByYear,
      error: result.error,
    }
  },
}
