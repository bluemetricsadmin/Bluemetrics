/**
 * Utilidades puras para el cálculo de lecturas y consumo semanal de puntos de medición.
 * Extraídas de ConsumptionTable para compartirse entre ConsumptionTable, ConsumptionPage y DashboardPage.
 */

// Función pura para obtener la lectura acumulada de un punto en una semana específica
export const getPointReading = (item, week) => {
  if (!item.weeklyData || item.noRead) return 0
  const weekData = item.weeklyData.find(w => w.week === week)
  if (!weekData) return 0
  return typeof weekData.reading === 'number' ? weekData.reading : parseFloat(weekData.reading) || 0
}

// Función pura para obtener el consumo de un punto en una semana específica
export const getPointConsumption = (item, week) => {
  if (!item.weeklyData || item.noRead) return 0
  const weekData = item.weeklyData.find(w => w.week === week)
  if (!weekData) return 0
  if (weekData.consumption !== undefined && weekData.consumption !== null) {
    return typeof weekData.consumption === 'number' ? weekData.consumption : parseFloat(weekData.consumption) || 0
  }
  const currentReading = getPointReading(item, week)
  const previousReading = getPointReading(item, week - 1)
  return Math.max(0, currentReading - previousReading)
}

// Extrae los puntos que más y que menos consumieron en la semana indicada
export const getTopAndBottomConsumers = (points, week, count = 5) => {
  const withConsumption = (points || []).map(item => ({
    item,
    consumption: getPointConsumption(item, week)
  })).filter(entry => !entry.item.noRead)

  const sortedDesc = [...withConsumption].sort((a, b) => b.consumption - a.consumption)
  const sortedAsc = [...withConsumption].sort((a, b) => a.consumption - b.consumption)

  return {
    top5: sortedDesc.slice(0, count).map(entry => entry.item),
    bottom5: sortedAsc.slice(0, count).map(entry => entry.item)
  }
}

// Compara el consumo de un punto entre la semana indicada y la semana anterior (n-1, n).
// Los faltantes se tratan como 0 (getPointConsumption devuelve 0 si la semana no existe).
export const getPointWeekComparison = (item, week) => {
  const current = getPointConsumption(item, week)
  const previous = getPointConsumption(item, week - 1)
  const difference = current - previous
  const percent = previous !== 0 ? (difference / previous) * 100 : null

  return { previous, current, difference, percent }
}

const CONSUMPTION_METADATA_KEYS = new Set([
  'l_id',
  'l_numero_semana',
  'l_fecha_inicio',
  'l_fecha_fin',
  'l_created_at',
  'l_updated_at'
])

const SPECIAL_CONSUMPTION_FACTORS = {
  circuito_6_residencias: 10,
  circuito_8_campus: 10,
  medidor_general_pozos: 10,
  campo_soft_bol: 10,
  residencias_13_2_ciudad: 10,
  wellness_te_rebosadero: 0.38,
  cedes_cisterna: 1
}

const CONSUMPTION_ADJUSTMENTS = {
  auditorio_luis_elizondo: ['cdb2'],
  cedes_cisterna: ['caffenio', 'san_huevito', 'cedes_e2'],
  nucleo: ['expedition', 'hub'],
  aulas_3: ['basanti', 'aulas_3_sr_latino'],
  aulas_4_sur: ['cdi_1'],
  aulas_4_maestros: ['cdi_2'],
  estadio_banorte: ['estadio_azul'],
  guarderia: ['naranjos'],
  estadio_banorte_purgas: ['wellness_te_purga'],
  residencias_10_15: ['caffenio']
}

export const deriveWeeklyConsumptionFromReadings = (readingsData = []) => {
  const ordered = [...readingsData].sort(
    (a, b) => (a.l_numero_semana || 0) - (b.l_numero_semana || 0)
  )

  const rows = ordered.map((reading, index) => {
    const previous = index > 0 ? ordered[index - 1] : null
    const row = {
      l_numero_semana: reading.l_numero_semana,
      l_fecha_inicio: reading.l_fecha_inicio,
      l_fecha_fin: reading.l_fecha_fin
    }

    Object.keys(reading).forEach(key => {
      if (!key.startsWith('l_') || CONSUMPTION_METADATA_KEYS.has(key)) return

      const currentValue = parseFloat(reading[key])
      if (!Number.isFinite(currentValue)) return

      const previousValue = parseFloat(previous?.[key])
      if (!Number.isFinite(previousValue)) {
        row[key] = 0
        return
      }

      const pointId = key.replace(/^l_/, '')
      const factor = SPECIAL_CONSUMPTION_FACTORS[pointId] || 1
      row[key] = Math.max(0, currentValue - previousValue) * factor
    })

    return row
  })

  rows.forEach(row => {
    Object.entries(CONSUMPTION_ADJUSTMENTS).forEach(([formulaId, factorIds]) => {
      const formulaKey = `l_${formulaId}`
      if (row[formulaKey] === undefined) return

      factorIds.forEach(factorId => {
        const factorValue = row[`l_${factorId}`]
        if (Number.isFinite(factorValue)) {
          row[formulaKey] -= factorValue
        }
      })
    })
  })

  return rows
}

// Extrae el top/bottom a partir de la diferencia de consumo del último par de semanas (n-1, n).
export const getTopAndBottomConsumersByPair = (points, week, count = 5) => {
  const withComparison = (points || [])
    .filter(item => !item.noRead)
    .map(item => ({
      ...item,
      ...getPointWeekComparison(item, week)
    }))

  const sortedDesc = [...withComparison].sort((a, b) => b.difference - a.difference)
  const sortedAsc = [...withComparison].sort((a, b) => a.difference - b.difference)

  return {
    top5: sortedDesc.slice(0, count),
    bottom5: sortedAsc.slice(0, count)
  }
}