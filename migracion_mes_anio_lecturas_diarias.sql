-- ====================================================================
-- Migración: Agregar columnas mes y anio a lecturas_diarias
-- y llenarlas automáticamente desde mes_anio
-- ====================================================================
-- Ejecutar este script en el editor SQL de Supabase
-- ====================================================================

-- Paso 1: Agregar las columnas nuevas si no existen
ALTER TABLE public.lecturas_diarias 
    ADD COLUMN IF NOT EXISTS mes VARCHAR(20),
    ADD COLUMN IF NOT EXISTS anio VARCHAR(10);

-- Paso 2: Crear índices para las nuevas columnas
CREATE INDEX IF NOT EXISTS idx_lecturas_diarias_mes 
    ON public.lecturas_diarias(mes);

CREATE INDEX IF NOT EXISTS idx_lecturas_diarias_anio 
    ON public.lecturas_diarias(anio);

-- Paso 3: Llenar las columnas mes y anio a partir de mes_anio
-- Ejemplo: "febrero 2024" -> mes = "febrero", anio = "2024"
UPDATE public.lecturas_diarias
SET 
    mes = TRIM(SPLIT_PART(mes_anio, ' ', 1)),
    anio = TRIM(SPLIT_PART(mes_anio, ' ', 2))
WHERE mes_anio IS NOT NULL
  AND (mes IS NULL OR anio IS NULL);

-- ====================================================================
-- Verificar resultados
-- ====================================================================
-- SELECT id, mes_anio, mes, anio FROM public.lecturas_diarias LIMIT 20;
