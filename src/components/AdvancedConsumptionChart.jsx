import { useState, useMemo } from 'react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, ReferenceLine 
} from 'recharts';
import { 
  Calendar, TrendingUp, TrendingDown, Filter, 
  BarChart3, LineChart as LineChartIcon, AreaChart as AreaChartIcon,
  Download, Maximize2, ChevronDown
} from 'lucide-react';

// Funciones auxiliares
const formatearFecha = (fecha, vista) => {
  if (!fecha) return 'N/A';
  
  try {
    const partes = fecha.split(' ');
    if (vista === 'semanal') {
      return partes[0] || fecha;
    } else if (vista === 'mensual') {
      return partes[0]?.substring(0, 5) || fecha;
    }
    return fecha;
  } catch {
    return fecha;
  }
};

const extraerMes = (fecha) => {
  if (!fecha) return null;
  const partes = fecha.split(' ')[0]?.split('/');
  if (partes && partes.length >= 2) {
    return `${partes[1]}/${partes[2] || new Date().getFullYear()}`;
  }
  return null;
};

const AdvancedConsumptionChart = ({ data, puntoField = 'consumo', puntoLabel = 'Consumo' }) => {
  const [vistaActual, setVistaActual] = useState('mensual'); // semanal, mensual, anual
  const [tipoGrafico, setTipoGrafico] = useState('line'); // line, area, bar
  const [mostrarPromedio, setMostrarPromedio] = useState(true);
  const [mostrarTendencia, setMostrarTendencia] = useState(false);
  const [rangoPersonalizado, setRangoPersonalizado] = useState(false);

  // Procesar datos según la vista seleccionada
  const datosProcessados = useMemo(() => {
    if (!data || data.length === 0) return [];

    let limite, agrupacion;
    
    switch (vistaActual) {
      case 'semanal':
        limite = 7;
        agrupacion = 'dia';
        break;
      case 'mensual':
        limite = 30;
        agrupacion = 'dia';
        break;
      case 'anual':
        limite = 12;
        agrupacion = 'mes';
        break;
      default:
        limite = 30;
        agrupacion = 'dia';
    }

    if (agrupacion === 'dia') {
      return data.slice(0, limite).reverse().map(item => ({
        fecha: item.dia_hora || item.fecha || 'N/A',
        valor: parseFloat(item[puntoField]) || 0,
        fechaCorta: formatearFecha(item.dia_hora || item.fecha, vistaActual)
      }));
    } else {
      // Agrupar por mes para vista anual
      const datosPorMes = {};
      
      data.forEach(item => {
        const mes = item.mes_anio || extraerMes(item.dia_hora);
        if (mes) {
          if (!datosPorMes[mes]) {
            datosPorMes[mes] = { total: 0, count: 0 };
          }
          datosPorMes[mes].total += parseFloat(item[puntoField]) || 0;
          datosPorMes[mes].count += 1;
        }
      });

      return Object.keys(datosPorMes)
        .slice(0, limite)
        .map(mes => ({
          fecha: mes,
          valor: (datosPorMes[mes].total / datosPorMes[mes].count).toFixed(2),
          fechaCorta: mes
        }));
    }
  }, [data, vistaActual, puntoField]);

  // Calcular estadísticas
  const estadisticas = useMemo(() => {
    if (datosProcessados.length === 0) return null;

    const valores = datosProcessados.map(d => parseFloat(d.valor));
    const promedio = valores.reduce((a, b) => a + b, 0) / valores.length;
    const maximo = Math.max(...valores);
    const minimo = Math.min(...valores);
    const total = valores.reduce((a, b) => a + b, 0);
    
    // Calcular tendencia (diferencia entre primera y última lectura)
    const tendencia = valores[valores.length - 1] - valores[0];
    const tendenciaPorcentaje = (tendencia / valores[0]) * 100;

    return {
      promedio: promedio.toFixed(2),
      maximo: maximo.toFixed(2),
      minimo: minimo.toFixed(2),
      total: total.toFixed(2),
      tendencia: tendencia.toFixed(2),
      tendenciaPorcentaje: tendenciaPorcentaje.toFixed(1)
    };
  }, [datosProcessados]);

  // Exportar datos
  const exportarDatos = () => {
    const csv = [
      ['Fecha', 'Valor'],
      ...datosProcessados.map(d => [d.fecha, d.valor])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `consumo_${vistaActual}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Renderizar gráfico según tipo
  const renderizarGrafico = () => {
    const props = {
      data: datosProcessados,
      margin: { top: 20, right: 30, left: 20, bottom: 60 }
    };

    const xAxisProps = {
      dataKey: "fechaCorta",
      angle: -45,
      textAnchor: "end",
      height: 100,
      tick: { fontSize: 11 }
    };

    const yAxisProps = {
      tick: { fontSize: 12 }
    };

    const lineProps = {
      type: "monotone",
      dataKey: "valor",
      stroke: "#0088FE",
      strokeWidth: 3,
      dot: { r: 5, fill: "#0088FE" },
      activeDot: { r: 7 },
      name: puntoLabel
    };

    switch (tipoGrafico) {
      case 'area':
        return (
          <AreaChart {...props}>
            <defs>
              <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0088FE" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#0088FE" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '8px' }}
              labelStyle={{ fontWeight: 'bold' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            {mostrarPromedio && estadisticas && (
              <ReferenceLine 
                y={parseFloat(estadisticas.promedio)} 
                stroke="#ff7300" 
                strokeDasharray="5 5"
                label={{ value: `Promedio: ${estadisticas.promedio}`, position: 'right', fill: '#ff7300', fontSize: 12 }}
              />
            )}
            <Area 
              type="monotone" 
              dataKey="valor" 
              stroke="#0088FE" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorValor)"
              name={puntoLabel}
            />
          </AreaChart>
        );
      
      case 'bar':
        return (
          <BarChart {...props}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '8px' }}
              labelStyle={{ fontWeight: 'bold' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            {mostrarPromedio && estadisticas && (
              <ReferenceLine 
                y={parseFloat(estadisticas.promedio)} 
                stroke="#ff7300" 
                strokeDasharray="5 5"
                label={{ value: `Promedio: ${estadisticas.promedio}`, position: 'right', fill: '#ff7300', fontSize: 12 }}
              />
            )}
            <Bar dataKey="valor" fill="#0088FE" name={puntoLabel} radius={[8, 8, 0, 0]} />
          </BarChart>
        );
      
      default: // line
        return (
          <LineChart {...props}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '8px' }}
              labelStyle={{ fontWeight: 'bold' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            {mostrarPromedio && estadisticas && (
              <ReferenceLine 
                y={parseFloat(estadisticas.promedio)} 
                stroke="#ff7300" 
                strokeDasharray="5 5"
                label={{ value: `Promedio: ${estadisticas.promedio}`, position: 'right', fill: '#ff7300', fontSize: 12 }}
              />
            )}
            <Line {...lineProps} />
          </LineChart>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Consumo Diario - {puntoLabel}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {vistaActual === 'semanal' && 'Últimos 7 días'}
            {vistaActual === 'mensual' && 'Últimos 30 días'}
            {vistaActual === 'anual' && 'Últimos 12 meses'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportarDatos}
            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Controles en fila horizontal arriba de la gráfica */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Período */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-gray-700" />
            <h3 className="font-semibold text-gray-900">Período</h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setVistaActual('semanal')}
              className={`flex-1 px-3 py-2 rounded-lg text-center transition-colors ${
                vistaActual === 'semanal'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              <div className="font-medium text-sm">Semanal</div>
              <div className="text-xs opacity-80">7 puntos</div>
            </button>
            <button
              onClick={() => setVistaActual('mensual')}
              className={`flex-1 px-3 py-2 rounded-lg text-center transition-colors ${
                vistaActual === 'mensual'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              <div className="font-medium text-sm">Mensual</div>
              <div className="text-xs opacity-80">30 puntos</div>
            </button>
            <button
              onClick={() => setVistaActual('anual')}
              className={`flex-1 px-3 py-2 rounded-lg text-center transition-colors ${
                vistaActual === 'anual'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              <div className="font-medium text-sm">Anual</div>
              <div className="text-xs opacity-80">12 puntos</div>
            </button>
          </div>
        </div>

        {/* Tipo de Gráfico */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-5 h-5 text-gray-700" />
            <h3 className="font-semibold text-gray-900">Tipo de Gráfico</h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setTipoGrafico('line')}
              className={`flex-1 px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                tipoGrafico === 'line'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              <LineChartIcon className="w-4 h-4" />
              <span className="text-sm">Línea</span>
            </button>
            <button
              onClick={() => setTipoGrafico('area')}
              className={`flex-1 px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                tipoGrafico === 'area'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              <AreaChartIcon className="w-4 h-4" />
              <span className="text-sm">Área</span>
            </button>
            <button
              onClick={() => setTipoGrafico('bar')}
              className={`flex-1 px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                tipoGrafico === 'bar'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="text-sm">Barras</span>
            </button>
          </div>
        </div>

        {/* Opciones de Visualización */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-5 h-5 text-gray-700" />
            <h3 className="font-semibold text-gray-900">Opciones</h3>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={mostrarPromedio}
                onChange={(e) => setMostrarPromedio(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Mostrar promedio</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={mostrarTendencia}
                onChange={(e) => setMostrarTendencia(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Mostrar tendencia</span>
            </label>
          </div>
        </div>
      </div>

      {/* Gráfico Principal - ancho completo */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <ResponsiveContainer width="100%" height={450}>
          {renderizarGrafico()}
        </ResponsiveContainer>
      </div>

      {/* Estadísticas rápidas + Tendencia debajo del gráfico */}
      {estadisticas && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-xs text-blue-600 font-medium mb-1">Promedio</p>
            <p className="text-2xl font-bold text-blue-900">{estadisticas.promedio}</p>
            <p className="text-xs text-blue-600">m³</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <p className="text-xs text-green-600 font-medium mb-1">Máximo</p>
            <p className="text-2xl font-bold text-green-900">{estadisticas.maximo}</p>
            <p className="text-xs text-green-600">m³</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <p className="text-xs text-yellow-600 font-medium mb-1">Mínimo</p>
            <p className="text-2xl font-bold text-yellow-900">{estadisticas.minimo}</p>
            <p className="text-xs text-yellow-600">m³</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <p className="text-xs text-purple-600 font-medium mb-1">Total</p>
            <p className="text-2xl font-bold text-purple-900">{estadisticas.total}</p>
            <p className="text-xs text-purple-600">m³</p>
          </div>
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-4 border border-indigo-200">
            <div className="flex items-center gap-2 mb-1">
              {parseFloat(estadisticas.tendencia) >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <p className="text-xs text-indigo-600 font-medium">Tendencia</p>
            </div>
            <p className={`text-2xl font-bold ${
              parseFloat(estadisticas.tendencia) >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {estadisticas.tendencia > 0 ? '+' : ''}{estadisticas.tendencia} m³
            </p>
            <p className={`text-xs ${
              parseFloat(estadisticas.tendenciaPorcentaje) >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {estadisticas.tendenciaPorcentaje > 0 ? '+' : ''}{estadisticas.tendenciaPorcentaje}%
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedConsumptionChart;
