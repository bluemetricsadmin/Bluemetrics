import { useState, useEffect } from 'react'

/**
 * Hook personalizado para persistir estado en localStorage
 * @param {string} key - Clave única para almacenar en localStorage
 * @param {any} initialValue - Valor inicial del estado
 * @returns {[any, Function, Function]} - [valor, setValue, clearValue]
 */
export function usePersistedState(key, initialValue) {
  // Función para obtener el valor inicial desde localStorage o usar el valor por defecto
  const getInitialValue = () => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.warn(`Error al leer ${key} de localStorage:`, error)
      return initialValue
    }
  }

  const [value, setValue] = useState(getInitialValue)

  // Guardar en localStorage cada vez que el valor cambie
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.warn(`Error al guardar ${key} en localStorage:`, error)
    }
  }, [key, value])

  // Función para limpiar el valor del localStorage
  const clearValue = () => {
    try {
      window.localStorage.removeItem(key)
      setValue(initialValue)
    } catch (error) {
      console.warn(`Error al limpiar ${key} de localStorage:`, error)
    }
  }

  return [value, setValue, clearValue]
}

/**
 * Hook para manejar múltiples estados persistidos con un prefijo común
 * @param {string} prefix - Prefijo para las claves de localStorage
 * @returns {Object} - Objeto con funciones para manejar estados persistidos
 */
export function usePersistedStateGroup(prefix) {
  const createPersistedState = (key, initialValue) => {
    return usePersistedState(`${prefix}_${key}`, initialValue)
  }

  const clearAll = () => {
    try {
      const keys = Object.keys(window.localStorage)
      keys.forEach(key => {
        if (key.startsWith(prefix)) {
          window.localStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.warn(`Error al limpiar estados con prefijo ${prefix}:`, error)
    }
  }

  return {
    createPersistedState,
    clearAll
  }
}
