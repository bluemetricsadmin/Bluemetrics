-- ============================================================
-- Migración: Unificación de alertas en 'anomalia_sobreconsumo'
-- Fecha: 2026-08-28
--
-- Sustituye los 3 tipos automáticos (alerta_consumo, sobreconsumo,
-- posible_fuga) por UN solo tipo: 'anomalia_sobreconsumo'.
--
-- Diseño:
--   - Cada lectura (diaria/semanal/mensual) se evalúa con las
--     MISMAS 3 reglas simultáneas (AND) por cada medidor:
--        R1: vs promedio móvil de los 10 periodos anteriores
--        R2: vs periodo inmediatamente anterior
--        R3: vs mismo periodo del año anterior
--     Condición: consumo actual > 30% por encima de la referencia
--     en las 3 reglas a la vez (AND).
--   - Si al menos un medidor incumple, se genera UNA sola alerta
--     por lectura, guardando en meter_column/metric_value al
--     medidor con mayor consumo.
--   - Deduplicación por periodo (no por medidor):
--        diario   → índice único (alert_date)
--        semanal  → índice único (alert_week, alert_year)
--        mensual  → índice único (alert_year, alert_month)
--
-- Ejecutar por orden en la consola de Supabase (SQL Editor).
-- Archivo autocontenido e idempotente (puede re-ejecutarse).
-- ============================================================


-- ============================================================
-- 0. LIMPIEZA IDEMPOTENTE
-- ============================================================

-- 0a. Desprogramar jobs pg_cron viejos
DO $$
BEGIN
  PERFORM cron.unschedule('scan_fuga_alerts_diario');
  PERFORM cron.unschedule('scan_fuga_alerts_semanal');
  PERFORM cron.unschedule('scan_fuga_alerts_mensual');
  PERFORM cron.unschedule('scan_consumption_alerts');
  PERFORM cron.unschedule('scan_anomalia_diario');
  PERFORM cron.unschedule('scan_anomalia_semanal');
  PERFORM cron.unschedule('scan_anomalia_mensual');
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$$;

-- 0b. Eliminar event trigger DDL (sobreconsumo + fuga) y triggers semanales
DROP EVENT TRIGGER IF EXISTS evt_auto_attach_consumption_alert;

DO $$
DECLARE
  v_table RECORD;
BEGIN
  FOR v_table IN
    SELECT table_name AS tname
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name LIKE 'lecturas_semana_agua_consumo_%'
      AND table_type = 'BASE TABLE'
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_alert_consumo_%s ON %I',
      RIGHT(v_table.tname, 4), v_table.tname
    );
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_fuga_%s ON %I',
      RIGHT(v_table.tname, 4), v_table.tname
    );
  END LOOP;
END;
$$;

-- 0c. Eliminar triggers diario y mensual
DROP TRIGGER IF EXISTS trg_fuga_leak_daily    ON lecturas_diarias_consumo;
DROP TRIGGER IF EXISTS trg_fuga_leak_monthly  ON lecturas_mensuales_agua_consumo;

