import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import { predictionService } from '../services/predictionService'

const MODEL_POZOS = ['pozo_3', 'pozo_7', 'pozo_11', 'pozo_12', 'pozo_14']

const COLUMN_MAP = {
  l_pozo_3: 'l_pozo_3',
  l_pozo_7: 'l_pozo_7',
  l_pozo_11: 'l_pozo_11',
  l_pozo_12: 'l_pozo_12',
  l_pozo_14: 'l_pozo_14',
  l_medidor_general_pozos: 'medidor_general',
}

function mapSupabaseRow(row) {
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

export function usePredictions() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [predictions, setPredictions] = useState(null)
  const [historicalData, setHistoricalData] = useState([])
  const [apiInfo, setApiInfo] = useState(null)
  const [pozos, setPozos] = useState(MODEL_POZOS)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [info, { data: rows, error: supaError }] = await Promise.all([
        predictionService.getInfo(),
        supabase
          .from('lecturas_semana_agua_consumo_2026')
          .select('l_pozo_11,l_pozo_14,l_pozo_12,l_pozo_7,l_pozo_3,l_medidor_general_pozos,l_fecha_inicio,l_numero_semana')
          .order('l_numero_semana', { ascending: false })
          .limit(12),
      ])

      setApiInfo(info)
      if (info.pozos) setPozos(info.pozos)

      if (supaError) throw new Error(supaError.message)

      const sorted = [...rows].reverse()
      const mapped = sorted.map(mapSupabaseRow)
      setHistoricalData(mapped)

      const result = await predictionService.predict(mapped)
      setPredictions(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    loading,
    error,
    predictions,
    historicalData,
    apiInfo,
    pozos,
    refetch: fetchData,
  }
}
