-- Migración para agregar columna L_caffenio a las tablas de agua 2026
-- Ejecutar este script manualmente en Supabase

-- Agregar columna a tabla de consumo
ALTER TABLE public.lecturas_semana_agua_consumo_2026 
ADD COLUMN IF NOT EXISTS l_caffenio NUMERIC(15, 3);

-- Agregar columna a tabla de lecturas
ALTER TABLE public.lecturas_semana_agua_2026 
ADD COLUMN IF NOT EXISTS l_caffenio NUMERIC(15, 3);

-- Verificar que las columnas se agregaron correctamente
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('lecturas_semana_agua_consumo_2026', 'lecturas_semana_agua_2026') 
  AND column_name = 'l_caffenio';
