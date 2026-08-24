/**
 * Colores fijos por año para gráficas comparativas.
 * Garantiza coherencia visual: cada año calendario tiene siempre
 * el mismo color sin importar la gráfica, página o selección de años.
 *
 * Formato compatible con Chart.js datasets:
 *   border  -> borderColor / pointBackgroundColor base
 *   bg      -> backgroundColor en modo barras
 *   bgFill  -> backgroundColor en modo líneas (fill con opacidad)
 */

// Azul del año actual
export const CURRENT_YEAR_COLOR = {
  border: 'rgb(59, 130, 246)',
  bg: 'rgba(59, 130, 246, 0.6)',
  bgFill: 'rgba(59, 130, 246, 0.1)'
}

const makeColor = (rgb) => ({
  border: `rgb(${rgb})`,
  bg: `rgba(${rgb}, 0.6)`,
  bgFill: `rgba(${rgb}, 0.1)`
})

// Mapa fijo por año calendario
export const YEAR_COLORS = {
  '2022': makeColor('156, 163, 175'), // Gris
  '2023': makeColor('245, 158, 11'),  // Naranja
  '2024': makeColor('139, 92, 246'),  // Púrpura
  '2025': makeColor('34, 197, 94'),   // Verde
  '2026': CURRENT_YEAR_COLOR          // Azul (año actual)
}

// Paleta extendida determinista para años futuros no mapeados
const FALLBACK_PALETTE = [
  '6, 182, 212',    // Cian
  '236, 72, 153',   // Rosa
  '20, 184, 166',   // Teal
  '249, 115, 22',   // Naranja oscuro
  '99, 102, 241',   // Índigo
  '132, 204, 22'    // Lima
]

function getFallbackColor(year) {
  const numericYear = parseInt(year, 10)
  const index = Number.isFinite(numericYear)
    ? Math.abs(numericYear * 7) % FALLBACK_PALETTE.length
    : Math.abs(String(year).split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)) % FALLBACK_PALETTE.length
  return makeColor(FALLBACK_PALETTE[index])
}

/**
 * Devuelve el color fijo para un año dado.
 * @param {string|number} year - Año (ej. '2025' o 2025)
 * @returns {{border: string, bg: string, bgFill: string}}
 */
export function getColorForYear(year) {
  const key = String(year)
  return YEAR_COLORS[key] || getFallbackColor(key)
}
