/**
 * Utilidad para obtener el nombre de la tabla de lecturas semanales según el año
 * @param {string|number} year - Año (ej: '2024', '2025', 2024, 2025)
 * @returns {string} - Nombre de la tabla (ej: 'lecturas_semana_agua_2024', 'lecturas_semana_agua_2025')
 */
export const getTableNameByYear = (year) => {
  const yearStr = year.toString()
  
  // Todas las tablas usan el formato 'lecturas_semana_agua_' + año (todo en minúsculas)
  return `lecturas_semana_agua_${yearStr}`
}

/**
 * Utilidad para obtener el nombre de la tabla de lecturas semanales de GAS según el año
 * @param {string|number} year - Año (ej: '2024', '2025', 2024, 2025)
 * @returns {string} - Nombre de la tabla (ej: 'lecturas_semanales_gas_2024', 'lecturas_semanales_gas_2025')
 */
export const getGasTableNameByYear = (year) => {
  const yearStr = year.toString()
  
  // Para gas, todas las tablas incluyen el año en el nombre
  return `lecturas_semanales_gas_${yearStr}`
}

/**
 * Utilidad para obtener el nombre de la tabla de lecturas semanales (nueva estructura) según el año
 * @param {string|number} year - Año (ej: '2024', '2025', 2024, 2025)
 * @returns {string} - Nombre de la tabla (ej: 'lecturas_semanales_2024', 'lecturas_semanales_2025')
 */
export const getWeeklyTableNameByYear = (year) => {
  const yearStr = year.toString()
  return `lecturas_semanales_${yearStr}`
}

/**
 * Utilidad para obtener el nombre de la tabla de consumo semanal según el año
 * @param {string|number} year - Año (ej: '2024', '2025', 2024, 2025)
 * @returns {string} - Nombre de la tabla (ej: 'lecturas_semanales_consumo_2024', 'lecturas_semanales_consumo_2025')
 */
export const getWeeklyConsumptionTableNameByYear = (year) => {
  const yearStr = year.toString()
  return `lecturas_semanales_consumo_${yearStr}`
}

/**
 * Lista de años disponibles en el sistema
 */
export const AVAILABLE_YEARS = ['2023', '2024', '2025', '2026']

/**
 * Año por defecto (el más reciente)
 */
export const DEFAULT_YEAR = '2026'
