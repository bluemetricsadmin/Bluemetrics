import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import {
  AlertTriangleIcon,
  CalculatorIcon,
  CalendarIcon,
  CheckCircle2Icon,
  Loader2Icon,
  Settings2Icon,
  Target,
  TrendingDownIcon,
  TrendingUpIcon,
} from 'lucide-react'
import { formatMX, formatMXInt, formatMXPercent } from '../utils/formatMX'
import { useWellsAnnualTargets } from '../hooks/useWellsAnnualTargets'
import { getMetaState, toPercent } from '../utils/wellsTargets'
import WellsTargetsConfigDialog from './WellsTargetsConfigDialog'
import WellsTargetsSimulator from './WellsTargetsSimulator'

const COLOR_STYLES = {
  blue: {
    icon: 'text-blue-500',
    iconBg: 'bg-blue-500/10',
    badge:
      'text-blue-700 border-blue-300 bg-blue-50 dark:text-blue-300 dark:border-blue-800 dark:bg-blue-900/20',
  },
  green: {
    icon: 'text-green-500',
    iconBg: 'bg-green-500/10',
    badge:
      'text-green-700 border-green-300 bg-green-50 dark:text-green-300 dark:border-green-800 dark:bg-green-900/20',
  },
  purple: {
    icon: 'text-purple-500',
    iconBg: 'bg-purple-500/10',
    badge:
      'text-purple-700 border-purple-300 bg-purple-50 dark:text-purple-300 dark:border-purple-800 dark:bg-purple-900/20',
  },
}

const STATUS_BADGE = {
  ok: 'text-green-700 border-green-300 bg-green-50 dark:text-green-300 dark:border-green-800 dark:bg-green-900/20',
  bad: 'text-red-700 border-red-300 bg-red-50 dark:text-red-300 dark:border-red-800 dark:bg-red-900/20',
}

const META_STATUS_CLASS = {
  approved:
    'text-green-700 border-green-300 bg-green-50 dark:text-green-300 dark:border-green-800 dark:bg-green-900/20',
  draft:
    'text-amber-700 border-amber-300 bg-amber-50 dark:text-amber-300 dark:border-amber-800 dark:bg-amber-900/20',
  superseded: 'text-gray-600 border-gray-300 bg-gray-50 dark:text-gray-300 dark:border-gray-700',
  default:
    'text-amber-700 border-amber-300 bg-amber-50 dark:text-amber-300 dark:border-amber-800 dark:bg-amber-900/20',
  projected:
    'text-purple-700 border-purple-300 bg-purple-50 dark:text-purple-300 dark:border-purple-800 dark:bg-purple-900/20',
}

const ROLE_STYLES = {
  selected: 'border-blue-300 bg-blue-50 text-blue-700',
  comparison: 'border-slate-300 bg-slate-50 text-slate-600',
}

const ROLE_LABELS = {
  selected: 'Seleccionado',
  comparison: 'Comparación',
}

