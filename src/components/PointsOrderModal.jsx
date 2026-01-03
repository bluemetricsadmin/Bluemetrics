import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { Button } from './ui/button'
import { 
  GripVertical, 
  Check, 
  X, 
  RotateCcw,
  ChevronDown,
  ChevronRight,
  ListOrdered,
  EyeOff
} from 'lucide-react'

// Constantes
const STORAGE_KEY = 'aquanet_points_order'
const DISABLED_CATEGORY_ID = 'deshabilitados'
const DISABLED_CATEGORY = {
  id: DISABLED_CATEGORY_ID,
  name: 'Deshabilitados',
  description: 'Puntos que no se mostrarán ni se guardarán',
  points: []
}

// Función para obtener el orden guardado
export const getSavedOrder = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

// Función para obtener puntos deshabilitados
export const getDisabledPoints = () => {
  const savedOrder = getSavedOrder()
  if (!savedOrder || !savedOrder[DISABLED_CATEGORY_ID]) return []
  return savedOrder[DISABLED_CATEGORY_ID]
}

// Función para aplicar el orden guardado a las categorías
export const applyOrderToCategories = (categories) => {
  const savedOrder = getSavedOrder()
  if (!savedOrder) return categories

  const disabledPointIds = savedOrder[DISABLED_CATEGORY_ID] || []

  return categories.map(category => {
    const categoryOrder = savedOrder[category.id]
    if (!categoryOrder) {
      // Filtrar puntos deshabilitados
      return {
        ...category,
        points: category.points.filter(p => !disabledPointIds.includes(p.id))
      }
    }

    // Ordenar los puntos según el orden guardado y filtrar deshabilitados
    const orderedPoints = [...category.points]
      .filter(p => !disabledPointIds.includes(p.id))
      .sort((a, b) => {
        const orderA = categoryOrder.indexOf(a.id)
        const orderB = categoryOrder.indexOf(b.id)
        // Si no está en el orden guardado, ponerlo al final
        if (orderA === -1) return 1
        if (orderB === -1) return -1
        return orderA - orderB
      })

    return { ...category, points: orderedPoints }
  })
}

