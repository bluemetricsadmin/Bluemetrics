-- ============================================================
-- Migración: Alertas de Posible Fuga — MENSUAL
-- Fecha: 2026-05-07
--
-- Requisito previo:
--   - supabase_well_events_alerts_migration.sql (columnas alert_week, alert_year, etc.)
--   - supabase_realtime_alerts_migration.sql (tablas well_config, alert_scan_state)
--   - supabase_fuga_alerts_semanal.sql (cambios de esquema compartidos)
--
-- Tabla objetivo: lecturas_mensuales_agua_consumo
--
-- Contenido:
--   0. Limpieza idempotente
--   1. Cambios de esquema compartidos (idempotentes)
--   2. Índice único para deduplicación mensual
--   3. fn_check_monthly_leak_rules()
--   4. fn_evaluate_leak_alerts_monthly()
--   5. fn_leak_trigger_monthly()
--   6. Trigger en lecturas_mensuales_agua_consumo
--   7. fn_scan_fuga_mensual() + pg_cron
-- ============================================================


-- ============================================================
-- 0. LIMPIEZA IDEMPOTENTE
-- ============================================================

-- 0a. Desprogramar job pg_cron
DO $$
BEGIN
  PERFORM cron.unschedule('scan_fuga_alerts_mensual');
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$$;

-- 0b. Eliminar trigger mensual
DROP TRIGGER IF EXISTS trg_fuga_leak_monthly ON lecturas_mensuales_agua_consumo;