function TargetCard({ row, currentWeek, role }) {
  const metaState = getMetaState(row)
  const styles = COLOR_STYLES[row.isCurrent ? 'blue' : row.isFuture ? 'purple' : 'green']
  const comparison = buildComparison(row)
  const { actual, meta, delta, pct, cumple } = row
  const barWidth = Math.min(Math.max(pct, 0), 100)
  const projected = row.isFuture

  const subtitle = row.isCurrent
    ? `Año en curso · Semana 1 – ${currentWeek}`
    : row.isFuture
      ? 'Año futuro · Sin registros'
      : 'Año cerrado · Total registrado'

  const metaLabel = row.isCurrent
    ? `Meta acumulada (sem. 1–${currentWeek})`
    : row.isFuture
      ? 'Meta anual proyectada'
      : 'Meta anual'

  const layoutRule = buildRuleLabel(row)

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lg font-semibold text-foreground">{row.year}</span>
              {role && (
                <Badge variant="outline" className={`text-xs ${ROLE_STYLES[role]}`}>
                  {ROLE_LABELS[role]}
                </Badge>
              )}
              <Badge
                variant="outline"
                className={`text-xs ${META_STATUS_CLASS[metaState.status] || META_STATUS_CLASS.default}`}
              >
                {metaState.label}
              </Badge>
              {projected && (
                <Badge variant="outline" className={`text-xs ${styles.badge}`}>
                  Proyección
                </Badge>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
            <p className="mt-1 text-xs text-muted-foreground">{layoutRule}</p>
          </div>
          <div
            className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full ${styles.iconBg}`}
          >
            <Target className={`h-5 w-5 ${styles.icon}`} />
          </div>
        </div>

        {!metaState.hasApproved && (
          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <AlertTriangleIcon className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            <span>
              {projected
                ? 'Sin meta vigente. La meta mostrada es una proyección con la reducción por defecto.'
                : 'Sin meta vigente. La meta mostrada usa la reducción por defecto.'}
            </span>
          </div>
        )}

        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Consumo real</p>
            <p className="text-2xl font-bold text-foreground">
              {projected ? 'Sin registros' : `${formatMX(actual)} m³`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">{metaLabel}</p>
            <p className={`text-lg font-semibold ${styles.icon}`}>{formatMX(meta)} m³</p>
          </div>
        </div>

        <div className="space-y-1 rounded-md border border-muted bg-muted/40 px-3 py-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{comparison.referenceLabel}</span>
            <span className="font-medium text-foreground">
              {formatMX(comparison.referenceValue)} m³
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{comparison.changeLabel}</span>
            <span
              className={`flex items-center gap-1 font-medium ${
                comparison.changePct <= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {comparison.changePct <= 0 ? (
                <TrendingDownIcon className="h-4 w-4" />
              ) : (
                <TrendingUpIcon className="h-4 w-4" />
              )}
              {comparison.changePct > 0 ? '+' : ''}
              {formatMXPercent(comparison.changePct)}
            </span>
          </div>
          {comparison.footerLabel && (
            <div className="flex items-center justify-between border-t border-muted pt-1 text-xs text-muted-foreground">
              <span>{comparison.footerLabel}</span>
              <span className="font-medium text-foreground">
                {formatMX(comparison.footerValue)} m³
              </span>
            </div>
          )}
        </div>

        {projected ? (
          <div className="rounded-md border border-purple-200 bg-purple-50/60 px-3 py-2 text-sm text-purple-700">
            Año sin registros: la meta se calcula con la base configurada.
          </div>
        ) : (
          <>
            <div>
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                  {formatMXPercent(pct)}{' '}
                  {row.isCurrent ? `de la meta acumulada (sem. 1–${currentWeek})` : 'de la meta'}
                </span>
                <Badge variant="outline" className={cumple ? STATUS_BADGE.ok : STATUS_BADGE.bad}>
                  {cumple ? (
                    <>
                      <CheckCircle2Icon className="mr-1 h-3 w-3" />
                      {actual <= 0 ? 'Sin datos' : 'Cumpliendo'}
                    </>
                  ) : (
                    <>
                      <AlertTriangleIcon className="mr-1 h-3 w-3" />
                      {row.isCurrent ? 'Meta acumulada excedida' : 'Meta excedida'}
                    </>
                  )}
                </Badge>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${cumple ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>

            <p
              className={`text-sm ${
                cumple ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}
            >
              {cumple
                ? `Te quedan ${formatMX(Math.max(delta, 0))} m³ para mantenerte dentro de ${
                    row.isCurrent ? 'la meta acumulada' : 'la meta'
                  }`
                : `Excediste ${row.isCurrent ? 'la meta acumulada' : 'la meta'} por ${formatMX(
                    Math.abs(delta)
                  )} m³`}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}

const buildRuleLabel = (row) => {
  const pct = toPercent(row.reductionPct)
  const sign = pct > 0 ? '-' : pct < 0 ? '+' : ''
  const baseLabel =
    row.baseMode === 'manual'
      ? 'base manual'
      : row.baseMode === 'target'
        ? `meta ${row.year - 1}`
        : `${row.year - 1}`
  return `Meta: ${sign}${formatMXPercent(Math.abs(pct))} vs ${baseLabel}`
}

const buildComparison = (row) => {
  if (row.isCurrent) {
    return {
      referenceLabel: `${row.year - 1} misma semana`,
      referenceValue: row.previousSameWeek,
      changeLabel: `${row.year} vs ${row.year - 1}`,
      changePct: row.vsPreviousPct,
      footerLabel: `Meta anual ${row.year}`,
      footerValue: row.annualMeta,
    }
  }

  if (row.isFuture) {
    return {
      referenceLabel:
        row.baseMode === 'manual'
          ? 'Base manual'
          : row.baseMode === 'target'
            ? `Meta ${row.year - 1}`
            : `Consumo real ${row.year - 1}`,
      referenceValue: row.baseValue,
      changeLabel: `Meta ${row.year} vs base`,
      changePct: row.vsPreviousPct,
    }
  }

  return {
    referenceLabel: `Total ${row.year - 1} (referencia)`,
    referenceValue: row.previousYearActual || 0,
    changeLabel: `${row.year} vs ${row.year - 1}`,
    changePct: row.vsPreviousPct,
    footerLabel: `Meta anual ${row.year}`,
    footerValue: row.annualMeta,
  }
}

function YearSelector({ years, selectedYear, currentYear, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2">
      {years.map((year) => {
        const isSelected = year === selectedYear
        const isCurrent = year === currentYear
        const isFuture = year > currentYear

        return (
          <button
            key={year}
            type="button"
            onClick={() => onSelect(year)}
            aria-pressed={isSelected}
            className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
              isSelected
                ? isFuture
                  ? 'border-purple-600 bg-purple-600 text-white shadow-sm'
                  : 'border-blue-600 bg-blue-600 text-white shadow-sm'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className="font-semibold">{year}</span>
            {isCurrent && (
              <span
                className={`ml-2 text-[10px] uppercase tracking-wide ${
                  isSelected ? 'text-blue-100' : 'text-blue-600'
                }`}
              >
                actual
              </span>
            )}
            {isFuture && (
              <span
                className={`ml-2 text-[10px] uppercase tracking-wide ${
                  isSelected ? 'text-purple-100' : 'text-purple-600'
                }`}
              >
                futuro
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export default function WellsAnnualTargets() {
  const [configOpen, setConfigOpen] = useState(false)
  const [simulatorOpen, setSimulatorOpen] = useState(false)
  const [selectedYear, setSelectedYear] = useState(null)

  const {
    loading,
    error,
    refetch,
    currentWeek,
    rows = [],
    settings,
    versionsByYear = {},
    hasData,
    saveDraft,
    approve,
    saveSettings,
  } = useWellsAnnualTargets()

  const currentRow = rows.find((row) => row.isCurrent) || null
  const currentYear = Number(settings?.currentYear) || new Date().getFullYear()

  const selectorYears = useMemo(() => {
    const configured = (settings?.availableYears || []).filter((year) =>
      rows.some((row) => row.year === year)
    )
    const allYears = new Set(configured)
    if (currentRow) allYears.add(currentRow.year)
    return [...allYears].sort((a, b) => a - b)
  }, [settings, rows, currentRow])

  useEffect(() => {
    if (!selectorYears.length) {
      if (selectedYear !== null) setSelectedYear(null)
      return
    }
    if (selectedYear === null || !selectorYears.includes(selectedYear)) {
      setSelectedYear(currentRow?.year ?? selectorYears[selectorYears.length - 1])
    }
  }, [selectorYears, currentRow, selectedYear])

  const activeYear = selectorYears.includes(selectedYear)
    ? selectedYear
    : currentRow?.year ?? selectorYears[selectorYears.length - 1] ?? null

  const selectedRow = rows.find((row) => row.year === activeYear) || null
  const comparisonYear = activeYear !== null ? activeYear - 1 : null
  const comparisonRow = rows.find((row) => row.year === comparisonYear) || null
  const selectedMetaState = getMetaState(selectedRow)
  const isFutureSelection = Boolean(activeYear && activeYear > currentYear)

  const reductionChartData = useMemo(
    () =>
      [comparisonRow, selectedRow]
        .filter(Boolean)
        .map((row) => {
          const hasMeta = getMetaState(row).hasApproved
          const fill = !hasMeta
            ? '#cbd5e1'
            : row.year === activeYear
              ? row.isFuture
                ? '#a855f7'
                : row.isCurrent
                  ? '#2563eb'
                  : '#22c55e'
              : '#94a3b8'

          return {
            year: String(row.year),
            reduccion: Number(toPercent(row.reductionPct).toFixed(2)),
            tieneMeta: hasMeta,
            fill,
          }
        }),
    [comparisonRow, selectedRow, activeYear]
  )

  const volumeChartData = useMemo(() => {
    const years = [comparisonRow, selectedRow].filter(Boolean)
    if (!years.length) return []

    const metaEntry = { name: 'Meta anual' }
    const actualEntry = { name: 'Consumo real' }

    years.forEach((row) => {
      const key = String(row.year)
      metaEntry[key] = row.annualMeta || 0
      actualEntry[key] = row.hasRecords ? row.actual : null
    })

    return [metaEntry, actualEntry]
  }, [comparisonRow, selectedRow])

  const comparisonLabel = comparisonYear ? `${activeYear} vs ${comparisonYear}` : `${activeYear}`

  const selectedBarColor = isFutureSelection ? '#a855f7' : selectedRow?.isCurrent ? '#2563eb' : '#22c55e'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 border-b pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Metas Anuales de Consumo</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Selecciona un año para compararlo contra el año anterior.
          </p>
        </div>
        {hasData && (
          <Badge variant="outline" className="text-xs text-muted-foreground">
            <CalendarIcon className="mr-1 h-3 w-3" />
            Semana 1 – {currentWeek}
          </Badge>
        )}
        <div className="ml-auto flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfigOpen(true)}
            disabled={loading || Boolean(error)}
          >
            <Settings2Icon className="mr-1 h-4 w-4" />
            Configurar metas
          </Button>
          <Button
            size="sm"
            onClick={() => setSimulatorOpen(true)}
            disabled={loading || Boolean(error)}
          >
            <CalculatorIcon className="mr-1 h-4 w-4" />
            Simulador
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {[0, 1].map((i) => (
            <Card key={i}>
              <CardContent className="flex h-48 items-center justify-center p-6">
                <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
            <AlertTriangleIcon className="h-8 w-8 text-destructive" />
            <p className="text-sm text-muted-foreground">
              No se pudieron cargar las metas de consumo: {error}
            </p>
            <Button variant="outline" size="sm" onClick={refetch}>
              Reintentar
            </Button>
          </CardContent>
        </Card>
      ) : !hasData ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            No hay datos de consumo suficientes para calcular las metas.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="space-y-4 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">Año a consultar</p>
                  <p className="text-xs text-muted-foreground">
                    Se muestran únicamente el año seleccionado y su año anterior.
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  Comparación: {comparisonLabel}
                </Badge>
              </div>

              <YearSelector
                years={selectorYears}
                selectedYear={activeYear}
                currentYear={currentYear}
                onSelect={setSelectedYear}
              />

              {isFutureSelection && (
                <div className="flex items-start gap-2 rounded-md border border-purple-300 bg-purple-50 px-3 py-2 text-sm text-purple-800">
                  <AlertTriangleIcon className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>
                    Proyección de año futuro: {activeYear} no tiene registros reales. La
                    comparación se hace contra {comparisonYear} y la meta se calcula con la base
                    configurada.
                    {!selectedMetaState.hasApproved &&
                      ' Este año no tiene meta vigente; se muestra la reducción por defecto.'}
                  </span>
                </div>
              )}

              {!isFutureSelection && selectedRow && !selectedMetaState.hasApproved && (
                <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  <AlertTriangleIcon className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>
                    El año {activeYear} no tiene una meta vigente. Se muestra la meta calculada
                    con la reducción por defecto.
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {isFutureSelection
                    ? `Proyección futura · ${comparisonLabel}`
                    : `Comparación ${comparisonLabel}`}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isFutureSelection
                    ? 'Año futuro sin registros reales; la meta se calcula con la base configurada.'
                    : 'Año seleccionado y año de referencia con su meta y consumo.'}
                </p>
              </div>
              {isFutureSelection && (
                <Badge variant="outline" className={`text-xs ${COLOR_STYLES.purple.badge}`}>
                  Proyección
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {selectedRow ? (
                <TargetCard row={selectedRow} currentWeek={currentWeek} role="selected" />
              ) : (
                <Card>
                  <CardContent className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
                    Sin datos para {activeYear}.
                  </CardContent>
                </Card>
              )}
              {comparisonRow ? (
                <TargetCard row={comparisonRow} currentWeek={currentWeek} role="comparison" />
              ) : (
                <Card>
                  <CardContent className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
                    Sin datos para el año de comparación {comparisonYear}.
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardContent className="p-5">
                <div className="mb-4">
                  <p className="text-sm font-semibold text-foreground">
                    Reducción % · {comparisonLabel}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Barras tenues indican años sin meta vigente (valor por defecto).
                  </p>
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={reductionChartData}
                      margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        tickFormatter={(value) => `${value}%`}
                        width={48}
                      />
                      <ReferenceLine y={0} stroke="#94a3b8" />
                      <Tooltip
                        formatter={(value, name, item) => [
                          `${formatMXPercent(value)}${
                            item?.payload?.tieneMeta ? '' : ' (sin meta vigente)'
                          }`,
                          'Reducción',
                        ]}
                        cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }}
                      />
                      <Bar dataKey="reduccion" radius={[6, 6, 0, 0]} maxBarSize={72}>
                        {reductionChartData.map((entry) => (
                          <Cell key={entry.year} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="mb-4">
                  <p className="text-sm font-semibold text-foreground">
                    Consumo y meta · {comparisonLabel}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Comparación de la meta anual contra el consumo real de cada año.
                  </p>
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={volumeChartData}
                      margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        tickFormatter={(value) => formatMXInt(value)}
                        width={64}
                      />
                      <Tooltip formatter={(value) => [`${formatMX(value)} m³`, 'Volumen']} />
                      <Bar
                        dataKey={comparisonYear ? String(comparisonYear) : 'comparison'}
                        name={comparisonYear ? String(comparisonYear) : 'Comparación'}
                        fill="#94a3b8"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={48}
                      />
                      <Bar
                        dataKey={activeYear ? String(activeYear) : 'selected'}
                        name={activeYear ? String(activeYear) : 'Seleccionado'}
                        fill={selectedBarColor}
                        radius={[6, 6, 0, 0]}
                        maxBarSize={48}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <WellsTargetsConfigDialog
        open={configOpen}
        onOpenChange={setConfigOpen}
        rows={rows}
        settings={settings}
        versionsByYear={versionsByYear}
        onSaveDraft={saveDraft}
        onApprove={approve}
        onSaveSettings={saveSettings}
      />

      <WellsTargetsSimulator
        open={simulatorOpen}
        onOpenChange={setSimulatorOpen}
        rows={rows}
        settings={settings}
        onSaveDraft={saveDraft}
        onApprove={approve}
      />
    </div>
  )
}
