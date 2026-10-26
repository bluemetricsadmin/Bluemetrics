export const DEFAULT_REDUCTION_BY_YEAR = {
  2025: 0.2,
  2026: 0.1,
}

export const getDefaultReduction = (year) => DEFAULT_REDUCTION_BY_YEAR[year] ?? 0.1

export const getDefaultTargetSettings = (referenceYear = new Date().getFullYear()) => ({
  currentYear: referenceYear,
  availableYears: [referenceYear - 1, referenceYear, referenceYear + 1],
})

export const normalizeYear = (value) => {
  const year = Number.parseInt(value, 10)
  return Number.isFinite(year) && year >= 2000 && year <= 2100 ? year : null
}

export const toFraction = (pct) => {
  const value = Number(pct)
  return Number.isFinite(value) ? value / 100 : 0
}

export const toPercent = (fraction) => {
  const value = Number(fraction)
  return Number.isFinite(value) ? value * 100 : 0
}

export const clampReduction = (fraction) => Math.min(Math.max(Number(fraction) || 0, -0.99), 0.99)

export const computeTarget = (base, reductionFraction) => {
  const baseValue = Number(base) || 0
  const reduction = clampReduction(reductionFraction)
  return Math.max(baseValue * (1 - reduction), 0)
}

export const sumUpToWeek = (series, cutoff) => {
  if (!series || !Array.isArray(series.weeks) || cutoff <= 0) return 0
  return series.weeks.reduce(
    (acc, item) => (item.week <= cutoff ? acc + item.consumption : acc),
    0
  )
}

export const pickActiveConfig = (versions = []) => {
  if (!versions.length) return null
  const approved = versions
    .filter((item) => item.status === 'approved')
    .sort((a, b) => b.version - a.version)[0]
  if (approved) return approved
  return [...versions].sort((a, b) => b.version - a.version)[0] || null
}

export const groupVersionsByYear = (versions = []) =>
  versions.reduce((acc, item) => {
    if (!acc[item.year]) acc[item.year] = []
    acc[item.year].push(item)
    return acc
  }, {})

export const resolveBaseValue = ({
  year,
  config,
  baseMode,
  actualTotals = {},
  targetByYear = {},
}) => {
  const mode = baseMode || config?.baseMode || 'actual'

  if (mode === 'manual') {
    return Number(config?.baseValue) || 0
  }

  if (mode === 'target') {
    const previousTarget = targetByYear[year - 1]
    if (previousTarget !== undefined) return previousTarget
  }

  const previousActual = actualTotals[year - 1]
  if (previousActual !== undefined) return previousActual

  const previousTarget = targetByYear[year - 1]
  return previousTarget !== undefined ? previousTarget : 0
}

const estimateSameWeekBase = ({
  previousSeries,
  currentWeek,
  fallbackBase,
  preferActual = true,
}) => {
  if (preferActual) {
    const previousSameWeek = sumUpToWeek(previousSeries, currentWeek)
    if (previousSameWeek > 0) return previousSameWeek
  }

  const weeksInYear = previousSeries?.weeks?.length || 52
  const ratio = weeksInYear > 0 ? Math.min(currentWeek, weeksInYear) / weeksInYear : 0
  return fallbackBase * ratio
}

export const buildTargetRows = ({
  years = [],
  configsByYear = {},
  actualTotals = {},
  seriesByYear = {},
  currentYear = new Date().getFullYear(),
  currentWeek = 0,
}) => {
  const sortedYears = [...new Set(years)].filter(Boolean).sort((a, b) => a - b)
  const targetByYear = {}
  const rows = []

  sortedYears.forEach((year) => {
    const config = configsByYear[year] || null
    const reductionPct = clampReduction(config?.reductionPct ?? getDefaultReduction(year))
    const baseMode = config?.baseMode || (year > currentYear ? 'target' : 'actual')
    const baseValue = resolveBaseValue({ year, config, baseMode, actualTotals, targetByYear })
    const annualMeta = computeTarget(baseValue, reductionPct)
    targetByYear[year] = annualMeta

    const series = seriesByYear?.[year]
    const previousSeries = seriesByYear?.[year - 1]
    const hasRecords = Boolean(series && Array.isArray(series.weeks) && series.weeks.length > 0)
    const actual = Number(actualTotals?.[year]) || 0
    const previousYearActual = actualTotals?.[year - 1]
    const isCurrent = year === currentYear
    const isFuture = year > currentYear

    const previousSameWeek = sumUpToWeek(previousSeries, currentWeek)
    const toWeekMeta = isCurrent
      ? computeTarget(
          estimateSameWeekBase({
            previousSeries,
            currentWeek,
            fallbackBase: baseValue,
            preferActual: baseMode === 'actual',
          }),
          reductionPct
        )
      : annualMeta

    const meta = isCurrent ? toWeekMeta : annualMeta
    const delta = meta - actual
    const pct = meta > 0 ? (actual / meta) * 100 : 0
    const cumple = actual <= meta

    const comparisonBase = isCurrent
      ? previousSameWeek > 0
        ? previousSameWeek
        : baseValue
      : previousYearActual

    const changePct =
      comparisonBase > 0
        ? ((actual - comparisonBase) / comparisonBase) * 100
        : isFuture && baseValue > 0
          ? ((annualMeta - baseValue) / baseValue) * 100
          : 0

    rows.push({
      year,
      config,
      configStatus: config?.status || (isFuture ? 'projected' : 'default'),
      configVersion: config?.version || null,
      reductionPct,
      baseMode,
      baseValue,
      annualMeta,
      toWeekMeta,
      meta,
      actual,
      delta,
      pct,
      cumple,
      hasRecords,
      isCurrent,
      isFuture,
      lastWeek: series?.lastWeek || 0,
      previousYear: year - 1,
      previousYearActual,
      previousSameWeek: isCurrent ? comparisonBase : previousYearActual,
      vsPreviousPct: changePct,
      series,
    })
  })

  return rows
}
