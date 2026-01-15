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

/**
 * Utilidad para obtener el nombre de la tabla de lecturas MENSUALES de agua
 * Nota: Esta es una tabla única multi-año (no separada por año)
 * @returns {string} - Nombre de la tabla: 'lecturas_mensuales_agua'
 */
export const getMonthlyWaterTableName = () => {
  return 'lecturas_mensuales_agua'
}

/**
 * Utilidad para obtener el nombre de la tabla de CONSUMO mensual de agua
 * Nota: Esta es una tabla única multi-año (no separada por año)
 * @returns {string} - Nombre de la tabla: 'lecturas_mensuales_agua_consumo'
 */
export const getMonthlyWaterConsumptionTableName = () => {
  return 'lecturas_mensuales_agua_consumo'
}

/**
 * Lista de meses disponibles
 */
export const MONTHS = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' }
]

/**
 * Obtener nombre del mes por su número
 * @param {number} monthNumber - Número del mes (1-12)
 * @returns {string} - Nombre del mes
 */
export const getMonthName = (monthNumber) => {
  const month = MONTHS.find(m => m.value === monthNumber)
  return month ? month.label : ''
}
