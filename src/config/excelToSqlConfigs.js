// ============================================================
// Configuraciones para Excel to SQL Converter
// ============================================================

// Campos para lecturas semanales de AGUA
const camposAgua = [
  'L_numero_semana',
  'L_fecha_inicio',
  'L_fecha_fin',
  // Pozos de Agua Potable (Servicios)
  'L_medidor_general_pozos',
  'L_pozo_11',
  'L_pozo_14',
  'L_pozo_12',
  'L_pozo_7',
  'L_pozo_3',
  // Pozos de Riego
  'L_pozo_4_riego',
  'L_pozo_8_riego',
  'L_pozo_15_riego',
  // Circuito 8 Campus
  'L_circuito_8_campus',
  'L_auditorio_luis_elizondo',
  'L_cdb2',
  'L_cdb2_banos_nuevos_2025',
  'L_arena_borrego',
  'L_edificio_negocios_daf',
  'L_aulas_6',
  'L_domo_cultural',
  'L_wellness_parque_central_tunel',
  'L_wellness_registro',
  'L_parque_central_registro',
  'L_wellness_edificio',
  'L_wellness_super_salads',
  'L_wellness_torre_enfriamiento',
  'L_wellness_alberca',
  'L_centrales_comedor_1_principal',
  'L_centrales_dona_tota',
  'L_centrales_subway',
  'L_centrales_carls_jr',
  'L_centrales_little_cesars',
  'L_centrales_grill_team',
  'L_centrales_chilaquiles',
  'L_centrales_tec_food',
  'L_centrales_oxxo',
  'L_comedor_central_tunel',
  'L_administrativo',
  'L_biotecnologia',
  'L_escuela_arte_caldera_1',
  'L_ciap_oriente',
  'L_ciap_centro',
  'L_ciap_poniente',
  'L_ciap_green_shake',
  'L_ciap_andatti',
  'L_ciap_dc_jochos',
  'L_aulas_5',
  'L_ciap_starbucks',
  'L_ciap_super_salads',
  'L_ciap_sotano',
  'L_reflexion',
  'L_comedor_2_residencias_10_15',
  'L_residencias_10_15',
  'L_residencias_10_15_llenado',
  'L_comedor_2_caldera_2',
  'L_la_choza',
  'L_cedes_cisterna',
  'L_cedes_site',
  'L_nucleo',
  'L_expedition',
  'L_expedition_bread',
  'L_expedition_matthew',
  'L_caffenio',
  'L_cedes_e2',
  'L_aulas_1',
  'L_rectoria_norte',
  'L_pabellon_la_carreta',
  'L_rectoria_sur',
  'L_aulas_2',
  'L_cetec',
  'L_biblioteca',
  'L_biblioteca_nikkori',
  'L_biblioteca_nectar_works',
  'L_biblioteca_tim_horton',
  'L_biblioteca_starbucks',
  'L_aulas_3',
  'L_basanti',
  'L_aulas_3_sr_latino',
  'L_aulas_3_starbucks',
  'L_centrales_sur',
  'L_aulas_4_norte',
  // Circuito 6 Residencias
  'L_circuito_6_residencias',
  'L_residencias_1_antiguo',
  'L_residencias_2_ote',
  'L_residencias_2_pte',
  'L_residencias_3',
  'L_residencias_4',
  'L_residencias_5',
  'L_residencias_7',
  'L_residencias_8',
  'L_correos',
  'L_alberca',
  'L_residencias_abc',
  // Circuito 4 A7 CE
  'L_circuito_4_a7_ce',
  'L_aulas_7',
  'L_cah3_torre_enfriamiento',
  'L_caldera_3',
  'L_la_dia',
  'L_aulas_4_sur',
  'L_aulas_4_maestros',
  'L_centro_congresos',
  'L_jubileo',
  'L_aulas_4_oxxo',
  // Circuito Planta Física
  'L_circuito_planta_fisica',
  'L_arquitectura_e1',
  'L_arquitectura_anexo',
  'L_megacentral_te_2',
  'L_escamilla_banos_trabajadores',
  'L_estadio_banorte',
  'L_estadio_banorte_te',
  'L_campus_norte_edificios_ciudad',
  'L_estadio_azul',
  // Circuito Megacentral
  'L_circuito_megacentral',
  'L_megacentral_te_4',
  // Riego PTAR
  'L_ptar_riego',
  'L_pozo_4_riego_alt',
  'L_pozo_8_riego_alt',
  'L_pozo_15_riego_alt',
  'L_campus_norte_ciudad_riego',
  'L_comedor_d_ciudad',
  // Purgas y Evaporación
  'L_estadio_banorte_purgas',
  'L_wellness_cisterna_pluvial_purgas',
  'L_wellness_suavizador_purga',
  'L_wellness_te_rebosadero',
  'L_wellness_te_purga',
  'L_cedes_tinaco_riego_pluvial',
  'L_megacentral_te_purgas',
  'L_megacentral_suavizador_purga',
  'L_cah3_te_purgas',
  'L_residencias_10_15_te_purga',
  'L_estadio_borrego_pluvial',
  'L_ciap_cisterna_pluvial',
  // Agua de Ciudad
  'L_campo_soft_bol',
  'L_cedes_ciudad',
  'L_estacionamiento_e3',
  'L_guarderia',
  'L_naranjos',
  'L_casa_solar',
  'L_escamilla_banos_alumnos',
  'L_residencias_11_ciudad',
  'L_residencias_12_ciudad',
  'L_residencias_13_1_ciudad',
  'L_residencias_13_2_ciudad',
  'L_residencias_13_3_ciudad',
  'L_residencias_15_sotano',
  'L_residencias_10_15_purga_no',
  'L_cdb1_jardineros',
  'L_edificio_d',
  'L_estadio_yarda'
];

