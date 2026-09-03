import React from 'react';
import clsx from 'clsx';

export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={clsx("animate-pulse bg-gray-200 rounded", className)} style={style} />;
}

export function SkeletonKpiCard({ className = '' }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`bg-white rounded-xl p-4 sm:p-6 border border-gray-100 shadow-sm flex flex-col h-full min-h-[140px] shrink-0 ${className}`}>
      <Skeleton className="h-4 w-1/2 mb-4" />
      <Skeleton className="h-8 w-1/3 mb-2" />
      <Skeleton className="h-4 w-2/3 mt-auto" />
    </div>
  );
}

export function SkeletonChart({ title = true }: { title?: boolean }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-full flex flex-col min-h-[300px]">
      {title && <Skeleton className="h-5 w-1/3 mb-6" />}
      <div className="flex-1 w-full rounded-md flex items-end gap-2 justify-between pt-4">
         {[...Array(12)].map((_, i) => (
            <Skeleton key={i} className="w-full flex-1" style={{ height: `${Math.random() * 60 + 20}%` }} />
         ))}
      </div>
    </div>
  );
}

export function SkeletonActionTable() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden h-full flex flex-col min-h-[400px]">
      <div className="p-4 border-b border-gray-100 flex justify-between">
        <Skeleton className="h-5 w-1/4" />
        <Skeleton className="h-5 w-1/4" />
      </div>
      <div className="p-4 space-y-4 flex-1">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
}
