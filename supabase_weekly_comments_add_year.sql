-- =====================================================
-- Migración: Agregar columna year a weekly_comments
-- Descripción: Los comentarios semanales pasan a ser únicos por
--              (año, semana, recurso), permitiendo ver y guardar
--              comentarios distintos para la misma semana en años
--              diferentes. Los comentarios existentes se asignan al
--              año actual por defecto.
-- =====================================================

-- 1. Agregar la columna year (nullable temporalmente para el backfill)
ALTER TABLE public.weekly_comments
  ADD COLUMN IF NOT EXISTS year INTEGER;

-- 2. Backfill: asignar los comentarios existentes al año actual
UPDATE public.weekly_comments
  SET year = 2026
  WHERE year IS NULL;

-- 3. Hacer la columna obligatoria
ALTER TABLE public.weekly_comments
  ALTER COLUMN year SET NOT NULL;

-- 4. Reemplazar el constraint único antiguo por el nuevo (año, semana, recurso)
ALTER TABLE public.weekly_comments
  DROP CONSTRAINT IF EXISTS unique_weekly_comment;

ALTER TABLE public.weekly_comments
  ADD CONSTRAINT unique_weekly_comment UNIQUE (year, week_number, source_type);

-- 5. Índices para las consultas por año + recurso
CREATE INDEX IF NOT EXISTS idx_weekly_comments_year_week
  ON public.weekly_comments(year, week_number, source_type);

-- 6. Documentar la nueva columna
COMMENT ON COLUMN public.weekly_comments.year IS 'Año del consumo al que aplica el comentario';

-- =====================================================
-- Fin de la migración
-- =====================================================
