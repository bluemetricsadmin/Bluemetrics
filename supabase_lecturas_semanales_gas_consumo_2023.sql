-- Tabla para el CONSUMO semanal de gas del año 2023
CREATE TABLE IF NOT EXISTS public.lecturas_semanales_gas_consumo_2023 (
    id BIGSERIAL PRIMARY KEY,
    numero_semana INTEGER NOT NULL UNIQUE,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    
    -- Acometidas Principales Campus
    campus_acometida_principal_digital DECIMAL(15, 3),
    campus_acometida_principal_analogica DECIMAL(15, 3),
    
    -- Edificios Culturales
    domo_cultural DECIMAL(15, 3),
    
    -- Comedores y Restaurantes
    comedor_centrales_tec_food DECIMAL(15, 3),
    dona_tota DECIMAL(15, 3),
    chilaquiles_tec DECIMAL(15, 3),
    carls_junior DECIMAL(15, 3),
    centrales_local DECIMAL(15, 3),
    davilas_grill_team DECIMAL(15, 3),
    pizza_little_caesars DECIMAL(15, 3),
    
    -- Edificios Académicos
    biotecnologia DECIMAL(15, 3),
    
    -- Calderas y Sistemas de Calefacción
    caldera_1_leon DECIMAL(15, 3),
    mega_calefaccion_1 DECIMAL(15, 3),
    mega_calefaccion_2 DECIMAL(15, 3),
    mega_calefaccion_3 DECIMAL(15, 3),
    mega_calefaccion_4 DECIMAL(15, 3),
    mega_calefaccion_5 DECIMAL(15, 3),
    
    -- CIAP y Restaurantes
    ciap_super_salads DECIMAL(15, 3),
    
    -- Aulas y Edificios Académicos
    aulas_1 DECIMAL(15, 3),
    biblioteca DECIMAL(15, 3),
    nikkori DECIMAL(15, 3),
    nectar_works DECIMAL(15, 3),
    sr_latino DECIMAL(15, 3),
    
    -- Instalaciones Deportivas
    arena_borrego DECIMAL(15, 3),
    
    -- Sistemas de Calefacción Adicionales
    calefaccion_1_bryan DECIMAL(15, 3),
    calefaccion_2_aerco DECIMAL(15, 3),
    
    -- Calderas
    caldera_3 DECIMAL(15, 3),
    aulas_7 DECIMAL(15, 3),
    la_dia DECIMAL(15, 3),
    aulas_4 DECIMAL(15, 3),
    centro_congresos_vestidores DECIMAL(15, 3),
    jubileo DECIMAL(15, 3),
    
    -- Expedition
    expedition DECIMAL(15, 3),
    bread_expedition DECIMAL(15, 3),
    matthew_expedition DECIMAL(15, 3),
    
    -- Residencias Estudiantiles
    estudiantes_acometida_principal_digital DECIMAL(15, 3),
    estudiantes_acometida_principal_analogico DECIMAL(15, 3),
    
    -- CEDES
    cedes DECIMAL(15, 3),
    cedes_trabajadores_vestidores DECIMAL(15, 3),
    caldera_2 DECIMAL(15, 3),
    comedor_estudiantes DECIMAL(15, 3),
    
    -- Residencias
    residencias_4 DECIMAL(15, 3),
    residencias_1 DECIMAL(15, 3),
    residencias_2 DECIMAL(15, 3),
    residencias_5 DECIMAL(15, 3),
    residencias_8 DECIMAL(15, 3),
    residencias_7 DECIMAL(15, 3),
    residencias_3 DECIMAL(15, 3),
    residencias_abc_calefaccion DECIMAL(15, 3),
    residencias_abc_regaderas DECIMAL(15, 3),
    residencias_abc_locales_comida DECIMAL(15, 3),
    
    -- Campus Norte
    campus_norte_acometida_externa DECIMAL(15, 3),
    campus_norte_acometida_interna DECIMAL(15, 3),
    campus_norte_comedor_d DECIMAL(15, 3),
    campus_norte_edificio_d_calefaccion DECIMAL(15, 3),
    
    -- Estadio Borrego
    estadio_borrego_acometida_digital DECIMAL(15, 3),
    estadio_borrego_acometida_analogica DECIMAL(15, 3),
    estadio_yarda DECIMAL(15, 3),
    
    -- Wellness
    wellness_acometida_digital DECIMAL(15, 3),
    wellness_acometida_analogica DECIMAL(15, 3),
    wellness_supersalads DECIMAL(15, 3),
    wellness_general_calefaccion DECIMAL(15, 3),
    wellness_calentador_sotano_regaderas DECIMAL(15, 3),
    wellness_alberca DECIMAL(15, 3),
    
    -- Otros Edificios
    auditorio_luis_elizondo DECIMAL(15, 3),
    pabellon_tec_semillero DECIMAL(15, 3),
    pabellon_tec_cocina_estudiantes_2do_piso DECIMAL(15, 3),
    guarderia DECIMAL(15, 3),
    escamilla DECIMAL(15, 3),
    casa_solar DECIMAL(15, 3),
    estudiantes_11 DECIMAL(15, 3),
    estudiantes_12 DECIMAL(15, 3),
    estudiantes_13 DECIMAL(15, 3),
    estudiantes_15_y_10 DECIMAL(15, 3),
    cdb1 DECIMAL(15, 3),
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_lecturas_gas_consumo_2023_numero_semana ON public.lecturas_semanales_gas_consumo_2023(numero_semana);
CREATE INDEX IF NOT EXISTS idx_lecturas_gas_consumo_2023_fecha_inicio ON public.lecturas_semanales_gas_consumo_2023(fecha_inicio);
CREATE INDEX IF NOT EXISTS idx_lecturas_gas_consumo_2023_fecha_fin ON public.lecturas_semanales_gas_consumo_2023(fecha_fin);

-- Crear trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_lecturas_gas_consumo_2023_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_lecturas_gas_consumo_2023_updated_at
    BEFORE UPDATE ON public.lecturas_semanales_gas_consumo_2023
    FOR EACH ROW
    EXECUTE FUNCTION update_lecturas_gas_consumo_2023_updated_at();

-- Comentarios para documentación
COMMENT ON TABLE public.lecturas_semanales_gas_consumo_2023 IS 'Consumo semanal de gas del campus - Año 2023';
COMMENT ON COLUMN public.lecturas_semanales_gas_consumo_2023.numero_semana IS 'Número de semana del año (1-52)';
COMMENT ON COLUMN public.lecturas_semanales_gas_consumo_2023.fecha_inicio IS 'Fecha de inicio de la semana';
COMMENT ON COLUMN public.lecturas_semanales_gas_consumo_2023.fecha_fin IS 'Fecha de fin de la semana';
