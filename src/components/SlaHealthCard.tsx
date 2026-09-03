import React from 'react';

interface SlaHealthCardProps {
  healthy: number;
  atRisk: number;
  breached: number;
  onDrillDown?: (status: string) => void;
}

export function SlaHealthCard({ healthy, atRisk, breached, onDrillDown }: SlaHealthCardProps) {
  const total = healthy + atRisk + breached;
  const healthyPct = Math.round((healthy / total) * 100) || 0;
  const atRiskPct = Math.round((atRisk / total) * 100) || 0;
  const breachedPct = Math.round((breached / total) * 100) || 0;

  const segmentProps = (status: string) => {
    return {
      onClick: () => onDrillDown && onDrillDown(status),
      className: `flex flex-col items-center p-1.5 rounded-lg transition-colors ${onDrillDown ? 'cursor-pointer hover:bg-gray-50' : ''}`
    };
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 px-4 flex flex-col min-w-full sm:min-w-[300px]">
      <div className="w-full h-2 rounded-full overflow-hidden flex mb-3">
        <div style={{ width: `${healthyPct}%` }} className="bg-green-500 h-full transition-all duration-500"></div>
        <div style={{ width: `${atRiskPct}%` }} className="bg-amber-400 h-full transition-all duration-500"></div>
        <div style={{ width: `${breachedPct}%` }} className="bg-red-500 h-full transition-all duration-500"></div>
      </div>
      
      <div className="flex justify-between items-center text-center gap-1">
        <div {...segmentProps('In Progress')}>
          <div className="flex items-center justify-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Healthy</span>
          </div>
          <div className="text-sm font-bold text-gray-900">{healthy}</div>
        </div>
        <div className="w-px h-6 bg-gray-200"></div>
        <div {...segmentProps('Nearing Noncompliance')}>
          <div className="flex items-center justify-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-400"></div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">At Risk</span>
          </div>
          <div className="text-sm font-bold text-gray-900">{atRisk}</div>
        </div>
        <div className="w-px h-6 bg-gray-200"></div>
        <div {...segmentProps('Active Breaches')}>
          <div className="flex items-center justify-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Breached</span>
          </div>
          <div className="text-sm font-bold text-gray-900">{breached}</div>
        </div>
      </div>
    </div>
  );
}
