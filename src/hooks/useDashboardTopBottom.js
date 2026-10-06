import { useEffect, useMemo, useState } from 'react'
import {
  dashboardConsumptionService,
  getSelectedWaterPoints,
  getSelectedGasPoints,
  buildPointsWithData,
  buildAvailableWeeks,
  WATER_CONSUMPTION_TABLE,
  GAS_CONSUMPTION_TABLE,
} from '../services/dashboardConsumption'
import { getTopAndBottomConsumersByPair } from '../utils/consumptionHelpers'

const EMPTY_TOP_BOTTOM = { top5: [], bottom5: [] }

/**
 * Carga y normaliza el consumo semanal de agua y gas y calcula el
 * Top 5 mayor/menor por la diferencia del par de semanas (n-1, n).
 */
export function useDashboardTopBottom() {
  const [rows, setRows] = useState([])
  const [gasRows, setGasRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [gasLoading, setGasLoading] = useState(true)
  const [error, setError] = useState(null)
  const [gasError, setGasError] = useState(null)
  const [selectedWeek, setSelectedWeek] = useState(null)

  const points = useMemo(() => getSelectedWaterPoints(), [])
  const gasPoints = useMemo(() => getSelectedGasPoints(), [])

  useEffect(() => {
    const fetchWaterConsumption = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data, error: fetchError } =
          await dashboardConsumptionService.fetchWeeklyRows(
            WATER_CONSUMPTION_TABLE,
            'l_numero_semana'
          )

        if (fetchError) {
          console.error('❌ Error cargando consumo:', fetchError)
          setError(fetchError.message)
          return
        }

        setRows(data)

        const weeks = buildAvailableWeeks(data)
        if (weeks.length > 0) {
          const lastWeek = weeks[weeks.length - 1].weekNumber
          setSelectedWeek(prev => prev ?? lastWeek)
        }
      } catch (err) {
        console.error('❌ Error al cargar datos:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchWaterConsumption()
  }, [])

  useEffect(() => {
    const fetchGasConsumption = async () => {
      try {
        setGasLoading(true)
        setGasError(null)

        const { data, error: fetchError } =
          await dashboardConsumptionService.fetchWeeklyRows(
            GAS_CONSUMPTION_TABLE,
            'numero_semana'
          )

        if (fetchError) {
          console.error('❌ Error cargando consumo de gas:', fetchError)
          setGasError(fetchError.message)
          return
        }

        setGasRows(data)
      } catch (err) {
        console.error('❌ Error al cargar datos de gas:', err)
        setGasError(err.message)
      } finally {
        setGasLoading(false)
      }
    }

    fetchGasConsumption()
  }, [])

  const pointsWithData = useMemo(
    () =>
      buildPointsWithData(points, rows, {
        columnPrefix: 'l_',
        weekKey: 'l_numero_semana',
      }),
    [points, rows]
  )

  const gasPointsWithData = useMemo(
    () =>
      buildPointsWithData(gasPoints, gasRows, {
        columnPrefix: '',
        weekKey: 'numero_semana',
      }),
    [gasPoints, gasRows]
  )

  const availableWeeks = useMemo(() => buildAvailableWeeks(rows), [rows])

  const selectedWeekInfo = useMemo(
    () => availableWeeks.find(week => week.weekNumber === selectedWeek),
    [availableWeeks, selectedWeek]
  )

  const previousWeek = selectedWeek ? selectedWeek - 1 : null

  const globalTopBottom = useMemo(
    () =>
      selectedWeek
        ? getTopAndBottomConsumersByPair(pointsWithData, selectedWeek)
        : EMPTY_TOP_BOTTOM,
    [pointsWithData, selectedWeek]
  )

  const gasTopBottom = useMemo(
    () =>
      selectedWeek
        ? getTopAndBottomConsumersByPair(gasPointsWithData, selectedWeek)
        : EMPTY_TOP_BOTTOM,
    [gasPointsWithData, selectedWeek]
  )

  return {
    points,
    gasPoints,
    loading,
    error,
    gasLoading,
    gasError,
    selectedWeek,
    setSelectedWeek,
    availableWeeks,
    selectedWeekInfo,
    previousWeek,
    globalTopBottom,
    gasTopBottom,
  }
}
