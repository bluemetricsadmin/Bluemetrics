-- =====================================================
-- Migración: Tabla de Comentarios Semanales
-- Descripción: Comentarios del consumo semanal por recurso (agua/gas),
--              únicos por (semana, recurso) e independientes del punto de medición.
--              El autor es una FK al UUID de la sesión autenticada (profiles.id).
-- =====================================================

-- Crear tabla de comentarios semanales
CREATE TABLE IF NOT EXISTS public.weekly_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Clave del comentario (semana + recurso de medición)
  week_number INTEGER NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'agua',

  -- Contenido del comentario
  comment TEXT NOT NULL,

  -- Autor: FK al UUID de la sesión autenticada (profiles.id)
  author UUID REFERENCES public.profiles(id),

  -- Metadatos (timestamptz)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Índice único: un solo comentario por semana y recurso
  CONSTRAINT unique_weekly_comment UNIQUE (week_number, source_type)
);

-- Crear índices para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_weekly_comments_week_number
  ON public.weekly_comments(week_number);

CREATE INDEX IF NOT EXISTS idx_weekly_comments_source_type
  ON public.weekly_comments(source_type);

CREATE INDEX IF NOT EXISTS idx_weekly_comments_created_at
  ON public.weekly_comments(created_at DESC);

-- Comentarios en la tabla
COMMENT ON TABLE public.weekly_comments IS 'Comentarios del consumo semanal por recurso, sin importar el punto de medición';
COMMENT ON COLUMN public.weekly_comments.week_number IS 'Número de semana del consumo';
COMMENT ON COLUMN public.weekly_comments.source_type IS 'Recurso de medición: agua | gas';
COMMENT ON COLUMN public.weekly_comments.comment IS 'Texto del comentario';
COMMENT ON COLUMN public.weekly_comments.author IS 'UUID de la sesión autenticada (profiles.id) que creó el comentario';

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_weekly_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_weekly_comments_updated_at ON public.weekly_comments;
CREATE TRIGGER trigger_update_weekly_comments_updated_at
  BEFORE UPDATE ON public.weekly_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_weekly_comments_updated_at();

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.weekly_comments ENABLE ROW LEVEL SECURITY;

-- Política: Permitir lectura a todos los usuarios autenticados
CREATE POLICY "Permitir lectura de comentarios semanales a usuarios autenticados"
  ON public.weekly_comments
  FOR SELECT
  TO authenticated
  USING (true);

-- Política: Permitir inserción a todos los usuarios autenticados
CREATE POLICY "Permitir inserción de comentarios semanales a usuarios autenticados"
  ON public.weekly_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política: Permitir actualización a todos los usuarios autenticados
CREATE POLICY "Permitir actualización de comentarios semanales a usuarios autenticados"
  ON public.weekly_comments
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Política: Permitir eliminación a todos los usuarios autenticados
CREATE POLICY "Permitir eliminación de comentarios semanales a usuarios autenticados"
  ON public.weekly_comments
  FOR DELETE
  TO authenticated
  USING (true);

-- =====================================================
-- Fin de la migración
-- =====================================================