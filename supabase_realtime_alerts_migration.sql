-- ============================================================
-- Migración: Alertas en Tiempo Real (Trigger + Realtime)
-- Fecha: 2026-04-15
-- 
-- Contenido:
--   1. Tabla well_config (configuración de pozos)
--   2. Función fn_evaluate_well_alerts() (evaluación de reglas)
--   3. Función trigger fn_consumption_alert_trigger()
--   4. Sistema automático de triggers (auto-attach)
--   5. Habilitar Realtime en well_events
--   6. Escaneo automático programado (pg_cron)
-- ============================================================

-- ============================================================
-- 1. TABLA well_config
-- Almacena la configuración de cada pozo para que los triggers
-- puedan acceder a los límites anuales sin depender del frontend.
-- ============================================================
CREATE TABLE IF NOT EXISTS well_config (
  well_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  column_name TEXT NOT NULL,          -- nombre de columna en tablas de consumo (ej: 'l_pozo_11')
  service_type TEXT NOT NULL DEFAULT 'Servicios'
    CHECK (service_type IN ('Servicios', 'Riego')),
  m3_por_anexo DECIMAL(12, 2) NOT NULL DEFAULT 0,
  m3_cedidos DECIMAL(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger para updated_at (idempotente)
DROP TRIGGER IF EXISTS update_well_config_updated_at ON well_config;
CREATE TRIGGER update_well_config_updated_at
  BEFORE UPDATE ON well_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE well_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access on well_config" ON well_config;
CREATE POLICY "Allow public read access on well_config"
  ON well_config FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert access on well_config" ON well_config;
CREATE POLICY "Allow public insert access on well_config"
  ON well_config FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access on well_config" ON well_config;
CREATE POLICY "Allow public update access on well_config"
  ON well_config FOR UPDATE USING (true);

-- Insertar los 8 pozos con su configuración actual
INSERT INTO well_config (well_id, name, column_name, service_type, m3_por_anexo, m3_cedidos)
VALUES
  (11, 'Pozo 11', 'l_pozo_11',       'Servicios', 190229.00, 50000),
  (12, 'Pozo 12', 'l_pozo_12',       'Servicios',  90885.00, 20000),
  (3,  'Pozo 3',  'l_pozo_3',        'Servicios',   1148.00,     0),
  (7,  'Pozo 7',  'l_pozo_7',        'Servicios',  50000.00,     0),
  (14, 'Pozo 14', 'l_pozo_14',       'Servicios',  65885.00,     0),
  (4,  'Pozo 4',  'l_pozo_4_riego',  'Riego',      38000.00,     0),
  (8,  'Pozo 8',  'l_pozo_8_riego',  'Riego',      45885.00,     0),
  (15, 'Pozo 15', 'l_pozo_15_riego', 'Riego',      78000.00, 40000)
ON CONFLICT (well_id) DO UPDATE SET
  name = EXCLUDED.name,
  column_name = EXCLUDED.column_name,
  service_type = EXCLUDED.service_type,
  m3_por_anexo = EXCLUDED.m3_por_anexo,
  m3_cedidos = EXCLUDED.m3_cedidos;


-- ============================================================
-- 2. FUNCIÓN fn_evaluate_well_alerts()
-- Evalúa las 4 reglas de negocio para un pozo específico
-- y crea alertas automáticas en well_events.
--3HGBNJuQV63Azvj
-- Reglas:
--   R1: Incremento anormal (+30% vs promedio últimas 3 semanas)
--   R2: Caída fuerte (<-40% vs promedio últimas 3 semanas)
--   R3: Sobreconsumo crítico (% real > % esperado + 20%)
--   R4: Sobreconsumo preventivo (% real > % esperado + 10%)
-- ============================================================

CREATE OR REPLACE FUNCTION fn_evaluate_well_alerts(
  p_well_id INTEGER,
  p_column_name TEXT,
  p_year INTEGER,
  p_week INTEGER
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_table_name TEXT;
  v_consumptions DECIMAL[];
  v_current_consumption DECIMAL;
  v_avg3 DECIMAL;
  v_change_pct DECIMAL;
  v_annual_limit DECIMAL;
  v_total_consumption DECIMAL;
  v_day_of_year INTEGER;
  v_expected_pct DECIMAL;
  v_real_pct DECIMAL;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
  v_rec RECORD;
BEGIN
  -- Nombre de la tabla de consumo del año
  v_table_name := 'lecturas_semana_agua_consumo_' || p_year;

  -- ========================================
  -- REGLA 1 y 2: Pico / Caída de consumo
  -- ========================================

  -- Obtener últimos 4 consumos (semana actual + 3 previas) ordenados desc
  EXECUTE format(
    'SELECT COALESCE(ARRAY_AGG(val ORDER BY week DESC), ARRAY[]::DECIMAL[])
     FROM (
       SELECT l_numero_semana AS week, COALESCE(%I, 0) AS val
       FROM %I
       ORDER BY l_numero_semana DESC
       LIMIT 4
     ) sub',
    p_column_name, v_table_name
  ) INTO v_consumptions;

  -- Necesitamos al menos 4 valores (1 actual + 3 previas)
  IF array_length(v_consumptions, 1) >= 4 THEN
    v_current_consumption := v_consumptions[1];

    -- Si consumo actual es 0, no alertar (es normal no usar un pozo)
    IF v_current_consumption > 0 THEN
      -- Promedio de las 3 semanas previas
      v_avg3 := (v_consumptions[2] + v_consumptions[3] + v_consumptions[4]) / 3.0;

      IF v_avg3 > 0 THEN
        v_change_pct := ((v_current_consumption - v_avg3) / v_avg3) * 100;

        -- R1: Incremento anormal (+30%)
        IF v_change_pct >= 30 THEN
          INSERT INTO well_events (
            well_id, event_type, severity, is_automatic, title, description,
            recommendation, metric_value, threshold_value,
            alert_week, alert_year, start_date, event_status, author_name
          ) VALUES (
            p_well_id, 'alerta_consumo', 'critica', true,
            format('Incremento anormal de consumo (+%s%%)', round(v_change_pct, 1)),
            format('El consumo de la semana %s (%s m³) supera en %s%% al promedio de las últimas 3 semanas (%s m³).',
              p_week, round(v_current_consumption, 2), round(v_change_pct, 1), round(v_avg3, 2)),
            'Revisar posibles fugas en líneas cercanas o válvulas abiertas.',
            round(v_change_pct, 2), 30,
            p_week, p_year, v_now, 'activo', 'Sistema Automático'
          )
          ON CONFLICT DO NOTHING;
        END IF;

        -- R2: Caída fuerte (<-40%)
        IF v_change_pct <= -40 THEN
          INSERT INTO well_events (
            well_id, event_type, severity, is_automatic, title, description,
            recommendation, metric_value, threshold_value,
            alert_week, alert_year, start_date, event_status, author_name
          ) VALUES (
            p_well_id, 'alerta_consumo', 'critica', true,
            format('Caída fuerte de consumo (%s%%)', round(v_change_pct, 1)),
            format('El consumo de la semana %s (%s m³) cayó %s%% respecto al promedio de las últimas 3 semanas (%s m³).',
              p_week, round(v_current_consumption, 2), round(abs(v_change_pct), 1), round(v_avg3, 2)),
            'Validar operación del pozo o funcionamiento del medidor.',
            round(v_change_pct, 2), -40,
            p_week, p_year, v_now, 'activo', 'Sistema Automático'
          )
          ON CONFLICT DO NOTHING;
        END IF;

      ELSIF v_avg3 = 0 AND v_current_consumption > 0 THEN
        -- Promedio era 0 pero ahora hay consumo → incremento significativo
        INSERT INTO well_events (
          well_id, event_type, severity, is_automatic, title, description,
          recommendation, metric_value, threshold_value,
          alert_week, alert_year, start_date, event_status, author_name
        ) VALUES (
          p_well_id, 'alerta_consumo', 'critica', true,
          'Incremento anormal de consumo',
          format('El consumo de la semana %s (%s m³) es significativo cuando el promedio de las últimas 3 semanas era 0 m³.',
            p_week, round(v_current_consumption, 2)),
          'Revisar posibles fugas en líneas cercanas o válvulas abiertas.',
          100, 30,
          p_week, p_year, v_now, 'activo', 'Sistema Automático'
        )
        ON CONFLICT DO NOTHING;
      END IF;
    END IF;
  END IF;

  -- ========================================
  -- REGLA 3 y 4: Sobreconsumo
  -- ========================================

  -- Obtener límite anual del pozo
  SELECT (m3_por_anexo - m3_cedidos) INTO v_annual_limit
  FROM well_config
  WHERE well_id = p_well_id;

  IF v_annual_limit IS NOT NULL AND v_annual_limit > 0 THEN
    -- Calcular consumo total acumulado del año
    EXECUTE format(
      'SELECT COALESCE(SUM(COALESCE(%I, 0)), 0) FROM %I',
      p_column_name, v_table_name
    ) INTO v_total_consumption;

    IF v_total_consumption > 0 THEN
      -- Día del año (aproximación basada en la fecha actual)
      v_day_of_year := EXTRACT(DOY FROM v_now);
      v_expected_pct := v_day_of_year::DECIMAL / 365.0;
      v_real_pct := v_total_consumption / v_annual_limit;

      -- R3: Sobreconsumo crítico (% real > % esperado + 20%)
      IF v_real_pct > v_expected_pct + 0.20 THEN
        INSERT INTO well_events (
          well_id, event_type, severity, is_automatic, title, description,
          recommendation, metric_value, threshold_value,
          alert_week, alert_year, start_date, event_status, author_name
        ) VALUES (
          p_well_id, 'sobreconsumo', 'critica', true,
          format('Sobreconsumo crítico (%s%% usado en %s%% del año)',
            round(v_real_pct * 100, 1), round(v_expected_pct * 100, 1)),
          format('Se ha utilizado el %s%% del volumen anual (%s de %s m³) cuando solo ha transcurrido el %s%% del año (día %s de 365).',
            round(v_real_pct * 100, 1), round(v_total_consumption, 2), round(v_annual_limit, 2),
            round(v_expected_pct * 100, 1), v_day_of_year),
          format('Consumo acelerado: se ha utilizado el %s%% del volumen anual en solo el %s%% del año.',
            round(v_real_pct * 100, 1), round(v_expected_pct * 100, 1)),
          round(v_real_pct * 100, 2),
          round((v_expected_pct + 0.20) * 100, 2),
          p_week, p_year, v_now, 'activo', 'Sistema Automático'
        )
        ON CONFLICT DO NOTHING;

      -- R4: Sobreconsumo preventivo (% real > % esperado + 10%)
      ELSIF v_real_pct > v_expected_pct + 0.10 THEN
        INSERT INTO well_events (
          well_id, event_type, severity, is_automatic, title, description,
          recommendation, metric_value, threshold_value,
          alert_week, alert_year, start_date, event_status, author_name
        ) VALUES (
          p_well_id, 'sobreconsumo', 'preventiva', true,
          format('Consumo por encima del ritmo esperado (%s%% vs %s%% esperado)',
            round(v_real_pct * 100, 1), round(v_expected_pct * 100, 1)),
          format('Se ha consumido el %s%% del volumen anual cuando el ritmo esperado sería %s%%. Diferencia de %s puntos porcentuales.',
            round(v_real_pct * 100, 1), round(v_expected_pct * 100, 1),
            round((v_real_pct - v_expected_pct) * 100, 1)),
          'El consumo está por encima del ritmo esperado. Existe riesgo de sobrepasar el límite anual.',
          round(v_real_pct * 100, 2),
          round((v_expected_pct + 0.10) * 100, 2),
          p_week, p_year, v_now, 'activo', 'Sistema Automático'
        )
        ON CONFLICT DO NOTHING;
      END IF;
    END IF;
  END IF;
END;
$$;


-- ============================================================
-- 3. FUNCIÓN TRIGGER fn_consumption_alert_trigger()
-- Se ejecuta AFTER INSERT OR UPDATE en tablas de consumo.
-- Itera sobre todos los pozos configurados y evalúa alertas.
-- ============================================================

CREATE OR REPLACE FUNCTION fn_consumption_alert_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_year INTEGER;
  v_week INTEGER;
  v_well RECORD;
  v_row_json JSONB;
  v_col_value DECIMAL;
BEGIN
  -- Extraer año del nombre de la tabla (ej: 'lecturas_semana_agua_consumo_2026' → 2026)
  v_year := CAST(RIGHT(TG_TABLE_NAME, 4) AS INTEGER);

  -- Número de semana de la fila insertada/actualizada
  v_week := NEW.l_numero_semana;

  -- Convertir la fila NEW a JSON para acceder a columnas dinámicamente
  v_row_json := row_to_json(NEW)::JSONB;

  -- Iterar sobre cada pozo configurado
  FOR v_well IN SELECT well_id, column_name FROM well_config LOOP
    -- Obtener el valor de consumo de la columna del pozo
    v_col_value := COALESCE((v_row_json ->> v_well.column_name)::DECIMAL, 0);

    -- Solo evaluar si hay actividad en esta columna
    -- Para INSERT: evaluar siempre
    -- Para UPDATE: evaluar solo si el valor cambió
    IF TG_OP = 'INSERT' OR (
      TG_OP = 'UPDATE' AND
      COALESCE((row_to_json(OLD)::JSONB ->> v_well.column_name)::DECIMAL, 0) <> v_col_value
    ) THEN
      PERFORM fn_evaluate_well_alerts(v_well.well_id, v_well.column_name, v_year, v_week);
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;


-- ============================================================
-- 4. SISTEMA AUTOMÁTICO DE TRIGGERS
-- En lugar de crear triggers manualmente para cada año,
-- este sistema detecta y adjunta triggers automáticamente
-- a TODAS las tablas lecturas_semana_agua_consumo_%.
-- También se auto-adjunta a tablas nuevas (ej: 2027, 2028...)
-- mediante un event trigger DDL.
-- ============================================================

-- 4a. Función helper: escanea tablas existentes y adjunta triggers
CREATE OR REPLACE FUNCTION fn_attach_alert_triggers()
RETURNS TABLE(table_name TEXT, action TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  v_table RECORD;
  v_trigger_name TEXT;
  v_trigger_exists BOOLEAN;
  v_year_suffix TEXT;
BEGIN
  -- Buscar todas las tablas que matcheen el patrón de consumo de agua
  FOR v_table IN
    SELECT t.table_name AS tname
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
      AND t.table_name LIKE 'lecturas_semana_agua_consumo_%'
      AND t.table_type = 'BASE TABLE'
    ORDER BY t.table_name
  LOOP
    -- Extraer sufijo del año (últimos 4 caracteres)
    v_year_suffix := RIGHT(v_table.tname, 4);
    v_trigger_name := 'trg_alert_consumo_' || v_year_suffix;

    -- Verificar si el trigger ya existe en esta tabla
    SELECT EXISTS(
      SELECT 1 FROM information_schema.triggers tr
      WHERE tr.trigger_name = v_trigger_name
        AND tr.event_object_table = v_table.tname
        AND tr.event_object_schema = 'public'
    ) INTO v_trigger_exists;

    IF v_trigger_exists THEN
      table_name := v_table.tname;
      action := 'ya existe';
      RETURN NEXT;
    ELSE
      -- Eliminar trigger previo si existe y recrear (idempotente)
      EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', v_trigger_name, v_table.tname);
      EXECUTE format(
        'CREATE TRIGGER %I
           AFTER INSERT OR UPDATE ON %I
           FOR EACH ROW
           EXECUTE FUNCTION fn_consumption_alert_trigger()',
        v_trigger_name, v_table.tname
      );
      table_name := v_table.tname;
      action := 'trigger creado';
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$;

-- 4b. Event trigger: auto-adjuntar cuando se cree una tabla nueva
CREATE OR REPLACE FUNCTION fn_auto_attach_consumption_trigger()
RETURNS event_trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_obj RECORD;
  v_table_name TEXT;
  v_year_suffix TEXT;
  v_trigger_name TEXT;
BEGIN
  -- Iterar sobre los objetos creados en este comando DDL
  FOR v_obj IN SELECT * FROM pg_event_trigger_ddl_commands() LOOP
    -- Solo nos interesan tablas
    IF v_obj.object_type = 'table' THEN
      -- Extraer solo el nombre de la tabla (sin schema)
      v_table_name := split_part(v_obj.object_identity, '.', 2);

      -- Verificar si matchea el patrón de consumo de agua
      IF v_table_name LIKE 'lecturas_semana_agua_consumo_%' THEN
        v_year_suffix := RIGHT(v_table_name, 4);
        v_trigger_name := 'trg_alert_consumo_' || v_year_suffix;

        -- Eliminar trigger previo si existe y recrear (idempotente)
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', v_trigger_name, v_table_name);
        EXECUTE format(
          'CREATE TRIGGER %I
             AFTER INSERT OR UPDATE ON %I
             FOR EACH ROW
             EXECUTE FUNCTION fn_consumption_alert_trigger()',
          v_trigger_name, v_table_name
        );

        RAISE NOTICE '🔔 Trigger de alertas auto-adjuntado a tabla: %', v_table_name;
      END IF;
    END IF;
  END LOOP;
END;
$$;

-- Eliminar event trigger previo si existe (idempotente)
DROP EVENT TRIGGER IF EXISTS evt_auto_attach_consumption_alert;

-- Crear event trigger que se dispara al crear tablas
CREATE EVENT TRIGGER evt_auto_attach_consumption_alert
  ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE')
  EXECUTE FUNCTION fn_auto_attach_consumption_trigger();

-- 4c. Ejecución inicial: adjuntar triggers a todas las tablas existentes
-- Esto cubre 2023, 2024, 2025, 2026 y cualquier otra que exista
SELECT * FROM fn_attach_alert_triggers();


-- ============================================================
-- 5. HABILITAR REALTIME EN well_events
-- Permite que Supabase envíe cambios por WebSocket al frontend.
-- REPLICA IDENTITY FULL es necesario para que payload.old
-- incluya TODAS las columnas en UPDATE/DELETE (no solo la PK).
-- ============================================================

-- Sin esto, Realtime solo envía { id: "..." } en payload.old
-- y los handlers de UPDATE/DELETE en el frontend fallan.
ALTER TABLE well_events REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'well_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE well_events;
  END IF;
END;
$$;


-- ============================================================
-- 6. ESCANEO AUTOMÁTICO PROGRAMADO (pg_cron)
-- Evalúa TODOS los registros existentes periódicamente
-- para detectar anomalías sin depender de INSERT/UPDATE.
-- Cualquier alerta generada → well_events → Realtime → WebSocket → UI
-- No genera duplicados gracias a idx_well_events_auto_unique + ON CONFLICT DO NOTHING
-- ============================================================

-- 6a. Función scanner: recorre todos los pozos × todas las tablas de consumo
CREATE OR REPLACE FUNCTION fn_scan_all_consumption_alerts()
RETURNS TABLE(well_name TEXT, year_scanned INTEGER, week_scanned INTEGER, result TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  v_well RECORD;
  v_table RECORD;
  v_year INTEGER;
  v_max_week INTEGER;
BEGIN
  -- Iterar sobre cada tabla de consumo existente
  FOR v_table IN
    SELECT t.table_name AS tname
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
      AND t.table_name LIKE 'lecturas_semana_agua_consumo_%'
      AND t.table_type = 'BASE TABLE'
    ORDER BY t.table_name
  LOOP
    v_year := CAST(RIGHT(v_table.tname, 4) AS INTEGER);

    -- Obtener la semana más reciente con datos
    EXECUTE format(
      'SELECT MAX(l_numero_semana) FROM %I WHERE l_numero_semana IS NOT NULL',
      v_table.tname
    ) INTO v_max_week;

    IF v_max_week IS NULL THEN
      CONTINUE;
    END IF;

    -- Evaluar cada pozo en la semana más reciente
    FOR v_well IN SELECT w.well_id, w.name, w.column_name FROM well_config w LOOP
      BEGIN
        PERFORM fn_evaluate_well_alerts(v_well.well_id, v_well.column_name, v_year, v_max_week);
        well_name := v_well.name;
        year_scanned := v_year;
        week_scanned := v_max_week;
        result := 'evaluado';
        RETURN NEXT;
      EXCEPTION WHEN OTHERS THEN
        well_name := v_well.name;
        year_scanned := v_year;
        week_scanned := v_max_week;
        result := 'error: ' || SQLERRM;
        RETURN NEXT;
      END;
    END LOOP;
  END LOOP;
END;
$$;

-- 6b. Habilitar pg_cron (solo necesario una vez, ya incluido en Supabase)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 6c. Programar escaneo automático cada 6 horas
-- Limpiar job previo si existe (idempotente)
SELECT cron.unschedule('scan_consumption_alerts')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'scan_consumption_alerts');

SELECT cron.schedule(
  'scan_consumption_alerts',        -- nombre del job
  '0 */6 * * *',                    -- cada 6 horas (00:00, 06:00, 12:00, 18:00)
  $$SELECT * FROM fn_scan_all_consumption_alerts()$$
);
