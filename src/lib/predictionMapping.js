const HISTORICO_COLUMNS =
  'l_pozo_11,l_pozo_14,l_pozo_12,l_pozo_7,l_pozo_3,l_medidor_general_pozos,l_fecha_inicio,l_numero_semana'

const COLUMN_MAP = {
  l_pozo_3: 'l_pozo_3',
  l_pozo_7: 'l_pozo_7',
  l_pozo_11: 'l_pozo_11',
  l_pozo_12: 'l_pozo_12',
  l_pozo_14: 'l_pozo_14',
  l_medidor_general_pozos: 'medidor_general',
}

export function mapConsumoRowToHistorico(row) {
  const mapped = {
    Fecha: row.l_fecha_inicio,
    medidor_general: parseFloat(row.l_medidor_general_pozos) || 0,
    total_pozos_ap: 0,
  }

  let total = 0
  for (const [supaCol, apiCol] of Object.entries(COLUMN_MAP)) {
    if (apiCol === 'medidor_general') continue
    const value = parseFloat(row[supaCol]) || 0
    mapped[apiCol] = value
    total += value
  }
  mapped.total_pozos_ap = total

  return mapped
}

// Nunca lanza: devuelve { data, error } para que los callers conserven su propio
// manejo de errores (usePredictions.js aplica info/pozos aunque esta consulta falle).
export async function fetchRecentHistoricalData(supabase, tableName, limit = 12) {
  const { data: rows, error } = await supabase
    .from(tableName)
    .select(HISTORICO_COLUMNS)
    .order('l_numero_semana', { ascending: false })
    .limit(limit)

  if (error) return { data: null, error }

  const sorted = [...(rows || [])].reverse()
  return { data: sorted.map(mapConsumoRowToHistorico), error: null }
}
