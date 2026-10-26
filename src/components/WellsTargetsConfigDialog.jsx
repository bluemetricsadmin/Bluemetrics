import { useEffect, useRef, useState } from 'react'
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
  CheckCircle2Icon,
  Loader2Icon,
  PlusIcon,
  SaveIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react'
import { formatMX } from '../utils/formatMX'
import {
  computeTarget,
  getDefaultReduction,
  normalizeYear,
  toFraction,
  toPercent,
} from '../utils/wellsTargets'

const INPUT_CLASS =
  'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'

const STATUS_LABEL = {
  approved: 'Aprobada',
  draft: 'Borrador',
  superseded: 'Reemplazada',
  default: 'Sin configurar',
  projected: 'Proyección',
}

const STATUS_CLASS = {
  approved: 'text-green-700 border-green-300 bg-green-50',
  draft: 'text-amber-700 border-amber-300 bg-amber-50',
  superseded: 'text-gray-600 border-gray-300 bg-gray-50',
  default: 'text-blue-700 border-blue-300 bg-blue-50',
  projected: 'text-purple-700 border-purple-300 bg-purple-50',
}

const formatPctInput = (fraction) => {
  const pct = toPercent(fraction)
  return String(Number(pct.toFixed(4)))
}

const formatDate = (value) => {
  if (!value) return '-'
  return new Date(value).toLocaleString('es-MX')
}

