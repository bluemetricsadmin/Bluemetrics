import { TrendingUp, TrendingDown } from 'lucide-react';

const MetricCard = ({ title, value, unit, comparison, comparisonLabel, comparisonTooltip, trend, icon: Icon, iconColor = 'text-blue-600' }) => {
  const isPositive = trend === 'up';
  const isNegative = trend === 'down';
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col">
        {/* Título con icono */}
        <div className="flex items-center gap-2 mb-3">
          {Icon && <Icon className={`w-5 h-5 ${iconColor}`} />}
          <p className="text-sm text-gray-600">{title}</p>
        </div>
        
        {/* Valor principal - solo si se proporciona value */}
        {value !== undefined && value !== null && value !== '' && (
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-gray-900">
              {value}
            </span>
            
            <span className="text-lg text-gray-600">{unit}</span>
          </div>
        )}
       
        
        {comparison !== undefined && (
          <div className={`flex items-center gap-2 ${value === undefined || value === null || value === '' ? 'mt-1' : ''}`}>
            <div className={`flex items-center gap-1 ${value === undefined || value === null || value === '' ? 'px-3 py-2' : 'px-2 py-1'} rounded-md ${
              isPositive ? 'bg-green-50' : isNegative ? 'bg-red-50' : 'bg-gray-50'
            }`}>
              {isPositive && <TrendingUp className={`${value === undefined || value === null || value === '' ? 'w-6 h-6' : 'w-4 h-4'} text-green-600`} />}
              {isNegative && <TrendingDown className={`${value === undefined || value === null || value === '' ? 'w-6 h-6' : 'w-4 h-4'} text-red-600`} />}
              <span className={`${value === undefined || value === null || value === '' ? 'text-2xl' : 'text-sm'} font-semibold ${
                isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-600'
              }`}>
                {comparison > 0 ? '+' : ''}{comparison}%
              </span>
            </div>
            <span className={`${value === undefined || value === null || value === '' ? 'text-sm' : 'text-xs'} text-gray-500 ${comparisonTooltip ? 'cursor-help border-b border-dotted border-gray-400' : ''}`} title={comparisonTooltip || ''}>{comparisonLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricCard;
