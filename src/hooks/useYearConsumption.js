import { useCallback, useEffect, useMemo, useState } from 'react'
import { yearConsumptionService } from '../services/yearConsumption'
import consumptionPointsData from '../lib/consumption-points.json'

const ITEMS_PER_PAGE = 10
const SEARCH_DEBOUNCE_MS = 300

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

const normalizeRow = (row) => ({
  medidor: row.medidor,
  medidorNombre: POINT_NAMES.get(row.medidor) || prettifySlug(row.medidor),
  consumo2023: Number(row.consumo_2023) || 0,
  consumo2024: Number(row.consumo_2024) || 0,
  consumo2025: Number(row.consumo_2025) || 0,
  consumo2026: Number(row.consumo_2026) || 0,
  consumoTotal: Number(row.consumo_total) || 0,
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
  const [sortConfig, setSortConfig] = useState({ key: 'consumo_total', direction: 'desc' })
  const [currentPage, setCurrentPage] = useState(1)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: result, error: rpcError } =
        await yearConsumptionService.getAnnualizedConsumption({
          search: searchTerm,
          sortBy: sortConfig.key,
          sortDir: sortConfig.direction,
          limit: ITEMS_PER_PAGE,
          offset: (currentPage - 1) * ITEMS_PER_PAGE,
        })

      if (rpcError) throw new Error(rpcError.message)

      setData((result || []).map(normalizeRow))
      setTotalRecords(result?.length ? Number(result[0].total_registros) : 0)
    } catch (err) {
      console.error('❌ Error al obtener consumos anualizados:', err)
      setError(err.message)
      setData([])
      setTotalRecords(0)
    } finally {
      setLoading(false)
    }
  }, [searchTerm, sortConfig, currentPage])

  useEffect(() => {
    const delayDebounceFn = setTimeout(fetchData, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(delayDebounceFn)
  }, [fetchData])

  const handleSort = useCallback((key) => {
    setSortConfig(prev => ({ ...prev, key }))
    setCurrentPage(1)
  }, [])

  const toggleSortDirection = useCallback(() => {
    setSortConfig(prev => ({
      ...prev,
      direction: prev.direction === 'desc' ? 'asc' : 'desc',
    }))
    setCurrentPage(1)
  }, [])

  const handleSearch = useCallback((value) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }, [])

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
