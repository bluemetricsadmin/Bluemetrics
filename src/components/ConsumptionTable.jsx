import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader } from "./ui/card"
import { Button } from "./ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"
import { supabase } from '../supabaseClient'
import { 
  SearchIcon, 
  ArrowUpDownIcon, 
  ArrowUpIcon, 
  ArrowDownIcon,
  AlertTriangleIcon,
  InfoIcon,
  DownloadIcon,
  MessageSquarePlusIcon,
  EditIcon,
  Loader2Icon,
  CalendarIcon,
  BarChart3Icon
} from 'lucide-react'

export default function ConsumptionTable({ 
  title, 
  data = [], 
  weekNumber = 1,
  showComparison = false,
  selectedYear = 2024 // Nuevo prop para el año seleccionado
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState('name')
  const [sortDirection, setSortDirection] = useState('asc')
  const [filterType, setFilterType] = useState('all')
  
  // Estados para comentarios
  const [comments, setComments] = useState({}) // { pointId: { comment, author } }
  const [loadingComments, setLoadingComments] = useState(true)
  const [editingComment, setEditingComment] = useState(null) // { pointId, comment, author }
  const [savingComment, setSavingComment] = useState(false)
  const [commentDialogOpen, setCommentDialogOpen] = useState(false)

  // Obtener tipos únicos de los datos
  const uniqueTypes = useMemo(() => {
    const types = [...new Set(data.map(item => item.type || 'otro'))]
    return types.sort()
  }, [data])

  // Cargar comentarios desde Supabase cuando cambia el año o la semana
  useEffect(() => {
    fetchComments()
  }, [selectedYear, weekNumber])

  // Función para cargar comentarios desde Supabase
  const fetchComments = async () => {
    try {
      setLoadingComments(true)
      
      const { data: commentsData, error } = await supabase
        .from('reading_comments')
        .select('*')
        .eq('year', selectedYear)
        .eq('week_number', weekNumber)
      
      if (error) {
        console.error('❌ Error cargando comentarios:', error)
        return
      }
      
      // Convertir array a objeto para acceso rápido por pointId
      const commentsMap = {}
      commentsData?.forEach(comment => {
        commentsMap[comment.point_id] = {
          id: comment.id,
          comment: comment.comment,
          author: comment.author,
          created_at: comment.created_at,
          updated_at: comment.updated_at
        }
      })
      
      setComments(commentsMap)
      console.log('✅ Comentarios cargados:', commentsData?.length || 0)
    } catch (err) {
      console.error('❌ Error al cargar comentarios:', err)
    } finally {
      setLoadingComments(false)
    }
  }

  // Función para guardar o actualizar comentario
  const saveComment = async () => {
    if (!editingComment || !editingComment.comment.trim()) {
      alert('Por favor ingresa un comentario')
      return
    }

    try {
      setSavingComment(true)
      
      const commentData = {
        year: selectedYear,
        week_number: weekNumber,
        point_id: editingComment.pointId,
        comment: editingComment.comment.trim(),
        author: editingComment.author?.trim() || 'Anónimo'
      }

      // Usar upsert para insertar o actualizar
      const { data, error } = await supabase
        .from('reading_comments')
        .upsert(commentData, {
          onConflict: 'year,week_number,point_id'
        })
        .select()

      if (error) {
        console.error('❌ Error guardando comentario:', error)
        alert('Error al guardar el comentario: ' + error.message)
        return
      }

      console.log('✅ Comentario guardado:', data)
      
      // Actualizar estado local
      setComments(prev => ({
        ...prev,
        [editingComment.pointId]: {
          id: data[0]?.id,
          comment: editingComment.comment,
          author: editingComment.author || 'Anónimo',
          created_at: data[0]?.created_at,
          updated_at: data[0]?.updated_at
        }
      }))

      // Cerrar dialog
      setCommentDialogOpen(false)
      setEditingComment(null)
    } catch (err) {
      console.error('❌ Error al guardar comentario:', err)
      alert('Error al guardar el comentario')
    } finally {
      setSavingComment(false)
    }
  }

  // Función para abrir dialog de comentario
  const openCommentDialog = (pointId, pointName) => {
    const existingComment = comments[pointId]
    setEditingComment({
      pointId,
      pointName,
      comment: existingComment?.comment || '',
      author: existingComment?.author || ''
    })
    setCommentDialogOpen(true)
  }

  // Función para ordenar
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Función para obtener lectura de una semana específica
  const getReading = (item, week) => {
    if (!item.weeklyData || item.noRead) return 0
    const weekData = item.weeklyData.find(w => w.week === week)
    if (!weekData) return 0
    return typeof weekData.reading === 'number' ? weekData.reading : parseFloat(weekData.reading) || 0
  }
  
  // Función para obtener consumo directo de la tabla de consumo
  const getConsumption = (item, week) => {
    if (!item.weeklyData || item.noRead) return 0
    const weekData = item.weeklyData.find(w => w.week === week)
    if (!weekData) return 0
    // Si existe el campo consumption, usarlo; si no, calcular la diferencia
    if (weekData.consumption !== undefined && weekData.consumption !== null) {
      return typeof weekData.consumption === 'number' ? weekData.consumption : parseFloat(weekData.consumption) || 0
    }
    // Fallback: calcular consumo como diferencia entre lecturas
    const currentReading = getReading(item, week)
    const previousReading = getReading(item, week - 1)
    return Math.max(0, currentReading - previousReading)
  }
  
  // Función para calcular consumo entre dos semanas (lectura actual - lectura anterior)
  const calculateConsumption = (item, currentWeek, previousWeek) => {
    // Usar consumo directo si está disponible
    return getConsumption(item, currentWeek)
  }
  
  // Función para calcular cambio porcentual entre dos consumos
  const calculateChangePercent = (item, currentWeek, previousWeek) => {
    const currentConsumption = calculateConsumption(item, currentWeek, currentWeek - 1)
    const previousConsumption = calculateConsumption(item, previousWeek, previousWeek - 1)
    
    if (previousConsumption === 0) return 0
    
    return ((currentConsumption - previousConsumption) / previousConsumption * 100)
  }

  // Filtrar y ordenar datos
  const filteredAndSortedData = useMemo(() => {
    let filtered = data.filter(item => {
      // Filtro de búsqueda
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
      
      // Filtro de tipo
      const matchesType = filterType === 'all' || item.type === filterType
      
      return matchesSearch && matchesType
    })

    // Ordenar
    filtered.sort((a, b) => {
      let aValue, bValue

      if (sortField === 'name') {
        aValue = a.name
        bValue = b.name
      } else if (sortField === 'consumption') {
        aValue = calculateConsumption(a, weekNumber, weekNumber - 1)
        bValue = calculateConsumption(b, weekNumber, weekNumber - 1)
      } else if (sortField === 'type') {
        aValue = a.type || 'otro'
        bValue = b.type || 'otro'
      }

      if (typeof aValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      } else {
        return sortDirection === 'asc' 
          ? aValue - bValue
          : bValue - aValue
      }
    })

    return filtered
  }, [data, searchTerm, filterType, sortField, sortDirection, weekNumber])

  // Calcular totales
  const totals = useMemo(() => {
    const currentWeekTotal = filteredAndSortedData.reduce((sum, item) => {
      return sum + calculateConsumption(item, weekNumber, weekNumber - 1)
    }, 0)

    const previousWeekTotal = filteredAndSortedData.reduce((sum, item) => {
      return sum + calculateConsumption(item, weekNumber - 1, weekNumber - 2)
    }, 0)

    const change = previousWeekTotal > 0 
      ? ((currentWeekTotal - previousWeekTotal) / previousWeekTotal * 100).toFixed(1)
      : 0

    return { currentWeek: currentWeekTotal, previousWeek: previousWeekTotal, change }
  }, [filteredAndSortedData, weekNumber])

  // Exportar a CSV
  const exportToCSV = () => {
    const headers = ['Nombre', 'Tipo', 'Lectura Semana ' + (weekNumber - 1), 'Lectura Semana ' + weekNumber, 'Consumo (m³)', 'Cambio vs Anterior (%)', 'Notas']
    const rows = filteredAndSortedData.map(item => {
      const currentReading = getReading(item, weekNumber)
      const previousReading = getReading(item, weekNumber - 1)
      const consumption = calculateConsumption(item, weekNumber, weekNumber - 1)
      const changePercent = calculateChangePercent(item, weekNumber, weekNumber - 1)
      
      return [
        item.name,
        item.type || 'N/A',
        previousReading,
        currentReading,
        consumption,
        changePercent.toFixed(1),
        item.notes || (item.noRead ? 'NO TOMAR LECTURA' : '')
      ]
    })

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `consumo_${title.replace(/\s+/g, '_')}_semana_${weekNumber}.csv`
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

  // Icono de ordenamiento
  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpDownIcon className="h-4 w-4 ml-1 opacity-40" />
    return sortDirection === 'asc' 
      ? <ArrowUpIcon className="h-4 w-4 ml-1" />
      : <ArrowDownIcon className="h-4 w-4 ml-1" />
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {filteredAndSortedData.length} punto{filteredAndSortedData.length !== 1 ? 's' : ''} de medición
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <DownloadIcon className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex gap-3 mt-4">
          {/* Búsqueda */}
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-muted rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Filtro por tipo */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-muted rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Todos los tipos</option>
            {uniqueTypes.map(type => (
              <option key={type} value={type}>
                {type.replace(/_/g, ' ').charAt(0).toUpperCase() + type.replace(/_/g, ' ').slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-3 gap-4 mt-4 p-4 bg-muted/30 rounded-lg">
          <div>
            <p className="text-xs text-muted-foreground">Consumo Total Semana {weekNumber}</p>
            <p className="text-xl font-bold text-foreground">{formatMX(totals.currentWeek)} m³</p>
            <p className="text-xs text-muted-foreground mt-1">Suma de todos los puntos</p>
          </div>
          {showComparison && weekNumber > 1 && (
            <>
              <div>
                <p className="text-xs text-muted-foreground">Consumo Semana {weekNumber - 1}</p>
                <p className="text-xl font-bold text-muted-foreground">{formatMX(totals.currentWeek)} m³</p>
                <p className="text-xs text-muted-foreground mt-1">Semana anterior</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Variación</p>
                <p className={`text-xl font-bold ${parseFloat(totals.change) > 0 ? 'text-destructive' : 'text-green-500'}`}>
                  {parseFloat(totals.change) > 0 ? '+' : ''}{totals.change}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">vs semana anterior</p>
              </div>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Contenedor con scroll interno - altura máxima de 600px */}
        <div className="overflow-x-auto overflow-y-auto max-h-[600px] border rounded-lg">
          <table className="w-full">
            <thead className="sticky top-0 bg-background z-10 shadow-sm">
              <tr className="border-b border-muted">
                <th 
                  className="text-left p-3 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center font-semibold text-sm">
                    Nombre
                    <SortIcon field="name" />
                  </div>
                </th>
                <th className="text-left p-3 font-semibold text-sm">
                  <div className="flex items-center">
                    Comentario
                    {loadingComments && <Loader2Icon className="h-3 w-3 ml-2 animate-spin text-muted-foreground" />}
                  </div>
                </th>
                <th className="text-right p-3 font-semibold text-sm">
                  <div>Lectura Semana {weekNumber - 1}</div>
                  <div className="text-xs font-normal text-muted-foreground">(m³)</div>
                </th>
                <th className="text-right p-3 font-semibold text-sm">
                  <div>Lectura Semana {weekNumber}</div>
                  <div className="text-xs font-normal text-muted-foreground">(m³)</div>
                </th>
                <th 
                  className="text-right p-3 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => handleSort('consumption')}
                >
                  <div className="flex items-center justify-end font-semibold text-sm">
                    <div>
                      <div>Consumo</div>
                      <div className="text-xs font-normal text-muted-foreground">(m³)</div>
                    </div>
                    <SortIcon field="consumption" />
                  </div>
                </th>
                {showComparison && weekNumber > 1 && (
                  <th className="text-right p-3 font-semibold text-sm">
                    <div>Cambio</div>
                    <div className="text-xs font-normal text-muted-foreground">(%)</div>
                  </th>
                )}
                <th className="text-center p-3 font-semibold text-sm">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedData.map((item, index) => {
                const currentReading = getReading(item, weekNumber)
                const previousReading = getReading(item, weekNumber - 1)
                const consumption = calculateConsumption(item, weekNumber, weekNumber - 1)
                const changePercent = calculateChangePercent(item, weekNumber, weekNumber - 1)

                const rowClass = item.noRead 
                  ? 'bg-gray-100 dark:bg-gray-800/50'
                  : item.notes || item.importance === 'importante'
                  ? 'bg-yellow-50 dark:bg-yellow-900/10'
                  : index % 2 === 0 
                  ? 'bg-background'
                  : 'bg-muted/20'

                return (
                  <tr 
                    key={item.id} 
                    className={`border-b border-muted hover:bg-muted/40 transition-colors ${rowClass}`}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{item.name}</span>
                        {item.noRead && (
                          <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">
                            Sin lectura
                          </span>
                        )}
                        {item.importance === 'importante' && (
                          <AlertTriangleIcon className="h-4 w-4 text-amber-500" />
                        )}
                      </div>
                      {item.notes && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <InfoIcon className="h-3 w-3" />
                          {item.notes}
                        </p>
                      )}
                      {item.source === 'ciudad' && (
                        <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded mt-1 inline-block">
                          Agua ciudad
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {comments[item.id] ? (
                          <div className="flex-1">
                            <p className="text-xs text-foreground line-clamp-2">
                              {comments[item.id].comment}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              - {comments[item.id].author}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Sin comentario</span>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openCommentDialog(item.id, item.name)}
                          className="h-7 w-7 p-0 flex-shrink-0"
                          title={comments[item.id] ? 'Editar comentario' : 'Agregar comentario'}
                        >
                          {comments[item.id] ? (
                            <EditIcon className="h-3.5 w-3.5" />
                          ) : (
                            <MessageSquarePlusIcon className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </td>
                    <td className="p-3 text-right text-sm text-muted-foreground">
                      {formatMX(previousReading)}
                    </td>
                    <td className="p-3 text-right text-sm font-medium">
                      {formatMX(currentReading)}
                    </td>
                    <td className="p-3 text-right">
                      <span className={`text-sm font-bold ${
                        consumption === 0 ? 'text-muted-foreground' : 
                        consumption > 1000 ? 'text-red-600' :
                        'text-primary'
                      }`}>
                        {formatMX(consumption)}
                      </span>
                    </td>
                    {showComparison && weekNumber > 1 && (
                      <td className="p-3 text-right">
                        {consumption === 0 ? (
                          <span className="text-sm text-muted-foreground">-</span>
                        ) : (
                          <span className={`text-sm font-medium px-2 py-1 rounded ${
                            changePercent > 0 ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' : 
                            changePercent < 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 
                            'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                          }`}>
                            {changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%
                          </span>
                        )}
                      </td>
                    )}
                    <td className="p-3 text-center">
                      {item.noRead ? (
                        <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">
                          No medible
                        </span>
                      ) : consumption === 0 ? (
                        <span className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded">
                          Sin consumo
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                          Normal
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {filteredAndSortedData.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No se encontraron puntos de medición</p>
            </div>
          )}
        </div>
      </CardContent>

      {/* Dialog para agregar/editar comentarios */}
      <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
        <DialogContent className="sm:max-w-[550px]  mx-20 space-y-4 pt-5 ">
          <DialogHeader className="border-b-0 pb-2 ">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                {comments[editingComment?.pointId] ? (
                  <EditIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                ) : (
                  <MessageSquarePlusIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <div>
                <DialogTitle className="text-xl">
                  {comments[editingComment?.pointId] ? 'Editar Comentario' : 'Agregar Comentario'}
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Documenta observaciones sobre esta lectura
                </p>
              </div>
            </div>
          </DialogHeader>
          
          {editingComment && (
            <div className="space-y-5 py-2 px-6s pb-6">
              {/* Información del punto - Mejorada */}
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-4 border border-blue-200 dark:border-blue-800">
                <div className="relative z-10">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                        {editingComment.pointName}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-blue-700 dark:text-blue-300">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="h-3.5 w-3.5" />
                          Año {selectedYear}
                        </span>
                        <span className="text-blue-400">•</span>
                        <span className="flex items-center gap-1">
                          <BarChart3Icon className="h-3.5 w-3.5" />
                          Semana {weekNumber}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Decoración de fondo */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/20 dark:bg-blue-700/10 rounded-full -mr-16 -mt-16"></div>
              </div>

              {/* Campo de autor - Mejorado */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <InfoIcon className="h-4 w-4 text-muted-foreground" />
                  Autor
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={editingComment.author}
                    onChange={(e) => setEditingComment({
                      ...editingComment,
                      author: e.target.value
                    })}
                    placeholder="Ingresa tu nombre"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-background hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <p className="text-xs text-muted-foreground pl-1">
                  Opcional - Se mostrará como "Anónimo" si se deja vacío
                </p>
              </div>

              {/* Campo de comentario - Mejorado */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <MessageSquarePlusIcon className="h-4 w-4 text-muted-foreground" />
                  Comentario
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <textarea
                    value={editingComment.comment}
                    onChange={(e) => setEditingComment({
                      ...editingComment,
                      comment: e.target.value
                    })}
                    placeholder="Ejemplo: Lectura verificada, consumo normal para esta época del año..."
                    rows={5}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-background hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  />
                  <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                      editingComment.comment.length === 0 
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-500' 
                        : editingComment.comment.length < 10
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                        : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    }`}>
                      {editingComment.comment.length} caracteres
                    </span>
                  </div>
                </div>
              </div>

              {/* Botones - Mejorados */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCommentDialogOpen(false)
                    setEditingComment(null)
                  }}
                  disabled={savingComment}
                  className="px-6"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={saveComment}
                  disabled={savingComment || !editingComment.comment.trim()}
                  className="px-6 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {savingComment ? (
                    <>
                      <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <MessageSquarePlusIcon className="h-4 w-4 mr-2" />
                      Guardar Comentario
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}

