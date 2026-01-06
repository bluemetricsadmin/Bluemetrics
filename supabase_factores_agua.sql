-- ============================================================
-- TABLA DE FACTORES PARA LECTURAS DE AGUA
-- Archivo: supabase_factores_agua.sql
-- Descripción: Factores de conversión/multiplicación para cada medidor de agua
-- ============================================================

-- Crear tabla de factores de agua
CREATE TABLE IF NOT EXISTS public.Factores_agua (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL UNIQUE,
    factor DECIMAL(10, 2) NOT NULL DEFAULT 1.00
);

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_factores_agua_nombre ON Factores_agua(nombre);

-- Comentarios de tablaa
COMMENT ON TABLE Factores_agua IS 'Factores de conversión para cada punto de medición de agua';
COMMENT ON COLUMN Factores_agua.nombre IS 'Nombre del medidor (coincide con columnas de lecturas_semana2025)';
COMMENT ON COLUMN Factores_agua.factor IS 'Factor de multiplicación/conversión para el medidor';

-- Habilitar RLS (Row Level Security)
ALTER TABLE Factores_agua ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Allow public read access on Factores_agua" ON Factores_agua;
DROP POLICY IF EXISTS "Allow public insert access on Factores_agua" ON Factores_agua;
DROP POLICY IF EXISTS "Allow public update access on Factores_agua" ON Factores_agua;

-- Políticas de acceso público
CREATE POLICY "Allow public read access on Factores_agua"
    ON Factores_agua FOR SELECT
    USING (true);

CREATE POLICY "Allow public insert access on Factores_agua"
    ON Factores_agua FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public update access on Factores_agua"
    ON Factores_agua FOR UPDATE
    USING (true);

-- ============================================================
-- INSERTS DE FACTORES DE AGUA
-- ============================================================

BEGIN;

INSERT INTO public.Factores_agua (nombre, factor) VALUES
-- Pozos de Agua Potable
('medidor_general_pozos', 10.00),
('pozo_11', 1.00),
('pozo_14', 1.00),
('pozo_12', 1.00),
('pozo_7', 1.00),
('pozo_3', 1.00),

-- Pozos de Riego
('pozo_4_riego', 1.00),
('pozo_8_riego', 1.00),
('pozo_15_riego', 1.00),

-- Circuito 8" Campus
('circuito_8_campus', 10.00),
('auditorio_luis_elizondo', 1.00),
('cdb2', 1.00),
('cdb2_banos_nuevos_2024', 1.00),
('arena_borrego', 1.00),
('edificio_negocios_daf', 1.00),
('aulas_6', 1.00),
('domo_cultural', 1.00),
('wellness_parque_central_tunel', 1.00),
('wellness_registro', 1.00),
('parque_central_registro', 1.00),
('wellness_edificio', 1.00),
('wellness_super_salads', 1.00),
('wellness_torre_enfriamiento', 1.00),
('wellness_alberca', 1.00),
('centrales_comedor_1_principal', 1.00),
('centrales_dona_tota', 1.00),
('centrales_subway', 1.00),
('centrales_carls_jr', 1.00),
('centrales_little_cesars', 1.00),
('centrales_grill_team', 1.00),
('centrales_chilaquiles', 1.00),
('centrales_tec_food', 1.00),
('centrales_oxxo', 1.00),
('comedor_central_tunel', 1.00),
('administrativo', 1.00),
('biotecnologia', 1.00),
('escuela_arte_caldera_1', 1.00),
('ciap_oriente', 1.00),
('ciap_centro', 1.00),
('ciap_poniente', 1.00),
('ciap_green_shake', 1.00),
('ciap_andatti', 1.00),
('ciap_dc_jochos', 1.00),
('aulas_5', 1.00),
('ciap_starbucks', 1.00),
('ciap_super_salads', 1.00),
('ciap_sotano', 1.00),
('reflexion', 1.00),
('comedor_2_residencias_10_15', 1.00),
('residencias_10_15', 1.00),
('residencias_10_15_llenado', 1.00),
('comedor_2_caldera_2', 1.00),
('la_choza', 1.00),
('cedes_cisterna', 1.00),
('cedes_site', 1.00),
('nucleo', 1.00),
('expedition', 1.00),
('expedition_bread', 1.00),
('expedition_matthew', 1.00),
('cedes_e2', 1.00),
('aulas_1', 1.00),
('rectoria_norte', 1.00),
('pabellon_la_carreta', 1.00),
('rectoria_sur', 1.00),
('aulas_2', 1.00),
('cetec', 1.00),
('biblioteca', 1.00),
('biblioteca_nikkori', 1.00),
('biblioteca_nectar_works', 1.00),
('biblioteca_tim_horton', 1.00),
('biblioteca_starbucks', 1.00),
('aulas_3', 1.00),
('basanti', 1.00),
('aulas_3_sr_latino', 1.00),
('aulas_3_starbucks', 1.00),
('centrales_sur', 1.00),
('aulas_4_norte', 1.00),

