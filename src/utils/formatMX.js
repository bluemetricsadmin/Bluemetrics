/**
 * Formatea un valor numérico al formato mexicano (es-MX).
 * Separador de miles: coma (,) | Separador decimal: punto (.)
 *
 * Uso:
 *   import { formatMX } from '../utils/formatMX';
 *   formatMX(1234567.89)  // "1,234,567.89"
 *   formatMX(null)        // "0.00"
 *   formatMX("abc")       // "0.00"
 */
export const formatMX = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '0.00';
  return Number(value).toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * Formatea un valor numérico al formato mexicano sin decimales fijos.
 * Útil para volumes grandes donde los decimales no son necesarios.
 */
export const formatMXInt = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '0';
  return Number(value).toLocaleString('es-MX', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

/**
 * Formatea un porcentaje al formato mexicano.
 */
export const formatMXPercent = (value, decimals = 1) => {
  if (value === null || value === undefined || isNaN(value)) return '0%';
  return (
    Number(value).toLocaleString('es-MX', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }) + '%'
  );
};
