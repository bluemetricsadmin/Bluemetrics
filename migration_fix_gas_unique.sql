-- Migration: Change UNIQUE(anio) → UNIQUE(anio, mes) in both monthly gas tables
-- Run this in Supabase SQL Editor BEFORE inserting the monthly data.

-- ============================================================
-- 1. lecturas_mensuales_gas
-- ============================================================

-- Drop the single-column unique constraint on anio
ALTER TABLE public.lecturas_mensuales_gas
    DROP CONSTRAINT IF EXISTS lecturas_mensuales_gas_anio_key;

-- Add composite unique constraint
ALTER TABLE public.lecturas_mensuales_gas
    ADD CONSTRAINT lecturas_mensuales_gas_anio_mes_key UNIQUE (anio, mes);

-- ============================================================
-- 2. lecturas_mensuales_gas_consumo
-- ============================================================

-- Drop the single-column unique constraint on anio
ALTER TABLE public.lecturas_mensuales_gas_consumo
    DROP CONSTRAINT IF EXISTS lecturas_mensuales_gas_consumo_anio_key;

-- Add composite unique constraint
ALTER TABLE public.lecturas_mensuales_gas_consumo
    ADD CONSTRAINT lecturas_mensuales_gas_consumo_anio_mes_key UNIQUE (anio, mes);