// Campos para lecturas semanales de GAS
const camposGas = [
  'numero_semana',
  'fecha_inicio',
  'fecha_fin',
  // Acometidas Principales Campus
  'campus_acometida_principal_digital',
  'campus_acometida_principal_analogica',
  // Edificios Culturales
  'domo_cultural',
  // Comedores y Restaurantes
  'comedor_centrales_tec_food',
  'dona_tota',
  'chilaquiles_tec',
  'carls_junior',
  'centrales_local',
  'davilas_grill_team',
  'pizza_little_caesars',
  // Edificios Académicos
  'biotecnologia',
  // Calderas y Sistemas de Calefacción
  'caldera_1_leon',
  'mega_calefaccion_1',
  'mega_calefaccion_2',
  'mega_calefaccion_3',
  'mega_calefaccion_4',
  'mega_calefaccion_5',
  // CIAP y Restaurantes
  'ciap_super_salads',
  // Aulas y Edificios Académicos
  'aulas_1',
  'biblioteca',
  'nikkori',
  'nectar_works',
  'sr_latino',
  // Instalaciones Deportivas
  'arena_borrego',
  // Sistemas de Calefacción Adicionales
  'calefaccion_1_bryan',
  'calefaccion_2_aerco',
  // Calderas
  'caldera_3',
  'aulas_7',
  'la_dia',
  'aulas_4',
  'centro_congresos_vestidores',
  'jubileo',
  // Expedition
  'expedition',
  'bread_expedition',
  'matthew_expedition',
  // Residencias Estudiantiles
  'estudiantes_acometida_principal_digital',
  'estudiantes_acometida_principal_analogico',
  // CEDES
  'cedes',
  'cedes_trabajadores_vestidores',
  'caldera_2',
  'comedor_estudiantes',
  // Residencias
  'residencias_4',
  'residencias_1',
  'residencias_2',
  'residencias_5',
  'residencias_8',
  'residencias_7',
  'residencias_3',
  'residencias_abc_calefaccion',
  'residencias_abc_regaderas',
  'residencias_abc_locales_comida',
  // Campus Norte
  'campus_norte_acometida_externa',
  'campus_norte_acometida_interna',
  'campus_norte_comedor_d',
  'campus_norte_edificio_d_calefaccion',
  // Estadio Borrego
  'estadio_borrego_acometida_digital',
  'estadio_borrego_acometida_analogica',
  'estadio_yarda',
  // Wellness
  'wellness_acometida_digital',
  'wellness_acometida_analogica',
  'wellness_supersalads',
  'wellness_general_calefaccion',
  'wellness_calentador_sotano_regaderas',
  'wellness_alberca',
  // Otros Edificios
  'auditorio_luis_elizondo',
  'pabellon_tec_semillero',
  'pabellon_tec_cocina_estudiantes_2do_piso',
  'guarderia',
  'escamilla',
  'casa_solar',
  'estudiantes_11',
  'estudiantes_12',
  'estudiantes_13',
  'estudiantes_15_y_10',
  'cdb1'
];

