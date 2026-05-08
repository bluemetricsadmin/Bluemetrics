-- ============================================================
-- Migración: Vistas SQL para Alertas de Posible Fuga
-- Fecha: 2026-05-07
--
-- Requisito previo:
--   - supabase_fuga_alerts_semanal.sql (columnas alert_granularity, alert_month)
--
-- Contenido:
--   1. vista_fugas_semanales
--   2. vista_fugas_mensuales
--   3. vista_fugas_diarias
--   4. vista_fugas_activas (consolidada, todas las granularidades)
-- ============================================================

-- ============================================================
-- 1. VISTA: vista_fugas_semanales
-- ============================================================
CREATE OR REPLACE VIEW vista_fugas_semanales AS
SELECT
  we.id,
  we.meter_column,
  COALESCE(wc.name, we.meter_column)    AS display_name,
  we.severity,
  we.event_status,
  we.title,
  we.description,
  we.recommendation,
  we.metric_value,
  we.alert_week,
  we.alert_year,
  we.start_date,
  we.end_date,
  we.created_at,
  we.author_name
FROM well_events we
LEFT JOIN well_config wc ON wc.column_name = we.meter_column
WHERE we.event_type       = 'posible_fuga'
  AND we.alert_granularity = 'weekly'
  AND we.is_automatic     = true;


-- ============================================================
-- 2. VISTA: vista_fugas_mensuales
-- ============================================================
CREATE OR REPLACE VIEW vista_fugas_mensuales AS
SELECT
  we.id,
  we.meter_column,
  COALESCE(wc.name, we.meter_column)    AS display_name,
  we.severity,
  we.event_status,
  we.title,
  we.description,
  we.recommendation,
  we.metric_value,
  we.alert_year,
  we.alert_month,
  CASE we.alert_month
    WHEN 1  THEN 'Enero'    WHEN 2  THEN 'Febrero'   WHEN 3  THEN 'Marzo'
    WHEN 4  THEN 'Abril'    WHEN 5  THEN 'Mayo'       WHEN 6  THEN 'Junio'
    WHEN 7  THEN 'Julio'    WHEN 8  THEN 'Agosto'     WHEN 9  THEN 'Septiembre'
    WHEN 10 THEN 'Octubre'  WHEN 11 THEN 'Noviembre'  WHEN 12 THEN 'Diciembre'
  END                                   AS mes_nombre,
  we.start_date,
  we.end_date,
  we.created_at,
  we.author_name
FROM well_events we
LEFT JOIN well_config wc ON wc.column_name = we.meter_column
WHERE we.event_type       = 'posible_fuga'
  AND we.alert_granularity = 'monthly'
  AND we.is_automatic     = true;


-- ============================================================
-- 3. VISTA: vista_fugas_diarias
-- ============================================================
CREATE OR REPLACE VIEW vista_fugas_diarias AS
SELECT
  we.id,
  we.meter_column,
  COALESCE(wc.name, we.meter_column)    AS display_name,
  we.severity,
  we.event_status,
  we.title,
  we.description,
  we.recommendation,
  we.metric_value,
  we.alert_date                         AS fecha_alerta,
  we.start_date,
  we.end_date,
  we.created_at,
  we.author_name
FROM well_events we
LEFT JOIN well_config wc ON wc.column_name = we.meter_column
WHERE we.event_type       = 'posible_fuga'
  AND we.alert_granularity = 'daily'
  AND we.is_automatic     = true;


-- ============================================================
-- 4. VISTA: vista_fugas_activas (consolidada)
-- Todas las granularidades, solo alertas activas.
-- ============================================================
CREATE OR REPLACE VIEW vista_fugas_activas AS
SELECT
  we.id,
  we.meter_column,
  COALESCE(wc.name, we.meter_column)    AS display_name,
  we.severity,
  we.alert_granularity,
  we.title,
  we.description,
  we.recommendation,
  we.metric_value,
  we.alert_week,
  we.alert_year,
  we.alert_month,
  we.alert_date,
  we.start_date,
  we.created_at
FROM well_events we
LEFT JOIN well_config wc ON wc.column_name = we.meter_column
WHERE we.event_type    = 'posible_fuga'
  AND we.event_status  = 'activo'
  AND we.is_automatic  = true
ORDER BY we.created_at DESC;
