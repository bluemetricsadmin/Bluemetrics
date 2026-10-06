import { supabase } from '../supabaseClient'
import waterCatalog from '../lib/consumption-points.json'
import gasCatalog from '../lib/gas-consumption-points.json'

export const WATER_CONSUMPTION_TABLE = 'lecturas_semana_agua_consumo_2026'
export const GAS_CONSUMPTION_TABLE = 'lecturas_semanales_gas_consumo_2026'

// Medidores exactos considerados para el Top 5 de agua (orden del catálogo).
export const WATER_SELECTED_POINT_IDS = [
  'l_auditorio_luis_elizondo',
  'l_cdb2',
  'l_cdb2_banos_nuevos_2025',
  'l_arena_borrego',
  'l_lago_aulas_7_llenado',
  'l_farnville',
  'l_em_box',
  'l_edificio_negocios_daf',
  'l_aulas_6',
  'l_domo_cultural',
  'l_parque_central_registro',
  'l_wellness_edificio',
  'l_centrales_dona_tota',
  'l_centrales_subway',
  'l_centrales_carls_jr',
  'l_centrales_little_cesars',
  'l_centrales_grill_team',
  'l_centrales_chilaquiles',
  'l_centrales_tec_food',
  'l_centrales_oxxo',
  'l_comedor_central_tunel',
  'l_administrativo',
  'l_biotecnologia',
  'l_escuela_arte_caldera_1',
  'l_ciap_oriente',
  'l_ciap_centro',
  'l_ciap_poniente',
  'l_ciap_green_shake',
  'l_ciap_andatti',
  'l_ciap_dc_jochos',
  'l_crepaso',
  'l_el_negro',
  'l_aulas_5',
  'l_ciap_starbucks',
  'l_ciap_super_salads',
  'l_ciap_sotano',
  'l_reflexion',
  'l_residencias_10_15',
  'l_caffenio',
  'l_cedes_cisterna',
  'l_san_huevito',
  'l_cedes_site',
  'l_cedes_site_bomba',
  'l_nucleo',
  'l_expedition',
  'l_expedition_bread',
  'l_expedition_matthew',
  'l_hub',
  'l_cedes_e2',
  'l_e2_beiker',
  'l_e2_evobike',
  'l_e2_pancho_de_rigo',
  'l_e2_bebedero_nube',
  'l_aulas_1',
  'l_rectoria_norte',
  'l_pabellon_la_carreta',
  'l_rectoria_sur',
  'l_aulas_2',
  'l_cetec',
  'l_biblioteca',
  'l_biblioteca_nikkori',
  'l_biblioteca_nectar_works',
  'l_biblioteca_tim_horton',
  'l_aulas_3',
  'l_basanti',
  'l_aulas_3_sr_latino',
  'l_centrales_sur',
  'l_aulas_4_norte',
  'l_aulas_4_centro',
  'l_residencias_2_ote',
  'l_residencias_3',
  'l_residencias_5',
  'l_correos',
  'l_residencias_abc',
  'l_residencias_abc_lavanderia',
  'l_mil_mascaras',
  'l_aulas_7',
  'l_caldera_3',
  'l_la_dia',
  'l_aulas_4_sur',
  'l_cdi_1',
  'l_aulas_4_maestros',
  'l_cdi_2',
  'l_centro_congresos',
  'l_jubileo',
  'l_aulas_4_oxxo',
  'l_estacionamiento_e1',
  'l_escamilla_banos_trabajadores',
  'l_estadio_banorte',
  'l_campus_norte_edificios_ciudad',
  'l_estadio_azul',
]

// Medidores exactos considerados para el Top 5 de gas.
export const GAS_SELECTED_POINT_IDS = [
  'l_domo_cultural',
  'l_centrales_local',
  'l_dona_tota',
  'l_chilaquiles_tec',
  'l_carls_junior',
  'l_comedor_centrales_tec_food',
  'l_davilas_grill_team',
  'l_pizza_little_caesars',
  'l_biotecnologia',
  'l_mega_calefaccion_1',
  'l_mega_calefaccion_2',
  'l_mega_calefaccion_3',
  'l_mega_calefaccion_4',
  'l_mega_calefaccion_5',
  'l_ciap_super_salads',
  'l_aulas_1',
  'l_biblioteca',
  'l_nikkori',
  'l_nectar_works',
  'l_sr_latino',
  'l_arena_borrego',
  'l_calefaccion_1_bryan',
  'l_calefaccion_2_aerco',
  'l_caldera_3',
  'l_aulas_7',
  'l_la_dia',
  'l_aulas_4',
  'l_centro_congresos_vestidores',
  'l_jubileo',
  'l_expedition',
  'l_bread_expedition',
  'l_matthew_expedition',
  'l_cedes',
  'l_residencias_2',
  'l_residencias_5',
  'l_residencias_3',
  'l_residencias_abc_calefaccion',
  'l_residencias_abc_regaderas',
  'l_residencias_abc_locales_comida',
  'l_campus_norte_edificio_d_calefaccion',
  'l_campus_norte_comedor_d',
  'l_estadio_yarda',
  'l_wellness_supersalads',
  'l_wellness_general_calefaccion',
  'l_wellness_calentador_sotano_regaderas',
  'l_wellness_alberca',
  'l_auditorio_luis_elizondo',
  'l_pabellon_tec_cocina_estudiantes_2do_piso',
  'l_guarderia',
  'l_escamilla',
  'l_casa_solar',
  'l_estudiantes_11',
  'l_estudiantes_12',
  'l_estudiantes_13',
  'l_estudiantes_15_y_10',
]

const flattenPoints = (catalog) =>
  (catalog.categories || []).flatMap(category => category.points || [])

export const getSelectedWaterPoints = () =>
  flattenPoints(waterCatalog).filter(point =>
    WATER_SELECTED_POINT_IDS.includes(`l_${point.id}`)
  )

export const getSelectedGasPoints = () =>
  flattenPoints(gasCatalog).filter(point =>
    GAS_SELECTED_POINT_IDS.includes(`l_${point.id}`)
  )

// Construye el weeklyData de cada punto a partir de las filas de consumo.
export const buildPointsWithData = (
  points,
  rows,
  { columnPrefix = '', weekKey = 'week' } = {}
) =>
  points.map(point => ({
    ...point,
    weeklyData: rows.map(row => ({
      week: row[weekKey],
      consumption: parseFloat(row[`${columnPrefix}${point.id}`]) || 0,
    })),
  }))

export const buildAvailableWeeks = (rows) =>
  rows.map(row => ({
    weekNumber: row.l_numero_semana,
    startDate: row.l_fecha_inicio,
    endDate: row.l_fecha_fin,
  }))

export const dashboardConsumptionService = {
  /**
   * Obtiene las filas de consumo semanal de una tabla, ordenadas por semana.
   * @returns {Promise<{ data: Array, error: Error|null }>}
   */
  async fetchWeeklyRows(table, orderColumn) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order(orderColumn, { ascending: true })

    return { data: data || [], error }
  },
}
