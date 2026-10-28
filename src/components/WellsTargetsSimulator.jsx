import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import {
  AlertTriangleIcon,
  CalculatorIcon,
  CheckCircle2Icon,
  InfoIcon,
  Loader2Icon,
  SaveIcon,
  Target,
  TrendingDownIcon,
  TrendingUpIcon,
  XIcon,
} from 'lucide-react'
import { formatMX, formatMXInt, formatMXPercent } from '../utils/formatMX'
import {
  computeTarget,
  computeVariance,
  formatPctInput,
  formatPctPoints,
  getDefaultReduction,
  getMetaState,
  normalizeYear,
  resolveSimulationBase,
  toFraction,
  toPercent,
} from '../utils/wellsTargets'

const INPUT_CLASS =
  'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'

const BASE_MODE_OPTIONS = [
  { value: 'actual', label: 'Consumo real año anterior' },
  { value: 'target', label: 'Meta año anterior' },
  { value: 'manual', label: 'Base manual' },
]

const getDefaultsForYear = (rows, targetYear, currentYear) => {
  const row = rows.find((item) => item.year === targetYear)
  const previousRow = rows.find((item) => item.year === targetYear - 1)
  const isFuture = targetYear > currentYear

  return {
    reductionPct: formatPctInput(row?.reductionPct ?? getDefaultReduction(targetYear)),
    baseMode: row?.baseMode || (isFuture ? 'target' : 'actual'),
    manualBase: String(previousRow?.annualMeta ?? row?.baseValue ?? 0),
    simulatedConsumption: '',
  }
}

const pctValue = (fraction) => Number(toPercent(fraction).toFixed(2))

function ChartCard({ title, description, children }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="mb-3">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="h-52 w-full">{children}</div>
    </div>
  )
}

