import React from 'react';
import { RefreshCcw } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4 flex flex-row items-center justify-between gap-4 z-40 relative">
      <div className="flex items-center gap-3 md:gap-4">
        <img 
          src="/assets/img/logo/logo-light-full.png" 
          alt="Company Logo" 
          className="h-6 md:h-8 object-contain"
        />
        <div className="hidden sm:block w-px h-8 bg-gray-200"></div>
        <div>
          <h1 className="text-lg md:text-xl font-semibold text-gray-900 leading-tight">SLA Performance</h1>
          <p className="hidden md:block text-xs md:text-sm text-gray-500 mt-0.5">Resolution KPI monitoring and action center</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button 
          className="flex items-center gap-2 p-2 px-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors border border-gray-200 shadow-sm bg-white" 
          title="Refresh data"
          onClick={() => window.location.reload()}
        >
          <RefreshCcw className="w-4 h-4" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>
    </header>
  );
}
