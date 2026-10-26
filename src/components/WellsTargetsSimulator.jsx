import { useEffect, useState } from 'react'
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
  CalculatorIcon,
  CheckCircle2Icon,
  Loader2Icon,
  SaveIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  XIcon,
} from 'lucide-react'
import { formatMX, formatMXPercent } from '../utils/formatMX'
import {
  computeTarget,
  getDefaultReduction,
  normalizeYear,
  toFraction,
  toPercent,
} from '../utils/wellsTargets'

const INPUT_CLASS =
  'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'

const formatPctInput = (fraction) => String(Number(toPercent(fraction).toFixed(4)))

const getDefaultsForYear = (rows, targetYear) => {
  const row = rows.find((item) => item.year === targetYear)
  const previousRow = rows.find((item) => item.year === targetYear - 1)
  return {
    reductionPct: formatPctInput(row?.reductionPct ?? getDefaultReduction(targetYear)),
    baseValue:
      row?.baseValue !== null && row?.baseValue !== undefined
        ? String(row.baseValue)
        : String(previousRow?.annualMeta || 0),
  }
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
  const [baseValue, setBaseValue] = useState('')
  const [reductionPct, setReductionPct] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [busyAction, setBusyAction] = useState(null)

  const currentYear = Number(settings?.currentYear) || new Date().getFullYear()

  useEffect(() => {
    if (!open) return

    const initialYear = currentYear + 1
    const defaults = getDefaultsForYear(rows, initialYear)
    setYear(String(initialYear))
    setReductionPct(defaults.reductionPct)
    setBaseValue(defaults.baseValue)
    setFeedback(null)
    setBusyAction(null)
  }, [open, currentYear, rows])

  const handleYearChange = (value) => {
    setYear(value)
    const parsedYear = normalizeYear(value)
    if (!parsedYear) return
    const defaults = getDefaultsForYear(rows, parsedYear)
    setReductionPct(defaults.reductionPct)
    setBaseValue(defaults.baseValue)
    setFeedback(null)
  }

  const parsedYear = normalizeYear(year)
  const base = Number(baseValue) || 0
  const reduction = toFraction(Number(reductionPct) || 0)
  const meta = computeTarget(base, reduction)
  const activeRow = rows.find((item) => item.year === parsedYear)
  const activeMeta = activeRow?.annualMeta || 0
  const vsActivePct = activeMeta > 0 ? ((meta - activeMeta) / activeMeta) * 100 : 0
  const vsActualPct = activeRow?.actual > 0 ? ((meta - activeRow.actual) / activeRow.actual) * 100 : 0

  const validate = () => {
    if (!parsedYear) return 'Ingresa un año válido entre 2000 y 2100'
    if (!Number.isFinite(Number(reductionPct)) || Number(reductionPct) <= -100 || Number(reductionPct) >= 100) {
      return 'El porcentaje debe estar entre -99 y 99'
    }
    if (!Number.isFinite(base) || base < 0) {
      return 'La base debe ser un número mayor o igual a cero'
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
        baseMode: 'manual',
        baseValue: base,
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="flex items-start justify-between gap-3">
          <div>
            <DialogTitle>Simulador de metas</DialogTitle>
            <DialogDescription>
              Prueba la meta de cualquier año sin depender de registros reales. La base es manual.
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Año a simular</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Base manual (m³)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={baseValue}
                onChange={(event) => setBaseValue(event.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reducción (%)</label>
              <input
                type="number"
                step="0.01"
                min="-99"
                max="99"
                value={reductionPct}
                onChange={(event) => setReductionPct(event.target.value)}
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <CalculatorIcon className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-900">
                Resultado de la simulación {parsedYear || ''}
              </span>
              <Badge variant="outline" className="text-xs border-blue-300 bg-white text-blue-700">
                {formatMXPercent(toPercent(reduction))} de reducción
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-xs text-blue-700/70">Base</p>
                <p className="font-semibold text-gray-900">{formatMX(base)} m³</p>
              </div>
              <div>
                <p className="text-xs text-blue-700/70">Meta calculada</p>
                <p className="text-lg font-bold text-blue-700">{formatMX(meta)} m³</p>
              </div>
              <div>
                <p className="text-xs text-blue-700/70">Meta vigente</p>
                <p className="font-semibold text-gray-900">{formatMX(activeMeta)} m³</p>
              </div>
            </div>

            {activeRow?.hasRecords && (
              <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                <span>
                  Consumo real: <strong>{formatMX(activeRow.actual)} m³</strong>
                </span>
                <span className="inline-flex items-center gap-1">
                  {vsActualPct <= 0 ? (
                    <TrendingDownIcon className="h-3 w-3 text-green-600" />
                  ) : (
                    <TrendingUpIcon className="h-3 w-3 text-red-600" />
                  )}
                  {vsActualPct > 0 ? '+' : ''}
                  {formatMXPercent(vsActualPct)} vs real
                </span>
              </div>
            )}

            {activeMeta > 0 && (
              <p className="text-xs text-gray-500">
                Diferencia contra la meta vigente: {vsActivePct > 0 ? '+' : ''}
                {formatMXPercent(vsActivePct)}
              </p>
            )}
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
                <Loader2Icon className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <SaveIcon className="h-4 w-4 mr-1" />
              )}
              Guardar borrador
            </Button>
            <Button
              type="button"
              onClick={() => save(true)}
              disabled={Boolean(busyAction)}
            >
              {busyAction === 'approve' ? (
                <Loader2Icon className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <CheckCircle2Icon className="h-4 w-4 mr-1" />
              )}
              Aprobar meta
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
