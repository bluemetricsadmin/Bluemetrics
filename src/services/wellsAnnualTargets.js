import { supabase } from '../supabaseClient'

export const TARGET_SETTINGS_TABLE = 'wells_target_settings'
export const TARGETS_TABLE = 'wells_annual_targets'

const mapTarget = (row) => ({
  id: row.id,
  year: row.year,
  version: row.version,
  reductionPct: Number(row.reduction_pct),
  baseMode: row.base_mode,
  baseValue: row.base_value === null ? null : Number(row.base_value),
  status: row.status,
  notes: row.notes,
  createdBy: row.created_by,
  approvedBy: row.approved_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  approvedAt: row.approved_at,
})

const mapSettings = (row) => ({
  id: row.id,
  currentYear: row.current_year,
  availableYears: [...(row.available_years || [])].sort((a, b) => a - b),
  updatedBy: row.updated_by,
  updatedAt: row.updated_at,
})

export const wellsAnnualTargetsService = {
  async fetchTargetSettings() {
    const { data, error } = await supabase
      .from(TARGET_SETTINGS_TABLE)
      .select('*')
      .eq('id', 1)
      .maybeSingle()

    return { data: data ? mapSettings(data) : null, error }
  },

  async fetchTargetVersions(years = []) {
    if (!years.length) return { data: [], error: null }

    const { data, error } = await supabase
      .from(TARGETS_TABLE)
      .select('*')
      .in('year', years)
      .order('year', { ascending: true })
      .order('version', { ascending: false })

    return { data: (data || []).map(mapTarget), error }
  },

  async saveDraftTarget({
    year,
    reductionPct,
    baseMode,
    baseValue,
    notes = null,
    userId = null,
  }) {
    const { data: latest, error: latestError } = await supabase
      .from(TARGETS_TABLE)
      .select('*')
      .eq('year', year)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (latestError) return { data: null, error: latestError }

    const payload = {
      year,
      reduction_pct: reductionPct,
      base_mode: baseMode,
      base_value: baseMode === 'manual' ? baseValue : null,
      notes,
    }

    if (latest?.status === 'draft') {
      const { data, error } = await supabase
        .from(TARGETS_TABLE)
        .update(payload)
        .eq('id', latest.id)
        .select('*')
        .single()

      return { data: data ? mapTarget(data) : null, error }
    }

    const { data, error } = await supabase
      .from(TARGETS_TABLE)
      .insert({
        ...payload,
        created_by: userId,
        version: (latest?.version || 0) + 1,
        status: 'draft',
      })
      .select('*')
      .single()

    return { data: data ? mapTarget(data) : null, error }
  },

  async approveTarget(id, userId = null) {
    const { data, error } = await supabase.rpc('fn_approve_wells_target', {
      p_id: id,
      p_user: userId,
    })

    const row = Array.isArray(data) ? data[0] : data
    return { data: row ? mapTarget(row) : null, error }
  },

  async saveTargetSettings({ currentYear, availableYears, userId = null }) {
    const years = [...new Set(availableYears)].sort((a, b) => a - b)
    const normalizedYears = years.includes(currentYear)
      ? years
      : [...years, currentYear].sort((a, b) => a - b)

    const { data, error } = await supabase
      .from(TARGET_SETTINGS_TABLE)
      .upsert(
        {
          id: 1,
          current_year: currentYear,
          available_years: normalizedYears,
          updated_by: userId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
      .select('*')
      .single()

    return { data: data ? mapSettings(data) : null, error }
  },
}
