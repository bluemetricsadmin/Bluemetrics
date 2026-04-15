/**
 * wellAlertEvaluator.js
 * Funciones puras para evaluar reglas de negocio de alertas automáticas de pozos.
 * 
 * Reglas:
 * 1. Incremento anormal: consumo actual > promedio últimas 3 semanas × 1.30
 * 2. Caída fuerte: consumo actual < promedio últimas 3 semanas × 0.60
 * 3. Sobreconsumo crítico: % real > % esperado + 20%
 * 4. Sobreconsumo preventivo: % real > % esperado + 10%
 */

/**
 * Evalúa si hay un pico o caída anormal de consumo semanal.
 * @param {number[]} lastConsumptions - Consumos de las últimas 3+ semanas (más reciente primero)
 * @param {number} currentConsumption - Consumo de la semana actual
 * @returns {object|null} Alerta generada o null
 */
export function evaluateConsumptionSpike(lastConsumptions, currentConsumption) {
  // Necesitamos al menos 3 semanas previas para calcular promedio
  if (!lastConsumptions || lastConsumptions.length < 3) return null
  if (currentConsumption === 0 && lastConsumptions.every(c => c === 0)) return null
  // Si el consumo actual es 0, no alertar - es normal que un pozo no se use en una semana
  if (currentConsumption === 0) return null

  const last3 = lastConsumptions.slice(0, 3)
  const average = last3.reduce((sum, val) => sum + val, 0) / 3

  // Evitar división por cero - si el promedio es 0 y hay consumo, es un incremento significativo
  if (average === 0) {
    if (currentConsumption > 0) {
      return {
        event_type: 'alerta_consumo',
        severity: 'critica',
        title: `Incremento anormal de consumo`,
        description: `El consumo de esta semana (${currentConsumption.toFixed(2)} m³) es significativo cuando el promedio de las últimas 3 semanas era 0 m³.`,
        recommendation: 'Revisar posibles fugas en líneas cercanas o válvulas abiertas.',
        metric_value: 100,
        threshold_value: 30
      }
    }
    return null
  }

  const changePercent = ((currentConsumption - average) / average) * 100

  // Regla 1: Incremento anormal (+30%)
  if (changePercent >= 30) {
    return {
      event_type: 'alerta_consumo',
      severity: 'critica',
      title: `Incremento anormal de consumo (+${changePercent.toFixed(1)}%)`,
      description: `El consumo de esta semana (${currentConsumption.toFixed(2)} m³) supera en ${changePercent.toFixed(1)}% al promedio de las últimas 3 semanas (${average.toFixed(2)} m³).`,
      recommendation: 'Revisar posibles fugas en líneas cercanas o válvulas abiertas.',
      metric_value: parseFloat(changePercent.toFixed(2)),
      threshold_value: 30
    }
  }

  // Regla 2: Caída fuerte (< -40%)
  if (changePercent <= -40) {
    return {
      event_type: 'alerta_consumo',
      severity: 'critica',
      title: `Caída fuerte de consumo (${changePercent.toFixed(1)}%)`,
      description: `El consumo de esta semana (${currentConsumption.toFixed(2)} m³) cayó ${Math.abs(changePercent).toFixed(1)}% respecto al promedio de las últimas 3 semanas (${average.toFixed(2)} m³).`,
      recommendation: 'Validar operación del pozo o funcionamiento del medidor.',
      metric_value: parseFloat(changePercent.toFixed(2)),
      threshold_value: -40
    }
  }

  return null
}

/**
 * Evalúa si hay sobreconsumo respecto al ritmo esperado del año.
 * @param {number} totalConsumption - Consumo acumulado del año
 * @param {number} annualLimit - Límite anual de m³ (m3ParaConsumir)
 * @param {Date} currentDate - Fecha actual
 * @returns {object|null} Alerta generada o null
 */