-- 0d. Eliminar funciones automáticas viejas (en cualquier versión)
DROP FUNCTION IF EXISTS fn_scan_fuga_diario();
DROP FUNCTION IF EXISTS fn_scan_fuga_semanal();
DROP FUNCTION IF EXISTS fn_scan_fuga_mensual();
DROP FUNCTION IF EXISTS fn_scan_all_consumption_alerts();
DROP FUNCTION IF EXISTS fn_attach_leak_triggers_weekly();
DROP FUNCTION IF EXISTS fn_attach_alert_triggers();
DROP FUNCTION IF EXISTS fn_leak_trigger_daily();
DROP FUNCTION IF EXISTS fn_leak_trigger_weekly();
DROP FUNCTION IF EXISTS fn_leak_trigger_monthly();
DROP FUNCTION IF EXISTS fn_consumption_alert_trigger();
DROP FUNCTION IF EXISTS fn_evaluate_leak_alerts_daily(TEXT, TEXT, TEXT, TEXT, BIGINT);
DROP FUNCTION IF EXISTS fn_evaluate_leak_alerts_daily(INTEGER, TEXT, TEXT, TEXT, BIGINT);
DROP FUNCTION IF EXISTS fn_evaluate_leak_alerts_weekly(TEXT, TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS fn_evaluate_leak_alerts_weekly(INTEGER, TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS fn_evaluate_leak_alerts_monthly(TEXT, TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS fn_evaluate_leak_alerts_monthly(INTEGER, TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS fn_evaluate_well_alerts(INTEGER, TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS fn_check_weekly_leak_rules(TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS fn_check_monthly_leak_rules(TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS fn_auto_attach_consumption_trigger();
DROP FUNCTION IF EXISTS fn_evaluate_anomaly_daily(TEXT, TEXT, BIGINT);
DROP FUNCTION IF EXISTS fn_evaluate_anomaly_weekly(INTEGER, INTEGER);
DROP FUNCTION IF EXISTS fn_evaluate_anomaly_monthly(INTEGER, INTEGER);
DROP FUNCTION IF EXISTS fn_leak_trigger_anomaly_daily();
DROP FUNCTION IF EXISTS fn_leak_trigger_anomaly_weekly();
DROP FUNCTION IF EXISTS fn_leak_trigger_anomaly_monthly();
DROP FUNCTION IF EXISTS fn_scan_anomalia_diario();
DROP FUNCTION IF EXISTS fn_scan_anomalia_semanal();
DROP FUNCTION IF EXISTS fn_scan_anomalia_mensual();

-- 0e. Eliminar índices de dedup viejos
DROP INDEX IF EXISTS idx_well_events_fuga_daily;
DROP INDEX IF EXISTS idx_well_events_fuga_weekly;
DROP INDEX IF EXISTS idx_well_events_fuga_monthly;
DROP INDEX IF EXISTS idx_well_events_anomalia_daily;
DROP INDEX IF EXISTS idx_well_events_anomalia_weekly;
DROP INDEX IF EXISTS idx_well_events_anomalia_monthly;
DROP INDEX IF EXISTS idx_well_events_auto_unique;


-- ============================================================
-- 0f. LIMPIEZA DE DATOS PRE-CONSTRAINT
-- Debe ejecutarse ANTES de redefinir el CHECK de event_type:
-- las filas con tipos viejos (automáticas o manuales) violan el nuevo CHECK.
-- ============================================================

-- 0f-1. Desvincular sms_logs que apunten a alertas automáticas (por FK)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sms_logs' AND column_name = 'well_event_id'
  ) THEN
    EXECUTE 'UPDATE sms_logs SET well_event_id = NULL WHERE well_event_id IS NOT NULL';
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$$;

-- 0f-2. Eliminar alertas automáticas existentes (alerta_consumo, sobreconsumo, posible_fuga)
DELETE FROM well_events WHERE is_automatic = true;

-- 0f-3. Reclasificar eventos manuales con tipos obsoletos (evitar violar el nuevo CHECK)
UPDATE well_events
SET event_type = 'otro'
WHERE is_automatic = false
  AND event_type IN ('alerta_consumo', 'sobreconsumo', 'posible_fuga');

-- 0f-4. Reset del estado de escaneo para que los cron regeneren alertas
DELETE FROM alert_scan_state;


-- ============================================================
-- 2. CHECK CONSTRAINT: añadir 'anomalia_sobreconsumo'
-- ============================================================
ALTER TABLE well_events DROP CONSTRAINT IF EXISTS well_events_event_type_check;
ALTER TABLE well_events ADD CONSTRAINT well_events_event_type_check
  CHECK (event_type IN (
    'mantenimiento', 'parado', 'reparacion', 'inspeccion', 'otro',
    'anomalia_sobreconsumo'
  ));


-- ============================================================
-- 3. ÍNDICES ÚNICOS PARCIALES — 1 ALERTA POR LECTURA
-- ============================================================

-- 3a. Diario: una sola alerta por día calendario
CREATE UNIQUE INDEX idx_well_events_anomalia_daily
  ON well_events (alert_date)
  WHERE event_type              = 'anomalia_sobreconsumo'
    AND alert_granularity       = 'daily'
    AND is_automatic            = true;

-- 3b. Semanal: una sola alerta por (semana, año)
CREATE UNIQUE INDEX idx_well_events_anomalia_weekly
  ON well_events (alert_week, alert_year)
  WHERE event_type              = 'anomalia_sobreconsumo'
    AND alert_granularity       = 'weekly'
    AND is_automatic            = true;

-- 3c. Mensual: una sola alerta por (año, mes)
CREATE UNIQUE INDEX idx_well_events_anomalia_monthly
  ON well_events (alert_year, alert_month)
  WHERE event_type              = 'anomalia_sobreconsumo'
    AND alert_granularity       = 'monthly'
    AND is_automatic            = true;


-- ============================================================
-- 4. HELPERS COMUNES
-- ============================================================

-- 4a. fn_get_week_consumption: consumo de un medidor en una semana.
-- Maneja cruce de año (week < 1 → semana equivalente del año anterior).
CREATE OR REPLACE FUNCTION fn_get_week_consumption(
  p_column TEXT,
  p_year   INTEGER,
  p_week   INTEGER
)
RETURNS DECIMAL
LANGUAGE plpgsql
AS $$
DECLARE
  v_year       INTEGER := p_year;
  v_week       INTEGER := p_week;
  v_table      TEXT;
  v_max_week   INTEGER;
  v_result     DECIMAL;
BEGIN
  IF v_week < 1 THEN
    v_year := v_year - 1;
    v_table := 'lecturas_semana_agua_consumo_' || v_year;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = v_table AND table_type = 'BASE TABLE'
    ) THEN
      RETURN NULL;
    END IF;

    EXECUTE format('SELECT MAX(l_numero_semana) FROM %I', v_table) INTO v_max_week;
    v_week := COALESCE(v_max_week, 52) + v_week;
    IF v_week < 1 THEN RETURN NULL; END IF;
  END IF;

  v_table := 'lecturas_semana_agua_consumo_' || v_year;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = v_table AND table_type = 'BASE TABLE'
  ) THEN
    RETURN NULL;
  END IF;

  EXECUTE format(
    'SELECT COALESCE(%I, 0) FROM %I WHERE l_numero_semana = %s LIMIT 1',
    p_column, v_table, v_week
  ) INTO v_result;

  RETURN v_result;
END;
$$;


-- ============================================================
-- 5. EVALUADOR CONSOLIDADO — DIARIO
-- 1 sola alerta por lectura diaria. Evalúa las 3 reglas AND por
-- medidor (columna) y conserva el que tenga mayor consumo.
-- ============================================================
CREATE OR REPLACE FUNCTION fn_evaluate_anomaly_daily(
  p_mes_anio TEXT,
  p_dia_hora TEXT,
  p_row_id   BIGINT
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_now             TIMESTAMP WITH TIME ZONE := NOW();
  v_current_mes     TEXT;
  v_current_anio    INTEGER;
  v_day_num         INTEGER;
  v_hour_part       TEXT;
  v_mes_num         INTEGER;
  v_mes_map         TEXT[][] := ARRAY[
    ARRAY['enero','1'], ARRAY['febrero','2'], ARRAY['marzo','3'],
    ARRAY['abril','4'], ARRAY['mayo','5'], ARRAY['junio','6'],
    ARRAY['julio','7'], ARRAY['agosto','8'], ARRAY['septiembre','9'],
    ARRAY['octubre','10'], ARRAY['noviembre','11'], ARRAY['diciembre','12']
  ];
  v_mes_inv_map     TEXT[][] := ARRAY[
    ARRAY['1','enero'], ARRAY['2','febrero'], ARRAY['3','marzo'],
    ARRAY['4','abril'], ARRAY['5','mayo'], ARRAY['6','junio'],
    ARRAY['7','julio'], ARRAY['8','agosto'], ARRAY['9','septiembre'],
    ARRAY['10','octubre'], ARRAY['11','noviembre'], ARRAY['12','diciembre']
  ];
  k                 INTEGER;
  v_col             RECORD;
  v_cur             DECIMAL;
  v_moving_avg      DECIMAL;
  v_moving_sum      DECIMAL := 0;
  v_moving_count    INTEGER := 0;
  v_prev_val        DECIMAL;
  v_prev_yr_val     DECIMAL;
  v_target_date     DATE;
  v_prev_date       DATE;
  v_prev_week_day   INTEGER;
  v_prev_week_anio  INTEGER;
  v_prev_week_mes   TEXT;
  v_rule1_ok        BOOLEAN := FALSE;
  v_rule2_ok        BOOLEAN := FALSE;
  v_rule3_ok        BOOLEAN := FALSE;
  v_best_col        TEXT := NULL;
  v_best_val        DECIMAL := 0;
  v_best_ref        DECIMAL := 0;
  v_alert_date      DATE;
  v_title           TEXT;
  v_description     TEXT;
  v_recommendation  TEXT;
BEGIN
  -- Parsear mes_anio y dia_hora
  v_current_mes  := SPLIT_PART(p_mes_anio, ' ', 1);
  v_current_anio := CAST(SPLIT_PART(p_mes_anio, ' ', 2) AS INTEGER);
  v_day_num      := CAST(SUBSTRING(p_dia_hora FROM 4 FOR 2) AS INTEGER);
  v_hour_part    := SUBSTRING(p_dia_hora FROM 7);

  v_mes_num := NULL;
  FOR k IN 1..12 LOOP
    IF v_mes_map[k][1] = v_current_mes THEN
      v_mes_num := CAST(v_mes_map[k][2] AS INTEGER);
    END IF;
  END LOOP;
  IF v_mes_num IS NULL THEN RETURN; END IF;

  -- Fecha calendario de la alerta (fix de dedup diario: antes siempre NULL)
  BEGIN
    v_alert_date := make_date(v_current_anio, v_mes_num, v_day_num);
  EXCEPTION WHEN OTHERS THEN
    v_alert_date := NULL;
  END;
  IF v_alert_date IS NULL THEN
    SELECT created_at::date INTO v_alert_date
    FROM lecturas_diarias_consumo WHERE id = p_row_id;
  END IF;

  -- Evaluar cada medidor (columna numérica)
  FOR v_col IN
    SELECT column_name AS name FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'lecturas_diarias_consumo'
      AND data_type    = 'numeric'
  LOOP
    EXECUTE format(
      'SELECT COALESCE(%I, 0) FROM lecturas_diarias_consumo WHERE id = %s LIMIT 1',
      v_col.name, p_row_id
    ) INTO v_cur;

    IF v_cur IS NULL OR v_cur = 0 THEN CONTINUE; END IF;

    v_rule1_ok := FALSE;
    v_rule2_ok := FALSE;
    v_rule3_ok := FALSE;
    v_moving_avg := 0;

    -- R1: promedio móvil de las 10 lecturas anteriores
    EXECUTE format(
      'SELECT COALESCE(AVG(x), 0), COUNT(*) FROM (
         SELECT %I AS x FROM lecturas_diarias_consumo
         WHERE id < %s AND %I > 0 ORDER BY id DESC LIMIT 10
       ) t',
      v_col.name, p_row_id, v_col.name
    ) INTO v_moving_avg, v_moving_count;

    IF v_moving_count >= 3 AND v_moving_avg > 0 AND v_cur > v_moving_avg * 1.30 THEN
      v_rule1_ok := TRUE;
    END IF;

    -- R2: mismo día de la semana anterior
    BEGIN
      v_target_date := make_date(v_current_anio, v_mes_num, v_day_num);
      v_prev_date   := v_target_date - INTERVAL '7 days';
      v_prev_week_day  := EXTRACT(DAY FROM v_prev_date)::INTEGER;
      v_prev_week_anio := EXTRACT(YEAR FROM v_prev_date)::INTEGER;

      v_prev_week_mes := NULL;
      FOR k IN 1..12 LOOP
        IF CAST(v_mes_inv_map[k][1] AS INTEGER) = EXTRACT(MONTH FROM v_prev_date)::INTEGER THEN
          v_prev_week_mes := v_mes_inv_map[k][2];
        END IF;
      END LOOP;

      IF v_prev_week_mes IS NOT NULL THEN
        EXECUTE format(
          'SELECT COALESCE(%I, 0) FROM lecturas_diarias_consumo
           WHERE mes_anio = %L
             AND SUBSTRING(dia_hora FROM 4 FOR 2) = %L
             AND SUBSTRING(dia_hora FROM 7) = %L
           ORDER BY id DESC LIMIT 1',
          v_col.name,
          v_prev_week_mes || ' ' || v_prev_week_anio,
          lpad(v_prev_week_day::TEXT, 2, '0'),
          v_hour_part
        ) INTO v_prev_val;
        IF v_prev_val IS NOT NULL AND v_prev_val > 0 AND v_cur > v_prev_val * 1.30 THEN
          v_rule2_ok := TRUE;
        END IF;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;

    -- R3: mismo día del año anterior
    EXECUTE format(
      'SELECT COALESCE(%I, 0) FROM lecturas_diarias_consumo
       WHERE mes = %L AND anio = %L
         AND SUBSTRING(dia_hora FROM 4 FOR 2) = %L
         AND SUBSTRING(dia_hora FROM 7) = %L
       ORDER BY id DESC LIMIT 1',
      v_col.name,
      v_current_mes, (v_current_anio - 1)::TEXT,
      lpad(v_day_num::TEXT, 2, '0'),
      v_hour_part
    ) INTO v_prev_yr_val;
    IF v_prev_yr_val IS NOT NULL AND v_prev_yr_val > 0 AND v_cur > v_prev_yr_val * 1.30 THEN
      v_rule3_ok := TRUE;
    END IF;

    -- Las 3 reglas simultáneas → candidato del peor medidor
    IF v_rule1_ok AND v_rule2_ok AND v_rule3_ok AND v_cur > v_best_val THEN
      v_best_col := v_col.name;
      v_best_val := v_cur;
      v_best_ref := v_moving_avg;
    END IF;
  END LOOP;

  IF v_best_col IS NULL THEN RETURN; END IF;

  v_title := format(
    'Anomalía de sobreconsumo detectada — %s %s (%s m³)',
    p_dia_hora, p_mes_anio, round(v_best_val, 2)
  );

  v_description := format(
    'La lectura del %s de %s supera en más del 30%% los valores de referencia en las 3 reglas simultáneas (promedio móvil 10 días, mismo día de la semana anterior y mismo día del año anterior). Medidor con mayor consumo: %s (%s m³, referencia %s m³).',
    p_dia_hora, p_mes_anio, v_best_col, round(v_best_val, 2), round(v_best_ref, 2)
  );

  v_recommendation := 'Revisar el medidor y las líneas de distribución del periodo reportado. Verificar fugas, válvulas abiertas o mal funcionamiento del medidor.';

  INSERT INTO well_events (
    well_id, meter_column, event_type, severity, is_automatic,
    title, description, recommendation,
    metric_value, threshold_value,
    alert_granularity, alert_date,
    start_date, event_status, author_name
  ) VALUES (
    NULL, v_best_col, 'anomalia_sobreconsumo', 'preventiva', true,
    v_title, v_description, v_recommendation,
    round(v_best_val, 2), 0,
    'daily', v_alert_date,
    v_now, 'activo', 'Sistema Automático'
  )
  ON CONFLICT DO NOTHING;
END;
$$;


-- ============================================================
-- 6. EVALUADOR CONSOLIDADO — SEMANAL
-- 1 sola alerta por semana. Asume v_moving_avg de R1.
-- ============================================================
CREATE OR REPLACE FUNCTION fn_evaluate_anomaly_weekly(
  p_year INTEGER,
  p_week INTEGER
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_table          TEXT;
  v_now            TIMESTAMP WITH TIME ZONE := NOW();
  v_col            RECORD;
  v_cur            DECIMAL;
  v_moving_avg     DECIMAL;
  v_moving_sum     DECIMAL := 0;
  v_moving_count   INTEGER := 0;
  v_prev_week_val  DECIMAL;
  v_same_prev_yr   DECIMAL;
  v_yr_val         DECIMAL;
  i                INTEGER;
  v_rule1_ok       BOOLEAN := FALSE;
  v_rule2_ok       BOOLEAN := FALSE;
  v_rule3_ok       BOOLEAN := FALSE;
  v_best_col       TEXT := NULL;
  v_best_val       DECIMAL := 0;
  v_best_ref       DECIMAL := 0;
  v_title          TEXT;
  v_description    TEXT;
  v_recommendation TEXT;
BEGIN
  v_table := 'lecturas_semana_agua_consumo_' || p_year;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = v_table AND table_type = 'BASE TABLE'
  ) THEN
    RETURN;
  END IF;

  FOR v_col IN
    SELECT column_name AS name FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = v_table
      AND data_type    = 'numeric'
  LOOP
    EXECUTE format(
      'SELECT COALESCE(%I, 0) FROM %I WHERE l_numero_semana = %s LIMIT 1',
      v_col.name, v_table, p_week
    ) INTO v_cur;

    IF v_cur IS NULL OR v_cur = 0 THEN CONTINUE; END IF;

    v_rule1_ok := FALSE;
    v_rule2_ok := FALSE;
    v_rule3_ok := FALSE;
    v_moving_avg := 0;

    -- R1: promedio móvil 10 semanas anteriores
    v_moving_sum := 0;
    v_moving_count := 0;
    FOR i IN 1..10 LOOP
      v_yr_val := fn_get_week_consumption(v_col.name, p_year, p_week - i);
      IF v_yr_val IS NOT NULL AND v_yr_val > 0 THEN
        v_moving_sum   := v_moving_sum + v_yr_val;
        v_moving_count := v_moving_count + 1;
      END IF;
    END LOOP;
    IF v_moving_count >= 3 THEN
      v_moving_avg := v_moving_sum / v_moving_count;
      IF v_moving_avg > 0 AND v_cur > v_moving_avg * 1.30 THEN
        v_rule1_ok := TRUE;
      END IF;
    END IF;

    -- R2: semana anterior
    v_prev_week_val := fn_get_week_consumption(v_col.name, p_year, p_week - 1);
    IF v_prev_week_val IS NOT NULL AND v_prev_week_val > 0 AND v_cur > v_prev_week_val * 1.30 THEN
      v_rule2_ok := TRUE;
    END IF;

    -- R3: misma semana año anterior
    v_same_prev_yr := fn_get_week_consumption(v_col.name, p_year - 1, p_week);
    IF v_same_prev_yr IS NOT NULL AND v_same_prev_yr > 0 AND v_cur > v_same_prev_yr * 1.30 THEN
      v_rule3_ok := TRUE;
    END IF;

    IF v_rule1_ok AND v_rule2_ok AND v_rule3_ok AND v_cur > v_best_val THEN
      v_best_col := v_col.name;
      v_best_val := v_cur;
      v_best_ref := v_moving_avg;
    END IF;
  END LOOP;

  IF v_best_col IS NULL THEN RETURN; END IF;

  v_title := format(
    'Anomalía de sobreconsumo detectada — Semana %s/%s (%s m³)',
    p_week, p_year, round(v_best_val, 2)
  );

  v_description := format(
    'El consumo de la semana %s del año %s supera en más del 30%% los valores de referencia en las 3 reglas simultáneas (promedio móvil 10 semanas, semana anterior y misma semana del año anterior). Medidor con mayor consumo: %s (%s m³, referencia %s m³).',
    p_week, p_year, v_best_col, round(v_best_val, 2), round(v_best_ref, 2)
  );

  v_recommendation := 'Revisar el medidor y las líneas de distribución del periodo reportado. Verificar fugas, válvulas abiertas o mal funcionamiento del medidor.';

  INSERT INTO well_events (
    well_id, meter_column, event_type, severity, is_automatic,
    title, description, recommendation,
    metric_value, threshold_value,
    alert_week, alert_year, alert_granularity,
    start_date, event_status, author_name
  ) VALUES (
    NULL, v_best_col, 'anomalia_sobreconsumo', 'preventiva', true,
    v_title, v_description, v_recommendation,
    round(v_best_val, 2), 0,
    p_week, p_year, 'weekly',
    v_now, 'activo', 'Sistema Automático'
  )
  ON CONFLICT DO NOTHING;
END;
$$;


-- ============================================================
-- 7. EVALUADOR CONSOLIDADO — MENSUAL
-- 1 sola alerta por mes.
-- ============================================================
CREATE OR REPLACE FUNCTION fn_evaluate_anomaly_monthly(
  p_year  INTEGER,
  p_month INTEGER
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_now            TIMESTAMP WITH TIME ZONE := NOW();
  v_col            RECORD;
  v_cur            DECIMAL;
  v_moving_avg     DECIMAL;
  v_moving_sum     DECIMAL := 0;
  v_moving_count   INTEGER := 0;
  v_prev_val       DECIMAL;
  v_same_prev_yr   DECIMAL;
  v_check_month    INTEGER;
  v_check_year     INTEGER;
  i                INTEGER;
  v_rule1_ok       BOOLEAN := FALSE;
  v_rule2_ok       BOOLEAN := FALSE;
  v_rule3_ok       BOOLEAN := FALSE;
  v_best_col       TEXT := NULL;
  v_best_val       DECIMAL := 0;
  v_best_ref       DECIMAL := 0;
  v_title          TEXT;
  v_description    TEXT;
  v_recommendation TEXT;
BEGIN
  FOR v_col IN
    SELECT column_name AS name FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'lecturas_mensuales_agua_consumo'
      AND data_type    = 'numeric'
  LOOP
    EXECUTE format(
      'SELECT COALESCE(%I, 0) FROM lecturas_mensuales_agua_consumo WHERE anio = %s AND mes = %s LIMIT 1',
      v_col.name, p_year, p_month
    ) INTO v_cur;

    IF v_cur IS NULL OR v_cur = 0 THEN CONTINUE; END IF;

    v_rule1_ok := FALSE;
    v_rule2_ok := FALSE;
    v_rule3_ok := FALSE;
    v_moving_avg := 0;

    -- R1: promedio móvil 10 meses anteriores
    v_moving_sum := 0;
    v_moving_count := 0;
    FOR i IN 1..10 LOOP
      v_check_month := p_month - i;
      v_check_year  := p_year;
      IF v_check_month < 1 THEN
        v_check_month := v_check_month + 12;
        v_check_year  := v_check_year - 1;
      END IF;
      EXECUTE format(
        'SELECT COALESCE(%I, 0) FROM lecturas_mensuales_agua_consumo WHERE anio = %s AND mes = %s LIMIT 1',
        v_col.name, v_check_year, v_check_month
      ) INTO v_prev_val;
      IF v_prev_val IS NOT NULL AND v_prev_val > 0 THEN
        v_moving_sum   := v_moving_sum + v_prev_val;
        v_moving_count := v_moving_count + 1;
      END IF;
    END LOOP;
    IF v_moving_count >= 3 THEN
      v_moving_avg := v_moving_sum / v_moving_count;
      IF v_moving_avg > 0 AND v_cur > v_moving_avg * 1.30 THEN
        v_rule1_ok := TRUE;
      END IF;
    END IF;

    -- R2: mes anterior
    v_check_month := p_month - 1;
    v_check_year  := p_year;
    IF v_check_month < 1 THEN
      v_check_month := 12;
      v_check_year  := v_check_year - 1;
    END IF;
    EXECUTE format(
      'SELECT COALESCE(%I, 0) FROM lecturas_mensuales_agua_consumo WHERE anio = %s AND mes = %s LIMIT 1',
      v_col.name, v_check_year, v_check_month
    ) INTO v_prev_val;
    IF v_prev_val IS NOT NULL AND v_prev_val > 0 AND v_cur > v_prev_val * 1.30 THEN
      v_rule2_ok := TRUE;
    END IF;

    -- R3: mismo mes año anterior
    EXECUTE format(
      'SELECT COALESCE(%I, 0) FROM lecturas_mensuales_agua_consumo WHERE anio = %s AND mes = %s LIMIT 1',
      v_col.name, p_year - 1, p_month
    ) INTO v_same_prev_yr;
    IF v_same_prev_yr IS NOT NULL AND v_same_prev_yr > 0 AND v_cur > v_same_prev_yr * 1.30 THEN
      v_rule3_ok := TRUE;
    END IF;

    IF v_rule1_ok AND v_rule2_ok AND v_rule3_ok AND v_cur > v_best_val THEN
      v_best_col := v_col.name;
      v_best_val := v_cur;
      v_best_ref := v_moving_avg;
    END IF;
  END LOOP;

  IF v_best_col IS NULL THEN RETURN; END IF;

  v_title := format(
    'Anomalía de sobreconsumo detectada — Mes %s/%s (%s m³)',
    p_month, p_year, round(v_best_val, 2)
  );

  v_description := format(
    'El consumo del mes %s del año %s supera en más del 30%% los valores de referencia en las 3 reglas simultáneas (promedio móvil 10 meses, mes anterior y mismo mes del año anterior). Medidor con mayor consumo: %s (%s m³, referencia %s m³).',
    p_month, p_year, v_best_col, round(v_best_val, 2), round(v_best_ref, 2)
  );

  v_recommendation := 'Revisar el medidor y las líneas de distribución del periodo reportado. Verificar fugas, válvulas abiertas o mal funcionamiento del medidor.';

  INSERT INTO well_events (
    well_id, meter_column, event_type, severity, is_automatic,
    title, description, recommendation,
    metric_value, threshold_value,
    alert_year, alert_month, alert_granularity,
    start_date, event_status, author_name
  ) VALUES (
    NULL, v_best_col, 'anomalia_sobreconsumo', 'preventiva', true,
    v_title, v_description, v_recommendation,
    round(v_best_val, 2), 0,
    p_year, p_month, 'monthly',
    v_now, 'activo', 'Sistema Automático'
  )
  ON CONFLICT DO NOTHING;
END;
$$;


-- ============================================================
-- 8. TRIGGERS
-- ============================================================

-- 8a. Diario (lecturas_diarias_consumo)
CREATE OR REPLACE FUNCTION fn_leak_trigger_anomaly_daily()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM fn_evaluate_anomaly_daily(NEW.mes_anio, NEW.dia_hora, NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_anomalia_daily ON lecturas_diarias_consumo;
CREATE TRIGGER trg_anomalia_daily
  AFTER INSERT OR UPDATE ON lecturas_diarias_consumo
  FOR EACH ROW
  EXECUTE FUNCTION fn_leak_trigger_anomaly_daily();

-- 8b. Semanal (tablas lecturas_semana_agua_consumo_%)
CREATE OR REPLACE FUNCTION fn_leak_trigger_anomaly_weekly()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_year INTEGER;
BEGIN
  v_year := CAST(RIGHT(TG_TABLE_NAME, 4) AS INTEGER);
  PERFORM fn_evaluate_anomaly_weekly(v_year, NEW.l_numero_semana);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION fn_attach_leak_triggers_weekly()
RETURNS TABLE(table_name TEXT, action TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  v_table         RECORD;
  v_trigger_name  TEXT;
  v_year_suffix   TEXT;
BEGIN
  FOR v_table IN
    SELECT t.table_name AS tname
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
      AND t.table_name LIKE 'lecturas_semana_agua_consumo_%'
      AND t.table_type = 'BASE TABLE'
    ORDER BY t.table_name
  LOOP
    v_year_suffix  := RIGHT(v_table.tname, 4);
    v_trigger_name := 'trg_anomalia_' || v_year_suffix;

    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', v_trigger_name, v_table.tname);
    EXECUTE format(
      'CREATE TRIGGER %I
         AFTER INSERT OR UPDATE ON %I
         FOR EACH ROW
         EXECUTE FUNCTION fn_leak_trigger_anomaly_weekly()',
      v_trigger_name, v_table.tname
    );
    table_name := v_table.tname;
    action     := 'trigger creado';
    RETURN NEXT;
  END LOOP;
END;
$$;

-- 8c. Mensual (lecturas_mensuales_agua_consumo)
CREATE OR REPLACE FUNCTION fn_leak_trigger_anomaly_monthly()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM fn_evaluate_anomaly_monthly(NEW.anio, NEW.mes);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_anomalia_monthly ON lecturas_mensuales_agua_consumo;
CREATE TRIGGER trg_anomalia_monthly
  AFTER INSERT OR UPDATE ON lecturas_mensuales_agua_consumo
  FOR EACH ROW
  EXECUTE FUNCTION fn_leak_trigger_anomaly_monthly();


-- ============================================================
-- 9. EVENT TRIGGER — auto-adjunta en tablas semanales nuevas
-- (solo el trigger de anomalía; el de sobreconsumo queda fuera)
-- ============================================================
CREATE OR REPLACE FUNCTION fn_auto_attach_consumption_trigger()
RETURNS event_trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_obj          RECORD;
  v_table_name   TEXT;
  v_year_suffix  TEXT;
  v_trig_anom    TEXT;
BEGIN
  FOR v_obj IN SELECT * FROM pg_event_trigger_ddl_commands() LOOP
    IF v_obj.object_type = 'table' THEN
      v_table_name := split_part(v_obj.object_identity, '.', 2);
      IF v_table_name LIKE 'lecturas_semana_agua_consumo_%' THEN
        v_year_suffix := RIGHT(v_table_name, 4);
        v_trig_anom   := 'trg_anomalia_' || v_year_suffix;
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', v_trig_anom, v_table_name);
        EXECUTE format(
          'CREATE TRIGGER %I
             AFTER INSERT OR UPDATE ON %I
             FOR EACH ROW
             EXECUTE FUNCTION fn_leak_trigger_anomaly_weekly()',
          v_trig_anom, v_table_name
        );
        RAISE NOTICE 'Trigger de anomalía auto-adjuntado a tabla: %', v_table_name;
      END IF;
    END IF;
  END LOOP;
END;
$$;

DROP EVENT TRIGGER IF EXISTS evt_auto_attach_consumption_alert;
CREATE EVENT TRIGGER evt_auto_attach_consumption_alert
  ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE')
  EXECUTE FUNCTION fn_auto_attach_consumption_trigger();

-- Adjuntar a todas las tablas semanales existentes
SELECT * FROM fn_attach_leak_triggers_weekly();


-- ============================================================
-- 10. SCANNERS + PG_CRON (regeneran la última lectura tras deploy)
-- ============================================================

-- 10a. Scanner diario
CREATE OR REPLACE FUNCTION fn_scan_anomalia_diario()
RETURNS TABLE(row_id_scanned BIGINT, mes_anio_scanned TEXT, result TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  v_max_id    BIGINT;
  v_mes_anio  TEXT;
  v_dia_hora  TEXT;
  v_last_id   BIGINT;
  v_scan_key  TEXT := 'anomalia_diario';
BEGIN
  SELECT id, mes_anio, dia_hora INTO v_max_id, v_mes_anio, v_dia_hora
  FROM lecturas_diarias_consumo ORDER BY id DESC LIMIT 1;

  IF v_max_id IS NULL THEN
    row_id_scanned := 0;
    mes_anio_scanned := 'N/A';
    result := 'sin datos en lecturas_diarias_consumo';
    RETURN NEXT;
    RETURN;
  END IF;

  SELECT last_scanned_week INTO v_last_id FROM alert_scan_state WHERE table_name = v_scan_key;
  IF v_last_id IS NULL THEN v_last_id := 0; END IF;

  IF v_max_id <= v_last_id THEN
    row_id_scanned := v_max_id;
    mes_anio_scanned := v_mes_anio;
    result := 'sin cambios';
    RETURN NEXT;
    RETURN;
  END IF;

  PERFORM fn_evaluate_anomaly_daily(v_mes_anio, v_dia_hora, v_max_id);
  row_id_scanned := v_max_id;
  mes_anio_scanned := v_mes_anio;
  result := 'evaluado';

  INSERT INTO alert_scan_state (table_name, last_scanned_week, last_scanned_at)
  VALUES (v_scan_key, v_max_id::INTEGER, NOW())
  ON CONFLICT (table_name) DO UPDATE SET
    last_scanned_week = EXCLUDED.last_scanned_week,
    last_scanned_at   = EXCLUDED.last_scanned_at;

  RETURN NEXT;
END;
$$;

-- 10b. Scanner semanal
CREATE OR REPLACE FUNCTION fn_scan_anomalia_semanal()
RETURNS TABLE(year_scanned INTEGER, week_scanned INTEGER, result TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_year INTEGER;
  v_table_name   TEXT;
  v_max_week     INTEGER;
  v_last_week    INTEGER;
  v_scan_key     TEXT;
BEGIN
  v_current_year := EXTRACT(YEAR FROM NOW());
  v_table_name   := 'lecturas_semana_agua_consumo_' || v_current_year;
  v_scan_key     := 'anomalia_semanal_' || v_current_year;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = v_table_name AND table_type = 'BASE TABLE'
  ) THEN
    year_scanned := v_current_year;
    week_scanned := 0;
    result := 'tabla ' || v_table_name || ' no existe';
    RETURN NEXT;
    RETURN;
  END IF;

  EXECUTE format('SELECT MAX(l_numero_semana) FROM %I WHERE l_numero_semana IS NOT NULL', v_table_name)
  INTO v_max_week;

  IF v_max_week IS NULL THEN
    year_scanned := v_current_year;
    week_scanned := 0;
    result := 'sin datos en ' || v_table_name;
    RETURN NEXT;
    RETURN;
  END IF;

  SELECT last_scanned_week INTO v_last_week FROM alert_scan_state WHERE table_name = v_scan_key;
  IF v_last_week IS NULL THEN v_last_week := 0; END IF;

  IF v_max_week <= v_last_week THEN
    year_scanned := v_current_year;
    week_scanned := v_max_week;
    result := 'sin cambios';
    RETURN NEXT;
    RETURN;
  END IF;

  PERFORM fn_evaluate_anomaly_weekly(v_current_year, v_max_week);
  year_scanned := v_current_year;
  week_scanned := v_max_week;
  result := 'evaluado';

  INSERT INTO alert_scan_state (table_name, last_scanned_week, last_scanned_at)
  VALUES (v_scan_key, v_max_week, NOW())
  ON CONFLICT (table_name) DO UPDATE SET
    last_scanned_week = EXCLUDED.last_scanned_week,
    last_scanned_at   = EXCLUDED.last_scanned_at;

  RETURN NEXT;
END;
$$;

-- 10c. Scanner mensual
CREATE OR REPLACE FUNCTION fn_scan_anomalia_mensual()
RETURNS TABLE(year_scanned INTEGER, month_scanned INTEGER, result TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  v_max_year     INTEGER;
  v_max_month    INTEGER;
  v_last_encoded INTEGER;
  v_cur_encoded  INTEGER;
  v_scan_key     TEXT := 'anomalia_mensual';
BEGIN
  SELECT anio, mes INTO v_max_year, v_max_month
  FROM lecturas_mensuales_agua_consumo ORDER BY anio DESC, mes DESC LIMIT 1;

  IF v_max_year IS NULL THEN
    year_scanned := 0;
    month_scanned := 0;
    result := 'sin datos en lecturas_mensuales_agua_consumo';
    RETURN NEXT;
    RETURN;
  END IF;

  v_cur_encoded := v_max_year * 100 + v_max_month;

  SELECT last_scanned_week INTO v_last_encoded FROM alert_scan_state WHERE table_name = v_scan_key;
  IF v_last_encoded IS NULL THEN v_last_encoded := 0; END IF;

  IF v_cur_encoded <= v_last_encoded THEN
    year_scanned := v_max_year;
    month_scanned := v_max_month;
    result := 'sin cambios';
    RETURN NEXT;
    RETURN;
  END IF;

  PERFORM fn_evaluate_anomaly_monthly(v_max_year, v_max_month);
  year_scanned := v_max_year;
  month_scanned := v_max_month;
  result := 'evaluado';

  INSERT INTO alert_scan_state (table_name, last_scanned_week, last_scanned_at)
  VALUES (v_scan_key, v_cur_encoded, NOW())
  ON CONFLICT (table_name) DO UPDATE SET
    last_scanned_week = EXCLUDED.last_scanned_week,
    last_scanned_at   = EXCLUDED.last_scanned_at;

  RETURN NEXT;
END;
$$;

-- 10d. Programar cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule('scan_anomalia_diario',  '0 */6 * * *', $$SELECT * FROM fn_scan_anomalia_diario()$$);
SELECT cron.schedule('scan_anomalia_semanal', '0 */6 * * *', $$SELECT * FROM fn_scan_anomalia_semanal()$$);
SELECT cron.schedule('scan_anomalia_mensual', '0 */6 * * *', $$SELECT * FROM fn_scan_anomalia_mensual()$$);

-- Ejecución inmediata para regenerar alertas de la última lectura disponible
SELECT * FROM fn_scan_anomalia_diario();
SELECT * FROM fn_scan_anomalia_semanal();
SELECT * FROM fn_scan_anomalia_mensual();