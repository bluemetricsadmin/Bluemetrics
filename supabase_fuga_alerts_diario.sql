-- ============================================================
-- Migración: Alertas de Posible Fuga — DIARIO
-- Fecha: 2026-05-07
--
-- Requisito previo:
--   - supabase_well_events_alerts_migration.sql
--   - supabase_realtime_alerts_migration.sql (well_config, alert_scan_state)
--   - supabase_fuga_alerts_semanal.sql (cambios de esquema compartidos)
--
-- Tabla objetivo: lecturas_diarias_consumo
--
-- Formato de datos relevante:
--   dia_hora : "Lun01 09:00"  (3-letter day abbrev + 2-digit day + space + HH:MM)
--   mes      : "mayo"         (lowercase español)
--   anio     : "2026"         (VARCHAR)
--   mes_anio : "mayo 2026"
--
-- Mapeo de columnas de pozos en lecturas_diarias_consumo:
--   well_id 11 → pozo11    | well_id 12 → pozo_12
--   well_id  3 → pozo_3    | well_id  7 → pozo7
--   well_id 14 → pozo_14   | well_id  4 → pozo_4
--   well_id  8 → pozo_8    | well_id 15 → pozo_15
--
-- Contenido:
--   0. Limpieza idempotente
--   1. Cambios de esquema compartidos (idempotentes)
--   2. Índice único para deduplicación diaria
--   3. fn_evaluate_leak_alerts_daily()
--   4. fn_leak_trigger_daily()
--   5. Trigger en lecturas_diarias_consumo
--   6. fn_scan_fuga_diario() + pg_cron
-- ============================================================


-- ============================================================
-- 0. LIMPIEZA IDEMPOTENTE
-- ============================================================

-- 0a. Desprogramar job pg_cron
DO $$
BEGIN
  PERFORM cron.unschedule('scan_fuga_alerts_diario');
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$$;

-- 0b. Eliminar trigger diario
DROP TRIGGER IF EXISTS trg_fuga_leak_daily ON lecturas_diarias_consumo;

-- 0c. Eliminar funciones propias
DROP FUNCTION IF EXISTS fn_scan_fuga_diario();
DROP FUNCTION IF EXISTS fn_leak_trigger_daily();
DROP FUNCTION IF EXISTS fn_evaluate_leak_alerts_daily(INTEGER, TEXT, TEXT, TEXT, BIGINT);
DROP FUNCTION IF EXISTS fn_evaluate_leak_alerts_daily(TEXT, TEXT, TEXT, TEXT, BIGINT);

-- 0d. Eliminar índice de deduplicación diaria
DROP INDEX IF EXISTS idx_well_events_fuga_daily;


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

-- 1b2. Columna alert_date (fecha calendario — evita cast en índice)
ALTER TABLE well_events ADD COLUMN IF NOT EXISTS alert_date DATE DEFAULT NULL;

-- 1c. well_id nullable en well_events (soporta medidores no registrados en well_config)
ALTER TABLE well_events ALTER COLUMN well_id DROP NOT NULL;

-- 1d. Columna meter_column: identifica el medidor fuente de la alerta
ALTER TABLE well_events ADD COLUMN IF NOT EXISTS meter_column TEXT DEFAULT NULL;


-- ============================================================
-- 2. ÍNDICE ÚNICO PARCIAL PARA DEDUPLICACIÓN DIARIA
-- Una sola alerta de posible_fuga por (pozo, fecha calendario).
-- Usa start_date::date para agrupar por día independientemente
-- de la hora exacta en que se generó la alerta.
-- ============================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_well_events_fuga_daily
  ON well_events (meter_column, alert_date)
  WHERE is_automatic = true
    AND event_type = 'posible_fuga'
    AND alert_granularity = 'daily';


