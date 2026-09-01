import { useMemo, useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from "./ui/card"
import { Button } from "./ui/button"
import { supabase } from '../supabaseClient'
import { useAuth } from '../contexts/AuthContextNew'
import { 
  ArrowUpIcon,
  ArrowDownIcon,
  MinusIcon,
  DownloadIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  Loader2Icon,
  EditIcon,
  MessageSquarePlusIcon
} from 'lucide-react'

/**
 * Tabla tipo Excel para comparación semanal entre años
 * Muestra el consumo de cada semana comparado con la misma semana del año anterior
 * Los datos vienen directamente de las tablas Lecturas_Semana_Agua_consumo
 */
export default function WeeklyComparisonTable({
  title = "Comparación Semanal",
  data2024 = [],
  data2025 = [],
  pointName = "Punto de Medición",
  unit = "m³",
  year1 = "2024",
  year2 = "2025",
  sourceType = "agua"
}) {

  const [showPercentages, setShowPercentages] = useState(true)

  const { user } = useAuth()

  // Comentarios semanales por recurso: { [week_number]: { id, comment, author, authorName, created_at, updated_at } }
  const [comments, setComments] = useState({})
  const [loadingComments, setLoadingComments] = useState(false)
  const [editingWeek, setEditingWeek] = useState(null)
  const [draft, setDraft] = useState('')
  const [savingComment, setSavingComment] = useState(false)

  useEffect(() => {
    fetchComments()
  }, [sourceType])

  const fetchComments = async () => {
    try {
      setLoadingComments(true)
      const { data, error } = await supabase
        .from('weekly_comments')
        .select('*, profiles(full_name)')
        .eq('source_type', sourceType)

      if (error) {
        console.error('❌ Error cargando comentarios semanales:', error)
        return
      }

      const commentsMap = {}
      data?.forEach(comment => {
        commentsMap[comment.week_number] = {
          id: comment.id,
          comment: comment.comment,
          author: comment.author,
          authorName: comment.profiles?.full_name || null,
          created_at: comment.created_at,
          updated_at: comment.updated_at
        }
      })
      setComments(commentsMap)
      console.log('✅ Comentarios semanales cargados:', data?.length || 0)
    } catch (err) {
      console.error('❌ Error al cargar comentarios semanales:', err)
    } finally {
      setLoadingComments(false)
    }
  }

  const saveComment = async (week) => {
    if (!draft.trim()) {
      alert('Por favor ingresa un comentario')
      return
    }

    if (!user?.id) {
      alert('Sesión no disponible. Inicia sesión para comentar.')
      return
    }

    try {
      setSavingComment(true)

      // El author (UUID de la sesión activa) se manda automáticamente a la BD
      const { data, error } = await supabase
        .from('weekly_comments')
        .upsert({
          week_number: week,
          source_type: sourceType,
          comment: draft.trim(),
          author: user.id
        }, {
          onConflict: 'week_number,source_type'
        })
        .select('*')

      if (error) {
        console.error('❌ Error guardando comentario semanal:', error)
        alert('Error al guardar el comentario: ' + error.message)
        return
      }

      setComments(prev => ({
        ...prev,
        [week]: {
          id: data[0]?.id,
          comment: draft.trim(),
          author: user.id,
          authorName: user.name !== 'Usuario' ? user.name : null,
          created_at: data[0]?.created_at,
          updated_at: data[0]?.updated_at
        }
      }))

      setEditingWeek(null)
      setDraft('')
      console.log('✅ Comentario semanal guardado:', week)
    } catch (err) {
      console.error('❌ Error al guardar comentario semanal:', err)
      alert('Error al guardar el comentario')
    } finally {
      setSavingComment(false)
    }
  }

  // Los datos ya vienen como consumo desde las tablas Lecturas_Semana_Agua_consumo
  // No necesitamos calcular diferencias, solo extraer el consumo directamente
  const processWeeklyData = (weeklyData) => {
    if (!weeklyData || weeklyData.length === 0) return []
    
    // Usar el campo consumption si existe, sino usar reading (para compatibilidad)
    return weeklyData.map(week => ({
      week: week.week,
      consumption: week.consumption !== undefined && week.consumption !== null 
        ? week.consumption 
        : (week.reading || 0)
    }))
  }

  const processed2024 = useMemo(() => processWeeklyData(data2024), [data2024])
  const processed2025 = useMemo(() => processWeeklyData(data2025), [data2025])

  // Obtener el número máximo de semanas
  const maxWeeks = Math.max(processed2024.length, processed2025.length, 52)

  // Crear array de semanas para la tabla
  const weekRows = useMemo(() => {
    const rows = []
    for (let i = 1; i <= maxWeeks; i++) {
      const week2024 = processed2024.find(w => w.week === i)
      const week2025 = processed2025.find(w => w.week === i)
      
      const consumption2024 = week2024?.consumption || 0
      const consumption2025 = week2025?.consumption || 0
      
      // Calcular cambio porcentual
      let change = 0
      let changeType = 'neutral'
      if (consumption2024 > 0 && consumption2025 > 0) {
        change = ((consumption2025 - consumption2024) / consumption2024 * 100)
        if (change > 5) changeType = 'increase'
        else if (change < -5) changeType = 'decrease'
      }
      
      rows.push({
        week: i,
        consumption2024,
        consumption2025,
        change,
        changeType,
        hasData2024: !!week2024,
        hasData2025: !!week2025
      })
    }
    return rows
  }, [processed2024, processed2025, maxWeeks])

  // Calcular totales
  const totals = useMemo(() => {
    const total2024 = processed2024.reduce((sum, w) => sum + w.consumption, 0)
    const total2025 = processed2025.reduce((sum, w) => sum + w.consumption, 0)
    const avgChange = total2024 > 0 ? ((total2025 - total2024) / total2024 * 100) : 0
    
    return {
      total2024,
      total2025,
      avgChange
    }
  }, [processed2024, processed2025])

  // Exportar a CSV
  const exportToCSV = () => {
    const headers = ['Semana', `${year1} (m³)`, `${year2} (m³)`, 'Cambio (%)', 'Diferencia (m³)', 'Comentarios']
    const rows = weekRows.map(row => [
      row.week,
      row.consumption2024.toFixed(2),
      row.consumption2025.toFixed(2),
      row.change.toFixed(1),
      (row.consumption2025 - row.consumption2024).toFixed(2),
      (comments[row.week]?.comment || '').replace(/"/g, '""')
    ])
    
    // Agregar fila de totales
    rows.push(['TOTAL', totals.total2024.toFixed(2), totals.total2025.toFixed(2), totals.avgChange.toFixed(1), (totals.total2025 - totals.total2024).toFixed(2), ''])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `comparacion_semanal_${pointName.replace(/\s+/g, '_')}.csv`
    link.click()
  }

  // Helper para forzar el formato mexicano en toda la tabla
  const formatMX = (value) => {
    if (value === null || value === undefined || isNaN(value)) return "0.00";
    return Number(value).toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Obtener color basado en el cambio
  const getChangeColor = (changeType) => {
    if (changeType === 'increase') {
      return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
    } else if (changeType === 'decrease') {
      return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
    }
    return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{pointName}</p>
            <p className="text-xs text-muted-foreground mt-1 italic">
              * Comparación de consumo: Misma semana entre diferentes años
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={showPercentages ? "default" : "outline"}
              size="sm"
              onClick={() => setShowPercentages(!showPercentages)}
            >
              {showPercentages ? 'Mostrar Valores' : 'Mostrar %'}
            </Button>
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <DownloadIcon className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>

        {/* Resumen de totales */}
        <div className="grid grid-cols-3 gap-4 mt-4 p-4 bg-muted/30 rounded-lg">
          <div>
            <p className="text-xs text-muted-foreground">Consumo Total {year1}</p>
            <p className="text-xl font-bold text-foreground">{formatMX(totals.total2024)} {unit}</p>
            <p className="text-xs text-muted-foreground mt-1">Suma de todas las semanas</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Consumo Total {year2}</p>
            <p className="text-xl font-bold text-foreground">{formatMX(totals.total2025)} {unit}</p>
            <p className="text-xs text-muted-foreground mt-1">Suma de todas las semanas</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Variación Anual</p>
            <div className="flex items-center gap-2">
              {totals.avgChange > 0 ? (
                <TrendingUpIcon className="h-5 w-5 text-red-500" />
              ) : totals.avgChange < 0 ? (
                <TrendingDownIcon className="h-5 w-5 text-green-500" />
              ) : (
                <MinusIcon className="h-5 w-5 text-gray-500" />
              )}
              <p className={`text-xl font-bold ${
                totals.avgChange > 0 ? 'text-red-500' : 
                totals.avgChange < 0 ? 'text-green-500' : 
                'text-gray-500'
              }`}>
                {totals.avgChange > 0 ? '+' : ''}{totals.avgChange.toFixed(1)}%
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{year2} vs {year1}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto border rounded-lg">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-background z-10 border-b-2 border-muted">
              <tr>
                <th className="p-3 text-left font-semibold text-sm border-r bg-muted/50">Semana</th>
                <th className="p-3 text-right font-semibold text-sm border-r bg-blue-50 dark:bg-blue-900/20">
                  <div>Consumo {year1}</div>
                  <div className="text-xs font-normal text-muted-foreground">({unit})</div>
                </th>
                <th className="p-3 text-right font-semibold text-sm border-r bg-green-50 dark:bg-green-900/20">
                  <div>Consumo {year2}</div>
                  <div className="text-xs font-normal text-muted-foreground">({unit})</div>
                </th>
                <th className="p-3 text-center font-semibold text-sm bg-amber-50 dark:bg-amber-900/20">
                  <div>Variación</div>
                  <div className="text-xs font-normal text-muted-foreground">({year2} vs {year1})</div>
                </th>
                <th className="p-3 text-left font-semibold text-sm border-l bg-violet-50 dark:bg-violet-900/20">
                  <div className="flex items-center gap-1">
                    <span>Comentarios</span>
                    {loadingComments && <Loader2Icon className="h-3 w-3 animate-spin text-muted-foreground" />}
                  </div>
                  <div className="text-xs font-normal text-muted-foreground">(por semana)</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {weekRows.map((row, index) => (
                <tr 
                  key={row.week}
                  className={`border-b hover:bg-muted/30 transition-colors ${
                    index % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                  }`}
                >
                  {/* Semana */}
                  <td className="p-3 font-medium text-sm border-r">
                    Semana {row.week}
                  </td>

                  {/* 2024 */}
                  <td className={`p-3 text-right text-sm border-r ${
                    !row.hasData2024 ? 'text-muted-foreground italic' : ''
                  }`}>
                    {row.hasData2024 ? formatMX(row.consumption2024) : 'Sin datos'}
                  </td>

                  {/* 2025 */}
                  <td className={`p-3 text-right text-sm border-r font-medium ${
                    !row.hasData2025 ? 'text-muted-foreground italic' : ''
                  }`}>
                    {row.hasData2025 ? formatMX(row.consumption2025) : 'Sin datos'}
                  </td>

                  {/* Comparación */}
                  <td className="p-3 text-center">
                    {row.hasData2024 && row.hasData2025 ? (
                      <div className="flex items-center justify-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getChangeColor(row.changeType, row.change)}`}>
                          {row.changeType === 'increase' && <ArrowUpIcon className="h-3 w-3 inline mr-1" />}
                          {row.changeType === 'decrease' && <ArrowDownIcon className="h-3 w-3 inline mr-1" />}
                          {row.changeType === 'neutral' && <MinusIcon className="h-3 w-3 inline mr-1" />}
                          {showPercentages ? (
                            <>{row.change > 0 ? '+' : ''}{row.change.toFixed(1)}%</>
                          ) : (
                            <>{formatMX(row.consumption2025 - row.consumption2024)} {unit}</>
                          )}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </td>

                  {/* Comentarios */}
                  <td className="p-3 text-sm border-l">
                    {editingWeek === row.week ? (
                      <div className="space-y-2">
                        <textarea
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          rows={2}
                          placeholder="Escribe un comentario sobre esta semana..."
                          className="w-full px-2 py-1 border border-muted rounded text-xs bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => saveComment(row.week)}
                            disabled={savingComment || !draft.trim()}
                          >
                            {savingComment && <Loader2Icon className="h-3.5 w-3.5 mr-1 animate-spin" />}
                            Guardar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => { setEditingWeek(null); setDraft('') }}
                            disabled={savingComment}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : comments[row.week] ? (
                      <div className="flex items-start gap-2">
                        <div className="flex-1 text-left">
                          <p className="text-xs text-foreground whitespace-pre-wrap">{comments[row.week].comment}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            - {comments[row.week].authorName || 'Usuario'}
                          </p>
                          {comments[row.week].updated_at && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              Última edición: {new Date(comments[row.week].updated_at).toLocaleString('es-MX')}
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          className="h-8 px-2.5 flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                          title="Editar comentario"
                          onClick={() => { setEditingWeek(row.week); setDraft(comments[row.week].comment) }}
                        >
                          <EditIcon className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs"
                          onClick={() => { setEditingWeek(row.week); setDraft('') }}
                        >
                          <MessageSquarePlusIcon className="h-3.5 w-3.5 mr-1" />
                          Comentar
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              
              {/* Fila de totales */}
              <tr className="border-t-2 border-muted bg-muted/50 font-bold">
                <td className="p-3 text-sm border-r">TOTAL</td>
                <td className="p-3 text-right text-sm border-r">
                  {formatMX(totals.total2024)}
                </td>
                <td className="p-3 text-right text-sm border-r">
                  {formatMX(totals.total2025)}
                </td>
                <td className="p-3 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    totals.avgChange > 5 ? 'bg-red-100 dark:bg-red-900/30 text-red-700' :
                    totals.avgChange < -5 ? 'bg-green-100 dark:bg-green-900/30 text-green-700' :
                    'bg-gray-100 dark:bg-gray-800 text-gray-700'
                  }`}>
                    {totals.avgChange > 0 ? '+' : ''}{totals.avgChange.toFixed(1)}%
                  </span>
                </td>
                <td className="p-3 border-l"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