// Campos para lecturas MENSUALES de AGUA
const camposAguaMensual = [
  'anio',
  'mes',
  // Pozos de Agua Potable (Servicios)
  'L_medidor_general_pozos',
  'L_pozo_11',
  'L_pozo_14',
  'L_pozo_12',
  'L_pozo_7',
  'L_pozo_3',
  // Pozos de Riego
  'L_pozo_4_riego',
  'L_pozo_8_riego',
  'L_pozo_15_riego',
  // Circuito 8 Campus
  'L_circuito_8_campus',
  'L_auditorio_luis_elizondo',
  'L_cdb2',
  'L_cdb2_banos_nuevos_2025',
  'L_arena_borrego',
  'L_edificio_negocios_daf',
  'L_aulas_6',
  'L_domo_cultural',
  'L_wellness_parque_central_tunel',
  'L_wellness_registro',
  'L_parque_central_registro',
  'L_wellness_edificio',
  'L_wellness_super_salads',
  'L_wellness_torre_enfriamiento',
  'L_wellness_alberca',
  'L_centrales_comedor_1_principal',
  'L_centrales_dona_tota',
  'L_centrales_subway',
  'L_centrales_carls_jr',
  'L_centrales_little_cesars',
  'L_centrales_grill_team',
  'L_centrales_chilaquiles',
  'L_centrales_tec_food',
  'L_centrales_oxxo',
  'L_comedor_central_tunel',
  'L_administrativo',
  'L_biotecnologia',
  'L_escuela_arte_caldera_1',
  'L_ciap_oriente',
  'L_ciap_centro',
  'L_ciap_poniente',
  'L_ciap_green_shake',
  'L_ciap_andatti',
  'L_ciap_dc_jochos',
  'L_aulas_5',
  'L_ciap_starbucks',
  'L_ciap_super_salads',
  'L_ciap_sotano',
  'L_reflexion',
  'L_comedor_2_residencias_10_15',
  'L_residencias_10_15',
  'L_residencias_10_15_llenado',
  'L_comedor_2_caldera_2',
  'L_la_choza',
  'L_cedes_cisterna',
  'L_cedes_site',
  'L_nucleo',
  'L_expedition',
  'L_expedition_bread',
  'L_expedition_matthew',
  'L_caffenio',
  'L_cedes_e2',
  'L_aulas_1',
  'L_rectoria_norte',
  'L_pabellon_la_carreta',
  'L_rectoria_sur',
  'L_aulas_2',
  'L_cetec',
  'L_biblioteca',
  'L_biblioteca_nikkori',
  'L_biblioteca_nectar_works',
  'L_biblioteca_tim_horton',
  'L_biblioteca_starbucks',
  'L_aulas_3',
  'L_basanti',
  'L_aulas_3_sr_latino',
  'L_aulas_3_starbucks',
  'L_centrales_sur',
  'L_aulas_4_norte',
  // Circuito 6 Residencias
  'L_circuito_6_residencias',
  'L_residencias_1_antiguo',
  'L_residencias_2_ote',
  'L_residencias_2_pte',
  'L_residencias_3',
  'L_residencias_4',
  'L_residencias_5',
  'L_residencias_7',
  'L_residencias_8',
  'L_correos',
  'L_alberca',
  'L_residencias_abc',
  // Circuito 4 A7 CE
  'L_circuito_4_a7_ce',
  'L_aulas_7',
  'L_cah3_torre_enfriamiento',
  'L_caldera_3',
  'L_la_dia',
  'L_aulas_4_sur',
  'L_aulas_4_maestros',
  'L_centro_congresos',
  'L_jubileo',
  'L_aulas_4_oxxo',
  // Circuito Planta Física
  'L_circuito_planta_fisica',
  'L_arquitectura_e1',
  'L_arquitectura_anexo',
  'L_megacentral_te_2',
  'L_escamilla_banos_trabajadores',
  'L_estadio_banorte',
  'L_estadio_banorte_te',
  'L_campus_norte_edificios_ciudad',
  'L_estadio_azul',
  // Circuito Megacentral
  'L_circuito_megacentral',
  'L_megacentral_te_4',
  // Riego PTAR
  'L_ptar_riego',
  'L_pozo_4_riego_alt',
  'L_pozo_8_riego_alt',
  'L_pozo_15_riego_alt',
  'L_campus_norte_ciudad_riego',
  'L_comedor_d_ciudad',
  // Purgas y Evaporación
  'L_estadio_banorte_purgas',
  'L_wellness_cisterna_pluvial_purgas',
  'L_wellness_suavizador_purga',
  'L_wellness_te_rebosadero',
  'L_wellness_te_purga',
  'L_cedes_tinaco_riego_pluvial',
  'L_megacentral_te_purgas',
  'L_megacentral_suavizador_purga',
  'L_cah3_te_purgas',
  'L_residencias_10_15_te_purga',
  'L_estadio_borrego_pluvial',
  'L_ciap_cisterna_pluvial',
  // Agua de Ciudad
  'L_campo_soft_bol',
  'L_cedes_ciudad',
  'L_estacionamiento_e3',
  'L_guarderia',
  'L_naranjos',
  'L_casa_solar',
  'L_escamilla_banos_alumnos',
  'L_residencias_11_ciudad',
  'L_residencias_12_ciudad',
  'L_residencias_13_1_ciudad',
  'L_residencias_13_2_ciudad',
  'L_residencias_13_3_ciudad',
  'L_residencias_15_sotano',
  'L_residencias_10_15_purga_no',
  'L_cdb1_jardineros',
  'L_edificio_d',
  'L_estadio_yarda',
  // Nuevos puntos
  'L_farnville',
  'L_em_box',
  'L_crepaso',
  'L_el_negro',
  'L_e2_beiker',
  'L_e2_evobike',
  'L_e2_pancho_de_rigo',
  'L_e2_bebedero_nube',
  'L_residencias_abc_lavanderia',
  'L_estacionamiento_e1'
];

