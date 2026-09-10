import { formatMX } from '../utils/formatMX'
import React, { useState } from 'react'
import { useNavigate } from 'react-router'
import { Card, CardContent, CardHeader } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { DashboardSidebar } from '../components/dashboard-sidebar'
import {
  ArrowLeftIcon,
  SaveIcon,
  PlusIcon,
  CalendarIcon,
  DropletIcon,
  AlertTriangleIcon,
  CheckCircleIcon
} from 'lucide-react'

export default function AddDataPage() {
  const navigate = useNavigate()
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    wellId: '12', // Por defecto Pozo 12
    dataType: 'monthly', // 'yearly', 'quarterly', 'monthly'
    period: '',
    year: new Date().getFullYear(),
    quarter: 'Q1',
    month: new Date().getMonth() + 1,
    // Campos para rangos de fechas
    fromYear: new Date().getFullYear(),
    toYear: new Date().getFullYear(),
    fromQuarter: 'Q1',
    toQuarter: 'Q1',
    fromMonth: new Date().getMonth() + 1,
    toMonth: new Date().getMonth() + 1,
    useRange: false, // Para alternar entre período único y rango
    m3PorAnexo: '',
    m3CedidosPorAnexo: '',
    m3PorTitulo: '',
    m3CedidosPorTitulo: '',
    observations: ''
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // Opciones para los selectores
  const wells = [
    { id: '12', name: 'Pozo 12', location: 'Calle Navio 358' },
    { id: '11', name: 'Pozo 11', location: 'Zona Industrial' },
    { id: '7', name: 'Pozo 7', location: 'Sector Norte' }
  ]

  const quarters = [
    { value: 'Q1', label: 'Q1 - Primer Trimestre' },
    { value: 'Q2', label: 'Q2 - Segundo Trimestre' },
    { value: 'Q3', label: 'Q3 - Tercer Trimestre' },
    { value: 'Q4', label: 'Q4 - Cuarto Trimestre' }
  ]

  const months = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' }
  ]

  // Función para generar el período automáticamente
  const generatePeriod = () => {
    if (formData.useRange) {
      // Generar rango de períodos
      switch (formData.dataType) {
        case 'yearly':
          if (formData.fromYear === formData.toYear) {
            return formData.fromYear.toString()
          }
          return `${formData.fromYear} - ${formData.toYear}`
        case 'quarterly':
          if (formData.fromYear === formData.toYear && formData.fromQuarter === formData.toQuarter) {
            return `${formData.fromQuarter} ${formData.fromYear}`
          }
          return `${formData.fromQuarter} ${formData.fromYear} - ${formData.toQuarter} ${formData.toYear}`
        case 'monthly':
          const fromMonthName = months.find(m => m.value === parseInt(formData.fromMonth))?.label
          const toMonthName = months.find(m => m.value === parseInt(formData.toMonth))?.label
          if (formData.fromYear === formData.toYear && formData.fromMonth === formData.toMonth) {
            return `${fromMonthName} ${formData.fromYear}`
          }
          if (formData.fromYear === formData.toYear) {
            return `${fromMonthName} - ${toMonthName} ${formData.fromYear}`
          }
          return `${fromMonthName} ${formData.fromYear} - ${toMonthName} ${formData.toYear}`
        default:
          return ''
      }
    } else {
      // Período único (funcionalidad original)
      switch (formData.dataType) {
        case 'yearly':
          return formData.year.toString()
        case 'quarterly':
          return `${formData.quarter} ${formData.year}`
        case 'monthly':
          const monthName = months.find(m => m.value === parseInt(formData.month))?.label
          return `${monthName} ${formData.year}`
        default:
          return ''
      }
    }
  }

  // Manejar cambios en inputs
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Limpiar errores al modificar
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }))
    }
  }

  // Validar formulario
  const validateForm = () => {
    const newErrors = {}

    if (!formData.wellId) newErrors.wellId = 'Selecciona un pozo'
    if (!formData.dataType) newErrors.dataType = 'Selecciona el tipo de datos'
    if (!formData.year || formData.year < 2000 || formData.year > 2030) {
      newErrors.year = 'Año debe estar entre 2000 y 2030'
    }
    
    // Validar campos numéricos
    const numericFields = ['m3PorAnexo', 'm3CedidosPorAnexo', 'm3PorTitulo', 'm3CedidosPorTitulo']
    numericFields.forEach(field => {
      const value = parseFloat(formData[field])
      if (!formData[field] || isNaN(value) || value < 0) {
        newErrors[field] = 'Debe ser un número válido mayor o igual a 0'
      }
    })

    // Validar que m3CedidosPorAnexo no sea mayor que m3PorAnexo
    if (parseFloat(formData.m3CedidosPorAnexo) > parseFloat(formData.m3PorAnexo)) {
      newErrors.m3CedidosPorAnexo = 'Los m³ cedidos no pueden ser mayores que los m³ por anexo'
    }

    if (!formData.observations.trim()) {
      newErrors.observations = 'Las observaciones son requeridas'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    
    try {
      // Simular envío de datos (aquí se conectaría a la API)
      const dataToSubmit = {
        ...formData,
        period: generatePeriod(),
        m3PorAnexo: parseFloat(formData.m3PorAnexo),
        m3CedidosPorAnexo: parseFloat(formData.m3CedidosPorAnexo),
        m3PorTitulo: parseFloat(formData.m3PorTitulo),
        m3CedidosPorTitulo: parseFloat(formData.m3CedidosPorTitulo),
        disponibleParaConsumo: parseFloat(formData.m3PorAnexo) - parseFloat(formData.m3CedidosPorAnexo),
        createdAt: new Date().toISOString()
      }
      
      console.log('Datos a enviar:', dataToSubmit)
      
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      setSubmitSuccess(true)
      
      // Resetear formulario después de éxito
      setTimeout(() => {
        setSubmitSuccess(false)
        navigate(`/pozos/${formData.wellId}`)
      }, 2000)
      
    } catch (error) {
      console.error('Error al enviar datos:', error)
      setErrors({ submit: 'Error al guardar los datos. Intenta nuevamente.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar fijo */}
      <DashboardSidebar />
      
      {/* Contenido principal */}
      <div className="ml-64 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <PlusIcon className="h-6 w-6 text-primary" />
                Agregar Nuevos Datos
              </h1>
              <p className="text-muted-foreground">Ingresa nuevos datos de consumo para los pozos</p>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <div className="max-w-4xl">
          <Card>
            <CardHeader className="bg-primary text-primary-foreground">
              <div className="flex items-center gap-2">
                <DropletIcon className="h-5 w-5" />
                <span className="font-semibold">Formulario de Ingreso de Datos</span>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {submitSuccess && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-green-800 font-medium">¡Datos guardados exitosamente!</p>
                    <p className="text-green-600 text-sm">Redirigiendo al detalle del pozo...</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Selección de Pozo y Tipo de Datos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Pozo *
                    </label>
                    <select
                      value={formData.wellId}
                      onChange={(e) => handleInputChange('wellId', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      disabled={isSubmitting}
                    >
                      {wells.map(well => (
                        <option key={well.id} value={well.id}>
                          {well.name} - {well.location}
                        </option>
                      ))}
                    </select>
                    {errors.wellId && <p className="text-red-500 text-sm mt-1">{errors.wellId}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Tipo de Datos *
                    </label>
                    <select
                      value={formData.dataType}
                      onChange={(e) => handleInputChange('dataType', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      disabled={isSubmitting}
                    >
                      <option value="yearly">Datos Anuales</option>
                      <option value="quarterly">Datos Trimestrales</option>
                      <option value="monthly">Datos Mensuales</option>
                    </select>
                    {errors.dataType && <p className="text-red-500 text-sm mt-1">{errors.dataType}</p>}
                  </div>
                </div>

                {/* Selección de Período */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      Período de los Datos
                    </h3>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="useRange"
                        checked={formData.useRange}
                        onChange={(e) => handleInputChange('useRange', e.target.checked)}
                        className="w-4 h-4 text-primary bg-white border-gray-300 rounded focus:ring-primary"
                        disabled={isSubmitting}
                      />
                      <label htmlFor="useRange" className="text-sm text-foreground">
                        Usar rango de fechas
                      </label>
                    </div>
                  </div>
                  {!formData.useRange ? (
                    // Período único (funcionalidad original)
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Año *
                        </label>
                        <input
                          type="number"
                          min="2000"
                          max="2030"
                          value={formData.year}
                          onChange={(e) => handleInputChange('year', parseInt(e.target.value))}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          disabled={isSubmitting}
                        />
                        {errors.year && <p className="text-red-500 text-sm mt-1">{errors.year}</p>}
                      </div>

                      {formData.dataType === 'quarterly' && (
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Trimestre *
                          </label>
                          <select
                            value={formData.quarter}
                            onChange={(e) => handleInputChange('quarter', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            disabled={isSubmitting}
                          >
                            {quarters.map(quarter => (
                              <option key={quarter.value} value={quarter.value}>
                                {quarter.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {formData.dataType === 'monthly' && (
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Mes *
                          </label>
                          <select
                            value={formData.month}
                            onChange={(e) => handleInputChange('month', parseInt(e.target.value))}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            disabled={isSubmitting}
                          >
                            {months.map(month => (
                              <option key={month.value} value={month.value}>
                                {month.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Período Generado
                        </label>
                        <div className="p-3 bg-white border border-gray-300 rounded-lg text-primary font-medium">
                          {generatePeriod() || 'Selecciona los datos arriba'}
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Rango de períodos
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* DESDE */}
                        <div className="border-l-4 border-green-500 pl-4">
                          <h4 className="text-sm font-medium text-green-700 mb-3">DESDE</h4>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-2">
                                Año *
                              </label>
                              <input
                                type="number"
                                min="2000"
                                max="2030"
                                value={formData.fromYear}
                                onChange={(e) => handleInputChange('fromYear', parseInt(e.target.value))}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                disabled={isSubmitting}
                              />
                            </div>

                            {formData.dataType === 'quarterly' && (
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                  Trimestre *
                                </label>
                                <select
                                  value={formData.fromQuarter}
                                  onChange={(e) => handleInputChange('fromQuarter', e.target.value)}
                                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                  disabled={isSubmitting}
                                >
                                  {quarters.map(quarter => (
                                    <option key={quarter.value} value={quarter.value}>
                                      {quarter.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}

                            {formData.dataType === 'monthly' && (
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                  Mes *
                                </label>
                                <select
                                  value={formData.fromMonth}
                                  onChange={(e) => handleInputChange('fromMonth', parseInt(e.target.value))}
                                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                  disabled={isSubmitting}
                                >
                                  {months.map(month => (
                                    <option key={month.value} value={month.value}>
                                      {month.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* HASTA */}
                        <div className="border-l-4 border-red-500 pl-4">
                          <h4 className="text-sm font-medium text-red-700 mb-3">HASTA</h4>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-2">
                                Año *
                              </label>
                              <input
                                type="number"
                                min="2000"
                                max="2030"
                                value={formData.toYear}
                                onChange={(e) => handleInputChange('toYear', parseInt(e.target.value))}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                disabled={isSubmitting}
                              />
                            </div>

                            {formData.dataType === 'quarterly' && (
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                  Trimestre *
                                </label>
                                <select
                                  value={formData.toQuarter}
                                  onChange={(e) => handleInputChange('toQuarter', e.target.value)}
                                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                  disabled={isSubmitting}
                                >
                                  {quarters.map(quarter => (
                                    <option key={quarter.value} value={quarter.value}>
                                      {quarter.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}

                            {formData.dataType === 'monthly' && (
                              <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                  Mes *
                                </label>
                                <select
                                  value={formData.toMonth}
                                  onChange={(e) => handleInputChange('toMonth', parseInt(e.target.value))}
                                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                  disabled={isSubmitting}
                                >
                                  {months.map(month => (
                                    <option key={month.value} value={month.value}>
                                      {month.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Período generado para rango */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Período Generado
                        </label>
                        <div className="p-3 bg-white border border-gray-300 rounded-lg text-primary font-medium text-center">
                          {generatePeriod() || 'Selecciona las fechas de rango arriba'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Datos de Consumo */}
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-4">Datos de Consumo (m³)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        m³ por Anexo *
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        value={formData.m3PorAnexo}
                        onChange={(e) => handleInputChange('m3PorAnexo', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="0.000"
                        disabled={isSubmitting}
                      />
                      {errors.m3PorAnexo && <p className="text-red-500 text-sm mt-1">{errors.m3PorAnexo}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        m³ Cedidos por Anexo *
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        value={formData.m3CedidosPorAnexo}
                        onChange={(e) => handleInputChange('m3CedidosPorAnexo', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="0.000"
                        disabled={isSubmitting}
                      />
                      {errors.m3CedidosPorAnexo && <p className="text-red-500 text-sm mt-1">{errors.m3CedidosPorAnexo}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                      Consumo Real *
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        value={formData.m3PorTitulo}
                        onChange={(e) => handleInputChange('m3PorTitulo', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="0.000"
                        disabled={isSubmitting}
                      />
                      {errors.m3PorTitulo && <p className="text-red-500 text-sm mt-1">{errors.m3PorTitulo}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Disponible para Consumo
                      </label>
                      <div className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-700">
                        {formData.m3PorAnexo && formData.m3CedidosPorAnexo ? (
                          <div className="flex items-center justify-between">
                            <span className="font-medium">
                              {formatMX(parseFloat(formData.m3PorAnexo) - parseFloat(formData.m3CedidosPorAnexo))} m³
                            </span>
                            <span className="text-sm text-gray-500">
                              {formatMX(parseFloat(formData.m3PorAnexo))} - {formatMX(parseFloat(formData.m3CedidosPorAnexo))}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">0.00 m³</span>
                        )}
                      </div>
                    </div>
                  
                  </div>
                </div>

                {/* Observaciones */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Observaciones *
                  </label>
                  <textarea
                    rows={4}
                    value={formData.observations}
                    onChange={(e) => handleInputChange('observations', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Describe cualquier detalle relevante sobre estos datos..."
                    disabled={isSubmitting}
                  />
                  {errors.observations && <p className="text-red-500 text-sm mt-1">{errors.observations}</p>}
                </div>

                {/* Error general */}
                {errors.submit && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                    <AlertTriangleIcon className="h-5 w-5 text-red-600" />
                    <p className="text-red-800">{errors.submit}</p>
                  </div>
                )}

                {/* Botones */}
                <div className="flex items-center gap-4 pt-6 border-t">
                  <Button
                    type="submit"
                    disabled={isSubmitting || submitSuccess}
                    className="flex items-center gap-2"
                  >
                    <SaveIcon className="h-4 w-4" />
                    {isSubmitting ? 'Guardando...' : 'Guardar Datos'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(-1)}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
