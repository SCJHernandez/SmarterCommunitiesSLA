import React, { useState, useMemo } from 'react';
import { SlaActionRecord, ActionCategory } from '../models';
import { AlertTriangle, Clock, AlertCircle, ChevronLeft, ChevronRight, ArrowUpDown, CheckCircle, PauseCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { SkeletonActionTable } from './ui/Skeletons';
import { CaughtUpState } from './ui/StateViews';
import { CaseDetailsModal } from './CaseDetailsModal';

interface ActionCenterProps {
  records: SlaActionRecord[];
  isLoading?: boolean;
  onViewAll?: () => void;
}

type SortField = 'urgency' | 'deadline' | 'priority' | 'owner';
type SortDir = 'asc' | 'desc';

export function ActionCenter({ records, isLoading, onViewAll }: ActionCenterProps) {
  const [activeTab, setActiveTab] = useState<ActionCategory>('BREACHED');
  const [sortField, setSortField] = useState<SortField>('urgency');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState<SlaActionRecord | null>(null);
  const pageSize = 5;

  // Auto-switch tab if the current one has no records but others do
  React.useEffect(() => {
    if (records && records.length > 0) {
      const hasCurrentTabRecords = records.some(r => r.category === activeTab);
      if (!hasCurrentTabRecords) {
        if (records.some(r => r.category === 'BREACHED')) setActiveTab('BREACHED');
        else if (records.some(r => r.category === 'AT_RISK')) setActiveTab('AT_RISK');
        else if (records.some(r => r.category === 'DUE_SOON')) setActiveTab('DUE_SOON');
        else if (records.some(r => r.category === 'COMPLETED')) setActiveTab('COMPLETED');
        else if (records.some(r => r.category === 'CANCELED')) setActiveTab('CANCELED');
        else if (records.some(r => r.category === 'PAUSED')) setActiveTab('PAUSED');
      }
    }
  }, [records, activeTab]);

  // Filter by category
  const filteredRecords = useMemo(() => {
    return records.filter(r => r.category === activeTab);
  }, [records, activeTab]);

  // Sort
  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      let valA: any;
      let valB: any;
      
      switch (sortField) {
        case 'urgency':
          valA = a.remainingMinutes;
          valB = b.remainingMinutes;
          break;
        case 'deadline':
          valA = new Date(a.deadline).getTime();
          valB = new Date(b.deadline).getTime();
          break;
        case 'priority':
          const pOrder = { 'High': 1, 'Normal': 2, 'Low': 3 };
          valA = pOrder[a.priority];
          valB = pOrder[b.priority];
          break;
        case 'owner':
          valA = a.owner;
          valB = b.owner;
          break;
      }
      
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredRecords, sortField, sortDir]);

  // Paginate
  const totalPages = Math.ceil(sortedRecords.length / pageSize) || 1;
  const paginatedRecords = sortedRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Handlers
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const handleTabChange = (tab: ActionCategory) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSortField('urgency');
    setSortDir('asc');
  };

  if (isLoading) {
    return <SkeletonActionTable />;
  }

  if (!records || records.length === 0) {
    return <CaughtUpState />;
  }

  // Counts
  const breachedCount = records.filter(r => r.category === 'BREACHED').length;
  const atRiskCount = records.filter(r => r.category === 'AT_RISK').length;
  const dueSoonCount = records.filter(r => r.category === 'DUE_SOON').length;
  const completedCount = records.filter(r => r.category === 'COMPLETED').length;
  const pausedCount = records.filter(r => r.category === 'PAUSED').length;

  const TabButton = ({ label, category, count, colorClass, icon: Icon }: any) => {
    const isActive = activeTab === category;
    return (
      <button 
        onClick={() => handleTabChange(category)}
        className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${isActive ? 'border-gray-900 text-gray-900 bg-gray-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
      >
        <Icon className={`w-4 h-4 ${isActive ? colorClass : 'text-gray-400'}`} />
        <span className="font-semibold text-sm">{label}</span>
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isActive ? 'bg-gray-200 text-gray-800' : 'bg-gray-100 text-gray-500'}`}>
          {count}
        </span>
      </button>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-full overflow-hidden">
      
      {/* Header & Tabs */}
      <div className="border-b border-gray-200">
        <div className="p-5 pb-0 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">SLA Action Center</h3>
          </div>
          <button 
            onClick={onViewAll}
            className="mb-4 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors focus:outline-none focus:underline"
          >
            Review all active cases →
          </button>
        </div>
        
        <div className="flex px-2 overflow-x-auto custom-scrollbar">
          {breachedCount > 0 && <TabButton label="Breached" category="BREACHED" count={breachedCount} colorClass="text-red-500" icon={AlertTriangle} />}
          {atRiskCount > 0 && <TabButton label="At Risk" category="AT_RISK" count={atRiskCount} colorClass="text-amber-500" icon={AlertCircle} />}
          {dueSoonCount > 0 && <TabButton label="Active" category="DUE_SOON" count={dueSoonCount} colorClass="text-blue-500" icon={Clock} />}
          {completedCount > 0 && <TabButton label="Reopened" category="COMPLETED" count={completedCount} colorClass="text-emerald-500" icon={CheckCircle} />}
          {pausedCount > 0 && <TabButton label="Paused" category="PAUSED" count={pausedCount} colorClass="text-orange-500" icon={PauseCircle} />}
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block flex-grow overflow-x-auto min-h-[400px]">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 font-semibold">Record</th>
              <th 
                className="px-4 py-3 font-semibold cursor-pointer hover:bg-gray-100 transition-colors group"
                onClick={() => handleSort('priority')}
              >
                <div className="flex items-center gap-1">Priority <ArrowUpDown className="w-3 h-3 text-gray-400 group-hover:text-gray-600" /></div>
              </th>
              
              {activeTab === 'AT_RISK' && <th className="px-4 py-3 font-semibold">Risk Level</th>}
              
              <th 
                className="px-4 py-3 font-semibold cursor-pointer hover:bg-gray-100 transition-colors group"
                onClick={() => handleSort('owner')}
              >
                <div className="flex items-center gap-1">Owner / Team <ArrowUpDown className="w-3 h-3 text-gray-400 group-hover:text-gray-600" /></div>
              </th>
              
              <th 
                className="px-4 py-3 font-semibold cursor-pointer hover:bg-gray-100 transition-colors group"
                onClick={() => handleSort('deadline')}
              >
                <div className="flex items-center gap-1">
                  {activeTab === 'BREACHED' ? 'Breached' : 'Deadline'} 
                  <ArrowUpDown className="w-3 h-3 text-gray-400 group-hover:text-gray-600" />
                </div>
              </th>
              
              <th 
                className="px-4 py-3 font-semibold cursor-pointer hover:bg-gray-100 transition-colors group"
                onClick={() => handleSort('urgency')}
              >
                <div className="flex items-center gap-1">Urgency <ArrowUpDown className="w-3 h-3 text-gray-400 group-hover:text-gray-600" /></div>
              </th>
              
              <th className="px-4 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedRecords.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                  No records found in this category.
                </td>
              </tr>
            ) : (
              paginatedRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50/50 transition-colors group">
                  {/* Record Info */}
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <span 
                        className="font-semibold text-indigo-600 hover:underline cursor-pointer"
                        onClick={() => setSelectedRecord(record)}
                      >
                        {record.regardingNumber}
                      </span>
                      <span className="text-gray-900 font-medium truncate max-w-[200px] lg:max-w-[250px]" title={record.regardingSubject}>
                        {record.regardingSubject}
                      </span>
                      <span className="text-xs text-gray-500">{record.kpiName}</span>
                    </div>
                  </td>
                  
                  {/* Priority */}
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      record.priority === 'High' ? 'bg-gray-800 text-white' :
                      record.priority === 'Normal' ? 'bg-gray-100 text-gray-800' :
                      'bg-gray-50 text-gray-600 border border-gray-200'
                    }`}>
                      {record.priority}
                    </span>
                  </td>

                  {/* Risk Level (At Risk tab only) */}
                  {activeTab === 'AT_RISK' && (
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 font-medium text-xs ${
                        record.riskLevel === 'Critical' ? 'text-red-600' :
                        record.riskLevel === 'High' ? 'text-amber-600' : 'text-gray-600'
                      }`}>
                        {record.riskLevel === 'Critical' && <AlertTriangle className="w-3 h-3" />}
                        {record.riskLevel}
                      </span>
                    </td>
                  )}
                  
                  {/* Owner & Team */}
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className={`font-medium ${record.owner === 'Unassigned' ? 'text-red-500' : 'text-gray-900'}`}>{record.owner}</span>
                      <span className="text-xs text-gray-500">{record.team}</span>
                    </div>
                  </td>
                  
                  {/* Deadline / Breached Time */}
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-gray-900 font-medium">
                        {format(new Date(activeTab === 'BREACHED' && record.breachedDateTime ? record.breachedDateTime : record.deadline), 'MMM d, h:mm a')}
                      </span>
                    </div>
                  </td>

                  {/* Urgency */}
                  <td className="px-4 py-3">
                    {activeTab === 'BREACHED' ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-red-600 font-bold text-xs uppercase">Overdue</span>
                        <span className="text-red-600 font-semibold">{record.overdueDurationFormatted}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-0.5">
                        <span className={`font-semibold ${record.remainingMinutes < 60 ? 'text-red-500' : 'text-amber-500'}`}>
                          {record.remainingTimeFormatted}
                        </span>
                        <span className="text-xs text-gray-500">remaining</span>
                      </div>
                    )}
                  </td>
                  
                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    {activeTab === 'BREACHED' && record.recommendedAction && (
                      <div className="text-xs font-bold text-red-600 bg-red-50 inline-block px-2 py-1 rounded mb-2 w-full text-center">
                        {record.recommendedAction}
                      </div>
                    )}
                    <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                      {record.availableActions.slice(0, 3).map((action, idx) => (
                        <button 
                          key={idx}
                          onClick={() => {
                            if (action === 'View Case' && record.regardingId) {
                              window.open(`https://smartercommunities.crm6.dynamics.com/main.aspx?appid=4bdd0e5b-3187-4907-b71f-bb4e5e3bf8f0&pagetype=entityrecord&etn=incident&id=${record.regardingId}`, '_blank');
                            }
                          }}
                          className={`text-[11px] font-semibold px-2.5 py-1 rounded transition-colors ${
                            idx === 0 && activeTab === 'BREACHED'
                              ? 'bg-red-600 text-white hover:bg-red-700'
                              : idx === 0 
                                ? 'bg-gray-900 text-white hover:bg-gray-800'
                                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden flex flex-col divide-y divide-gray-100">
        {paginatedRecords.length === 0 ? (
          <div className="px-4 py-12 text-center text-gray-500">
            No records found in this category.
          </div>
        ) : (
          paginatedRecords.map((record) => (
            <div key={record.id} className="p-4 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-0.5">
                  <span 
                    className="font-semibold text-indigo-600 hover:underline cursor-pointer"
                    onClick={() => setSelectedRecord(record)}
                  >
                    {record.regardingNumber}
                  </span>
                  <span className="text-gray-900 font-medium line-clamp-2" title={record.regardingSubject}>
                    {record.regardingSubject}
                  </span>
                  <span className="text-xs text-gray-500">{record.kpiName}</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    record.priority === 'High' ? 'bg-gray-800 text-white' :
                    record.priority === 'Normal' ? 'bg-gray-100 text-gray-800' :
                    'bg-gray-50 text-gray-600 border border-gray-200'
                  }`}>
                    {record.priority}
                  </span>
                  {activeTab === 'AT_RISK' && (
                    <span className={`inline-flex items-center gap-1 font-medium text-xs mt-1 ${
                      record.riskLevel === 'Critical' ? 'text-red-600' :
                      record.riskLevel === 'High' ? 'text-amber-600' : 'text-gray-600'
                    }`}>
                      {record.riskLevel === 'Critical' && <AlertTriangle className="w-3 h-3" />}
                      {record.riskLevel}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm bg-gray-50 rounded-lg p-2">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Owner</span>
                  <span className={`font-medium ${record.owner === 'Unassigned' ? 'text-red-500' : 'text-gray-900'}`}>{record.owner}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">{activeTab === 'BREACHED' ? 'Breached' : 'Deadline'}</span>
                  <span className="text-gray-900 font-medium">
                    {format(new Date(activeTab === 'BREACHED' && record.breachedDateTime ? record.breachedDateTime : record.deadline), 'MMM d, h:mm a')}
                  </span>
                </div>
                <div className="flex flex-col col-span-2 pt-2 border-t border-gray-200 mt-1">
                  <span className="text-xs text-gray-500 mb-1">Urgency</span>
                  {activeTab === 'BREACHED' ? (
                    <div className="flex items-center gap-2">
                      <span className="text-red-600 font-bold text-xs uppercase bg-red-100 px-2 py-0.5 rounded">Overdue</span>
                      <span className="text-red-600 font-semibold">{record.overdueDurationFormatted}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${record.remainingMinutes < 60 ? 'text-red-500' : 'text-amber-500'}`}>
                        {record.remainingTimeFormatted}
                      </span>
                      <span className="text-xs text-gray-500">remaining</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col gap-2 mt-1">
                {activeTab === 'BREACHED' && record.recommendedAction && (
                  <div className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1.5 rounded w-full text-center">
                    {record.recommendedAction}
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  {record.availableActions.slice(0, 3).map((action, idx) => (
                    <button 
                      key={idx}
                      onClick={() => {
                        if (action === 'View Case' && record.regardingId) {
                          window.open(`https://smartercommunities.crm6.dynamics.com/main.aspx?appid=4bdd0e5b-3187-4907-b71f-bb4e5e3bf8f0&pagetype=entityrecord&etn=incident&id=${record.regardingId}`, '_blank');
                        }
                      }}
                      className={`flex-1 text-[12px] font-semibold px-3 py-2 rounded transition-colors ${
                        idx === 0 && activeTab === 'BREACHED'
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : idx === 0 
                            ? 'bg-gray-900 text-white hover:bg-gray-800'
                            : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Footer & Pagination */}
      <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Showing <span className="font-medium text-gray-900">{filteredRecords.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</span> to <span className="font-medium text-gray-900">{Math.min(currentPage * pageSize, filteredRecords.length)}</span> of <span className="font-medium text-gray-900">{filteredRecords.length}</span> records
        </div>
        <div className="flex items-center gap-2">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            className="p-1.5 rounded border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-gray-700 px-2">Page {currentPage} of {totalPages}</span>
          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            className="p-1.5 rounded border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {selectedRecord && (
        <CaseDetailsModal 
          record={selectedRecord} 
          onClose={() => setSelectedRecord(null)} 
        />
      )}
    </div>
  );
}
