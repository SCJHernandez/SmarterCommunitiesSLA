import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Filter, X, ChevronDown, Search } from 'lucide-react';

export interface FilterState {
  dateRange: string;
  status: string;
  priority: string;
  slaKpi: string;
  owner: string;
}

export const DEFAULT_FILTERS: FilterState = {
  dateRange: 'Last 30 Days',
  status: 'All Statuses',
  priority: 'All Priorities',
  slaKpi: 'All SLA Items',
  owner: 'All Owners',
};

interface FilterBarProps {
  filters: FilterState;
  onApply: (filters: FilterState) => void;
  onClear: () => void;
  totalRecords: number;
  availableKpis?: string[];
  availableOwners?: string[];
  availablePriorities?: string[];
}

// Searchable dropdown component
function SearchableSelect({ 
  value, 
  onChange, 
  options, 
  placeholder,
  allLabel 
}: { 
  value: string; 
  onChange: (val: string) => void; 
  options: string[]; 
  placeholder: string;
  allLabel: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = useMemo(() => {
    if (!search) return options;
    return options.filter(o => o.toLowerCase().includes(search.toLowerCase()));
  }, [options, search]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="block w-full rounded-md border-0 py-2 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 bg-white text-left cursor-pointer"
      >
        <span className={value === allLabel ? 'text-gray-500' : ''}>{value}</span>
        <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
      </button>
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2 top-2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                autoFocus
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-44">
            <button
              onClick={() => { onChange(allLabel); setIsOpen(false); setSearch(''); }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 ${value === allLabel ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700'}`}
            >
              {allLabel}
            </button>
            {filtered.map(opt => (
              <button
                key={opt}
                onClick={() => { onChange(opt); setIsOpen(false); setSearch(''); }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 ${value === opt ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700'}`}
              >
                {opt}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-4 text-sm text-gray-400 text-center">No matches</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function FilterBar({ filters, onApply, onClear, totalRecords, availableKpis = [], availableOwners = [], availablePriorities = [] }: FilterBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState<FilterState>(filters);

  // Sync draft when external filters change (e.g. clearing)
  useEffect(() => {
    setDraft(filters);
  }, [filters]);

  const handleApply = () => {
    onApply(draft);
    setIsOpen(false);
  };

  const handleClear = () => {
    setDraft(DEFAULT_FILTERS);
    onClear();
    setIsOpen(false);
  };

  const removeFilter = (key: keyof FilterState, defaultValue: string) => {
    const updated = { ...filters, [key]: defaultValue };
    onApply(updated);
  };

  // Generate active chips
  const activeChips: { key: keyof FilterState; label: string; defaultValue: string }[] = [];
  if (filters.dateRange !== 'Last 30 Days') activeChips.push({ key: 'dateRange', label: filters.dateRange, defaultValue: 'Last 30 Days' });
  if (filters.status !== 'All Statuses') activeChips.push({ key: 'status', label: filters.status, defaultValue: 'All Statuses' });
  if (filters.priority !== 'All Priorities') activeChips.push({ key: 'priority', label: filters.priority, defaultValue: 'All Priorities' });
  if (filters.slaKpi !== 'All SLA KPIs') activeChips.push({ key: 'slaKpi', label: filters.slaKpi, defaultValue: 'All SLA KPIs' });
  if (filters.owner !== 'All Owners') activeChips.push({ key: 'owner', label: filters.owner, defaultValue: 'All Owners' });

  const filterSelectClass = "block w-full rounded-md border-0 py-2 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 bg-white appearance-none cursor-pointer";
  
  const FilterControls = () => (
    <>
      <div className="flex-1 min-w-[140px]">
        <label className="block text-xs font-medium text-gray-700 mb-1">Date Range</label>
        <div className="relative">
          <select value={draft.dateRange} onChange={e => setDraft({...draft, dateRange: e.target.value})} className={filterSelectClass}>
            <option>Today</option>
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>Last 90 Days</option>
          </select>
          <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      <div className="flex-1 min-w-[140px]">
        <label className="block text-xs font-medium text-gray-700 mb-1">SLA Status</label>
        <div className="relative">
          <select value={draft.status} onChange={e => setDraft({...draft, status: e.target.value})} className={filterSelectClass}>
            <option>All Statuses</option>
            <option>In Progress</option>
            <option>Succeeded</option>
            <option>Noncompliant</option>
            <option>Active Breaches</option>
            <option>Nearing Noncompliance</option>
            <option>Paused</option>
            <option>Canceled</option>
            {draft.status === 'Evaluated (Succeeded & Breached)' && <option>Evaluated (Succeeded & Breached)</option>}
          </select>
          <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      <div className="flex-1 min-w-[140px]">
        <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
        <div className="relative">
          <select value={draft.priority} onChange={e => setDraft({...draft, priority: e.target.value})} className={filterSelectClass}>
            <option>All Priorities</option>
            {availablePriorities.length > 0
              ? availablePriorities.map(p => <option key={p}>{p}</option>)
              : <>
                  <option>High</option>
                  <option>Normal</option>
                  <option>Low</option>
                </>
            }
          </select>
          <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      <div className="flex-1 min-w-[160px]">
        <label className="block text-xs font-medium text-gray-700 mb-1">SLA Item</label>
        <div className="relative">
          <select value={draft.slaKpi} onChange={e => setDraft({...draft, slaKpi: e.target.value})} className={filterSelectClass}>
            <option>All SLA Items</option>
            {availableKpis.map(k => <option key={k}>{k}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      <div className="flex-1 min-w-[180px]">
        <label className="block text-xs font-medium text-gray-700 mb-1">Owner</label>
        <SearchableSelect
          value={draft.owner}
          onChange={(val) => setDraft({...draft, owner: val})}
          options={availableOwners}
          placeholder="Search owners..."
          allLabel="All Owners"
        />
      </div>
    </>
  );

  return (
    <div className="w-full bg-white border-b border-gray-200 shadow-sm z-30">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 py-4">
        
        {/* Mobile Header / Desktop Info */}
        <div className="flex items-center justify-between mb-4 lg:mb-0">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="font-medium text-gray-900">Filters</span>
            <span className="ml-2 text-xs font-medium bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">
              {totalRecords.toLocaleString()} records match
            </span>
          </div>
          
          <button 
            className="lg:hidden flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800 px-3 py-1.5 bg-indigo-50 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onClick={() => setIsOpen(true)}
            aria-label="Open filter options"
          >
            <Filter className="w-4 h-4" />
            Edit Filters
          </button>
        </div>

        {/* Desktop Filter Row */}
        <div className="hidden lg:flex flex-row items-end gap-4 mt-4">
          <FilterControls />
          <div className="flex items-center gap-2 mb-0.5">
            <button 
              onClick={handleApply}
              className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 shadow-sm transition-colors"
            >
              Apply filters
            </button>
            <button 
              onClick={handleClear}
              className="px-4 py-2 bg-white text-gray-700 border border-gray-300 text-sm font-medium rounded-md hover:bg-gray-50 shadow-sm transition-colors"
            >
              Clear filters
            </button>
          </div>
        </div>

        {/* Active Chips */}
        {activeChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-4 lg:mt-5 pt-4 border-t border-gray-100">
            <span className="text-xs text-gray-500 mr-1">Active:</span>
            {activeChips.map(chip => (
              <span key={String(chip.key)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                {chip.label}
                <button 
                  onClick={() => removeFilter(chip.key, chip.defaultValue)}
                  className="ml-1 text-gray-400 hover:text-gray-700 focus:outline-none"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <button 
              onClick={onClear}
              className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline ml-2 font-medium"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="relative ml-auto w-full max-w-sm bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right">
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700 p-1">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
              <FilterControls />
            </div>
            
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex gap-3">
              <button 
                onClick={handleClear}
                className="flex-1 px-4 py-2 bg-white text-gray-700 border border-gray-300 text-sm font-medium rounded-md hover:bg-gray-50 shadow-sm transition-colors"
              >
                Clear filters
              </button>
              <button 
                onClick={handleApply}
                className="flex-1 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 shadow-sm transition-colors"
              >
                Apply filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
