import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContextNew'
import { wellsConsumptionService } from '../services/wellsConsumption'
import { wellsAnnualTargetsService } from '../services/wellsAnnualTargets'
import {
  buildTargetRows,
  getDefaultTargetSettings,
  groupVersionsByYear,
  normalizeYear,
  pickActiveConfig,
} from '../utils/wellsTargets'

export function useWellsAnnualTargets() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const fallbackSettings = getDefaultTargetSettings()
      const settingsResult = await wellsAnnualTargetsService.fetchTargetSettings()

      if (settingsResult.error) {
        console.warn('⚠️ No se pudo cargar la configuración de metas:', settingsResult.error)
      }

      const settings = settingsResult.data || fallbackSettings
      const currentYear = normalizeYear(settings.currentYear) || fallbackSettings.currentYear
      const configuredYears = (settings.availableYears || [])
        .map(normalizeYear)
        .filter(Boolean)

      const years = [...new Set([...configuredYears, currentYear])].sort((a, b) => a - b)

      const rowYears = [...new Set([...years, ...years.map((year) => year - 1)])].sort(
        (a, b) => a - b
      )

      const consumptionYears = [
        ...new Set([
          ...rowYears,
          ...rowYears.map((year) => year - 1),
          currentYear,
        ]),
      ]
        .filter((year) => year <= currentYear)
        .sort((a, b) => a - b)

      const versionsResult = await wellsAnnualTargetsService.fetchTargetVersions(rowYears)

      if (versionsResult.error) {
        console.warn('⚠️ No se pudieron cargar las versiones de metas:', versionsResult.error)
      }

      const versions = versionsResult.data || []
      const versionsByYear = groupVersionsByYear(versions)
      const configsByYear = rowYears.reduce((acc, year) => {
        const config = pickActiveConfig(versionsByYear[year])
        if (config) acc[year] = config
        return acc
      }, {})

      const {
        totalsByYear,
        lastWeekByYear,
        seriesByYear,
        error: consumptionError,
      } = await wellsConsumptionService.fetchAnnualTotals(consumptionYears)

      if (consumptionError && Object.keys(seriesByYear || {}).length === 0) {
        console.error('❌ Error cargando totalizado de pozos:', consumptionError)
        setError(consumptionError.message)
        setData(null)
        return
      }

      const currentWeek = lastWeekByYear?.[currentYear] || 0

      const rows = buildTargetRows({
        years: rowYears,
        configsByYear,
        actualTotals: totalsByYear || {},
        seriesByYear: seriesByYear || {},
        currentYear,
        currentWeek,
        baseYears: years,
      })

      const current = rows.find((row) => row.year === currentYear) || null
      const previous =
        rows.find((row) => row.year === currentYear - 1) ||
        [...rows].reverse().find((row) => row.year < currentYear && row.hasRecords) ||
        null

      setData({
        settings: {
          ...settings,
          currentYear,
          availableYears: years,
        },
        years,
        rows,
        versionsByYear,
        currentWeek,
        current,
        previous,
        hasData: rows.length > 0,
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

  const saveDraft = useCallback(
    async (payload) => {
      const { data: saved, error: saveError } =
        await wellsAnnualTargetsService.saveDraftTarget({
          ...payload,
          userId: user?.id || null,
        })

      if (saveError) throw saveError

      await fetchData()
      return saved
    },
    [fetchData, user?.id]
  )

  const approve = useCallback(
    async (id) => {
      const { data: approved, error: approveError } =
        await wellsAnnualTargetsService.approveTarget(id, user?.id || null)

      if (approveError) throw approveError

      await fetchData()
      return approved
    },
    [fetchData, user?.id]
  )

  const saveSettings = useCallback(
    async (payload) => {
      const { data: saved, error: saveError } =
        await wellsAnnualTargetsService.saveTargetSettings({
          ...payload,
          userId: user?.id || null,
        })

      if (saveError) throw saveError

      await fetchData()
      return saved
    },
    [fetchData, user?.id]
  )

  return useMemo(
    () => ({
      loading,
      error,
      refetch: fetchData,
      saveDraft,
      approve,
      saveSettings,
      ...(data || {}),
    }),
    [loading, error, fetchData, saveDraft, approve, saveSettings, data]
  )
}