export function evaluateOverconsumption(totalConsumption, annualLimit, currentDate) {
  if (annualLimit <= 0) return null
  if (totalConsumption <= 0) return null

  const startOfYear = new Date(currentDate.getFullYear(), 0, 1)
  const dayOfYear = Math.floor((currentDate - startOfYear) / (1000 * 60 * 60 * 24)) + 1
  const expectedPercent = dayOfYear / 365
  const realPercent = totalConsumption / annualLimit

  // Regla 3: Sobreconsumo crítico (% real > % esperado + 20%)
  if (realPercent > expectedPercent + 0.20) {
    return {
      event_type: 'sobreconsumo',
      severity: 'critica',
      title: `Sobreconsumo crítico (${(realPercent * 100).toFixed(1)}% usado en ${(expectedPercent * 100).toFixed(1)}% del año)`,
      description: `Se ha utilizado el ${(realPercent * 100).toFixed(1)}% del volumen anual (${totalConsumption.toLocaleString('es-MX', { maximumFractionDigits: 2 })} de ${annualLimit.toLocaleString('es-MX', { maximumFractionDigits: 2 })} m³) cuando solo ha transcurrido el ${(expectedPercent * 100).toFixed(1)}% del año (día ${dayOfYear} de 365).`,
      recommendation: `Consumo acelerado: se ha utilizado el ${(realPercent * 100).toFixed(1)}% del volumen anual en solo el ${(expectedPercent * 100).toFixed(1)}% del año.`,
      metric_value: parseFloat((realPercent * 100).toFixed(2)),
      threshold_value: parseFloat(((expectedPercent + 0.20) * 100).toFixed(2))
    }
  }

  // Regla 4: Sobreconsumo preventivo (% real > % esperado + 10%)
  if (realPercent > expectedPercent + 0.10) {
    return {
      event_type: 'sobreconsumo',
      severity: 'preventiva',
      title: `Consumo por encima del ritmo esperado (${(realPercent * 100).toFixed(1)}% vs ${(expectedPercent * 100).toFixed(1)}% esperado)`,
      description: `Se ha consumido el ${(realPercent * 100).toFixed(1)}% del volumen anual cuando el ritmo esperado sería ${(expectedPercent * 100).toFixed(1)}%. Diferencia de ${((realPercent - expectedPercent) * 100).toFixed(1)} puntos porcentuales.`,
      recommendation: 'El consumo está por encima del ritmo esperado. Existe riesgo de sobrepasar el límite anual.',
      metric_value: parseFloat((realPercent * 100).toFixed(2)),
      threshold_value: parseFloat(((expectedPercent + 0.10) * 100).toFixed(2))
    }
  }

  return null
}

/**
 * Evalúa todas las reglas de alertas para un pozo.
 * @param {object} params
 * @param {number} params.wellId - ID del pozo
 * @param {number[]} params.weeklyConsumptions - Consumos semanales (más reciente primero, incluye semana actual)
 * @param {number} params.totalConsumption - Consumo acumulado del año
 * @param {number} params.annualLimit - Límite anual (m3ParaConsumir)
 * @param {number} params.currentWeek - Número de semana actual
 * @param {number} params.currentYear - Año actual
 * @param {Date} params.currentDate - Fecha actual
 * @returns {object[]} Array de alertas a crear
 */
export function evaluateAllAlerts({ wellId, weeklyConsumptions, totalConsumption, annualLimit, currentWeek, currentYear, currentDate }) {
  const alerts = []

  // Evaluación de pico/caída de consumo
  if (weeklyConsumptions && weeklyConsumptions.length >= 4) {
    const currentWeekConsumption = weeklyConsumptions[0]
    const previousWeeks = weeklyConsumptions.slice(1)
    const spikeAlert = evaluateConsumptionSpike(previousWeeks, currentWeekConsumption)
    if (spikeAlert) {
      alerts.push({
        well_id: wellId,
        ...spikeAlert,
        is_automatic: true,
        alert_week: currentWeek,
        alert_year: currentYear,
        start_date: currentDate.toISOString(),
        event_status: 'activo',
        author_name: 'Sistema Automático'
      })
    }
  }

  // Evaluación de sobreconsumo
  const overAlert = evaluateOverconsumption(totalConsumption, annualLimit, currentDate)
  if (overAlert) {
    alerts.push({
      well_id: wellId,
      ...overAlert,
      is_automatic: true,
      alert_week: currentWeek,
      alert_year: currentYear,
      start_date: currentDate.toISOString(),
      event_status: 'activo',
      author_name: 'Sistema Automático'
    })
  }

  return alerts
}
