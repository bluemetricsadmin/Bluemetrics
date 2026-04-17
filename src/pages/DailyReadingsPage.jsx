import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { DashboardHeader } from "../components/dashboard-header";
import { DashboardSidebar } from "../components/dashboard-sidebar";
import { RedirectIfNotAuth } from '../components/RedirectIfNotAuth';
import MetricCard from '../components/MetricCard';
import DailyConsumptionChartJS from '../components/DailyConsumptionChartJS';
import { 
  Droplet, TrendingUp, Calendar, Filter, Download, 
  RefreshCw, AlertCircle, Loader2, ChevronLeft, ChevronRight,
  Activity, BarChart3, ArrowUpDown, Percent
} from 'lucide-react';

const DailyReadingsPage = () => {
  // Estados
  const [lecturas, setLecturas] = useState([]);
  const [semanasInfo, setSemanasInfo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroMes, setFiltroMes] = useState('todos');
  const [filtroPunto, setFiltroPunto] = useState('consumo');
  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 20;

  // Configuración de puntos de medición
  const puntosDisponibles = [
    { value: 'consumo', label: 'Consumo Total', field: 'consumo' },
    { value: 'general_pozos', label: 'General Pozos', field: 'general_pozos' },
    { value: 'pozo_3', label: 'Pozo 3', field: 'pozo_3' },
    { value: 'pozo_8', label: 'Pozo 8', field: 'pozo_8' },
    { value: 'pozo_15', label: 'Pozo 15', field: 'pozo_15' },
    { value: 'pozo_4', label: 'Pozo 4', field: 'pozo_4' },
    { value: 'pozo7', label: 'Pozo 7', field: 'pozo7' },
    { value: 'pozo11', label: 'Pozo 11', field: 'pozo11' },
    { value: 'pozo_12', label: 'Pozo 12', field: 'pozo_12' },
    { value: 'pozo_14', label: 'Pozo 14', field: 'pozo_14' },
    { value: 'campus_8', label: 'Campus 8', field: 'campus_8' },
    { value: 'a7_cc', label: 'A7-CC', field: 'a7_cc' },
    { value: 'megacentral', label: 'Megacentral', field: 'megacentral' },
    { value: 'planta_fisica', label: 'Planta Física', field: 'planta_fisica' },
    { value: 'residencias', label: 'Residencias', field: 'residencias' },
    { value: 'a_y_d', label: 'A y D', field: 'a_y_d' }
  ];

  // Obtener datos de Supabase
  const fetchLecturas = async (punto = filtroPunto) => {
    const tabla = punto === 'consumo' ? 'lecturas_diarias' : 'lecturas_diarias_consumo';
    try {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from(tabla)
        .select('*')
        .order('created_at', { ascending: false });

      if (supabaseError) throw supabaseError;

      // Obtener las últimas 2 semanas de la tabla semanal para los números de semana
      const { data: semanasData } = await supabase
        .from('lecturas_semana_agua_consumo_2026')
        .select('l_numero_semana, l_fecha_inicio, l_fecha_fin')
        .order('l_numero_semana', { ascending: false })
        .limit(2);

      setLecturas(data || []);
      setSemanasInfo(semanasData || []);
    } catch (err) {
      console.error('Error fetching lecturas:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch cuando cambia el punto de medición
  useEffect(() => {
    fetchLecturas(filtroPunto);
  }, [filtroPunto]);

  // Obtener meses únicos para filtro
  const mesesUnicos = useMemo(() => {
    const meses = [...new Set(lecturas.map(l => l.mes_anio))];
    return meses.filter(Boolean);
  }, [lecturas]);

  // Filtrar lecturas por mes
  const lecturasFiltradas = useMemo(() => {
    if (filtroMes === 'todos') return lecturas;
    return lecturas.filter(l => l.mes_anio === filtroMes);
  }, [lecturas, filtroMes]);

  // Paginación
  const totalPaginas = Math.ceil(lecturasFiltradas.length / registrosPorPagina);
  const indiceInicio = (paginaActual - 1) * registrosPorPagina;
  const indiceFin = indiceInicio + registrosPorPagina;
  const lecturasPaginadas = lecturasFiltradas.slice(indiceInicio, indiceFin);

  // Estadísticas generales
  const estadisticas = useMemo(() => {
    if (lecturasFiltradas.length === 0) return null;

    const consumoTotal = lecturasFiltradas.reduce((sum, l) => sum + (parseFloat(l.consumo) || 0), 0);
    const consumoPromedio = consumoTotal / lecturasFiltradas.length;
    const consumoMax = Math.max(...lecturasFiltradas.map(l => parseFloat(l.consumo) || 0));
    const consumoMin = Math.min(...lecturasFiltradas.filter(l => l.consumo > 0).map(l => parseFloat(l.consumo) || 0));

    return {
      totalRegistros: lecturasFiltradas.length,
      consumoTotal: consumoTotal.toFixed(2),
      consumoPromedio: consumoPromedio.toFixed(2),
      consumoMax: consumoMax.toFixed(2),
      consumoMin: consumoMin.toFixed(2)
    };
  }, [lecturasFiltradas]);

  // Métricas del punto seleccionado
  const metricasPunto = useMemo(() => {
    if (lecturasFiltradas.length === 0) return null;

    const puntoConfig = puntosDisponibles.find(p => p.value === filtroPunto);
    if (!puntoConfig) return null;

    const field = puntoConfig.field;
    
    // Lectura actual (más reciente)
    const lecturaActual = parseFloat(lecturasFiltradas[0]?.[field]) || 0;
    
    // Lectura anterior (segunda más reciente)
    const lecturaAnterior = parseFloat(lecturasFiltradas[1]?.[field]) || 0;
    
    // Etiquetas de las lecturas
    const lecturaActualLabel = lecturasFiltradas[0]?.dia_hora || '';
    const lecturaAnteriorLabel = lecturasFiltradas[1]?.dia_hora || '';
    
    // Comparación vs lectura anterior
    const vsAnteriorPorcentaje = lecturaAnterior > 0 
      ? ((lecturaActual - lecturaAnterior) / lecturaAnterior * 100)
      : 0;
    
    // Ahorro/Incremento respecto al promedio total
    const promedioTotal = lecturasFiltradas.reduce((sum, l) => sum + (parseFloat(l[field]) || 0), 0) / lecturasFiltradas.length;
    const ahorroPorcentaje = promedioTotal > 0 
      ? ((lecturaActual - promedioTotal) / promedioTotal * 100)
      : 0;

    return {
      lecturaActual: lecturaActual.toFixed(1),
      lecturaAnterior: lecturaAnterior.toFixed(1),
      vsAnteriorPorcentaje: vsAnteriorPorcentaje.toFixed(0),
      ahorroPorcentaje: ahorroPorcentaje.toFixed(0),
      puntoLabel: puntoConfig.label,
      lecturaActualLabel,
      lecturaAnteriorLabel
    };
  }, [lecturasFiltradas, filtroPunto, puntosDisponibles]);

  // Agrupar lecturas por año para comparación multi-año
  const multiYearData = useMemo(() => {
    if (lecturas.length === 0) return null;

    const byYear = {};
    lecturas.forEach(l => {
      const match = l.mes_anio?.match(/(\d{4})/);
      if (match) {
        const year = match[1];
        if (!byYear[year]) byYear[year] = [];
        byYear[year].push(l);
      }
    });

    const years = Object.keys(byYear).sort();
    if (years.length <= 1) return null;

    return years.map(year => ({
      year,
      data: byYear[year]
    }));
  }, [lecturas]);

  // Exportar a CSV
  const exportarCSV = () => {
    const headers = ['Mes/Año', 'Día/Hora', 'Consumo', 'General Pozos', 'Pozo 3', 'Pozo 8', 'Pozo 15', 'Pozo 4', 'A y D', 'Campus 8', 'A7-CC', 'Megacentral', 'Planta Física', 'Residencias', 'Pozo 7', 'Pozo 11', 'Pozo 12', 'Pozo 14'];
    const rows = lecturasFiltradas.map(l => [
      l.mes_anio, l.dia_hora, l.consumo, l.general_pozos, l.pozo_3, l.pozo_8, 
      l.pozo_15, l.pozo_4, l.a_y_d, l.campus_8, l.a7_cc, l.megacentral, 
      l.planta_fisica, l.residencias, l.pozo7, l.pozo11, l.pozo_12, l.pozo_14
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lecturas_diarias_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <RedirectIfNotAuth>
      <div className="min-h-screen bg-background">
        <DashboardSidebar />
        
        <div className="ml-64">
          <DashboardHeader />
          <main className="p-6">
            
            {/* Estado de carga */}
            {loading && (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Cargando lecturas diarias...</p>
                </div>
              </div>
            )}

            {/* Estado de error */}
            {error && !loading && (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-red-800 font-semibold mb-2">Error al cargar datos</h3>
                      <p className="text-red-700 text-sm">{error}</p>
                      <button
                        onClick={fetchLecturas}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Reintentar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Contenido principal - solo mostrar si no hay loading ni error */}
            {!loading && !error && (
              <>
                {/* Encabezado */}
                <div className="mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-foreground mb-2">Lecturas Diarias</h1>
                      <p className="text-muted-foreground">Visualización y análisis de consumo diario de agua</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={fetchLecturas}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Actualizar
                      </button>
                      <button
                        onClick={exportarCSV}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Exportar CSV
                      </button>
                    </div>
                  </div>
                </div>

        {/* Filtros */}
        <div className="bg-card rounded-lg border border-border p-4 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-foreground">Punto de medición:</label>
              <select
                value={filtroPunto}
                onChange={(e) => setFiltroPunto(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {puntosDisponibles.map(punto => (
                  <option key={punto.value} value={punto.value}>{punto.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-foreground">Filtrar por mes:</label>
              <select
                value={filtroMes}
                onChange={(e) => {
                  setFiltroMes(e.target.value);
                  setPaginaActual(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="todos">Todos los meses</option>
                {mesesUnicos.map(mes => (
                  <option key={mes} value={mes}>{mes}</option>
                ))}
              </select>
            </div>
            <span className="text-sm text-muted-foreground ml-auto">
              {lecturasFiltradas.length} registros encontrados
            </span>
          </div>
        </div>

        {/* Métricas del punto seleccionado */}
        {metricasPunto && (
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <MetricCard
                title="Consumo Actual"
                value={metricasPunto.lecturaActual}
                unit="m³"
                icon={Droplet}
                iconColor="text-blue-600"
              />
              <MetricCard
                title="Vs Lectura Anterior"
                comparison={parseFloat(metricasPunto.vsAnteriorPorcentaje)}
                comparisonLabel={`${metricasPunto.lecturaActualLabel} vs ${metricasPunto.lecturaAnteriorLabel}`}
                comparisonTooltip={`Actual: ${metricasPunto.lecturaActual} m³ (${metricasPunto.lecturaActualLabel}) | Anterior: ${metricasPunto.lecturaAnterior} m³ (${metricasPunto.lecturaAnteriorLabel})`}
                trend={parseFloat(metricasPunto.vsAnteriorPorcentaje) > 0 ? 'up' : 'down'}
                icon={ArrowUpDown}
                iconColor="text-green-600"
              />
              <MetricCard
                title="de Ahorro"
                comparison={parseFloat(metricasPunto.ahorroPorcentaje)}
                comparisonLabel="vs promedio total"
                trend={parseFloat(metricasPunto.ahorroPorcentaje) < 0 ? 'up' : 'down'}
                icon={Percent}
                iconColor="text-purple-600"
              />
            </div>
          </div>
        )}

        {/* Gráfico Avanzado de Consumo Diario */}
        <div className="mb-6">
          <DailyConsumptionChartJS 
            data={lecturasFiltradas}
            puntoField={puntosDisponibles.find(p => p.value === filtroPunto)?.field || 'consumo'}
            puntoLabel={puntosDisponibles.find(p => p.value === filtroPunto)?.label || 'Consumo'}
            multiYearData={multiYearData}
          />
        </div>


        {/* Tabla de datos */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="text-xl font-semibold text-foreground">
              Registros de Lecturas Diarias
            </h3>
          </div>
          
          <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
            <table className="w-full">
              <thead className="bg-muted sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">Mes/Año</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">Día/Hora</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">Consumo</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">General Pozos</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">Pozo 3</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">Pozo 8</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">Pozo 15</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">Pozo 4</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">Pozo 7</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">Pozo 11</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">Pozo 12</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">Pozo 14</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">Campus 8</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">A7-CC</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">Megacentral</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">Planta Física</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">Residencias</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">A y D</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lecturasPaginadas.map((lectura, index) => (
                  <tr key={lectura.id || index} className="hover:bg-muted/50">
                    <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">{lectura.mes_anio}</td>
                    <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">{lectura.dia_hora}</td>
                    <td className="px-4 py-3 text-sm text-foreground text-right font-medium whitespace-nowrap">{lectura.consumo}</td>
                    <td className="px-4 py-3 text-sm text-foreground text-right whitespace-nowrap">{lectura.general_pozos}</td>
                    <td className="px-4 py-3 text-sm text-foreground text-right whitespace-nowrap">{lectura.pozo_3}</td>
                    <td className="px-4 py-3 text-sm text-foreground text-right whitespace-nowrap">{lectura.pozo_8}</td>
                    <td className="px-4 py-3 text-sm text-foreground text-right whitespace-nowrap">{lectura.pozo_15}</td>
                    <td className="px-4 py-3 text-sm text-foreground text-right whitespace-nowrap">{lectura.pozo_4}</td>
                    <td className="px-4 py-3 text-sm text-foreground text-right whitespace-nowrap">{lectura.pozo7}</td>
                    <td className="px-4 py-3 text-sm text-foreground text-right whitespace-nowrap">{lectura.pozo11}</td>
                    <td className="px-4 py-3 text-sm text-foreground text-right whitespace-nowrap">{lectura.pozo_12}</td>
                    <td className="px-4 py-3 text-sm text-foreground text-right whitespace-nowrap">{lectura.pozo_14}</td>
                    <td className="px-4 py-3 text-sm text-foreground text-right whitespace-nowrap">{lectura.campus_8}</td>
                    <td className="px-4 py-3 text-sm text-foreground text-right whitespace-nowrap">{lectura.a7_cc}</td>
                    <td className="px-4 py-3 text-sm text-foreground text-right whitespace-nowrap">{lectura.megacentral}</td>
                    <td className="px-4 py-3 text-sm text-foreground text-right whitespace-nowrap">{lectura.planta_fisica}</td>
                    <td className="px-4 py-3 text-sm text-foreground text-right whitespace-nowrap">{lectura.residencias}</td>
                    <td className="px-4 py-3 text-sm text-foreground text-right whitespace-nowrap">{lectura.a_y_d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="px-6 py-4 border-t border-border flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Mostrando {indiceInicio + 1} - {Math.min(indiceFin, lecturasFiltradas.length)} de {lecturasFiltradas.length} registros
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPaginaActual(prev => Math.max(1, prev - 1))}
                  disabled={paginaActual === 1}
                  className="px-3 py-2 border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </button>
                <span className="px-4 py-2 text-sm text-muted-foreground">
                  Página {paginaActual} de {totalPaginas}
                </span>
                <button
                  onClick={() => setPaginaActual(prev => Math.min(totalPaginas, prev + 1))}
                  disabled={paginaActual === totalPaginas}
                  className="px-3 py-2 border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

              </>
            )}
          </main>
        </div>
      </div>
    </RedirectIfNotAuth>
  );
};

export default DailyReadingsPage;
