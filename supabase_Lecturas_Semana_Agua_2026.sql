-- Tabla para registrar las lecturas semanales de agua del año 2026
CREATE TABLE IF NOT EXISTS public.Lecturas_Semana_Agua_2026 (
    -- Identificador de la semana
    L_id SERIAL PRIMARY KEY,
    L_numero_semana INTEGER NOT NULL UNIQUE,
    L_fecha_inicio DATE NOT NULL,
    L_fecha_fin DATE NOT NULL,
    
    -- Metadata
    L_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    L_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Medidor General y Pozos de Agua Potable
    L_medidor_general_pozos DECIMAL(10, 2),
    L_pozo_11 DECIMAL(10, 2),
    L_pozo_14 DECIMAL(10, 2),
    L_pozo_12 DECIMAL(10, 2),
    L_pozo_7 DECIMAL(10, 2),
    L_pozo_3 DECIMAL(10, 2),
    
    -- Pozos de Riego
    L_pozo_4_riego DECIMAL(10, 2),
    L_pozo_8_riego DECIMAL(10, 2),
    L_pozo_15_riego DECIMAL(10, 2),
    
    -- Circuito 8" Campus
    L_circuito_8_campus DECIMAL(10, 2),
    L_auditorio_luis_elizondo DECIMAL(10, 2),
    L_cdb2 DECIMAL(10, 2),
    L_cdb2_banos_nuevos_2025 DECIMAL(10, 2),
    L_arena_borrego DECIMAL(10, 2),
    L_edificio_negocios_daf DECIMAL(10, 2),
    L_aulas_6 DECIMAL(10, 2),
    L_domo_cultural DECIMAL(10, 2),
    L_wellness_parque_central_tunel DECIMAL(10, 2),
    L_wellness_registro DECIMAL(10, 2),
    L_parque_central_registro DECIMAL(10, 2),
    L_wellness_edificio DECIMAL(10, 2),
    L_wellness_super_salads DECIMAL(10, 2),
    L_wellness_torre_enfriamiento DECIMAL(10, 2),
    L_wellness_alberca DECIMAL(10, 2),
    L_centrales_comedor_1_principal DECIMAL(10, 2),
    L_centrales_dona_tota DECIMAL(10, 2),
    L_centrales_subway DECIMAL(10, 2),
    L_centrales_carls_jr DECIMAL(10, 2),
    L_centrales_little_cesars DECIMAL(10, 2),
    L_centrales_grill_team DECIMAL(10, 2),
    L_centrales_chilaquiles DECIMAL(10, 2),
    L_centrales_tec_food DECIMAL(10, 2),
    L_centrales_oxxo DECIMAL(10, 2),
    L_comedor_central_tunel DECIMAL(10, 2),
    L_administrativo DECIMAL(10, 2),
    L_biotecnologia DECIMAL(10, 2),
    L_escuela_arte_caldera_1 DECIMAL(10, 2),
    L_ciap_oriente DECIMAL(10, 2),
    L_ciap_centro DECIMAL(10, 2),
    L_ciap_poniente DECIMAL(10, 2),
    L_ciap_green_shake DECIMAL(10, 2),
    L_ciap_andatti DECIMAL(10, 2),
    L_ciap_dc_jochos DECIMAL(10, 2),
    L_aulas_5 DECIMAL(10, 2),
    L_ciap_starbucks DECIMAL(10, 2),
    L_ciap_super_salads DECIMAL(10, 2),
    L_ciap_sotano DECIMAL(10, 2),
    L_reflexion DECIMAL(10, 2),
    L_comedor_2_residencias_10_15 DECIMAL(10, 2),
    L_residencias_10_15 DECIMAL(10, 2),
    L_residencias_10_15_llenado DECIMAL(10, 2),
    L_comedor_2_caldera_2 DECIMAL(10, 2),
    L_la_choza DECIMAL(10, 2),
    L_cedes_cisterna DECIMAL(10, 2),
    L_cedes_site DECIMAL(10, 2),
    L_nucleo DECIMAL(10, 2),
    L_expedition DECIMAL(10, 2),
    L_expedition_bread DECIMAL(10, 2),
    L_expedition_matthew DECIMAL(10, 2),
    L_caffenio DECIMAL(10, 2),
    L_cedes_e2 DECIMAL(10, 2),
    L_aulas_1 DECIMAL(10, 2),
    L_rectoria_norte DECIMAL(10, 2),
    L_pabellon_la_carreta DECIMAL(10, 2),
    L_rectoria_sur DECIMAL(10, 2),
    L_aulas_2 DECIMAL(10, 2),
    L_cetec DECIMAL(10, 2),
    L_biblioteca DECIMAL(10, 2),
    L_biblioteca_nikkori DECIMAL(10, 2),
    L_biblioteca_nectar_works DECIMAL(10, 2),
    L_biblioteca_tim_horton DECIMAL(10, 2),
    L_biblioteca_starbucks DECIMAL(10, 2),
    L_aulas_3 DECIMAL(10, 2),
    L_basanti DECIMAL(10, 2),
    L_aulas_3_sr_latino DECIMAL(10, 2),
    L_aulas_3_starbucks DECIMAL(10, 2),
    L_centrales_sur DECIMAL(10, 2),
    L_aulas_4_norte DECIMAL(10, 2),
    
    -- Circuito 6" Residencias
    L_circuito_6_residencias DECIMAL(10, 2),
    L_residencias_1_antiguo DECIMAL(10, 2),
    L_residencias_2_ote DECIMAL(10, 2),
    L_residencias_2_pte DECIMAL(10, 2),
    L_residencias_3 DECIMAL(10, 2),
    L_residencias_4 DECIMAL(10, 2),
    L_residencias_5 DECIMAL(10, 2),
    L_residencias_7 DECIMAL(10, 2),
    L_residencias_8 DECIMAL(10, 2),
    L_correos DECIMAL(10, 2),
    L_alberca DECIMAL(10, 2),
    L_residencias_abc DECIMAL(10, 2),
    
    -- Circuito 4" A7-CE
    L_circuito_4_a7_ce DECIMAL(10, 2),
    L_aulas_7 DECIMAL(10, 2),
    L_cah3_torre_enfriamiento DECIMAL(10, 2),
    L_caldera_3 DECIMAL(10, 2),
    L_la_dia DECIMAL(10, 2),
    L_aulas_4_sur DECIMAL(10, 2),
    L_aulas_4_maestros DECIMAL(10, 2),
    L_centro_congresos DECIMAL(10, 2),
    L_jubileo DECIMAL(10, 2),
    L_aulas_4_oxxo DECIMAL(10, 2),
    
    -- Circuito Planta Física
    L_circuito_planta_fisica DECIMAL(10, 2),
    L_arquitectura_e1 DECIMAL(10, 2),
    L_arquitectura_anexo DECIMAL(10, 2),
    L_megacentral_te_2 DECIMAL(10, 2),
    L_escamilla_banos_trabajadores DECIMAL(10, 2),
    L_estadio_banorte DECIMAL(10, 2),
    L_estadio_banorte_te DECIMAL(10, 2),
    L_campus_norte_edificios_ciudad DECIMAL(10, 2),
    L_estadio_azul DECIMAL(10, 2),
    
    -- Circuito Megacentral
    L_circuito_megacentral DECIMAL(10, 2),
    L_megacentral_te_4 DECIMAL(10, 2),
    
    -- PTAR Riego
    L_ptar_riego DECIMAL(10, 2),
    L_pozo_4_riego_alt DECIMAL(10, 2),
    L_pozo_8_riego_alt DECIMAL(10, 2),
    L_pozo_15_riego_alt DECIMAL(10, 2),
    L_campus_norte_ciudad_riego DECIMAL(10, 2),
    L_comedor_d_ciudad DECIMAL(10, 2),
    
    -- Purgas y Evaporación
    L_estadio_banorte_purgas DECIMAL(10, 2),
    L_wellness_cisterna_pluvial_purgas DECIMAL(10, 2),
    L_wellness_suavizador_purga DECIMAL(10, 2),
    L_wellness_te_rebosadero DECIMAL(10, 2),
    L_wellness_te_purga DECIMAL(10, 2),
    L_cedes_tinaco_riego_pluvial DECIMAL(10, 2),
    L_megacentral_te_purgas DECIMAL(10, 2),
    L_megacentral_suavizador_purga DECIMAL(10, 2),
    L_cah3_te_purgas DECIMAL(10, 2),
    L_residencias_10_15_te_purga DECIMAL(10, 2),
    L_estadio_borrego_pluvial DECIMAL(10, 2),
    L_ciap_cisterna_pluvial DECIMAL(10, 2),
    
    -- Agua de Ciudad
    L_campo_soft_bol DECIMAL(10, 2),
    L_cedes_ciudad DECIMAL(10, 2),
    L_estacionamiento_e3 DECIMAL(10, 2),
    L_guarderia DECIMAL(10, 2),
    L_naranjos DECIMAL(10, 2),
    L_casa_solar DECIMAL(10, 2),
    L_escamilla_banos_alumnos DECIMAL(10, 2),
    L_residencias_11_ciudad DECIMAL(10, 2),
    L_residencias_12_ciudad DECIMAL(10, 2),
    L_residencias_13_1_ciudad DECIMAL(10, 2),
    L_residencias_13_2_ciudad DECIMAL(10, 2),
    L_residencias_13_3_ciudad DECIMAL(10, 2),
    L_residencias_15_sotano DECIMAL(10, 2),
    L_residencias_10_15_purga_no DECIMAL(10, 2),
    L_cdb1_jardineros DECIMAL(10, 2),
    L_edificio_d DECIMAL(10, 2),
    L_estadio_yarda DECIMAL(10, 2)
);