// Campos para lecturas diarias de PTAR
const camposPTAR = [
  'fecha',
  'hora',
  'medidor_entrada',
  'medidor_salida',
  'ar', // Agua Residual
  'at', // Agua Tratada
  'recirculacion',
  'total_dia'
];

// ============================================================
// Configuraciones por año y tipo
// ============================================================

export const excelToSqlConfigs = {
  // Agua 2023 - Lecturas
  agua_2023: {
    tipo: 'agua',
    año: 2023,
    nombreTabla: 'Lecturas_Semana_Agua_2023',
    campos: camposAgua,
    titulo: 'Excel a SQL - Lecturas Semanales de Agua 2023',
    descripcion: 'Convierte datos de lecturas semanales de agua (formato vertical) a sentencias SQL INSERT',
    nombreArchivoSql: 'inserts_lecturas_agua_2023.sql',
    icono: '💧',
    color: 'blue'
  },
  
  // Agua 2023 - Consumo
  agua_consumo_2023: {
    tipo: 'agua_consumo',
    año: 2023,
    nombreTabla: 'Lecturas_Semana_Agua_consumo_2023',
    campos: camposAgua,
    titulo: 'Excel a SQL - Consumo Semanal de Agua 2023',
    descripcion: 'Convierte datos de consumo semanal de agua (formato vertical) a sentencias SQL INSERT',
    nombreArchivoSql: 'inserts_consumo_agua_2023.sql',
    icono: '💧',
    color: 'cyan'
  },
  
  // Agua 2024 - Lecturas
  agua_2024: {
    tipo: 'agua',
    año: 2024,
    nombreTabla: 'Lecturas_Semana_Agua_2024',
    campos: camposAgua,
    titulo: 'Excel a SQL - Lecturas Semanales de Agua 2024',
    descripcion: 'Convierte datos de lecturas semanales de agua (formato vertical) a sentencias SQL INSERT',
    nombreArchivoSql: 'inserts_lecturas_agua_2024.sql',
    icono: '💧',
    color: 'blue'
  },
  
  // Agua 2024 - Consumo
  agua_consumo_2024: {
    tipo: 'agua_consumo',
    año: 2024,
    nombreTabla: 'Lecturas_Semana_Agua_consumo_2024',
    campos: camposAgua,
    titulo: 'Excel a SQL - Consumo Semanal de Agua 2024',
    descripcion: 'Convierte datos de consumo semanal de agua (formato vertical) a sentencias SQL INSERT',
    nombreArchivoSql: 'inserts_consumo_agua_2024.sql',
    icono: '💧',
    color: 'cyan'
  },
  
  // Agua 2025 - Lecturas
  agua_2025: {
    tipo: 'agua',
    año: 2025,
    nombreTabla: 'Lecturas_Semana_Agua_2025',
    campos: camposAgua,
    titulo: 'Excel a SQL - Lecturas Semanales de Agua 2025',
    descripcion: 'Convierte datos de lecturas semanales de agua (formato vertical) a sentencias SQL INSERT',
    nombreArchivoSql: 'inserts_lecturas_agua_2025.sql',
    icono: '💧',
    color: 'blue'
  },
  
  // Agua 2025 - Consumo
  agua_consumo_2025: {
    tipo: 'agua_consumo',
    año: 2025,
    nombreTabla: 'Lecturas_Semana_Agua_consumo_2025',
    campos: camposAgua,
    titulo: 'Excel a SQL - Consumo Semanal de Agua 2025',
    descripcion: 'Convierte datos de consumo semanal de agua (formato vertical) a sentencias SQL INSERT',
    nombreArchivoSql: 'inserts_consumo_agua_2025.sql',
    icono: '💧',
    color: 'cyan'
  },
  
  // Agua 2026 - Lecturas
  agua_2026: {
    tipo: 'agua',
    año: 2026,
    nombreTabla: 'Lecturas_Semana_Agua_2026',
    campos: camposAgua,
    titulo: 'Excel a SQL - Lecturas Semanales de Agua 2026',
    descripcion: 'Convierte datos de lecturas semanales de agua (formato vertical) a sentencias SQL INSERT',
    nombreArchivoSql: 'inserts_lecturas_agua_2026.sql',
    icono: '💧',
    color: 'blue'
  },
  
  // Agua 2026 - Consumo
  agua_consumo_2026: {
    tipo: 'agua_consumo',
    año: 2026,
    nombreTabla: 'Lecturas_Semana_Agua_consumo_2026',
    campos: camposAgua,
    titulo: 'Excel a SQL - Consumo Semanal de Agua 2026',
    descripcion: 'Convierte datos de consumo semanal de agua (formato vertical) a sentencias SQL INSERT',
    nombreArchivoSql: 'inserts_consumo_agua_2026.sql',
    icono: '💧',
    color: 'cyan'
  },
  
  // Gas 2023
  gas_2023: {
    tipo: 'gas',
    año: 2023,
    nombreTabla: 'lecturas_semanales_gas_2023',
    campos: camposGas,
    titulo: 'Excel a SQL - Lecturas Semanales de Gas 2023',
    descripcion: 'Convierte datos de lecturas semanales de gas (formato vertical) a sentencias SQL INSERT',
    nombreArchivoSql: 'inserts_lecturas_gas_2023.sql',
    icono: '🔥',
    color: 'orange'
  },
  
  // Gas 2024
  gas_2024: {
    tipo: 'gas',
    año: 2024,
    nombreTabla: 'lecturas_semanales_gas_2024',
    campos: camposGas,
    titulo: 'Excel a SQL - Lecturas Semanales de Gas 2024',
    descripcion: 'Convierte datos de lecturas semanales de gas (formato vertical) a sentencias SQL INSERT',
    nombreArchivoSql: 'inserts_lecturas_gas_2024.sql',
    icono: '🔥',
    color: 'orange'
  },
  
  // Gas 2025
  gas_2025: {
    tipo: 'gas',
    año: 2025,
    nombreTabla: 'lecturas_semanales_gas_2025',
    campos: camposGas,
    titulo: 'Excel a SQL - Lecturas Semanales de Gas 2025',
    descripcion: 'Convierte datos de lecturas semanales de gas (formato vertical) a sentencias SQL INSERT',
    nombreArchivoSql: 'inserts_lecturas_gas_2025.sql',
    icono: '🔥',
    color: 'orange'
  },

  // Gas 2026
  gas_2026: {
    tipo: 'gas',
    año: 2026,
    nombreTabla: 'lecturas_semanales_gas_2026',
    campos: camposGas,
    titulo: 'Excel a SQL - Lecturas Semanales de Gas 2026',
    descripcion: 'Convierte datos de lecturas semanales de gas (formato vertical) a sentencias SQL INSERT',
    nombreArchivoSql: 'inserts_lecturas_gas_2026.sql',
    icono: '🔥',
    color: 'orange'
  },

  // Gas 2025 - Solo Comedor Centrales Tec Food
  gas_2025_comedor_tec_food: {
    tipo: 'gas',
    año: 2025,
    nombreTabla: 'lecturas_semanales_gas_2025',
    campos: [
      'numero_semana',
      'fecha_inicio',
      'fecha_fin',
      'comedor_centrales_tec_food'
    ],
    titulo: 'Excel a SQL - Gas 2025: Comedor Centrales Tec Food',
    descripcion: 'Inserta datos de gas 2025 solo para Comedor Centrales Tec Food (formato vertical)',
    nombreArchivoSql: 'inserts_gas_2025_comedor_tec_food.sql',
    icono: '🍽️',
    color: 'orange'
  },

  // PTAR (Planta de Tratamiento de Aguas Residuales)
  ptar: {
    tipo: 'ptar',
    año: 'todos', // Una sola tabla para todos los años
    nombreTabla: 'lecturas_ptar',
    campos: camposPTAR,
    titulo: 'Excel a SQL - Lecturas Diarias PTAR',
    descripcion: 'Convierte datos de lecturas diarias de PTAR (formato horizontal) a sentencias SQL INSERT',
    nombreArchivoSql: 'inserts_ptar_lecturas.sql',
    icono: '♻️',
    color: 'green',
    formato: 'horizontal' // PTAR usa formato horizontal (cada fila es un registro)
  },

  // ============================================================
  // LECTURAS MENSUALES DE AGUA
  // ============================================================
  
  // Agua Mensual - Lecturas (tabla única multi-año)
  agua_mensual_lecturas: {
    tipo: 'agua_mensual',
    año: 'todos',
    nombreTabla: 'lecturas_mensuales_agua',
    campos: camposAguaMensual,
    titulo: 'Excel a SQL - Lecturas Mensuales de Agua',
    descripcion: 'Convierte datos de lecturas mensuales de agua (formato horizontal) a sentencias SQL INSERT',
    nombreArchivoSql: 'inserts_lecturas_mensuales_agua.sql',
    icono: '📅',
    color: 'blue',
    formato: 'horizontal' // Cada fila es un mes
  },
  
  // Agua Mensual - Consumo (tabla única multi-año)
  agua_mensual_consumo: {
    tipo: 'agua_mensual_consumo',
    año: 'todos',
    nombreTabla: 'lecturas_mensuales_agua_consumo',
    campos: camposAguaMensual,
    titulo: 'Excel a SQL - Consumo Mensual de Agua',
    descripcion: 'Convierte datos de consumo mensual de agua (formato horizontal) a sentencias SQL INSERT',
    nombreArchivoSql: 'inserts_consumo_mensual_agua.sql',
    icono: '📊',
    color: 'cyan',
    formato: 'horizontal' // Cada fila es un mes
  }
};

// Función helper para obtener configuración
export const getConfig = (tipo, año) => {
  // Para PTAR, solo usar el tipo (no tiene año específico)
  if (tipo === 'ptar') {
    return excelToSqlConfigs['ptar'];
  }
  const key = `${tipo}_${año}`;
  return excelToSqlConfigs[key];
};

// Obtener todas las configuraciones de un tipo
export const getConfigsByTipo = (tipo) => {
  return Object.values(excelToSqlConfigs).filter(config => config.tipo === tipo);
};

// Obtener todas las configuraciones de un año
export const getConfigsByAño = (año) => {
  return Object.values(excelToSqlConfigs).filter(config => config.año === año);
};

// Obtener configuración de PTAR
export const getPTARConfig = () => {
  return excelToSqlConfigs['ptar'];
};
