import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import { predictionService } from '../services/predictionService'
import { fetchRecentHistoricalData } from '../lib/predictionMapping'

const MODEL_POZOS = ['pozo_3', 'pozo_7', 'pozo_11', 'pozo_12', 'pozo_14']

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

      const [info, { data: mapped, error: supaError }] = await Promise.all([
        predictionService.getInfo(),
        fetchRecentHistoricalData(supabase, 'lecturas_semana_agua_consumo_2026', 12),
      ])

      setApiInfo(info)
      if (info.pozos) setPozos(info.pozos)

      if (supaError) throw new Error(supaError.message)

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
