/**
 * wellAlertEvaluator.js
 * Evaluación de anomalías de sobreconsumo con las 3 reglas simultáneas (AND).
 *
 * Para cada lectura (diaria / semanal / mensual) se evalúa cada medidor
 * (columna) y se genera UNA sola alerta consolidada por lectura, usando
 * el medidor con mayor consumo entre los que incumplen las reglas.
 *
 * Reglas (deben cumplirse las 3 a la vez, >30% sobre la referencia):
 *   R1: consumo actual > promedio móvil de los 10 periodos anteriores
 *   R2: consumo actual > periodo inmediatamente anterior
 *   R3: consumo actual > mismo periodo del año anterior
 */

const MES_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
]

const MES_NUM = Object.fromEntries(MES_ES.map((name, i) => [name, i + 1]))

const METADATA_KEYS = new Set([
  'id', 'mes_anio', 'mes', 'anio', 'dia_hora',
  'l_numero_semana', 'semana', 'l_numero_mes',
  'created_at', 'updated_at'
])

const toNum = (v) => {
  const n = parseFloat(v)
  return Number.isFinite(n) ? n : 0
}

export function getMeasurementColumns(row) {
  if (!row) return []
  return Object.keys(row).filter((key) => (
    !METADATA_KEYS.has(key) && Number.isFinite(parseFloat(row[key]))
  ))
}

function movingAverage(values, index, column) {
  let sum = 0
  let count = 0
  for (let i = index - 1; i >= 0 && count < 10; i--) {
    const v = toNum(values[i]?.[column])
    if (v > 0) {
      sum += v
      count++
    }
  }
  return count >= 3 ? { avg: sum / count, count } : { avg: 0, count }
}

function findReading(values, predicate) {
  for (let i = values.length - 1; i >= 0; i--) {
    if (predicate(values[i])) return values[i]
  }
  return null
}

function parseDailyDate(mesAnio, diaHora) {
  const [mes, anio] = (mesAnio || ' ').split(' ')
  const day = parseInt((diaHora || '').substring(3, 5), 10)
  const hour = (diaHora || '').substring(6)
  if (!mes || !anio || !day) return null
  return {
    mes,
    anio: parseInt(anio, 10),
    day,
    hour,
    date: new Date(parseInt(anio, 10), MES_NUM[mes] - 1, day)
  }
}

function dayKey(d) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function buildAlert({ granularity, column, value, reference, period }) {
  return {
    event_type: 'anomalia_sobreconsumo',
    severity: 'preventiva',
    title: `Anomalía de sobreconsumo detectada — ${period} (${value.toFixed(2)} m³)`,
    description:
      `El consumo del ${period} supera en más del 30% los valores de referencia ` +
      `en las 3 reglas simultáneas (promedio móvil 10 periodos, periodo anterior y ` +
      `mismo periodo del año anterior). Medidor con mayor consumo: ${column} ` +
      `(${value.toFixed(2)} m³, referencia ${reference.toFixed(2)} m³).`,
    recommendation:
      'Revisar el medidor y las líneas de distribución del periodo reportado. ' +
      'Verificar fugas, válvulas abiertas o mal funcionamiento del medidor.',
    metric_value: value,
    threshold_value: 0,
    alert_granularity: granularity,
    is_automatic: true,
    well_id: null,
    event_status: 'activo',
    author_name: 'Sistema Automático'
  }
}

