-- ============================================================
-- Fix: fn_obtener_consumos_anualizados_paginados
-- ------------------------------------------------------------
-- Problema:
--   La función usaba REPLACE(col, 'l_', '') para quitar el prefijo
--   de columna, pero REPLACE elimina TODAS las apariciones del
--   substring 'l_' en cualquier posición. Eso corrompía los slugs:
--     l_megacentral_te_2            -> megacentrate_2
--     l_medidor_general_pozos       -> medidor_generapozos
--     l_wellness_parque_central_tunel -> wellness_parque_centratunel
--     l_el_negro                    -> enegro
--     l_mil_mascaras                -> mimascaras
--   Al no coincidir con los id de src/lib/consumption-points.json,
--   el frontend caía al fallback prettifySlug y mostraba nombres
--   incorrectos ("Megacentrate 2" en lugar de "Megacentral ...").
--
-- Solución:
--   Quitar únicamente el prefijo con regexp_replace(col, '^l_', '').
--
-- Ejecutar en el SQL Editor de Supabase.
-- ============================================================

CREATE OR REPLACE FUNCTION fn_obtener_consumos_anualizados_paginados(
  p_search text DEFAULT '',
  p_sort_by text DEFAULT 'consumo_total',
  p_sort_dir text DEFAULT 'desc',
  p_limit integer DEFAULT 10,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  medidor text,
  consumo_2023 numeric,
  consumo_2024 numeric,
  consumo_2025 numeric,
  consumo_2026 numeric,
  consumo_total numeric,
  total_registros bigint
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  WITH unpivoted AS (
    SELECT '2026' as anio, key as col, value::numeric as lectura FROM lecturas_semana_agua_consumo_2026 t, jsonb_each_text(to_jsonb(t) - 'l_id' - 'l_numero_semana' - 'l_fecha_inicio' - 'l_fecha_fin' - 'l_created_at' - 'l_updated_at') WHERE value <> ''
    UNION ALL
    SELECT '2025' as anio, key as col, value::numeric as lectura FROM lecturas_semana_agua_consumo_2025 t, jsonb_each_text(to_jsonb(t) - 'l_id' - 'l_numero_semana' - 'l_fecha_inicio' - 'l_fecha_fin' - 'l_created_at' - 'l_updated_at') WHERE value <> ''
    UNION ALL
    SELECT '2024' as anio, key as col, value::numeric as lectura FROM lecturas_semana_agua_consumo_2024 t, jsonb_each_text(to_jsonb(t) - 'l_id' - 'l_numero_semana' - 'l_fecha_inicio' - 'l_fecha_fin' - 'l_created_at' - 'l_updated_at') WHERE value <> ''
    UNION ALL
    SELECT '2023' as anio, key as col, value::numeric as lectura FROM lecturas_semana_agua_consumo_2023 t, jsonb_each_text(to_jsonb(t) - 'l_id' - 'l_numero_semana' - 'l_fecha_inicio' - 'l_fecha_fin' - 'l_created_at' - 'l_updated_at') WHERE value <> ''
  ),
  agrupado AS (
    SELECT
      regexp_replace(col, '^l_', '') AS medidor_nombre,
      SUM(CASE WHEN anio = '2023' THEN lectura ELSE 0 END) AS c_2023,
      SUM(CASE WHEN anio = '2024' THEN lectura ELSE 0 END) AS c_2024,
      SUM(CASE WHEN anio = '2025' THEN lectura ELSE 0 END) AS c_2025,
      SUM(CASE WHEN anio = '2026' THEN lectura ELSE 0 END) AS c_2026,
      SUM(lectura) AS c_total
    FROM unpivoted
    GROUP BY col
  ),
  filtrado AS (
    SELECT * FROM agrupado
    -- Filtro de búsqueda (ILIKE no distingue mayúsculas/minúsculas)
    WHERE p_search = '' OR REPLACE(medidor_nombre, '_', ' ') ILIKE '%' || p_search || '%'
  )
  SELECT
    f.medidor_nombre,
    f.c_2023,
    f.c_2024,
    f.c_2025,
    f.c_2026,
    f.c_total,
    COUNT(*) OVER() AS total_registros -- Devuelve el total sin limit para calcular la paginación
  FROM filtrado f
  ORDER BY
    -- Ordenamiento dinámico para campos de TEXTO
    CASE WHEN p_sort_dir = 'asc' AND p_sort_by = 'medidor' THEN f.medidor_nombre END ASC,
    CASE WHEN p_sort_dir = 'desc' AND p_sort_by = 'medidor' THEN f.medidor_nombre END DESC,
    -- Ordenamiento dinámico para campos NUMÉRICOS
    CASE WHEN p_sort_dir = 'asc' THEN
      CASE p_sort_by
        WHEN 'consumo_2023' THEN f.c_2023
        WHEN 'consumo_2024' THEN f.c_2024
        WHEN 'consumo_2025' THEN f.c_2025
        WHEN 'consumo_2026' THEN f.c_2026
        WHEN 'consumo_total' THEN f.c_total
      END
    END ASC NULLS FIRST,
    CASE WHEN p_sort_dir = 'desc' THEN
      CASE p_sort_by
        WHEN 'consumo_2023' THEN f.c_2023
        WHEN 'consumo_2024' THEN f.c_2024
        WHEN 'consumo_2025' THEN f.c_2025
        WHEN 'consumo_2026' THEN f.c_2026
        WHEN 'consumo_total' THEN f.c_total
      END
    END DESC NULLS LAST
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;
