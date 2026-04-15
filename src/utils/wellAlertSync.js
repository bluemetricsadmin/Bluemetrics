/**
 * wellAlertSync.js
 * Sincronización de alertas automáticas con Supabase.
 * Evita duplicados y respeta alertas ya gestionadas por el usuario.
 */
import { supabase } from '../supabaseClient'

/**
 * Obtiene las alertas automáticas existentes para un año dado.
 * @param {number} year - Año a consultar
 * @returns {object[]} Alertas automáticas existentes
 */
export async function getExistingAutoAlerts(year) {
  const { data, error } = await supabase
    .from('well_events')
    .select('well_id, event_type, severity, alert_week, alert_year, event_status')
    .eq('is_automatic', true)
    .eq('alert_year', year)

  if (error) {
    console.error('Error consultando alertas automáticas existentes:', error)
    return []
  }

  return data || []
}

/**
 * Genera una clave única para identificar una alerta automática.
 */
function alertKey(alert) {
  return `${alert.well_id}_${alert.event_type}_${alert.severity}_${alert.alert_week}_${alert.alert_year}`
}

/**
 * Sincroniza alertas automáticas con Supabase.
 * - No inserta si ya existe una alerta para la misma combinación (pozo, tipo, severidad, semana, año)
 * - No sobrescribe alertas que el usuario ya marcó como completadas o canceladas
 * @param {object[]} alerts - Alertas generadas por el evaluador
 * @returns {{ inserted: number, skipped: number }} Resultado de la sincronización
 */
export async function syncAutomaticAlerts(alerts) {
  if (!alerts || alerts.length === 0) return { inserted: 0, skipped: 0 }

  const year = alerts[0].alert_year
  const existing = await getExistingAutoAlerts(year)

  // Crear set de claves existentes
  const existingKeys = new Set(existing.map(alertKey))

  // Filtrar alertas nuevas (que no existen aún)
  const newAlerts = alerts.filter(alert => !existingKeys.has(alertKey(alert)))

  if (newAlerts.length === 0) {
    return { inserted: 0, skipped: alerts.length }
  }

  const { data, error } = await supabase
    .from('well_events')
    .insert(newAlerts)
    .select()

  if (error) {
    console.error('Error insertando alertas automáticas:', error)
    // Si el error es por duplicado del índice único, no es un error real
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
