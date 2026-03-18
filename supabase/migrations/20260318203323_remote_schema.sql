

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, full_name, company, role, avatar_url, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'company', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL),
    NOW()
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_bulk_data"("p_table_name" "text", "p_data" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
DECLARE
  rec JSONB;
BEGIN
  -- Iterar sobre cada registro en el array JSON
  FOR rec IN SELECT * FROM jsonb_array_elements(p_data)
  LOOP
    -- Insertar cada registro dinámicamente
    EXECUTE format(
      'INSERT INTO %I SELECT * FROM jsonb_populate_record(NULL::%I, $1)',
      p_table_name, p_table_name
    ) USING rec;
  END LOOP;
END;
$_$;


ALTER FUNCTION "public"."insert_bulk_data"("p_table_name" "text", "p_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_lecturas_gas_2023_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_lecturas_gas_2023_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_lecturas_gas_2024_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_lecturas_gas_2024_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_lecturas_gas_2025_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_lecturas_gas_2025_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_lecturas_gas_2026_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_lecturas_gas_2026_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_lecturas_gas_consumo_2026_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_lecturas_gas_consumo_2026_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_lecturas_semana2023_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_lecturas_semana2023_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_lecturas_semana2024_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_lecturas_semana2024_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_lecturas_semana_agua_2023_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.L_updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_lecturas_semana_agua_2023_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_lecturas_semana_agua_2024_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.L_updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_lecturas_semana_agua_2024_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_lecturas_semana_agua_2025_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.L_updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_lecturas_semana_agua_2025_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_lecturas_semana_agua_2026_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.L_updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_lecturas_semana_agua_2026_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_lecturas_semana_agua_consumo_2023_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.L_updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_lecturas_semana_agua_consumo_2023_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_lecturas_semana_agua_consumo_2024_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.L_updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_lecturas_semana_agua_consumo_2024_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_lecturas_semana_agua_consumo_2025_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.L_updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_lecturas_semana_agua_consumo_2025_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_lecturas_semana_agua_consumo_2026_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.L_updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_lecturas_semana_agua_consumo_2026_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_lecturas_semana_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_lecturas_semana_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_lecturas_semanales_agua2023_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.L_updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_lecturas_semanales_agua2023_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_lecturas_semanales_agua2024_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.L_updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_lecturas_semanales_agua2024_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_lecturas_semanales_agua2025_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.L_updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_lecturas_semanales_agua2025_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_reading_comments_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_reading_comments_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."correos" (
    "id" bigint NOT NULL,
    "remitente" "text" NOT NULL,
    "email" "text" NOT NULL,
    "telefono" "text",
    "empresa" "text",
    "asunto" "text" NOT NULL,
    "mensaje" "text",
    "leido" boolean DEFAULT false,
    "importante" boolean DEFAULT false,
    "categoria" "text" DEFAULT 'consulta'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."correos" OWNER TO "postgres";


COMMENT ON TABLE "public"."correos" IS 'Almacena los correos de contacto del formulario de la landing page';



COMMENT ON COLUMN "public"."correos"."id" IS 'Identificador único del correo';



COMMENT ON COLUMN "public"."correos"."remitente" IS 'Nombre completo del remitente';



COMMENT ON COLUMN "public"."correos"."email" IS 'Correo electrónico del remitente';



COMMENT ON COLUMN "public"."correos"."telefono" IS 'Teléfono de contacto (opcional)';



COMMENT ON COLUMN "public"."correos"."empresa" IS 'Empresa del remitente (opcional)';



COMMENT ON COLUMN "public"."correos"."asunto" IS 'Asunto del correo';



COMMENT ON COLUMN "public"."correos"."mensaje" IS 'Mensaje del correo';



COMMENT ON COLUMN "public"."correos"."leido" IS 'Indica si el correo ha sido leído';



COMMENT ON COLUMN "public"."correos"."importante" IS 'Indica si el correo está marcado como importante';



COMMENT ON COLUMN "public"."correos"."categoria" IS 'Categoría del correo (consulta, alerta, mantenimiento, etc.)';



COMMENT ON COLUMN "public"."correos"."created_at" IS 'Fecha y hora de creación del registro';



COMMENT ON COLUMN "public"."correos"."updated_at" IS 'Fecha y hora de la última actualización';



CREATE SEQUENCE IF NOT EXISTS "public"."correos_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."correos_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."correos_id_seq" OWNED BY "public"."correos"."id";



CREATE TABLE IF NOT EXISTS "public"."factores_agua" (
    "id" integer NOT NULL,
    "nombre" "text" NOT NULL,
    "factor" numeric(10,2) DEFAULT 1.00 NOT NULL
);


ALTER TABLE "public"."factores_agua" OWNER TO "postgres";


COMMENT ON TABLE "public"."factores_agua" IS 'Factores de conversión para cada punto de medición de agua';



COMMENT ON COLUMN "public"."factores_agua"."nombre" IS 'Nombre del medidor (coincide con columnas de lecturas_semana2025)';



COMMENT ON COLUMN "public"."factores_agua"."factor" IS 'Factor de multiplicación/conversión para el medidor';



CREATE SEQUENCE IF NOT EXISTS "public"."factores_agua_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."factores_agua_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."factores_agua_id_seq" OWNED BY "public"."factores_agua"."id";



CREATE TABLE IF NOT EXISTS "public"."lecturas_diarias" (
    "id" integer NOT NULL,
    "mes_anio" character varying(50),
    "dia_hora" character varying(50),
    "consumo" numeric(12,2),
    "general_pozos" numeric(12,2),
    "pozo_3" numeric(12,2),
    "pozo_8" numeric(12,2),
    "pozo_15" numeric(12,2),
    "pozo_4" numeric(12,2),
    "a_y_d" numeric(12,2),
    "campus_8" numeric(12,2),
    "a7_cc" numeric(12,2),
    "megacentral" numeric(12,2),
    "planta_fisica" numeric(12,2),
    "residencias" numeric(12,2),
    "pozo7" numeric(12,2),
    "pozo11" numeric(12,2),
    "pozo_12" numeric(12,2),
    "pozo_14" numeric(12,2),
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."lecturas_diarias" OWNER TO "postgres";


COMMENT ON TABLE "public"."lecturas_diarias" IS 'Tabla de lecturas diarias de consumo de agua de pozos y diferentes zonas';



COMMENT ON COLUMN "public"."lecturas_diarias"."mes_anio" IS 'Mes y año de la lectura';



COMMENT ON COLUMN "public"."lecturas_diarias"."dia_hora" IS 'Día y hora de la lectura';



COMMENT ON COLUMN "public"."lecturas_diarias"."consumo" IS 'Consumo registrado';



COMMENT ON COLUMN "public"."lecturas_diarias"."general_pozos" IS 'Lectura general de pozos';



COMMENT ON COLUMN "public"."lecturas_diarias"."pozo_3" IS 'Lectura del pozo 3';



COMMENT ON COLUMN "public"."lecturas_diarias"."pozo_8" IS 'Lectura del pozo 8';



COMMENT ON COLUMN "public"."lecturas_diarias"."pozo_15" IS 'Lectura del pozo 15';



COMMENT ON COLUMN "public"."lecturas_diarias"."pozo_4" IS 'Lectura del pozo 4';



COMMENT ON COLUMN "public"."lecturas_diarias"."a_y_d" IS 'Lectura de A y D';



COMMENT ON COLUMN "public"."lecturas_diarias"."campus_8" IS 'Lectura de Campus 8';



COMMENT ON COLUMN "public"."lecturas_diarias"."a7_cc" IS 'Lectura de A7-CC';



COMMENT ON COLUMN "public"."lecturas_diarias"."megacentral" IS 'Lectura de Megacentral';



COMMENT ON COLUMN "public"."lecturas_diarias"."planta_fisica" IS 'Lectura de Planta Física';



COMMENT ON COLUMN "public"."lecturas_diarias"."residencias" IS 'Lectura de Residencias';



COMMENT ON COLUMN "public"."lecturas_diarias"."pozo7" IS 'Lectura del pozo 7';



COMMENT ON COLUMN "public"."lecturas_diarias"."pozo11" IS 'Lectura del pozo 11';



COMMENT ON COLUMN "public"."lecturas_diarias"."pozo_12" IS 'Lectura del pozo 12';



COMMENT ON COLUMN "public"."lecturas_diarias"."pozo_14" IS 'Lectura del pozo 14';



CREATE SEQUENCE IF NOT EXISTS "public"."lecturas_diarias_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."lecturas_diarias_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."lecturas_diarias_id_seq" OWNED BY "public"."lecturas_diarias"."id";



CREATE TABLE IF NOT EXISTS "public"."lecturas_mensuales_agua" (
    "id" bigint NOT NULL,
    "anio" integer NOT NULL,
    "mes" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "l_medidor_general_pozos" numeric,
    "l_pozo_11" numeric,
    "l_pozo_14" numeric,
    "l_pozo_12" numeric,
    "l_pozo_7" numeric,
    "l_pozo_3" numeric,
    "l_pozo_4_riego" numeric,
    "l_pozo_8_riego" numeric,
    "l_pozo_15_riego" numeric,
    "l_circuito_8_campus" numeric,
    "l_auditorio_luis_elizondo" numeric,
    "l_cdb2" numeric,
    "l_cdb2_banos_nuevos_2025" numeric,
    "l_arena_borrego" numeric,
    "l_edificio_negocios_daf" numeric,
    "l_aulas_6" numeric,
    "l_domo_cultural" numeric,
    "l_wellness_parque_central_tunel" numeric,
    "l_wellness_registro" numeric,
    "l_parque_central_registro" numeric,
    "l_wellness_edificio" numeric,
    "l_wellness_super_salads" numeric,
    "l_wellness_torre_enfriamiento" numeric,
    "l_wellness_alberca" numeric,
    "l_centrales_comedor_1_principal" numeric,
    "l_centrales_dona_tota" numeric,
    "l_centrales_subway" numeric,
    "l_centrales_carls_jr" numeric,
    "l_centrales_little_cesars" numeric,
    "l_centrales_grill_team" numeric,
    "l_centrales_chilaquiles" numeric,
    "l_centrales_tec_food" numeric,
    "l_centrales_oxxo" numeric,
    "l_comedor_central_tunel" numeric,
    "l_administrativo" numeric,
    "l_biotecnologia" numeric,
    "l_escuela_arte_caldera_1" numeric,
    "l_ciap_oriente" numeric,
    "l_ciap_centro" numeric,
    "l_ciap_poniente" numeric,
    "l_ciap_green_shake" numeric,
    "l_ciap_andatti" numeric,
    "l_ciap_dc_jochos" numeric,
    "l_aulas_5" numeric,
    "l_ciap_starbucks" numeric,
    "l_ciap_super_salads" numeric,
    "l_ciap_sotano" numeric,
    "l_reflexion" numeric,
    "l_comedor_2_residencias_10_15" numeric,
    "l_residencias_10_15" numeric,
    "l_residencias_10_15_llenado" numeric,
    "l_comedor_2_caldera_2" numeric,
    "l_la_choza" numeric,
    "l_cedes_cisterna" numeric,
    "l_cedes_site" numeric,
    "l_nucleo" numeric,
    "l_expedition" numeric,
    "l_expedition_bread" numeric,
    "l_expedition_matthew" numeric,
    "l_cedes_e2" numeric,
    "l_aulas_1" numeric,
    "l_rectoria_norte" numeric,
    "l_pabellon_la_carreta" numeric,
    "l_rectoria_sur" numeric,
    "l_aulas_2" numeric,
    "l_cetec" numeric,
    "l_biblioteca" numeric,
    "l_biblioteca_nikkori" numeric,
    "l_biblioteca_nectar_works" numeric,
    "l_biblioteca_tim_horton" numeric,
    "l_biblioteca_starbucks" numeric,
    "l_aulas_3" numeric,
    "l_basanti" numeric,
    "l_aulas_3_sr_latino" numeric,
    "l_aulas_3_starbucks" numeric,
    "l_centrales_sur" numeric,
    "l_aulas_4_norte" numeric,
    "l_circuito_6_residencias" numeric,
    "l_residencias_1_antiguo" numeric,
    "l_residencias_2_ote" numeric,
    "l_residencias_2_pte" numeric,
    "l_residencias_3" numeric,
    "l_residencias_4" numeric,
    "l_residencias_5" numeric,
    "l_residencias_7" numeric,
    "l_residencias_8" numeric,
    "l_correos" numeric,
    "l_alberca" numeric,
    "l_residencias_abc" numeric,
    "l_circuito_4_a7_ce" numeric,
    "l_aulas_7" numeric,
    "l_cah3_torre_enfriamiento" numeric,
    "l_caldera_3" numeric,
    "l_la_dia" numeric,
    "l_aulas_4_sur" numeric,
    "l_aulas_4_maestros" numeric,
    "l_centro_congresos" numeric,
    "l_jubileo" numeric,
    "l_aulas_4_oxxo" numeric,
    "l_circuito_planta_fisica" numeric,
    "l_arquitectura_e1" numeric,
    "l_arquitectura_anexo" numeric,
    "l_megacentral_te_2" numeric,
    "l_escamilla_banos_trabajadores" numeric,
    "l_estadio_banorte" numeric,
    "l_estadio_banorte_te" numeric,
    "l_campus_norte_edificios_ciudad" numeric,
    "l_estadio_azul" numeric,
    "l_circuito_megacentral" numeric,
    "l_megacentral_te_4" numeric,
    "l_ptar_riego" numeric,
    "l_pozo_4_riego_alt" numeric,
    "l_pozo_8_riego_alt" numeric,
    "l_pozo_15_riego_alt" numeric,
    "l_campus_norte_ciudad_riego" numeric,
    "l_comedor_d_ciudad" numeric,
    "l_estadio_banorte_purgas" numeric,
    "l_wellness_cisterna_pluvial_purgas" numeric,
    "l_wellness_suavizador_purga" numeric,
    "l_wellness_te_rebosadero" numeric,
    "l_wellness_te_purga" numeric,
    "l_cedes_tinaco_riego_pluvial" numeric,
    "l_megacentral_te_purgas" numeric,
    "l_megacentral_suavizador_purga" numeric,
    "l_cah3_te_purgas" numeric,
    "l_residencias_10_15_te_purga" numeric,
    "l_estadio_borrego_pluvial" numeric,
    "l_ciap_cisterna_pluvial" numeric,
    "l_campo_soft_bol" numeric,
    "l_cedes_ciudad" numeric,
    "l_estacionamiento_e3" numeric,
    "l_guarderia" numeric,
    "l_naranjos" numeric,
    "l_casa_solar" numeric,
    "l_escamilla_banos_alumnos" numeric,
    "l_residencias_11_ciudad" numeric,
    "l_residencias_12_ciudad" numeric,
    "l_residencias_13_1_ciudad" numeric,
    "l_residencias_13_2_ciudad" numeric,
    "l_residencias_13_3_ciudad" numeric,
    "l_residencias_15_sotano" numeric,
    "l_residencias_10_15_purga_no" numeric,
    "l_cdb1_jardineros" numeric,
    "l_edificio_d" numeric,
    "l_estadio_yarda" numeric,
    "l_farnville" numeric,
    "l_em_box" numeric,
    "l_crepaso" numeric,
    "l_el_negro" numeric,
    "l_e2_beiker" numeric,
    "l_e2_evobike" numeric,
    "l_e2_pancho_de_rigo" numeric,
    "l_e2_bebedero_nube" numeric,
    "l_residencias_abc_lavanderia" numeric,
    "l_estacionamiento_e1" numeric,
    "l_caffenio" numeric,
    CONSTRAINT "lecturas_mensuales_agua_mes_check" CHECK ((("mes" >= 1) AND ("mes" <= 12)))
);


ALTER TABLE "public"."lecturas_mensuales_agua" OWNER TO "postgres";


COMMENT ON TABLE "public"."lecturas_mensuales_agua" IS 'Lecturas mensuales de medidores de agua del campus - Tabla multi-año';



CREATE TABLE IF NOT EXISTS "public"."lecturas_mensuales_agua_consumo" (
    "id" bigint NOT NULL,
    "anio" integer NOT NULL,
    "mes" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "l_medidor_general_pozos" numeric,
    "l_pozo_11" numeric,
    "l_pozo_14" numeric,
    "l_pozo_12" numeric,
    "l_pozo_7" numeric,
    "l_pozo_3" numeric,
    "l_pozo_4_riego" numeric,
    "l_pozo_8_riego" numeric,
    "l_pozo_15_riego" numeric,
    "l_circuito_8_campus" numeric,
    "l_auditorio_luis_elizondo" numeric,
    "l_cdb2" numeric,
    "l_cdb2_banos_nuevos_2025" numeric,
    "l_arena_borrego" numeric,
    "l_edificio_negocios_daf" numeric,
    "l_aulas_6" numeric,
    "l_domo_cultural" numeric,
    "l_wellness_parque_central_tunel" numeric,
    "l_wellness_registro" numeric,
    "l_parque_central_registro" numeric,
    "l_wellness_edificio" numeric,
    "l_wellness_super_salads" numeric,
    "l_wellness_torre_enfriamiento" numeric,
    "l_wellness_alberca" numeric,
    "l_centrales_comedor_1_principal" numeric,
    "l_centrales_dona_tota" numeric,
    "l_centrales_subway" numeric,
    "l_centrales_carls_jr" numeric,
    "l_centrales_little_cesars" numeric,
    "l_centrales_grill_team" numeric,
    "l_centrales_chilaquiles" numeric,
    "l_centrales_tec_food" numeric,
    "l_centrales_oxxo" numeric,
    "l_comedor_central_tunel" numeric,
    "l_administrativo" numeric,
    "l_biotecnologia" numeric,
    "l_escuela_arte_caldera_1" numeric,
    "l_ciap_oriente" numeric,
    "l_ciap_centro" numeric,
    "l_ciap_poniente" numeric,
    "l_ciap_green_shake" numeric,
    "l_ciap_andatti" numeric,
    "l_ciap_dc_jochos" numeric,
    "l_aulas_5" numeric,
    "l_ciap_starbucks" numeric,
    "l_ciap_super_salads" numeric,
    "l_ciap_sotano" numeric,
    "l_reflexion" numeric,
    "l_comedor_2_residencias_10_15" numeric,
    "l_residencias_10_15" numeric,
    "l_residencias_10_15_llenado" numeric,
    "l_comedor_2_caldera_2" numeric,
    "l_la_choza" numeric,
    "l_cedes_cisterna" numeric,
    "l_cedes_site" numeric,
    "l_nucleo" numeric,
    "l_expedition" numeric,
    "l_expedition_bread" numeric,
    "l_expedition_matthew" numeric,
    "l_cedes_e2" numeric,
    "l_aulas_1" numeric,
    "l_rectoria_norte" numeric,
    "l_pabellon_la_carreta" numeric,
    "l_rectoria_sur" numeric,
    "l_aulas_2" numeric,
    "l_cetec" numeric,
    "l_biblioteca" numeric,
    "l_biblioteca_nikkori" numeric,
    "l_biblioteca_nectar_works" numeric,
    "l_biblioteca_tim_horton" numeric,
    "l_biblioteca_starbucks" numeric,
    "l_aulas_3" numeric,
    "l_basanti" numeric,
    "l_aulas_3_sr_latino" numeric,
    "l_aulas_3_starbucks" numeric,
    "l_centrales_sur" numeric,
    "l_aulas_4_norte" numeric,
    "l_circuito_6_residencias" numeric,
    "l_residencias_1_antiguo" numeric,
    "l_residencias_2_ote" numeric,
    "l_residencias_2_pte" numeric,
    "l_residencias_3" numeric,
    "l_residencias_4" numeric,
    "l_residencias_5" numeric,
    "l_residencias_7" numeric,
    "l_residencias_8" numeric,
    "l_correos" numeric,
    "l_alberca" numeric,
    "l_residencias_abc" numeric,
    "l_circuito_4_a7_ce" numeric,
    "l_aulas_7" numeric,
    "l_cah3_torre_enfriamiento" numeric,
    "l_caldera_3" numeric,
    "l_la_dia" numeric,
    "l_aulas_4_sur" numeric,
    "l_aulas_4_maestros" numeric,
    "l_centro_congresos" numeric,
    "l_jubileo" numeric,
    "l_aulas_4_oxxo" numeric,
    "l_circuito_planta_fisica" numeric,
    "l_arquitectura_e1" numeric,
    "l_arquitectura_anexo" numeric,
    "l_megacentral_te_2" numeric,
    "l_escamilla_banos_trabajadores" numeric,
    "l_estadio_banorte" numeric,
    "l_estadio_banorte_te" numeric,
    "l_campus_norte_edificios_ciudad" numeric,
    "l_estadio_azul" numeric,
    "l_circuito_megacentral" numeric,
    "l_megacentral_te_4" numeric,
    "l_ptar_riego" numeric,
    "l_pozo_4_riego_alt" numeric,
    "l_pozo_8_riego_alt" numeric,
    "l_pozo_15_riego_alt" numeric,
    "l_campus_norte_ciudad_riego" numeric,
    "l_comedor_d_ciudad" numeric,
    "l_estadio_banorte_purgas" numeric,
    "l_wellness_cisterna_pluvial_purgas" numeric,
    "l_wellness_suavizador_purga" numeric,
    "l_wellness_te_rebosadero" numeric,
    "l_wellness_te_purga" numeric,
    "l_cedes_tinaco_riego_pluvial" numeric,
    "l_megacentral_te_purgas" numeric,
    "l_megacentral_suavizador_purga" numeric,
    "l_cah3_te_purgas" numeric,
    "l_residencias_10_15_te_purga" numeric,
    "l_estadio_borrego_pluvial" numeric,
    "l_ciap_cisterna_pluvial" numeric,
    "l_campo_soft_bol" numeric,
    "l_cedes_ciudad" numeric,
    "l_estacionamiento_e3" numeric,
    "l_guarderia" numeric,
    "l_naranjos" numeric,
    "l_casa_solar" numeric,
    "l_escamilla_banos_alumnos" numeric,
    "l_residencias_11_ciudad" numeric,
    "l_residencias_12_ciudad" numeric,
    "l_residencias_13_1_ciudad" numeric,
    "l_residencias_13_2_ciudad" numeric,
    "l_residencias_13_3_ciudad" numeric,
    "l_residencias_15_sotano" numeric,
    "l_residencias_10_15_purga_no" numeric,
    "l_cdb1_jardineros" numeric,
    "l_edificio_d" numeric,
    "l_estadio_yarda" numeric,
    "l_farnville" numeric,
    "l_em_box" numeric,
    "l_crepaso" numeric,
    "l_el_negro" numeric,
    "l_e2_beiker" numeric,
    "l_e2_evobike" numeric,
    "l_e2_pancho_de_rigo" numeric,
    "l_e2_bebedero_nube" numeric,
    "l_residencias_abc_lavanderia" numeric,
    "l_estacionamiento_e1" numeric,
    "l_caffenio" numeric,
    CONSTRAINT "lecturas_mensuales_agua_consumo_mes_check" CHECK ((("mes" >= 1) AND ("mes" <= 12)))
);


ALTER TABLE "public"."lecturas_mensuales_agua_consumo" OWNER TO "postgres";


COMMENT ON TABLE "public"."lecturas_mensuales_agua_consumo" IS 'Consumo mensual calculado de medidores de agua del campus - Tabla multi-año';



CREATE SEQUENCE IF NOT EXISTS "public"."lecturas_mensuales_agua_consumo_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."lecturas_mensuales_agua_consumo_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."lecturas_mensuales_agua_consumo_id_seq" OWNED BY "public"."lecturas_mensuales_agua_consumo"."id";



CREATE SEQUENCE IF NOT EXISTS "public"."lecturas_mensuales_agua_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."lecturas_mensuales_agua_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."lecturas_mensuales_agua_id_seq" OWNED BY "public"."lecturas_mensuales_agua"."id";



CREATE TABLE IF NOT EXISTS "public"."lecturas_ptar" (
    "id" bigint NOT NULL,
    "fecha" "date" NOT NULL,
    "hora" character varying(20),
    "medidor_entrada" numeric(12,2),
    "medidor_salida" numeric(12,2),
    "ar" numeric(12,2),
    "at" numeric(12,2),
    "recirculacion" numeric(12,2),
    "total_dia" numeric(12,2),
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."lecturas_ptar" OWNER TO "postgres";


COMMENT ON TABLE "public"."lecturas_ptar" IS 'Lecturas diarias de la Planta de Tratamiento de Aguas Residuales (PTAR) - Todos los años';



COMMENT ON COLUMN "public"."lecturas_ptar"."id" IS 'Identificador único autoincremental';



COMMENT ON COLUMN "public"."lecturas_ptar"."fecha" IS 'Fecha de la lectura (formato: YYYY-MM-DD)';



COMMENT ON COLUMN "public"."lecturas_ptar"."hora" IS 'Hora de la lectura (formato: HH:MM AM/PM)';



COMMENT ON COLUMN "public"."lecturas_ptar"."medidor_entrada" IS 'Lectura del medidor de entrada de agua (m³)';



COMMENT ON COLUMN "public"."lecturas_ptar"."medidor_salida" IS 'Lectura del medidor de salida de agua (m³)';



COMMENT ON COLUMN "public"."lecturas_ptar"."ar" IS 'Agua Residual del día (m³)';



COMMENT ON COLUMN "public"."lecturas_ptar"."at" IS 'Agua Tratada del día (m³)';



COMMENT ON COLUMN "public"."lecturas_ptar"."recirculacion" IS 'Agua de recirculación (m³)';



COMMENT ON COLUMN "public"."lecturas_ptar"."total_dia" IS 'Total de agua procesada en el día (m³)';



COMMENT ON COLUMN "public"."lecturas_ptar"."created_at" IS 'Fecha de creación del registro';



COMMENT ON COLUMN "public"."lecturas_ptar"."updated_at" IS 'Fecha de última actualización del registro';



CREATE SEQUENCE IF NOT EXISTS "public"."lecturas_ptar_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."lecturas_ptar_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."lecturas_ptar_id_seq" OWNED BY "public"."lecturas_ptar"."id";



CREATE TABLE IF NOT EXISTS "public"."lecturas_semana_agua_2023" (
    "l_id" integer NOT NULL,
    "l_numero_semana" integer NOT NULL,
    "l_fecha_inicio" "date" NOT NULL,
    "l_fecha_fin" "date" NOT NULL,
    "l_created_at" timestamp with time zone DEFAULT "now"(),
    "l_updated_at" timestamp with time zone DEFAULT "now"(),
    "l_medidor_general_pozos" numeric(10,2),
    "l_pozo_11" numeric(10,2),
    "l_pozo_14" numeric(10,2),
    "l_pozo_12" numeric(10,2),
    "l_pozo_7" numeric(10,2),
    "l_pozo_3" numeric(10,2),
    "l_pozo_4_riego" numeric(10,2),
    "l_pozo_8_riego" numeric(10,2),
    "l_pozo_15_riego" numeric(10,2),
    "l_circuito_8_campus" numeric(10,2),
    "l_auditorio_luis_elizondo" numeric(10,2),
    "l_cdb2" numeric(10,2),
    "l_cdb2_banos_nuevos_2025" numeric(10,2),
    "l_arena_borrego" numeric(10,2),
    "l_edificio_negocios_daf" numeric(10,2),
    "l_aulas_6" numeric(10,2),
    "l_domo_cultural" numeric(10,2),
    "l_wellness_parque_central_tunel" numeric(10,2),
    "l_wellness_registro" numeric(10,2),
    "l_parque_central_registro" numeric(10,2),
    "l_wellness_edificio" numeric(10,2),
    "l_wellness_super_salads" numeric(10,2),
    "l_wellness_torre_enfriamiento" numeric(10,2),
    "l_wellness_alberca" numeric(10,2),
    "l_centrales_comedor_1_principal" numeric(10,2),
    "l_centrales_dona_tota" numeric(10,2),
    "l_centrales_subway" numeric(10,2),
    "l_centrales_carls_jr" numeric(10,2),
    "l_centrales_little_cesars" numeric(10,2),
    "l_centrales_grill_team" numeric(10,2),
    "l_centrales_chilaquiles" numeric(10,2),
    "l_centrales_tec_food" numeric(10,2),
    "l_centrales_oxxo" numeric(10,2),
    "l_comedor_central_tunel" numeric(10,2),
    "l_administrativo" numeric(10,2),
    "l_biotecnologia" numeric(10,2),
    "l_escuela_arte_caldera_1" numeric(10,2),
    "l_ciap_oriente" numeric(10,2),
    "l_ciap_centro" numeric(10,2),
    "l_ciap_poniente" numeric(10,2),
    "l_ciap_green_shake" numeric(10,2),
    "l_ciap_andatti" numeric(10,2),
    "l_ciap_dc_jochos" numeric(10,2),
    "l_aulas_5" numeric(10,2),
    "l_ciap_starbucks" numeric(10,2),
    "l_ciap_super_salads" numeric(10,2),
    "l_ciap_sotano" numeric(10,2),
    "l_reflexion" numeric(10,2),
    "l_comedor_2_residencias_10_15" numeric(10,2),
    "l_residencias_10_15" numeric(10,2),
    "l_residencias_10_15_llenado" numeric(10,2),
    "l_comedor_2_caldera_2" numeric(10,2),
    "l_la_choza" numeric(10,2),
    "l_cedes_cisterna" numeric(10,2),
    "l_cedes_site" numeric(10,2),
    "l_nucleo" numeric(10,2),
    "l_expedition" numeric(10,2),
    "l_expedition_bread" numeric(10,2),
    "l_expedition_matthew" numeric(10,2),
    "l_cedes_e2" numeric(10,2),
    "l_aulas_1" numeric(10,2),
    "l_rectoria_norte" numeric(10,2),
    "l_pabellon_la_carreta" numeric(10,2),
    "l_rectoria_sur" numeric(10,2),
    "l_aulas_2" numeric(10,2),
    "l_cetec" numeric(10,2),
    "l_biblioteca" numeric(10,2),
    "l_biblioteca_nikkori" numeric(10,2),
    "l_biblioteca_nectar_works" numeric(10,2),
    "l_biblioteca_tim_horton" numeric(10,2),
    "l_biblioteca_starbucks" numeric(10,2),
    "l_aulas_3" numeric(10,2),
    "l_basanti" numeric(10,2),
    "l_aulas_3_sr_latino" numeric(10,2),
    "l_aulas_3_starbucks" numeric(10,2),
    "l_centrales_sur" numeric(10,2),
    "l_aulas_4_norte" numeric(10,2),
    "l_circuito_6_residencias" numeric(10,2),
    "l_residencias_1_antiguo" numeric(10,2),
    "l_residencias_2_ote" numeric(10,2),
    "l_residencias_2_pte" numeric(10,2),
    "l_residencias_3" numeric(10,2),
    "l_residencias_4" numeric(10,2),
    "l_residencias_5" numeric(10,2),
    "l_residencias_7" numeric(10,2),
    "l_residencias_8" numeric(10,2),
    "l_correos" numeric(10,2),
    "l_alberca" numeric(10,2),
    "l_residencias_abc" numeric(10,2),
    "l_circuito_4_a7_ce" numeric(10,2),
    "l_aulas_7" numeric(10,2),
    "l_cah3_torre_enfriamiento" numeric(10,2),
    "l_caldera_3" numeric(10,2),
    "l_la_dia" numeric(10,2),
    "l_aulas_4_sur" numeric(10,2),
    "l_aulas_4_maestros" numeric(10,2),
    "l_centro_congresos" numeric(10,2),
    "l_jubileo" numeric(10,2),
    "l_aulas_4_oxxo" numeric(10,2),
    "l_circuito_planta_fisica" numeric(10,2),
    "l_arquitectura_e1" numeric(10,2),
    "l_arquitectura_anexo" numeric(10,2),
    "l_megacentral_te_2" numeric(10,2),
    "l_escamilla_banos_trabajadores" numeric(10,2),
    "l_estadio_banorte" numeric(10,2),
    "l_estadio_banorte_te" numeric(10,2),
    "l_campus_norte_edificios_ciudad" numeric(10,2),
    "l_estadio_azul" numeric(10,2),
    "l_circuito_megacentral" numeric(10,2),
    "l_megacentral_te_4" numeric(10,2),
    "l_ptar_riego" numeric(10,2),
    "l_pozo_4_riego_alt" numeric(10,2),
    "l_pozo_8_riego_alt" numeric(10,2),
    "l_pozo_15_riego_alt" numeric(10,2),
    "l_campus_norte_ciudad_riego" numeric(10,2),
    "l_comedor_d_ciudad" numeric(10,2),
    "l_estadio_banorte_purgas" numeric(10,2),
    "l_wellness_cisterna_pluvial_purgas" numeric(10,2),
    "l_wellness_suavizador_purga" numeric(10,2),
    "l_wellness_te_rebosadero" numeric(10,2),
    "l_wellness_te_purga" numeric(10,2),
    "l_cedes_tinaco_riego_pluvial" numeric(10,2),
    "l_megacentral_te_purgas" numeric(10,2),
    "l_megacentral_suavizador_purga" numeric(10,2),
    "l_cah3_te_purgas" numeric(10,2),
    "l_residencias_10_15_te_purga" numeric(10,2),
    "l_estadio_borrego_pluvial" numeric(10,2),
    "l_ciap_cisterna_pluvial" numeric(10,2),
    "l_campo_soft_bol" numeric(10,2),
    "l_cedes_ciudad" numeric(10,2),
    "l_estacionamiento_e3" numeric(10,2),
    "l_guarderia" numeric(10,2),
    "l_naranjos" numeric(10,2),
    "l_casa_solar" numeric(10,2),
    "l_escamilla_banos_alumnos" numeric(10,2),
    "l_residencias_11_ciudad" numeric(10,2),
    "l_residencias_12_ciudad" numeric(10,2),
    "l_residencias_13_1_ciudad" numeric(10,2),
    "l_residencias_13_2_ciudad" numeric(10,2),
    "l_residencias_13_3_ciudad" numeric(10,2),
    "l_residencias_15_sotano" numeric(10,2),
    "l_residencias_10_15_purga_no" numeric(10,2),
    "l_cdb1_jardineros" numeric(10,2),
    "l_edificio_d" numeric(10,2),
    "l_estadio_yarda" numeric(10,2)
);


ALTER TABLE "public"."lecturas_semana_agua_2023" OWNER TO "postgres";


COMMENT ON TABLE "public"."lecturas_semana_agua_2023" IS 'Lecturas semanales de agua - Año 2023';



COMMENT ON COLUMN "public"."lecturas_semana_agua_2023"."l_medidor_general_pozos" IS 'Medidor General de los pozos 7, 12, 11 y 14 / TOTAL POZOS';



CREATE SEQUENCE IF NOT EXISTS "public"."lecturas_semana_agua_2023_l_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."lecturas_semana_agua_2023_l_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."lecturas_semana_agua_2023_l_id_seq" OWNED BY "public"."lecturas_semana_agua_2023"."l_id";



CREATE TABLE IF NOT EXISTS "public"."lecturas_semana_agua_2024" (
    "l_id" integer NOT NULL,
    "l_numero_semana" integer NOT NULL,
    "l_fecha_inicio" "date" NOT NULL,
    "l_fecha_fin" "date" NOT NULL,
    "l_created_at" timestamp with time zone DEFAULT "now"(),
    "l_updated_at" timestamp with time zone DEFAULT "now"(),
    "l_medidor_general_pozos" numeric(10,2),
    "l_pozo_11" numeric(10,2),
    "l_pozo_14" numeric(10,2),
    "l_pozo_12" numeric(10,2),
    "l_pozo_7" numeric(10,2),
    "l_pozo_3" numeric(10,2),
    "l_pozo_4_riego" numeric(10,2),
    "l_pozo_8_riego" numeric(10,2),
    "l_pozo_15_riego" numeric(10,2),
    "l_circuito_8_campus" numeric(10,2),
    "l_auditorio_luis_elizondo" numeric(10,2),
    "l_cdb2" numeric(10,2),
    "l_cdb2_banos_nuevos_2025" numeric(10,2),
    "l_arena_borrego" numeric(10,2),
    "l_edificio_negocios_daf" numeric(10,2),
    "l_aulas_6" numeric(10,2),
    "l_domo_cultural" numeric(10,2),
    "l_wellness_parque_central_tunel" numeric(10,2),
    "l_wellness_registro" numeric(10,2),
    "l_parque_central_registro" numeric(10,2),
    "l_wellness_edificio" numeric(10,2),
    "l_wellness_super_salads" numeric(10,2),
    "l_wellness_torre_enfriamiento" numeric(10,2),
    "l_wellness_alberca" numeric(10,2),
    "l_centrales_comedor_1_principal" numeric(10,2),
    "l_centrales_dona_tota" numeric(10,2),
    "l_centrales_subway" numeric(10,2),
    "l_centrales_carls_jr" numeric(10,2),
    "l_centrales_little_cesars" numeric(10,2),
    "l_centrales_grill_team" numeric(10,2),
    "l_centrales_chilaquiles" numeric(10,2),
    "l_centrales_tec_food" numeric(10,2),
    "l_centrales_oxxo" numeric(10,2),
    "l_comedor_central_tunel" numeric(10,2),
    "l_administrativo" numeric(10,2),
    "l_biotecnologia" numeric(10,2),
    "l_escuela_arte_caldera_1" numeric(10,2),
    "l_ciap_oriente" numeric(10,2),
    "l_ciap_centro" numeric(10,2),
    "l_ciap_poniente" numeric(10,2),
    "l_ciap_green_shake" numeric(10,2),
    "l_ciap_andatti" numeric(10,2),
    "l_ciap_dc_jochos" numeric(10,2),
    "l_aulas_5" numeric(10,2),
    "l_ciap_starbucks" numeric(10,2),
    "l_ciap_super_salads" numeric(10,2),
    "l_ciap_sotano" numeric(10,2),
    "l_reflexion" numeric(10,2),
    "l_comedor_2_residencias_10_15" numeric(10,2),
    "l_residencias_10_15" numeric(10,2),
    "l_residencias_10_15_llenado" numeric(10,2),
    "l_comedor_2_caldera_2" numeric(10,2),
    "l_la_choza" numeric(10,2),
    "l_cedes_cisterna" numeric(10,2),
    "l_cedes_site" numeric(10,2),
    "l_nucleo" numeric(10,2),
    "l_expedition" numeric(10,2),
    "l_expedition_bread" numeric(10,2),
    "l_expedition_matthew" numeric(10,2),
    "l_cedes_e2" numeric(10,2),
    "l_aulas_1" numeric(10,2),
    "l_rectoria_norte" numeric(10,2),
    "l_pabellon_la_carreta" numeric(10,2),
    "l_rectoria_sur" numeric(10,2),
    "l_aulas_2" numeric(10,2),
    "l_cetec" numeric(10,2),
    "l_biblioteca" numeric(10,2),
    "l_biblioteca_nikkori" numeric(10,2),
    "l_biblioteca_nectar_works" numeric(10,2),
    "l_biblioteca_tim_horton" numeric(10,2),
    "l_biblioteca_starbucks" numeric(10,2),
    "l_aulas_3" numeric(10,2),
    "l_basanti" numeric(10,2),
    "l_aulas_3_sr_latino" numeric(10,2),
    "l_aulas_3_starbucks" numeric(10,2),
    "l_centrales_sur" numeric(10,2),
    "l_aulas_4_norte" numeric(10,2),
    "l_circuito_6_residencias" numeric(10,2),
    "l_residencias_1_antiguo" numeric(10,2),
    "l_residencias_2_ote" numeric(10,2),
    "l_residencias_2_pte" numeric(10,2),
    "l_residencias_3" numeric(10,2),
    "l_residencias_4" numeric(10,2),
    "l_residencias_5" numeric(10,2),
    "l_residencias_7" numeric(10,2),
    "l_residencias_8" numeric(10,2),
    "l_correos" numeric(10,2),
    "l_alberca" numeric(10,2),
    "l_residencias_abc" numeric(10,2),
    "l_circuito_4_a7_ce" numeric(10,2),
    "l_aulas_7" numeric(10,2),
    "l_cah3_torre_enfriamiento" numeric(10,2),
    "l_caldera_3" numeric(10,2),
    "l_la_dia" numeric(10,2),
    "l_aulas_4_sur" numeric(10,2),
    "l_aulas_4_maestros" numeric(10,2),
    "l_centro_congresos" numeric(10,2),
    "l_jubileo" numeric(10,2),
    "l_aulas_4_oxxo" numeric(10,2),
    "l_circuito_planta_fisica" numeric(10,2),
    "l_arquitectura_e1" numeric(10,2),
    "l_arquitectura_anexo" numeric(10,2),
    "l_megacentral_te_2" numeric(10,2),
    "l_escamilla_banos_trabajadores" numeric(10,2),
    "l_estadio_banorte" numeric(10,2),
    "l_estadio_banorte_te" numeric(10,2),
    "l_campus_norte_edificios_ciudad" numeric(10,2),
    "l_estadio_azul" numeric(10,2),
    "l_circuito_megacentral" numeric(10,2),
    "l_megacentral_te_4" numeric(10,2),
    "l_ptar_riego" numeric(10,2),
    "l_pozo_4_riego_alt" numeric(10,2),
    "l_pozo_8_riego_alt" numeric(10,2),
    "l_pozo_15_riego_alt" numeric(10,2),
    "l_campus_norte_ciudad_riego" numeric(10,2),
    "l_comedor_d_ciudad" numeric(10,2),
    "l_estadio_banorte_purgas" numeric(10,2),
    "l_wellness_cisterna_pluvial_purgas" numeric(10,2),
    "l_wellness_suavizador_purga" numeric(10,2),
    "l_wellness_te_rebosadero" numeric(10,2),
    "l_wellness_te_purga" numeric(10,2),
    "l_cedes_tinaco_riego_pluvial" numeric(10,2),
    "l_megacentral_te_purgas" numeric(10,2),
    "l_megacentral_suavizador_purga" numeric(10,2),
    "l_cah3_te_purgas" numeric(10,2),
    "l_residencias_10_15_te_purga" numeric(10,2),
    "l_estadio_borrego_pluvial" numeric(10,2),
    "l_ciap_cisterna_pluvial" numeric(10,2),
    "l_campo_soft_bol" numeric(10,2),
    "l_cedes_ciudad" numeric(10,2),
    "l_estacionamiento_e3" numeric(10,2),
    "l_guarderia" numeric(10,2),
    "l_naranjos" numeric(10,2),
    "l_casa_solar" numeric(10,2),
    "l_escamilla_banos_alumnos" numeric(10,2),
    "l_residencias_11_ciudad" numeric(10,2),
    "l_residencias_12_ciudad" numeric(10,2),
    "l_residencias_13_1_ciudad" numeric(10,2),
    "l_residencias_13_2_ciudad" numeric(10,2),
    "l_residencias_13_3_ciudad" numeric(10,2),
    "l_residencias_15_sotano" numeric(10,2),
    "l_residencias_10_15_purga_no" numeric(10,2),
    "l_cdb1_jardineros" numeric(10,2),
    "l_edificio_d" numeric(10,2),
    "l_estadio_yarda" numeric(10,2)
);


ALTER TABLE "public"."lecturas_semana_agua_2024" OWNER TO "postgres";


COMMENT ON TABLE "public"."lecturas_semana_agua_2024" IS 'Lecturas semanales de agua - Año 2024';



COMMENT ON COLUMN "public"."lecturas_semana_agua_2024"."l_medidor_general_pozos" IS 'Medidor General de los pozos 7, 12, 11 y 14 / TOTAL POZOS';



CREATE SEQUENCE IF NOT EXISTS "public"."lecturas_semana_agua_2024_l_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."lecturas_semana_agua_2024_l_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."lecturas_semana_agua_2024_l_id_seq" OWNED BY "public"."lecturas_semana_agua_2024"."l_id";



CREATE TABLE IF NOT EXISTS "public"."lecturas_semana_agua_2025" (
    "l_id" integer NOT NULL,
    "l_numero_semana" integer NOT NULL,
    "l_fecha_inicio" "date" NOT NULL,
    "l_fecha_fin" "date" NOT NULL,
    "l_created_at" timestamp with time zone DEFAULT "now"(),
    "l_updated_at" timestamp with time zone DEFAULT "now"(),
    "l_medidor_general_pozos" numeric(10,2),
    "l_pozo_11" numeric(10,2),
    "l_pozo_14" numeric(10,2),
    "l_pozo_12" numeric(10,2),
    "l_pozo_7" numeric(10,2),
    "l_pozo_3" numeric(10,2),
    "l_pozo_4_riego" numeric(10,2),
    "l_pozo_8_riego" numeric(10,2),
    "l_pozo_15_riego" numeric(10,2),
    "l_circuito_8_campus" numeric(10,2),
    "l_auditorio_luis_elizondo" numeric(10,2),
    "l_cdb2" numeric(10,2),
    "l_cdb2_banos_nuevos_2025" numeric(10,2),
    "l_arena_borrego" numeric(10,2),
    "l_edificio_negocios_daf" numeric(10,2),
    "l_aulas_6" numeric(10,2),
    "l_domo_cultural" numeric(10,2),
    "l_wellness_parque_central_tunel" numeric(10,2),
    "l_wellness_registro" numeric(10,2),
    "l_parque_central_registro" numeric(10,2),
    "l_wellness_edificio" numeric(10,2),
    "l_wellness_super_salads" numeric(10,2),
    "l_wellness_torre_enfriamiento" numeric(10,2),
    "l_wellness_alberca" numeric(10,2),
    "l_centrales_comedor_1_principal" numeric(10,2),
    "l_centrales_dona_tota" numeric(10,2),
    "l_centrales_subway" numeric(10,2),
    "l_centrales_carls_jr" numeric(10,2),
    "l_centrales_little_cesars" numeric(10,2),
    "l_centrales_grill_team" numeric(10,2),
    "l_centrales_chilaquiles" numeric(10,2),
    "l_centrales_tec_food" numeric(10,2),
    "l_centrales_oxxo" numeric(10,2),
    "l_comedor_central_tunel" numeric(10,2),
    "l_administrativo" numeric(10,2),
    "l_biotecnologia" numeric(10,2),
    "l_escuela_arte_caldera_1" numeric(10,2),
    "l_ciap_oriente" numeric(10,2),
    "l_ciap_centro" numeric(10,2),
    "l_ciap_poniente" numeric(10,2),
    "l_ciap_green_shake" numeric(10,2),
    "l_ciap_andatti" numeric(10,2),
    "l_ciap_dc_jochos" numeric(10,2),
    "l_aulas_5" numeric(10,2),
    "l_ciap_starbucks" numeric(10,2),
    "l_ciap_super_salads" numeric(10,2),
    "l_ciap_sotano" numeric(10,2),
    "l_reflexion" numeric(10,2),
    "l_comedor_2_residencias_10_15" numeric(10,2),
    "l_residencias_10_15" numeric(10,2),
    "l_residencias_10_15_llenado" numeric(10,2),
    "l_comedor_2_caldera_2" numeric(10,2),
    "l_la_choza" numeric(10,2),
    "l_cedes_cisterna" numeric(10,2),
    "l_cedes_site" numeric(10,2),
    "l_nucleo" numeric(10,2),
    "l_expedition" numeric(10,2),
    "l_expedition_bread" numeric(10,2),
    "l_expedition_matthew" numeric(10,2),
    "l_cedes_e2" numeric(10,2),
    "l_aulas_1" numeric(10,2),
    "l_rectoria_norte" numeric(10,2),
    "l_pabellon_la_carreta" numeric(10,2),
    "l_rectoria_sur" numeric(10,2),
    "l_aulas_2" numeric(10,2),
    "l_cetec" numeric(10,2),
    "l_biblioteca" numeric(10,2),
    "l_biblioteca_nikkori" numeric(10,2),
    "l_biblioteca_nectar_works" numeric(10,2),
    "l_biblioteca_tim_horton" numeric(10,2),
    "l_biblioteca_starbucks" numeric(10,2),
    "l_aulas_3" numeric(10,2),
    "l_basanti" numeric(10,2),
    "l_aulas_3_sr_latino" numeric(10,2),
    "l_aulas_3_starbucks" numeric(10,2),
    "l_centrales_sur" numeric(10,2),
    "l_aulas_4_norte" numeric(10,2),
    "l_circuito_6_residencias" numeric(10,2),
    "l_residencias_1_antiguo" numeric(10,2),
    "l_residencias_2_ote" numeric(10,2),
    "l_residencias_2_pte" numeric(10,2),
    "l_residencias_3" numeric(10,2),
    "l_residencias_4" numeric(10,2),
    "l_residencias_5" numeric(10,2),
    "l_residencias_7" numeric(10,2),
    "l_residencias_8" numeric(10,2),
    "l_correos" numeric(10,2),
    "l_alberca" numeric(10,2),
    "l_residencias_abc" numeric(10,2),
    "l_circuito_4_a7_ce" numeric(10,2),
    "l_aulas_7" numeric(10,2),
    "l_cah3_torre_enfriamiento" numeric(10,2),
    "l_caldera_3" numeric(10,2),
    "l_la_dia" numeric(10,2),
    "l_aulas_4_sur" numeric(10,2),
    "l_aulas_4_maestros" numeric(10,2),
    "l_centro_congresos" numeric(10,2),
    "l_jubileo" numeric(10,2),
    "l_aulas_4_oxxo" numeric(10,2),
    "l_circuito_planta_fisica" numeric(10,2),
    "l_arquitectura_e1" numeric(10,2),
    "l_arquitectura_anexo" numeric(10,2),
    "l_megacentral_te_2" numeric(10,2),
    "l_escamilla_banos_trabajadores" numeric(10,2),
    "l_estadio_banorte" numeric(10,2),
    "l_estadio_banorte_te" numeric(10,2),
    "l_campus_norte_edificios_ciudad" numeric(10,2),
    "l_estadio_azul" numeric(10,2),
    "l_circuito_megacentral" numeric(10,2),
    "l_megacentral_te_4" numeric(10,2),
    "l_ptar_riego" numeric(10,2),
    "l_pozo_4_riego_alt" numeric(10,2),
    "l_pozo_8_riego_alt" numeric(10,2),
    "l_pozo_15_riego_alt" numeric(10,2),
    "l_campus_norte_ciudad_riego" numeric(10,2),
    "l_comedor_d_ciudad" numeric(10,2),
    "l_estadio_banorte_purgas" numeric(10,2),
    "l_wellness_cisterna_pluvial_purgas" numeric(10,2),
    "l_wellness_suavizador_purga" numeric(10,2),
    "l_wellness_te_rebosadero" numeric(10,2),
    "l_wellness_te_purga" numeric(10,2),
    "l_cedes_tinaco_riego_pluvial" numeric(10,2),
    "l_megacentral_te_purgas" numeric(10,2),
    "l_megacentral_suavizador_purga" numeric(10,2),
    "l_cah3_te_purgas" numeric(10,2),
    "l_residencias_10_15_te_purga" numeric(10,2),
    "l_estadio_borrego_pluvial" numeric(10,2),
    "l_ciap_cisterna_pluvial" numeric(10,2),
    "l_campo_soft_bol" numeric(10,2),
    "l_cedes_ciudad" numeric(10,2),
    "l_estacionamiento_e3" numeric(10,2),
    "l_guarderia" numeric(10,2),
    "l_naranjos" numeric(10,2),
    "l_casa_solar" numeric(10,2),
    "l_escamilla_banos_alumnos" numeric(10,2),
    "l_residencias_11_ciudad" numeric(10,2),
    "l_residencias_12_ciudad" numeric(10,2),
    "l_residencias_13_1_ciudad" numeric(10,2),
    "l_residencias_13_2_ciudad" numeric(10,2),
    "l_residencias_13_3_ciudad" numeric(10,2),
    "l_residencias_15_sotano" numeric(10,2),
    "l_farnville" numeric(10,2),
    "l_em_box" numeric(10,2),
    "l_crepaso" numeric(10,2),
    "l_el_negro" numeric(10,2),
    "l_e2_beiker" numeric(10,2),
    "l_e2_evobike" numeric(10,2),
    "l_e2_pancho_de_rigo" numeric(10,2),
    "l_e2_bebedero_nube" numeric(10,2),
    "l_residencias_abc_lavanderia" numeric(10,2),
    "l_estacionamiento_e1" numeric(10,2)
);


ALTER TABLE "public"."lecturas_semana_agua_2025" OWNER TO "postgres";


COMMENT ON TABLE "public"."lecturas_semana_agua_2025" IS 'Lecturas semanales de agua - Año 2025';



COMMENT ON COLUMN "public"."lecturas_semana_agua_2025"."l_medidor_general_pozos" IS 'Medidor General de los pozos 7, 12, 11 y 14 / TOTAL POZOS';



CREATE SEQUENCE IF NOT EXISTS "public"."lecturas_semana_agua_2025_l_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."lecturas_semana_agua_2025_l_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."lecturas_semana_agua_2025_l_id_seq" OWNED BY "public"."lecturas_semana_agua_2025"."l_id";



CREATE TABLE IF NOT EXISTS "public"."lecturas_semana_agua_2026" (
    "l_id" integer NOT NULL,
    "l_numero_semana" integer NOT NULL,
    "l_fecha_inicio" "date" NOT NULL,
    "l_fecha_fin" "date" NOT NULL,
    "l_created_at" timestamp with time zone DEFAULT "now"(),
    "l_updated_at" timestamp with time zone DEFAULT "now"(),
    "l_medidor_general_pozos" numeric(10,2),
    "l_pozo_11" numeric(10,2),
    "l_pozo_14" numeric(10,2),
    "l_pozo_12" numeric(10,2),
    "l_pozo_7" numeric(10,2),
    "l_pozo_3" numeric(10,2),
    "l_pozo_4_riego" numeric(10,2),
    "l_pozo_8_riego" numeric(10,2),
    "l_pozo_15_riego" numeric(10,2),
    "l_circuito_8_campus" numeric(10,2),
    "l_auditorio_luis_elizondo" numeric(10,2),
    "l_cdb2" numeric(10,2),
    "l_cdb2_banos_nuevos_2025" numeric(10,2),
    "l_arena_borrego" numeric(10,2),
    "l_edificio_negocios_daf" numeric(10,2),
    "l_aulas_6" numeric(10,2),
    "l_domo_cultural" numeric(10,2),
    "l_wellness_parque_central_tunel" numeric(10,2),
    "l_wellness_registro" numeric(10,2),
    "l_parque_central_registro" numeric(10,2),
    "l_wellness_edificio" numeric(10,2),
    "l_wellness_super_salads" numeric(10,2),
    "l_wellness_torre_enfriamiento" numeric(10,2),
    "l_wellness_alberca" numeric(10,2),
    "l_centrales_comedor_1_principal" numeric(10,2),
    "l_centrales_dona_tota" numeric(10,2),
    "l_centrales_subway" numeric(10,2),
    "l_centrales_carls_jr" numeric(10,2),
    "l_centrales_little_cesars" numeric(10,2),
    "l_centrales_grill_team" numeric(10,2),
    "l_centrales_chilaquiles" numeric(10,2),
    "l_centrales_tec_food" numeric(10,2),
    "l_centrales_oxxo" numeric(10,2),
    "l_comedor_central_tunel" numeric(10,2),
    "l_administrativo" numeric(10,2),
    "l_biotecnologia" numeric(10,2),
    "l_escuela_arte_caldera_1" numeric(10,2),
    "l_ciap_oriente" numeric(10,2),
    "l_ciap_centro" numeric(10,2),
    "l_ciap_poniente" numeric(10,2),
    "l_ciap_green_shake" numeric(10,2),
    "l_ciap_andatti" numeric(10,2),
    "l_ciap_dc_jochos" numeric(10,2),
    "l_aulas_5" numeric(10,2),
    "l_ciap_starbucks" numeric(10,2),
    "l_ciap_super_salads" numeric(10,2),
    "l_ciap_sotano" numeric(10,2),
    "l_reflexion" numeric(10,2),
    "l_comedor_2_residencias_10_15" numeric(10,2),
    "l_residencias_10_15" numeric(10,2),
    "l_residencias_10_15_llenado" numeric(10,2),
    "l_comedor_2_caldera_2" numeric(10,2),
    "l_la_choza" numeric(10,2),
    "l_cedes_cisterna" numeric(10,2),
    "l_cedes_site" numeric(10,2),
    "l_nucleo" numeric(10,2),
    "l_expedition" numeric(10,2),
    "l_expedition_bread" numeric(10,2),
    "l_expedition_matthew" numeric(10,2),
    "l_cedes_e2" numeric(10,2),
    "l_aulas_1" numeric(10,2),
    "l_rectoria_norte" numeric(10,2),
    "l_pabellon_la_carreta" numeric(10,2),
    "l_rectoria_sur" numeric(10,2),
    "l_aulas_2" numeric(10,2),
    "l_cetec" numeric(10,2),
    "l_biblioteca" numeric(10,2),
    "l_biblioteca_nikkori" numeric(10,2),
    "l_biblioteca_nectar_works" numeric(10,2),
    "l_biblioteca_tim_horton" numeric(10,2),
    "l_biblioteca_starbucks" numeric(10,2),
    "l_aulas_3" numeric(10,2),
    "l_basanti" numeric(10,2),
    "l_aulas_3_sr_latino" numeric(10,2),
    "l_aulas_3_starbucks" numeric(10,2),
    "l_centrales_sur" numeric(10,2),
    "l_aulas_4_norte" numeric(10,2),
    "l_circuito_6_residencias" numeric(10,2),
    "l_residencias_1_antiguo" numeric(10,2),
    "l_residencias_2_ote" numeric(10,2),
    "l_residencias_2_pte" numeric(10,2),
    "l_residencias_3" numeric(10,2),
    "l_residencias_4" numeric(10,2),
    "l_residencias_5" numeric(10,2),
    "l_residencias_7" numeric(10,2),
    "l_residencias_8" numeric(10,2),
    "l_correos" numeric(10,2),
    "l_alberca" numeric(10,2),
    "l_residencias_abc" numeric(10,2),
    "l_circuito_4_a7_ce" numeric(10,2),
    "l_aulas_7" numeric(10,2),
    "l_cah3_torre_enfriamiento" numeric(10,2),
    "l_caldera_3" numeric(10,2),
    "l_la_dia" numeric(10,2),
    "l_aulas_4_sur" numeric(10,2),
    "l_aulas_4_maestros" numeric(10,2),
    "l_centro_congresos" numeric(10,2),
    "l_jubileo" numeric(10,2),
    "l_aulas_4_oxxo" numeric(10,2),
    "l_circuito_planta_fisica" numeric(10,2),
    "l_arquitectura_e1" numeric(10,2),
    "l_arquitectura_anexo" numeric(10,2),
    "l_megacentral_te_2" numeric(10,2),
    "l_escamilla_banos_trabajadores" numeric(10,2),
    "l_estadio_banorte" numeric(10,2),
    "l_estadio_banorte_te" numeric(10,2),
    "l_campus_norte_edificios_ciudad" numeric(10,2),
    "l_estadio_azul" numeric(10,2),
    "l_circuito_megacentral" numeric(10,2),
    "l_megacentral_te_4" numeric(10,2),
    "l_ptar_riego" numeric(10,2),
    "l_pozo_4_riego_alt" numeric(10,2),
    "l_pozo_8_riego_alt" numeric(10,2),
    "l_pozo_15_riego_alt" numeric(10,2),
    "l_campus_norte_ciudad_riego" numeric(10,2),
    "l_comedor_d_ciudad" numeric(10,2),
    "l_estadio_banorte_purgas" numeric(10,2),
    "l_wellness_cisterna_pluvial_purgas" numeric(10,2),
    "l_wellness_suavizador_purga" numeric(10,2),
    "l_wellness_te_rebosadero" numeric(10,2),
    "l_wellness_te_purga" numeric(10,2),
    "l_cedes_tinaco_riego_pluvial" numeric(10,2),
    "l_megacentral_te_purgas" numeric(10,2),
    "l_megacentral_suavizador_purga" numeric(10,2),
    "l_cah3_te_purgas" numeric(10,2),
    "l_residencias_10_15_te_purga" numeric(10,2),
    "l_estadio_borrego_pluvial" numeric(10,2),
    "l_ciap_cisterna_pluvial" numeric(10,2),
    "l_campo_soft_bol" numeric(10,2),
    "l_cedes_ciudad" numeric(10,2),
    "l_estacionamiento_e3" numeric(10,2),
    "l_guarderia" numeric(10,2),
    "l_naranjos" numeric(10,2),
    "l_casa_solar" numeric(10,2),
    "l_escamilla_banos_alumnos" numeric(10,2),
    "l_residencias_11_ciudad" numeric(10,2),
    "l_residencias_12_ciudad" numeric(10,2),
    "l_residencias_13_1_ciudad" numeric(10,2),
    "l_residencias_13_2_ciudad" numeric(10,2),
    "l_residencias_13_3_ciudad" numeric(10,2),
    "l_residencias_15_sotano" numeric(10,2),
    "l_residencias_10_15_purga_no" numeric(10,2),
    "l_cdb1_jardineros" numeric(10,2),
    "l_edificio_d" numeric(10,2),
    "l_estadio_yarda" numeric(10,2),
    "l_farnville" numeric(10,2),
    "l_em_box" numeric(10,2),
    "l_crepaso" numeric(10,2),
    "l_el_negro" numeric(10,2),
    "l_e2_beiker" numeric(10,2),
    "l_e2_evobike" numeric(10,2),
    "l_e2_pancho_de_rigo" numeric(10,2),
    "l_e2_bebedero_nube" numeric(10,2),
    "l_residencias_abc_lavanderia" numeric(10,2),
    "l_estacionamiento_e1" numeric(10,2),
    "l_caffenio" numeric(15,3)
);


ALTER TABLE "public"."lecturas_semana_agua_2026" OWNER TO "postgres";


COMMENT ON TABLE "public"."lecturas_semana_agua_2026" IS 'Lecturas semanales de agua - Año 2026';



COMMENT ON COLUMN "public"."lecturas_semana_agua_2026"."l_medidor_general_pozos" IS 'Medidor General de los pozos 7, 12, 11 y 14 / TOTAL POZOS';



CREATE SEQUENCE IF NOT EXISTS "public"."lecturas_semana_agua_2026_l_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."lecturas_semana_agua_2026_l_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."lecturas_semana_agua_2026_l_id_seq" OWNED BY "public"."lecturas_semana_agua_2026"."l_id";



CREATE TABLE IF NOT EXISTS "public"."lecturas_semana_agua_consumo_2023" (
    "l_id" integer NOT NULL,
    "l_numero_semana" integer NOT NULL,
    "l_fecha_inicio" "date" NOT NULL,
    "l_fecha_fin" "date" NOT NULL,
    "l_created_at" timestamp with time zone DEFAULT "now"(),
    "l_updated_at" timestamp with time zone DEFAULT "now"(),
    "l_medidor_general_pozos" numeric(10,2),
    "l_pozo_11" numeric(10,2),
    "l_pozo_14" numeric(10,2),
    "l_pozo_12" numeric(10,2),
    "l_pozo_7" numeric(10,2),
    "l_pozo_3" numeric(10,2),
    "l_pozo_4_riego" numeric(10,2),
    "l_pozo_8_riego" numeric(10,2),
    "l_pozo_15_riego" numeric(10,2),
    "l_circuito_8_campus" numeric(10,2),
    "l_auditorio_luis_elizondo" numeric(10,2),
    "l_cdb2" numeric(10,2),
    "l_cdb2_banos_nuevos_2025" numeric(10,2),
    "l_arena_borrego" numeric(10,2),
    "l_edificio_negocios_daf" numeric(10,2),
    "l_aulas_6" numeric(10,2),
    "l_domo_cultural" numeric(10,2),
    "l_wellness_parque_central_tunel" numeric(10,2),
    "l_wellness_registro" numeric(10,2),
    "l_parque_central_registro" numeric(10,2),
    "l_wellness_edificio" numeric(10,2),
    "l_wellness_super_salads" numeric(10,2),
    "l_wellness_torre_enfriamiento" numeric(10,2),
    "l_wellness_alberca" numeric(10,2),
    "l_centrales_comedor_1_principal" numeric(10,2),
    "l_centrales_dona_tota" numeric(10,2),
    "l_centrales_subway" numeric(10,2),
    "l_centrales_carls_jr" numeric(10,2),
    "l_centrales_little_cesars" numeric(10,2),
    "l_centrales_grill_team" numeric(10,2),
    "l_centrales_chilaquiles" numeric(10,2),
    "l_centrales_tec_food" numeric(10,2),
    "l_centrales_oxxo" numeric(10,2),
    "l_comedor_central_tunel" numeric(10,2),
    "l_administrativo" numeric(10,2),
    "l_biotecnologia" numeric(10,2),
    "l_escuela_arte_caldera_1" numeric(10,2),
    "l_ciap_oriente" numeric(10,2),
    "l_ciap_centro" numeric(10,2),
    "l_ciap_poniente" numeric(10,2),
    "l_ciap_green_shake" numeric(10,2),
    "l_ciap_andatti" numeric(10,2),
    "l_ciap_dc_jochos" numeric(10,2),
    "l_aulas_5" numeric(10,2),
    "l_ciap_starbucks" numeric(10,2),
    "l_ciap_super_salads" numeric(10,2),
    "l_ciap_sotano" numeric(10,2),
    "l_reflexion" numeric(10,2),
    "l_comedor_2_residencias_10_15" numeric(10,2),
    "l_residencias_10_15" numeric(10,2),
    "l_residencias_10_15_llenado" numeric(10,2),
    "l_comedor_2_caldera_2" numeric(10,2),
    "l_la_choza" numeric(10,2),
    "l_cedes_cisterna" numeric(10,2),
    "l_cedes_site" numeric(10,2),
    "l_nucleo" numeric(10,2),
    "l_expedition" numeric(10,2),
    "l_expedition_bread" numeric(10,2),
    "l_expedition_matthew" numeric(10,2),
    "l_cedes_e2" numeric(10,2),
    "l_aulas_1" numeric(10,2),
    "l_rectoria_norte" numeric(10,2),
    "l_pabellon_la_carreta" numeric(10,2),
    "l_rectoria_sur" numeric(10,2),
    "l_aulas_2" numeric(10,2),
    "l_cetec" numeric(10,2),
    "l_biblioteca" numeric(10,2),
    "l_biblioteca_nikkori" numeric(10,2),
    "l_biblioteca_nectar_works" numeric(10,2),
    "l_biblioteca_tim_horton" numeric(10,2),
    "l_biblioteca_starbucks" numeric(10,2),
    "l_aulas_3" numeric(10,2),
    "l_basanti" numeric(10,2),
    "l_aulas_3_sr_latino" numeric(10,2),
    "l_aulas_3_starbucks" numeric(10,2),
    "l_centrales_sur" numeric(10,2),
    "l_aulas_4_norte" numeric(10,2),
    "l_circuito_6_residencias" numeric(10,2),
    "l_residencias_1_antiguo" numeric(10,2),
    "l_residencias_2_ote" numeric(10,2),
    "l_residencias_2_pte" numeric(10,2),
    "l_residencias_3" numeric(10,2),
    "l_residencias_4" numeric(10,2),
    "l_residencias_5" numeric(10,2),
    "l_residencias_7" numeric(10,2),
    "l_residencias_8" numeric(10,2),
    "l_correos" numeric(10,2),
    "l_alberca" numeric(10,2),
    "l_residencias_abc" numeric(10,2),
    "l_circuito_4_a7_ce" numeric(10,2),
    "l_aulas_7" numeric(10,2),
    "l_cah3_torre_enfriamiento" numeric(10,2),
    "l_caldera_3" numeric(10,2),
    "l_la_dia" numeric(10,2),
    "l_aulas_4_sur" numeric(10,2),
    "l_aulas_4_maestros" numeric(10,2),
    "l_centro_congresos" numeric(10,2),
    "l_jubileo" numeric(10,2),
    "l_aulas_4_oxxo" numeric(10,2),
    "l_circuito_planta_fisica" numeric(10,2),
    "l_arquitectura_e1" numeric(10,2),
    "l_arquitectura_anexo" numeric(10,2),
    "l_megacentral_te_2" numeric(10,2),
    "l_escamilla_banos_trabajadores" numeric(10,2),
    "l_estadio_banorte" numeric(10,2),
    "l_estadio_banorte_te" numeric(10,2),
    "l_campus_norte_edificios_ciudad" numeric(10,2),
    "l_estadio_azul" numeric(10,2),
    "l_circuito_megacentral" numeric(10,2),
    "l_megacentral_te_4" numeric(10,2),
    "l_ptar_riego" numeric(10,2),
    "l_pozo_4_riego_alt" numeric(10,2),
    "l_pozo_8_riego_alt" numeric(10,2),
    "l_pozo_15_riego_alt" numeric(10,2),
    "l_campus_norte_ciudad_riego" numeric(10,2),
    "l_comedor_d_ciudad" numeric(10,2),
    "l_estadio_banorte_purgas" numeric(10,2),
    "l_wellness_cisterna_pluvial_purgas" numeric(10,2),
    "l_wellness_suavizador_purga" numeric(10,2),
    "l_wellness_te_rebosadero" numeric(10,2),
    "l_wellness_te_purga" numeric(10,2),
    "l_cedes_tinaco_riego_pluvial" numeric(10,2),
    "l_megacentral_te_purgas" numeric(10,2),
    "l_megacentral_suavizador_purga" numeric(10,2),
    "l_cah3_te_purgas" numeric(10,2),
    "l_residencias_10_15_te_purga" numeric(10,2),
    "l_estadio_borrego_pluvial" numeric(10,2),
    "l_ciap_cisterna_pluvial" numeric(10,2),
    "l_campo_soft_bol" numeric(10,2),
    "l_cedes_ciudad" numeric(10,2),
    "l_estacionamiento_e3" numeric(10,2),
    "l_guarderia" numeric(10,2),
    "l_naranjos" numeric(10,2),
    "l_casa_solar" numeric(10,2),
    "l_escamilla_banos_alumnos" numeric(10,2),
    "l_residencias_11_ciudad" numeric(10,2),
    "l_residencias_12_ciudad" numeric(10,2),
    "l_residencias_13_1_ciudad" numeric(10,2),
    "l_residencias_13_2_ciudad" numeric(10,2),
    "l_residencias_13_3_ciudad" numeric(10,2),
    "l_residencias_15_sotano" numeric(10,2),
    "l_residencias_10_15_purga_no" numeric(10,2),
    "l_cdb1_jardineros" numeric(10,2),
    "l_edificio_d" numeric(10,2),
    "l_estadio_yarda" numeric(10,2)
);


ALTER TABLE "public"."lecturas_semana_agua_consumo_2023" OWNER TO "postgres";


COMMENT ON TABLE "public"."lecturas_semana_agua_consumo_2023" IS 'Consumo semanal de agua - Año 2023';



CREATE SEQUENCE IF NOT EXISTS "public"."lecturas_semana_agua_consumo_2023_l_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."lecturas_semana_agua_consumo_2023_l_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."lecturas_semana_agua_consumo_2023_l_id_seq" OWNED BY "public"."lecturas_semana_agua_consumo_2023"."l_id";



CREATE TABLE IF NOT EXISTS "public"."lecturas_semana_agua_consumo_2024" (
    "l_id" integer NOT NULL,
    "l_numero_semana" integer NOT NULL,
    "l_fecha_inicio" "date" NOT NULL,
    "l_fecha_fin" "date" NOT NULL,
    "l_created_at" timestamp with time zone DEFAULT "now"(),
    "l_updated_at" timestamp with time zone DEFAULT "now"(),
    "l_medidor_general_pozos" numeric(10,2),
    "l_pozo_11" numeric(10,2),
    "l_pozo_14" numeric(10,2),
    "l_pozo_12" numeric(10,2),
    "l_pozo_7" numeric(10,2),
    "l_pozo_3" numeric(10,2),
    "l_pozo_4_riego" numeric(10,2),
    "l_pozo_8_riego" numeric(10,2),
    "l_pozo_15_riego" numeric(10,2),
    "l_circuito_8_campus" numeric(10,2),
    "l_auditorio_luis_elizondo" numeric(10,2),
    "l_cdb2" numeric(10,2),
    "l_cdb2_banos_nuevos_2025" numeric(10,2),
    "l_arena_borrego" numeric(10,2),
    "l_edificio_negocios_daf" numeric(10,2),
    "l_aulas_6" numeric(10,2),
    "l_domo_cultural" numeric(10,2),
    "l_wellness_parque_central_tunel" numeric(10,2),
    "l_wellness_registro" numeric(10,2),
    "l_parque_central_registro" numeric(10,2),
    "l_wellness_edificio" numeric(10,2),
    "l_wellness_super_salads" numeric(10,2),
    "l_wellness_torre_enfriamiento" numeric(10,2),
    "l_wellness_alberca" numeric(10,2),
    "l_centrales_comedor_1_principal" numeric(10,2),
    "l_centrales_dona_tota" numeric(10,2),
    "l_centrales_subway" numeric(10,2),
    "l_centrales_carls_jr" numeric(10,2),
    "l_centrales_little_cesars" numeric(10,2),
    "l_centrales_grill_team" numeric(10,2),
    "l_centrales_chilaquiles" numeric(10,2),
    "l_centrales_tec_food" numeric(10,2),
    "l_centrales_oxxo" numeric(10,2),
    "l_comedor_central_tunel" numeric(10,2),
    "l_administrativo" numeric(10,2),
    "l_biotecnologia" numeric(10,2),
    "l_escuela_arte_caldera_1" numeric(10,2),
    "l_ciap_oriente" numeric(10,2),
    "l_ciap_centro" numeric(10,2),
    "l_ciap_poniente" numeric(10,2),
    "l_ciap_green_shake" numeric(10,2),
    "l_ciap_andatti" numeric(10,2),
    "l_ciap_dc_jochos" numeric(10,2),
    "l_aulas_5" numeric(10,2),
    "l_ciap_starbucks" numeric(10,2),
    "l_ciap_super_salads" numeric(10,2),
    "l_ciap_sotano" numeric(10,2),
    "l_reflexion" numeric(10,2),
    "l_comedor_2_residencias_10_15" numeric(10,2),
    "l_residencias_10_15" numeric(10,2),
    "l_residencias_10_15_llenado" numeric(10,2),
    "l_comedor_2_caldera_2" numeric(10,2),
    "l_la_choza" numeric(10,2),
    "l_cedes_cisterna" numeric(10,2),
    "l_cedes_site" numeric(10,2),
    "l_nucleo" numeric(10,2),
    "l_expedition" numeric(10,2),
    "l_expedition_bread" numeric(10,2),
    "l_expedition_matthew" numeric(10,2),
    "l_cedes_e2" numeric(10,2),
    "l_aulas_1" numeric(10,2),
    "l_rectoria_norte" numeric(10,2),
    "l_pabellon_la_carreta" numeric(10,2),
    "l_rectoria_sur" numeric(10,2),
    "l_aulas_2" numeric(10,2),
    "l_cetec" numeric(10,2),
    "l_biblioteca" numeric(10,2),
    "l_biblioteca_nikkori" numeric(10,2),
    "l_biblioteca_nectar_works" numeric(10,2),
    "l_biblioteca_tim_horton" numeric(10,2),
    "l_biblioteca_starbucks" numeric(10,2),
    "l_aulas_3" numeric(10,2),
    "l_basanti" numeric(10,2),
    "l_aulas_3_sr_latino" numeric(10,2),
    "l_aulas_3_starbucks" numeric(10,2),
    "l_centrales_sur" numeric(10,2),
    "l_aulas_4_norte" numeric(10,2),
    "l_circuito_6_residencias" numeric(10,2),
    "l_residencias_1_antiguo" numeric(10,2),
    "l_residencias_2_ote" numeric(10,2),
    "l_residencias_2_pte" numeric(10,2),
    "l_residencias_3" numeric(10,2),
    "l_residencias_4" numeric(10,2),
    "l_residencias_5" numeric(10,2),
    "l_residencias_7" numeric(10,2),
    "l_residencias_8" numeric(10,2),
    "l_correos" numeric(10,2),
    "l_alberca" numeric(10,2),
    "l_residencias_abc" numeric(10,2),
    "l_circuito_4_a7_ce" numeric(10,2),
    "l_aulas_7" numeric(10,2),
    "l_cah3_torre_enfriamiento" numeric(10,2),
    "l_caldera_3" numeric(10,2),
    "l_la_dia" numeric(10,2),
    "l_aulas_4_sur" numeric(10,2),
    "l_aulas_4_maestros" numeric(10,2),
    "l_centro_congresos" numeric(10,2),
    "l_jubileo" numeric(10,2),
    "l_aulas_4_oxxo" numeric(10,2),
    "l_circuito_planta_fisica" numeric(10,2),
    "l_arquitectura_e1" numeric(10,2),
    "l_arquitectura_anexo" numeric(10,2),
    "l_megacentral_te_2" numeric(10,2),
    "l_escamilla_banos_trabajadores" numeric(10,2),
    "l_estadio_banorte" numeric(10,2),
    "l_estadio_banorte_te" numeric(10,2),
    "l_campus_norte_edificios_ciudad" numeric(10,2),
    "l_estadio_azul" numeric(10,2),
    "l_circuito_megacentral" numeric(10,2),
    "l_megacentral_te_4" numeric(10,2),
    "l_ptar_riego" numeric(10,2),
    "l_pozo_4_riego_alt" numeric(10,2),
    "l_pozo_8_riego_alt" numeric(10,2),
    "l_pozo_15_riego_alt" numeric(10,2),
    "l_campus_norte_ciudad_riego" numeric(10,2),
    "l_comedor_d_ciudad" numeric(10,2),
    "l_estadio_banorte_purgas" numeric(10,2),
    "l_wellness_cisterna_pluvial_purgas" numeric(10,2),
    "l_wellness_suavizador_purga" numeric(10,2),
    "l_wellness_te_rebosadero" numeric(10,2),
    "l_wellness_te_purga" numeric(10,2),
    "l_cedes_tinaco_riego_pluvial" numeric(10,2),
    "l_megacentral_te_purgas" numeric(10,2),
    "l_megacentral_suavizador_purga" numeric(10,2),
    "l_cah3_te_purgas" numeric(10,2),
    "l_residencias_10_15_te_purga" numeric(10,2),
    "l_estadio_borrego_pluvial" numeric(10,2),
    "l_ciap_cisterna_pluvial" numeric(10,2),
    "l_campo_soft_bol" numeric(10,2),
    "l_cedes_ciudad" numeric(10,2),
    "l_estacionamiento_e3" numeric(10,2),
    "l_guarderia" numeric(10,2),
    "l_naranjos" numeric(10,2),
    "l_casa_solar" numeric(10,2),
    "l_escamilla_banos_alumnos" numeric(10,2),
    "l_residencias_11_ciudad" numeric(10,2),
    "l_residencias_12_ciudad" numeric(10,2),
    "l_residencias_13_1_ciudad" numeric(10,2),
    "l_residencias_13_2_ciudad" numeric(10,2),
    "l_residencias_13_3_ciudad" numeric(10,2),
    "l_residencias_15_sotano" numeric(10,2),
    "l_residencias_10_15_purga_no" numeric(10,2),
    "l_cdb1_jardineros" numeric(10,2),
    "l_edificio_d" numeric(10,2),
    "l_estadio_yarda" numeric(10,2)
);


ALTER TABLE "public"."lecturas_semana_agua_consumo_2024" OWNER TO "postgres";


COMMENT ON TABLE "public"."lecturas_semana_agua_consumo_2024" IS 'Consumo semanal de agua - Año 2024';



CREATE SEQUENCE IF NOT EXISTS "public"."lecturas_semana_agua_consumo_2024_l_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."lecturas_semana_agua_consumo_2024_l_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."lecturas_semana_agua_consumo_2024_l_id_seq" OWNED BY "public"."lecturas_semana_agua_consumo_2024"."l_id";



CREATE TABLE IF NOT EXISTS "public"."lecturas_semana_agua_consumo_2025" (
    "l_id" integer NOT NULL,
    "l_numero_semana" integer NOT NULL,
    "l_fecha_inicio" "date" NOT NULL,
    "l_fecha_fin" "date" NOT NULL,
    "l_created_at" timestamp with time zone DEFAULT "now"(),
    "l_updated_at" timestamp with time zone DEFAULT "now"(),
    "l_medidor_general_pozos" numeric(10,2),
    "l_pozo_11" numeric(10,2),
    "l_pozo_14" numeric(10,2),
    "l_pozo_12" numeric(10,2),
    "l_pozo_7" numeric(10,2),
    "l_pozo_3" numeric(10,2),
    "l_pozo_4_riego" numeric(10,2),
    "l_pozo_8_riego" numeric(10,2),
    "l_pozo_15_riego" numeric(10,2),
    "l_circuito_8_campus" numeric(10,2),
    "l_auditorio_luis_elizondo" numeric(10,2),
    "l_cdb2" numeric(10,2),
    "l_cdb2_banos_nuevos_2025" numeric(10,2),
    "l_arena_borrego" numeric(10,2),
    "l_edificio_negocios_daf" numeric(10,2),
    "l_aulas_6" numeric(10,2),
    "l_domo_cultural" numeric(10,2),
    "l_wellness_parque_central_tunel" numeric(10,2),
    "l_wellness_registro" numeric(10,2),
    "l_parque_central_registro" numeric(10,2),
    "l_wellness_edificio" numeric(10,2),
    "l_wellness_super_salads" numeric(10,2),
    "l_wellness_torre_enfriamiento" numeric(10,2),
    "l_wellness_alberca" numeric(10,2),
    "l_centrales_comedor_1_principal" numeric(10,2),
    "l_centrales_dona_tota" numeric(10,2),
    "l_centrales_subway" numeric(10,2),
    "l_centrales_carls_jr" numeric(10,2),
    "l_centrales_little_cesars" numeric(10,2),
    "l_centrales_grill_team" numeric(10,2),
    "l_centrales_chilaquiles" numeric(10,2),
    "l_centrales_tec_food" numeric(10,2),
    "l_centrales_oxxo" numeric(10,2),
    "l_comedor_central_tunel" numeric(10,2),
    "l_administrativo" numeric(10,2),
    "l_biotecnologia" numeric(10,2),
    "l_escuela_arte_caldera_1" numeric(10,2),
    "l_ciap_oriente" numeric(10,2),
    "l_ciap_centro" numeric(10,2),
    "l_ciap_poniente" numeric(10,2),
    "l_ciap_green_shake" numeric(10,2),
    "l_ciap_andatti" numeric(10,2),
    "l_ciap_dc_jochos" numeric(10,2),
    "l_aulas_5" numeric(10,2),
    "l_ciap_starbucks" numeric(10,2),
    "l_ciap_super_salads" numeric(10,2),
    "l_ciap_sotano" numeric(10,2),
    "l_reflexion" numeric(10,2),
    "l_comedor_2_residencias_10_15" numeric(10,2),
    "l_residencias_10_15" numeric(10,2),
    "l_residencias_10_15_llenado" numeric(10,2),
    "l_comedor_2_caldera_2" numeric(10,2),
    "l_la_choza" numeric(10,2),
    "l_cedes_cisterna" numeric(10,2),
    "l_cedes_site" numeric(10,2),
    "l_nucleo" numeric(10,2),
    "l_expedition" numeric(10,2),
    "l_expedition_bread" numeric(10,2),
    "l_expedition_matthew" numeric(10,2),
    "l_cedes_e2" numeric(10,2),
    "l_aulas_1" numeric(10,2),
    "l_rectoria_norte" numeric(10,2),
    "l_pabellon_la_carreta" numeric(10,2),
    "l_rectoria_sur" numeric(10,2),
    "l_aulas_2" numeric(10,2),
    "l_cetec" numeric(10,2),
    "l_biblioteca" numeric(10,2),
    "l_biblioteca_nikkori" numeric(10,2),
    "l_biblioteca_nectar_works" numeric(10,2),
    "l_biblioteca_tim_horton" numeric(10,2),
    "l_biblioteca_starbucks" numeric(10,2),
    "l_aulas_3" numeric(10,2),
    "l_basanti" numeric(10,2),
    "l_aulas_3_sr_latino" numeric(10,2),
    "l_aulas_3_starbucks" numeric(10,2),
    "l_centrales_sur" numeric(10,2),
    "l_aulas_4_norte" numeric(10,2),
    "l_circuito_6_residencias" numeric(10,2),
    "l_residencias_1_antiguo" numeric(10,2),
    "l_residencias_2_ote" numeric(10,2),
    "l_residencias_2_pte" numeric(10,2),
    "l_residencias_3" numeric(10,2),
    "l_residencias_4" numeric(10,2),
    "l_residencias_5" numeric(10,2),
    "l_residencias_7" numeric(10,2),
    "l_residencias_8" numeric(10,2),
    "l_correos" numeric(10,2),
    "l_alberca" numeric(10,2),
    "l_residencias_abc" numeric(10,2),
    "l_circuito_4_a7_ce" numeric(10,2),
    "l_aulas_7" numeric(10,2),
    "l_cah3_torre_enfriamiento" numeric(10,2),
    "l_caldera_3" numeric(10,2),
    "l_la_dia" numeric(10,2),
    "l_aulas_4_sur" numeric(10,2),
    "l_aulas_4_maestros" numeric(10,2),
    "l_centro_congresos" numeric(10,2),
    "l_jubileo" numeric(10,2),
    "l_aulas_4_oxxo" numeric(10,2),
    "l_circuito_planta_fisica" numeric(10,2),
    "l_arquitectura_e1" numeric(10,2),
    "l_arquitectura_anexo" numeric(10,2),
    "l_megacentral_te_2" numeric(10,2),
    "l_escamilla_banos_trabajadores" numeric(10,2),
    "l_estadio_banorte" numeric(10,2),
    "l_estadio_banorte_te" numeric(10,2),
    "l_campus_norte_edificios_ciudad" numeric(10,2),
    "l_estadio_azul" numeric(10,2),
    "l_circuito_megacentral" numeric(10,2),
    "l_megacentral_te_4" numeric(10,2),
    "l_ptar_riego" numeric(10,2),
    "l_pozo_4_riego_alt" numeric(10,2),
    "l_pozo_8_riego_alt" numeric(10,2),
    "l_pozo_15_riego_alt" numeric(10,2),
    "l_campus_norte_ciudad_riego" numeric(10,2),
    "l_comedor_d_ciudad" numeric(10,2),
    "l_estadio_banorte_purgas" numeric(10,2),
    "l_wellness_cisterna_pluvial_purgas" numeric(10,2),
    "l_wellness_suavizador_purga" numeric(10,2),
    "l_wellness_te_rebosadero" numeric(10,2),
    "l_wellness_te_purga" numeric(10,2),
    "l_cedes_tinaco_riego_pluvial" numeric(10,2),
    "l_megacentral_te_purgas" numeric(10,2),
    "l_megacentral_suavizador_purga" numeric(10,2),
    "l_cah3_te_purgas" numeric(10,2),
    "l_residencias_10_15_te_purga" numeric(10,2),
    "l_estadio_borrego_pluvial" numeric(10,2),
    "l_ciap_cisterna_pluvial" numeric(10,2),
    "l_campo_soft_bol" numeric(10,2),
    "l_cedes_ciudad" numeric(10,2),
    "l_estacionamiento_e3" numeric(10,2),
    "l_guarderia" numeric(10,2),
    "l_naranjos" numeric(10,2),
    "l_casa_solar" numeric(10,2),
    "l_escamilla_banos_alumnos" numeric(10,2),
    "l_residencias_11_ciudad" numeric(10,2),
    "l_residencias_12_ciudad" numeric(10,2),
    "l_residencias_13_1_ciudad" numeric(10,2),
    "l_residencias_13_2_ciudad" numeric(10,2),
    "l_residencias_13_3_ciudad" numeric(10,2),
    "l_residencias_15_sotano" numeric(10,2),
    "l_residencias_10_15_purga_no" numeric(10,2),
    "l_cdb1_jardineros" numeric(10,2),
    "l_edificio_d" numeric(10,2),
    "l_estadio_yarda" numeric(10,2),
    "l_farnville" numeric(10,2),
    "l_em_box" numeric(10,2),
    "l_crepaso" numeric(10,2),
    "l_el_negro" numeric(10,2),
    "l_e2_beiker" numeric(10,2),
    "l_e2_evobike" numeric(10,2),
    "l_e2_pancho_de_rigo" numeric(10,2),
    "l_e2_bebedero_nube" numeric(10,2),
    "l_residencias_abc_lavanderia" numeric(10,2),
    "l_estacionamiento_e1" numeric(10,2)
);


ALTER TABLE "public"."lecturas_semana_agua_consumo_2025" OWNER TO "postgres";


COMMENT ON TABLE "public"."lecturas_semana_agua_consumo_2025" IS 'Consumo semanal de agua - Año 2025';



CREATE SEQUENCE IF NOT EXISTS "public"."lecturas_semana_agua_consumo_2025_l_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."lecturas_semana_agua_consumo_2025_l_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."lecturas_semana_agua_consumo_2025_l_id_seq" OWNED BY "public"."lecturas_semana_agua_consumo_2025"."l_id";



CREATE TABLE IF NOT EXISTS "public"."lecturas_semana_agua_consumo_2026" (
    "l_id" integer NOT NULL,
    "l_numero_semana" integer NOT NULL,
    "l_fecha_inicio" "date" NOT NULL,
    "l_fecha_fin" "date" NOT NULL,
    "l_created_at" timestamp with time zone DEFAULT "now"(),
    "l_updated_at" timestamp with time zone DEFAULT "now"(),
    "l_medidor_general_pozos" numeric(10,2),
    "l_pozo_11" numeric(10,2),
    "l_pozo_14" numeric(10,2),
    "l_pozo_12" numeric(10,2),
    "l_pozo_7" numeric(10,2),
    "l_pozo_3" numeric(10,2),
    "l_pozo_4_riego" numeric(10,2),
    "l_pozo_8_riego" numeric(10,2),
    "l_pozo_15_riego" numeric(10,2),
    "l_circuito_8_campus" numeric(10,2),
    "l_auditorio_luis_elizondo" numeric(10,2),
    "l_cdb2" numeric(10,2),
    "l_cdb2_banos_nuevos_2025" numeric(10,2),
    "l_arena_borrego" numeric(10,2),
    "l_edificio_negocios_daf" numeric(10,2),
    "l_aulas_6" numeric(10,2),
    "l_domo_cultural" numeric(10,2),
    "l_wellness_parque_central_tunel" numeric(10,2),
    "l_wellness_registro" numeric(10,2),
    "l_parque_central_registro" numeric(10,2),
    "l_wellness_edificio" numeric(10,2),
    "l_wellness_super_salads" numeric(10,2),
    "l_wellness_torre_enfriamiento" numeric(10,2),
    "l_wellness_alberca" numeric(10,2),
    "l_centrales_comedor_1_principal" numeric(10,2),
    "l_centrales_dona_tota" numeric(10,2),
    "l_centrales_subway" numeric(10,2),
    "l_centrales_carls_jr" numeric(10,2),
    "l_centrales_little_cesars" numeric(10,2),
    "l_centrales_grill_team" numeric(10,2),
    "l_centrales_chilaquiles" numeric(10,2),
    "l_centrales_tec_food" numeric(10,2),
    "l_centrales_oxxo" numeric(10,2),
    "l_comedor_central_tunel" numeric(10,2),
    "l_administrativo" numeric(10,2),
    "l_biotecnologia" numeric(10,2),
    "l_escuela_arte_caldera_1" numeric(10,2),
    "l_ciap_oriente" numeric(10,2),
    "l_ciap_centro" numeric(10,2),
    "l_ciap_poniente" numeric(10,2),
    "l_ciap_green_shake" numeric(10,2),
    "l_ciap_andatti" numeric(10,2),
    "l_ciap_dc_jochos" numeric(10,2),
    "l_aulas_5" numeric(10,2),
    "l_ciap_starbucks" numeric(10,2),
    "l_ciap_super_salads" numeric(10,2),
    "l_ciap_sotano" numeric(10,2),
    "l_reflexion" numeric(10,2),
    "l_comedor_2_residencias_10_15" numeric(10,2),
    "l_residencias_10_15" numeric(10,2),
    "l_residencias_10_15_llenado" numeric(10,2),
    "l_comedor_2_caldera_2" numeric(10,2),
    "l_la_choza" numeric(10,2),
    "l_cedes_cisterna" numeric(10,2),
    "l_cedes_site" numeric(10,2),
    "l_nucleo" numeric(10,2),
    "l_expedition" numeric(10,2),
    "l_expedition_bread" numeric(10,2),
    "l_expedition_matthew" numeric(10,2),
    "l_cedes_e2" numeric(10,2),
    "l_aulas_1" numeric(10,2),
    "l_rectoria_norte" numeric(10,2),
    "l_pabellon_la_carreta" numeric(10,2),
    "l_rectoria_sur" numeric(10,2),
    "l_aulas_2" numeric(10,2),
    "l_cetec" numeric(10,2),
    "l_biblioteca" numeric(10,2),
    "l_biblioteca_nikkori" numeric(10,2),
    "l_biblioteca_nectar_works" numeric(10,2),
    "l_biblioteca_tim_horton" numeric(10,2),
    "l_biblioteca_starbucks" numeric(10,2),
    "l_aulas_3" numeric(10,2),
    "l_basanti" numeric(10,2),
    "l_aulas_3_sr_latino" numeric(10,2),
    "l_aulas_3_starbucks" numeric(10,2),
    "l_centrales_sur" numeric(10,2),
    "l_aulas_4_norte" numeric(10,2),
    "l_circuito_6_residencias" numeric(10,2),
    "l_residencias_1_antiguo" numeric(10,2),
    "l_residencias_2_ote" numeric(10,2),
    "l_residencias_2_pte" numeric(10,2),
    "l_residencias_3" numeric(10,2),
    "l_residencias_4" numeric(10,2),
    "l_residencias_5" numeric(10,2),
    "l_residencias_7" numeric(10,2),
    "l_residencias_8" numeric(10,2),
    "l_correos" numeric(10,2),
    "l_alberca" numeric(10,2),
    "l_residencias_abc" numeric(10,2),
    "l_circuito_4_a7_ce" numeric(10,2),
    "l_aulas_7" numeric(10,2),
    "l_cah3_torre_enfriamiento" numeric(10,2),
    "l_caldera_3" numeric(10,2),
    "l_la_dia" numeric(10,2),
    "l_aulas_4_sur" numeric(10,2),
    "l_aulas_4_maestros" numeric(10,2),
    "l_centro_congresos" numeric(10,2),
    "l_jubileo" numeric(10,2),
    "l_aulas_4_oxxo" numeric(10,2),
    "l_circuito_planta_fisica" numeric(10,2),
    "l_arquitectura_e1" numeric(10,2),
    "l_arquitectura_anexo" numeric(10,2),
    "l_megacentral_te_2" numeric(10,2),
    "l_escamilla_banos_trabajadores" numeric(10,2),
    "l_estadio_banorte" numeric(10,2),
    "l_estadio_banorte_te" numeric(10,2),
    "l_campus_norte_edificios_ciudad" numeric(10,2),
    "l_estadio_azul" numeric(10,2),
    "l_circuito_megacentral" numeric(10,2),
    "l_megacentral_te_4" numeric(10,2),
    "l_ptar_riego" numeric(10,2),
    "l_pozo_4_riego_alt" numeric(10,2),
    "l_pozo_8_riego_alt" numeric(10,2),
    "l_pozo_15_riego_alt" numeric(10,2),
    "l_campus_norte_ciudad_riego" numeric(10,2),
    "l_comedor_d_ciudad" numeric(10,2),
    "l_estadio_banorte_purgas" numeric(10,2),
    "l_wellness_cisterna_pluvial_purgas" numeric(10,2),
    "l_wellness_suavizador_purga" numeric(10,2),
    "l_wellness_te_rebosadero" numeric(10,2),
    "l_wellness_te_purga" numeric(10,2),
    "l_cedes_tinaco_riego_pluvial" numeric(10,2),
    "l_megacentral_te_purgas" numeric(10,2),
    "l_megacentral_suavizador_purga" numeric(10,2),
    "l_cah3_te_purgas" numeric(10,2),
    "l_residencias_10_15_te_purga" numeric(10,2),
    "l_estadio_borrego_pluvial" numeric(10,2),
    "l_ciap_cisterna_pluvial" numeric(10,2),
    "l_campo_soft_bol" numeric(10,2),
    "l_cedes_ciudad" numeric(10,2),
    "l_estacionamiento_e3" numeric(10,2),
    "l_guarderia" numeric(10,2),
    "l_naranjos" numeric(10,2),
    "l_casa_solar" numeric(10,2),
    "l_escamilla_banos_alumnos" numeric(10,2),
    "l_residencias_11_ciudad" numeric(10,2),
    "l_residencias_12_ciudad" numeric(10,2),
    "l_residencias_13_1_ciudad" numeric(10,2),
    "l_residencias_13_2_ciudad" numeric(10,2),
    "l_residencias_13_3_ciudad" numeric(10,2),
    "l_residencias_15_sotano" numeric(10,2),
    "l_residencias_10_15_purga_no" numeric(10,2),
    "l_cdb1_jardineros" numeric(10,2),
    "l_edificio_d" numeric(10,2),
    "l_estadio_yarda" numeric(10,2),
    "l_farnville" numeric(10,2),
    "l_em_box" numeric(10,2),
    "l_crepaso" numeric(10,2),
    "l_el_negro" numeric(10,2),
    "l_e2_beiker" numeric(10,2),
    "l_e2_evobike" numeric(10,2),
    "l_e2_pancho_de_rigo" numeric(10,2),
    "l_e2_bebedero_nube" numeric(10,2),
    "l_residencias_abc_lavanderia" numeric(10,2),
    "l_estacionamiento_e1" numeric(10,2),
    "l_caffenio" numeric(15,3)
);


ALTER TABLE "public"."lecturas_semana_agua_consumo_2026" OWNER TO "postgres";


COMMENT ON TABLE "public"."lecturas_semana_agua_consumo_2026" IS 'Consumo semanal de agua - Año 2026';



CREATE SEQUENCE IF NOT EXISTS "public"."lecturas_semana_agua_consumo_2026_l_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."lecturas_semana_agua_consumo_2026_l_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."lecturas_semana_agua_consumo_2026_l_id_seq" OWNED BY "public"."lecturas_semana_agua_consumo_2026"."l_id";



CREATE TABLE IF NOT EXISTS "public"."lecturas_semanales_gas_2023" (
    "id" bigint NOT NULL,
    "numero_semana" integer NOT NULL,
    "fecha_inicio" "date" NOT NULL,
    "fecha_fin" "date" NOT NULL,
    "campus_acometida_principal_digital" numeric(15,3),
    "campus_acometida_principal_analogica" numeric(15,3),
    "domo_cultural" numeric(15,3),
    "comedor_centrales_tec_food" numeric(15,3),
    "dona_tota" numeric(15,3),
    "chilaquiles_tec" numeric(15,3),
    "carls_junior" numeric(15,3),
    "centrales_local" numeric(15,3),
    "davilas_grill_team" numeric(15,3),
    "pizza_little_caesars" numeric(15,3),
    "biotecnologia" numeric(15,3),
    "caldera_1_leon" numeric(15,3),
    "mega_calefaccion_1" numeric(15,3),
    "mega_calefaccion_2" numeric(15,3),
    "mega_calefaccion_3" numeric(15,3),
    "mega_calefaccion_4" numeric(15,3),
    "mega_calefaccion_5" numeric(15,3),
    "ciap_super_salads" numeric(15,3),
    "aulas_1" numeric(15,3),
    "biblioteca" numeric(15,3),
    "nikkori" numeric(15,3),
    "nectar_works" numeric(15,3),
    "sr_latino" numeric(15,3),
    "arena_borrego" numeric(15,3),
    "calefaccion_1_bryan" numeric(15,3),
    "calefaccion_2_aerco" numeric(15,3),
    "caldera_3" numeric(15,3),
    "aulas_7" numeric(15,3),
    "la_dia" numeric(15,3),
    "aulas_4" numeric(15,3),
    "centro_congresos_vestidores" numeric(15,3),
    "jubileo" numeric(15,3),
    "expedition" numeric(15,3),
    "bread_expedition" numeric(15,3),
    "matthew_expedition" numeric(15,3),
    "estudiantes_acometida_principal_digital" numeric(15,3),
    "estudiantes_acometida_principal_analogico" numeric(15,3),
    "cedes" numeric(15,3),
    "cedes_trabajadores_vestidores" numeric(15,3),
    "caldera_2" numeric(15,3),
    "comedor_estudiantes" numeric(15,3),
    "residencias_4" numeric(15,3),
    "residencias_1" numeric(15,3),
    "residencias_2" numeric(15,3),
    "residencias_5" numeric(15,3),
    "residencias_8" numeric(15,3),
    "residencias_7" numeric(15,3),
    "residencias_3" numeric(15,3),
    "residencias_abc_calefaccion" numeric(15,3),
    "residencias_abc_regaderas" numeric(15,3),
    "residencias_abc_locales_comida" numeric(15,3),
    "campus_norte_acometida_externa" numeric(15,3),
    "campus_norte_acometida_interna" numeric(15,3),
    "campus_norte_comedor_d" numeric(15,3),
    "campus_norte_edificio_d_calefaccion" numeric(15,3),
    "estadio_borrego_acometida_digital" numeric(15,3),
    "estadio_borrego_acometida_analogica" numeric(15,3),
    "estadio_yarda" numeric(15,3),
    "wellness_acometida_digital" numeric(15,3),
    "wellness_acometida_analogica" numeric(15,3),
    "wellness_supersalads" numeric(15,3),
    "wellness_general_calefaccion" numeric(15,3),
    "wellness_calentador_sotano_regaderas" numeric(15,3),
    "wellness_alberca" numeric(15,3),
    "auditorio_luis_elizondo" numeric(15,3),
    "pabellon_tec_semillero" numeric(15,3),
    "pabellon_tec_cocina_estudiantes_2do_piso" numeric(15,3),
    "guarderia" numeric(15,3),
    "escamilla" numeric(15,3),
    "casa_solar" numeric(15,3),
    "estudiantes_11" numeric(15,3),
    "estudiantes_12" numeric(15,3),
    "estudiantes_13" numeric(15,3),
    "estudiantes_15_y_10" numeric(15,3),
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."lecturas_semanales_gas_2023" OWNER TO "postgres";


COMMENT ON TABLE "public"."lecturas_semanales_gas_2023" IS 'Lecturas semanales de medidores de gas del campus - Año 2023';



COMMENT ON COLUMN "public"."lecturas_semanales_gas_2023"."numero_semana" IS 'Número de semana del año (1-52)';



COMMENT ON COLUMN "public"."lecturas_semanales_gas_2023"."fecha_inicio" IS 'Fecha de inicio de la semana';



COMMENT ON COLUMN "public"."lecturas_semanales_gas_2023"."fecha_fin" IS 'Fecha de fin de la semana';



CREATE TABLE IF NOT EXISTS "public"."lecturas_semanales_gas_consumo_2023" (
    "id" bigint NOT NULL,
    "numero_semana" integer NOT NULL,
    "fecha_inicio" "date" NOT NULL,
    "fecha_fin" "date" NOT NULL,
    "campus_acometida_principal_digital" numeric(15,3),
    "campus_acometida_principal_analogica" numeric(15,3),
    "domo_cultural" numeric(15,3),
    "comedor_centrales_tec_food" numeric(15,3),
    "dona_tota" numeric(15,3),
    "chilaquiles_tec" numeric(15,3),
    "carls_junior" numeric(15,3),
    "centrales_local" numeric(15,3),
    "davilas_grill_team" numeric(15,3),
    "pizza_little_caesars" numeric(15,3),
    "biotecnologia" numeric(15,3),
    "caldera_1_leon" numeric(15,3),
    "mega_calefaccion_1" numeric(15,3),
    "mega_calefaccion_2" numeric(15,3),
    "mega_calefaccion_3" numeric(15,3),
    "mega_calefaccion_4" numeric(15,3),
    "mega_calefaccion_5" numeric(15,3),
    "ciap_super_salads" numeric(15,3),
    "aulas_1" numeric(15,3),
    "biblioteca" numeric(15,3),
    "nikkori" numeric(15,3),
    "nectar_works" numeric(15,3),
    "sr_latino" numeric(15,3),
    "arena_borrego" numeric(15,3),
    "calefaccion_1_bryan" numeric(15,3),
    "calefaccion_2_aerco" numeric(15,3),
    "caldera_3" numeric(15,3),
    "aulas_7" numeric(15,3),
    "la_dia" numeric(15,3),
    "aulas_4" numeric(15,3),
    "centro_congresos_vestidores" numeric(15,3),
    "jubileo" numeric(15,3),
    "expedition" numeric(15,3),
    "bread_expedition" numeric(15,3),
    "matthew_expedition" numeric(15,3),
    "estudiantes_acometida_principal_digital" numeric(15,3),
    "estudiantes_acometida_principal_analogico" numeric(15,3),
    "cedes" numeric(15,3),
    "cedes_trabajadores_vestidores" numeric(15,3),
    "caldera_2" numeric(15,3),
    "comedor_estudiantes" numeric(15,3),
    "residencias_4" numeric(15,3),
    "residencias_1" numeric(15,3),
    "residencias_2" numeric(15,3),
    "residencias_5" numeric(15,3),
    "residencias_8" numeric(15,3),
    "residencias_7" numeric(15,3),
    "residencias_3" numeric(15,3),
    "residencias_abc_calefaccion" numeric(15,3),
    "residencias_abc_regaderas" numeric(15,3),
    "residencias_abc_locales_comida" numeric(15,3),
    "campus_norte_acometida_externa" numeric(15,3),
    "campus_norte_acometida_interna" numeric(15,3),
    "campus_norte_comedor_d" numeric(15,3),
    "campus_norte_edificio_d_calefaccion" numeric(15,3),
    "estadio_borrego_acometida_digital" numeric(15,3),
    "estadio_borrego_acometida_analogica" numeric(15,3),
    "estadio_yarda" numeric(15,3),
    "wellness_acometida_digital" numeric(15,3),
    "wellness_acometida_analogica" numeric(15,3),
    "wellness_supersalads" numeric(15,3),
    "wellness_general_calefaccion" numeric(15,3),
    "wellness_calentador_sotano_regaderas" numeric(15,3),
    "wellness_alberca" numeric(15,3),
    "auditorio_luis_elizondo" numeric(15,3),
    "pabellon_tec_semillero" numeric(15,3),
    "pabellon_tec_cocina_estudiantes_2do_piso" numeric(15,3),
    "guarderia" numeric(15,3),
    "escamilla" numeric(15,3),
    "casa_solar" numeric(15,3),
    "estudiantes_11" numeric(15,3),
    "estudiantes_12" numeric(15,3),
    "estudiantes_13" numeric(15,3),
    "estudiantes_15_y_10" numeric(15,3),
    "cdb1" numeric(15,3),
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."lecturas_semanales_gas_consumo_2023" OWNER TO "postgres";


COMMENT ON TABLE "public"."lecturas_semanales_gas_consumo_2023" IS 'Lecturas semanales de medidores de gas del campus - Año 2023';



COMMENT ON COLUMN "public"."lecturas_semanales_gas_consumo_2023"."numero_semana" IS 'Número de semana del año (1-52)';



COMMENT ON COLUMN "public"."lecturas_semanales_gas_consumo_2023"."fecha_inicio" IS 'Fecha de inicio de la semana';



COMMENT ON COLUMN "public"."lecturas_semanales_gas_consumo_2023"."fecha_fin" IS 'Fecha de fin de la semana';



CREATE SEQUENCE IF NOT EXISTS "public"."lecturas_semanales_gas_2023_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."lecturas_semanales_gas_2023_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."lecturas_semanales_gas_2023_id_seq" OWNED BY "public"."lecturas_semanales_gas_consumo_2023"."id";



CREATE SEQUENCE IF NOT EXISTS "public"."lecturas_semanales_gas_2023_id_seq1"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."lecturas_semanales_gas_2023_id_seq1" OWNER TO "postgres";


ALTER SEQUENCE "public"."lecturas_semanales_gas_2023_id_seq1" OWNED BY "public"."lecturas_semanales_gas_2023"."id";



CREATE TABLE IF NOT EXISTS "public"."lecturas_semanales_gas_2024" (
    "id" bigint NOT NULL,
    "numero_semana" integer NOT NULL,
    "fecha_inicio" "date" NOT NULL,
    "fecha_fin" "date" NOT NULL,
    "campus_acometida_principal_digital" numeric(15,3),
    "campus_acometida_principal_analogica" numeric(15,3),
    "domo_cultural" numeric(15,3),
    "comedor_centrales_tec_food" numeric(15,3),
    "dona_tota" numeric(15,3),
    "chilaquiles_tec" numeric(15,3),
    "carls_junior" numeric(15,3),
    "centrales_local" numeric(15,3),
    "davilas_grill_team" numeric(15,3),
    "pizza_little_caesars" numeric(15,3),
    "biotecnologia" numeric(15,3),
    "caldera_1_leon" numeric(15,3),
    "mega_calefaccion_1" numeric(15,3),
    "mega_calefaccion_2" numeric(15,3),
    "mega_calefaccion_3" numeric(15,3),
    "mega_calefaccion_4" numeric(15,3),
    "mega_calefaccion_5" numeric(15,3),
    "ciap_super_salads" numeric(15,3),
    "aulas_1" numeric(15,3),
    "biblioteca" numeric(15,3),
    "nikkori" numeric(15,3),
    "nectar_works" numeric(15,3),
    "sr_latino" numeric(15,3),
    "arena_borrego" numeric(15,3),
    "calefaccion_1_bryan" numeric(15,3),
    "calefaccion_2_aerco" numeric(15,3),
    "caldera_3" numeric(15,3),
    "aulas_7" numeric(15,3),
    "la_dia" numeric(15,3),
    "aulas_4" numeric(15,3),
    "centro_congresos_vestidores" numeric(15,3),
    "jubileo" numeric(15,3),
    "expedition" numeric(15,3),
    "bread_expedition" numeric(15,3),
    "matthew_expedition" numeric(15,3),
    "estudiantes_acometida_principal_digital" numeric(15,3),
    "estudiantes_acometida_principal_analogico" numeric(15,3),
    "cedes" numeric(15,3),
    "cedes_trabajadores_vestidores" numeric(15,3),
    "caldera_2" numeric(15,3),
    "comedor_estudiantes" numeric(15,3),
    "residencias_4" numeric(15,3),
    "residencias_1" numeric(15,3),
    "residencias_2" numeric(15,3),
    "residencias_5" numeric(15,3),
    "residencias_8" numeric(15,3),
    "residencias_7" numeric(15,3),
    "residencias_3" numeric(15,3),
    "residencias_abc_calefaccion" numeric(15,3),
    "residencias_abc_regaderas" numeric(15,3),
    "residencias_abc_locales_comida" numeric(15,3),
    "campus_norte_acometida_externa" numeric(15,3),
    "campus_norte_acometida_interna" numeric(15,3),
    "campus_norte_comedor_d" numeric(15,3),
    "campus_norte_edificio_d_calefaccion" numeric(15,3),
    "estadio_borrego_acometida_digital" numeric(15,3),
    "estadio_borrego_acometida_analogica" numeric(15,3),
    "estadio_yarda" numeric(15,3),
    "wellness_acometida_digital" numeric(15,3),
    "wellness_acometida_analogica" numeric(15,3),
    "wellness_supersalads" numeric(15,3),
    "wellness_general_calefaccion" numeric(15,3),
    "wellness_calentador_sotano_regaderas" numeric(15,3),
    "wellness_alberca" numeric(15,3),
    "auditorio_luis_elizondo" numeric(15,3),
    "pabellon_tec_semillero" numeric(15,3),
    "pabellon_tec_cocina_estudiantes_2do_piso" numeric(15,3),
    "guarderia" numeric(15,3),
    "escamilla" numeric(15,3),
    "casa_solar" numeric(15,3),
    "estudiantes_11" numeric(15,3),
    "estudiantes_12" numeric(15,3),
    "estudiantes_13" numeric(15,3),
    "estudiantes_15_y_10" numeric(15,3),
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."lecturas_semanales_gas_2024" OWNER TO "postgres";


COMMENT ON TABLE "public"."lecturas_semanales_gas_2024" IS 'Lecturas semanales de medidores de gas del campus - Año 2024';



COMMENT ON COLUMN "public"."lecturas_semanales_gas_2024"."numero_semana" IS 'Número de semana del año (1-52)';



COMMENT ON COLUMN "public"."lecturas_semanales_gas_2024"."fecha_inicio" IS 'Fecha de inicio de la semana';



COMMENT ON COLUMN "public"."lecturas_semanales_gas_2024"."fecha_fin" IS 'Fecha de fin de la semana';



CREATE TABLE IF NOT EXISTS "public"."lecturas_semanales_gas_consumo_2024" (
    "id" bigint NOT NULL,
    "numero_semana" integer NOT NULL,
    "fecha_inicio" "date" NOT NULL,
    "fecha_fin" "date" NOT NULL,
    "campus_acometida_principal_digital" numeric(15,3),
    "campus_acometida_principal_analogica" numeric(15,3),
    "domo_cultural" numeric(15,3),
    "comedor_centrales_tec_food" numeric(15,3),
    "dona_tota" numeric(15,3),
    "chilaquiles_tec" numeric(15,3),
    "carls_junior" numeric(15,3),
    "centrales_local" numeric(15,3),
    "davilas_grill_team" numeric(15,3),
    "pizza_little_caesars" numeric(15,3),
    "biotecnologia" numeric(15,3),
    "caldera_1_leon" numeric(15,3),
    "mega_calefaccion_1" numeric(15,3),
    "mega_calefaccion_2" numeric(15,3),
    "mega_calefaccion_3" numeric(15,3),
    "mega_calefaccion_4" numeric(15,3),
    "mega_calefaccion_5" numeric(15,3),
    "ciap_super_salads" numeric(15,3),
    "aulas_1" numeric(15,3),
    "biblioteca" numeric(15,3),
    "nikkori" numeric(15,3),
    "nectar_works" numeric(15,3),
    "sr_latino" numeric(15,3),
    "arena_borrego" numeric(15,3),
    "calefaccion_1_bryan" numeric(15,3),
    "calefaccion_2_aerco" numeric(15,3),
    "caldera_3" numeric(15,3),
    "aulas_7" numeric(15,3),
    "la_dia" numeric(15,3),
    "aulas_4" numeric(15,3),
    "centro_congresos_vestidores" numeric(15,3),
    "jubileo" numeric(15,3),
    "expedition" numeric(15,3),
    "bread_expedition" numeric(15,3),
    "matthew_expedition" numeric(15,3),
    "estudiantes_acometida_principal_digital" numeric(15,3),
    "estudiantes_acometida_principal_analogico" numeric(15,3),
    "cedes" numeric(15,3),
    "cedes_trabajadores_vestidores" numeric(15,3),
    "caldera_2" numeric(15,3),
    "comedor_estudiantes" numeric(15,3),
    "residencias_4" numeric(15,3),
    "residencias_1" numeric(15,3),
    "residencias_2" numeric(15,3),
    "residencias_5" numeric(15,3),
    "residencias_8" numeric(15,3),
    "residencias_7" numeric(15,3),
    "residencias_3" numeric(15,3),
    "residencias_abc_calefaccion" numeric(15,3),
    "residencias_abc_regaderas" numeric(15,3),
    "residencias_abc_locales_comida" numeric(15,3),
    "campus_norte_acometida_externa" numeric(15,3),
    "campus_norte_acometida_interna" numeric(15,3),
    "campus_norte_comedor_d" numeric(15,3),
    "campus_norte_edificio_d_calefaccion" numeric(15,3),
    "estadio_borrego_acometida_digital" numeric(15,3),
    "estadio_borrego_acometida_analogica" numeric(15,3),
    "estadio_yarda" numeric(15,3),
    "wellness_acometida_digital" numeric(15,3),
    "wellness_acometida_analogica" numeric(15,3),
    "wellness_supersalads" numeric(15,3),
    "wellness_general_calefaccion" numeric(15,3),
    "wellness_calentador_sotano_regaderas" numeric(15,3),
    "wellness_alberca" numeric(15,3),
    "auditorio_luis_elizondo" numeric(15,3),
    "pabellon_tec_semillero" numeric(15,3),
    "pabellon_tec_cocina_estudiantes_2do_piso" numeric(15,3),
    "guarderia" numeric(15,3),
    "escamilla" numeric(15,3),
    "casa_solar" numeric(15,3),
    "estudiantes_11" numeric(15,3),
    "estudiantes_12" numeric(15,3),
    "estudiantes_13" numeric(15,3),
    "estudiantes_15_y_10" numeric(15,3),
    "cdb1" numeric(15,3),
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."lecturas_semanales_gas_consumo_2024" OWNER TO "postgres";


COMMENT ON TABLE "public"."lecturas_semanales_gas_consumo_2024" IS 'Lecturas semanales de medidores de gas del campus - Año 2024';



COMMENT ON COLUMN "public"."lecturas_semanales_gas_consumo_2024"."numero_semana" IS 'Número de semana del año (1-52)';



COMMENT ON COLUMN "public"."lecturas_semanales_gas_consumo_2024"."fecha_inicio" IS 'Fecha de inicio de la semana';



COMMENT ON COLUMN "public"."lecturas_semanales_gas_consumo_2024"."fecha_fin" IS 'Fecha de fin de la semana';



CREATE SEQUENCE IF NOT EXISTS "public"."lecturas_semanales_gas_2024_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."lecturas_semanales_gas_2024_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."lecturas_semanales_gas_2024_id_seq" OWNED BY "public"."lecturas_semanales_gas_consumo_2024"."id";



CREATE SEQUENCE IF NOT EXISTS "public"."lecturas_semanales_gas_2024_id_seq1"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."lecturas_semanales_gas_2024_id_seq1" OWNER TO "postgres";


ALTER SEQUENCE "public"."lecturas_semanales_gas_2024_id_seq1" OWNED BY "public"."lecturas_semanales_gas_2024"."id";



CREATE TABLE IF NOT EXISTS "public"."lecturas_semanales_gas_2025" (
    "id" bigint NOT NULL,
    "numero_semana" integer NOT NULL,
    "fecha_inicio" "date" NOT NULL,
    "fecha_fin" "date" NOT NULL,
    "campus_acometida_principal_digital" numeric(15,3),
    "campus_acometida_principal_analogica" numeric(15,3),
    "domo_cultural" numeric(15,3),
    "comedor_centrales_tec_food" numeric(15,3),
    "dona_tota" numeric(15,3),
    "chilaquiles_tec" numeric(15,3),
    "carls_junior" numeric(15,3),
    "centrales_local" numeric(15,3),
    "davilas_grill_team" numeric(15,3),
    "pizza_little_caesars" numeric(15,3),
    "biotecnologia" numeric(15,3),
    "caldera_1_leon" numeric(15,3),
    "mega_calefaccion_1" numeric(15,3),
    "mega_calefaccion_2" numeric(15,3),
    "mega_calefaccion_3" numeric(15,3),
    "mega_calefaccion_4" numeric(15,3),
    "mega_calefaccion_5" numeric(15,3),
    "ciap_super_salads" numeric(15,3),
    "aulas_1" numeric(15,3),
    "biblioteca" numeric(15,3),
    "nikkori" numeric(15,3),
    "nectar_works" numeric(15,3),
    "sr_latino" numeric(15,3),
    "arena_borrego" numeric(15,3),
    "calefaccion_1_bryan" numeric(15,3),
    "calefaccion_2_aerco" numeric(15,3),
    "caldera_3" numeric(15,3),
    "aulas_7" numeric(15,3),
    "la_dia" numeric(15,3),
    "aulas_4" numeric(15,3),
    "centro_congresos_vestidores" numeric(15,3),
    "jubileo" numeric(15,3),
    "expedition" numeric(15,3),
    "bread_expedition" numeric(15,3),
    "matthew_expedition" numeric(15,3),
    "estudiantes_acometida_principal_digital" numeric(15,3),
    "estudiantes_acometida_principal_analogico" numeric(15,3),
    "cedes" numeric(15,3),
    "cedes_trabajadores_vestidores" numeric(15,3),
    "caldera_2" numeric(15,3),
    "comedor_estudiantes" numeric(15,3),
    "residencias_4" numeric(15,3),
    "residencias_1" numeric(15,3),
    "residencias_2" numeric(15,3),
    "residencias_5" numeric(15,3),
    "residencias_8" numeric(15,3),
    "residencias_7" numeric(15,3),
    "residencias_3" numeric(15,3),
    "residencias_abc_calefaccion" numeric(15,3),
    "residencias_abc_regaderas" numeric(15,3),
    "residencias_abc_locales_comida" numeric(15,3),
    "campus_norte_acometida_externa" numeric(15,3),
    "campus_norte_acometida_interna" numeric(15,3),
    "campus_norte_comedor_d" numeric(15,3),
    "campus_norte_edificio_d_calefaccion" numeric(15,3),
    "estadio_borrego_acometida_digital" numeric(15,3),
    "estadio_borrego_acometida_analogica" numeric(15,3),
    "estadio_yarda" numeric(15,3),
    "wellness_acometida_digital" numeric(15,3),
    "wellness_acometida_analogica" numeric(15,3),
    "wellness_supersalads" numeric(15,3),
    "wellness_general_calefaccion" numeric(15,3),
    "wellness_calentador_sotano_regaderas" numeric(15,3),
    "wellness_alberca" numeric(15,3),
    "auditorio_luis_elizondo" numeric(15,3),
    "pabellon_tec_semillero" numeric(15,3),
    "pabellon_tec_cocina_estudiantes_2do_piso" numeric(15,3),
    "guarderia" numeric(15,3),
    "escamilla" numeric(15,3),
    "casa_solar" numeric(15,3),
    "estudiantes_11" numeric(15,3),
    "estudiantes_12" numeric(15,3),
    "estudiantes_13" numeric(15,3),
    "estudiantes_15_y_10" numeric(15,3),
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."lecturas_semanales_gas_2025" OWNER TO "postgres";


COMMENT ON TABLE "public"."lecturas_semanales_gas_2025" IS 'Lecturas semanales de medidores de gas del campus - Año 2025';



COMMENT ON COLUMN "public"."lecturas_semanales_gas_2025"."numero_semana" IS 'Número de semana del año (1-52)';



COMMENT ON COLUMN "public"."lecturas_semanales_gas_2025"."fecha_inicio" IS 'Fecha de inicio de la semana';



COMMENT ON COLUMN "public"."lecturas_semanales_gas_2025"."fecha_fin" IS 'Fecha de fin de la semana';



CREATE TABLE IF NOT EXISTS "public"."lecturas_semanales_gas_consumo_2025" (
    "id" bigint NOT NULL,
    "numero_semana" integer NOT NULL,
    "fecha_inicio" "date" NOT NULL,
    "fecha_fin" "date" NOT NULL,
    "campus_acometida_principal_digital" numeric(15,3),
    "campus_acometida_principal_analogica" numeric(15,3),
    "domo_cultural" numeric(15,3),
    "comedor_centrales_tec_food" numeric(15,3),
    "dona_tota" numeric(15,3),
    "chilaquiles_tec" numeric(15,3),
    "carls_junior" numeric(15,3),
    "centrales_local" numeric(15,3),
    "davilas_grill_team" numeric(15,3),
    "pizza_little_caesars" numeric(15,3),
    "biotecnologia" numeric(15,3),
    "caldera_1_leon" numeric(15,3),
    "mega_calefaccion_1" numeric(15,3),
    "mega_calefaccion_2" numeric(15,3),
    "mega_calefaccion_3" numeric(15,3),
    "mega_calefaccion_4" numeric(15,3),
    "mega_calefaccion_5" numeric(15,3),
    "ciap_super_salads" numeric(15,3),
    "aulas_1" numeric(15,3),
    "biblioteca" numeric(15,3),
    "nikkori" numeric(15,3),
    "nectar_works" numeric(15,3),
    "sr_latino" numeric(15,3),
    "arena_borrego" numeric(15,3),
    "calefaccion_1_bryan" numeric(15,3),
    "calefaccion_2_aerco" numeric(15,3),
    "caldera_3" numeric(15,3),
    "aulas_7" numeric(15,3),
    "la_dia" numeric(15,3),
    "aulas_4" numeric(15,3),
    "centro_congresos_vestidores" numeric(15,3),
    "jubileo" numeric(15,3),
    "expedition" numeric(15,3),
    "bread_expedition" numeric(15,3),
    "matthew_expedition" numeric(15,3),
    "estudiantes_acometida_principal_digital" numeric(15,3),
    "estudiantes_acometida_principal_analogico" numeric(15,3),
    "cedes" numeric(15,3),
    "cedes_trabajadores_vestidores" numeric(15,3),
    "caldera_2" numeric(15,3),
    "comedor_estudiantes" numeric(15,3),
    "residencias_4" numeric(15,3),
    "residencias_1" numeric(15,3),
    "residencias_2" numeric(15,3),
    "residencias_5" numeric(15,3),
    "residencias_8" numeric(15,3),
    "residencias_7" numeric(15,3),
    "residencias_3" numeric(15,3),
    "residencias_abc_calefaccion" numeric(15,3),
    "residencias_abc_regaderas" numeric(15,3),
    "residencias_abc_locales_comida" numeric(15,3),
    "campus_norte_acometida_externa" numeric(15,3),
    "campus_norte_acometida_interna" numeric(15,3),
    "campus_norte_comedor_d" numeric(15,3),
    "campus_norte_edificio_d_calefaccion" numeric(15,3),
    "estadio_borrego_acometida_digital" numeric(15,3),
    "estadio_borrego_acometida_analogica" numeric(15,3),
    "estadio_yarda" numeric(15,3),
    "wellness_acometida_digital" numeric(15,3),
    "wellness_acometida_analogica" numeric(15,3),
    "wellness_supersalads" numeric(15,3),
    "wellness_general_calefaccion" numeric(15,3),
    "wellness_calentador_sotano_regaderas" numeric(15,3),
    "wellness_alberca" numeric(15,3),
    "auditorio_luis_elizondo" numeric(15,3),
    "pabellon_tec_semillero" numeric(15,3),
    "pabellon_tec_cocina_estudiantes_2do_piso" numeric(15,3),
    "guarderia" numeric(15,3),
    "escamilla" numeric(15,3),
    "casa_solar" numeric(15,3),
    "estudiantes_11" numeric(15,3),
    "estudiantes_12" numeric(15,3),
    "estudiantes_13" numeric(15,3),
    "estudiantes_15_y_10" numeric(15,3),
    "cdb1" numeric(15,3),
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."lecturas_semanales_gas_consumo_2025" OWNER TO "postgres";


COMMENT ON TABLE "public"."lecturas_semanales_gas_consumo_2025" IS 'Lecturas semanales de medidores de gas del campus - Año 2025';



COMMENT ON COLUMN "public"."lecturas_semanales_gas_consumo_2025"."numero_semana" IS 'Número de semana del año (1-52)';



COMMENT ON COLUMN "public"."lecturas_semanales_gas_consumo_2025"."fecha_inicio" IS 'Fecha de inicio de la semana';



COMMENT ON COLUMN "public"."lecturas_semanales_gas_consumo_2025"."fecha_fin" IS 'Fecha de fin de la semana';



CREATE SEQUENCE IF NOT EXISTS "public"."lecturas_semanales_gas_2025_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."lecturas_semanales_gas_2025_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."lecturas_semanales_gas_2025_id_seq" OWNED BY "public"."lecturas_semanales_gas_consumo_2025"."id";



CREATE SEQUENCE IF NOT EXISTS "public"."lecturas_semanales_gas_2025_id_seq1"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."lecturas_semanales_gas_2025_id_seq1" OWNER TO "postgres";


ALTER SEQUENCE "public"."lecturas_semanales_gas_2025_id_seq1" OWNED BY "public"."lecturas_semanales_gas_2025"."id";



CREATE TABLE IF NOT EXISTS "public"."lecturas_semanales_gas_2026" (
    "id" bigint NOT NULL,
    "numero_semana" integer NOT NULL,
    "fecha_inicio" "date" NOT NULL,
    "fecha_fin" "date" NOT NULL,
    "campus_acometida_principal_digital" numeric(15,3),
    "campus_acometida_principal_analogica" numeric(15,3),
    "domo_cultural" numeric(15,3),
    "comedor_centrales_tec_food" numeric(15,3),
    "dona_tota" numeric(15,3),
    "chilaquiles_tec" numeric(15,3),
    "carls_junior" numeric(15,3),
    "centrales_local" numeric(15,3),
    "davilas_grill_team" numeric(15,3),
    "pizza_little_caesars" numeric(15,3),
    "biotecnologia" numeric(15,3),
    "caldera_1_leon" numeric(15,3),
    "mega_calefaccion_1" numeric(15,3),
    "mega_calefaccion_2" numeric(15,3),
    "mega_calefaccion_3" numeric(15,3),
    "mega_calefaccion_4" numeric(15,3),
    "mega_calefaccion_5" numeric(15,3),
    "ciap_super_salads" numeric(15,3),
    "aulas_1" numeric(15,3),
    "biblioteca" numeric(15,3),
    "nikkori" numeric(15,3),
    "nectar_works" numeric(15,3),
    "sr_latino" numeric(15,3),
    "arena_borrego" numeric(15,3),
    "calefaccion_1_bryan" numeric(15,3),
    "calefaccion_2_aerco" numeric(15,3),
    "caldera_3" numeric(15,3),
    "aulas_7" numeric(15,3),
    "la_dia" numeric(15,3),
    "aulas_4" numeric(15,3),
    "centro_congresos_vestidores" numeric(15,3),
    "jubileo" numeric(15,3),
    "expedition" numeric(15,3),
    "bread_expedition" numeric(15,3),
    "matthew_expedition" numeric(15,3),
    "estudiantes_acometida_principal_digital" numeric(15,3),
    "estudiantes_acometida_principal_analogico" numeric(15,3),
    "cedes" numeric(15,3),
    "cedes_trabajadores_vestidores" numeric(15,3),
    "caldera_2" numeric(15,3),
    "comedor_estudiantes" numeric(15,3),
    "residencias_4" numeric(15,3),
    "residencias_1" numeric(15,3),
    "residencias_2" numeric(15,3),
    "residencias_5" numeric(15,3),
    "residencias_8" numeric(15,3),
    "residencias_7" numeric(15,3),
    "residencias_3" numeric(15,3),
    "residencias_abc_calefaccion" numeric(15,3),
    "residencias_abc_regaderas" numeric(15,3),
    "residencias_abc_locales_comida" numeric(15,3),
    "campus_norte_acometida_externa" numeric(15,3),
    "campus_norte_acometida_interna" numeric(15,3),
    "campus_norte_comedor_d" numeric(15,3),
    "campus_norte_edificio_d_calefaccion" numeric(15,3),
    "estadio_borrego_acometida_digital" numeric(15,3),
    "estadio_borrego_acometida_analogica" numeric(15,3),
    "estadio_yarda" numeric(15,3),
    "wellness_acometida_digital" numeric(15,3),
    "wellness_acometida_analogica" numeric(15,3),
    "wellness_supersalads" numeric(15,3),
    "wellness_general_calefaccion" numeric(15,3),
    "wellness_calentador_sotano_regaderas" numeric(15,3),
    "wellness_alberca" numeric(15,3),
    "auditorio_luis_elizondo" numeric(15,3),
    "pabellon_tec_semillero" numeric(15,3),
    "pabellon_tec_cocina_estudiantes_2do_piso" numeric(15,3),
    "guarderia" numeric(15,3),
    "escamilla" numeric(15,3),
    "casa_solar" numeric(15,3),
    "estudiantes_11" numeric(15,3),
    "estudiantes_12" numeric(15,3),
    "estudiantes_13" numeric(15,3),
    "estudiantes_15_y_10" numeric(15,3),
    "cdb1" numeric(15,3),
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."lecturas_semanales_gas_2026" OWNER TO "postgres";


COMMENT ON TABLE "public"."lecturas_semanales_gas_2026" IS 'Lecturas semanales de medidores de gas del campus - Año 2026';



COMMENT ON COLUMN "public"."lecturas_semanales_gas_2026"."numero_semana" IS 'Número de semana del año (1-52)';



COMMENT ON COLUMN "public"."lecturas_semanales_gas_2026"."fecha_inicio" IS 'Fecha de inicio de la semana';



COMMENT ON COLUMN "public"."lecturas_semanales_gas_2026"."fecha_fin" IS 'Fecha de fin de la semana';



CREATE SEQUENCE IF NOT EXISTS "public"."lecturas_semanales_gas_2026_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."lecturas_semanales_gas_2026_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."lecturas_semanales_gas_2026_id_seq" OWNED BY "public"."lecturas_semanales_gas_2026"."id";



CREATE TABLE IF NOT EXISTS "public"."lecturas_semanales_gas_consumo_2026" (
    "id" bigint NOT NULL,
    "numero_semana" integer NOT NULL,
    "fecha_inicio" "date" NOT NULL,
    "fecha_fin" "date" NOT NULL,
    "campus_acometida_principal_digital" numeric(15,3),
    "campus_acometida_principal_analogica" numeric(15,3),
    "domo_cultural" numeric(15,3),
    "comedor_centrales_tec_food" numeric(15,3),
    "dona_tota" numeric(15,3),
    "chilaquiles_tec" numeric(15,3),
    "carls_junior" numeric(15,3),
    "centrales_local" numeric(15,3),
    "davilas_grill_team" numeric(15,3),
    "pizza_little_caesars" numeric(15,3),
    "biotecnologia" numeric(15,3),
    "caldera_1_leon" numeric(15,3),
    "mega_calefaccion_1" numeric(15,3),
    "mega_calefaccion_2" numeric(15,3),
    "mega_calefaccion_3" numeric(15,3),
    "mega_calefaccion_4" numeric(15,3),
    "mega_calefaccion_5" numeric(15,3),
    "ciap_super_salads" numeric(15,3),
    "aulas_1" numeric(15,3),
    "biblioteca" numeric(15,3),
    "nikkori" numeric(15,3),
    "nectar_works" numeric(15,3),
    "sr_latino" numeric(15,3),
    "arena_borrego" numeric(15,3),
    "calefaccion_1_bryan" numeric(15,3),
    "calefaccion_2_aerco" numeric(15,3),
    "caldera_3" numeric(15,3),
    "aulas_7" numeric(15,3),
    "la_dia" numeric(15,3),
    "aulas_4" numeric(15,3),
    "centro_congresos_vestidores" numeric(15,3),
    "jubileo" numeric(15,3),
    "expedition" numeric(15,3),
    "bread_expedition" numeric(15,3),
    "matthew_expedition" numeric(15,3),
    "estudiantes_acometida_principal_digital" numeric(15,3),
    "estudiantes_acometida_principal_analogico" numeric(15,3),
    "cedes" numeric(15,3),
    "cedes_trabajadores_vestidores" numeric(15,3),
    "caldera_2" numeric(15,3),
    "comedor_estudiantes" numeric(15,3),
    "residencias_4" numeric(15,3),
    "residencias_1" numeric(15,3),
    "residencias_2" numeric(15,3),
    "residencias_5" numeric(15,3),
    "residencias_8" numeric(15,3),
    "residencias_7" numeric(15,3),
    "residencias_3" numeric(15,3),
    "residencias_abc_calefaccion" numeric(15,3),
    "residencias_abc_regaderas" numeric(15,3),
    "residencias_abc_locales_comida" numeric(15,3),
    "campus_norte_acometida_externa" numeric(15,3),
    "campus_norte_acometida_interna" numeric(15,3),
    "campus_norte_comedor_d" numeric(15,3),
    "campus_norte_edificio_d_calefaccion" numeric(15,3),
    "estadio_borrego_acometida_digital" numeric(15,3),
    "estadio_borrego_acometida_analogica" numeric(15,3),
    "estadio_yarda" numeric(15,3),
    "wellness_acometida_digital" numeric(15,3),
    "wellness_acometida_analogica" numeric(15,3),
    "wellness_supersalads" numeric(15,3),
    "wellness_general_calefaccion" numeric(15,3),
    "wellness_calentador_sotano_regaderas" numeric(15,3),
    "wellness_alberca" numeric(15,3),
    "auditorio_luis_elizondo" numeric(15,3),
    "pabellon_tec_semillero" numeric(15,3),
    "pabellon_tec_cocina_estudiantes_2do_piso" numeric(15,3),
    "guarderia" numeric(15,3),
    "escamilla" numeric(15,3),
    "casa_solar" numeric(15,3),
    "estudiantes_11" numeric(15,3),
    "estudiantes_12" numeric(15,3),
    "estudiantes_13" numeric(15,3),
    "estudiantes_15_y_10" numeric(15,3),
    "cdb1" numeric(15,3),
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."lecturas_semanales_gas_consumo_2026" OWNER TO "postgres";


COMMENT ON TABLE "public"."lecturas_semanales_gas_consumo_2026" IS 'Consumo semanal de gas del campus - Año 2026';



COMMENT ON COLUMN "public"."lecturas_semanales_gas_consumo_2026"."numero_semana" IS 'Número de semana del año (1-52)';



COMMENT ON COLUMN "public"."lecturas_semanales_gas_consumo_2026"."fecha_inicio" IS 'Fecha de inicio de la semana';



COMMENT ON COLUMN "public"."lecturas_semanales_gas_consumo_2026"."fecha_fin" IS 'Fecha de fin de la semana';



CREATE SEQUENCE IF NOT EXISTS "public"."lecturas_semanales_gas_consumo_2026_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."lecturas_semanales_gas_consumo_2026_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."lecturas_semanales_gas_consumo_2026_id_seq" OWNED BY "public"."lecturas_semanales_gas_consumo_2026"."id";



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "username" "text",
    "full_name" "text",
    "avatar_url" "text",
    "email" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "company" "text",
    "role" "text" DEFAULT 'user'::"text"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reading_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "year" integer NOT NULL,
    "week_number" integer NOT NULL,
    "point_id" character varying(100) NOT NULL,
    "comment" "text" NOT NULL,
    "author" character varying(100),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."reading_comments" OWNER TO "postgres";


COMMENT ON TABLE "public"."reading_comments" IS 'Comentarios asociados a lecturas específicas de puntos de medición';



COMMENT ON COLUMN "public"."reading_comments"."year" IS 'Año de la lectura';



COMMENT ON COLUMN "public"."reading_comments"."week_number" IS 'Número de semana de la lectura';



COMMENT ON COLUMN "public"."reading_comments"."point_id" IS 'ID del punto de medición (ej: pozo_11, residencias_10_15)';



COMMENT ON COLUMN "public"."reading_comments"."comment" IS 'Texto del comentario';



COMMENT ON COLUMN "public"."reading_comments"."author" IS 'Nombre del autor del comentario';



CREATE OR REPLACE VIEW "public"."vista_ptar_resumen_anual" AS
 SELECT EXTRACT(year FROM "fecha") AS "año",
    "count"(*) AS "total_registros",
    "sum"("ar") AS "total_agua_residual_m3",
    "sum"("at") AS "total_agua_tratada_m3",
    "avg"("ar") AS "promedio_diario_ar_m3",
    "avg"("at") AS "promedio_diario_at_m3",
    "round"("avg"(
        CASE
            WHEN ("ar" > (0)::numeric) THEN (("at" / "ar") * (100)::numeric)
            ELSE NULL::numeric
        END), 2) AS "eficiencia_promedio_porcentaje",
    "min"("fecha") AS "fecha_inicio",
    "max"("fecha") AS "fecha_fin"
   FROM "public"."lecturas_ptar"
  WHERE (("ar" IS NOT NULL) AND ("at" IS NOT NULL))
  GROUP BY (EXTRACT(year FROM "fecha"))
  ORDER BY (EXTRACT(year FROM "fecha")) DESC;


ALTER VIEW "public"."vista_ptar_resumen_anual" OWNER TO "postgres";


COMMENT ON VIEW "public"."vista_ptar_resumen_anual" IS 'Resumen anual de lecturas PTAR con totales y promedios';



CREATE OR REPLACE VIEW "public"."vista_ptar_resumen_mensual" AS
 SELECT EXTRACT(year FROM "fecha") AS "año",
    EXTRACT(month FROM "fecha") AS "mes",
    "to_char"(("fecha")::timestamp with time zone, 'YYYY-MM'::"text") AS "periodo",
    "count"(*) AS "total_registros",
    "sum"("ar") AS "total_agua_residual_m3",
    "sum"("at") AS "total_agua_tratada_m3",
    "avg"("ar") AS "promedio_diario_ar_m3",
    "avg"("at") AS "promedio_diario_at_m3",
    "round"("avg"(
        CASE
            WHEN ("ar" > (0)::numeric) THEN (("at" / "ar") * (100)::numeric)
            ELSE NULL::numeric
        END), 2) AS "eficiencia_promedio_porcentaje"
   FROM "public"."lecturas_ptar"
  WHERE (("ar" IS NOT NULL) AND ("at" IS NOT NULL))
  GROUP BY (EXTRACT(year FROM "fecha")), (EXTRACT(month FROM "fecha")), ("to_char"(("fecha")::timestamp with time zone, 'YYYY-MM'::"text"))
  ORDER BY (EXTRACT(year FROM "fecha")) DESC, (EXTRACT(month FROM "fecha")) DESC;


ALTER VIEW "public"."vista_ptar_resumen_mensual" OWNER TO "postgres";


COMMENT ON VIEW "public"."vista_ptar_resumen_mensual" IS 'Resumen mensual de lecturas PTAR con totales y promedios';



CREATE OR REPLACE VIEW "public"."vista_ptar_resumen_trimestral" AS
 SELECT EXTRACT(year FROM "fecha") AS "año",
        CASE
            WHEN ((EXTRACT(month FROM "fecha") >= (1)::numeric) AND (EXTRACT(month FROM "fecha") <= (3)::numeric)) THEN 1
            WHEN ((EXTRACT(month FROM "fecha") >= (4)::numeric) AND (EXTRACT(month FROM "fecha") <= (6)::numeric)) THEN 2
            WHEN ((EXTRACT(month FROM "fecha") >= (7)::numeric) AND (EXTRACT(month FROM "fecha") <= (9)::numeric)) THEN 3
            ELSE 4
        END AS "trimestre",
        CASE
            WHEN ((EXTRACT(month FROM "fecha") >= (1)::numeric) AND (EXTRACT(month FROM "fecha") <= (3)::numeric)) THEN 'T1'::"text"
            WHEN ((EXTRACT(month FROM "fecha") >= (4)::numeric) AND (EXTRACT(month FROM "fecha") <= (6)::numeric)) THEN 'T2'::"text"
            WHEN ((EXTRACT(month FROM "fecha") >= (7)::numeric) AND (EXTRACT(month FROM "fecha") <= (9)::numeric)) THEN 'T3'::"text"
            ELSE 'T4'::"text"
        END AS "trimestre_label",
    "count"(*) AS "total_registros",
    "sum"("ar") AS "total_agua_residual_m3",
    "sum"("at") AS "total_agua_tratada_m3",
    "avg"("ar") AS "promedio_diario_ar_m3",
    "avg"("at") AS "promedio_diario_at_m3",
    "round"("avg"(
        CASE
            WHEN ("ar" > (0)::numeric) THEN (("at" / "ar") * (100)::numeric)
            ELSE NULL::numeric
        END), 2) AS "eficiencia_promedio_porcentaje"
   FROM "public"."lecturas_ptar"
  WHERE (("ar" IS NOT NULL) AND ("at" IS NOT NULL))
  GROUP BY (EXTRACT(year FROM "fecha")),
        CASE
            WHEN ((EXTRACT(month FROM "fecha") >= (1)::numeric) AND (EXTRACT(month FROM "fecha") <= (3)::numeric)) THEN 1
            WHEN ((EXTRACT(month FROM "fecha") >= (4)::numeric) AND (EXTRACT(month FROM "fecha") <= (6)::numeric)) THEN 2
            WHEN ((EXTRACT(month FROM "fecha") >= (7)::numeric) AND (EXTRACT(month FROM "fecha") <= (9)::numeric)) THEN 3
            ELSE 4
        END,
        CASE
            WHEN ((EXTRACT(month FROM "fecha") >= (1)::numeric) AND (EXTRACT(month FROM "fecha") <= (3)::numeric)) THEN 'T1'::"text"
            WHEN ((EXTRACT(month FROM "fecha") >= (4)::numeric) AND (EXTRACT(month FROM "fecha") <= (6)::numeric)) THEN 'T2'::"text"
            WHEN ((EXTRACT(month FROM "fecha") >= (7)::numeric) AND (EXTRACT(month FROM "fecha") <= (9)::numeric)) THEN 'T3'::"text"
            ELSE 'T4'::"text"
        END
  ORDER BY (EXTRACT(year FROM "fecha")) DESC,
        CASE
            WHEN ((EXTRACT(month FROM "fecha") >= (1)::numeric) AND (EXTRACT(month FROM "fecha") <= (3)::numeric)) THEN 1
            WHEN ((EXTRACT(month FROM "fecha") >= (4)::numeric) AND (EXTRACT(month FROM "fecha") <= (6)::numeric)) THEN 2
            WHEN ((EXTRACT(month FROM "fecha") >= (7)::numeric) AND (EXTRACT(month FROM "fecha") <= (9)::numeric)) THEN 3
            ELSE 4
        END DESC;


ALTER VIEW "public"."vista_ptar_resumen_trimestral" OWNER TO "postgres";


COMMENT ON VIEW "public"."vista_ptar_resumen_trimestral" IS 'Resumen trimestral de lecturas PTAR con totales y promedios';



CREATE TABLE IF NOT EXISTS "public"."well_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "well_id" integer NOT NULL,
    "comment_text" "text" NOT NULL,
    "author_name" character varying(255) DEFAULT 'Usuario'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."well_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."well_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "well_id" integer NOT NULL,
    "event_type" character varying(50) NOT NULL,
    "event_status" character varying(50) DEFAULT 'activo'::character varying,
    "title" character varying(255) NOT NULL,
    "description" "text",
    "start_date" timestamp with time zone NOT NULL,
    "end_date" timestamp with time zone,
    "author_name" character varying(255) DEFAULT 'Usuario'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "well_events_event_status_check" CHECK ((("event_status")::"text" = ANY ((ARRAY['activo'::character varying, 'completado'::character varying, 'cancelado'::character varying])::"text"[]))),
    CONSTRAINT "well_events_event_type_check" CHECK ((("event_type")::"text" = ANY ((ARRAY['mantenimiento'::character varying, 'parado'::character varying, 'reparacion'::character varying, 'inspeccion'::character varying, 'otro'::character varying])::"text"[])))
);


ALTER TABLE "public"."well_events" OWNER TO "postgres";


ALTER TABLE ONLY "public"."correos" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."correos_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."factores_agua" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."factores_agua_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."lecturas_diarias" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."lecturas_diarias_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."lecturas_mensuales_agua" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."lecturas_mensuales_agua_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."lecturas_mensuales_agua_consumo" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."lecturas_mensuales_agua_consumo_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."lecturas_ptar" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."lecturas_ptar_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."lecturas_semana_agua_2023" ALTER COLUMN "l_id" SET DEFAULT "nextval"('"public"."lecturas_semana_agua_2023_l_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."lecturas_semana_agua_2024" ALTER COLUMN "l_id" SET DEFAULT "nextval"('"public"."lecturas_semana_agua_2024_l_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."lecturas_semana_agua_2025" ALTER COLUMN "l_id" SET DEFAULT "nextval"('"public"."lecturas_semana_agua_2025_l_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."lecturas_semana_agua_2026" ALTER COLUMN "l_id" SET DEFAULT "nextval"('"public"."lecturas_semana_agua_2026_l_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."lecturas_semana_agua_consumo_2023" ALTER COLUMN "l_id" SET DEFAULT "nextval"('"public"."lecturas_semana_agua_consumo_2023_l_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."lecturas_semana_agua_consumo_2024" ALTER COLUMN "l_id" SET DEFAULT "nextval"('"public"."lecturas_semana_agua_consumo_2024_l_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."lecturas_semana_agua_consumo_2025" ALTER COLUMN "l_id" SET DEFAULT "nextval"('"public"."lecturas_semana_agua_consumo_2025_l_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."lecturas_semana_agua_consumo_2026" ALTER COLUMN "l_id" SET DEFAULT "nextval"('"public"."lecturas_semana_agua_consumo_2026_l_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."lecturas_semanales_gas_2023" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."lecturas_semanales_gas_2023_id_seq1"'::"regclass");



ALTER TABLE ONLY "public"."lecturas_semanales_gas_2024" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."lecturas_semanales_gas_2024_id_seq1"'::"regclass");



ALTER TABLE ONLY "public"."lecturas_semanales_gas_2025" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."lecturas_semanales_gas_2025_id_seq1"'::"regclass");



ALTER TABLE ONLY "public"."lecturas_semanales_gas_2026" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."lecturas_semanales_gas_2026_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."lecturas_semanales_gas_consumo_2023" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."lecturas_semanales_gas_2023_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."lecturas_semanales_gas_consumo_2024" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."lecturas_semanales_gas_2024_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."lecturas_semanales_gas_consumo_2025" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."lecturas_semanales_gas_2025_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."lecturas_semanales_gas_consumo_2026" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."lecturas_semanales_gas_consumo_2026_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."correos"
    ADD CONSTRAINT "correos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."factores_agua"
    ADD CONSTRAINT "factores_agua_nombre_key" UNIQUE ("nombre");



ALTER TABLE ONLY "public"."factores_agua"
    ADD CONSTRAINT "factores_agua_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lecturas_diarias"
    ADD CONSTRAINT "lecturas_diarias_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lecturas_mensuales_agua_consumo"
    ADD CONSTRAINT "lecturas_mensuales_agua_consumo_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lecturas_mensuales_agua"
    ADD CONSTRAINT "lecturas_mensuales_agua_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lecturas_ptar"
    ADD CONSTRAINT "lecturas_ptar_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lecturas_semana_agua_2023"
    ADD CONSTRAINT "lecturas_semana_agua_2023_l_numero_semana_key" UNIQUE ("l_numero_semana");



ALTER TABLE ONLY "public"."lecturas_semana_agua_2023"
    ADD CONSTRAINT "lecturas_semana_agua_2023_pkey" PRIMARY KEY ("l_id");



ALTER TABLE ONLY "public"."lecturas_semana_agua_2024"
    ADD CONSTRAINT "lecturas_semana_agua_2024_l_numero_semana_key" UNIQUE ("l_numero_semana");



ALTER TABLE ONLY "public"."lecturas_semana_agua_2024"
    ADD CONSTRAINT "lecturas_semana_agua_2024_pkey" PRIMARY KEY ("l_id");



ALTER TABLE ONLY "public"."lecturas_semana_agua_2025"
    ADD CONSTRAINT "lecturas_semana_agua_2025_l_numero_semana_key" UNIQUE ("l_numero_semana");



ALTER TABLE ONLY "public"."lecturas_semana_agua_2025"
    ADD CONSTRAINT "lecturas_semana_agua_2025_pkey" PRIMARY KEY ("l_id");



ALTER TABLE ONLY "public"."lecturas_semana_agua_2026"
    ADD CONSTRAINT "lecturas_semana_agua_2026_l_numero_semana_key" UNIQUE ("l_numero_semana");



ALTER TABLE ONLY "public"."lecturas_semana_agua_2026"
    ADD CONSTRAINT "lecturas_semana_agua_2026_pkey" PRIMARY KEY ("l_id");



ALTER TABLE ONLY "public"."lecturas_semana_agua_consumo_2023"
    ADD CONSTRAINT "lecturas_semana_agua_consumo_2023_l_numero_semana_key" UNIQUE ("l_numero_semana");



ALTER TABLE ONLY "public"."lecturas_semana_agua_consumo_2023"
    ADD CONSTRAINT "lecturas_semana_agua_consumo_2023_pkey" PRIMARY KEY ("l_id");



ALTER TABLE ONLY "public"."lecturas_semana_agua_consumo_2024"
    ADD CONSTRAINT "lecturas_semana_agua_consumo_2024_l_numero_semana_key" UNIQUE ("l_numero_semana");



ALTER TABLE ONLY "public"."lecturas_semana_agua_consumo_2024"
    ADD CONSTRAINT "lecturas_semana_agua_consumo_2024_pkey" PRIMARY KEY ("l_id");



ALTER TABLE ONLY "public"."lecturas_semana_agua_consumo_2025"
    ADD CONSTRAINT "lecturas_semana_agua_consumo_2025_l_numero_semana_key" UNIQUE ("l_numero_semana");



ALTER TABLE ONLY "public"."lecturas_semana_agua_consumo_2025"
    ADD CONSTRAINT "lecturas_semana_agua_consumo_2025_pkey" PRIMARY KEY ("l_id");



ALTER TABLE ONLY "public"."lecturas_semana_agua_consumo_2026"
    ADD CONSTRAINT "lecturas_semana_agua_consumo_2026_l_numero_semana_key" UNIQUE ("l_numero_semana");



ALTER TABLE ONLY "public"."lecturas_semana_agua_consumo_2026"
    ADD CONSTRAINT "lecturas_semana_agua_consumo_2026_pkey" PRIMARY KEY ("l_id");



ALTER TABLE ONLY "public"."lecturas_semanales_gas_consumo_2023"
    ADD CONSTRAINT "lecturas_semanales_gas_2023_numero_semana_key" UNIQUE ("numero_semana");



ALTER TABLE ONLY "public"."lecturas_semanales_gas_2023"
    ADD CONSTRAINT "lecturas_semanales_gas_2023_numero_semana_key1" UNIQUE ("numero_semana");



ALTER TABLE ONLY "public"."lecturas_semanales_gas_consumo_2023"
    ADD CONSTRAINT "lecturas_semanales_gas_2023_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lecturas_semanales_gas_2023"
    ADD CONSTRAINT "lecturas_semanales_gas_2023_pkey1" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lecturas_semanales_gas_consumo_2024"
    ADD CONSTRAINT "lecturas_semanales_gas_2024_numero_semana_key" UNIQUE ("numero_semana");



ALTER TABLE ONLY "public"."lecturas_semanales_gas_2024"
    ADD CONSTRAINT "lecturas_semanales_gas_2024_numero_semana_key1" UNIQUE ("numero_semana");



ALTER TABLE ONLY "public"."lecturas_semanales_gas_consumo_2024"
    ADD CONSTRAINT "lecturas_semanales_gas_2024_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lecturas_semanales_gas_2024"
    ADD CONSTRAINT "lecturas_semanales_gas_2024_pkey1" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lecturas_semanales_gas_consumo_2025"
    ADD CONSTRAINT "lecturas_semanales_gas_2025_numero_semana_key" UNIQUE ("numero_semana");



ALTER TABLE ONLY "public"."lecturas_semanales_gas_2025"
    ADD CONSTRAINT "lecturas_semanales_gas_2025_numero_semana_key1" UNIQUE ("numero_semana");



ALTER TABLE ONLY "public"."lecturas_semanales_gas_consumo_2025"
    ADD CONSTRAINT "lecturas_semanales_gas_2025_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lecturas_semanales_gas_2025"
    ADD CONSTRAINT "lecturas_semanales_gas_2025_pkey1" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lecturas_semanales_gas_2026"
    ADD CONSTRAINT "lecturas_semanales_gas_2026_numero_semana_key" UNIQUE ("numero_semana");



ALTER TABLE ONLY "public"."lecturas_semanales_gas_2026"
    ADD CONSTRAINT "lecturas_semanales_gas_2026_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lecturas_semanales_gas_consumo_2026"
    ADD CONSTRAINT "lecturas_semanales_gas_consumo_2026_numero_semana_key" UNIQUE ("numero_semana");



ALTER TABLE ONLY "public"."lecturas_semanales_gas_consumo_2026"
    ADD CONSTRAINT "lecturas_semanales_gas_consumo_2026_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reading_comments"
    ADD CONSTRAINT "reading_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lecturas_mensuales_agua"
    ADD CONSTRAINT "unique_anio_mes" UNIQUE ("anio", "mes");



ALTER TABLE ONLY "public"."lecturas_mensuales_agua_consumo"
    ADD CONSTRAINT "unique_consumo_anio_mes" UNIQUE ("anio", "mes");



ALTER TABLE ONLY "public"."lecturas_ptar"
    ADD CONSTRAINT "unique_fecha_ptar" UNIQUE ("fecha");



ALTER TABLE ONLY "public"."reading_comments"
    ADD CONSTRAINT "unique_reading_comment" UNIQUE ("year", "week_number", "point_id");



ALTER TABLE ONLY "public"."well_comments"
    ADD CONSTRAINT "well_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."well_events"
    ADD CONSTRAINT "well_events_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_correos_categoria" ON "public"."correos" USING "btree" ("categoria");



CREATE INDEX "idx_correos_created_at" ON "public"."correos" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_correos_email" ON "public"."correos" USING "btree" ("email");



CREATE INDEX "idx_correos_leido" ON "public"."correos" USING "btree" ("leido");



CREATE INDEX "idx_factores_agua_nombre" ON "public"."factores_agua" USING "btree" ("nombre");



CREATE INDEX "idx_lecturas_created_at" ON "public"."lecturas_diarias" USING "btree" ("created_at");



CREATE INDEX "idx_lecturas_dia_hora" ON "public"."lecturas_diarias" USING "btree" ("dia_hora");



CREATE INDEX "idx_lecturas_gas_2023_fecha_fin" ON "public"."lecturas_semanales_gas_consumo_2023" USING "btree" ("fecha_fin");



CREATE INDEX "idx_lecturas_gas_2023_fecha_inicio" ON "public"."lecturas_semanales_gas_consumo_2023" USING "btree" ("fecha_inicio");



CREATE INDEX "idx_lecturas_gas_2023_numero_semana" ON "public"."lecturas_semanales_gas_consumo_2023" USING "btree" ("numero_semana");



CREATE INDEX "idx_lecturas_gas_2024_fecha_fin" ON "public"."lecturas_semanales_gas_consumo_2024" USING "btree" ("fecha_fin");



CREATE INDEX "idx_lecturas_gas_2024_fecha_inicio" ON "public"."lecturas_semanales_gas_consumo_2024" USING "btree" ("fecha_inicio");



CREATE INDEX "idx_lecturas_gas_2024_numero_semana" ON "public"."lecturas_semanales_gas_consumo_2024" USING "btree" ("numero_semana");



CREATE INDEX "idx_lecturas_gas_2025_fecha_fin" ON "public"."lecturas_semanales_gas_consumo_2025" USING "btree" ("fecha_fin");



CREATE INDEX "idx_lecturas_gas_2025_fecha_inicio" ON "public"."lecturas_semanales_gas_consumo_2025" USING "btree" ("fecha_inicio");



CREATE INDEX "idx_lecturas_gas_2025_numero_semana" ON "public"."lecturas_semanales_gas_consumo_2025" USING "btree" ("numero_semana");



CREATE INDEX "idx_lecturas_gas_2026_fecha_fin" ON "public"."lecturas_semanales_gas_2026" USING "btree" ("fecha_fin");



CREATE INDEX "idx_lecturas_gas_2026_fecha_inicio" ON "public"."lecturas_semanales_gas_2026" USING "btree" ("fecha_inicio");



CREATE INDEX "idx_lecturas_gas_2026_numero_semana" ON "public"."lecturas_semanales_gas_2026" USING "btree" ("numero_semana");



CREATE INDEX "idx_lecturas_gas_consumo_2026_fecha_fin" ON "public"."lecturas_semanales_gas_consumo_2026" USING "btree" ("fecha_fin");



CREATE INDEX "idx_lecturas_gas_consumo_2026_fecha_inicio" ON "public"."lecturas_semanales_gas_consumo_2026" USING "btree" ("fecha_inicio");



CREATE INDEX "idx_lecturas_gas_consumo_2026_numero_semana" ON "public"."lecturas_semanales_gas_consumo_2026" USING "btree" ("numero_semana");



CREATE INDEX "idx_lecturas_mensuales_agua_anio" ON "public"."lecturas_mensuales_agua" USING "btree" ("anio");



CREATE INDEX "idx_lecturas_mensuales_agua_anio_mes" ON "public"."lecturas_mensuales_agua" USING "btree" ("anio", "mes");



CREATE INDEX "idx_lecturas_mensuales_agua_consumo_anio" ON "public"."lecturas_mensuales_agua_consumo" USING "btree" ("anio");



CREATE INDEX "idx_lecturas_mensuales_agua_consumo_mes" ON "public"."lecturas_mensuales_agua_consumo" USING "btree" ("mes");



CREATE INDEX "idx_lecturas_mensuales_agua_mes" ON "public"."lecturas_mensuales_agua" USING "btree" ("mes");



CREATE INDEX "idx_lecturas_mes_anio" ON "public"."lecturas_diarias" USING "btree" ("mes_anio");



CREATE INDEX "idx_lecturas_ptar_fecha" ON "public"."lecturas_ptar" USING "btree" ("fecha" DESC);



CREATE INDEX "idx_lecturas_ptar_month" ON "public"."lecturas_ptar" USING "btree" (EXTRACT(year FROM "fecha"), EXTRACT(month FROM "fecha"));



CREATE INDEX "idx_lecturas_ptar_year" ON "public"."lecturas_ptar" USING "btree" (EXTRACT(year FROM "fecha"));



CREATE INDEX "idx_lecturas_semana_agua_2023_fechas" ON "public"."lecturas_semana_agua_2023" USING "btree" ("l_fecha_inicio", "l_fecha_fin");



CREATE INDEX "idx_lecturas_semana_agua_2023_numero" ON "public"."lecturas_semana_agua_2023" USING "btree" ("l_numero_semana");



CREATE INDEX "idx_lecturas_semana_agua_2024_fechas" ON "public"."lecturas_semana_agua_2024" USING "btree" ("l_fecha_inicio", "l_fecha_fin");



CREATE INDEX "idx_lecturas_semana_agua_2024_numero" ON "public"."lecturas_semana_agua_2024" USING "btree" ("l_numero_semana");



CREATE INDEX "idx_lecturas_semana_agua_2025_fechas" ON "public"."lecturas_semana_agua_2025" USING "btree" ("l_fecha_inicio", "l_fecha_fin");



CREATE INDEX "idx_lecturas_semana_agua_2025_numero" ON "public"."lecturas_semana_agua_2025" USING "btree" ("l_numero_semana");



CREATE INDEX "idx_lecturas_semana_agua_2026_fechas" ON "public"."lecturas_semana_agua_2026" USING "btree" ("l_fecha_inicio", "l_fecha_fin");



CREATE INDEX "idx_lecturas_semana_agua_2026_numero" ON "public"."lecturas_semana_agua_2026" USING "btree" ("l_numero_semana");



CREATE INDEX "idx_lecturas_semana_agua_consumo_2023_fechas" ON "public"."lecturas_semana_agua_consumo_2023" USING "btree" ("l_fecha_inicio", "l_fecha_fin");



CREATE INDEX "idx_lecturas_semana_agua_consumo_2023_numero" ON "public"."lecturas_semana_agua_consumo_2023" USING "btree" ("l_numero_semana");



CREATE INDEX "idx_lecturas_semana_agua_consumo_2024_fechas" ON "public"."lecturas_semana_agua_consumo_2024" USING "btree" ("l_fecha_inicio", "l_fecha_fin");



CREATE INDEX "idx_lecturas_semana_agua_consumo_2024_numero" ON "public"."lecturas_semana_agua_consumo_2024" USING "btree" ("l_numero_semana");



CREATE INDEX "idx_lecturas_semana_agua_consumo_2025_fechas" ON "public"."lecturas_semana_agua_consumo_2025" USING "btree" ("l_fecha_inicio", "l_fecha_fin");



CREATE INDEX "idx_lecturas_semana_agua_consumo_2025_numero" ON "public"."lecturas_semana_agua_consumo_2025" USING "btree" ("l_numero_semana");



CREATE INDEX "idx_lecturas_semana_agua_consumo_2026_fechas" ON "public"."lecturas_semana_agua_consumo_2026" USING "btree" ("l_fecha_inicio", "l_fecha_fin");



CREATE INDEX "idx_lecturas_semana_agua_consumo_2026_numero" ON "public"."lecturas_semana_agua_consumo_2026" USING "btree" ("l_numero_semana");



CREATE INDEX "idx_profiles_company" ON "public"."profiles" USING "btree" ("company");



CREATE INDEX "idx_profiles_role" ON "public"."profiles" USING "btree" ("role");



CREATE INDEX "idx_reading_comments_created_at" ON "public"."reading_comments" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_reading_comments_point_id" ON "public"."reading_comments" USING "btree" ("point_id");



CREATE INDEX "idx_reading_comments_year_week" ON "public"."reading_comments" USING "btree" ("year", "week_number");



CREATE INDEX "idx_well_comments_created_at" ON "public"."well_comments" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_well_comments_well_id" ON "public"."well_comments" USING "btree" ("well_id");



CREATE INDEX "idx_well_events_event_status" ON "public"."well_events" USING "btree" ("event_status");



CREATE INDEX "idx_well_events_event_type" ON "public"."well_events" USING "btree" ("event_type");



CREATE INDEX "idx_well_events_start_date" ON "public"."well_events" USING "btree" ("start_date" DESC);



CREATE INDEX "idx_well_events_well_id" ON "public"."well_events" USING "btree" ("well_id");



CREATE OR REPLACE TRIGGER "trigger_update_lecturas_gas_2023_updated_at" BEFORE UPDATE ON "public"."lecturas_semanales_gas_2023" FOR EACH ROW EXECUTE FUNCTION "public"."update_lecturas_gas_2023_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_lecturas_gas_2023_updated_at" BEFORE UPDATE ON "public"."lecturas_semanales_gas_consumo_2023" FOR EACH ROW EXECUTE FUNCTION "public"."update_lecturas_gas_2023_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_lecturas_gas_2024_updated_at" BEFORE UPDATE ON "public"."lecturas_semanales_gas_2024" FOR EACH ROW EXECUTE FUNCTION "public"."update_lecturas_gas_2024_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_lecturas_gas_2024_updated_at" BEFORE UPDATE ON "public"."lecturas_semanales_gas_consumo_2024" FOR EACH ROW EXECUTE FUNCTION "public"."update_lecturas_gas_2024_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_lecturas_gas_2025_updated_at" BEFORE UPDATE ON "public"."lecturas_semanales_gas_2025" FOR EACH ROW EXECUTE FUNCTION "public"."update_lecturas_gas_2025_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_lecturas_gas_2025_updated_at" BEFORE UPDATE ON "public"."lecturas_semanales_gas_consumo_2025" FOR EACH ROW EXECUTE FUNCTION "public"."update_lecturas_gas_2025_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_lecturas_gas_2026_updated_at" BEFORE UPDATE ON "public"."lecturas_semanales_gas_2026" FOR EACH ROW EXECUTE FUNCTION "public"."update_lecturas_gas_2026_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_lecturas_gas_consumo_2026_updated_at" BEFORE UPDATE ON "public"."lecturas_semanales_gas_consumo_2026" FOR EACH ROW EXECUTE FUNCTION "public"."update_lecturas_gas_consumo_2026_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_lecturas_semana_agua_2023_updated_at" BEFORE UPDATE ON "public"."lecturas_semana_agua_2023" FOR EACH ROW EXECUTE FUNCTION "public"."update_lecturas_semana_agua_2023_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_lecturas_semana_agua_2024_updated_at" BEFORE UPDATE ON "public"."lecturas_semana_agua_2024" FOR EACH ROW EXECUTE FUNCTION "public"."update_lecturas_semana_agua_2024_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_lecturas_semana_agua_2025_updated_at" BEFORE UPDATE ON "public"."lecturas_semana_agua_2025" FOR EACH ROW EXECUTE FUNCTION "public"."update_lecturas_semana_agua_2025_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_lecturas_semana_agua_2026_updated_at" BEFORE UPDATE ON "public"."lecturas_semana_agua_2026" FOR EACH ROW EXECUTE FUNCTION "public"."update_lecturas_semana_agua_2026_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_lecturas_semana_agua_consumo_2023_updated_at" BEFORE UPDATE ON "public"."lecturas_semana_agua_consumo_2023" FOR EACH ROW EXECUTE FUNCTION "public"."update_lecturas_semana_agua_consumo_2023_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_lecturas_semana_agua_consumo_2024_updated_at" BEFORE UPDATE ON "public"."lecturas_semana_agua_consumo_2024" FOR EACH ROW EXECUTE FUNCTION "public"."update_lecturas_semana_agua_consumo_2024_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_lecturas_semana_agua_consumo_2025_updated_at" BEFORE UPDATE ON "public"."lecturas_semana_agua_consumo_2025" FOR EACH ROW EXECUTE FUNCTION "public"."update_lecturas_semana_agua_consumo_2025_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_lecturas_semana_agua_consumo_2026_updated_at" BEFORE UPDATE ON "public"."lecturas_semana_agua_consumo_2026" FOR EACH ROW EXECUTE FUNCTION "public"."update_lecturas_semana_agua_consumo_2026_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_reading_comments_updated_at" BEFORE UPDATE ON "public"."reading_comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_reading_comments_updated_at"();



CREATE OR REPLACE TRIGGER "update_correos_updated_at" BEFORE UPDATE ON "public"."correos" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_lecturas_ptar_updated_at" BEFORE UPDATE ON "public"."lecturas_ptar" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_well_comments_updated_at" BEFORE UPDATE ON "public"."well_comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_well_events_updated_at" BEFORE UPDATE ON "public"."well_events" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Allow public delete access on well_comments" ON "public"."well_comments" FOR DELETE USING (true);



CREATE POLICY "Allow public delete access on well_events" ON "public"."well_events" FOR DELETE USING (true);



CREATE POLICY "Allow public insert access on Factores_agua" ON "public"."factores_agua" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public insert access on well_comments" ON "public"."well_comments" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public insert access on well_events" ON "public"."well_events" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public read access on Factores_agua" ON "public"."factores_agua" FOR SELECT USING (true);



CREATE POLICY "Allow public read access on well_comments" ON "public"."well_comments" FOR SELECT USING (true);



CREATE POLICY "Allow public read access on well_events" ON "public"."well_events" FOR SELECT USING (true);



CREATE POLICY "Allow public update access on Factores_agua" ON "public"."factores_agua" FOR UPDATE USING (true);



CREATE POLICY "Allow public update access on well_comments" ON "public"."well_comments" FOR UPDATE USING (true);



CREATE POLICY "Allow public update access on well_events" ON "public"."well_events" FOR UPDATE USING (true);



CREATE POLICY "Los usuarios pueden actualizar su propio perfil" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Los usuarios pueden ver su propio perfil" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Permitir DELETE a usuarios autenticados" ON "public"."correos" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Permitir INSERT público en correos" ON "public"."correos" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "Permitir SELECT a usuarios autenticados" ON "public"."correos" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Permitir UPDATE a usuarios autenticados" ON "public"."correos" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Permitir actualización a usuarios autenticados" ON "public"."lecturas_semana_agua_2023" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Permitir actualización a usuarios autenticados" ON "public"."lecturas_semana_agua_2024" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Permitir actualización a usuarios autenticados" ON "public"."lecturas_semana_agua_2025" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Permitir actualización a usuarios autenticados" ON "public"."lecturas_semana_agua_2026" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Permitir actualización a usuarios autenticados" ON "public"."lecturas_semana_agua_consumo_2023" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Permitir actualización a usuarios autenticados" ON "public"."lecturas_semana_agua_consumo_2024" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Permitir actualización a usuarios autenticados" ON "public"."lecturas_semana_agua_consumo_2025" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Permitir actualización a usuarios autenticados" ON "public"."lecturas_semana_agua_consumo_2026" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Permitir actualización de comentarios a usuarios autenticados" ON "public"."reading_comments" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Permitir actualización de lecturas PTAR a usuarios autenticado" ON "public"."lecturas_ptar" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Permitir eliminación a usuarios autenticados" ON "public"."lecturas_semana_agua_2023" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Permitir eliminación a usuarios autenticados" ON "public"."lecturas_semana_agua_2024" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Permitir eliminación a usuarios autenticados" ON "public"."lecturas_semana_agua_2025" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Permitir eliminación a usuarios autenticados" ON "public"."lecturas_semana_agua_2026" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Permitir eliminación a usuarios autenticados" ON "public"."lecturas_semana_agua_consumo_2023" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Permitir eliminación a usuarios autenticados" ON "public"."lecturas_semana_agua_consumo_2024" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Permitir eliminación a usuarios autenticados" ON "public"."lecturas_semana_agua_consumo_2025" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Permitir eliminación a usuarios autenticados" ON "public"."lecturas_semana_agua_consumo_2026" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Permitir eliminación de comentarios a usuarios autenticados" ON "public"."reading_comments" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Permitir eliminación de lecturas PTAR a usuarios autenticados" ON "public"."lecturas_ptar" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Permitir inserción a usuarios autenticados" ON "public"."lecturas_semana_agua_2023" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Permitir inserción a usuarios autenticados" ON "public"."lecturas_semana_agua_2024" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Permitir inserción a usuarios autenticados" ON "public"."lecturas_semana_agua_2025" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Permitir inserción a usuarios autenticados" ON "public"."lecturas_semana_agua_2026" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Permitir inserción a usuarios autenticados" ON "public"."lecturas_semana_agua_consumo_2023" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Permitir inserción a usuarios autenticados" ON "public"."lecturas_semana_agua_consumo_2024" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Permitir inserción a usuarios autenticados" ON "public"."lecturas_semana_agua_consumo_2025" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Permitir inserción a usuarios autenticados" ON "public"."lecturas_semana_agua_consumo_2026" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Permitir inserción de comentarios a usuarios autenticados" ON "public"."reading_comments" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Permitir inserción de lecturas PTAR a usuarios autenticados" ON "public"."lecturas_ptar" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Permitir lectura a usuarios autenticados" ON "public"."lecturas_semana_agua_2023" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Permitir lectura a usuarios autenticados" ON "public"."lecturas_semana_agua_2024" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Permitir lectura a usuarios autenticados" ON "public"."lecturas_semana_agua_2025" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Permitir lectura a usuarios autenticados" ON "public"."lecturas_semana_agua_2026" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Permitir lectura a usuarios autenticados" ON "public"."lecturas_semana_agua_consumo_2023" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Permitir lectura a usuarios autenticados" ON "public"."lecturas_semana_agua_consumo_2024" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Permitir lectura a usuarios autenticados" ON "public"."lecturas_semana_agua_consumo_2025" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Permitir lectura a usuarios autenticados" ON "public"."lecturas_semana_agua_consumo_2026" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Permitir lectura de comentarios a usuarios autenticados" ON "public"."reading_comments" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Permitir lectura de lecturas PTAR a usuarios autenticados" ON "public"."lecturas_ptar" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "allow_authenticated_insert_agua_2023" ON "public"."lecturas_semana_agua_2023" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "allow_authenticated_insert_agua_2024" ON "public"."lecturas_semana_agua_2024" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "allow_authenticated_insert_agua_2025" ON "public"."lecturas_semana_agua_2025" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "allow_authenticated_insert_gas_2024" ON "public"."lecturas_semanales_gas_consumo_2024" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "allow_authenticated_insert_gas_2025" ON "public"."lecturas_semanales_gas_consumo_2025" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "allow_authenticated_insert_ptar" ON "public"."lecturas_ptar" FOR INSERT TO "authenticated" WITH CHECK (true);



ALTER TABLE "public"."correos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."factores_agua" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lecturas_ptar" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lecturas_semana_agua_2023" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lecturas_semana_agua_2024" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lecturas_semana_agua_2025" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lecturas_semana_agua_2026" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lecturas_semana_agua_consumo_2023" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lecturas_semana_agua_consumo_2024" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lecturas_semana_agua_consumo_2025" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lecturas_semana_agua_consumo_2026" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reading_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."well_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."well_events" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_bulk_data"("p_table_name" "text", "p_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."insert_bulk_data"("p_table_name" "text", "p_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_bulk_data"("p_table_name" "text", "p_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_lecturas_gas_2023_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_lecturas_gas_2023_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_lecturas_gas_2023_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_lecturas_gas_2024_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_lecturas_gas_2024_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_lecturas_gas_2024_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_lecturas_gas_2025_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_lecturas_gas_2025_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_lecturas_gas_2025_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_lecturas_gas_2026_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_lecturas_gas_2026_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_lecturas_gas_2026_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_lecturas_gas_consumo_2026_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_lecturas_gas_consumo_2026_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_lecturas_gas_consumo_2026_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_lecturas_semana2023_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_lecturas_semana2023_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_lecturas_semana2023_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_lecturas_semana2024_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_lecturas_semana2024_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_lecturas_semana2024_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_lecturas_semana_agua_2023_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_lecturas_semana_agua_2023_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_lecturas_semana_agua_2023_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_lecturas_semana_agua_2024_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_lecturas_semana_agua_2024_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_lecturas_semana_agua_2024_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_lecturas_semana_agua_2025_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_lecturas_semana_agua_2025_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_lecturas_semana_agua_2025_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_lecturas_semana_agua_2026_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_lecturas_semana_agua_2026_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_lecturas_semana_agua_2026_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_lecturas_semana_agua_consumo_2023_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_lecturas_semana_agua_consumo_2023_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_lecturas_semana_agua_consumo_2023_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_lecturas_semana_agua_consumo_2024_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_lecturas_semana_agua_consumo_2024_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_lecturas_semana_agua_consumo_2024_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_lecturas_semana_agua_consumo_2025_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_lecturas_semana_agua_consumo_2025_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_lecturas_semana_agua_consumo_2025_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_lecturas_semana_agua_consumo_2026_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_lecturas_semana_agua_consumo_2026_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_lecturas_semana_agua_consumo_2026_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_lecturas_semana_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_lecturas_semana_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_lecturas_semana_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_lecturas_semanales_agua2023_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_lecturas_semanales_agua2023_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_lecturas_semanales_agua2023_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_lecturas_semanales_agua2024_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_lecturas_semanales_agua2024_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_lecturas_semanales_agua2024_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_lecturas_semanales_agua2025_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_lecturas_semanales_agua2025_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_lecturas_semanales_agua2025_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_reading_comments_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_reading_comments_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_reading_comments_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."correos" TO "anon";
GRANT ALL ON TABLE "public"."correos" TO "authenticated";
GRANT ALL ON TABLE "public"."correos" TO "service_role";



GRANT ALL ON SEQUENCE "public"."correos_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."correos_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."correos_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."factores_agua" TO "anon";
GRANT ALL ON TABLE "public"."factores_agua" TO "authenticated";
GRANT ALL ON TABLE "public"."factores_agua" TO "service_role";



GRANT ALL ON SEQUENCE "public"."factores_agua_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."factores_agua_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."factores_agua_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."lecturas_diarias" TO "anon";
GRANT ALL ON TABLE "public"."lecturas_diarias" TO "authenticated";
GRANT ALL ON TABLE "public"."lecturas_diarias" TO "service_role";



GRANT ALL ON SEQUENCE "public"."lecturas_diarias_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."lecturas_diarias_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."lecturas_diarias_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."lecturas_mensuales_agua" TO "anon";
GRANT ALL ON TABLE "public"."lecturas_mensuales_agua" TO "authenticated";
GRANT ALL ON TABLE "public"."lecturas_mensuales_agua" TO "service_role";



GRANT ALL ON TABLE "public"."lecturas_mensuales_agua_consumo" TO "anon";
GRANT ALL ON TABLE "public"."lecturas_mensuales_agua_consumo" TO "authenticated";
GRANT ALL ON TABLE "public"."lecturas_mensuales_agua_consumo" TO "service_role";



GRANT ALL ON SEQUENCE "public"."lecturas_mensuales_agua_consumo_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."lecturas_mensuales_agua_consumo_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."lecturas_mensuales_agua_consumo_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."lecturas_mensuales_agua_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."lecturas_mensuales_agua_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."lecturas_mensuales_agua_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."lecturas_ptar" TO "anon";
GRANT ALL ON TABLE "public"."lecturas_ptar" TO "authenticated";
GRANT ALL ON TABLE "public"."lecturas_ptar" TO "service_role";



GRANT ALL ON SEQUENCE "public"."lecturas_ptar_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."lecturas_ptar_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."lecturas_ptar_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."lecturas_semana_agua_2023" TO "anon";
GRANT ALL ON TABLE "public"."lecturas_semana_agua_2023" TO "authenticated";
GRANT ALL ON TABLE "public"."lecturas_semana_agua_2023" TO "service_role";



GRANT ALL ON SEQUENCE "public"."lecturas_semana_agua_2023_l_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."lecturas_semana_agua_2023_l_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."lecturas_semana_agua_2023_l_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."lecturas_semana_agua_2024" TO "anon";
GRANT ALL ON TABLE "public"."lecturas_semana_agua_2024" TO "authenticated";
GRANT ALL ON TABLE "public"."lecturas_semana_agua_2024" TO "service_role";



GRANT ALL ON SEQUENCE "public"."lecturas_semana_agua_2024_l_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."lecturas_semana_agua_2024_l_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."lecturas_semana_agua_2024_l_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."lecturas_semana_agua_2025" TO "anon";
GRANT ALL ON TABLE "public"."lecturas_semana_agua_2025" TO "authenticated";
GRANT ALL ON TABLE "public"."lecturas_semana_agua_2025" TO "service_role";



GRANT ALL ON SEQUENCE "public"."lecturas_semana_agua_2025_l_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."lecturas_semana_agua_2025_l_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."lecturas_semana_agua_2025_l_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."lecturas_semana_agua_2026" TO "anon";
GRANT ALL ON TABLE "public"."lecturas_semana_agua_2026" TO "authenticated";
GRANT ALL ON TABLE "public"."lecturas_semana_agua_2026" TO "service_role";



GRANT ALL ON SEQUENCE "public"."lecturas_semana_agua_2026_l_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."lecturas_semana_agua_2026_l_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."lecturas_semana_agua_2026_l_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."lecturas_semana_agua_consumo_2023" TO "anon";
GRANT ALL ON TABLE "public"."lecturas_semana_agua_consumo_2023" TO "authenticated";
GRANT ALL ON TABLE "public"."lecturas_semana_agua_consumo_2023" TO "service_role";



GRANT ALL ON SEQUENCE "public"."lecturas_semana_agua_consumo_2023_l_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."lecturas_semana_agua_consumo_2023_l_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."lecturas_semana_agua_consumo_2023_l_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."lecturas_semana_agua_consumo_2024" TO "anon";
GRANT ALL ON TABLE "public"."lecturas_semana_agua_consumo_2024" TO "authenticated";
GRANT ALL ON TABLE "public"."lecturas_semana_agua_consumo_2024" TO "service_role";



GRANT ALL ON SEQUENCE "public"."lecturas_semana_agua_consumo_2024_l_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."lecturas_semana_agua_consumo_2024_l_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."lecturas_semana_agua_consumo_2024_l_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."lecturas_semana_agua_consumo_2025" TO "anon";
GRANT ALL ON TABLE "public"."lecturas_semana_agua_consumo_2025" TO "authenticated";
GRANT ALL ON TABLE "public"."lecturas_semana_agua_consumo_2025" TO "service_role";



GRANT ALL ON SEQUENCE "public"."lecturas_semana_agua_consumo_2025_l_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."lecturas_semana_agua_consumo_2025_l_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."lecturas_semana_agua_consumo_2025_l_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."lecturas_semana_agua_consumo_2026" TO "anon";
GRANT ALL ON TABLE "public"."lecturas_semana_agua_consumo_2026" TO "authenticated";
GRANT ALL ON TABLE "public"."lecturas_semana_agua_consumo_2026" TO "service_role";



GRANT ALL ON SEQUENCE "public"."lecturas_semana_agua_consumo_2026_l_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."lecturas_semana_agua_consumo_2026_l_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."lecturas_semana_agua_consumo_2026_l_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."lecturas_semanales_gas_2023" TO "anon";
GRANT ALL ON TABLE "public"."lecturas_semanales_gas_2023" TO "authenticated";
GRANT ALL ON TABLE "public"."lecturas_semanales_gas_2023" TO "service_role";



GRANT ALL ON TABLE "public"."lecturas_semanales_gas_consumo_2023" TO "anon";
GRANT ALL ON TABLE "public"."lecturas_semanales_gas_consumo_2023" TO "authenticated";
GRANT ALL ON TABLE "public"."lecturas_semanales_gas_consumo_2023" TO "service_role";



GRANT ALL ON SEQUENCE "public"."lecturas_semanales_gas_2023_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."lecturas_semanales_gas_2023_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."lecturas_semanales_gas_2023_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."lecturas_semanales_gas_2023_id_seq1" TO "anon";
GRANT ALL ON SEQUENCE "public"."lecturas_semanales_gas_2023_id_seq1" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."lecturas_semanales_gas_2023_id_seq1" TO "service_role";



GRANT ALL ON TABLE "public"."lecturas_semanales_gas_2024" TO "anon";
GRANT ALL ON TABLE "public"."lecturas_semanales_gas_2024" TO "authenticated";
GRANT ALL ON TABLE "public"."lecturas_semanales_gas_2024" TO "service_role";



GRANT ALL ON TABLE "public"."lecturas_semanales_gas_consumo_2024" TO "anon";
GRANT ALL ON TABLE "public"."lecturas_semanales_gas_consumo_2024" TO "authenticated";
GRANT ALL ON TABLE "public"."lecturas_semanales_gas_consumo_2024" TO "service_role";



GRANT ALL ON SEQUENCE "public"."lecturas_semanales_gas_2024_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."lecturas_semanales_gas_2024_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."lecturas_semanales_gas_2024_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."lecturas_semanales_gas_2024_id_seq1" TO "anon";
GRANT ALL ON SEQUENCE "public"."lecturas_semanales_gas_2024_id_seq1" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."lecturas_semanales_gas_2024_id_seq1" TO "service_role";



GRANT ALL ON TABLE "public"."lecturas_semanales_gas_2025" TO "anon";
GRANT ALL ON TABLE "public"."lecturas_semanales_gas_2025" TO "authenticated";
GRANT ALL ON TABLE "public"."lecturas_semanales_gas_2025" TO "service_role";



GRANT ALL ON TABLE "public"."lecturas_semanales_gas_consumo_2025" TO "anon";
GRANT ALL ON TABLE "public"."lecturas_semanales_gas_consumo_2025" TO "authenticated";
GRANT ALL ON TABLE "public"."lecturas_semanales_gas_consumo_2025" TO "service_role";



GRANT ALL ON SEQUENCE "public"."lecturas_semanales_gas_2025_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."lecturas_semanales_gas_2025_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."lecturas_semanales_gas_2025_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."lecturas_semanales_gas_2025_id_seq1" TO "anon";
GRANT ALL ON SEQUENCE "public"."lecturas_semanales_gas_2025_id_seq1" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."lecturas_semanales_gas_2025_id_seq1" TO "service_role";



GRANT ALL ON TABLE "public"."lecturas_semanales_gas_2026" TO "anon";
GRANT ALL ON TABLE "public"."lecturas_semanales_gas_2026" TO "authenticated";
GRANT ALL ON TABLE "public"."lecturas_semanales_gas_2026" TO "service_role";



GRANT ALL ON SEQUENCE "public"."lecturas_semanales_gas_2026_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."lecturas_semanales_gas_2026_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."lecturas_semanales_gas_2026_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."lecturas_semanales_gas_consumo_2026" TO "anon";
GRANT ALL ON TABLE "public"."lecturas_semanales_gas_consumo_2026" TO "authenticated";
GRANT ALL ON TABLE "public"."lecturas_semanales_gas_consumo_2026" TO "service_role";



GRANT ALL ON SEQUENCE "public"."lecturas_semanales_gas_consumo_2026_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."lecturas_semanales_gas_consumo_2026_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."lecturas_semanales_gas_consumo_2026_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."reading_comments" TO "anon";
GRANT ALL ON TABLE "public"."reading_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."reading_comments" TO "service_role";



GRANT ALL ON TABLE "public"."vista_ptar_resumen_anual" TO "anon";
GRANT ALL ON TABLE "public"."vista_ptar_resumen_anual" TO "authenticated";
GRANT ALL ON TABLE "public"."vista_ptar_resumen_anual" TO "service_role";



GRANT ALL ON TABLE "public"."vista_ptar_resumen_mensual" TO "anon";
GRANT ALL ON TABLE "public"."vista_ptar_resumen_mensual" TO "authenticated";
GRANT ALL ON TABLE "public"."vista_ptar_resumen_mensual" TO "service_role";



GRANT ALL ON TABLE "public"."vista_ptar_resumen_trimestral" TO "anon";
GRANT ALL ON TABLE "public"."vista_ptar_resumen_trimestral" TO "authenticated";
GRANT ALL ON TABLE "public"."vista_ptar_resumen_trimestral" TO "service_role";



GRANT ALL ON TABLE "public"."well_comments" TO "anon";
GRANT ALL ON TABLE "public"."well_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."well_comments" TO "service_role";



GRANT ALL ON TABLE "public"."well_events" TO "anon";
GRANT ALL ON TABLE "public"."well_events" TO "authenticated";
GRANT ALL ON TABLE "public"."well_events" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























drop extension if exists "pg_net";

drop policy "Permitir INSERT público en correos" on "public"."correos";

alter table "public"."well_events" drop constraint "well_events_event_status_check";

alter table "public"."well_events" drop constraint "well_events_event_type_check";

alter table "public"."well_events" add constraint "well_events_event_status_check" CHECK (((event_status)::text = ANY ((ARRAY['activo'::character varying, 'completado'::character varying, 'cancelado'::character varying])::text[]))) not valid;

alter table "public"."well_events" validate constraint "well_events_event_status_check";

alter table "public"."well_events" add constraint "well_events_event_type_check" CHECK (((event_type)::text = ANY ((ARRAY['mantenimiento'::character varying, 'parado'::character varying, 'reparacion'::character varying, 'inspeccion'::character varying, 'otro'::character varying])::text[]))) not valid;

alter table "public"."well_events" validate constraint "well_events_event_type_check";


  create policy "Permitir INSERT público en correos"
  on "public"."correos"
  as permissive
  for insert
  to anon, authenticated
with check (true);


CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


