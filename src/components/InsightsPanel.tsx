import React from 'react';
import { Insight } from '../models';
import { AlertCircle, CheckCircle, Info, AlertTriangle, ArrowRight } from 'lucide-react';
import clsx from 'clsx';

interface InsightsPanelProps {
  insights: Insight[];
  onActionClick?: (insight: Insight) => void;
}

export function InsightsPanel({ insights, onActionClick }: InsightsPanelProps) {
  if (!insights || insights.length === 0) return null;

  return (
    <div className="space-y-3">
      {insights.map((insight, idx) => {
        const isCritical = insight.severity === 'critical';
        const isWarning = insight.severity === 'warning';
        const isPositive = insight.severity === 'positive';
        
        return (
          <div 
            key={idx}
            className={clsx(
              "flex items-start p-4 rounded-xl border text-sm transition-all",
              isCritical ? "bg-red-50/50 border-red-100 text-red-900" :
              isWarning ? "bg-amber-50/50 border-amber-100 text-amber-900" :
              isPositive ? "bg-emerald-50/50 border-emerald-100 text-emerald-900" :
              "bg-blue-50/50 border-blue-100 text-blue-900"
            )}
          >
            <div className="flex-shrink-0 mt-0.5">
              {isCritical && <AlertCircle className="w-5 h-5 text-red-600" />}
              {isWarning && <AlertTriangle className="w-5 h-5 text-amber-500" />}
              {isPositive && <CheckCircle className="w-5 h-5 text-emerald-500" />}
              {!isCritical && !isWarning && !isPositive && <Info className="w-5 h-5 text-blue-500" />}
            </div>
            
            <div className="ml-3 flex-grow">
              <h4 className="font-semibold">{insight.title}</h4>
              <p className={clsx("mt-1", isCritical ? "text-red-700" : isWarning ? "text-amber-700" : isPositive ? "text-emerald-700" : "text-blue-700")}>
                {insight.message}
              </p>
              
              {insight.actionLabel && (
                <button 
                  onClick={() => onActionClick?.(insight)}
                  className={clsx(
                    "mt-2 inline-flex items-center text-xs font-medium hover:underline focus:outline-none",
                    isCritical ? "text-red-700" : isWarning ? "text-amber-700" : isPositive ? "text-emerald-700" : "text-blue-700"
                  )}
                >
                  {insight.actionLabel}
                  <ArrowRight className="w-3 h-3 ml-1" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