-- Índices
CREATE INDEX idx_Lecturas_Semana_Agua_2026_numero ON public.Lecturas_Semana_Agua_2026(L_numero_semana);
CREATE INDEX idx_Lecturas_Semana_Agua_2026_fechas ON public.Lecturas_Semana_Agua_2026(L_fecha_inicio, L_fecha_fin);

-- Función para actualizar L_updated_at
CREATE OR REPLACE FUNCTION update_Lecturas_Semana_Agua_2026_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.L_updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER trigger_update_Lecturas_Semana_Agua_2026_updated_at
    BEFORE UPDATE ON public.Lecturas_Semana_Agua_2026
    FOR EACH ROW
    EXECUTE FUNCTION update_Lecturas_Semana_Agua_2026_updated_at();

-- Comentarios
COMMENT ON TABLE public.Lecturas_Semana_Agua_2026 IS 'Lecturas semanales de agua - Año 2026';
COMMENT ON COLUMN public.Lecturas_Semana_Agua_2026.L_medidor_general_pozos IS 'Medidor General de los pozos 7, 12, 11 y 14 / TOTAL POZOS';

-- RLS
ALTER TABLE public.Lecturas_Semana_Agua_2026 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura a usuarios autenticados" 
    ON public.Lecturas_Semana_Agua_2026 FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir inserción a usuarios autenticados" 
    ON public.Lecturas_Semana_Agua_2026 FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Permitir actualización a usuarios autenticados" 
    ON public.Lecturas_Semana_Agua_2026 FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir eliminación a usuarios autenticados" 
    ON public.Lecturas_Semana_Agua_2026 FOR DELETE TO authenticated USING (true);

