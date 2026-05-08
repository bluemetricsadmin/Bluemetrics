-- ============================================================
-- Migración: Alertas de Posible Fuga — SEMANAL
-- Fecha: 2026-05-07
--
-- Requisito previo:
--   - supabase_well_events_alerts_migration.sql (columnas alert_week, alert_year, etc.)
--   - supabase_realtime_alerts_migration.sql (tablas well_config, alert_scan_state)
--
-- Contenido:
--   0. Limpieza idempotente
--   1. Cambios de esquema compartidos (idempotentes)
--   2. Índice único para deduplicación semanal
--   3. Helper fn_get_week_consumption()
--   4. Helper fn_check_weekly_leak_rules()
--   5. fn_evaluate_leak_alerts_weekly()
--   6. fn_leak_trigger_weekly()
--   7. fn_attach_leak_triggers_weekly()
--   8. Actualizar fn_auto_attach_consumption_trigger para fugas
--   9. fn_scan_fuga_semanal() + pg_cron
-- ============================================================


-- ============================================================
-- 0. LIMPIEZA IDEMPOTENTE
-- Permite re-ejecutar la migración sin conflictos.
-- ============================================================

-- 0a. Desprogramar job pg_cron
DO $$
BEGIN
  PERFORM cron.unschedule('scan_fuga_alerts_semanal');
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$$;

-- 0b. Eliminar triggers de fuga semanal en TODAS las tablas de consumo
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
      'DROP TRIGGER IF EXISTS trg_fuga_%s ON %I',
      RIGHT(v_table.tname, 4), v_table.tname
    );
  END LOOP;
END;
$$;

