-- ====================================================================
-- Migración única: Llenar lecturas_diarias_consumo con consumos
-- calculados a partir de lecturas_diarias
-- ====================================================================
-- El consumo de cada columna se calcula como:
--   consumo = lectura_actual - lectura_anterior
-- donde la lectura anterior es la fila con el id inmediatamente
-- anterior dentro del mismo mes_anio.
-- ====================================================================
-- Ejecutar este script UNA SOLA VEZ en el editor SQL de Supabase
-- ====================================================================

-- Paso 1: Verificar que la tabla destino existe y está vacía
-- SELECT COUNT(*) FROM public.lecturas_diarias_consumo;

-- Paso 2: Insertar los consumos calculados
INSERT INTO public.lecturas_diarias_consumo (
    mes_anio,
    mes,
    anio,
    dia_hora,
    consumo,
    general_pozos,
    pozo_3,
    pozo_8,
    pozo_15,
    pozo_4,
    a_y_d,
    campus_8,
    a7_cc,
    megacentral,
    planta_fisica,
    residencias,
    pozo7,
    pozo11,
    pozo_12,
    pozo_14,
    created_at,
    updated_at
)
SELECT
    curr.mes_anio,
    curr.mes,
    curr.anio,
    curr.dia_hora,
    -- Consumo original ya calculado en lecturas_diarias
    curr.consumo,
    -- Consumo por punto = lectura actual - lectura anterior
    CASE WHEN curr.general_pozos IS NOT NULL AND prev.general_pozos IS NOT NULL
         THEN curr.general_pozos - prev.general_pozos ELSE NULL END AS general_pozos,
    CASE WHEN curr.pozo_3 IS NOT NULL AND prev.pozo_3 IS NOT NULL
         THEN curr.pozo_3 - prev.pozo_3 ELSE NULL END AS pozo_3,
    CASE WHEN curr.pozo_8 IS NOT NULL AND prev.pozo_8 IS NOT NULL
         THEN curr.pozo_8 - prev.pozo_8 ELSE NULL END AS pozo_8,
    CASE WHEN curr.pozo_15 IS NOT NULL AND prev.pozo_15 IS NOT NULL
         THEN curr.pozo_15 - prev.pozo_15 ELSE NULL END AS pozo_15,
    CASE WHEN curr.pozo_4 IS NOT NULL AND prev.pozo_4 IS NOT NULL
         THEN curr.pozo_4 - prev.pozo_4 ELSE NULL END AS pozo_4,
    CASE WHEN curr.a_y_d IS NOT NULL AND prev.a_y_d IS NOT NULL
         THEN curr.a_y_d - prev.a_y_d ELSE NULL END AS a_y_d,
    CASE WHEN curr.campus_8 IS NOT NULL AND prev.campus_8 IS NOT NULL
         THEN curr.campus_8 - prev.campus_8 ELSE NULL END AS campus_8,
    CASE WHEN curr.a7_cc IS NOT NULL AND prev.a7_cc IS NOT NULL
         THEN curr.a7_cc - prev.a7_cc ELSE NULL END AS a7_cc,
    CASE WHEN curr.megacentral IS NOT NULL AND prev.megacentral IS NOT NULL
         THEN curr.megacentral - prev.megacentral ELSE NULL END AS megacentral,
    CASE WHEN curr.planta_fisica IS NOT NULL AND prev.planta_fisica IS NOT NULL
         THEN curr.planta_fisica - prev.planta_fisica ELSE NULL END AS planta_fisica,
    CASE WHEN curr.residencias IS NOT NULL AND prev.residencias IS NOT NULL
         THEN curr.residencias - prev.residencias ELSE NULL END AS residencias,
    CASE WHEN curr.pozo7 IS NOT NULL AND prev.pozo7 IS NOT NULL
         THEN curr.pozo7 - prev.pozo7 ELSE NULL END AS pozo7,
    CASE WHEN curr.pozo11 IS NOT NULL AND prev.pozo11 IS NOT NULL
         THEN curr.pozo11 - prev.pozo11 ELSE NULL END AS pozo11,
    CASE WHEN curr.pozo_12 IS NOT NULL AND prev.pozo_12 IS NOT NULL
         THEN curr.pozo_12 - prev.pozo_12 ELSE NULL END AS pozo_12,
    CASE WHEN curr.pozo_14 IS NOT NULL AND prev.pozo_14 IS NOT NULL
         THEN curr.pozo_14 - prev.pozo_14 ELSE NULL END AS pozo_14,
    curr.created_at,
    NOW()
