CREATE TABLE IF NOT EXISTS public.wells_target_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  current_year INTEGER NOT NULL CHECK (current_year BETWEEN 2000 AND 2100),
  available_years INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
  updated_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT wells_target_settings_current_year_available_check
    CHECK (current_year = ANY(available_years))
);

CREATE TABLE IF NOT EXISTS public.wells_annual_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL CHECK (year BETWEEN 2000 AND 2100),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  reduction_pct NUMERIC(7, 6) NOT NULL CHECK (reduction_pct > -1 AND reduction_pct < 1),
  base_mode TEXT NOT NULL DEFAULT 'actual' CHECK (base_mode IN ('actual', 'target', 'manual')),
  base_value NUMERIC(14, 2),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'superseded')),
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  approved_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  CONSTRAINT wells_annual_targets_year_version_key UNIQUE (year, version),
  CONSTRAINT wells_annual_targets_manual_base_check
    CHECK (
      (base_mode = 'manual' AND base_value IS NOT NULL AND base_value >= 0)
      OR (base_mode <> 'manual')
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS wells_annual_targets_one_approved_per_year
  ON public.wells_annual_targets (year)
  WHERE status = 'approved';

CREATE INDEX IF NOT EXISTS idx_wells_annual_targets_year
  ON public.wells_annual_targets (year);

CREATE INDEX IF NOT EXISTS idx_wells_annual_targets_status
  ON public.wells_annual_targets (status);

CREATE OR REPLACE FUNCTION public.fn_wells_annual_targets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_wells_annual_targets_updated_at ON public.wells_annual_targets;
CREATE TRIGGER trigger_wells_annual_targets_updated_at
  BEFORE UPDATE ON public.wells_annual_targets
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_wells_annual_targets_updated_at();

CREATE OR REPLACE FUNCTION public.fn_approve_wells_target(
  p_id UUID,
  p_user UUID DEFAULT NULL
)
RETURNS public.wells_annual_targets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target public.wells_annual_targets;
BEGIN
  SELECT *
    INTO v_target
    FROM public.wells_annual_targets
   WHERE id = p_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No existe la meta solicitada';
  END IF;

  UPDATE public.wells_annual_targets
     SET status = 'superseded',
         updated_at = NOW()
   WHERE year = v_target.year
     AND status = 'approved'
     AND id <> p_id;

  UPDATE public.wells_annual_targets
     SET status = 'approved',
         approved_by = p_user,
         approved_at = NOW(),
         updated_at = NOW()
   WHERE id = p_id
   RETURNING * INTO v_target;

  RETURN v_target;
END;
$$;

ALTER TABLE public.wells_target_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wells_annual_targets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura de configuracion de metas" ON public.wells_target_settings;
CREATE POLICY "Lectura de configuracion de metas"
  ON public.wells_target_settings
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Alta de configuracion de metas" ON public.wells_target_settings;
CREATE POLICY "Alta de configuracion de metas"
  ON public.wells_target_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Actualizacion de configuracion de metas" ON public.wells_target_settings;
CREATE POLICY "Actualizacion de configuracion de metas"
  ON public.wells_target_settings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Lectura de metas anuales" ON public.wells_annual_targets;
CREATE POLICY "Lectura de metas anuales"
  ON public.wells_annual_targets
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Alta de metas anuales" ON public.wells_annual_targets;
CREATE POLICY "Alta de metas anuales"
  ON public.wells_annual_targets
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Actualizacion de metas anuales" ON public.wells_annual_targets;
CREATE POLICY "Actualizacion de metas anuales"
  ON public.wells_annual_targets
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Eliminacion de metas anuales" ON public.wells_annual_targets;
CREATE POLICY "Eliminacion de metas anuales"
  ON public.wells_annual_targets
  FOR DELETE
  TO authenticated
  USING (true);

GRANT SELECT, INSERT, UPDATE ON public.wells_target_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wells_annual_targets TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_approve_wells_target(UUID, UUID) TO authenticated;

INSERT INTO public.wells_target_settings (id, current_year, available_years)
VALUES (
  1,
  EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
  ARRAY[
    (EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER - 1),
    EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
    (EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER + 1)
  ]
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.wells_annual_targets (
  year,
  version,
  reduction_pct,
  base_mode,
  status,
  approved_at
)
SELECT seed.year, 1, seed.reduction_pct, 'actual', 'approved', NOW()
FROM (
  VALUES
    (2025, 0.200000::NUMERIC(7, 6)),
    (2026, 0.100000::NUMERIC(7, 6))
) AS seed(year, reduction_pct)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.wells_annual_targets existing
  WHERE existing.year = seed.year
);
