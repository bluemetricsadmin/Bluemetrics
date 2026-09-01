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