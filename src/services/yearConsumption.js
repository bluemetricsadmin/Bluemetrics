import { supabase } from '../supabaseClient'

const RPC_ANNUALIZED_CONSUMPTION = 'fn_obtener_consumos_anualizados_paginados'

export const yearConsumptionService = {
  /**
   * Obtiene el consumo anualizado por medidor de forma paginada.
   * @returns {Promise<{ data: Array, error: Error|null }>}
   */
  async getAnnualizedConsumption({
    search = '',
    sortBy = 'consumo_total',
    sortDir = 'desc',
    limit = 10,
    offset = 0,
  } = {}) {
    const { data, error } = await supabase.rpc(RPC_ANNUALIZED_CONSUMPTION, {
      p_search: search,
      p_sort_by: sortBy,
      p_sort_dir: sortDir,
      p_limit: limit,
      p_offset: offset,
    })

    return { data: data || [], error }
  },
}