-- Circuito 6" Residencias
('circuito_6_residencias', 10.00),
('residencias_1_antiguo', 1.00),
('residencias_2_ote', 1.00),
('residencias_2_pte', 1.00),
('residencias_3', 1.00),
('residencias_4', 1.00),
('residencias_5', 1.00),
('residencias_7', 1.00),
('residencias_8', 1.00),
('correos', 1.00),
('alberca', 1.00),
('residencias_abc', 1.00),

-- Circuito 4" A7-CE
('circuito_4_a7_ce', 1.00),
('aulas_7', 1.00),
('cah3_torre_enfriamiento', 1.00),
('caldera_3', 1.00),
('la_dia', 1.00),
('aulas_4_sur', 1.00),
('aulas_4_maestros', 1.00),
('centro_congresos', 1.00),
('jubileo', 1.00),
('aulas_4_oxxo', 1.00),

-- Circuito Planta Física
('circuito_planta_fisica', 1.00),
('arquitectura_e1', 1.00),
('arquitectura_anexo', 1.00),
('megacentral_te_2', 1.00),
('escamilla_banos_trabajadores', 1.00),
('estadio_banorte', 1.00),
('estadio_banorte_te', 1.00),
('campus_norte_edificios_ciudad', 1.00),
('estadio_azul', 1.00),

-- Circuito Megacentral
('circuito_megacentral', 1.00),
('megacentral_te_4', 1.00),

-- Riego PTAR
('ptar_riego', 1.00),
('pozo_4_riego_alt', 1.00),
('pozo_8_riego_alt', 1.00),
('pozo_15_riego_alt', 1.00),
('campus_norte_ciudad_riego', 1.00),
('comedor_d_ciudad', 1.00),

-- Purgas y Evaporación
('estadio_banorte_purgas', 1.00),
('wellness_cisterna_pluvial_purgas', 1.00),
('wellness_suavizador_purga', 1.00),
('wellness_te_rebosadero', 0.00),
('wellness_te_purga', 1.00),
('cedes_tinaco_riego_pluvial', 1.00),
('megacentral_te_purgas', 1.00),
('megacentral_suavizador_purga', 1.00),
('cah3_te_purgas', 1.00),
('residencias_10_15_te_purga', 1.00),
('estadio_borrego_pluvial', 1.00),
('ciap_cisterna_pluvial', 1.00),

-- Agua de Ciudad
('campo_soft_bol', 10.00),
('cedes_ciudad', 1.00),
('estacionamiento_e3', 1.00),
('guarderia', 1.00),
('naranjos', 1.00),
('casa_solar', 1.00),
('escamilla_banos_alumnos', 1.00),
('residencias_11_ciudad', 1.00),
('residencias_12_ciudad', 1.00),
('residencias_13_1_ciudad', 1.00),
('residencias_13_2_ciudad', 1.00),
('residencias_13_3_ciudad', 1.00),
('residencias_15_sotano', 1.00),
('residencias_10_15_purga_no', 1.00),
('cdb1_jardineros', 1.00),
('edificio_d', 1.00),
('estadio_yarda', 1.00)

ON CONFLICT (nombre) DO UPDATE SET
    factor = EXCLUDED.factor;

COMMIT;

-- ============================================================
-- VERIFICACIÓN
-- ============================================================

-- Ver total de factores insertados
SELECT COUNT(*) as total_factores FROM Factores_agua;

-- Ver factores agrupados por valor
SELECT factor, COUNT(*) as cantidad 
FROM Factores_agua 
GROUP BY factor 
ORDER BY factor DESC;

-- Ver todos los factores ordenados por nombre
SELECT nombre, factor
FROM Factores_agua 
ORDER BY nombre;
