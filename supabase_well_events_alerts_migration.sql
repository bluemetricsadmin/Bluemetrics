-- ============================================================
-- Migración: Soporte para alertas automáticas en well_events
-- Fecha: 2026-04-15
-- ============================================================

-- 1. Eliminar constraint actual de event_type y recrear con nuevos valores (idempotente)
ALTER TABLE well_events DROP CONSTRAINT IF EXISTS well_events_event_type_check;
ALTER TABLE well_events ADD CONSTRAINT well_events_event_type_check
  CHECK (event_type IN ('mantenimiento', 'parado', 'reparacion', 'inspeccion', 'otro', 'alerta_consumo', 'sobreconsumo'));

-- 2. Agregar columnas para alertas automáticas
-- DROP + ADD para que severity CHECK constraint se actualice correctamente
DO $$
BEGIN
  -- severity: con CHECK constraint inline
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'well_events' AND column_name = 'severity') THEN
    ALTER TABLE well_events ADD COLUMN severity VARCHAR(20) DEFAULT NULL CHECK (severity IN ('critica', 'preventiva'));
  END IF;
END;
$$;

ALTER TABLE well_events ADD COLUMN IF NOT EXISTS is_automatic BOOLEAN DEFAULT FALSE;

ALTER TABLE well_events ADD COLUMN IF NOT EXISTS recommendation TEXT DEFAULT NULL;

ALTER TABLE well_events ADD COLUMN IF NOT EXISTS metric_value DECIMAL DEFAULT NULL;

ALTER TABLE well_events ADD COLUMN IF NOT EXISTS threshold_value DECIMAL DEFAULT NULL;

ALTER TABLE well_events ADD COLUMN IF NOT EXISTS alert_week INTEGER DEFAULT NULL;

ALTER TABLE well_events ADD COLUMN IF NOT EXISTS alert_year INTEGER DEFAULT NULL;

-- 3. Índice único parcial para evitar alertas automáticas duplicadas
-- (mismo pozo, mismo tipo, misma semana y año, solo para alertas automáticas)
CREATE UNIQUE INDEX IF NOT EXISTS idx_well_events_auto_unique
  ON well_events (well_id, event_type, severity, alert_week, alert_year)
  WHERE is_automatic = true;

-- 4. Índice para consultas rápidas de alertas automáticas
CREATE INDEX IF NOT EXISTS idx_well_events_is_automatic
  ON well_events (is_automatic)
  WHERE is_automatic = true;
