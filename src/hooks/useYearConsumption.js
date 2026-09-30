import { useCallback, useEffect, useMemo, useState } from 'react'
import { yearConsumptionService } from '../services/yearConsumption'
import consumptionPointsData from '../lib/consumption-points.json'

const ITEMS_PER_PAGE = 10
const SEARCH_DEBOUNCE_MS = 300
const NUMERIC_SEARCH = /^\d+$/

const POINT_NAMES = new Map(
  (consumptionPointsData.categories || [])
    .flatMap(cat => cat.points || [])
    .map(point => [point.id, point.name])
)

const prettifySlug = (slug) =>
  String(slug || '')
    .split(/[_\s]+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

/**
 * Determina la página que contiene el término de búsqueda.
 * - Búsqueda por No. (numérica): página donde cae esa posición.
 * - Búsqueda por Medidor (texto) o sin filtro: primera página.
 */
const getPageForSearch = (term) => {
  const trimmed = String(term || '').trim()
  return NUMERIC_SEARCH.test(trimmed)
    ? Math.max(1, Math.ceil(Number(trimmed) / ITEMS_PER_PAGE))
    : 1
}

const normalizeRow = (row) => ({
  medidor: row.medidor,
  medidorNombre: POINT_NAMES.get(row.medidor) || prettifySlug(row.medidor),
  consumo2023: Number(row.consumo_2023) || 0,
  consumo2024: Number(row.consumo_2024) || 0,
  consumo2025: Number(row.consumo_2025) || 0,
  consumo2026: Number(row.consumo_2026) || 0,
})

/**
 * Maneja el estado de filtrado, ordenamiento y paginación
 * de la tabla de consumos anualizados por medidor.
 */
export function useYearConsumption() {
  const [data, setData] = useState([])
  const [totalRecords, setTotalRecords] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: 'consumo_2026', direction: 'desc' })
  const [currentPage, setCurrentPage] = useState(1)

  /**
   * Asigna la numeración de orden (posición) a cada fila según el
   * ordenamiento enviado a la base de datos. La numeración es continua
   * entre páginas: página 1 => 1-10, página 2 => 11-20, etc.
   */
  const assignRowNumbers = useCallback(
    (rows, offset = 0) =>
      rows.map((row, index) => ({ ...row, rowNumber: offset + index + 1 })),
    []
  )

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const trimmedSearch = searchTerm.trim()
      const numericSearch = NUMERIC_SEARCH.test(trimmedSearch) ? Number(trimmedSearch) : null
      const offset = (currentPage - 1) * ITEMS_PER_PAGE

      const { data: result, error: rpcError } =
        await yearConsumptionService.getAnnualizedConsumption({
          search: numericSearch === null ? searchTerm : '',
          sortBy: sortConfig.key,
          sortDir: sortConfig.direction,
          limit: ITEMS_PER_PAGE,
          offset,
        })

      if (rpcError) throw new Error(rpcError.message)

      let rows = assignRowNumbers((result || []).map(normalizeRow), offset)

      if (numericSearch !== null) {
        rows = rows.filter(row => String(row.rowNumber).includes(String(numericSearch)))
      }

      setData(rows)
      setTotalRecords(result?.length ? Number(result[0].total_registros) : 0)
    } catch (err) {
      console.error('❌ Error al obtener consumos anualizados:', err)
      setError(err.message)
      setData([])
      setTotalRecords(0)
    } finally {
      setLoading(false)
    }
  }, [searchTerm, sortConfig, currentPage, assignRowNumbers])

  useEffect(() => {
    const delayDebounceFn = setTimeout(fetchData, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(delayDebounceFn)
  }, [fetchData])

  /**
   * Notificador de estado: mantiene la página alineada con el filtro
   * activo. Si se ordena por No. vuelve a su página; si es por Medidor
   * o no hay filtro, regresa a la primera página.
   */
  const notifyFilterState = useCallback(
    (term) => setCurrentPage(getPageForSearch(term)),
    []
  )

  const handleSort = useCallback((key) => {
    setSortConfig(prev => ({ ...prev, key }))
    notifyFilterState(searchTerm)
  }, [notifyFilterState, searchTerm])

  const toggleSortDirection = useCallback(() => {
    setSortConfig(prev => ({
      ...prev,
      direction: prev.direction === 'desc' ? 'asc' : 'desc',
    }))
    notifyFilterState(searchTerm)
  }, [notifyFilterState, searchTerm])

  const handleSearch = useCallback((value) => {
    setSearchTerm(value)
    notifyFilterState(value)
  }, [notifyFilterState])

  const filterMode = useMemo(() => {
    const trimmed = searchTerm.trim()
    if (!trimmed) return null
    return NUMERIC_SEARCH.test(trimmed) ? 'numero' : 'medidor'
  }, [searchTerm])

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalRecords / ITEMS_PER_PAGE)),
    [totalRecords]
  )

  return {
    data,
    totalRecords,
    loading,
    error,
    searchTerm,
    setSearchTerm: handleSearch,
    filterMode,
    sortConfig,
    handleSort,
    toggleSortDirection,
    currentPage,
    setCurrentPage,
    totalPages,
    itemsPerPage: ITEMS_PER_PAGE,
    refetch: fetchData,
  }
}
