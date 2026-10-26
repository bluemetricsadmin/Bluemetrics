import { useState } from 'react'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import {
  Loader2Icon,
  Target,
  CheckCircle2Icon,
  AlertTriangleIcon,
  CalendarIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  Settings2Icon,
  CalculatorIcon,
} from 'lucide-react'
import { formatMX, formatMXPercent } from '../utils/formatMX'
import { useWellsAnnualTargets } from '../hooks/useWellsAnnualTargets'
import { toPercent } from '../utils/wellsTargets'
import WellsTargetsConfigDialog from './WellsTargetsConfigDialog'
import WellsTargetsSimulator from './WellsTargetsSimulator'

const COLOR_STYLES = {
  blue: {
    icon: 'text-blue-500',
    iconBg: 'bg-blue-500/10',
    badge: 'text-blue-700 border-blue-300 bg-blue-50 dark:text-blue-300 dark:border-blue-800 dark:bg-blue-900/20',
  },
  green: {
    icon: 'text-green-500',
    iconBg: 'bg-green-500/10',
    badge: 'text-green-700 border-green-300 bg-green-50 dark:text-green-300 dark:border-green-800 dark:bg-green-900/20',
  },
  purple: {
    icon: 'text-purple-500',
    iconBg: 'bg-purple-500/10',
    badge: 'text-purple-700 border-purple-300 bg-purple-50 dark:text-purple-300 dark:border-purple-800 dark:bg-purple-900/20',
  },
}

const STATUS_BADGE = {
  ok: 'text-green-700 border-green-300 bg-green-50 dark:text-green-300 dark:border-green-800 dark:bg-green-900/20',
  bad: 'text-red-700 border-red-300 bg-red-50 dark:text-red-300 dark:border-red-800 dark:bg-red-900/20',
}

function TargetCard({
  status,
  year,
  rule,
  color,
  subtitle,
  comparison,
  metaLabel = 'Meta',
  progressLabel = 'de la meta',
  goalPhrase = 'la meta',
  exceededBadge = 'Meta excedida',
  projected = false,
}) {
  const styles = COLOR_STYLES[color] || COLOR_STYLES.blue
  const { actual, meta, delta, pct, cumple } = status
  const barWidth = Math.min(Math.max(pct, 0), 100)

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-foreground">{year}</span>
              <Badge variant="outline" className={`text-xs ${styles.badge}`}>
                {rule}
              </Badge>
              {projected && (
                <Badge variant="outline" className="text-xs border-purple-300 bg-purple-50 text-purple-700">
                  Proyección
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          </div>
          <div className={`h-12 w-12 rounded-full ${styles.iconBg} flex items-center justify-center`}>
            <Target className={`h-6 w-6 ${styles.icon}`} />
          </div>
        </div>

        <div className="mt-4 flex items-end justify-between">
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

        {comparison && (
          <div className="mt-3 rounded-md border border-muted bg-muted/40 px-3 py-2 space-y-1">
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
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-muted">
                <span>{comparison.footerLabel}</span>
                <span className="font-medium text-foreground">
                  {formatMX(comparison.footerValue)} m³
                </span>
              </div>
            )}
          </div>
        )}

        {projected ? (
          <div className="mt-4 rounded-md border border-purple-200 bg-purple-50/60 px-3 py-2 text-sm text-purple-700">
            Año sin registros: la meta se calcula con la base configurada.
          </div>
        ) : (
          <>
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">
                  {formatMXPercent(pct)} {progressLabel}
                </span>
                <Badge variant="outline" className={cumple ? STATUS_BADGE.ok : STATUS_BADGE.bad}>
                  {cumple ? (
                    <>
                      <CheckCircle2Icon className="h-3 w-3 mr-1" />
                      {actual <= 0 ? 'Sin datos' : 'Cumpliendo'}
                    </>
                  ) : (
                    <>
                      <AlertTriangleIcon className="h-3 w-3 mr-1" />
                      {exceededBadge}
                    </>
                  )}
                </Badge>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full ${cumple ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>

            <p className={`mt-3 text-sm ${cumple ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {cumple
                ? `Te quedan ${formatMX(Math.max(delta, 0))} m³ para mantenerte dentro de ${goalPhrase}`
                : `Excediste ${goalPhrase} por ${formatMX(Math.abs(delta))} m³`}
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

export default function WellsAnnualTargets() {
  const [configOpen, setConfigOpen] = useState(false)
  const [simulatorOpen, setSimulatorOpen] = useState(false)

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

  const orderedRows = [
    ...rows.filter((row) => row.isCurrent),
    ...rows.filter((row) => row.isFuture).sort((a, b) => a.year - b.year),
    ...rows
      .filter((row) => !row.isCurrent && !row.isFuture)
      .sort((a, b) => b.year - a.year),
  ]

  const cardStatus = (row) => ({
    actual: row.actual,
    meta: row.meta,
    delta: row.delta,
    pct: row.pct,
    cumple: row.cumple,
  })

  const cardMetaLabel = (row) => {
    if (row.isCurrent) return `Meta acumulada (sem. 1–${currentWeek})`
    if (row.isFuture) return 'Meta anual proyectada'
    return 'Meta anual'
  }

  const cardSubtitle = (row) => {
    if (row.isCurrent) return `Año en curso · Semana 1 – ${currentWeek}`
    if (row.isFuture) return 'Año futuro · Sin registros'
    return 'Año cerrado · Total registrado'
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 pb-3 border-b">
        <Target className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Metas Anuales de Consumo</h2>
        {hasData && (
          <Badge variant="outline" className="text-xs text-muted-foreground">
            <CalendarIcon className="h-3 w-3 mr-1" />
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
            <Settings2Icon className="h-4 w-4 mr-1" />
            Configurar metas
          </Button>
          <Button
            size="sm"
            onClick={() => setSimulatorOpen(true)}
            disabled={loading || Boolean(error)}
          >
            <CalculatorIcon className="h-4 w-4 mr-1" />
            Simulador
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {[0, 1].map((i) => (
            <Card key={i}>
              <CardContent className="p-6 flex items-center justify-center h-48">
                <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="mt-6">
          <CardContent className="p-6 flex flex-col items-center gap-3 text-center">
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
        <Card className="mt-6">
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            No hay datos de consumo suficientes para calcular las metas.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {orderedRows.map((row) => (
            <TargetCard
              key={row.year}
              status={cardStatus(row)}
              year={row.year}
              rule={buildRuleLabel(row)}
              color={row.isCurrent ? 'blue' : row.isFuture ? 'purple' : 'green'}
              metaLabel={cardMetaLabel(row)}
              progressLabel={
                row.isCurrent ? `de la meta acumulada (sem. 1–${currentWeek})` : 'de la meta'
              }
              goalPhrase={row.isCurrent ? 'la meta acumulada' : 'la meta'}
              exceededBadge={row.isCurrent ? 'Meta acumulada excedida' : 'Meta excedida'}
              subtitle={cardSubtitle(row)}
              comparison={buildComparison(row)}
              projected={row.isFuture}
            />
          ))}
        </div>
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
