import { formatMX } from '../utils/formatMX'
import { Card, CardContent, CardHeader } from './ui/card'
import { Button } from './ui/button'
import { useYearConsumption } from '../hooks/useYearConsumption'
import {
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowUpDownIcon,
  Loader2Icon,
  SearchIcon,
  Droplet,
  FilterIcon,
} from 'lucide-react'

const COLUMNS = [
  { key: 'numero', label: 'No.', value: row => row.rowNumber, align: 'right' },
  { key: 'medidor', label: 'Medidor', value: row => row.medidorNombre, align: 'left' },
  { key: 'consumo_2023', label: '2023', value: row => row.consumo2023, align: 'right' },
  { key: 'consumo_2024', label: '2024', value: row => row.consumo2024, align: 'right' },
  { key: 'consumo_2025', label: '2025', value: row => row.consumo2025, align: 'right' },
  { key: 'consumo_2026', label: '2026', value: row => row.consumo2026, align: 'right', sortable: true },
]

function SortIcon({ active, direction }) {
  if (!active) return <ArrowUpDownIcon className="h-3.5 w-3.5 text-muted-foreground/60" />
  return direction === 'asc'
    ? <ArrowUpIcon className="h-3.5 w-3.5" />
    : <ArrowDownIcon className="h-3.5 w-3.5" />
}

export default function YearConsumptionTable({
  title = 'Consumo Anualizado por Medidor',
  unit = 'm³',
}) {
  const {
    data,
    totalRecords,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    filterMode,
    sortConfig,
    handleSort,
    toggleSortDirection,
    currentPage,
    setCurrentPage,
    totalPages,
  } = useYearConsumption()

  const isDesc = sortConfig.direction === 'desc'

  return (
    <Card className="mt-8">
      <CardHeader>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Droplet className="h-5 w-5 text-blue-500" />
              {title}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {totalRecords} medidor{totalRecords === 1 ? '' : 'es'} · comparativa anual en {unit}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-72">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar medidor o número..."
                className="w-full border border-muted rounded-lg pl-9 pr-3 py-2 text-sm bg-background hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={toggleSortDirection}
              title={`Ordenar de ${isDesc ? 'menor a mayor' : 'mayor a menor'}`}
              className="whitespace-nowrap"
            >
              {isDesc
                ? <ArrowDownIcon className="h-4 w-4 mr-2" />
                : <ArrowUpIcon className="h-4 w-4 mr-2" />}
              {isDesc ? 'Mayor a menor' : 'Menor a mayor'}
            </Button>
          </div>
        </div>

        {filterMode && (
          <div
            role="status"
            aria-live="polite"
            className="mt-4 flex flex-wrap items-center gap-2 text-xs"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary">
              <FilterIcon className="h-3 w-3" />
              Filtrando por {filterMode === 'numero' ? 'No.' : 'Medidor'}: {searchTerm}
            </span>
            <span className="text-muted-foreground">
              Orden {isDesc ? 'mayor a menor' : 'menor a mayor'}
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Cargando consumos anualizados...</p>
          </div>
        ) : error ? (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <p className="text-lg font-semibold text-destructive mb-2">Error al cargar los datos</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border border-muted">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-muted bg-muted/40">
                    {COLUMNS.map(col => {
                      const active = col.sortable && sortConfig.key === col.key
                      return (
                        <th
                          key={col.key}
                          scope="col"
                          className={`px-4 py-3 font-semibold text-muted-foreground whitespace-nowrap ${
                            col.align === 'right' ? 'text-right' : 'text-left'
                          }`}
                        >
                          {col.sortable ? (
                            <button
                              type="button"
                              onClick={() => handleSort(col.key)}
                              className={`inline-flex items-center gap-1.5 transition-colors hover:text-foreground ${
                                active ? 'text-foreground' : ''
                              }`}
                            >
                              {col.align === 'right' && <SortIcon active={active} direction={sortConfig.direction} />}
                              {col.label}
                              {col.align === 'left' && <SortIcon active={active} direction={sortConfig.direction} />}
                            </button>
                          ) : (
                            col.label
                          )}
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {data.map(row => (
                    <tr
                      key={row.medidor}
                      className="border-b border-muted/60 last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      {COLUMNS.map(col => (
                        <td
                          key={col.key}
                          className={`px-4 py-2.5 whitespace-nowrap ${
                            col.align === 'right' ? 'text-right tabular-nums' : 'text-left text-foreground'
                          } ${col.key === 'medidor' ? 'font-medium' : ''} ${
                            col.key === 'numero' ? 'text-muted-foreground' : ''
                          }`}
                        >
                          {col.key === 'medidor' || col.key === 'numero'
                            ? col.value(row)
                            : formatMX(col.value(row))}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {data.length === 0 && (
                    <tr>
                      <td colSpan={COLUMNS.length} className="px-4 py-16 text-center text-muted-foreground">
                        Sin resultados para esta búsqueda
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage <= 1 || loading}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage >= totalPages || loading}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