export default function WellsTargetsConfigDialog({
  open,
  onOpenChange,
  rows = [],
  settings,
  versionsByYear = {},
  onSaveDraft,
  onApprove,
  onSaveSettings,
}) {
  const [settingsForm, setSettingsForm] = useState({
    currentYear: '',
    availableYears: [],
  })
  const [forms, setForms] = useState({})
  const [newYear, setNewYear] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [busyYear, setBusyYear] = useState(null)
  const [savingSettings, setSavingSettings] = useState(false)
  const initializedRef = useRef(false)

  useEffect(() => {
    if (!open) {
      initializedRef.current = false
      return
    }
    if (initializedRef.current) return
    initializedRef.current = true

    const activeSettings = settings || {}
    const availableYears = [...(activeSettings.availableYears || rows.map((row) => row.year))].sort(
      (a, b) => a - b
    )

    setSettingsForm({
      currentYear: String(activeSettings.currentYear || new Date().getFullYear()),
      availableYears,
    })

    const nextForms = {}
    availableYears.forEach((year) => {
      const row = rows.find((item) => item.year === year)
      const reductionPct = row?.reductionPct ?? getDefaultReduction(year)
      nextForms[year] = {
        reductionPct: formatPctInput(reductionPct),
        baseMode: row?.baseMode || 'actual',
        baseValue: row?.baseValue === null || row?.baseValue === undefined ? '' : String(row.baseValue),
      }
    })

    setForms(nextForms)
    setNewYear('')
    setFeedback(null)
  }, [open, settings, rows])

  const updateForm = (year, field, value) => {
    setForms((prev) => ({
      ...prev,
      [year]: {
        ...prev[year],
        [field]: value,
      },
    }))
  }

  const getRow = (year) => rows.find((item) => item.year === year)

  const getPreviewBase = (year) => {
    const form = forms[year]
    const row = getRow(year)
    if (!form) return Number(row?.baseValue) || 0
    if (form.baseMode === 'manual') return Number(form.baseValue) || 0
    if (form.baseMode === 'target') {
      return Number(getRow(year - 1)?.annualMeta ?? row?.baseValue) || 0
    }
    return Number(row?.previousYearActual ?? row?.baseValue) || 0
  }

  const getPreviewMeta = (year) => {
    const form = forms[year]
    const row = getRow(year)
    if (!form) return row?.annualMeta || 0
    return computeTarget(getPreviewBase(year), toFraction(Number(form.reductionPct) || 0))
  }

  const validateYearForm = (year) => {
    const form = forms[year]
    if (!form) return 'No hay datos para este año'

    const pct = Number(form.reductionPct)
    if (!Number.isFinite(pct) || pct <= -100 || pct >= 100) {
      return 'El porcentaje debe estar entre -99 y 99'
    }

    if (form.baseMode === 'manual') {
      const baseValue = Number(form.baseValue)
      if (!Number.isFinite(baseValue) || baseValue < 0) {
        return 'La base manual debe ser un número mayor o igual a cero'
      }
    }

    return null
  }

  const buildPayload = (year) => {
    const form = forms[year]
    return {
      year,
      reductionPct: toFraction(Number(form.reductionPct) || 0),
      baseMode: form.baseMode,
      baseValue: form.baseMode === 'manual' ? Number(form.baseValue) || 0 : null,
      notes: null,
    }
  }

  const handleSaveDraft = async (year) => {
    const validationError = validateYearForm(year)
    if (validationError) {
      setFeedback({ type: 'error', message: validationError })
      return
    }

    setBusyYear(year)
    setFeedback(null)

    try {
      await onSaveDraft(buildPayload(year))
      setFeedback({ type: 'success', message: `Borrador ${year} guardado` })
    } catch (err) {
      setFeedback({ type: 'error', message: err.message })
    } finally {
      setBusyYear(null)
    }
  }

  const handleApprove = async (year) => {
    const validationError = validateYearForm(year)
    if (validationError) {
      setFeedback({ type: 'error', message: validationError })
      return
    }

    setBusyYear(year)
    setFeedback(null)

    try {
      const saved = await onSaveDraft(buildPayload(year))
      if (!saved?.id) throw new Error('No se pudo guardar la meta antes de aprobarla')
      await onApprove(saved.id)
      setFeedback({ type: 'success', message: `Meta ${year} aprobada` })
    } catch (err) {
      setFeedback({ type: 'error', message: err.message })
    } finally {
      setBusyYear(null)
    }
  }

  const handleAddYear = () => {
    const year = normalizeYear(newYear)
    if (!year) {
      setFeedback({ type: 'error', message: 'Ingresa un año válido entre 2000 y 2100' })
      return
    }
    if (settingsForm.availableYears.includes(year)) {
      setFeedback({ type: 'error', message: `El año ${year} ya está en la configuración` })
      return
    }

    setSettingsForm((prev) => ({
      ...prev,
      availableYears: [...prev.availableYears, year].sort((a, b) => a - b),
    }))
    setForms((prev) => ({
      ...prev,
      [year]: {
        reductionPct: formatPctInput(getDefaultReduction(year)),
        baseMode: year > Number(settingsForm.currentYear) ? 'target' : 'actual',
        baseValue: '',
      },
    }))
    setNewYear('')
    setFeedback(null)
  }

  const handleRemoveYear = (year) => {
    if (String(year) === String(settingsForm.currentYear)) {
      setFeedback({ type: 'error', message: 'No puedes quitar el año actual' })
      return
    }

    setSettingsForm((prev) => ({
      ...prev,
      availableYears: prev.availableYears.filter((item) => item !== year),
    }))
    setForms((prev) => {
      const next = { ...prev }
      delete next[year]
      return next
    })
  }

  const handleSaveSettings = async () => {
    const currentYear = normalizeYear(settingsForm.currentYear)
    if (!currentYear) {
      setFeedback({ type: 'error', message: 'El año actual no es válido' })
      return
    }

    const nextYears = settingsForm.availableYears.includes(currentYear)
      ? settingsForm.availableYears
      : [...settingsForm.availableYears, currentYear].sort((a, b) => a - b)

    setSettingsForm((prev) => ({ ...prev, availableYears: nextYears }))
    setForms((prev) => ({
      ...prev,
      [currentYear]: prev[currentYear] || {
        reductionPct: formatPctInput(getDefaultReduction(currentYear)),
        baseMode: 'actual',
        baseValue: '',
      },
    }))
    setSavingSettings(true)
    setFeedback(null)

    try {
      await onSaveSettings({
        currentYear,
        availableYears: nextYears,
      })
      setFeedback({ type: 'success', message: 'Configuración de años guardada' })
    } catch (err) {
      setFeedback({ type: 'error', message: err.message })
    } finally {
      setSavingSettings(false)
    }
  }

  const visibleYears = settingsForm.availableYears
  const currentYearNumber = normalizeYear(settingsForm.currentYear)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="flex items-start justify-between gap-3">
          <div>
            <DialogTitle>Configuración de metas anuales</DialogTitle>
            <DialogDescription>
              Define el rango de años y aprueba el porcentaje de reducción. Cada aprobación conserva
              historial.
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
          <div className="rounded-lg border p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-3 sm:items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Año actual</label>
                <input
                  type="number"
                  min="2000"
                  max="2100"
                  value={settingsForm.currentYear}
                  onChange={(event) =>
                    setSettingsForm((prev) => ({ ...prev, currentYear: event.target.value }))
                  }
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Agregar año al rango
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="2000"
                    max="2100"
                    value={newYear}
                    onChange={(event) => setNewYear(event.target.value)}
                    className={INPUT_CLASS}
                    placeholder="2028"
                  />
                  <Button type="button" variant="outline" onClick={handleAddYear}>
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Agregar
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {visibleYears.map((year) => (
                <span
                  key={year}
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs ${
                    year === currentYearNumber
                      ? 'border-blue-300 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-gray-50 text-gray-700'
                  }`}
                >
                  {year}
                  <button
                    type="button"
                    onClick={() => handleRemoveYear(year)}
                    className="rounded-full p-0.5 hover:bg-black/5"
                    aria-label={`Quitar ${year}`}
                  >
                    <Trash2Icon className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveSettings}
                disabled={savingSettings}
              >
                {savingSettings ? (
                  <Loader2Icon className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <SaveIcon className="h-4 w-4 mr-1" />
                )}
                Guardar configuración de años
              </Button>
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

          <div className="space-y-3">
            {visibleYears.map((year) => {
              const row = getRow(year)
              const form = forms[year] || {}
              const versions = versionsByYear[year] || []
              const status = row?.configStatus || (year > (currentYearNumber || 0) ? 'projected' : 'default')
              const busy = busyYear === year

              return (
                <div key={year} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-semibold text-gray-900">{year}</span>
                      <Badge
                        variant="outline"
                        className={`text-xs ${STATUS_CLASS[status] || STATUS_CLASS.default}`}
                      >
                        {STATUS_LABEL[status] || STATUS_LABEL.default}
                      </Badge>
                      {row?.configVersion && (
                        <span className="text-xs text-gray-500">v{row.configVersion}</span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Meta calculada</p>
                      <p className="text-sm font-semibold text-blue-600">
                        {formatMX(getPreviewMeta(year))} m³
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Reducción (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="-99"
                        max="99"
                        value={form.reductionPct || ''}
                        onChange={(event) =>
                          updateForm(year, 'reductionPct', event.target.value)
                        }
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Base de cálculo
                      </label>
                      <select
                        value={form.baseMode || 'actual'}
                        onChange={(event) => updateForm(year, 'baseMode', event.target.value)}
                        className={INPUT_CLASS}
                      >
                        <option value="actual">Consumo real año anterior</option>
                        <option value="target">Meta año anterior</option>
                        <option value="manual">Base manual</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Base manual (m³)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.baseValue || ''}
                        onChange={(event) => updateForm(year, 'baseValue', event.target.value)}
                        disabled={form.baseMode !== 'manual'}
                        className={`${INPUT_CLASS} disabled:bg-gray-100 disabled:text-gray-400`}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs text-gray-500">
                      Base usada: {formatMX(getPreviewBase(year))} m³
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleSaveDraft(year)}
                        disabled={busy}
                      >
                        {busy ? (
                          <Loader2Icon className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <SaveIcon className="h-3 w-3 mr-1" />
                        )}
                        Guardar borrador
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleApprove(year)}
                        disabled={busy}
                      >
                        {busy ? (
                          <Loader2Icon className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <CheckCircle2Icon className="h-3 w-3 mr-1" />
                        )}
                        Aprobar
                      </Button>
                    </div>
                  </div>

                  {versions.length > 0 && (
                    <details className="text-xs text-gray-500">
                      <summary className="cursor-pointer select-none">
                        Historial de versiones ({versions.length})
                      </summary>
                      <ul className="mt-2 space-y-1">
                        {versions.map((version) => (
                          <li key={version.id} className="flex items-center justify-between gap-2">
                            <span>
                              v{version.version} · {toPercent(version.reductionPct).toFixed(2)}% ·{' '}
                              {STATUS_LABEL[version.status] || version.status}
                            </span>
                            <span>{formatDate(version.approvedAt || version.updatedAt || version.createdAt)}</span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
