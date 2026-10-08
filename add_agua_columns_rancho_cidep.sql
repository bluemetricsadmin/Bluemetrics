-- Migracion para agregar columnas a tablas semanales de agua (2023-2026)
-- Columnas: l_rancho_tec, l_cidep
-- Ejecutar este script manualmente en Supabase

-- ============================================
-- Tablas de lecturas: lecturas_semana_agua_2023..2026
-- ============================================

ALTER TABLE public.lecturas_semana_agua_2023
ADD COLUMN IF NOT EXISTS l_rancho_tec NUMERIC(15, 3),
ADD COLUMN IF NOT EXISTS l_cidep NUMERIC(15, 3);

ALTER TABLE public.lecturas_semana_agua_2024
ADD COLUMN IF NOT EXISTS l_rancho_tec NUMERIC(15, 3),
ADD COLUMN IF NOT EXISTS l_cidep NUMERIC(15, 3);

ALTER TABLE public.lecturas_semana_agua_2025
ADD COLUMN IF NOT EXISTS l_rancho_tec NUMERIC(15, 3),
ADD COLUMN IF NOT EXISTS l_cidep NUMERIC(15, 3);

ALTER TABLE public.lecturas_semana_agua_2026
ADD COLUMN IF NOT EXISTS l_rancho_tec NUMERIC(15, 3),
ADD COLUMN IF NOT EXISTS l_cidep NUMERIC(15, 3);

-- ============================================
-- Tablas de consumo: lecturas_semana_agua_consumo_2023..2026
-- ============================================

ALTER TABLE public.lecturas_semana_agua_consumo_2023
ADD COLUMN IF NOT EXISTS l_rancho_tec NUMERIC(15, 3),
ADD COLUMN IF NOT EXISTS l_cidep NUMERIC(15, 3);

ALTER TABLE public.lecturas_semana_agua_consumo_2024
ADD COLUMN IF NOT EXISTS l_rancho_tec NUMERIC(15, 3),
ADD COLUMN IF NOT EXISTS l_cidep NUMERIC(15, 3);

ALTER TABLE public.lecturas_semana_agua_consumo_2025
ADD COLUMN IF NOT EXISTS l_rancho_tec NUMERIC(15, 3),
ADD COLUMN IF NOT EXISTS l_cidep NUMERIC(15, 3);

ALTER TABLE public.lecturas_semana_agua_consumo_2026
ADD COLUMN IF NOT EXISTS l_rancho_tec NUMERIC(15, 3),
ADD COLUMN IF NOT EXISTS l_cidep NUMERIC(15, 3);

-- ============================================
-- Tablas mensuales
-- ============================================

ALTER TABLE public.lecturas_mensuales_agua
ADD COLUMN IF NOT EXISTS l_rancho_tec NUMERIC(15, 3),
ADD COLUMN IF NOT EXISTS l_cidep NUMERIC(15, 3);

ALTER TABLE public.lecturas_mensuales_agua_consumo
ADD COLUMN IF NOT EXISTS l_rancho_tec NUMERIC(15, 3),
ADD COLUMN IF NOT EXISTS l_cidep NUMERIC(15, 3);

-- Verificacion de columnas agregadas
SELECT
  table_name,
  column_name,
  data_type,
  numeric_precision,
  numeric_scale
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'lecturas_semana_agua_2023',
    'lecturas_semana_agua_2024',
    'lecturas_semana_agua_2025',
    'lecturas_semana_agua_2026',
    'lecturas_semana_agua_consumo_2023',
    'lecturas_semana_agua_consumo_2024',
    'lecturas_semana_agua_consumo_2025',
    'lecturas_semana_agua_consumo_2026',
    'lecturas_mensuales_agua',
    'lecturas_mensuales_agua_consumo'
  )
  AND column_name IN (
    'l_rancho_tec',
    'l_cidep'
  )
ORDER BY table_name, column_name;
