import { useCallback, useEffect, useState } from 'react'
import {
  wellsConsumptionService,
  TARGET_YEARS,
  REDUCTION_2025,
  REDUCTION_2026,
} from '../services/wellsConsumption'

const CURRENT_YEAR = 2026
const PREVIOUS_YEAR = 2025
const BASE_YEAR = 2024

// Suma el consumo de las semanas 1..cutoff de una serie anual.
const sumUpToWeek = (series, cutoff) => {
  if (!series || cutoff <= 0) return 0
  return series.weeks.reduce(
    (acc, item) => (item.week <= cutoff ? acc + item.consumption : acc),
    0
  )
}

const buildStatus = (year, actual, meta) => {
  const delta = meta - actual // positivo: aún hay margen; negativo: meta excedida
  const pct = meta > 0 ? (actual / meta) * 100 : 0
  return { year, actual, meta, delta, pct, cumple: actual <= meta }
}

/**
 * Maneja el estado del totalizado de consumo de todos los pozos y calcula las
 * metas anuales:
 *   - 2025 (año cerrado): total de la última semana registrada vs 2024 (-20%).
 *   - 2026 (año en curso): meta anual = -10% sobre el total 2025, comparando
 *     el avance de 2026 contra 2025 en la misma semana actual.
 */
export function useWellsAnnualTargets() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const {
        totalsByYear,
        lastWeekByYear,
        seriesByYear,
        error: fetchError,
      } = await wellsConsumptionService.fetchAnnualTotals(TARGET_YEARS)

      if (fetchError && Object.keys(seriesByYear || {}).length === 0) {
        console.error('❌ Error cargando totalizado de pozos:', fetchError)
        setError(fetchError.message)
        setData(null)
        return
      }

      const currentWeek = lastWeekByYear?.[CURRENT_YEAR] || 0

      // Totales de año cerrado / acumulados a la última semana registrada.
      const total2024 = totalsByYear?.[BASE_YEAR] || 0
      const total2025 = totalsByYear?.[PREVIOUS_YEAR] || 0
      const total2026 = totalsByYear?.[CURRENT_YEAR] || 0

      // Equivalente de 2025 a la misma semana del año en curso.
      const total2025SameWeek = sumUpToWeek(seriesByYear?.[PREVIOUS_YEAR], currentWeek)

      // Metas: 2025 = -20% vs 2024 | 2026 = -10% vs 2025.
      const meta2025 = total2024 * (1 - REDUCTION_2025)
      const meta2026 = total2025 * (1 - REDUCTION_2026)

      // Meta 2026 equivalente al avance de la semana actual (misma ventana que 2025).
      const meta2026ToWeek = total2025SameWeek * (1 - REDUCTION_2026)

      const vsPreviousPct =
        total2025SameWeek > 0
          ? ((total2026 - total2025SameWeek) / total2025SameWeek) * 100
          : 0

      setData({
        currentWeek,
        totals: {
          [BASE_YEAR]: total2024,
          [PREVIOUS_YEAR]: total2025,
          [CURRENT_YEAR]: total2026,
        },
        meta2025,
        meta2026,
        current: {
          ...buildStatus(CURRENT_YEAR, total2026, meta2026ToWeek),
          annualMeta: meta2026,
          toWeekMeta: meta2026ToWeek,
          previousSameWeek: total2025SameWeek,
          vsPreviousPct,
        },
        previous: {
          ...buildStatus(PREVIOUS_YEAR, total2025, meta2025),
          base2024: total2024,
          vsBasePct:
            total2024 > 0 ? ((total2025 - total2024) / total2024) * 100 : 0,
        },
        hasData: currentWeek > 0 && Object.keys(seriesByYear || {}).length > 0,
      })
    } catch (err) {
      console.error('❌ Error al calcular metas de consumo:', err)
      setError(err.message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { loading, error, refetch: fetchData, ...(data || {}) }
}