function consolidate(column, alert, best) {
  if (!alert) return best
  if (toNum(alert.metric_value) <= (best?.metric_value || 0)) return best
  let periodTxt = ''
  if (alert.alert_date) periodTxt = alert.alert_date
  else if (alert.alert_granularity === 'weekly') periodTxt = `Semana ${alert.alert_week}/${alert.alert_year}`
  else if (alert.alert_granularity === 'monthly') periodTxt = `Mes ${alert.alert_month}/${alert.alert_year}`
  return {
    ...alert,
    meter_column: column,
    title: alert.title.replace(/detectada — .* \(/, `detectada — ${periodTxt} (`)
  }
}

/**
 * Evalúa una lectura diaria.
 * @param {object[]} readings - Filas de lecturas_diarias_consumo ordenadas de más antigua a más reciente.
 * @param {object} [currentReading] - Fila a evaluar (por defecto la última).
 * @returns {object|null} Alerta consolidada o null.
 */
export function evaluateDailyAnomaly(readings, currentReading) {
  if (!readings || readings.length === 0) return null

  const current = currentReading || readings[readings.length - 1]
  const index = readings.lastIndexOf(current) === -1 ? readings.length - 1 : readings.lastIndexOf(current)
  if (index < 0) return null

  const curDate = parseDailyDate(current.mes_anio, current.dia_hora)
  if (!curDate) return null

  const prevDate = new Date(curDate.date)
  prevDate.setDate(prevDate.getDate() - 7)
  const prevWeekKey = `${MES_ES[prevDate.getMonth()]} ${prevDate.getFullYear()}`
  const prevWeekDay = String(prevDate.getDate()).padStart(2, '0')
  const prevYear = curDate.anio - 1

  let best = null

  for (const column of getMeasurementColumns(current)) {
    const curVal = toNum(current[column])
    if (curVal <= 0) continue

    const { avg } = movingAverage(readings, index, column)
    if (!(avg > 0 && curVal > avg * 1.3)) continue

    const prevWeekReading = findReading(
      readings,
      (r) => r.mes_anio === prevWeekKey &&
        (r.dia_hora || '').substring(3, 5) === prevWeekDay &&
        (r.dia_hora || '').substring(6) === curDate.hour
    )
    const prevWeekVal = prevWeekReading ? toNum(prevWeekReading[column]) : 0
    if (!(prevWeekVal > 0 && curVal > prevWeekVal * 1.3)) continue

    const prevYearReading = findReading(
      readings,
      (r) => r.mes === curDate.mes &&
        String(r.anio) === String(prevYear) &&
        (r.dia_hora || '').substring(3, 5) === String(curDate.day).padStart(2, '0') &&
        (r.dia_hora || '').substring(6) === curDate.hour
    )
    const prevYearVal = prevYearReading ? toNum(prevYearReading[column]) : 0
    if (!(prevYearVal > 0 && curVal > prevYearVal * 1.3)) continue

    const alert = {
      ...buildAlert({
        granularity: 'daily',
        column,
        value: curVal,
        reference: avg,
        period: `${current.dia_hora} ${current.mes_anio}`
      }),
      alert_date: dayKey(curDate.date)
    }
    best = consolidate(column, alert, best)
  }

  return best
}

/**
 * Evalúa una lectura semanal.
 * @param {object[]} readings - Filas de lecturas_semana_agua_consumo_{anio} (con l_numero_semana) ordenadas.
 * @param {object} [currentReading] - Fila a evaluar (por defecto la última).
 * @returns {object|null} Alerta consolidada o null.
 */
export function evaluateWeeklyAnomaly(readings, currentReading) {
  if (!readings || readings.length === 0) return null

  const current = currentReading || readings[readings.length - 1]
  const index = readings.lastIndexOf(current) === -1 ? readings.length - 1 : readings.lastIndexOf(current)
  if (index < 0) return null

  const week = toNum(current.l_numero_semana)
  const year = toNum(current.anio || current.l_anio)
  if (!week || !year) return null

  const prevWeek = week - 1
  const prevYearReading = findReading(readings, (r) => toNum(r.l_numero_semana) === week && toNum(r.anio || r.l_anio) === year - 1)

  let best = null

  for (const column of getMeasurementColumns(current)) {
    const curVal = toNum(current[column])
    if (curVal <= 0) continue

    const { avg } = movingAverage(readings, index, column)
    if (!(avg > 0 && curVal > avg * 1.3)) continue

    const prevReading = findReading(readings, (r) => toNum(r.l_numero_semana) === prevWeek)
    const prevWeekVal = prevReading ? toNum(prevReading[column]) : 0
    if (!(prevWeekVal > 0 && curVal > prevWeekVal * 1.3)) continue

    const samePrevYearVal = prevYearReading ? toNum(prevYearReading[column]) : 0
    if (!(samePrevYearVal > 0 && curVal > samePrevYearVal * 1.3)) continue

    const alert = {
      ...buildAlert({
        granularity: 'weekly',
        column,
        value: curVal,
        reference: avg,
        period: `Semana ${week}/${year}`
      }),
      alert_week: week,
      alert_year: year
    }
    best = consolidate(column, alert, best)
  }

  return best
}

/**
 * Evalúa una lectura mensual.
 * @param {object[]} readings - Filas de lecturas_mensuales_agua_consumo (con anio, mes) ordenadas.
 * @param {object} [currentReading] - Fila a evaluar (por defecto la última).
 * @returns {object|null} Alerta consolidada o null.
 */
export function evaluateMonthlyAnomaly(readings, currentReading) {
  if (!readings || readings.length === 0) return null

  const current = currentReading || readings[readings.length - 1]
  const index = readings.lastIndexOf(current) === -1 ? readings.length - 1 : readings.lastIndexOf(current)
  if (index < 0) return null

  const month = toNum(current.mes)
  const year = toNum(current.anio)
  if (!month || !year) return null

  const prevMonthReading = findReading(
    readings,
    (r) => toNum(r.anio) === year && toNum(r.mes) === month - 1
  ) || findReading(
    readings,
    (r) => toNum(r.anio) === year - 1 && toNum(r.mes) === 12 && month === 1
  )
  const samePrevYearReading = findReading(readings, (r) => toNum(r.anio) === year - 1 && toNum(r.mes) === month)

  let best = null

  for (const column of getMeasurementColumns(current)) {
    const curVal = toNum(current[column])
    if (curVal <= 0) continue

    const { avg } = movingAverage(readings, index, column)
    if (!(avg > 0 && curVal > avg * 1.3)) continue

    const prevMonthVal = prevMonthReading ? toNum(prevMonthReading[column]) : 0
    if (!(prevMonthVal > 0 && curVal > prevMonthVal * 1.3)) continue

    const samePrevYearVal = samePrevYearReading ? toNum(samePrevYearReading[column]) : 0
    if (!(samePrevYearVal > 0 && curVal > samePrevYearVal * 1.3)) continue

    const alert = {
      ...buildAlert({
        granularity: 'monthly',
        column,
        value: curVal,
        reference: avg,
        period: `Mes ${month}/${year}`
      }),
      alert_year: year,
      alert_month: month
    }
    best = consolidate(column, alert, best)
  }

  return best
}

/**
 * Evalúa una lectura según su granularidad.
 * @param {'daily'|'weekly'|'monthly'} granularity - Granularidad de la lectura.
 * @param {object[]} readings - Lecturas ordenadas de más antigua a más reciente.
 * @param {object} [currentReading] - Lectura a evaluar (por defecto la última).
 * @returns {object|null} Alerta consolidada o null.
 */
export function evaluateAnomaly(granularity, readings, currentReading) {
  switch (granularity) {
    case 'daily':
      return evaluateDailyAnomaly(readings, currentReading)
    case 'weekly':
      return evaluateWeeklyAnomaly(readings, currentReading)
    case 'monthly':
      return evaluateMonthlyAnomaly(readings, currentReading)
    default:
      return null
  }
}