FROM (
    -- Subconsulta: cada fila con la lectura anterior usando LAG()
    SELECT
        *,
        LAG(general_pozos) OVER (PARTITION BY mes_anio ORDER BY id) AS prev_general_pozos,
        LAG(pozo_3)        OVER (PARTITION BY mes_anio ORDER BY id) AS prev_pozo_3,
        LAG(pozo_8)        OVER (PARTITION BY mes_anio ORDER BY id) AS prev_pozo_8,
        LAG(pozo_15)       OVER (PARTITION BY mes_anio ORDER BY id) AS prev_pozo_15,
        LAG(pozo_4)        OVER (PARTITION BY mes_anio ORDER BY id) AS prev_pozo_4,
        LAG(a_y_d)         OVER (PARTITION BY mes_anio ORDER BY id) AS prev_a_y_d,
        LAG(campus_8)      OVER (PARTITION BY mes_anio ORDER BY id) AS prev_campus_8,
        LAG(a7_cc)         OVER (PARTITION BY mes_anio ORDER BY id) AS prev_a7_cc,
        LAG(megacentral)   OVER (PARTITION BY mes_anio ORDER BY id) AS prev_megacentral,
        LAG(planta_fisica) OVER (PARTITION BY mes_anio ORDER BY id) AS prev_planta_fisica,
        LAG(residencias)   OVER (PARTITION BY mes_anio ORDER BY id) AS prev_residencias,
        LAG(pozo7)         OVER (PARTITION BY mes_anio ORDER BY id) AS prev_pozo7,
        LAG(pozo11)        OVER (PARTITION BY mes_anio ORDER BY id) AS prev_pozo11,
        LAG(pozo_12)       OVER (PARTITION BY mes_anio ORDER BY id) AS prev_pozo_12,
        LAG(pozo_14)       OVER (PARTITION BY mes_anio ORDER BY id) AS prev_pozo_14
    FROM public.lecturas_diarias
) curr
-- Crear una referencia "prev" usando los valores LAG ya calculados
CROSS JOIN LATERAL (
    SELECT
        curr.prev_general_pozos AS general_pozos,
        curr.prev_pozo_3        AS pozo_3,
        curr.prev_pozo_8        AS pozo_8,
        curr.prev_pozo_15       AS pozo_15,
        curr.prev_pozo_4        AS pozo_4,
        curr.prev_a_y_d         AS a_y_d,
        curr.prev_campus_8      AS campus_8,
        curr.prev_a7_cc         AS a7_cc,
        curr.prev_megacentral   AS megacentral,
        curr.prev_planta_fisica AS planta_fisica,
        curr.prev_residencias   AS residencias,
        curr.prev_pozo7         AS pozo7,
        curr.prev_pozo11        AS pozo11,
        curr.prev_pozo_12       AS pozo_12,
        curr.prev_pozo_14       AS pozo_14
) prev
-- Excluir la primera lectura de cada mes (no tiene lectura anterior)
WHERE curr.prev_general_pozos IS NOT NULL
ORDER BY curr.id;

-- ====================================================================
-- Verificar resultados
-- ====================================================================
-- SELECT COUNT(*) AS total_insertados FROM public.lecturas_diarias_consumo;

-- Ver una muestra de los datos insertados:
-- SELECT id, mes_anio, dia_hora, consumo, general_pozos, pozo_3, pozo_8
-- FROM public.lecturas_diarias_consumo
-- ORDER BY id
-- LIMIT 20;

-- Comparar con lecturas_diarias originales:
-- SELECT 
--     ld.id AS lectura_id,
--     ld.mes_anio,
--     ld.dia_hora,
--     ld.general_pozos AS lectura_actual,
--     LAG(ld.general_pozos) OVER (PARTITION BY ld.mes_anio ORDER BY ld.id) AS lectura_anterior,
--     ldc.general_pozos AS consumo_calculado
-- FROM public.lecturas_diarias ld
-- LEFT JOIN public.lecturas_diarias_consumo ldc 
--     ON ldc.mes_anio = ld.mes_anio AND ldc.dia_hora = ld.dia_hora
-- ORDER BY ld.id
-- LIMIT 20;
