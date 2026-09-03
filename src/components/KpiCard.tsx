import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  description: string;
  trend: number;
  trendLabel?: string;
  inverseTrend?: boolean; // If true, negative trend is good (e.g. fewer breached)
  onClick?: () => void;
  className?: string;
}

export function KpiCard({ title, value, description, trend, trendLabel = 'vs last period', inverseTrend = false, onClick, className = '' }: KpiCardProps) {
  const isPositiveTrend = trend > 0;
  const isNeutralTrend = trend === 0;
  
  // Determine color based on whether a positive trend is "good" or "bad"
  let trendColor = 'text-gray-500';
  if (!isNeutralTrend) {
    if (inverseTrend) {
      trendColor = isPositiveTrend ? 'text-red-600' : 'text-green-600';
    } else {
      trendColor = isPositiveTrend ? 'text-green-600' : 'text-red-600';
    }
  }

  return (
    <div 
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5 flex flex-col shrink-0 ${
        onClick ? 'cursor-pointer hover:border-indigo-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all group' : ''
      } ${className}`}
    >
      <h3 className={`text-sm font-medium text-gray-500 uppercase tracking-wider ${onClick ? 'group-hover:text-indigo-600 transition-colors' : ''}`}>
        {title}
      </h3>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-semibold text-gray-900">{value}</span>
      </div>
      <p className="text-xs text-gray-500 mt-1">{description}</p>
      
      <div className="mt-4 flex items-center text-sm">
        <span className={`flex items-center font-medium ${trendColor}`}>
          {isNeutralTrend ? (
            <Minus className="w-4 h-4 mr-1" />
          ) : isPositiveTrend ? (
            <ArrowUpRight className="w-4 h-4 mr-1" />
          ) : (
            <ArrowDownRight className="w-4 h-4 mr-1" />
          )}
          {Math.abs(trend)}{typeof trend === 'number' && Number.isInteger(trend) && trend < 100 ? '' : '%'}
        </span>
        <span className="text-gray-500 ml-2 text-xs">{trendLabel}</span>
      </div>
    </div>
  );
}