-- 0c. Eliminar funciones propias
DROP FUNCTION IF EXISTS fn_scan_fuga_mensual();
DROP FUNCTION IF EXISTS fn_leak_trigger_monthly();
DROP FUNCTION IF EXISTS fn_evaluate_leak_alerts_monthly(INTEGER, TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS fn_evaluate_leak_alerts_monthly(TEXT, TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS fn_check_monthly_leak_rules(TEXT, INTEGER, INTEGER);

-- 0d. Eliminar índice de deduplicación mensual
DROP INDEX IF EXISTS idx_well_events_fuga_monthly;


-- ============================================================
-- 1. CAMBIOS DE ESQUEMA COMPARTIDOS (idempotentes)
-- Repetidos aquí para que este archivo sea autocontenido.
-- ============================================================

-- 1a. Añadir 'posible_fuga' al CHECK de event_type
ALTER TABLE well_events DROP CONSTRAINT IF EXISTS well_events_event_type_check;
ALTER TABLE well_events ADD CONSTRAINT well_events_event_type_check
  CHECK (event_type IN (
    'mantenimiento', 'parado', 'reparacion', 'inspeccion', 'otro',
    'alerta_consumo', 'sobreconsumo', 'posible_fuga'
  ));

-- 1b. Columna alert_month
ALTER TABLE well_events ADD COLUMN IF NOT EXISTS alert_month INTEGER DEFAULT NULL;

-- 1c. Columna alert_granularity
DO $$
BEGIN
  ALTER TABLE well_events ADD COLUMN alert_granularity TEXT DEFAULT NULL
    CHECK (alert_granularity IN ('weekly', 'monthly', 'daily'));
EXCEPTION WHEN duplicate_column THEN
  NULL;
END;
$$;

-- 1d. Columna daily_column_name en well_config
ALTER TABLE well_config ADD COLUMN IF NOT EXISTS daily_column_name TEXT DEFAULT NULL;

UPDATE well_config SET daily_column_name = 'pozo11'   WHERE well_id = 11 AND daily_column_name IS NULL;
UPDATE well_config SET daily_column_name = 'pozo_12'  WHERE well_id = 12 AND daily_column_name IS NULL;
UPDATE well_config SET daily_column_name = 'pozo_3'   WHERE well_id = 3  AND daily_column_name IS NULL;
UPDATE well_config SET daily_column_name = 'pozo7'    WHERE well_id = 7  AND daily_column_name IS NULL;
UPDATE well_config SET daily_column_name = 'pozo_14'  WHERE well_id = 14 AND daily_column_name IS NULL;
UPDATE well_config SET daily_column_name = 'pozo_4'   WHERE well_id = 4  AND daily_column_name IS NULL;
UPDATE well_config SET daily_column_name = 'pozo_8'   WHERE well_id = 8  AND daily_column_name IS NULL;
UPDATE well_config SET daily_column_name = 'pozo_15'  WHERE well_id = 15 AND daily_column_name IS NULL;

-- 1e. well_id nullable en well_events (soporta medidores no registrados en well_config)
ALTER TABLE well_events ALTER COLUMN well_id DROP NOT NULL;

-- 1f. Columna meter_column: identifica el medidor fuente de la alerta
ALTER TABLE well_events ADD COLUMN IF NOT EXISTS meter_column TEXT DEFAULT NULL;


-- ============================================================
-- 2. ÍNDICE ÚNICO PARCIAL PARA DEDUPLICACIÓN MENSUAL
-- Una sola alerta de posible_fuga por (pozo, mes, año).
-- ============================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_well_events_fuga_monthly
  ON well_events (meter_column, alert_year, alert_month)
  WHERE is_automatic = true
    AND event_type = 'posible_fuga'
    AND alert_granularity = 'monthly';


-- ============================================================
-- 3. HELPER: fn_check_monthly_leak_rules()
-- Evalúa las 3 reglas de fuga para un mes específico.
-- Retorna TRUE solo si las 3 reglas se cumplen simultáneamente (AND).
-- No inserta nada (permite uso en chequeo consecutivo).
-- ============================================================
CREATE OR REPLACE FUNCTION fn_check_monthly_leak_rules(
  p_column TEXT,
  p_year   INTEGER,
  p_month  INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_val    DECIMAL;
  v_moving_avg     DECIMAL;
  v_moving_sum     DECIMAL := 0;
  v_moving_count   INTEGER := 0;
  v_prev_val       DECIMAL;
  v_same_prev_yr   DECIMAL;
  v_check_month    INTEGER;
  v_check_year     INTEGER;
  v_rule1_ok       BOOLEAN := FALSE;
  v_rule2_ok       BOOLEAN := FALSE;
  v_rule3_ok       BOOLEAN := FALSE;
  i                INTEGER;
BEGIN
  -- Obtener consumo del mes actual
  EXECUTE format(
    'SELECT COALESCE(%I, 0) FROM lecturas_mensuales_agua_consumo WHERE anio = %s AND mes = %s LIMIT 1',
    p_column, p_year, p_month
  ) INTO v_current_val;

  IF v_current_val IS NULL OR v_current_val = 0 THEN
    RETURN FALSE;
  END IF;

  -- -------------------------------------------------------
  -- Regla 1: vs promedio móvil de los 10 meses anteriores
  -- -------------------------------------------------------
  FOR i IN 1..10 LOOP
    v_check_month := p_month - i;
    v_check_year  := p_year;
    IF v_check_month < 1 THEN
      v_check_month := v_check_month + 12;
      v_check_year  := v_check_year - 1;
    END IF;

    EXECUTE format(
      'SELECT COALESCE(%I, 0) FROM lecturas_mensuales_agua_consumo WHERE anio = %s AND mes = %s LIMIT 1',
      p_column, v_check_year, v_check_month
    ) INTO v_prev_val;

    IF v_prev_val IS NOT NULL AND v_prev_val > 0 THEN
      v_moving_sum   := v_moving_sum + v_prev_val;
      v_moving_count := v_moving_count + 1;
    END IF;
  END LOOP;

  IF v_moving_count >= 3 THEN
    v_moving_avg := v_moving_sum / v_moving_count;
    IF v_moving_avg > 0 AND v_current_val > v_moving_avg * 1.30 THEN
      v_rule1_ok := TRUE;
    END IF;
  END IF;

  -- -------------------------------------------------------
  -- Regla 2: vs mes anterior
  -- -------------------------------------------------------
  v_check_month := p_month - 1;
  v_check_year  := p_year;
  IF v_check_month < 1 THEN
    v_check_month := 12;
    v_check_year  := v_check_year - 1;
  END IF;

  EXECUTE format(
    'SELECT COALESCE(%I, 0) FROM lecturas_mensuales_agua_consumo WHERE anio = %s AND mes = %s LIMIT 1',
    p_column, v_check_year, v_check_month
  ) INTO v_prev_val;

  IF v_prev_val IS NOT NULL AND v_prev_val > 0 THEN
    IF v_current_val > v_prev_val * 1.30 THEN
      v_rule2_ok := TRUE;
    END IF;
  END IF;

  -- -------------------------------------------------------
  -- Regla 3: vs mismo mes, año anterior
  -- -------------------------------------------------------
  EXECUTE format(
    'SELECT COALESCE(%I, 0) FROM lecturas_mensuales_agua_consumo WHERE anio = %s AND mes = %s LIMIT 1',
    p_column, p_year - 1, p_month
  ) INTO v_same_prev_yr;

  IF v_same_prev_yr IS NOT NULL AND v_same_prev_yr > 0 THEN
    IF v_current_val > v_same_prev_yr * 1.30 THEN
      v_rule3_ok := TRUE;
    END IF;
  END IF;

  -- Las 3 reglas deben cumplirse simultáneamente (condición AND)
  RETURN v_rule1_ok AND v_rule2_ok AND v_rule3_ok;
END;
$$;


-- ============================================================
-- 4. fn_evaluate_leak_alerts_monthly()
-- Evalúa alertas de fuga para un pozo en un mes específico.
-- Inserta solo si las 3 reglas se cumplen simultáneamente (AND).
-- ============================================================
CREATE OR REPLACE FUNCTION fn_evaluate_leak_alerts_monthly(
  p_meter_label TEXT,
  p_column      TEXT,
  p_year        INTEGER,
  p_month       INTEGER
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_val    DECIMAL;
  v_now            TIMESTAMP WITH TIME ZONE := NOW();
  v_rules_fired    TEXT[] := '{}';
  v_moving_sum     DECIMAL := 0;
  v_moving_count   INTEGER := 0;
  v_moving_avg     DECIMAL;
  v_prev_val       DECIMAL;
  v_same_prev_yr   DECIMAL;
  v_check_month    INTEGER;
  v_check_year     INTEGER;
  i                INTEGER;
  -- Flags AND: las tres reglas deben cumplirse simultáneamente
  v_rule1_ok       BOOLEAN := FALSE;
  v_rule2_ok       BOOLEAN := FALSE;
  v_rule3_ok       BOOLEAN := FALSE;
  v_title          TEXT;
  v_description    TEXT;
  v_recommendation TEXT;
BEGIN
  -- Obtener consumo del mes actual
  EXECUTE format(
    'SELECT COALESCE(%I, 0) FROM lecturas_mensuales_agua_consumo WHERE anio = %s AND mes = %s LIMIT 1',
    p_column, p_year, p_month
  ) INTO v_current_val;

  IF v_current_val IS NULL OR v_current_val = 0 THEN RETURN; END IF;

  -- -------------------------------------------------------
  -- Regla 1: vs promedio móvil de los 10 meses anteriores
  -- -------------------------------------------------------
  FOR i IN 1..10 LOOP
    v_check_month := p_month - i;
    v_check_year  := p_year;
    IF v_check_month < 1 THEN
      v_check_month := v_check_month + 12;
      v_check_year  := v_check_year - 1;
    END IF;
    EXECUTE format(
      'SELECT COALESCE(%I, 0) FROM lecturas_mensuales_agua_consumo WHERE anio = %s AND mes = %s LIMIT 1',
      p_column, v_check_year, v_check_month
    ) INTO v_prev_val;
    IF v_prev_val IS NOT NULL AND v_prev_val > 0 THEN
      v_moving_sum   := v_moving_sum + v_prev_val;
      v_moving_count := v_moving_count + 1;
    END IF;
  END LOOP;

  IF v_moving_count >= 3 THEN
    v_moving_avg := v_moving_sum / v_moving_count;
    IF v_moving_avg > 0 AND v_current_val > v_moving_avg * 1.30 THEN
      v_rule1_ok := TRUE;
      v_rules_fired := array_append(v_rules_fired,
        format('promedio móvil 10 meses (%s m³ vs %s m³ ref)',
          round(v_current_val, 2), round(v_moving_avg, 2)));
    END IF;
  END IF;

  -- -------------------------------------------------------
  -- Regla 2: vs mes anterior
  -- -------------------------------------------------------
  v_check_month := p_month - 1;
  v_check_year  := p_year;
  IF v_check_month < 1 THEN
    v_check_month := 12;
    v_check_year  := v_check_year - 1;
  END IF;
  EXECUTE format(
    'SELECT COALESCE(%I, 0) FROM lecturas_mensuales_agua_consumo WHERE anio = %s AND mes = %s LIMIT 1',
    p_column, v_check_year, v_check_month
  ) INTO v_prev_val;
  IF v_prev_val IS NOT NULL AND v_prev_val > 0 THEN
    IF v_current_val > v_prev_val * 1.30 THEN
      v_rule2_ok := TRUE;
      v_rules_fired := array_append(v_rules_fired,
        format('mes anterior (%s m³ vs %s m³)',
          round(v_current_val, 2), round(v_prev_val, 2)));
    END IF;
  END IF;

  -- -------------------------------------------------------
  -- Regla 3: vs mismo mes, año anterior
  -- -------------------------------------------------------
  EXECUTE format(
    'SELECT COALESCE(%I, 0) FROM lecturas_mensuales_agua_consumo WHERE anio = %s AND mes = %s LIMIT 1',
    p_column, p_year - 1, p_month
  ) INTO v_same_prev_yr;
  IF v_same_prev_yr IS NOT NULL AND v_same_prev_yr > 0 THEN
    IF v_current_val > v_same_prev_yr * 1.30 THEN
      v_rule3_ok := TRUE;
      v_rules_fired := array_append(v_rules_fired,
        format('mismo mes año anterior (%s m³ vs %s m³ en %s)',
          round(v_current_val, 2), round(v_same_prev_yr, 2), p_year - 1));
    END IF;
  END IF;

  -- Las tres reglas deben cumplirse simultáneamente (condición AND)
  IF NOT (v_rule1_ok AND v_rule2_ok AND v_rule3_ok) THEN RETURN; END IF;

  -- -------------------------------------------------------
  -- Insertar alerta consolidada
  -- -------------------------------------------------------
  v_title := format(
    'Posible fuga detectada — Mes %s/%s (%s m³)',
    p_month, p_year, round(v_current_val, 2)
  );

  v_description := format(
    'El consumo del mes %s del año %s (%s m³) supera en más del 30%% el valor de referencia en las 3 reglas simultáneas: %s',
    p_month, p_year, round(v_current_val, 2),
    array_to_string(v_rules_fired, '; ')
  );

  v_recommendation := 'Revisar físicamente el pozo y las líneas de distribución. Verificar si existe fuga, válvula abierta o medidor defectuoso.';

  INSERT INTO well_events (
    well_id, meter_column, event_type, severity, is_automatic,
    title, description, recommendation,
    metric_value, threshold_value,
    alert_year, alert_month, alert_granularity,
    start_date, event_status, author_name
  ) VALUES (
    NULL, p_meter_label, 'posible_fuga', 'preventiva', true,
    v_title, v_description, v_recommendation,
    round(v_current_val, 2), 0,
    p_year, p_month, 'monthly',
    v_now, 'activo', 'Sistema Automático'
  )
  ON CONFLICT DO NOTHING;

END;
$$;


-- ============================================================
-- 5. FUNCIÓN TRIGGER: fn_leak_trigger_monthly()
-- ============================================================
CREATE OR REPLACE FUNCTION fn_leak_trigger_monthly()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_col_name  TEXT;
  v_row_json  JSONB;
  v_col_value DECIMAL;
BEGIN
  v_row_json := row_to_json(NEW)::JSONB;

  FOR v_col_name IN
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'lecturas_mensuales_agua_consumo'
      AND data_type    = 'numeric'
  LOOP
    v_col_value := COALESCE((v_row_json ->> v_col_name)::DECIMAL, 0);

    IF TG_OP = 'INSERT' OR (
      TG_OP = 'UPDATE' AND
      COALESCE((row_to_json(OLD)::JSONB ->> v_col_name)::DECIMAL, 0) <> v_col_value
    ) THEN
      PERFORM fn_evaluate_leak_alerts_monthly(
        v_col_name, v_col_name, NEW.anio, NEW.mes
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;


-- ============================================================
-- 6. ADJUNTAR TRIGGER A lecturas_mensuales_agua_consumo
-- ============================================================
DROP TRIGGER IF EXISTS trg_fuga_leak_monthly ON lecturas_mensuales_agua_consumo;

CREATE TRIGGER trg_fuga_leak_monthly
  AFTER INSERT OR UPDATE ON lecturas_mensuales_agua_consumo
  FOR EACH ROW
  EXECUTE FUNCTION fn_leak_trigger_monthly();


-- ============================================================
-- 7. SCANNER + PG_CRON
-- Evalúa el último mes con datos, solo si es nuevo desde el
-- último escaneo. Usa alert_scan_state con key 'fuga_mensual'.
-- ============================================================
CREATE OR REPLACE FUNCTION fn_scan_fuga_mensual()
RETURNS TABLE(well_name TEXT, year_scanned INTEGER, month_scanned INTEGER, result TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  v_max_year      INTEGER;
  v_max_month     INTEGER;
  v_last_encoded  INTEGER; -- almacenado como anio*100+mes (ej: 202605)
  v_cur_encoded   INTEGER;
  v_scan_key      TEXT := 'fuga_mensual';
  v_well          RECORD;
BEGIN
  -- Mes más reciente con datos
  SELECT anio, mes
  INTO v_max_year, v_max_month
  FROM lecturas_mensuales_agua_consumo
  ORDER BY anio DESC, mes DESC
  LIMIT 1;

  IF v_max_year IS NULL THEN
    well_name    := 'N/A';
    year_scanned := 0;
    month_scanned := 0;
    result       := 'sin datos en lecturas_mensuales_agua_consumo';
    RETURN NEXT;
    RETURN;
  END IF;

  v_cur_encoded := v_max_year * 100 + v_max_month;

  -- Última vez escaneado (almacenado en last_scanned_week como encoded)
  SELECT last_scanned_week INTO v_last_encoded
  FROM alert_scan_state
  WHERE alert_scan_state.table_name = v_scan_key;

  IF v_last_encoded IS NULL THEN v_last_encoded := 0; END IF;

  IF v_cur_encoded <= v_last_encoded THEN
    well_name     := 'N/A';
    year_scanned  := v_max_year;
    month_scanned := v_max_month;
    result        := 'sin cambios (último escaneado: ' || v_last_encoded || ')';
    RETURN NEXT;
    RETURN;
  END IF;

  -- Evaluar cada columna numérica del esquema
  FOR v_well IN
    SELECT column_name AS name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'lecturas_mensuales_agua_consumo'
      AND data_type    = 'numeric'
  LOOP
    BEGIN
      PERFORM fn_evaluate_leak_alerts_monthly(
        v_well.name, v_well.name, v_max_year, v_max_month
      );
      well_name     := v_well.name;
      year_scanned  := v_max_year;
      month_scanned := v_max_month;
      result        := 'evaluado';
      RETURN NEXT;
    EXCEPTION WHEN OTHERS THEN
      well_name     := v_well.name;
      year_scanned  := v_max_year;
      month_scanned := v_max_month;
      result        := 'error: ' || SQLERRM;
      RETURN NEXT;
    END;
  END LOOP;

  -- Actualizar estado
  INSERT INTO alert_scan_state (table_name, last_scanned_week, last_scanned_at)
  VALUES (v_scan_key, v_cur_encoded, NOW())
  ON CONFLICT (table_name) DO UPDATE SET
    last_scanned_week = EXCLUDED.last_scanned_week,
    last_scanned_at   = EXCLUDED.last_scanned_at;
END;
$$;

-- Habilitar pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Registrar job
SELECT cron.unschedule('scan_fuga_alerts_mensual')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'scan_fuga_alerts_mensual');

SELECT cron.schedule(
  'scan_fuga_alerts_mensual',
  '0 */6 * * *',
  $$SELECT * FROM fn_scan_fuga_mensual()$$
);
