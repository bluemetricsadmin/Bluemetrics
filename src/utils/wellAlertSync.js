/**
 * wellAlertSync.js
 * Sincronización de alertas automáticas con Supabase.
 * Evita duplicados y respeta alertas ya gestionadas por el usuario.
 */
import { supabase } from '../supabaseClient'

const ANOMALY_EVENT_TYPE = 'anomalia_sobreconsumo'

/**
 * Obtiene las alertas automáticas existentes para un año dado.
 * @param {number} year - Año a consultar
 * @returns {object[]} Alertas automáticas existentes
 */
export async function getExistingAutoAlerts(year) {
  const { data, error } = await supabase
    .from('well_events')
    .select('id, event_type, severity, alert_week, alert_year, alert_month, alert_date, alert_granularity, meter_column, event_status')
    .eq('event_type', ANOMALY_EVENT_TYPE)
    .eq('alert_year', year)

  if (error) {
    console.error('Error consultando alertas automáticas existentes:', error)
    return []
  }

  return data || []
}

/**
 * Genera una clave única por lectura (granularidad + periodo),
 * ya que solo debe existir UNA alerta por lectura.
 */
function alertKey(alert) {
  const granularity = alert.alert_granularity
  if (granularity === 'daily') {
    return `${ANOMALY_EVENT_TYPE}_daily_${alert.alert_date || ''}`
  }
  if (granularity === 'weekly') {
    return `${ANOMALY_EVENT_TYPE}_weekly_${alert.alert_year}_${alert.alert_week}`
  }
  if (granularity === 'monthly') {
    return `${ANOMALY_EVENT_TYPE}_monthly_${alert.alert_year}_${alert.alert_month}`
  }
  return `${ANOMALY_EVENT_TYPE}_${granularity}_${alert.alert_year}_${alert.alert_week || ''}_${alert.alert_month || ''}`
}

/**
 * Sincroniza alertas automáticas con Supabase.
 * - No inserta si ya existe una alerta para la misma lectura (granularidad + periodo)
 * - No sobrescribe alertas que el usuario ya marcó como completadas o canceladas
 * @param {object[]} alerts - Alertas generadas por el evaluador
 * @returns {{ inserted: number, skipped: number }} Resultado de la sincronización
 */
export async function syncAutomaticAlerts(alerts) {
  if (!alerts || alerts.length === 0) return { inserted: 0, skipped: 0 }

  const years = [...new Set(alerts.map((a) => a.alert_year).filter(Boolean))]
  const existing = []
  for (const year of years) {
    existing.push(...(await getExistingAutoAlerts(year)))
  }

  // Crear set de claves existentes
  const existingKeys = new Set(existing.map(alertKey))

  // Filtrar alertas nuevas (que no existen aún)
  const newAlerts = alerts.filter((alert) => !existingKeys.has(alertKey(alert)))

  if (newAlerts.length === 0) {
    return { inserted: 0, skipped: alerts.length }
  }

  const { data, error } = await supabase
    .from('well_events')
    .insert(newAlerts)
    .select()

  if (error) {
    console.error('Error insertando alertas automáticas:', error)
    if (error.code === '23505') {
      console.warn('Algunas alertas ya existían (índice único)')
      return { inserted: 0, skipped: alerts.length }
    }
    throw error
  }

  console.log(`✅ Alertas automáticas sincronizadas: ${data?.length || 0} nuevas, ${alerts.length - newAlerts.length} omitidas`)
  return {
    inserted: data?.length || 0,
    skipped: alerts.length - newAlerts.length
  }
}

/**
 * Actualiza el estado de una alerta automática (para botones rápidos).
 * @param {string} eventId - UUID del evento
 * @param {string} newStatus - Nuevo estado ('completado' | 'cancelado')
 * @returns {boolean} true si se actualizó correctamente
 */
export async function updateAlertStatus(eventId, newStatus) {
  const updateData = {
    event_status: newStatus,
    ...(newStatus === 'completado' ? { end_date: new Date().toISOString() } : {})
  }

  const { error } = await supabase
    .from('well_events')
    .update(updateData)
    .eq('id', eventId)

  if (error) {
    console.error('Error actualizando estado de alerta:', error)
    return false
  }

  return true
}