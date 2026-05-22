-- Migracion para agregar columnas a tablas semanales de agua (2023-2026)
-- Ejecutar este script manualmente en Supabase

-- ============================================
-- Tablas de lecturas: lecturas_semana_agua_2023..2026
-- ============================================

ALTER TABLE public.lecturas_semana_agua_2023
ADD COLUMN IF NOT EXISTS l_san_huevito NUMERIC(15, 3),
ADD COLUMN IF NOT EXISTS l_aulas_4_centro NUMERIC(15, 3),
ADD COLUMN IF NOT EXISTS l_cdi_1 NUMERIC(15, 3),
ADD COLUMN IF NOT EXISTS l_cdi_2 NUMERIC(15, 3);

ALTER TABLE public.lecturas_semana_agua_2024
ADD COLUMN IF NOT EXISTS l_san_huevito NUMERIC(15, 3),
ADD COLUMN IF NOT EXISTS l_aulas_4_centro NUMERIC(15, 3),
ADD COLUMN IF NOT EXISTS l_cdi_1 NUMERIC(15, 3),
ADD COLUMN IF NOT EXISTS l_cdi_2 NUMERIC(15, 3);

ALTER TABLE public.lecturas_semana_agua_2025
ADD COLUMN IF NOT EXISTS l_san_huevito NUMERIC(15, 3),
ADD COLUMN IF NOT EXISTS l_aulas_4_centro NUMERIC(15, 3),
ADD COLUMN IF NOT EXISTS l_cdi_1 NUMERIC(15, 3),
ADD COLUMN IF NOT EXISTS l_cdi_2 NUMERIC(15, 3);

ALTER TABLE public.lecturas_semana_agua_2026
ADD COLUMN IF NOT EXISTS l_san_huevito NUMERIC(15, 3),
ADD COLUMN IF NOT EXISTS l_aulas_4_centro NUMERIC(15, 3),
ADD COLUMN IF NOT EXISTS l_cdi_1 NUMERIC(15, 3),
ADD COLUMN IF NOT EXISTS l_cdi_2 NUMERIC(15, 3);

-- ============================================
-- Tablas de consumo: lecturas_semana_agua_consumo_2023..2026
-- ============================================

ALTER TABLE public.lecturas_semana_agua_consumo_2023
ADD COLUMN IF NOT EXISTS l_san_huevito NUMERIC(15, 3),
ADD COLUMN IF NOT EXISTS l_aulas_4_centro NUMERIC(15, 3),
ADD COLUMN IF NOT EXISTS l_cdi_1 NUMERIC(15, 3),
ADD COLUMN IF NOT EXISTS l_cdi_2 NUMERIC(15, 3);

ALTER TABLE public.lecturas_semana_agua_consumo_2024
ADD COLUMN IF NOT EXISTS l_san_huevito NUMERIC(15, 3),
ADD COLUMN IF NOT EXISTS l_aulas_4_centro NUMERIC(15, 3),
ADD COLUMN IF NOT EXISTS l_cdi_1 NUMERIC(15, 3),
ADD COLUMN IF NOT EXISTS l_cdi_2 NUMERIC(15, 3);

ALTER TABLE public.lecturas_semana_agua_consumo_2025
ADD COLUMN IF NOT EXISTS l_san_huevito NUMERIC(15, 3),
ADD COLUMN IF NOT EXISTS l_aulas_4_centro NUMERIC(15, 3),
ADD COLUMN IF NOT EXISTS l_cdi_1 NUMERIC(15, 3),
ADD COLUMN IF NOT EXISTS l_cdi_2 NUMERIC(15, 3);

ALTER TABLE public.lecturas_semana_agua_consumo_2026
ADD COLUMN IF NOT EXISTS l_san_huevito NUMERIC(15, 3),
ADD COLUMN IF NOT EXISTS l_aulas_4_centro NUMERIC(15, 3),
ADD COLUMN IF NOT EXISTS l_cdi_1 NUMERIC(15, 3),
ADD COLUMN IF NOT EXISTS l_cdi_2 NUMERIC(15, 3);

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
    'lecturas_semana_agua_consumo_2026'
  )
  AND column_name IN (
    'l_san_huevito',
    'l_aulas_4_centro',
    'l_cdi_1',
    'l_cdi_2'
  )
ORDER BY table_name, column_name;