-- 0c. Eliminar funciones propias de esta migración
DROP FUNCTION IF EXISTS fn_scan_fuga_semanal();
DROP FUNCTION IF EXISTS fn_attach_leak_triggers_weekly();
DROP FUNCTION IF EXISTS fn_leak_trigger_weekly();
DROP FUNCTION IF EXISTS fn_evaluate_leak_alerts_weekly(INTEGER, TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS fn_evaluate_leak_alerts_weekly(TEXT, TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS fn_check_weekly_leak_rules(TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS fn_get_week_consumption(TEXT, INTEGER, INTEGER);

-- 0d. Eliminar índice de deduplicación semanal
DROP INDEX IF EXISTS idx_well_events_fuga_weekly;


-- ============================================================
-- 1. CAMBIOS DE ESQUEMA COMPARTIDOS (idempotentes)
-- También incluidos en las migraciones mensual y diaria.
-- ============================================================

-- 1a. Añadir 'posible_fuga' al CHECK de event_type
ALTER TABLE well_events DROP CONSTRAINT IF EXISTS well_events_event_type_check;
ALTER TABLE well_events ADD CONSTRAINT well_events_event_type_check
  CHECK (event_type IN (
    'mantenimiento', 'parado', 'reparacion', 'inspeccion', 'otro',
    'alerta_consumo', 'sobreconsumo', 'posible_fuga'
  ));

-- 1b. Columna alert_month (para alertas mensuales — declarada aquí para idempotencia)
ALTER TABLE well_events ADD COLUMN IF NOT EXISTS alert_month INTEGER DEFAULT NULL;

-- 1c. Columna alert_granularity (distingue weekly / monthly / daily)
ALTER TABLE well_events ADD COLUMN IF NOT EXISTS alert_granularity TEXT DEFAULT NULL
  CHECK (alert_granularity IN ('weekly', 'monthly', 'daily'));

-- 1d. Columna daily_column_name en well_config
ALTER TABLE well_config ADD COLUMN IF NOT EXISTS daily_column_name TEXT DEFAULT NULL;

-- 1e. Actualizar mapeo de columnas diarias para cada pozo
UPDATE well_config SET daily_column_name = 'pozo11'   WHERE well_id = 11;
UPDATE well_config SET daily_column_name = 'pozo_12'  WHERE well_id = 12;
UPDATE well_config SET daily_column_name = 'pozo_3'   WHERE well_id = 3;
UPDATE well_config SET daily_column_name = 'pozo7'    WHERE well_id = 7;
UPDATE well_config SET daily_column_name = 'pozo_14'  WHERE well_id = 14;
UPDATE well_config SET daily_column_name = 'pozo_4'   WHERE well_id = 4;
UPDATE well_config SET daily_column_name = 'pozo_8'   WHERE well_id = 8;
UPDATE well_config SET daily_column_name = 'pozo_15'  WHERE well_id = 15;

-- 1f. well_id nullable en well_events (soporta medidores no registrados en well_config)
ALTER TABLE well_events ALTER COLUMN well_id DROP NOT NULL;

-- 1g. Columna meter_column: identifica el medidor fuente de la alerta
ALTER TABLE well_events ADD COLUMN IF NOT EXISTS meter_column TEXT DEFAULT NULL;


-- ============================================================
-- 2. ÍNDICE ÚNICO PARCIAL PARA DEDUPLICACIÓN SEMANAL
-- Una sola alerta de posible_fuga por (pozo, semana, año).
-- ============================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_well_events_fuga_weekly
  ON well_events (meter_column, alert_week, alert_year)
  WHERE is_automatic = true
    AND event_type = 'posible_fuga'
    AND alert_granularity = 'weekly';


-- ============================================================
-- 3. HELPER: fn_get_week_consumption()
-- Retorna el consumo de un pozo en una semana específica.
-- Maneja cruce de año (p_week < 1 → busca en año anterior).
-- Retorna NULL si la tabla no existe o no hay datos.
-- ============================================================
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
  -- Manejar semana 0 o negativa → última semana del año anterior
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
    v_week := COALESCE(v_max_week, 52) + v_week; -- p_week=-1 → max_week-1, p_week=0 → max_week
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
-- 4. HELPER: fn_check_weekly_leak_rules()
-- Evalúa las 5 reglas de fuga para una semana específica.
-- Retorna TRUE si al menos 1 regla supera el umbral del 30%.
-- No inserta nada — solo evalúa (permite uso en chequeo consecutivo).
-- ============================================================
CREATE OR REPLACE FUNCTION fn_check_weekly_leak_rules(
  p_column TEXT,
  p_year   INTEGER,
  p_week   INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_table          TEXT;
  v_current_val    DECIMAL;
  v_reference      DECIMAL;
  v_moving_avg     DECIMAL;
  v_prev_week_val  DECIMAL;
  v_year_peak      DECIMAL;
  v_same_wk_prev_yr DECIMAL;
  v_multi_yr_avg   DECIMAL;
  v_violations     INTEGER := 0;
  v_yr             INTEGER;
  v_available_yrs  INTEGER := 0;
  v_yr_sum         DECIMAL := 0;
  v_yr_val         DECIMAL;
  v_moving_sum     DECIMAL := 0;
  v_moving_count   INTEGER := 0;
  i                INTEGER;
BEGIN
  v_table := 'lecturas_semana_agua_consumo_' || p_year;

  -- Verificar que existe la tabla
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = v_table AND table_type = 'BASE TABLE'
  ) THEN
    RETURN FALSE;
  END IF;

  -- Obtener consumo actual
  EXECUTE format(
    'SELECT COALESCE(%I, 0) FROM %I WHERE l_numero_semana = %s LIMIT 1',
    p_column, v_table, p_week
  ) INTO v_current_val;

  -- Sin datos para la semana actual → no hay violación
  IF v_current_val IS NULL OR v_current_val = 0 THEN
    RETURN FALSE;
  END IF;

  -- -------------------------------------------------------
  -- Regla 1: vs promedio móvil de las 10 semanas anteriores
  -- -------------------------------------------------------
  FOR i IN 1..10 LOOP
    v_yr_val := fn_get_week_consumption(p_column, p_year, p_week - i);
    IF v_yr_val IS NOT NULL AND v_yr_val > 0 THEN
      v_moving_sum   := v_moving_sum + v_yr_val;
      v_moving_count := v_moving_count + 1;
    END IF;
  END LOOP;

  IF v_moving_count >= 3 THEN
    v_moving_avg := v_moving_sum / v_moving_count;
    IF v_moving_avg > 0 AND v_current_val > v_moving_avg * 1.30 THEN
      v_violations := v_violations + 1;
    END IF;
  END IF;

  -- -------------------------------------------------------
  -- Regla 2: vs semana anterior
  -- -------------------------------------------------------
  v_prev_week_val := fn_get_week_consumption(p_column, p_year, p_week - 1);
  IF v_prev_week_val IS NOT NULL AND v_prev_week_val > 0 THEN
    IF v_current_val > v_prev_week_val * 1.30 THEN
      v_violations := v_violations + 1;
    END IF;
  END IF;

  -- -------------------------------------------------------
  -- Regla 3: vs pico más grande del año
  -- -------------------------------------------------------
  EXECUTE format(
    'SELECT COALESCE(MAX(%I), 0) FROM %I WHERE l_numero_semana <> %s',
    p_column, v_table, p_week
  ) INTO v_year_peak;

  IF v_year_peak > 0 AND v_current_val > v_year_peak * 1.30 THEN
    v_violations := v_violations + 1;
  END IF;

  -- -------------------------------------------------------
  -- Regla 4: vs misma semana, año anterior
  -- -------------------------------------------------------
  v_same_wk_prev_yr := fn_get_week_consumption(p_column, p_year - 1, p_week);
  IF v_same_wk_prev_yr IS NOT NULL AND v_same_wk_prev_yr > 0 THEN
    IF v_current_val > v_same_wk_prev_yr * 1.30 THEN
      v_violations := v_violations + 1;
    END IF;
  END IF;

  -- -------------------------------------------------------
  -- Regla 5: vs misma semana, promedio de años anteriores
  -- -------------------------------------------------------
  v_yr := p_year - 1;
  WHILE v_yr >= p_year - 5 LOOP
    v_yr_val := fn_get_week_consumption(p_column, v_yr, p_week);
    IF v_yr_val IS NOT NULL AND v_yr_val > 0 THEN
      v_yr_sum       := v_yr_sum + v_yr_val;
      v_available_yrs := v_available_yrs + 1;
    END IF;
    v_yr := v_yr - 1;
  END LOOP;

  IF v_available_yrs >= 2 THEN
    v_multi_yr_avg := v_yr_sum / v_available_yrs;
    IF v_multi_yr_avg > 0 AND v_current_val > v_multi_yr_avg * 1.30 THEN
      v_violations := v_violations + 1;
    END IF;
  END IF;

  RETURN v_violations > 0;
END;
$$;


-- ============================================================
-- 5. fn_evaluate_leak_alerts_weekly()
-- Evalúa alertas de fuga para un pozo en una semana específica.
-- Solo inserta alerta si AMBAS semana N y semana N-1 tienen
-- al menos 1 regla disparada (chequeo consecutivo).
-- ============================================================
CREATE OR REPLACE FUNCTION fn_evaluate_leak_alerts_weekly(
  p_meter_label TEXT,
  p_column      TEXT,
  p_year        INTEGER,
  p_week        INTEGER
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_table          TEXT;
  v_current_val    DECIMAL;
  v_now            TIMESTAMP WITH TIME ZONE := NOW();
  -- Referencias para descripción
  v_moving_avg     DECIMAL;
  v_prev_week_val  DECIMAL;
  v_year_peak      DECIMAL;
  v_same_prev_yr   DECIMAL;
  v_multi_yr_avg   DECIMAL;
  -- Detección de reglas
  v_rules_fired    TEXT[] := '{}';
  v_moving_sum     DECIMAL := 0;
  v_moving_count   INTEGER := 0;
  v_yr_val         DECIMAL;
  v_yr             INTEGER;
  v_available_yrs  INTEGER := 0;
  v_yr_sum         DECIMAL := 0;
  i                INTEGER;
  v_title          TEXT;
  v_description    TEXT;
  v_recommendation TEXT;
BEGIN
  v_table := 'lecturas_semana_agua_consumo_' || p_year;

  -- Obtener consumo actual
  EXECUTE format(
    'SELECT COALESCE(%I, 0) FROM %I WHERE l_numero_semana = %s LIMIT 1',
    p_column, v_table, p_week
  ) INTO v_current_val;

  IF v_current_val IS NULL OR v_current_val = 0 THEN RETURN; END IF;

  -- -------------------------------------------------------
  -- Evaluar reglas para semana actual (con detalle para descripción)
  -- -------------------------------------------------------

  -- Regla 1: promedio móvil 10 semanas
  FOR i IN 1..10 LOOP
    v_yr_val := fn_get_week_consumption(p_column, p_year, p_week - i);
    IF v_yr_val IS NOT NULL AND v_yr_val > 0 THEN
      v_moving_sum   := v_moving_sum + v_yr_val;
      v_moving_count := v_moving_count + 1;
    END IF;
  END LOOP;
  IF v_moving_count >= 3 THEN
    v_moving_avg := v_moving_sum / v_moving_count;
    IF v_moving_avg > 0 AND v_current_val > v_moving_avg * 1.30 THEN
      v_rules_fired := array_append(v_rules_fired,
        format('promedio móvil 10 semanas (%s m³ vs %s m³ ref)',
          round(v_current_val, 2), round(v_moving_avg, 2)));
    END IF;
  END IF;

  -- Regla 2: semana anterior
  v_prev_week_val := fn_get_week_consumption(p_column, p_year, p_week - 1);
  IF v_prev_week_val IS NOT NULL AND v_prev_week_val > 0 THEN
    IF v_current_val > v_prev_week_val * 1.30 THEN
      v_rules_fired := array_append(v_rules_fired,
        format('semana anterior (%s m³ vs %s m³)',
          round(v_current_val, 2), round(v_prev_week_val, 2)));
    END IF;
  END IF;

  -- Regla 3: pico del año
  EXECUTE format(
    'SELECT COALESCE(MAX(%I), 0) FROM %I WHERE l_numero_semana <> %s',
    p_column, v_table, p_week
  ) INTO v_year_peak;
  IF v_year_peak > 0 AND v_current_val > v_year_peak * 1.30 THEN
    v_rules_fired := array_append(v_rules_fired,
      format('pico del año (%s m³ vs %s m³ pico)',
        round(v_current_val, 2), round(v_year_peak, 2)));
  END IF;

  -- Regla 4: misma semana año anterior
  v_same_prev_yr := fn_get_week_consumption(p_column, p_year - 1, p_week);
  IF v_same_prev_yr IS NOT NULL AND v_same_prev_yr > 0 THEN
    IF v_current_val > v_same_prev_yr * 1.30 THEN
      v_rules_fired := array_append(v_rules_fired,
        format('misma semana año anterior (%s m³ vs %s m³ en %s)',
          round(v_current_val, 2), round(v_same_prev_yr, 2), p_year - 1));
    END IF;
  END IF;

  -- Regla 5: promedio de años anteriores
  v_yr := p_year - 1;
  WHILE v_yr >= p_year - 5 LOOP
    v_yr_val := fn_get_week_consumption(p_column, v_yr, p_week);
    IF v_yr_val IS NOT NULL AND v_yr_val > 0 THEN
      v_yr_sum        := v_yr_sum + v_yr_val;
      v_available_yrs := v_available_yrs + 1;
    END IF;
    v_yr := v_yr - 1;
  END LOOP;
  IF v_available_yrs >= 2 THEN
    v_multi_yr_avg := v_yr_sum / v_available_yrs;
    IF v_multi_yr_avg > 0 AND v_current_val > v_multi_yr_avg * 1.30 THEN
      v_rules_fired := array_append(v_rules_fired,
        format('promedio histórico misma semana (%s m³ vs %s m³ promedio)',
          round(v_current_val, 2), round(v_multi_yr_avg, 2)));
    END IF;
  END IF;

  -- Sin violaciones → no hay alerta
  IF array_length(v_rules_fired, 1) IS NULL THEN RETURN; END IF;

  -- -------------------------------------------------------
  -- Chequeo consecutivo: semana N-1 también debe tener violaciones
  -- -------------------------------------------------------
  IF NOT fn_check_weekly_leak_rules(p_column, p_year, p_week - 1) THEN
    RETURN; -- El pico es aislado → no es fuga
  END IF;

  -- -------------------------------------------------------
  -- Insertar alerta consolidada (ON CONFLICT DO NOTHING dedup)
  -- -------------------------------------------------------
  v_title := format(
    'Posible fuga detectada — Semana %s/%s (%s m³)',
    p_week, p_year, round(v_current_val, 2)
  );

  v_description := format(
    'El consumo de la semana %s del año %s (%s m³) supera en más del 30%% el valor de referencia en %s regla(s) consecutiva(s): %s',
    p_week, p_year, round(v_current_val, 2),
    array_length(v_rules_fired, 1),
    array_to_string(v_rules_fired, '; ')
  );

  v_recommendation := 'Revisar físicamente el pozo y las líneas de distribución. Verificar si existe fuga, válvula abierta o medidor defectuoso. El incremento se detectó en 2 semanas consecutivas.';

  INSERT INTO well_events (
    well_id, meter_column, event_type, severity, is_automatic,
    title, description, recommendation,
    metric_value, threshold_value,
    alert_week, alert_year, alert_granularity,
    start_date, event_status, author_name
  ) VALUES (
    NULL, p_meter_label, 'posible_fuga', 'preventiva', true,
    v_title, v_description, v_recommendation,
    round(v_current_val, 2), 0,
    p_week, p_year, 'weekly',
    v_now, 'activo', 'Sistema Automático'
  )
  ON CONFLICT DO NOTHING;

END;
$$;


-- ============================================================
-- 6. FUNCIÓN TRIGGER: fn_leak_trigger_weekly()
-- Se ejecuta AFTER INSERT OR UPDATE en tablas semanales.
-- Itera todos los pozos de well_config y evalúa alertas de fuga.
-- ============================================================
CREATE OR REPLACE FUNCTION fn_leak_trigger_weekly()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_year      INTEGER;
  v_week      INTEGER;
  v_col_name  TEXT;
  v_row_json  JSONB;
  v_col_value DECIMAL;
BEGIN
  -- Extraer año del nombre de la tabla (ej: lecturas_semana_agua_consumo_2026 → 2026)
  v_year := CAST(RIGHT(TG_TABLE_NAME, 4) AS INTEGER);
  v_week := NEW.l_numero_semana;

  -- Convertir la fila NEW a JSON para acceso dinámico a columnas
  v_row_json := row_to_json(NEW)::JSONB;

  FOR v_col_name IN
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = TG_TABLE_NAME
      AND data_type    = 'numeric'
  LOOP
    v_col_value := COALESCE((v_row_json ->> v_col_name)::DECIMAL, 0);

    -- Solo evaluar si hay actividad en esta columna
    IF TG_OP = 'INSERT' OR (
      TG_OP = 'UPDATE' AND
      COALESCE((row_to_json(OLD)::JSONB ->> v_col_name)::DECIMAL, 0) <> v_col_value
    ) THEN
      PERFORM fn_evaluate_leak_alerts_weekly(v_col_name, v_col_name, v_year, v_week);
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;


-- ============================================================
-- 7. fn_attach_leak_triggers_weekly()
-- Escanea todas las tablas de consumo semanal y adjunta
-- el trigger de fuga (trg_fuga_{year}) a las que no lo tienen.
-- ============================================================
CREATE OR REPLACE FUNCTION fn_attach_leak_triggers_weekly()
RETURNS TABLE(table_name TEXT, action TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  v_table        RECORD;
  v_trigger_name TEXT;
  v_trigger_exists BOOLEAN;
  v_year_suffix  TEXT;
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
    v_trigger_name := 'trg_fuga_' || v_year_suffix;

    SELECT EXISTS(
      SELECT 1 FROM information_schema.triggers tr
      WHERE tr.trigger_name = v_trigger_name
        AND tr.event_object_table = v_table.tname
        AND tr.event_object_schema = 'public'
    ) INTO v_trigger_exists;

    IF v_trigger_exists THEN
      table_name := v_table.tname;
      action     := 'ya existe';
      RETURN NEXT;
    ELSE
      EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', v_trigger_name, v_table.tname);
      EXECUTE format(
        'CREATE TRIGGER %I
           AFTER INSERT OR UPDATE ON %I
           FOR EACH ROW
           EXECUTE FUNCTION fn_leak_trigger_weekly()',
        v_trigger_name, v_table.tname
      );
      table_name := v_table.tname;
      action     := 'trigger fuga creado';
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$;


-- ============================================================
-- 8. ACTUALIZAR EVENT TRIGGER DDL
-- fn_auto_attach_consumption_trigger ya existe (creada en
-- supabase_realtime_alerts_migration.sql). Se reemplaza con
-- CREATE OR REPLACE para agregar el trigger de fuga semanal
-- al mismo tiempo que se crea una tabla nueva.
-- ============================================================
CREATE OR REPLACE FUNCTION fn_auto_attach_consumption_trigger()
RETURNS event_trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_obj          RECORD;
  v_table_name   TEXT;
  v_year_suffix  TEXT;
  v_trig_over    TEXT;  -- trigger de sobreconsumo
  v_trig_fuga    TEXT;  -- trigger de fuga
BEGIN
  FOR v_obj IN SELECT * FROM pg_event_trigger_ddl_commands() LOOP
    IF v_obj.object_type = 'table' THEN
      v_table_name := split_part(v_obj.object_identity, '.', 2);

      IF v_table_name LIKE 'lecturas_semana_agua_consumo_%' THEN
        v_year_suffix := RIGHT(v_table_name, 4);
        v_trig_over   := 'trg_alert_consumo_' || v_year_suffix;
        v_trig_fuga   := 'trg_fuga_' || v_year_suffix;

        -- Trigger de sobreconsumo (existente)
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', v_trig_over, v_table_name);
        EXECUTE format(
          'CREATE TRIGGER %I
             AFTER INSERT OR UPDATE ON %I
             FOR EACH ROW
             EXECUTE FUNCTION fn_consumption_alert_trigger()',
          v_trig_over, v_table_name
        );

        -- Trigger de fuga (nuevo)
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', v_trig_fuga, v_table_name);
        EXECUTE format(
          'CREATE TRIGGER %I
             AFTER INSERT OR UPDATE ON %I
             FOR EACH ROW
             EXECUTE FUNCTION fn_leak_trigger_weekly()',
          v_trig_fuga, v_table_name
        );

        RAISE NOTICE 'Triggers (sobreconsumo + fuga) auto-adjuntados a tabla: %', v_table_name;
      END IF;
    END IF;
  END LOOP;
END;
$$;


-- ============================================================
-- 9. SCANNER + PG_CRON
-- Evalúa solo el año actual y solo si hay semanas nuevas.
-- Reutiliza alert_scan_state con key 'fuga_semanal_{year}'.
-- ============================================================

CREATE OR REPLACE FUNCTION fn_scan_fuga_semanal()
RETURNS TABLE(well_name TEXT, year_scanned INTEGER, week_scanned INTEGER, result TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_year  INTEGER;
  v_table_name    TEXT;
  v_max_week      INTEGER;
  v_last_week     INTEGER;
  v_scan_key      TEXT;
  v_well          RECORD;
BEGIN
  v_current_year := EXTRACT(YEAR FROM NOW());
  v_table_name   := 'lecturas_semana_agua_consumo_' || v_current_year;
  v_scan_key     := 'fuga_semanal_' || v_current_year;

  -- Verificar que la tabla existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = v_table_name
      AND table_type = 'BASE TABLE'
  ) THEN
    well_name    := 'N/A';
    year_scanned := v_current_year;
    week_scanned := 0;
    result       := 'tabla ' || v_table_name || ' no existe';
    RETURN NEXT;
    RETURN;
  END IF;

  -- Semana más reciente con datos
  EXECUTE format(
    'SELECT MAX(l_numero_semana) FROM %I WHERE l_numero_semana IS NOT NULL',
    v_table_name
  ) INTO v_max_week;

  IF v_max_week IS NULL THEN
    well_name    := 'N/A';
    year_scanned := v_current_year;
    week_scanned := 0;
    result       := 'sin datos en ' || v_table_name;
    RETURN NEXT;
    RETURN;
  END IF;

  -- Última semana escaneada
  SELECT last_scanned_week INTO v_last_week
  FROM alert_scan_state
  WHERE alert_scan_state.table_name = v_scan_key;

  IF v_last_week IS NULL THEN v_last_week := 0; END IF;

  IF v_max_week <= v_last_week THEN
    well_name    := 'N/A';
    year_scanned := v_current_year;
    week_scanned := v_max_week;
    result       := 'sin cambios (última semana escaneada: ' || v_last_week || ')';
    RETURN NEXT;
    RETURN;
  END IF;

  -- Evaluar cada columna numérica del esquema semanal
  FOR v_well IN
    SELECT column_name AS name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = v_table_name
      AND data_type    = 'numeric'
  LOOP
    BEGIN
      PERFORM fn_evaluate_leak_alerts_weekly(
        v_well.name, v_well.name, v_current_year, v_max_week
      );
      well_name    := v_well.name;
      year_scanned := v_current_year;
      week_scanned := v_max_week;
      result       := 'evaluado';
      RETURN NEXT;
    EXCEPTION WHEN OTHERS THEN
      well_name    := v_well.name;
      year_scanned := v_current_year;
      week_scanned := v_max_week;
      result       := 'error: ' || SQLERRM;
      RETURN NEXT;
    END;
  END LOOP;

  -- Actualizar estado del escaneo
  INSERT INTO alert_scan_state (table_name, last_scanned_week, last_scanned_at)
  VALUES (v_scan_key, v_max_week, NOW())
  ON CONFLICT (table_name) DO UPDATE SET
    last_scanned_week = EXCLUDED.last_scanned_week,
    last_scanned_at   = EXCLUDED.last_scanned_at;
END;
$$;

-- Habilitar pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Registrar job (limpiar previo si existe)
SELECT cron.unschedule('scan_fuga_alerts_semanal')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'scan_fuga_alerts_semanal');

SELECT cron.schedule(
  'scan_fuga_alerts_semanal',
  '0 */6 * * *',
  $$SELECT * FROM fn_scan_fuga_semanal()$$
);

-- Ejecución inicial: adjuntar triggers a todas las tablas existentes
SELECT * FROM fn_attach_leak_triggers_weekly();
