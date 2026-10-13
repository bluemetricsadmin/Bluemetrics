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
} from 'lucide-react'
import { formatMX, formatMXPercent } from '../utils/formatMX'
import { useWellsAnnualTargets } from '../hooks/useWellsAnnualTargets'

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
}

const STATUS_BADGE = {
  ok: 'text-green-700 border-green-300 bg-green-50 dark:text-green-300 dark:border-green-800 dark:bg-green-900/20',
  bad: 'text-red-700 border-red-300 bg-red-50 dark:text-red-300 dark:border-red-800 dark:bg-red-900/20',
}

function TargetCard({ status, year, rule, color, subtitle, comparison, metaLabel = 'Meta' }) {
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
            <p className="text-2xl font-bold text-foreground">{formatMX(actual)} m³</p>
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

        <div className="mt-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">
              {formatMXPercent(pct)} de la meta
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
                  Meta excedida
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
            ? `Te quedan ${formatMX(Math.max(delta, 0))} m³ para mantenerte dentro de la meta`
            : `Excediste la meta por ${formatMX(Math.abs(delta))} m³`}
        </p>
      </CardContent>
    </Card>
  )
}

export default function WellsAnnualTargets() {
  const { loading, error, refetch, currentWeek, current, previous, hasData } =
    useWellsAnnualTargets()

  return (
    <div>
      <div className="flex items-center gap-3 pb-3 border-b">
        <Target className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Metas Anuales de Consumo</h2>
        {hasData && (
          <Badge variant="outline" className="text-xs text-muted-foreground">
            <CalendarIcon className="h-3 w-3 mr-1" />
            Semana 1 – {currentWeek}
          </Badge>
        )}
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
          {current && (
            <TargetCard
              status={current}
              year={current.year}
              rule="Meta: -10% vs 2025"
              color="blue"
              metaLabel="Meta equivalente"
              subtitle={`Año en curso · Semana 1 – ${currentWeek}`}
              comparison={{
                referenceLabel: '2025 misma semana',
                referenceValue: current.previousSameWeek,
                changeLabel: '2026 vs 2025',
                changePct: current.vsPreviousPct,
                footerLabel: 'Meta anual 2026',
                footerValue: current.annualMeta,
              }}
            />
          )}
          {previous && (
            <TargetCard
              status={previous}
              year={previous.year}
              rule="Meta: -20% vs 2024"
              color="green"
              subtitle="Año cerrado · Total últimas 52 semanas"
              comparison={{
                referenceLabel: 'Total 2024 (referencia)',
                referenceValue: previous.base2024,
                changeLabel: '2025 vs 2024',
                changePct: previous.vsBasePct,
              }}
            />
          )}
        </div>
      )}
    </div>
  )
}
