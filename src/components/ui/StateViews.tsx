import React from 'react';
import { AlertCircle, CheckCircle, SearchX, RefreshCcw } from 'lucide-react';

export function ErrorState({ message, onRetry, className }: { message?: string, onRetry: () => void, className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center h-full min-h-[200px] bg-white rounded-xl border border-red-100 shadow-sm ${className || ''}`}>
      <AlertCircle className="w-10 h-10 text-red-500 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-1">Unable to load SLA data.</h3>
      <p className="text-sm text-gray-500 mb-4">{message || "There was a problem connecting to the server. Please check your connection and try again."}</p>
      <button 
        onClick={onRetry}
        className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
      >
        <RefreshCcw className="w-4 h-4 mr-2" />
        Retry
      </button>
    </div>
  );
}

export function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center h-full min-h-[300px] bg-white rounded-xl border border-gray-100 shadow-sm">
      <SearchX className="w-12 h-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-1">No SLA activity found</h3>
      <p className="text-sm text-gray-500 mb-6">There are no records matching your selected filters.</p>
      <button 
        onClick={onClear}
        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
      >
        Clear filters
      </button>
    </div>
  );
}

export function CaughtUpState() {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center h-full min-h-[200px] bg-emerald-50/50 rounded-xl border border-emerald-100 border-dashed shadow-sm">
      <CheckCircle className="w-12 h-12 text-emerald-500 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-1">You're all caught up</h3>
      <p className="text-sm text-gray-500">There are no breached or at-risk cases requiring your attention.</p>
    </div>
  );
}
