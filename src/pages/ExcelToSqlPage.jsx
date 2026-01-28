import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { FileSpreadsheet, Database, Download, Upload, AlertCircle, CheckCircle2, Info } from 'lucide-react';

const ExcelToSqlPage = () => {
  // Estados
  const [archivo, setArchivo] = useState(null);
  const [nombreTabla, setNombreTabla] = useState('lecturas_semana2024');
  const [sqlGenerado, setSqlGenerado] = useState('');
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [estadisticas, setEstadisticas] = useState(null);
  
  const fileInputRef = useRef(null);

  // ==================================================
  // Lista de campos en el orden exacto de la tabla
  // ==================================================
  const camposTabla = [
    'numero_semana',
    'fecha_inicio',
    'fecha_fin',
    // Pozos de Agua Potable (Servicios)
    'medidor_general_pozos',
    'pozo_11',
    'pozo_14',
    'pozo_12',
    'pozo_7',
    'pozo_3',
    // Pozos de Riego
    'pozo_4_riego',
    'pozo_8_riego',
    'pozo_15_riego',
    'total_pozos_riego',
    // Circuito 8 Campus
    'circuito_8_campus',
    'auditorio_luis_elizondo',
    'cdb2',
    'cdb2_banos_nuevos_2024', // ⚠️ CORREGIDO: 2024 en lugar de 2025
    'arena_borrego',
    'edificio_negocios_daf',
    'aulas_6',
    'domo_cultural',
    'wellness_parque_central_tunel',
    'wellness_registro',
    'parque_central_registro',
    'wellness_edificio',
    'wellness_super_salads',
    'wellness_torre_enfriamiento',
    'wellness_alberca',
    'centrales_comedor_1_principal',
    'centrales_dona_tota',
    'centrales_subway',
    'centrales_carls_jr',
    'centrales_little_cesars',
    'centrales_grill_team',
    'centrales_chilaquiles',
    'centrales_tec_food',
    'centrales_oxxo',
    'comedor_central_tunel',
    'administrativo',
    'biotecnologia',
    'escuela_arte_caldera_1',
    'ciap_oriente',
    'ciap_centro',
    'ciap_poniente',
    'ciap_green_shake',
    'ciap_andatti',
    'ciap_dc_jochos',
    'aulas_5',
    'ciap_starbucks',
    'ciap_super_salads',
    'ciap_sotano',
    'reflexion',
    'comedor_2_residencias_10_15',
    'residencias_10_15',
    'residencias_10_15_llenado',
    'comedor_2_caldera_2',
    'la_choza',
    'cedes_cisterna',
    'cedes_site',
    'nucleo',
    'expedition',
    'expedition_bread',
    'expedition_matthew',
    'caffenio',
    'cedes_e2',
    'aulas_1',
    'rectoria_norte',
    'pabellon_la_carreta',
    'rectoria_sur',
    'aulas_2',
    'cetec',
    'biblioteca',
    'biblioteca_nikkori',
    'biblioteca_nectar_works',
    'biblioteca_tim_horton',
    'biblioteca_starbucks',
    'aulas_3',
    'basanti',
    'aulas_3_sr_latino',
    'aulas_3_starbucks',
    'centrales_sur',
    'aulas_4_norte',
    // Circuito 6 Residencias
    'circuito_6_residencias',
    'residencias_1_antiguo',
    'residencias_2_ote',
    'residencias_2_pte',
    'residencias_3',
    'residencias_4',
    'residencias_5',
    'residencias_7',
    'residencias_8',
    'correos',
    'alberca',
    'residencias_abc',
    // Circuito 4 A7 CE
    'circuito_4_a7_ce',
    'aulas_7',
    'cah3_torre_enfriamiento',
    'caldera_3',
    'la_dia',
    'aulas_4_sur',
    'aulas_4_maestros',
    'centro_congresos',
    'jubileo',
    'aulas_4_oxxo',
    // Circuito Planta Física
    'circuito_planta_fisica',
    'arquitectura_e1',
    'arquitectura_anexo',
    'megacentral_te_2',
    'escamilla_banos_trabajadores',
    'estadio_banorte',
    'estadio_banorte_te',
    'campus_norte_edificios_ciudad',
    'estadio_azul',
    // Circuito Megacentral
    'circuito_megacentral',
    'megacentral_te_4',
    // Riego PTAR
    'ptar_riego',
    'pozo_4_riego_alt',
    'pozo_8_riego_alt',
    'pozo_15_riego_alt',
    'campus_norte_ciudad_riego',
    'comedor_d_ciudad',
    // Purgas y Evaporación
    'estadio_banorte_purgas',
    'wellness_cisterna_pluvial_purgas',
    'wellness_suavizador_purga',
    'wellness_te_rebosadero',
    'wellness_te_purga',
    'cedes_tinaco_riego_pluvial',
    'megacentral_te_purgas',
    'megacentral_suavizador_purga',
    'cah3_te_purgas',
    'residencias_10_15_te_purga',
    'estadio_borrego_pluvial',
    'ciap_cisterna_pluvial',
    // Agua de Ciudad
    'campo_soft_bol',
    'cedes_ciudad',
    'estacionamiento_e3',
    'guarderia',
    'naranjos',
    'casa_solar',
    'escamilla_banos_alumnos',
    'residencias_11_ciudad',
    'residencias_12_ciudad',
    'residencias_13_1_ciudad',
    'residencias_13_2_ciudad',
    'residencias_13_3_ciudad',
    'residencias_15_sotano',
    'residencias_10_15_purga_no',
    'cdb1_jardineros',
    'edificio_d',
    'estadio_yarda'
  ];

  // ==================================================
  // Función para formatear valores SQL
  // ==================================================
  const formatearValorSQL = (valor, nombreCampo) => {
    // Null o vacío
    if (valor === null || valor === undefined || valor === '') {
      return 'NULL';
    }
    
    // Fechas (campos que contienen 'fecha')
    if (nombreCampo.includes('fecha')) {
      if (typeof valor === 'string') {
        return `'${valor}'`;
      }
      // Si es un número de Excel, convertirlo a fecha
      if (typeof valor === 'number') {
        const fecha = XLSX.SSF.parse_date_code(valor);
        const fechaStr = `${fecha.y}-${String(fecha.m).padStart(2, '0')}-${String(fecha.d).padStart(2, '0')}`;
        return `'${fechaStr}'`;
      }
    }
    
    // Números
    if (typeof valor === 'number') {
      return valor;
    }
    
    // Cadenas de texto
    if (typeof valor === 'string') {
      const valorEscapado = valor.replace(/'/g, "''");
      return `'${valorEscapado}'`;
    }
    
    // Otros tipos
    const valorString = String(valor).replace(/'/g, "''");
    return `'${valorString}'`;
  };

  // ==================================================
  // Manejar selección de archivo
  // ==================================================
  const manejarArchivoSeleccionado = (e) => {
    const file = e.target.files[0];
    if (file) {
      const extension = file.name.split('.').pop().toLowerCase();
      if (extension !== 'xlsx' && extension !== 'xls') {
        setError('Por favor selecciona un archivo Excel válido (.xlsx o .xls)');
        setArchivo(null);
        return;
      }
      
      setArchivo(file);
      setError('');
      setExito('');
      setSqlGenerado('');
      setEstadisticas(null);
    }
  };

  // ==================================================
  // Procesar archivo Excel (LECTURA VERTICAL)
  // ==================================================
  const procesarExcel = async () => {
    if (!archivo) {
      setError('Por favor selecciona un archivo Excel');
      return;
    }
    
    if (!nombreTabla.trim()) {
      setError('Por favor ingresa el nombre de la tabla');
      return;
    }
    
    setError('');
    setExito('');
    setProcesando(true);
    
    try {
      // Leer el archivo Excel
      const buffer = await archivo.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      
      // Obtener la primera hoja
      const nombreHoja = workbook.SheetNames[0];
      const hoja = workbook.Sheets[nombreHoja];
      
      // Convertir a JSON (con encabezados en la primera columna)
      const datos = XLSX.utils.sheet_to_json(hoja, { header: 1, defval: null });
      
      if (datos.length === 0) {
        throw new Error('El archivo Excel está vacío');
      }

      // ==================================================
      // LECTURA VERTICAL: Cada COLUMNA es un registro
      // ==================================================
      const totalColumnas = datos[0]?.length || 0;
      
      if (totalColumnas < 2) {
        throw new Error('El archivo debe tener al menos 2 columnas (nombres + datos)');
      }
      
      // Procesar cada columna de datos (desde la columna 1 en adelante)
      const todosLosValores = []; // Array para almacenar todos los VALUES
      const columnasConDatos = totalColumnas - 1; // Excluir la primera columna de nombres
      
      for (let col = 1; col < totalColumnas; col++) {
        // Extraer los valores de esta columna
        const valores = [];
        
        for (let row = 0; row < datos.length; row++) {
          const valor = datos[row][col];
          const nombreCampo = camposTabla[row] || `campo_${row + 1}`;
          const valorFormateado = formatearValorSQL(valor, nombreCampo);
          valores.push(valorFormateado);
        }
        
        // Agregar este conjunto de valores al array principal
        todosLosValores.push(valores);
      }
      
      // ==================================================
      // Construir UN SOLO INSERT con múltiples VALUES
      // ==================================================
      const columnasStr = camposTabla.slice(0, datos.length).join(',\n    ');
      
      // Generar cada fila de VALUES
      const valuesFilas = todosLosValores.map(valores => {
        const valoresStr = valores.join(',\n    ');
        return `(\n    ${valoresStr}\n)`;
      });
      
      // Unir todas las filas con comas
      const todosLosValuesStr = valuesFilas.join(',\n');
      
      // Construir la sentencia SQL completa
      const sqlFinal = `INSERT INTO public.${nombreTabla.trim()} (\n    ${columnasStr}\n) VALUES \n${todosLosValuesStr};`;
      
      // Actualizar estado con resultados
      setSqlGenerado(sqlFinal);
      setEstadisticas({
        totalRegistros: columnasConDatos,
        totalCampos: datos.length,
        nombreHoja: nombreHoja
      });
      setExito(`✅ Se generó 1 INSERT con ${columnasConDatos} registros (semanas)`);
      
    } catch (err) {
      setError(`❌ Error al procesar el archivo: ${err.message}`);
      setSqlGenerado('');
      setEstadisticas(null);
    } finally {
      setProcesando(false);
    }
  };

  // ==================================================
  // Descargar archivo SQL
  // ==================================================
  const descargarSQL = () => {
    if (!sqlGenerado) return;
    
    const blob = new Blob([sqlGenerado], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inserts_lecturas_semana.sql';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ==================================================
  // Copiar al portapapeles
  // ==================================================
  const copiarAlPortapapeles = async () => {
    try {
      await navigator.clipboard.writeText(sqlGenerado);
      setExito('✅ SQL copiado al portapapeles');
      setTimeout(() => {
        if (!sqlGenerado) return;
        setExito(`✅ Se generó 1 INSERT con ${estadisticas?.totalRegistros || 0} registros (semanas)`);
      }, 3000);
    } catch (err) {
      setError('❌ Error al copiar al portapapeles');
    }
  };

  // ==================================================
  // Renderizado del componente
  // ==================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        
        {/* Encabezado */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <FileSpreadsheet className="w-12 h-12 text-blue-600" />
            <Database className="w-12 h-12 text-indigo-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Excel a SQL - Lecturas Semanales 2024
          </h1>
          <p className="text-gray-600">
            Convierte datos de lecturas semanales (formato vertical) a sentencias SQL INSERT
          </p>
        </div>

        {/* Información importante */}
        <div className="mb-6 bg-blue-50 border-l-4 border-blue-600 p-4 rounded-r-lg">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">📋 Formato esperado del Excel:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>Columna A</strong>: Nombres de los campos (numero_semana, fecha_inicio, etc.)</li>
                <li><strong>Columnas B, C, D...</strong>: Cada columna representa una semana diferente</li>
                <li>Se generará <strong>UN SOLO INSERT</strong> con múltiples VALUES (uno por columna)</li>
                <li>Cada conjunto de VALUES tendrá {camposTabla.length} campos</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Panel izquierdo: Entrada de datos */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              📋 Configuración
            </h2>
            
            {/* Seleccionar archivo */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Archivo Excel
              </label>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  Seleccionar archivo Excel
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={manejarArchivoSeleccionado}
                  className="hidden"
                />
                {archivo && (
                  <div className="px-3 py-2 bg-green-50 border border-green-200 rounded text-sm text-green-800">
                    ✓ {archivo.name}
                  </div>
                )}
              </div>
            </div>
            
            {/* Nombre de la tabla */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la tabla
              </label>
              <input
                type="text"
                value={nombreTabla}
                onChange={(e) => setNombreTabla(e.target.value)}
                placeholder="lecturas_semana2024"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">
                Por defecto: public.lecturas_semana2024
              </p>
            </div>
            
            {/* Botón procesar */}
            <button
              onClick={procesarExcel}
              disabled={procesando || !archivo}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {procesando ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Procesando...
                </>
              ) : (
                <>⚡ Generar SQL</>
              )}
            </button>
            
            {/* Mensajes */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}
            
            {exito && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-green-800 text-sm">{exito}</p>
              </div>
            )}
            
            {/* Estadísticas */}
            {estadisticas && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-3">📊 Estadísticas</h3>
                <div className="space-y-2 text-sm text-blue-800">
                  <p><strong>Hoja:</strong> {estadisticas.nombreHoja}</p>
                  <p><strong>Registros (semanas):</strong> {estadisticas.totalRegistros}</p>
                  <p><strong>Campos por registro:</strong> {estadisticas.totalCampos}</p>
                  <p className="text-xs mt-2 text-blue-700 bg-blue-100 px-2 py-1 rounded">
                    ✓ 1 INSERT con {estadisticas.totalRegistros} VALUES
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Panel derecho: Resultado */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">
                🎯 Resultado SQL
              </h2>
              {sqlGenerado && (
                <div className="flex gap-2">
                  <button
                    onClick={copiarAlPortapapeles}
                    className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                    title="Copiar al portapapeles"
                  >
                    📋 Copiar
                  </button>
                  <button
                    onClick={descargarSQL}
                    className="flex items-center gap-1 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    title="Descargar archivo SQL"
                  >
                    <Download className="w-4 h-4" />
                    Descargar
                  </button>
                </div>
              )}
            </div>
            
            {sqlGenerado ? (
              <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-[600px]">
                <pre className="text-green-400 text-xs font-mono whitespace-pre-wrap break-words">
                  {sqlGenerado}
                </pre>
              </div>
            ) : (
              <div className="h-96 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-center text-gray-400">
                  <Database className="w-16 h-16 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">El código SQL aparecerá aquí</p>
                  <p className="text-xs mt-2">Selecciona un archivo Excel y haz clic en Generar SQL</p>
                </div>
              </div>
            )}
          </div>
          
        </div>
        
      </div>
    </div>
  );
};

export default ExcelToSqlPage;
