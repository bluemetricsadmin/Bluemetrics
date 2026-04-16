-- ====================================================================
-- Script SQL para crear la tabla lecturas_diarias_consumo
-- ====================================================================
-- Generado para almacenar registros de consumo de lecturas diarias de agua
-- Compatible con PostgreSQL/Supabase
-- ====================================================================

-- Eliminar tabla si existe (¡CUIDADO! Esto borrará todos los datos)
-- DROP TABLE IF EXISTS public.lecturas_diarias_consumo CASCADE;

-- Crear la tabla
CREATE TABLE IF NOT EXISTS public.lecturas_diarias_consumo (
    id BIGSERIAL PRIMARY KEY,
    mes_anio VARCHAR(50),
    mes VARCHAR(20),
    anio VARCHAR(10),
    dia_hora VARCHAR(50),
    consumo DECIMAL(12,2),
    general_pozos DECIMAL(12,2),
    pozo_3 DECIMAL(12,2),
    pozo_8 DECIMAL(12,2),
    pozo_15 DECIMAL(12,2),
    pozo_4 DECIMAL(12,2),
    a_y_d DECIMAL(12,2),
    campus_8 DECIMAL(12,2),
    a7_cc DECIMAL(12,2),
    megacentral DECIMAL(12,2),
    planta_fisica DECIMAL(12,2),
    residencias DECIMAL(12,2),
    pozo7 DECIMAL(12,2),
    pozo11 DECIMAL(12,2),
    pozo_12 DECIMAL(12,2),
    pozo_14 DECIMAL(12,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- Índices para optimizar consultas
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_lecturas_diarias_consumo_mes_anio 
    ON public.lecturas_diarias_consumo(mes_anio);

CREATE INDEX IF NOT EXISTS idx_lecturas_diarias_consumo_mes 
    ON public.lecturas_diarias_consumo(mes);

CREATE INDEX IF NOT EXISTS idx_lecturas_diarias_consumo_anio 
    ON public.lecturas_diarias_consumo(anio);

CREATE INDEX IF NOT EXISTS idx_lecturas_diarias_consumo_dia_hora 
    ON public.lecturas_diarias_consumo(dia_hora);

CREATE INDEX IF NOT EXISTS idx_lecturas_diarias_consumo_created_at 
    ON public.lecturas_diarias_consumo(created_at DESC);

-- ====================================================================
-- Comentarios sobre la tabla y columnas
-- ====================================================================
COMMENT ON TABLE public.lecturas_diarias_consumo IS 
    'Tabla de registros de consumo de lecturas diarias de agua de pozos y diferentes zonas del campus';

COMMENT ON COLUMN public.lecturas_diarias_consumo.id IS 
    'Identificador único autoincrementable';

COMMENT ON COLUMN public.lecturas_diarias_consumo.mes_anio IS 
    'Mes y año de la lectura (ej: "mayo 2022", "junio 2023")';

COMMENT ON COLUMN public.lecturas_diarias_consumo.mes IS 
    'Mes de la lectura (ej: "febrero", "mayo")';

COMMENT ON COLUMN public.lecturas_diarias_consumo.anio IS 
    'Año de la lectura (ej: "2024", "2025")';

COMMENT ON COLUMN public.lecturas_diarias_consumo.dia_hora IS 
    'Día y hora de la lectura (ej: "Lun01 09:00", "Mar02 9:00")';

COMMENT ON COLUMN public.lecturas_diarias_consumo.consumo IS 
    'Consumo registrado en el período';

COMMENT ON COLUMN public.lecturas_diarias_consumo.general_pozos IS 
    'Lectura general de pozos (medidor principal)';

COMMENT ON COLUMN public.lecturas_diarias_consumo.pozo_3 IS 
    'Lectura acumulada del pozo 3';

COMMENT ON COLUMN public.lecturas_diarias_consumo.pozo_8 IS 
    'Lectura acumulada del pozo 8';

COMMENT ON COLUMN public.lecturas_diarias_consumo.pozo_15 IS 
    'Lectura acumulada del pozo 15';

COMMENT ON COLUMN public.lecturas_diarias_consumo.pozo_4 IS 
    'Lectura acumulada del pozo 4';

COMMENT ON COLUMN public.lecturas_diarias_consumo.a_y_d IS 
    'Lectura de zona A y D';

COMMENT ON COLUMN public.lecturas_diarias_consumo.campus_8 IS 
    'Lectura de Campus 8';

COMMENT ON COLUMN public.lecturas_diarias_consumo.a7_cc IS 
    'Lectura de A7-CC';

COMMENT ON COLUMN public.lecturas_diarias_consumo.megacentral IS 
    'Lectura de Megacentral';

COMMENT ON COLUMN public.lecturas_diarias_consumo.planta_fisica IS 
    'Lectura de Planta Física';

COMMENT ON COLUMN public.lecturas_diarias_consumo.residencias IS 
    'Lectura de Residencias';

COMMENT ON COLUMN public.lecturas_diarias_consumo.pozo7 IS 
    'Lectura acumulada del pozo 7';

COMMENT ON COLUMN public.lecturas_diarias_consumo.pozo11 IS 
    'Lectura acumulada del pozo 11';

COMMENT ON COLUMN public.lecturas_diarias_consumo.pozo_12 IS 
    'Lectura acumulada del pozo 12';

COMMENT ON COLUMN public.lecturas_diarias_consumo.pozo_14 IS 
    'Lectura acumulada del pozo 14';

COMMENT ON COLUMN public.lecturas_diarias_consumo.created_at IS 
    'Fecha y hora de creación del registro';

COMMENT ON COLUMN public.lecturas_diarias_consumo.updated_at IS 
    'Fecha y hora de última actualización del registro';

-- ====================================================================
-- Trigger para actualizar updated_at automáticamente
-- ====================================================================
-- Reutiliza la función update_updated_at_column() si ya existe
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_lecturas_diarias_consumo_updated_at ON public.lecturas_diarias_consumo;

CREATE TRIGGER update_lecturas_diarias_consumo_updated_at
    BEFORE UPDATE ON public.lecturas_diarias_consumo
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ====================================================================
-- Fin del script
-- ====================================================================
COMMIT;
