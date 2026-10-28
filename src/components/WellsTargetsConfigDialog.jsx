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
  AlertTriangleIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  Loader2Icon,
  PlusIcon,
  SaveIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react'
import { formatMX, formatMXPercent } from '../utils/formatMX'
import {
  computeTarget,
  computeVariance,
  formatPctInput,
  formatPctPoints,
  getDefaultReduction,
  getMetaState,
  normalizeYear,
  toFraction,
  toPercent,
} from '../utils/wellsTargets'

const INPUT_CLASS =
  'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'

const STATUS_LABEL = {
  approved: 'Vigente',
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
  const [expandedYear, setExpandedYear] = useState(null)
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
    const activeCurrentYear = normalizeYear(activeSettings.currentYear) || new Date().getFullYear()

    setSettingsForm({
      currentYear: String(activeCurrentYear),
      availableYears,
    })

    const nextForms = {}
    availableYears.forEach((year) => {
      const row = rows.find((item) => item.year === year)
      const reductionPct = row?.reductionPct ?? getDefaultReduction(year)
      nextForms[year] = {
        reductionPct: formatPctInput(reductionPct),
        baseMode: row?.baseMode || (year > activeCurrentYear ? 'target' : 'actual'),
        baseValue: row?.baseValue === null || row?.baseValue === undefined ? '' : String(row.baseValue),
      }
    })

    setForms(nextForms)
    setExpandedYear(availableYears.includes(activeCurrentYear) ? activeCurrentYear : availableYears[0] ?? null)
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
  const currentYearNumber = normalizeYear(settingsForm.currentYear)

  const getPreviewBase = (year) => {
    const form = forms[year]
    const row = getRow(year)
    if (!form) return Number(row?.baseValue) || 0
    if (form.baseMode === 'manual') return Number(form.baseValue) || 0
    if (form.baseMode === 'target') {
      return Number(getRow(year - 1)?.annualMeta ?? row?.baseValue) || 0
    }
    const previousActual = row?.previousYearActual ?? getRow(year - 1)?.actual
    return Number(previousActual ?? row?.baseValue) || 0
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
    if (!Number.isFinite(pct) || pct < 1 || pct > 99) {
      return 'El porcentaje debe estar entre 1 y 99'
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
    setExpandedYear(year)
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
    setExpandedYear((prev) => (prev === year ? null : prev))
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

  const isDirty = (year) => {
    const row = getRow(year)
    const form = forms[year]
    if (!form) return false
    const originalPct = Number(
      toPercent(row?.reductionPct ?? getDefaultReduction(year)).toFixed(4)
    )
    const editedPct = Number(form.reductionPct)
    if (editedPct !== originalPct) return true
    const originalMode = row?.baseMode || (year > (currentYearNumber || 0) ? 'target' : 'actual')
    if ((form.baseMode || 'actual') !== originalMode) return true
    if (form.baseMode === 'manual') {
      return (Number(form.baseValue) || 0) !== (Number(row?.baseValue) || 0)
    }
    return false
  }

  const visibleYears = settingsForm.availableYears

  return (
    <Dialog open={open} onOpenChange={onOpenChange} maxWidthClass="max-w-4xl">
      <DialogContent>
        <DialogHeader className="flex items-start justify-between gap-3">
          <div>
            <DialogTitle>Configuración de metas anuales</DialogTitle>
            <DialogDescription>
              Define el rango de años y administra el porcentaje de reducción vigente. Cada
              aprobación conserva historial.
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
            <div>
              <p className="text-sm font-semibold text-foreground">Rango de años</p>
              <p className="text-xs text-muted-foreground">
                El año actual se usa como referencia para separar datos reales de proyecciones.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[160px_1fr] sm:items-end">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Año actual</label>
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
                <label className="mb-1 block text-sm font-medium text-foreground">
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
                    <PlusIcon className="mr-1 h-4 w-4" />
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
                  {year === currentYearNumber && <span className="text-[10px]">actual</span>}
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
                  <Loader2Icon className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <SaveIcon className="mr-1 h-4 w-4" />
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
              const metaState = getMetaState(row)
              const status =
                row?.configStatus || (year > (currentYearNumber || 0) ? 'projected' : 'default')
              const busy = busyYear === year
              const expanded = expandedYear === year
              const previewBase = getPreviewBase(year)
              const previewMeta = getPreviewMeta(year)
              const editedReductionPct = Number(form.reductionPct) || 0
              const approvedReductionPct = toPercent(row?.reductionPct ?? getDefaultReduction(year))
              const reductionDiff = editedReductionPct - approvedReductionPct
              const approvedMeta = metaState.hasApproved ? row?.annualMeta || 0 : null
              const metaVariance = approvedMeta !== null ? computeVariance(previewMeta, approvedMeta) : null
              const dirty = isDirty(year)

              return (
                <div key={year} className="rounded-lg border">
                  <button
                    type="button"
                    onClick={() => setExpandedYear(expanded ? null : year)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                    aria-expanded={expanded}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-semibold text-foreground">{year}</span>
                      <Badge
                        variant="outline"
                        className={`text-xs ${STATUS_CLASS[status] || STATUS_CLASS.default}`}
                      >
                        {STATUS_LABEL[status] || STATUS_LABEL.default}
                      </Badge>
                      {row?.configVersion && (
                        <span className="text-xs text-muted-foreground">v{row.configVersion}</span>
                      )}
                      {!metaState.hasApproved && (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                          <AlertTriangleIcon className="h-3 w-3" />
                          Sin meta vigente
                        </span>
                      )}
                      {dirty && (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                          Cambios sin guardar
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {metaState.hasApproved ? 'Reducción vigente' : 'Reducción propuesta'}
                        </p>
                        <p className="text-sm font-semibold text-foreground">
                          {formatMXPercent(approvedReductionPct)}
                          {metaState.hasApproved && dirty && reductionDiff !== 0 && (
                            <span
                              className={`ml-1 text-xs ${
                                reductionDiff < 0 ? 'text-green-600' : 'text-red-600'
                              }`}
                            >
                              → {formatMXPercent(editedReductionPct)} (
                              {reductionDiff > 0 ? '+' : ''}
                              {formatPctPoints(reductionDiff)})
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="hidden text-right sm:block">
                        <p className="text-xs text-muted-foreground">Meta calculada</p>
                        <p className="text-sm font-semibold text-blue-600">
                          {formatMX(previewMeta)} m³
                        </p>
                      </div>
                      <ChevronDownIcon
                        className={`h-4 w-4 text-muted-foreground transition-transform ${
                          expanded ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </button>

                  {expanded && (
                    <div className="space-y-4 border-t px-4 py-4">
                      {!metaState.hasApproved && (
                        <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                          <AlertTriangleIcon className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                          <span>
                            Este año no tiene meta vigente. Al aprobar se creará una nueva versión
                            para {year}.
                          </span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-muted-foreground">
                            Reducción (%)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="1"
                            max="99"
                            value={form.reductionPct || ''}
                            onChange={(event) =>
                              updateForm(year, 'reductionPct', event.target.value)
                            }
                            className={INPUT_CLASS}
                          />
                          <input
                            type="range"
                            min="1"
                            max="99"
                            step="0.5"
                            value={Math.min(Math.max(Number(form.reductionPct) || 1, 1), 99)}
                            onChange={(event) =>
                              updateForm(year, 'reductionPct', event.target.value)
                            }
                            className="mt-2 w-full accent-blue-600"
                            aria-label={`Reducción ${year}`}
                          />
                          <div className="flex justify-between text-[10px] text-muted-foreground">
                            <span>1%</span>
                            <span>50%</span>
                            <span>99%</span>
                          </div>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-muted-foreground">
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
                          <label className="mb-1 block text-xs font-medium text-muted-foreground">
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

                      <div className="grid grid-cols-1 gap-2 rounded-md bg-muted/50 px-3 py-2 text-xs sm:grid-cols-3">
                        <div>
                          <span className="text-muted-foreground">Base usada: </span>
                          <strong className="text-foreground">{formatMX(previewBase)} m³</strong>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Meta calculada: </span>
                          <strong className="text-foreground">{formatMX(previewMeta)} m³</strong>
                        </div>
                        <div>
                          {metaVariance ? (
                            <>
                              <span className="text-muted-foreground">vs meta vigente: </span>
                              <strong
                                className={
                                  metaVariance.favorable ? 'text-green-600' : 'text-red-600'
                                }
                              >
                                {metaVariance.diff > 0 ? '+' : ''}
                                {formatMX(metaVariance.diff)} m³
                              </strong>
                            </>
                          ) : (
                            <span className="text-amber-700">Se creará una meta nueva</span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleSaveDraft(year)}
                            disabled={busy}
                          >
                            {busy ? (
                              <Loader2Icon className="mr-1 h-3 w-3 animate-spin" />
                            ) : (
                              <SaveIcon className="mr-1 h-3 w-3" />
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
                              <Loader2Icon className="mr-1 h-3 w-3 animate-spin" />
                            ) : (
                              <CheckCircle2Icon className="mr-1 h-3 w-3" />
                            )}
                            Aprobar meta
                          </Button>
                        </div>
                      </div>

                      {versions.length > 0 && (
                        <details className="text-xs text-muted-foreground">
                          <summary className="cursor-pointer select-none">
                            Historial de versiones ({versions.length})
                          </summary>
                          <ul className="mt-2 space-y-1">
                            {versions.map((version) => (
                              <li
                                key={version.id}
                                className="flex items-center justify-between gap-2"
                              >
                                <span>
                                  v{version.version} ·{' '}
                                  {toPercent(version.reductionPct).toFixed(2)}% ·{' '}
                                  {STATUS_LABEL[version.status] || version.status}
                                </span>
                                <span>
                                  {formatDate(
                                    version.approvedAt || version.updatedAt || version.createdAt
                                  )}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </div>
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
