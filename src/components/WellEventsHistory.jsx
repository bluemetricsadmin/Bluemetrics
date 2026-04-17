import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Card, CardHeader, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { updateAlertStatus } from '../utils/wellAlertSync'
import {
  CalendarIcon,
  PlusIcon,
  Trash2Icon,
  EditIcon,
  Loader2Icon,
  AlertTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  WrenchIcon,
  ZapIcon
} from 'lucide-react'

export default function WellEventsHistory({ wellId }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    event_type: 'mantenimiento',
    event_status: 'activo',
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    author_name: 'Usuario'
  })

  // Tipos de eventos disponibles
  const eventTypes = [
    { value: 'mantenimiento', label: 'Mantenimiento', color: 'yellow' },
    { value: 'parado', label: 'Parado', color: 'red' },
    { value: 'reparacion', label: 'Reparación', color: 'orange' },
    { value: 'inspeccion', label: 'Inspección', color: 'blue' },
    { value: 'otro', label: 'Otro', color: 'gray' },
    { value: 'alerta_consumo', label: 'Alerta de Consumo', color: 'red' },
    { value: 'sobreconsumo', label: 'Sobreconsumo', color: 'purple' }
  ]

  const eventStatuses = [
    { value: 'activo', label: 'Activo', icon: ClockIcon, color: 'blue' },
    { value: 'completado', label: 'Completado', icon: CheckCircleIcon, color: 'green' },
    { value: 'cancelado', label: 'Cancelado', icon: XCircleIcon, color: 'red' }
  ]

  // Cargar eventos al montar el componente
  useEffect(() => {
    fetchEvents()
  }, [wellId])

  // Suscripción Realtime: auto-refresh cuando cambian eventos de este pozo
  useEffect(() => {
    const channel = supabase
      .channel(`well-events-${wellId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'well_events',
          filter: `well_id=eq.${wellId}`
        },
        (payload) => {
          console.log(`🔔 Realtime well_events (pozo ${wellId}):`, payload.eventType)

          if (payload.eventType === 'INSERT') {
            setEvents(prev => [payload.new, ...prev])
          }

          if (payload.eventType === 'UPDATE') {
            setEvents(prev => prev.map(e => e.id === payload.new.id ? payload.new : e))
          }

          if (payload.eventType === 'DELETE') {
            setEvents(prev => prev.filter(e => e.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [wellId])

  // Función para cargar eventos desde Supabase
  const fetchEvents = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('well_events')
        .select('*')
        .eq('well_id', wellId)
        .order('start_date', { ascending: false })

      if (fetchError) throw fetchError

      setEvents(data || [])
    } catch (err) {
      console.error('Error cargando eventos:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Función para agregar un nuevo evento
  const handleAddEvent = async () => {
    if (!formData.title.trim() || !formData.start_date) {
      alert('Por favor completa el título y la fecha de inicio')
      return
    }

    try {
      setLoading(true)
      const { data, error: insertError } = await supabase
        .from('well_events')
        .insert([
          {
            well_id: wellId,
            event_type: formData.event_type,
            event_status: formData.event_status,
            title: formData.title,
            description: formData.description || null,
            start_date: formData.start_date,
            end_date: formData.end_date || null,
            author_name: formData.author_name || 'Usuario'
          }
        ])
        .select()

      if (insertError) throw insertError

      // Actualizar lista de eventos
      await fetchEvents()

      // Resetear formulario
      resetForm()
      setIsModalOpen(false)
    } catch (err) {
      console.error('Error agregando evento:', err)
      alert('Error al agregar evento: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Función para actualizar un evento
  const handleUpdateEvent = async (id) => {
    if (!formData.title.trim() || !formData.start_date) {
      alert('Por favor completa el título y la fecha de inicio')
      return
    }

    try {
      setLoading(true)
      const { error: updateError } = await supabase
        .from('well_events')
        .update({
          event_type: formData.event_type,
          event_status: formData.event_status,
          title: formData.title,
          description: formData.description || null,
          start_date: formData.start_date,
          end_date: formData.end_date || null,
          author_name: formData.author_name || 'Usuario'
        })
        .eq('id', id)

      if (updateError) throw updateError

      // Actualizar lista de eventos
      await fetchEvents()

      // Resetear formulario
      resetForm()
      setEditingId(null)
      setIsModalOpen(false)
    } catch (err) {
      console.error('Error actualizando evento:', err)
      alert('Error al actualizar evento: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Función para eliminar un evento
  const handleDeleteEvent = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este evento?')) return

    try {
      setLoading(true)
      const { error: deleteError } = await supabase
        .from('well_events')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      // Actualizar lista de eventos
      await fetchEvents()
    } catch (err) {
      console.error('Error eliminando evento:', err)
      alert('Error al eliminar evento: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Función para iniciar edición
  const startEdit = (event) => {
    setEditingId(event.id)
    setFormData({
      event_type: event.event_type,
      event_status: event.event_status,
      title: event.title,
      description: event.description || '',
      start_date: event.start_date ? new Date(event.start_date).toISOString().slice(0, 16) : '',
      end_date: event.end_date ? new Date(event.end_date).toISOString().slice(0, 16) : '',
      author_name: event.author_name
    })
    setIsModalOpen(true)
  }

  // Función para resetear formulario
  const resetForm = () => {
    setFormData({
      event_type: 'mantenimiento',
      event_status: 'activo',
      title: '',
      description: '',
      start_date: '',
      end_date: '',
      author_name: 'Usuario'
    })
  }

  // Función para cancelar edición/adición
  const cancelEdit = () => {
    setEditingId(null)
    setIsModalOpen(false)
    resetForm()
  }

  // Función para cambiar estado rápido de alertas automáticas
  const handleQuickStatus = async (eventId, newStatus) => {
    try {
      setLoading(true)
      const success = await updateAlertStatus(eventId, newStatus)
      if (success) {
        await fetchEvents()
      } else {
        alert('Error al actualizar el estado de la alerta')
      }
    } catch (err) {
      console.error('Error en cambio rápido de estado:', err)
      alert('Error al actualizar: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Función para obtener el color del tipo de evento
  const getEventTypeColor = (type) => {
    const eventType = eventTypes.find(t => t.value === type)
    return eventType ? eventType.color : 'gray'
  }

  // Función para calcular duración del evento
  const calculateDuration = (startDate, endDate) => {
    if (!endDate) return 'En curso'
    const start = new Date(startDate)
    const end = new Date(endDate)
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
    return `${days} día${days !== 1 ? 's' : ''}`
  }

  return (
    <>
      <Card className="w-full max-w-10xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-orange-600" />
              Historial de Eventos
            </h2>
            <Button
              size="sm"
              onClick={() => {
                setEditingId(null)
                resetForm()
                setIsModalOpen(true)
              }}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Crear Evento
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Lista de eventos */}
          {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2Icon className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-2 text-sm text-gray-500">Cargando eventos...</span>
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangleIcon className="h-5 w-5 text-red-500" />
            <span className="text-sm text-red-600">Error: {error}</span>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-8">
            <WrenchIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No hay eventos registrados</p>
            <p className="text-xs text-gray-400 mt-1">El pozo ha estado operando normalmente</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {events.map((event) => {
              const typeColor = getEventTypeColor(event.event_type)
              const statusInfo = eventStatuses.find(s => s.value === event.event_status)
              const StatusIcon = statusInfo?.icon || ClockIcon

              return (
                <div
                  key={event.id}
                  className={`p-4 rounded-lg border-l-4 ${
                    typeColor === 'purple' ? 'bg-purple-50 border-purple-400' :
                    typeColor === 'red' ? 'bg-red-50 border-red-400' :
                    typeColor === 'yellow' ? 'bg-yellow-50 border-yellow-400' :
                    typeColor === 'orange' ? 'bg-orange-50 border-orange-400' :
                    typeColor === 'blue' ? 'bg-blue-50 border-blue-400' :
                    'bg-gray-50 border-gray-400'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3 gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={`${
                        typeColor === 'purple' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                        typeColor === 'red' ? 'bg-red-100 text-red-800 border-red-200' :
                        typeColor === 'yellow' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                        typeColor === 'orange' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                        typeColor === 'blue' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                        'bg-gray-100 text-gray-800 border-gray-200'
                      }`}>
                        {eventTypes.find(t => t.value === event.event_type)?.label}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusInfo?.label}
                      </Badge>
                      {event.is_automatic && (
                        <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 text-xs">
                          <ZapIcon className="h-3 w-3 mr-1" />
                          Auto
                        </Badge>
                      )}
                      {event.severity && (
                        <Badge className={`text-xs ${
                          event.severity === 'critica'
                            ? 'bg-red-100 text-red-800 border-red-200'
                            : 'bg-amber-100 text-amber-800 border-amber-200'
                        }`}>
                            {event.severity === 'critica' ? 'Critica' : 'Preventiva'}
                        </Badge>
                      )}
                    </div>
                      <div className="flex gap-2 items-center shrink-0">
                      {/* Botones rápidos para alertas automáticas activas */}
                      {event.is_automatic && event.event_status === 'activo' ? (
                        <>
                          <Button
                            size="sm"
                              variant="outline"
                            onClick={() => handleQuickStatus(event.id, 'completado')}
                              className="h-8 px-3 border-green-300 bg-green-100 text-green-900 hover:bg-green-200 text-xs font-medium"
                            title="Marcar como atendida"
                            disabled={loading}
                          >
                            <CheckCircleIcon className="h-3 w-3 mr-1" />
                            Atendida
                          </Button>
                          <Button
                            size="sm"
                              variant="outline"
                            onClick={() => handleQuickStatus(event.id, 'cancelado')}
                              className="h-8 px-3 border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200 text-xs font-medium"
                            title="Descartar alerta"
                            disabled={loading}
                          >
                            <XCircleIcon className="h-3 w-3 mr-1" />
                            Descartar
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                              variant="outline"
                            onClick={() => startEdit(event)}
                              className="h-8 px-3 border-blue-300 bg-blue-100 text-blue-900 hover:bg-blue-200 text-xs font-medium"
                            title="Editar"
                          >
                              <EditIcon className="h-3 w-3 mr-1" />
                              Editar
                          </Button>
                          {!event.is_automatic && (
                            <Button
                              size="sm"
                                variant="outline"
                              onClick={() => handleDeleteEvent(event.id)}
                                className="h-8 px-3 border-red-300 bg-red-100 text-red-900 hover:bg-red-200 text-xs font-medium"
                              title="Eliminar"
                            >
                                <Trash2Icon className="h-3 w-3 mr-1" />
                                Eliminar
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                    {event.title}
                  </h4>

                  {/* Recomendación destacada para alertas automáticas */}
                  {event.is_automatic && event.recommendation && (
                    <div className={`p-2 rounded text-xs mb-2 ${
                      event.severity === 'critica'
                        ? 'bg-red-100 border border-red-200 text-red-800'
                        : 'bg-amber-100 border border-amber-200 text-amber-800'
                    }`}>
                      <strong>Recomendación:</strong> {event.recommendation}
                    </div>
                  )}

                  {event.description && (
                    <p className="text-sm text-gray-700 mb-2 whitespace-pre-wrap">
                      {event.description}
                    </p>
                  )}

                  {/* Métricas para alertas automáticas */}
                  {event.is_automatic && event.metric_value != null && (
                    <div className="flex gap-3 text-xs text-gray-600 mb-2">
                      <span><strong>Valor detectado:</strong> {event.metric_value}%</span>
                      <span><strong>Umbral:</strong> {event.threshold_value}%</span>
                    </div>
                  )}

                  <div className="space-y-1 text-xs text-gray-600">
                    <p>
                      <strong>Inicio:</strong>{' '}
                      {new Date(event.start_date).toLocaleDateString('es-MX', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}Comentarios
                    </p>
                    {event.end_date && (
                      <p>
                        <strong>Fin:</strong>{' '}
                        {new Date(event.end_date).toLocaleDateString('es-MX', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    )}
                    <p>
                      <strong>Duración:</strong> {calculateDuration(event.start_date, event.end_date)}
                    </p>
                    <p className="text-gray-500">
                      Registrado por: {event.author_name}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        </CardContent>
      </Card>

      {/* Modal para agregar/editar evento */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Editar Evento' : 'Nuevo Evento'}
            </DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Evento *
                  </label>
                  <select
                    value={formData.event_type}
                    onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {eventTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado *
                  </label>
                  <select
                    value={formData.event_status}
                    onChange={(e) => setFormData({ ...formData, event_status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {eventStatuses.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Ej: Mantenimiento preventivo de bomba"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows="3"
                  placeholder="Detalles adicionales del evento..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Inicio *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Fin
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Registrado por
                </label>
                <input
                  type="text"
                  value={formData.author_name}
                  onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Nombre"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={cancelEdit}
                  disabled={loading}
                >
                  <XCircleIcon className="h-4 w-4 mr-1" />
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={() => editingId ? handleUpdateEvent(editingId) : handleAddEvent()}
                  disabled={loading}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {loading ? (
                    <Loader2Icon className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                  )}
                  {editingId ? 'Actualizar' : 'Guardar'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