-- ============================================================
-- 3. fn_evaluate_leak_alerts_daily()
-- Evalúa las 4 reglas de fuga para un pozo en una lectura
-- diaria específica. No requiere chequeo consecutivo.
--
-- Parámetros:
--   p_well_id    : ID del pozo (de well_config)
--   p_daily_col  : nombre de columna en lecturas_diarias_consumo (ej: 'pozo11')
--   p_mes_anio   : "mayo 2026"
--   p_dia_hora   : "Lun01 09:00"
--   p_row_id     : id de la fila actual (para limitar lookbacks por orden de inserción)
-- ============================================================
CREATE OR REPLACE FUNCTION fn_evaluate_leak_alerts_daily(
  p_meter_label TEXT,
  p_daily_col   TEXT,
  p_mes_anio    TEXT,
  p_dia_hora    TEXT,
  p_row_id      BIGINT
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_now            TIMESTAMP WITH TIME ZONE := NOW();
  v_current_val    DECIMAL;
  v_current_mes    TEXT;
  v_current_anio   INTEGER;
  v_day_num        INTEGER;
  v_hour_part      TEXT;
  -- Reglas
  v_moving_avg     DECIMAL;
  v_moving_sum     DECIMAL := 0;
  v_moving_count   INTEGER := 0;
  v_prev_val       DECIMAL;
  v_prev_yr_val    DECIMAL;
  v_rules_fired    TEXT[] := '{}';
  -- Flags AND: las tres reglas deben cumplirse simultáneamente
  v_rule1_ok       BOOLEAN := FALSE;
  v_rule2_ok       BOOLEAN := FALSE;
  v_rule3_ok       BOOLEAN := FALSE;
  -- Para "mismo día semana anterior"
  v_prev_week_day  INTEGER;
  v_prev_week_mes  TEXT;
  v_prev_week_anio INTEGER;
  v_target_date    DATE;
  v_prev_date      DATE;
  v_mes_num        INTEGER;
  -- Mapeo mes → número
  v_mes_map        TEXT[][] := ARRAY[
    ARRAY['enero','1'], ARRAY['febrero','2'], ARRAY['marzo','3'],
    ARRAY['abril','4'], ARRAY['mayo','5'], ARRAY['junio','6'],
    ARRAY['julio','7'], ARRAY['agosto','8'], ARRAY['septiembre','9'],
    ARRAY['octubre','10'], ARRAY['noviembre','11'], ARRAY['diciembre','12']
  ];
  v_mes_inv_map    TEXT[][] := ARRAY[
    ARRAY['1','enero'], ARRAY['2','febrero'], ARRAY['3','marzo'],
    ARRAY['4','abril'], ARRAY['5','mayo'], ARRAY['6','junio'],
    ARRAY['7','julio'], ARRAY['8','agosto'], ARRAY['9','septiembre'],
    ARRAY['10','octubre'], ARRAY['11','noviembre'], ARRAY['12','diciembre']
  ];
  k                INTEGER;
  v_title          TEXT;
  v_description    TEXT;
  v_recommendation TEXT;
BEGIN
  -- -------------------------------------------------------
  -- Parsear mes_anio y dia_hora
  -- -------------------------------------------------------
  v_current_mes  := SPLIT_PART(p_mes_anio, ' ', 1);                    -- "mayo"
  v_current_anio := CAST(SPLIT_PART(p_mes_anio, ' ', 2) AS INTEGER);   -- 2026
  v_day_num      := CAST(SUBSTRING(p_dia_hora FROM 4 FOR 2) AS INTEGER); -- 01..31
  v_hour_part    := SUBSTRING(p_dia_hora FROM 7);                        -- "09:00"

  -- Convertir mes español → número
  v_mes_num := NULL;
  FOR k IN 1..12 LOOP
    IF v_mes_map[k][1] = v_current_mes THEN
      v_mes_num := CAST(v_mes_map[k][2] AS INTEGER);
    END IF;
  END LOOP;
  IF v_mes_num IS NULL THEN RETURN; END IF; -- mes no reconocido

  -- Obtener consumo de la fila actual
  EXECUTE format(
    'SELECT COALESCE(%I, 0) FROM lecturas_diarias_consumo WHERE id = %s LIMIT 1',
    p_daily_col, p_row_id
  ) INTO v_current_val;

  IF v_current_val IS NULL OR v_current_val = 0 THEN RETURN; END IF;

  -- -------------------------------------------------------
  -- Regla 1: vs promedio móvil de las 10 lecturas anteriores
  -- (ordenadas por id, mismo pozo, sin importar el día)
  -- -------------------------------------------------------
  EXECUTE format(
    'SELECT COALESCE(AVG(%I), 0), COUNT(*) FROM (
       SELECT %I FROM lecturas_diarias_consumo
       WHERE id < %s AND %I > 0
       ORDER BY id DESC
       LIMIT 10
     ) t',
    p_daily_col, p_daily_col, p_row_id, p_daily_col
  ) INTO v_moving_avg, v_moving_count;

  IF v_moving_count >= 3 AND v_moving_avg > 0 THEN
    IF v_current_val > v_moving_avg * 1.30 THEN
      v_rule1_ok := TRUE;
      v_rules_fired := array_append(v_rules_fired,
        format('promedio móvil 10 días (%s m³ vs %s m³ ref)',
          round(v_current_val, 2), round(v_moving_avg, 2)));
    END IF;
  END IF;

  -- -------------------------------------------------------
  -- Regla 2: vs mismo día de la semana anterior
  -- Se construye la fecha real y se busca por day_num en mes_anio correspondiente
  -- -------------------------------------------------------
  BEGIN
    v_target_date := make_date(v_current_anio, v_mes_num, v_day_num);
    v_prev_date   := v_target_date - INTERVAL '7 days';

    v_prev_week_day  := EXTRACT(DAY FROM v_prev_date)::INTEGER;
    v_prev_week_anio := EXTRACT(YEAR FROM v_prev_date)::INTEGER;

    -- Convertir número de mes → nombre español
    v_prev_week_mes := NULL;
    FOR k IN 1..12 LOOP
      IF CAST(v_mes_inv_map[k][1] AS INTEGER) = EXTRACT(MONTH FROM v_prev_date)::INTEGER THEN
        v_prev_week_mes := v_mes_inv_map[k][2];
      END IF;
    END LOOP;

    IF v_prev_week_mes IS NOT NULL THEN
      -- Buscar registro con mismo día y hora en la semana anterior
      -- dia_hora tiene formato "Lun01 09:00" — buscamos por day_num (posición 4-5) y hour_part
      EXECUTE format(
        'SELECT COALESCE(%I, 0) FROM lecturas_diarias_consumo
         WHERE mes_anio = %L
           AND SUBSTRING(dia_hora FROM 4 FOR 2) = %L
           AND SUBSTRING(dia_hora FROM 7) = %L
         ORDER BY id DESC LIMIT 1',
        p_daily_col,
        v_prev_week_mes || ' ' || v_prev_week_anio,
        lpad(v_prev_week_day::TEXT, 2, '0'),
        v_hour_part
      ) INTO v_prev_val;

      IF v_prev_val IS NOT NULL AND v_prev_val > 0 THEN
        IF v_current_val > v_prev_val * 1.30 THEN
          v_rule2_ok := TRUE;
          v_rules_fired := array_append(v_rules_fired,
            format('mismo día semana anterior (%s m³ vs %s m³)',
              round(v_current_val, 2), round(v_prev_val, 2)));
        END IF;
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL; -- Fecha inválida (ej: día 30 en febrero) → saltar regla
  END;

  -- -------------------------------------------------------
  -- Regla 3: vs mismo día, año anterior
  -- -------------------------------------------------------
  EXECUTE format(
    'SELECT COALESCE(%I, 0) FROM lecturas_diarias_consumo
     WHERE mes = %L
       AND anio = %L
       AND SUBSTRING(dia_hora FROM 4 FOR 2) = %L
       AND SUBSTRING(dia_hora FROM 7) = %L
     ORDER BY id DESC LIMIT 1',
    p_daily_col,
    v_current_mes,
    (v_current_anio - 1)::TEXT,
    lpad(v_day_num::TEXT, 2, '0'),
    v_hour_part
  ) INTO v_prev_yr_val;

  IF v_prev_yr_val IS NOT NULL AND v_prev_yr_val > 0 THEN
    IF v_current_val > v_prev_yr_val * 1.30 THEN
      v_rule3_ok := TRUE;
      v_rules_fired := array_append(v_rules_fired,
        format('mismo día año anterior (%s m³ vs %s m³ en %s)',
          round(v_current_val, 2), round(v_prev_yr_val, 2), v_current_anio - 1));
    END IF;
  END IF;

  -- Las tres reglas deben cumplirse simultáneamente (condición AND)
  IF NOT (v_rule1_ok AND v_rule2_ok AND v_rule3_ok) THEN RETURN; END IF;

  -- -------------------------------------------------------
  -- Insertar alerta consolidada (sin chequeo consecutivo en diarias)
  -- -------------------------------------------------------
  v_title := format(
    'Posible fuga detectada — %s %s (%s m³)',
    p_dia_hora, p_mes_anio, round(v_current_val, 2)
  );

  v_description := format(
    'El consumo diario del %s de %s (%s m³) supera en más del 30%% el valor de referencia en las 3 reglas simultáneas: %s',
    p_dia_hora, p_mes_anio, round(v_current_val, 2),
    array_to_string(v_rules_fired, '; ')
  );

  v_recommendation := 'Revisar físicamente el pozo y las líneas de distribución en el período reportado. Verificar si existe fuga, válvula abierta o medidor defectuoso.';

  INSERT INTO well_events (
    well_id, meter_column, event_type, severity, is_automatic,
    title, description, recommendation,
    metric_value, threshold_value,
    alert_granularity,
    start_date, event_status, author_name
  ) VALUES (
    NULL, p_meter_label, 'posible_fuga', 'preventiva', true,
    v_title, v_description, v_recommendation,
    round(v_current_val, 2), 0,
    'daily',
    v_now, 'activo', 'Sistema Automático'
  )
  ON CONFLICT DO NOTHING;

