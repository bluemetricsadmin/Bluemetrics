export const getPreviousYearData = (multiYearData, currentYear) => {
  if (!Array.isArray(multiYearData) || multiYearData.length === 0) return null
  const yearNum = parseInt(String(currentYear), 10)
  if (Number.isNaN(yearNum)) return null
  const prevItem = multiYearData.find(y => parseInt(String(y.year), 10) === yearNum - 1)
  if (!prevItem || !Array.isArray(prevItem.data) || prevItem.data.length === 0) return null
  return prevItem.data
}

export const calcularCambioPct = (valorActual, valorAnterior) => {
  const actual = parseFloat(valorActual)
  const anterior = parseFloat(valorAnterior)
  if (!Number.isFinite(actual) || !Number.isFinite(anterior)) return null
  if (actual <= 0 || anterior <= 0) return null
  return ((actual - anterior) / anterior) * 100
}

export const construirEtiquetaYoY = ({ valorActual, valorAnterior, etiquetaPeriodo, unidad }) => {
  if (valorAnterior === null || valorAnterior === undefined) return ''
  const pct = calcularCambioPct(valorActual, valorAnterior)
  if (pct === null) return ''
  const signo = pct > 0 ? '+' : ''
  const valorFormateado = parseFloat(valorAnterior).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `vs ${etiquetaPeriodo}: ${valorFormateado} ${unidad} (${signo}${pct.toFixed(1)}%)`
}

export const extraerDiaDeDiaHora = (diaHora) => {
  if (!diaHora) return null
  const match = String(diaHora).match(/(\d{1,2})/)
  return match ? match[1] : null
}

export const derivarMesDeLectura = (item) => {
  if (!item) return null
  if (item.mes) return String(item.mes).trim().toLowerCase()
  if (item.mes_anio) return String(item.mes_anio).trim().split(/\s+/)[0].toLowerCase() || null
  return null
}