export default function PointsOrderModal({ open, onClose, categories, onOrderSaved }) {
  const [orderedCategories, setOrderedCategories] = useState([])
  const [expandedCategories, setExpandedCategories] = useState({})
  const [draggedItem, setDraggedItem] = useState(null)
  const [dragOverItem, setDragOverItem] = useState(null)
  const [hasChanges, setHasChanges] = useState(false)
  const dragNode = useRef(null)

  // Inicializar con las categorías y aplicar orden guardado
  useEffect(() => {
    if (open && categories) {
      const savedOrder = getSavedOrder()
      
      if (!savedOrder) {
        // No hay orden guardado, usar categorías originales + categoría vacía de deshabilitados
        const disabledCategory = { ...DISABLED_CATEGORY, points: [] }
        setOrderedCategories([...categories, disabledCategory])
      } else {
        // Reconstruir categorías desde localStorage
        // Primero, crear un mapa de todos los puntos por ID
        const allPointsById = {}
        categories.forEach(cat => {
          cat.points.forEach(point => {
            allPointsById[point.id] = point
          })
        })
        
        // Reconstruir cada categoría basándose en el orden guardado
        const reconstructedCategories = []
        
        // Incluir categoría de deshabilitados en la reconstrucción
        const allCategoryIds = [...categories.map(c => c.id), DISABLED_CATEGORY_ID]
        
        allCategoryIds.forEach(categoryId => {
          const savedPointIds = savedOrder[categoryId] || []
          
          // Encontrar la definición de la categoría original
          let categoryDef = categories.find(c => c.id === categoryId)
          if (!categoryDef && categoryId === DISABLED_CATEGORY_ID) {
            categoryDef = DISABLED_CATEGORY
          }
          
          if (categoryDef) {
            // Reconstruir los puntos en el orden guardado
            const orderedPoints = savedPointIds
              .map(pointId => allPointsById[pointId])
              .filter(point => point !== undefined)
            
            reconstructedCategories.push({
              ...categoryDef,
              points: orderedPoints
            })
          }
        })
        
        setOrderedCategories(reconstructedCategories)
      }
      
      // Expandir todas las categorías por defecto
      const expanded = {}
      categories.forEach(cat => {
        expanded[cat.id] = true
      })
      expanded[DISABLED_CATEGORY_ID] = true
      setExpandedCategories(expanded)
      setHasChanges(false)
    }
  }, [open, categories])

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }))
  }

  // Drag handlers
  const handleDragStart = (e, categoryId, pointIndex) => {
    dragNode.current = e.target
    dragNode.current.addEventListener('dragend', handleDragEnd)
    
    setDraggedItem({ categoryId, pointIndex })
    
    setTimeout(() => {
      e.target.style.opacity = '0.5'
    }, 0)
  }

  const handleDragEnd = () => {
    if (dragNode.current) {
      dragNode.current.style.opacity = '1'
      dragNode.current.removeEventListener('dragend', handleDragEnd)
    }
    setDraggedItem(null)
    setDragOverItem(null)
    dragNode.current = null
  }

  const handleDragEnter = (e, categoryId, pointIndex) => {
    e.preventDefault()
    if (!draggedItem) return
    
    setDragOverItem({ categoryId, pointIndex })
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (e, targetCategoryId, targetPointIndex) => {
    e.preventDefault()
    if (!draggedItem) return

    const fromCategoryId = draggedItem.categoryId
    const fromIndex = draggedItem.pointIndex
    const toIndex = targetPointIndex

    // Si es la misma categoría y el mismo índice, no hacer nada
    if (fromCategoryId === targetCategoryId && fromIndex === toIndex) return

    setOrderedCategories(prev => {
      const newCategories = [...prev]
      
      // Encontrar las categorías
      const fromCategoryIdx = newCategories.findIndex(c => c.id === fromCategoryId)
      const toCategoryIdx = newCategories.findIndex(c => c.id === targetCategoryId)
      
      if (fromCategoryIdx === -1 || toCategoryIdx === -1) return prev

      // Obtener el punto que se está moviendo
      const movedPoint = newCategories[fromCategoryIdx].points[fromIndex]
      
      // Remover el punto de la categoría origen
      newCategories[fromCategoryIdx] = {
        ...newCategories[fromCategoryIdx],
        points: newCategories[fromCategoryIdx].points.filter((_, idx) => idx !== fromIndex)
      }
      
      // Agregar el punto a la categoría destino
      const targetPoints = [...newCategories[toCategoryIdx].points]
      targetPoints.splice(toIndex, 0, movedPoint)
      newCategories[toCategoryIdx] = {
        ...newCategories[toCategoryIdx],
        points: targetPoints
      }

      return newCategories
    })

    setHasChanges(true)
    setDraggedItem(null)
    setDragOverItem(null)
  }

  // Guardar orden
  const handleSave = () => {
    const orderData = {}
    orderedCategories.forEach(category => {
      orderData[category.id] = category.points.map(p => p.id)
    })
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orderData))
    setHasChanges(false)
    
    if (onOrderSaved) {
      // Enviar solo las categorías habilitadas (sin la categoría de deshabilitados)
      const enabledCategories = orderedCategories.filter(cat => cat.id !== DISABLED_CATEGORY_ID)
      onOrderSaved(enabledCategories)
    }
    
    onClose()
  }

  // Resetear al orden original (del JSON)
  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY)
    // Resetear con categoría de deshabilitados vacía
    const disabledCategory = { ...DISABLED_CATEGORY, points: [] }
    setOrderedCategories([...categories, disabledCategory])
    setHasChanges(true)
  }

  // Contar puntos por categoría
  const getPointsCount = (category) => {
    return category.points.filter(p => !p.noRead).length
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <div className="flex flex-col h-full max-h-[85vh]">
        {/* Header */}
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ListOrdered className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Ordenar Puntos de Lectura</DialogTitle>
              <DialogDescription>
                Arrastra y suelta los puntos para definir el orden de captura
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {orderedCategories.map((category) => (
            <div 
              key={category.id} 
              className={`border rounded-lg overflow-hidden ${
                category.id === DISABLED_CATEGORY_ID 
                  ? 'border-red-300 bg-red-50/30' 
                  : 'border-gray-200'
              }`}
            >
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.id)}
                className={`w-full flex items-center justify-between p-3 transition-colors ${
                  category.id === DISABLED_CATEGORY_ID
                    ? 'bg-red-100/50 hover:bg-red-100'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  {expandedCategories[category.id] ? (
                    <ChevronDown className={`h-4 w-4 ${category.id === DISABLED_CATEGORY_ID ? 'text-red-600' : 'text-gray-500'}`} />
                  ) : (
                    <ChevronRight className={`h-4 w-4 ${category.id === DISABLED_CATEGORY_ID ? 'text-red-600' : 'text-gray-500'}`} />
                  )}
                  {category.id === DISABLED_CATEGORY_ID && (
                    <EyeOff className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`font-semibold ${category.id === DISABLED_CATEGORY_ID ? 'text-red-800' : 'text-gray-800'}`}>
                    {category.name}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    category.id === DISABLED_CATEGORY_ID
                      ? 'bg-red-200 text-red-800'
                      : 'bg-primary/10 text-primary'
                  }`}>
                    {getPointsCount(category)} puntos
                  </span>
                </div>
              </button>

              {/* Points List */}
              {expandedCategories[category.id] && (
                <div className="divide-y divide-gray-100">
                  {category.points.filter(p => !p.noRead).map((point, index) => {
                    const isDragging = draggedItem?.categoryId === category.id && 
                                       draggedItem?.pointIndex === index
                    const isDragOver = dragOverItem?.categoryId === category.id && 
                                       dragOverItem?.pointIndex === index

                    return (
                      <div
                        key={point.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, category.id, index)}
                        onDragEnter={(e) => handleDragEnter(e, category.id, index)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, category.id, index)}
                        className={`
                          flex items-center gap-3 p-3 bg-white cursor-grab active:cursor-grabbing
                          transition-all duration-150
                          ${isDragging ? 'opacity-50 bg-blue-50' : ''}
                          ${isDragOver ? 'border-t-2 border-primary bg-blue-50/50' : ''}
                          hover:bg-gray-50
                        `}
                      >
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <GripVertical className="h-4 w-4 text-gray-400" />
                          <span className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-sm font-medium text-gray-600">
                            {index + 1}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {point.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {point.id}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleReset}
            className="text-gray-600"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Restaurar Original
          </Button>

          <div className="flex items-center gap-3">
            {hasChanges && (
              <span className="text-sm text-amber-600 font-medium">
                ● Cambios sin guardar
              </span>
            )}
            <Button
              variant="outline"
              onClick={onClose}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges}
            >
              <Check className="h-4 w-4 mr-2" />
              Confirmar Orden
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  )
}