export default function WellsTargetsSimulator({
  open,
  onOpenChange,
  rows = [],
  settings,
  onSaveDraft,
  onApprove,
}) {
  const [year, setYear] = useState('')
  const [baseMode, setBaseMode] = useState('actual')
  const [manualBase, setManualBase] = useState('')
  const [reductionPct, setReductionPct] = useState('')
  const [simulatedConsumption, setSimulatedConsumption] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [busyAction, setBusyAction] = useState(null)
  const initializedRef = useRef(false)

  const currentYear = Number(settings?.currentYear) || new Date().getFullYear()

  useEffect(() => {
    if (!open) {
      initializedRef.current = false
      return
    }
    if (initializedRef.current) return
    initializedRef.current = true

    const initialYear = currentYear + 1
    const defaults = getDefaultsForYear(rows, initialYear, currentYear)
    setYear(String(initialYear))
    setReductionPct(defaults.reductionPct)
    setBaseMode(defaults.baseMode)
    setManualBase(defaults.manualBase)
    setSimulatedConsumption(defaults.simulatedConsumption)
    setFeedback(null)
    setBusyAction(null)
  }, [open, currentYear, rows])

  const handleYearChange = (value) => {
    setYear(value)
    const parsedYear = normalizeYear(value)
    if (!parsedYear) return
    const defaults = getDefaultsForYear(rows, parsedYear, currentYear)
    setReductionPct(defaults.reductionPct)
    setBaseMode(defaults.baseMode)
    setManualBase(defaults.manualBase)
    setSimulatedConsumption(defaults.simulatedConsumption)
    setFeedback(null)
  }

  const parsedYear = normalizeYear(year)
  const activeRow = rows.find((item) => item.year === parsedYear)
  const previousRow = rows.find((item) => item.year === parsedYear - 1)
  const metaState = getMetaState(activeRow)

  const isFutureYear = Boolean(parsedYear && parsedYear > currentYear)
  const hasRecords = Boolean(activeRow?.hasRecords)
  const requiresSimulatedConsumption = Boolean(parsedYear) && (isFutureYear || !hasRecords)

  const base = resolveSimulationBase({
    row: activeRow,
    previousRow,
    baseMode,
    manualBase,
  })
  const reduction = toFraction(Number(reductionPct) || 0)
  const meta = computeTarget(base, reduction)

  const activeReduction = activeRow?.reductionPct ?? 0
  const activeMeta = activeRow?.annualMeta || 0
  const hasActiveMeta = metaState.hasApproved && activeMeta > 0

  const simulatedValue = Number(simulatedConsumption) || 0
  const referenceConsumption = requiresSimulatedConsumption
    ? simulatedValue
    : Number(activeRow?.actual) || 0
  const hasConsumptionReference = requiresSimulatedConsumption
    ? simulatedValue > 0
    : Boolean(activeRow?.hasRecords) && referenceConsumption > 0

  const metaVsActive = computeVariance(meta, activeMeta)
  const metaVsConsumption = computeVariance(meta, referenceConsumption)
  const reductionPointDiff = pctValue(reduction) - pctValue(activeReduction)

  const reductionChartData = useMemo(() => {
    const data = []
    if (hasActiveMeta) {
      data.push({ name: 'Meta vigente', value: pctValue(activeReduction), fill: '#64748b' })
    }
    data.push({ name: 'Simulación', value: pctValue(reduction), fill: '#2563eb' })
    return data
  }, [hasActiveMeta, activeReduction, reduction])

  const volumeChartData = useMemo(() => {
    const data = [
      { name: 'Base', value: base, fill: '#94a3b8' },
      { name: 'Meta simulada', value: meta, fill: '#2563eb' },
    ]

    if (hasActiveMeta) {
      data.splice(1, 0, { name: 'Meta vigente', value: activeMeta, fill: '#10b981' })
    }

    if (hasConsumptionReference) {
      data.push({
        name: requiresSimulatedConsumption ? 'Consumo simulado' : 'Consumo real',
        value: referenceConsumption,
        fill: requiresSimulatedConsumption ? '#a855f7' : '#f59e0b',
      })
    }

    return data
  }, [
    base,
    meta,
    activeMeta,
    hasActiveMeta,
    referenceConsumption,
    hasConsumptionReference,
    requiresSimulatedConsumption,
  ])

  const validate = () => {
    if (!parsedYear) return 'Ingresa un año válido entre 2000 y 2100'
    if (
      !Number.isFinite(Number(reductionPct)) ||
      Number(reductionPct) < 1 ||
      Number(reductionPct) > 99
    ) {
      return 'El porcentaje debe estar entre 1 y 99'
    }
    if (!Number.isFinite(base) || base < 0) {
      return 'La base debe ser un número mayor o igual a cero'
    }
    if (baseMode === 'manual' && (!Number.isFinite(Number(manualBase)) || Number(manualBase) < 0)) {
      return 'La base manual debe ser un número mayor o igual a cero'
    }
    return null
  }

  const save = async (approveAfterSave) => {
    const validationError = validate()
    if (validationError) {
      setFeedback({ type: 'error', message: validationError })
      return
    }

    setBusyAction(approveAfterSave ? 'approve' : 'save')
    setFeedback(null)

    try {
      const saved = await onSaveDraft({
        year: parsedYear,
        reductionPct: reduction,
        baseMode,
        baseValue: baseMode === 'manual' ? base : null,
        notes: 'Simulación',
      })

      if (approveAfterSave) {
        if (!saved?.id) throw new Error('No se pudo guardar la simulación antes de aprobarla')
        await onApprove(saved.id)
      }

      setFeedback({
        type: 'success',
        message: approveAfterSave
          ? `Meta simulada ${parsedYear} aprobada`
          : `Simulación ${parsedYear} guardada como borrador`,
      })
    } catch (err) {
      setFeedback({ type: 'error', message: err.message })
    } finally {
      setBusyAction(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} maxWidthClass="max-w-5xl">
      <DialogContent>
        <DialogHeader className="flex items-start justify-between gap-3">
          <div>
            <DialogTitle>Simulador de metas</DialogTitle>
            <DialogDescription>
              Compara la meta vigente contra un porcentaje de reducción propuesto y su efecto en el
              consumo del año seleccionado.
            </DialogDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            aria-label="Cerrar"
          >
            <XIcon className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="p-6 space-y-5">
          {parsedYear && !hasActiveMeta && (
            <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              <AlertTriangleIcon className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>
                No existe meta vigente para {parsedYear}.{' '}
                {metaState.hasDraft
                  ? 'Hay un borrador que no cuenta como meta vigente; al aprobar la simulación se convertirá en la nueva meta.'
                  : 'Al guardar o aprobar la simulación se creará una nueva meta.'}
              </span>
            </div>
          )}

          {requiresSimulatedConsumption && (
            <div className="flex items-start gap-2 rounded-md border border-purple-300 bg-purple-50 px-3 py-2 text-sm text-purple-800">
              <InfoIcon className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>
                Año sin registros reales. Ingresa un consumo simulado para comparar la meta contra un
                consumo de referencia.
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_1fr]">
            <div className="space-y-4">
              <div className="space-y-4 rounded-lg border p-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Año a simular
                  </label>
                  <input
                    type="number"
                    min="2000"
                    max="2100"
                    value={year}
                    onChange={(event) => handleYearChange(event.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Base de cálculo
                  </label>
                  <select
                    value={baseMode}
                    onChange={(event) => setBaseMode(event.target.value)}
                    className={INPUT_CLASS}
                  >
                    {BASE_MODE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {baseMode === 'manual' && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">
                      Base manual (m³)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={manualBase}
                      onChange={(event) => setManualBase(event.target.value)}
                      className={INPUT_CLASS}
                    />
                  </div>
                )}

                <div className="rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                  Base usada: <strong className="text-foreground">{formatMX(base)} m³</strong>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Reducción (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max="99"
                    value={reductionPct}
                    onChange={(event) => setReductionPct(event.target.value)}
                    className={INPUT_CLASS}
                  />
                  <input
                    type="range"
                    min="1"
                    max="99"
                    step="0.5"
                    value={Math.min(Math.max(Number(reductionPct) || 1, 1), 99)}
                    onChange={(event) => setReductionPct(event.target.value)}
                    className="mt-2 w-full accent-blue-600"
                    aria-label="Porcentaje de reducción"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>1%</span>
                    <span>50%</span>
                    <span>99%</span>
                  </div>
                </div>

                {requiresSimulatedConsumption && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">
                      Consumo simulado (m³)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={simulatedConsumption}
                      onChange={(event) => setSimulatedConsumption(event.target.value)}
                      className={INPUT_CLASS}
                      placeholder="Ej. 120000"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Solo se usa como referencia de comparación; no se guarda con la meta.
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-4">
                <div className="flex items-center gap-2">
                  <CalculatorIcon className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-900">
                    Meta simulada {parsedYear || ''}
                  </span>
                </div>
                <p className="mt-2 text-2xl font-bold text-blue-700">{formatMX(meta)} m³</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="border-blue-300 bg-white text-blue-700">
                    {formatMXPercent(toPercent(reduction))} de reducción
                  </Badge>
                  {hasActiveMeta && (
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium ${
                        reductionPointDiff <= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {reductionPointDiff <= 0 ? (
                        <TrendingDownIcon className="h-3 w-3" />
                      ) : (
                        <TrendingUpIcon className="h-3 w-3" />
                      )}
                      {reductionPointDiff > 0 ? '+' : ''}
                      {formatPctPoints(reductionPointDiff)} vs vigente
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Meta vigente</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">
                    {hasActiveMeta ? `${formatMX(activeMeta)} m³` : 'Sin meta vigente'}
                  </p>
                  {hasActiveMeta && (
                    <p className="text-xs text-muted-foreground">
                      {formatMXPercent(toPercent(activeReduction))} de reducción
                    </p>
                  )}
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">
                    {requiresSimulatedConsumption ? 'Consumo simulado' : 'Consumo real'}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-foreground">
                    {hasConsumptionReference ? `${formatMX(referenceConsumption)} m³` : 'Sin referencia'}
                  </p>
                  {!hasConsumptionReference && (
                    <p className="text-xs text-muted-foreground">
                      {requiresSimulatedConsumption
                        ? 'Ingresa el consumo simulado'
                        : 'Año sin registros'}
                    </p>
                  )}
                </div>
              </div>

              <ChartCard
                title="Comparación de reducción"
                description="Porcentaje de reducción de la meta vigente contra la simulación."
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reductionChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickFormatter={(value) => `${value}%`}
                      width={48}
                    />
                    <Tooltip
                      formatter={(value) => [`${formatMXPercent(value)}`, 'Reducción']}
                      cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={72}>
                      {reductionChartData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard
                title="Comparación de volúmenes"
                description="Base, meta vigente, meta simulada y consumo de referencia."
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={volumeChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickFormatter={(value) => formatMXInt(value)}
                      width={64}
                    />
                    <Tooltip formatter={(value) => [`${formatMX(value)} m³`, 'Volumen']} />
                    <Bar dataKey="value" name="m³" radius={[6, 6, 0, 0]} maxBarSize={56}>
                      {volumeChartData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <div className="rounded-lg border p-4 space-y-2 text-sm">
                {hasActiveMeta ? (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Meta simulada vs meta vigente</span>
                    <span
                      className={`flex items-center gap-1 font-medium ${
                        metaVsActive.favorable ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {metaVsActive.favorable ? (
                        <TrendingDownIcon className="h-4 w-4" />
                      ) : (
                        <TrendingUpIcon className="h-4 w-4" />
                      )}
                      {metaVsActive.diff > 0 ? '+' : ''}
                      {formatMX(metaVsActive.diff)} m³ ({metaVsActive.pct > 0 ? '+' : ''}
                      {formatMXPercent(metaVsActive.pct)})
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-700">
                    <AlertTriangleIcon className="h-4 w-4" />
                    <span>La simulación creará una meta nueva para {parsedYear}.</span>
                  </div>
                )}

                {hasConsumptionReference && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">
                      Meta simulada vs {requiresSimulatedConsumption ? 'consumo simulado' : 'consumo real'}
                    </span>
                    <span
                      className={`flex items-center gap-1 font-medium ${
                        metaVsConsumption.favorable ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {metaVsConsumption.favorable ? (
                        <TrendingDownIcon className="h-4 w-4" />
                      ) : (
                        <TrendingUpIcon className="h-4 w-4" />
                      )}
                      {formatMX(Math.abs(metaVsConsumption.diff))} m³{' '}
                      {metaVsConsumption.favorable ? 'por debajo' : 'por encima'} (
                      {formatMXPercent(Math.abs(metaVsConsumption.pct))})
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 border-t pt-2">
                  <span className="text-muted-foreground">Meta a alcanzar</span>
                  <span className="flex items-center gap-1 font-semibold text-foreground">
                    <Target className="h-4 w-4 text-blue-600" />
                    {formatMX(meta)} m³
                  </span>
                </div>
              </div>
            </div>
          </div>

          {feedback && (
            <div
              className={`rounded-md border px-3 py-2 text-sm ${
                feedback.type === 'error'
                  ? 'border-red-300 bg-red-50 text-red-700'
                  : 'border-green-300 bg-green-50 text-green-700'
              }`}
            >
              {feedback.message}
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => save(false)}
              disabled={Boolean(busyAction)}
            >
              {busyAction === 'save' ? (
                <Loader2Icon className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <SaveIcon className="mr-1 h-4 w-4" />
              )}
              Guardar borrador
            </Button>
            <Button type="button" onClick={() => save(true)} disabled={Boolean(busyAction)}>
              {busyAction === 'approve' ? (
                <Loader2Icon className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2Icon className="mr-1 h-4 w-4" />
              )}
              Aprobar meta
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