END;
$$;


-- ============================================================
-- 4. FUNCIÓN TRIGGER: fn_leak_trigger_daily()
-- Se ejecuta AFTER INSERT OR UPDATE en lecturas_diarias_consumo.
-- ============================================================
CREATE OR REPLACE FUNCTION fn_leak_trigger_daily()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_col_name  TEXT;
  v_row_json  JSONB;
  v_col_value DECIMAL;
  v_old_value DECIMAL;
BEGIN
  v_row_json := row_to_json(NEW)::JSONB;

  FOR v_col_name IN
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'lecturas_diarias_consumo'
      AND data_type    = 'numeric'
  LOOP
    v_col_value := COALESCE((v_row_json ->> v_col_name)::DECIMAL, 0);
    v_old_value := CASE WHEN TG_OP = 'UPDATE'
                        THEN COALESCE((row_to_json(OLD)::JSONB ->> v_col_name)::DECIMAL, 0)
                        ELSE -1 -- INSERT: forzar evaluación
                   END;

    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND v_old_value <> v_col_value) THEN
      PERFORM fn_evaluate_leak_alerts_daily(
        v_col_name,
        v_col_name,
        NEW.mes_anio,
        NEW.dia_hora,
        NEW.id
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;


-- ============================================================
-- 5. ADJUNTAR TRIGGER A lecturas_diarias_consumo
-- ============================================================
DROP TRIGGER IF EXISTS trg_fuga_leak_daily ON lecturas_diarias_consumo;

CREATE TRIGGER trg_fuga_leak_daily
  AFTER INSERT OR UPDATE ON lecturas_diarias_consumo
  FOR EACH ROW
  EXECUTE FUNCTION fn_leak_trigger_daily();


-- ============================================================
-- 6. SCANNER + PG_CRON
-- Evalúa la última lectura diaria disponible, solo si el id
-- más reciente es mayor al último escaneado.
-- Usa alert_scan_state con key 'fuga_diario'.
-- ============================================================
CREATE OR REPLACE FUNCTION fn_scan_fuga_diario()
RETURNS TABLE(well_name TEXT, row_id_scanned BIGINT, mes_anio_scanned TEXT, result TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  v_max_id       BIGINT;
  v_last_id      BIGINT;
  v_scan_key     TEXT := 'fuga_diario';
  v_mes_anio     TEXT;
  v_dia_hora     TEXT;
  v_well         RECORD;
BEGIN
  -- Última lectura disponible
  SELECT id, mes_anio, dia_hora
  INTO v_max_id, v_mes_anio, v_dia_hora
  FROM lecturas_diarias_consumo
  ORDER BY id DESC
  LIMIT 1;

  IF v_max_id IS NULL THEN
    well_name        := 'N/A';
    row_id_scanned   := 0;
    mes_anio_scanned := 'N/A';
    result           := 'sin datos en lecturas_diarias_consumo';
    RETURN NEXT;
    RETURN;
  END IF;

  -- Último id escaneado (almacenado como last_scanned_week BIGINT compatible)
  SELECT last_scanned_week INTO v_last_id
  FROM alert_scan_state
  WHERE alert_scan_state.table_name = v_scan_key;

  IF v_last_id IS NULL THEN v_last_id := 0; END IF;

  IF v_max_id <= v_last_id THEN
    well_name        := 'N/A';
    row_id_scanned   := v_max_id;
    mes_anio_scanned := v_mes_anio;
    result           := 'sin cambios (último id escaneado: ' || v_last_id || ')';
    RETURN NEXT;
    RETURN;
  END IF;

  -- Evaluar cada columna numérica del esquema
  FOR v_well IN
    SELECT column_name AS name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'lecturas_diarias_consumo'
      AND data_type    = 'numeric'
  LOOP
    BEGIN
      PERFORM fn_evaluate_leak_alerts_daily(
        v_well.name,
        v_well.name,
        v_mes_anio,
        v_dia_hora,
        v_max_id
      );
      well_name        := v_well.name;
      row_id_scanned   := v_max_id;
      mes_anio_scanned := v_mes_anio;
      result           := 'evaluado';
      RETURN NEXT;
    EXCEPTION WHEN OTHERS THEN
      well_name        := v_well.name;
      row_id_scanned   := v_max_id;
      mes_anio_scanned := v_mes_anio;
      result           := 'error: ' || SQLERRM;
      RETURN NEXT;
    END;
  END LOOP;

  -- Actualizar estado del escaneo
  INSERT INTO alert_scan_state (table_name, last_scanned_week, last_scanned_at)
  VALUES (v_scan_key, v_max_id::INTEGER, NOW())
  ON CONFLICT (table_name) DO UPDATE SET
    last_scanned_week = EXCLUDED.last_scanned_week,
    last_scanned_at   = EXCLUDED.last_scanned_at;
END;
$$;

-- Habilitar pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Registrar job
SELECT cron.unschedule('scan_fuga_alerts_diario')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'scan_fuga_alerts_diario');

SELECT cron.schedule(
  'scan_fuga_alerts_diario',
  '0 */6 * * *',
  $$SELECT * FROM fn_scan_fuga_diario()$$
);
